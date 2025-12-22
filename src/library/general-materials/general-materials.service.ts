import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { S3Service } from '../../shared/services/s3.service';
import { FileValidationHelper } from '../../shared/helper-functions/file-validation.helper';
import { UploadProgressService } from '../../school/ai-chat/upload-progress.service';
import { CreateGeneralMaterialDto } from './dto/create-general-material.dto';
import { QueryGeneralMaterialsDto } from './dto/query-general-materials.dto';
import { CreateGeneralMaterialChapterDto } from './dto/create-general-material-chapter.dto';
import { UploadChapterFileDto } from './dto/upload-chapter-file.dto';
import { LibraryMaterialType } from '@prisma/client';
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

      const [recentMaterials, allChapters, totalMaterialsCount, aiEnabledCount, statusCounts] = await Promise.all([
        this.prisma.libraryGeneralMaterial.findMany({
          where: { platformId: libraryUser.platformId },
          select: {
            id: true,
            title: true,
            description: true,
            author: true,
            isAvailable: true,
            isAiEnabled: true,
            status: true,
            views: true,
            downloads: true,
            thumbnailUrl: true,
            thumbnailS3Key: true,
            createdAt: true,
            updatedAt: true,
            uploadedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }),
        this.prisma.libraryGeneralMaterialChapter.findMany({
          where: { platformId: libraryUser.platformId },
          select: { id: true, materialId: true },
        }),
        this.prisma.libraryGeneralMaterial.count({
          where: { platformId: libraryUser.platformId },
        }),
        this.prisma.libraryGeneralMaterial.count({
          where: {
            platformId: libraryUser.platformId,
            isAiEnabled: true,
          },
        }),
        this.prisma.libraryGeneralMaterial.groupBy({
          by: ['status'],
          where: { platformId: libraryUser.platformId },
          _count: true,
        }),
      ]);

      const totalChapters = allChapters.length;

      const statusMap = statusCounts.reduce((acc: any, item: any) => {
        acc[item.status] = item._count;
        return acc;
      }, {});

      const statistics = {
        overview: {
          totalMaterials: totalMaterialsCount,
          aiEnabledMaterials: aiEnabledCount,
          totalChapters,
        },
        byStatus: {
          published: statusMap.published || 0,
          draft: statusMap.draft || 0,
          archived: statusMap.archived || 0,
        },
      };

      const responseData = {
        platform: {
          id: platform.id,
          name: platform.name,
          slug: platform.slug,
          status: platform.status,
          materialsCount: totalMaterialsCount,
        },
        statistics,
        materials: recentMaterials,
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

      // Handle isAiEnabled filter: Material must have isAiEnabled=true AND have at least one chapter with isAiEnabled=true
      if (query.isAiEnabled !== undefined) {
        if (query.isAiEnabled === true) {
          // Find materials that have isAiEnabled=true AND have at least one AI-enabled chapter
          const materialsWithAiChapters = await this.prisma.libraryGeneralMaterialChapter.findMany({
            where: {
              platformId: libraryUser.platformId, 
              isAiEnabled: true,
            },
            select: {
              materialId: true,
            },
            distinct: ['materialId'],
          });

          const materialIds = materialsWithAiChapters.map((ch) => ch.materialId);
          where.id = { in: materialIds };
          where.isAiEnabled = true;
        } else {
          // For false: materials where isAiEnabled=false OR no AI-enabled chapters
          const materialsWithAiChapters = await this.prisma.libraryGeneralMaterialChapter.findMany({
            where: {
              platformId: libraryUser.platformId,
              isAiEnabled: true,
            },
            select: {
              materialId: true,
            },
            distinct: ['materialId'],
          });

          const materialIdsWithAiChapters = materialsWithAiChapters.map((ch) => ch.materialId);
          where.OR = [
            { isAiEnabled: false },
            {
              isAiEnabled: true,
              id: { notIn: materialIdsWithAiChapters },
            },
          ];
        }
      }

      if (query.classId) {
        where.classId = query.classId;
      }

      if (query.subjectId) {
        where.subjectId = query.subjectId;
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
            isAvailable: true,
            isAiEnabled: true,
            status: true,
            views: true,
            downloads: true,
            thumbnailUrl: true,
            thumbnailS3Key: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                chapters: true,
              },
            },
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
            uploadedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
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

      // Map items to include chapter count
      const itemsWithChapterCount = items.map((item: any) => ({
        ...item,
        chapterCount: item._count?.chapters || 0,
        _count: undefined, // Remove _count from response
      }));

      const responseData = {
        items: itemsWithChapterCount,
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
   * Get a single general material by ID
   */
  async getGeneralMaterialById(user: any, materialId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Fetching material by ID: ${materialId} for user: ${user.email}`));

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
          description: true,
          author: true,
          isbn: true,
          publisher: true,
          materialType: true,
          url: true,
          s3Key: true,
          sizeBytes: true,
          pageCount: true,
          thumbnailUrl: true,
          thumbnailS3Key: true,
          isAvailable: true,
          isAiEnabled: true,
          status: true,
          views: true,
          downloads: true,
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
          uploadedBy: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          chapters: {
            select: {
              id: true,
              title: true,
              description: true,
              pageStart: true,
              pageEnd: true,
              order: true,
              isAiEnabled: true,
              isProcessed: true,
              chunkCount: true,
              createdAt: true,
              updatedAt: true,
              files: {
                select: {
                  id: true,
                  fileName: true,
                  fileType: true,
                  url: true,
                  sizeBytes: true,
                  title: true,
                  description: true,
                  order: true,
                  createdAt: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      if (!material) {
        this.logger.error(colors.red(`Material not found or does not belong to your platform: ${materialId}`));
        throw new NotFoundException('Material not found or does not belong to your platform');
      }

      this.logger.log(colors.green(`[GENERAL MATERIALS] Material retrieved successfully: ${material.id}`));
      return new ApiResponse(true, 'General material retrieved successfully', material);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching general material: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve general material');
    }
  }

  /**
   * Get all chapters for a general material
   */
  async getMaterialChapters(user: any, materialId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Fetching chapters for material: ${materialId} by user: ${user.email}`));

    try {
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true, email: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Verify material exists and belongs to the user's platform
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
        this.logger.error(colors.red(`Material not found or does not belong to your platform: ${materialId}`));
        throw new NotFoundException('Material not found or does not belong to your platform');
      }

      const chapters = await this.prisma.libraryGeneralMaterialChapter.findMany({
        where: {
          materialId: materialId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          pageStart: true,
          pageEnd: true,
          order: true,
          isAiEnabled: true,
          isProcessed: true,
          chunkCount: true,
          createdAt: true,
          updatedAt: true,
          files: {
            select: {
              id: true,
              fileName: true,
              fileType: true,
              url: true,
              sizeBytes: true,
              title: true,
              description: true,
              order: true,
              createdAt: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });

      this.logger.log(colors.green(`[GENERAL MATERIALS] Material chapters retrieved successfully: ${materialId}`));
      return new ApiResponse(true, 'Material chapters retrieved successfully', chapters);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching material chapters: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve material chapters');
    }
  }

  /**
   * Create a new general material with full file upload
   */
  async createGeneralMaterial(
    user: any,
    payload: CreateGeneralMaterialDto,
    file: Express.Multer.File | undefined,
    thumbnailFile?: Express.Multer.File,
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

      if (thumbnailFile) {
        const thumbValidation = FileValidationHelper.validateImageFile(thumbnailFile);
        if (!thumbValidation.isValid) {
          this.logger.error(colors.red(`❌ Thumbnail validation failed: ${thumbValidation.error}`));
          throw new BadRequestException(thumbValidation.error);
        }
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

      let thumbnailUrl: string | null = null;
      let thumbnailS3Key: string | null = null;

      if (thumbnailFile) {
        const thumbFolder = `library/general-materials/thumbnails/platforms/${libraryUser.platformId}`;
        const thumbResult = await this.s3Service.uploadFile(
          thumbnailFile,
          thumbFolder,
          `${payload.title.replace(/\s+/g, '_')}_thumbnail_${Date.now()}.${thumbnailFile.originalname.split('.').pop()}`,
        );
        thumbnailUrl = thumbResult.url;
        thumbnailS3Key = thumbResult.key;
      }

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
          thumbnailUrl,
          thumbnailS3Key,
          price: null,
          currency: null,
          isFree: false,
          isAvailable: true,
          classId: null,
          subjectId: null,
          isAiEnabled: false,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
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
    file: Express.Multer.File | undefined,
    thumbnailFile: Express.Multer.File | undefined,
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

    if (thumbnailFile) {
      const thumbValidation = FileValidationHelper.validateImageFile(thumbnailFile);
      if (!thumbValidation.isValid) {
        this.logger.error(colors.red(`❌ Thumbnail validation failed: ${thumbValidation.error}`));
        throw new BadRequestException(thumbValidation.error);
      }
    }

    const totalBytes = file.size + (thumbnailFile?.size || 0);
    const sessionId = this.uploadProgressService.createUploadSession(
      user.sub,
      user.platform_id || 'library-general-materials',
      totalBytes,
    );

    this.uploadGeneralMaterialWithProgress(payload, file, thumbnailFile, user, sessionId).catch((err) => {
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
    thumbnailFile: Express.Multer.File | undefined,
    user: any,
    sessionId: string,
  ) {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Uploading material with progress: "${payload.title}"`));

    let s3Key: string | undefined;
    let thumbnailS3Key: string | undefined;
    let uploadSucceeded = false;
    let thumbnailUploadSucceeded = false;
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

      const totalBytes = file.size + (thumbnailFile?.size || 0);
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

      let thumbnailUrl: string | null = null;
      let thumbnailS3KeyValue: string | null = null;

      if (thumbnailFile) {
        const thumbFolder = `library/general-materials/thumbnails/platforms/${libraryUser.platformId}`;
        const thumbResult = await this.s3Service.uploadFile(
          thumbnailFile,
          thumbFolder,
          `${payload.title.replace(/\s+/g, '_')}_thumbnail_${Date.now()}.${thumbnailFile.originalname.split('.').pop()}`,
          (loaded) => {
            lastKnownLoaded = Math.min(file.size + loaded, totalBytes);
          },
        );
        thumbnailUrl = thumbResult.url;
        thumbnailS3KeyValue = thumbResult.key;
        thumbnailS3Key = thumbResult.key;
        thumbnailUploadSucceeded = true;
      }

      this.uploadProgressService.updateProgress(sessionId, 'processing', lastKnownLoaded);
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
          thumbnailUrl,
          thumbnailS3Key: thumbnailS3KeyValue,
          price: null,
          currency: null,
          isFree: false,
          isAvailable: true,
          classId: null,
          subjectId: null,
          isAiEnabled: false,
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
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

      // Verify material has isAiEnabled=true if chapter is being enabled
      if (payload.isAiEnabled === true) {
        const materialCheck = await this.prisma.libraryGeneralMaterial.findFirst({
          where: {
            id: materialId,
            platformId: libraryUser.platformId,
            isAiEnabled: true,
          },
          select: { id: true },
        });

        if (!materialCheck) {
          this.logger.error(colors.red(`Cannot enable AI for chapter: Material must have isAiEnabled=true first`));
          throw new BadRequestException('Cannot enable AI for chapter: The parent material must have AI enabled first');
        }
      }

      const chapter = await this.prisma.libraryGeneralMaterialChapter.create({
        data: {
          materialId: materialId,
          platformId: libraryUser.platformId,
          title: payload.title,
          description: payload.description ?? null,
          pageStart: payload.pageStart ?? null,
          pageEnd: payload.pageEnd ?? null,
          isAiEnabled: payload.isAiEnabled ?? false,
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

  /**
   * Upload a file for a general material chapter
   */
  async uploadChapterFile(
    user: any,
    materialId: string,
    chapterId: string,
    payload: UploadChapterFileDto,
    file: Express.Multer.File,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Uploading file for chapter: ${chapterId} by user: ${user.email}`));

    try {
      if (!file) {
        throw new BadRequestException('File is required');
      }

      const validationResult = FileValidationHelper.validateMaterialFile(file);
      if (!validationResult.isValid) {
        this.logger.error(colors.red(`❌ File validation failed: ${validationResult.error}`));
        throw new BadRequestException(validationResult.error);
      }

      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { id: true, platformId: true, email: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Verify chapter exists and belongs to the user's platform and material
      const chapter = await this.prisma.libraryGeneralMaterialChapter.findFirst({
        where: {
          id: chapterId,
          materialId: materialId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          material: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      if (!chapter) {
        this.logger.error(colors.red(`Chapter not found or does not belong to your platform: ${chapterId}`));
        throw new NotFoundException('Chapter not found or does not belong to your platform');
      }

      // Get the last file order for this chapter
      const lastFile = await this.prisma.libraryGeneralMaterialChapterFile.findFirst({
        where: {
          chapterId: chapterId,
          platformId: libraryUser.platformId,
        },
        orderBy: {
          order: 'desc',
        },
        select: {
          order: true,
        },
      });

      const nextOrder = payload.order || (lastFile?.order || 0) + 1;

      // Upload file to S3
      const uploadFolder = `library/general-materials/chapters/${libraryUser.platformId}/${materialId}/${chapterId}`;
      const uploadResult = await this.s3Service.uploadFile(file, uploadFolder);

      // Determine file type from extension if not provided
      let fileType: LibraryMaterialType = payload.fileType || LibraryMaterialType.PDF;
      if (!payload.fileType) {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (ext === 'doc' || ext === 'docx') fileType = LibraryMaterialType.DOC;
        else if (ext === 'ppt' || ext === 'pptx') fileType = LibraryMaterialType.PPT;
        else if (ext === 'pdf') fileType = LibraryMaterialType.PDF;
        else if (ext === 'mp4' || ext === 'mov' || ext === 'avi') fileType = LibraryMaterialType.VIDEO;
        else fileType = LibraryMaterialType.NOTE;
      }

      // Create chapter file record within a transaction
      let chapterFile: any;
      try {
        chapterFile = await this.prisma.libraryGeneralMaterialChapterFile.create({
          data: {
            chapterId: chapterId,
            platformId: libraryUser.platformId,
            uploadedById: libraryUser.id,
            fileName: file.originalname,
            fileType: fileType,
            url: uploadResult.url,
            s3Key: uploadResult.key || null,
            sizeBytes: file.size,
            title: payload.title || file.originalname,
            description: payload.description || null,
            order: nextOrder,
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        });

        this.logger.log(colors.green(`[GENERAL MATERIALS] Chapter file uploaded successfully: ${chapterFile.id}`));
        return new ApiResponse(true, 'Chapter file uploaded successfully', chapterFile);
      } catch (dbError: any) {
        // If DB save fails, delete the uploaded file from S3
        this.logger.error(colors.red(`❌ Database save failed, deleting uploaded file: ${dbError.message}`));
        if (uploadResult.key) {
          try {
            await this.s3Service.deleteFile(uploadResult.key);
            this.logger.log(colors.yellow('✅ Rollback: Deleted uploaded file from S3'));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to delete file from S3 during rollback: ${deleteError.message}`));
          }
        }
        throw dbError;
      }
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error uploading chapter file: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to upload chapter file');
    }
  }
}
