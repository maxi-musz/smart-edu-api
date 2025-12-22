import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { S3Service } from '../../shared/services/s3.service';
import { FileValidationHelper } from '../../shared/helper-functions/file-validation.helper';
import { UploadProgressService } from '../../school/ai-chat/upload-progress.service';
import { CreateGeneralMaterialDto } from './dto/create-general-material.dto';
import { QueryGeneralMaterialsDto } from './dto/query-general-materials.dto';
import { CreateGeneralMaterialChapterDto } from './dto/create-general-material-chapter.dto';
import * as colors from 'colors';

@Injectable()
export class GeneralMaterialsService {
  private readonly logger = new Logger(GeneralMaterialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly uploadProgressService: UploadProgressService,
  ) {}

  /**
   * Get general materials dashboard for the user's platform
   */
  async getDashboard(user: any): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Fetching dashboard for library user: ${user.email}`));

    try {
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true, email: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      const platform = await this.prisma.libraryPlatform.findUnique({
        where: { id: libraryUser.platformId },
        select: { id: true, name: true, slug: true, status: true },
      });

      if (!platform) {
        this.logger.error(colors.red('Library platform not found'));
        throw new NotFoundException('Library platform not found');
      }

      const [allMaterials, allChapters, purchases] = await Promise.all([
        this.prisma.libraryGeneralMaterial.findMany({
          where: { platformId: libraryUser.platformId },
          select: {
            id: true,
            title: true,
            description: true,
            author: true,
            price: true,
            currency: true,
            isFree: true,
            isAvailable: true,
            isAiEnabled: true,
            status: true,
            views: true,
            downloads: true,
            salesCount: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.libraryGeneralMaterialChapter.findMany({
          where: { platformId: libraryUser.platformId },
          select: { id: true, materialId: true },
        }),
        this.prisma.libraryGeneralMaterialPurchase.findMany({
          where: { platformId: libraryUser.platformId },
          select: { id: true, materialId: true, price: true, status: true },
        }),
      ]);

      const totalMaterials = allMaterials.length;
      const freeMaterials = allMaterials.filter((m: any) => m.isFree || !m.price).length;
      const paidMaterials = allMaterials.filter((m: any) => !m.isFree && m.price && m.price > 0).length;
      const aiEnabledMaterials = allMaterials.filter((m: any) => m.isAiEnabled).length;

      const totalChapters = allChapters.length;

      const completedPurchases = purchases.filter((p: any) => p.status === 'COMPLETED');
      const totalSales = completedPurchases.length;
      const totalRevenue = completedPurchases.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

      const statistics = {
        overview: {
          totalMaterials,
          freeMaterials,
          paidMaterials,
          aiEnabledMaterials,
          totalChapters,
          totalSales,
          totalRevenue,
        },
        byStatus: {
          published: allMaterials.filter((m: any) => m.status === 'published').length,
          draft: allMaterials.filter((m: any) => m.status === 'draft').length,
          archived: allMaterials.filter((m: any) => m.status === 'archived').length,
        },
      };

      const responseData = {
        platform: {
          id: platform.id,
          name: platform.name,
          slug: platform.slug,
          status: platform.status,
          materialsCount: totalMaterials,
        },
        statistics,
      };

      this.logger.log(colors.green(`[GENERAL MATERIALS] Dashboard fetched for platform: ${platform.name}`));
      return new ApiResponse(true, 'General materials dashboard retrieved successfully', responseData);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(colors.red(`Error fetching general materials dashboard: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve general materials dashboard');
    }
  }

  /**
   * Get all general materials for the "All" page with pagination, filtering, and search
   */
  async getAllGeneralMaterials(user: any, query: QueryGeneralMaterialsDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Fetching materials list for library user: ${user.email}`));

    try {
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true, email: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      const page = query.page && query.page > 0 ? query.page : 1;
      const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
      const skip = (page - 1) * limit;

      const where: any = {
        platformId: libraryUser.platformId,
      };

      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { author: { contains: query.search, mode: 'insensitive' } },
          { publisher: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query.isFree !== undefined) {
        where.isFree = query.isFree;
      }

      if (query.isAiEnabled !== undefined) {
        where.isAiEnabled = query.isAiEnabled;
      }

      if (query.classId) {
        where.classId = query.classId;
      }

      if (query.subjectId) {
        where.subjectId = query.subjectId;
      }

      if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        where.price = {};
        if (query.minPrice !== undefined) where.price.gte = query.minPrice;
        if (query.maxPrice !== undefined) where.price.lte = query.maxPrice;
      }

      const [totalItems, items] = await Promise.all([
        this.prisma.libraryGeneralMaterial.count({ where }),
        this.prisma.libraryGeneralMaterial.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            author: true,
            price: true,
            currency: true,
            isFree: true,
            isAvailable: true,
            isAiEnabled: true,
            status: true,
            views: true,
            downloads: true,
            salesCount: true,
            createdAt: true,
            updatedAt: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip,
          take: limit,
        }),
      ]);

      const totalPages = Math.ceil(totalItems / limit) || 1;

      const responseData = {
        items,
        meta: {
          totalItems,
          totalPages,
          currentPage: page,
          limit,
        },
      };

      return new ApiResponse(true, 'General materials retrieved successfully', responseData);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching general materials: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve general materials');
    }
  }

  /**
   * Create a new general material with full file upload
   */
  async createGeneralMaterial(
    user: any,
    payload: CreateGeneralMaterialDto,
    file: Express.Multer.File,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Creating general material for library user: ${user.email}`));

    try {
      if (!file) {
        throw new BadRequestException('Material file is required');
      }

      const validationResult = FileValidationHelper.validateMaterialFile(file);
      if (!validationResult.isValid) {
        this.logger.error(colors.red(`❌ File validation failed: ${validationResult.error}`));
        throw new BadRequestException(validationResult.error);
      }

      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true, email: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      const uploadFolder = `library/general-materials/platforms/${libraryUser.platformId}`;
      const uploadResult = await this.s3Service.uploadFile(file, uploadFolder);

      const price = payload.isFree ? null : payload.price ?? null;
      const isFree = payload.isFree ?? (!price || price === 0);
      const currency = price ? payload.currency || 'NGN' : null;

      const material = await this.prisma.libraryGeneralMaterial.create({
        data: {
          platformId: libraryUser.platformId,
          uploadedById: user.sub,
          title: payload.title,
          description: payload.description ?? null,
          author: payload.author ?? null,
          isbn: payload.isbn ?? null,
          publisher: payload.publisher ?? null,
          materialType: 'PDF' as any,
          url: uploadResult.url,
          s3Key: uploadResult.key,
          sizeBytes: file.size,
          pageCount: null,
          thumbnailUrl: null,
          thumbnailS3Key: null,
          price,
          currency,
          isFree,
          isAvailable: true,
          classId: payload.classId ?? null,
          subjectId: payload.subjectId ?? null,
          isAiEnabled: payload.isAiEnabled ?? false,
        },
      });

      this.logger.log(colors.green(`[GENERAL MATERIALS] Material created successfully: ${material.id}`));
      return new ApiResponse(true, 'General material created successfully', material);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error creating general material: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to create general material');
    }
  }

  /**
   * Start general material upload session with progress tracking
   */
  async startGeneralMaterialUploadSession(
    payload: CreateGeneralMaterialDto,
    file: Express.Multer.File,
    user: any,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Starting upload session for material: ${payload.title}`));

    if (!file) {
      throw new BadRequestException('Material file is required');
    }

    const validationResult = FileValidationHelper.validateMaterialFile(file);
    if (!validationResult.isValid) {
      this.logger.error(colors.red(`❌ File validation failed: ${validationResult.error}`));
      throw new BadRequestException(validationResult.error);
    }

    const totalBytes = file.size;
    const sessionId = this.uploadProgressService.createUploadSession(
      user.sub,
      user.platform_id || 'library-general-materials',
      totalBytes,
    );

    this.uploadGeneralMaterialWithProgress(payload, file, user, sessionId).catch((err) => {
      this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, err.message);
    });

    return new ApiResponse(true, 'General material upload started successfully', {
      sessionId,
      progressEndpoint: `/api/v1/library/general-materials/upload-progress/${sessionId}`,
    });
  }

  /**
   * Upload general material with progress tracking (background task)
   */
  private async uploadGeneralMaterialWithProgress(
    payload: CreateGeneralMaterialDto,
    file: Express.Multer.File,
    user: any,
    sessionId: string,
  ) {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Uploading material with progress: "${payload.title}"`));

    let s3Key: string | undefined;
    let uploadSucceeded = false;
    let smoother: NodeJS.Timeout | null = null;

    try {
      this.uploadProgressService.updateProgress(sessionId, 'validating', 0);

      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true, email: true },
      });

      if (!libraryUser) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Library user not found');
        throw new NotFoundException('Library user not found');
      }

      const totalBytes = file.size;
      let lastKnownLoaded = 0;
      let emittedLoaded = 0;
      let lastPercent = -1;
      const onePercent = Math.max(1, Math.floor(totalBytes / 100));
      const tickMs = 300;

      this.uploadProgressService.updateProgress(sessionId, 'uploading', 0);
      smoother = setInterval(() => {
        if (emittedLoaded < lastKnownLoaded) {
          const delta = Math.max(onePercent, Math.floor((lastKnownLoaded - emittedLoaded) / 3));
          emittedLoaded = Math.min(emittedLoaded + delta, lastKnownLoaded);
          const percent = Math.floor((emittedLoaded / totalBytes) * 100);
          if (percent > lastPercent) {
            lastPercent = percent;
            this.uploadProgressService.updateProgress(sessionId, 'uploading', emittedLoaded);
          }
        }
      }, tickMs);

      const uploadFolder = `library/general-materials/platforms/${libraryUser.platformId}`;
      const uploadResult = await this.s3Service.uploadFile(
        file,
        uploadFolder,
        undefined,
        (loaded) => {
          lastKnownLoaded = Math.min(loaded, totalBytes);
        },
      );

      s3Key = uploadResult.key;
      uploadSucceeded = true;

      this.uploadProgressService.updateProgress(sessionId, 'processing', lastKnownLoaded);

      const price = payload.isFree ? null : payload.price ?? null;
      const isFree = payload.isFree ?? (!price || price === 0);
      const currency = price ? payload.currency || 'NGN' : null;

      this.uploadProgressService.updateProgress(sessionId, 'saving', lastKnownLoaded);

      const material = await this.prisma.libraryGeneralMaterial.create({
        data: {
          platformId: libraryUser.platformId,
          uploadedById: user.sub,
          title: payload.title,
          description: payload.description ?? null,
          author: payload.author ?? null,
          isbn: payload.isbn ?? null,
          publisher: payload.publisher ?? null,
          materialType: 'PDF' as any,
          url: uploadResult.url,
          s3Key: uploadResult.key,
          sizeBytes: file.size,
          pageCount: null,
          thumbnailUrl: null,
          thumbnailS3Key: null,
          price,
          currency,
          isFree,
          isAvailable: true,
          classId: payload.classId ?? null,
          subjectId: payload.subjectId ?? null,
          isAiEnabled: payload.isAiEnabled ?? false,
        },
      });

      if (smoother) clearInterval(smoother);
      this.uploadProgressService.updateProgress(sessionId, 'completed', totalBytes, undefined, undefined, material.id);

      this.logger.log(colors.green(`[GENERAL MATERIALS] Material uploaded successfully: ${material.id}`));
      return material;
    } catch (error: any) {
      if (smoother) clearInterval(smoother);

      this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, error.message);

      if (uploadSucceeded && s3Key) {
        try {
          await this.s3Service.deleteFile(s3Key);
          this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted general material from storage`));
        } catch (deleteError: any) {
          this.logger.error(colors.red(`❌ Failed to rollback general material file: ${deleteError.message}`));
        }
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error uploading general material with progress: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to upload general material');
    }
  }

  /**
   * Get upload progress (for polling)
   */
  getUploadProgress(sessionId: string): ApiResponse<any> {
    const progress = this.uploadProgressService.getCurrentProgress(sessionId);
    if (!progress) {
      throw new BadRequestException('Upload session not found');
    }
    return new ApiResponse(true, 'Upload progress retrieved', progress);
  }

  /**
   * Create a new chapter under a general material
   */
  async createGeneralMaterialChapter(
    user: any,
    materialId: string,
    payload: CreateGeneralMaterialChapterDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Creating chapter for material: ${materialId} by user: ${user.email}`));

    try {
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true, email: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      const material = await this.prisma.libraryGeneralMaterial.findFirst({
        where: {
          id: materialId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!material) {
        this.logger.error(colors.red(`General material not found or does not belong to your platform: ${materialId}`));
        throw new NotFoundException('General material not found or does not belong to your platform');
      }

      const lastChapter = await this.prisma.libraryGeneralMaterialChapter.findFirst({
        where: {
          materialId: materialId,
          platformId: libraryUser.platformId,
        },
        orderBy: {
          order: 'desc',
        },
        select: {
          order: true,
        },
      });

      const nextOrder = (lastChapter?.order || 0) + 1;

      const chapter = await this.prisma.libraryGeneralMaterialChapter.create({
        data: {
          materialId: materialId,
          platformId: libraryUser.platformId,
          title: payload.title,
          description: payload.description ?? null,
          pageStart: payload.pageStart ?? null,
          pageEnd: payload.pageEnd ?? null,
          order: nextOrder,
        },
      });

      this.logger.log(colors.green(`[GENERAL MATERIALS] Chapter created successfully: ${chapter.id}`));
      return new ApiResponse(true, 'General material chapter created successfully', chapter);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error creating general material chapter: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to create general material chapter');
    }
  }
}
