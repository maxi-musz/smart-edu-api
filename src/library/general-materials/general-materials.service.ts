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
import { CreateChapterWithFileDto } from './dto/create-chapter-with-file.dto';
import { LibraryMaterialType, Prisma, MaterialProcessingStatus } from '@prisma/client';
import { TextExtractionService } from '../../school/ai-chat/services/text-extraction.service';
import { DocumentChunkingService } from '../../school/ai-chat/services/document-chunking.service';
import { EmbeddingService } from '../../school/ai-chat/services/embedding.service';
import { PineconeService } from '../../explore/chat/services/pinecone.service';
import { DocumentProcessingService } from '../../explore/chat/services/document-processing.service';
import * as colors from 'colors';

@Injectable()
export class GeneralMaterialsService {
  private readonly logger = new Logger(GeneralMaterialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly uploadProgressService: UploadProgressService,
    private readonly textExtractionService: TextExtractionService,
    private readonly chunkingService: DocumentChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly pineconeService: PineconeService,
    private readonly documentProcessingService: DocumentProcessingService,
  ) {}

  /**
   * Get all available library classes (for dropdown selection)
   */
  async getAllLibraryClasses(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Fetching all library classes`));

    try {
      const libraryClasses = await this.prisma.libraryClass.findMany({
        select: {
          id: true,
          name: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

      this.logger.log(colors.green(`[GENERAL MATERIALS] Retrieved ${libraryClasses.length} library classes`));
      return new ApiResponse(true, 'Library classes retrieved successfully', libraryClasses);
    } catch (error: any) {
      this.logger.error(colors.red(`Error fetching library classes: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve library classes');
    }
  }

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

      const [recentMaterials, allChapters, totalMaterialsCount, aiEnabledCount, statusCounts, libraryClasses] = await Promise.all([
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
            classes: {
              include: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    order: true,
                  },
                },
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
        this.prisma.libraryClass.findMany({
          select: {
            id: true,
            name: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            order: 'asc',
          },
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

      // Format materials to include classes as array
      const formattedMaterials = recentMaterials.map((material: any) => ({
        ...material,
        classes: material.classes?.map((mc: any) => mc.class) || [],
      }));

      const responseData = {
        platform: {
          id: platform.id,
          name: platform.name,
          slug: platform.slug,
          status: platform.status,
          materialsCount: totalMaterialsCount,
        },
        statistics,
        materials: formattedMaterials,
        libraryClasses,
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
              chapterStatus: 'active', // Only count active chapters
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
              chapterStatus: 'active', // Only count active chapters
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

      // Handle class filtering - support both single classId and multiple classIds (many-to-many)
      if (query.classIds && query.classIds.length > 0) {
        // Filter materials that have at least one of the specified classes
        where.classes = {
          some: {
            classId: { in: query.classIds },
          },
        };
      } else if (query.classId) {
        // Filter by single classId
        where.classes = {
          some: {
            classId: query.classId,
          },
        };
      }

      if (query.subjectId) {
        where.subjectId = query.subjectId;
      }

      // Fetch all library classes for the response
      const libraryClasses = await this.prisma.libraryClass.findMany({
        select: {
          id: true,
          name: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

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
            classes: {
              include: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    order: true,
                  },
                },
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

      // Map items to include chapter count and format classes as array
      const itemsWithChapterCount = items.map((item: any) => ({
        ...item,
        chapterCount: item._count?.chapters || 0,
        classes: item.classes?.map((mc: any) => mc.class) || [],
        _count: undefined, // Remove _count from response
      }));

      const responseData = {
        items: itemsWithChapterCount,
        libraryClasses,
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
          classes: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                },
              },
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

      // Format classes as array
      const formattedMaterial = {
        ...material,
        classes: material.classes?.map((mc: any) => mc.class) || [],
      };

      this.logger.log(colors.green(`[GENERAL MATERIALS] Material retrieved successfully: ${material.id}`));
      return new ApiResponse(true, 'General material retrieved successfully', formattedMaterial);
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
          chapterStatus: 'active', // Only return active chapters (soft delete support)
        },
        select: {
          id: true,
          title: true,
          description: true,
          pageStart: true,
          pageEnd: true,
          order: true,
          isAiEnabled: true,
          isProcessed: true, // Keep for backward compatibility, but we'll override with MaterialProcessing status
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

      // Optimized: Get all processing statuses in batch queries instead of N+1
      // Step 1: Get all PDFMaterials for these chapters in one query
      const chapterIds = chapters.map(ch => ch.id);
      const pdfMaterials = await this.prisma.pDFMaterial.findMany({
        where: {
          materialId: { in: chapterIds },
        },
        select: {
          id: true,
          materialId: true, // This links to chapter.id
        },
      });

      // Step 2: Get all MaterialProcessing records for these PDFMaterials in one query
      const pdfMaterialIds = pdfMaterials.map(pm => pm.id);
      const materialProcessings = await this.prisma.materialProcessing.findMany({
        where: {
          material_id: { in: pdfMaterialIds },
        },
        select: {
          material_id: true,
          status: true,
        },
      });

      // Step 3: Create lookup maps for O(1) access
      const pdfMaterialByChapterId = new Map(
        pdfMaterials.map(pm => [pm.materialId, pm.id])
      );
      const processingByPdfMaterialId = new Map(
        materialProcessings.map(mp => [mp.material_id, mp.status])
      );

      // Step 4: Map chapters with processing status
      const chaptersWithStatus = chapters.map((chapter) => {
        const pdfMaterialId = pdfMaterialByChapterId.get(chapter.id);
        const processingStatus = pdfMaterialId 
          ? processingByPdfMaterialId.get(pdfMaterialId) || null
          : null;
        
        const isProcessed = processingStatus === 'COMPLETED';

        return {
          ...chapter,
          isProcessed, // Override with status from MaterialProcessing
          processingStatus, // Include raw status for reference
        };
      });

      // Step 5: Batch update chapters' isProcessed field to keep database in sync
      // This ensures future queries can use the cached isProcessed value without joins
      const updatesNeeded = chaptersWithStatus
        .filter(ch => ch.isProcessed !== chapters.find(c => c.id === ch.id)?.isProcessed)
        .map(ch => ({
          where: { id: ch.id },
          data: { isProcessed: ch.isProcessed },
        }));

      if (updatesNeeded.length > 0) {
        // Batch update all chapters that need syncing
        await Promise.all(
          updatesNeeded.map(update => 
            this.prisma.libraryGeneralMaterialChapter.update(update)
          )
        );
        this.logger.log(colors.blue(`🔄 Synced isProcessed status for ${updatesNeeded.length} chapters`));
      }

      this.logger.log(colors.green(`[GENERAL MATERIALS] Material chapters retrieved successfully: ${materialId}`));
      return new ApiResponse(true, 'Material chapters retrieved successfully', chaptersWithStatus);
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
        select: {
          platformId: true,
          email: true,
          first_name: true,
          last_name: true,
          phone_number: true,
        },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Upload files to S3 first (before database operations)
      let uploadResult: any;
      let thumbResult: any;
      let mainFileS3Key: string | undefined;
      let thumbnailS3Key: string | undefined;
      let uploadSucceeded = false;
      let thumbnailUploadSucceeded = false;

      try {
        const uploadFolder = `library/general-materials/platforms/${libraryUser.platformId}`;
        uploadResult = await this.s3Service.uploadFile(file, uploadFolder);
        mainFileS3Key = uploadResult.key;
        uploadSucceeded = true;
        this.logger.log(colors.green(`✅ Main file uploaded to S3: ${mainFileS3Key}`));
      } catch (s3Error: any) {
        this.logger.error(colors.red(`❌ S3 upload failed: ${s3Error.message}`));
        throw new InternalServerErrorException('Failed to upload file to cloud storage');
      }

      let thumbnailUrl: string | null = null;
      let thumbnailS3KeyValue: string | null = null;

      if (thumbnailFile) {
        try {
          const thumbFolder = `library/general-materials/thumbnails/platforms/${libraryUser.platformId}`;
          thumbResult = await this.s3Service.uploadFile(
            thumbnailFile,
            thumbFolder,
            `${payload.title.replace(/\s+/g, '_')}_thumbnail_${Date.now()}.${thumbnailFile.originalname.split('.').pop()}`,
          );
          thumbnailUrl = thumbResult.url;
          thumbnailS3KeyValue = thumbResult.key;
          thumbnailS3Key = thumbResult.key;
          thumbnailUploadSucceeded = true;
          this.logger.log(colors.green(`✅ Thumbnail uploaded to S3: ${thumbnailS3Key}`));
        } catch (thumbError: any) {
          // If thumbnail upload fails, rollback main file
          this.logger.error(colors.red(`❌ Thumbnail upload failed, rolling back main file: ${thumbError.message}`));
          if (uploadSucceeded && mainFileS3Key) {
            try {
              await this.s3Service.deleteFile(mainFileS3Key);
              this.logger.log(colors.yellow('✅ Rollback: Deleted main file from S3'));
            } catch (deleteError: any) {
              this.logger.error(colors.red(`❌ Failed to delete main file from S3 during rollback: ${deleteError.message}`));
            }
          }
          throw new InternalServerErrorException('Failed to upload thumbnail to cloud storage');
        }
      }

      // Get library platform to find/create corresponding Organisation
      const libraryPlatform = await this.prisma.libraryPlatform.findUnique({
        where: { id: libraryUser.platformId },
        select: { id: true, name: true },
      });

      if (!libraryPlatform) {
        this.logger.error(colors.red('Library platform not found'));
        throw new NotFoundException('Library platform not found');
      }

      // Find or create Organisation with same name as LibraryPlatform
      let organisation = await this.prisma.organisation.findUnique({
        where: { name: libraryPlatform.name },
      });

      if (!organisation) {
        organisation = await this.prisma.organisation.create({
          data: {
            name: libraryPlatform.name,
            email: `${libraryPlatform.name.toLowerCase().replace(/\s+/g, '-')}@library.com`,
          },
        });
        this.logger.log(colors.cyan(`Created Organisation for LibraryPlatform: ${organisation.id}`));
      }

      // Get or create a User record for the library user (PDFMaterial needs uploadedById to be a User, not LibraryResourceUser)
      // Check if the library user email exists in User table
      let pdfMaterialUploadedBy = await this.prisma.user.findUnique({
        where: { email: libraryUser.email },
        select: { id: true },
      });

      // If no User exists, create one from LibraryResourceUser data
      if (!pdfMaterialUploadedBy) {
        // Get or create the Library Chat school (same one used in gateway)
        const librarySchool = await this.prisma.school.upsert({
          where: { school_email: 'library-chat@system.com' },
          update: {},
          create: {
            school_name: 'Library Chat System',
            school_email: 'library-chat@system.com',
            school_phone: '+000-000-0000',
            school_address: 'System Default',
            school_type: 'primary_and_secondary',
            school_ownership: 'private',
            status: 'approved',
          },
        });

        // Create User record from LibraryResourceUser data
        pdfMaterialUploadedBy = await this.prisma.user.create({
          data: {
            email: libraryUser.email,
            password: 'library-user', // Placeholder - won't be used for authentication (library users use LibraryResourceUser table)
            first_name: libraryUser.first_name,
            last_name: libraryUser.last_name,
            phone_number: libraryUser.phone_number || '+000-000-0000',
            school_id: librarySchool.id,
            role: 'super_admin', // Library users have elevated permissions
          },
          select: { id: true },
        });
        
        this.logger.log(colors.cyan(`Created User record for LibraryResourceUser: ${pdfMaterialUploadedBy.id} (email: ${libraryUser.email})`));
      }

      // Validate classIds if provided
      if (payload.classIds && payload.classIds.length > 0) {
        // Validate that all classIds exist
        const existingClasses = await this.prisma.libraryClass.findMany({
          where: {
            id: { in: payload.classIds },
          },
          select: { id: true },
        });

        if (existingClasses.length !== payload.classIds.length) {
          const foundIds = existingClasses.map((c) => c.id);
          const missingIds = payload.classIds.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(`Invalid class IDs: ${missingIds.join(', ')}`);
        }
      }

      // Create material and PDFMaterial in a transaction
      let material: any;
      let pdfMaterial: any;
      let dbSucceeded = false;

      try {
        const result = await this.prisma.$transaction(async (tx) => {
          // Create material
          const createdMaterial = await tx.libraryGeneralMaterial.create({
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
              subjectId: null,
              isAiEnabled: true, // AI chat enabled by default for all materials
              // Create many-to-many relationships with classes
              classes: payload.classIds && payload.classIds.length > 0
                ? {
                    create: payload.classIds.map((classId) => ({
                      classId,
                    })),
                  }
                : undefined,
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
              classes: {
                include: {
                  class: {
                    select: {
                      id: true,
                      name: true,
                      order: true,
                    },
                  },
                },
              },
            },
          });

          // Create corresponding PDFMaterial record
          const createdPdfMaterial = await tx.pDFMaterial.create({
            data: {
              title: payload.title,
              description: payload.description ?? null,
              url: uploadResult.url,
              platformId: organisation.id,
              uploadedById: pdfMaterialUploadedBy.id,
              schoolId: null, // Library materials don't belong to a specific school
              topic_id: null,
              downloads: 0,
              size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : null,
              status: 'published',
              order: 1,
              fileType: file.mimetype || 'application/pdf',
              originalName: file.originalname,
              materialId: createdMaterial.id, // Link to LibraryGeneralMaterial
            },
          });

          return { material: createdMaterial, pdfMaterial: createdPdfMaterial };
        });

        material = result.material;
        pdfMaterial = result.pdfMaterial;
        dbSucceeded = true;
        this.logger.log(colors.green(`✅ Database records created successfully`));
      } catch (dbError: any) {
        // If database transaction fails, rollback S3 uploads
        this.logger.error(colors.red(`❌ Database transaction failed, rolling back S3 uploads: ${dbError.message}`));
        
        // Delete thumbnail from S3
        if (thumbnailUploadSucceeded && thumbnailS3Key) {
          try {
            await this.s3Service.deleteFile(thumbnailS3Key);
            this.logger.log(colors.yellow('✅ Rollback: Deleted thumbnail from S3'));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to delete thumbnail from S3 during rollback: ${deleteError.message}`));
          }
        }

        // Delete main file from S3
        if (uploadSucceeded && mainFileS3Key) {
          try {
            await this.s3Service.deleteFile(mainFileS3Key);
            this.logger.log(colors.yellow('✅ Rollback: Deleted main file from S3'));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to delete main file from S3 during rollback: ${deleteError.message}`));
          }
        }

        throw dbError;
      }

      this.logger.log(colors.green(`[GENERAL MATERIALS] Material created successfully: ${material.id}`));
      this.logger.log(colors.green(`[GENERAL MATERIALS] PDFMaterial created successfully: ${pdfMaterial.id} (linked to LibraryGeneralMaterial: ${material.id})`));
      
      // Format classes as array
      const formattedMaterial = {
        ...material,
        classes: material.classes?.map((mc: any) => mc.class) || [],
        pdfMaterialId: pdfMaterial.id,
      };
      
      return new ApiResponse(true, 'General material created successfully', formattedMaterial);
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

      // Validate classIds if provided
      if (payload.classIds && payload.classIds.length > 0) {
        const existingClasses = await this.prisma.libraryClass.findMany({
          where: {
            id: { in: payload.classIds },
          },
          select: { id: true },
        });

        if (existingClasses.length !== payload.classIds.length) {
          const foundIds = existingClasses.map((c) => c.id);
          const missingIds = payload.classIds.filter((id) => !foundIds.includes(id));
          throw new BadRequestException(`Invalid class IDs: ${missingIds.join(', ')}`);
        }
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
          thumbnailS3Key: thumbnailS3KeyValue,
          price: null,
          currency: null,
          isFree: false,
          isAvailable: true,
          subjectId: null,
          isAiEnabled: true, // AI chat enabled by default for all materials
          // Create many-to-many relationships with classes
          classes: payload.classIds && payload.classIds.length > 0
            ? {
                create: payload.classIds.map((classId) => ({
                  classId,
                })),
              }
            : undefined,
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
          classes: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                },
              },
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
  // async createGeneralMaterialChapter(
  //   user: any,
  //   materialId: string,
  //   payload: CreateGeneralMaterialChapterDto,
  // ): Promise<ApiResponse<any>> {
  //   this.logger.log(colors.cyan(`[GENERAL MATERIALS] Creating chapter for material: ${materialId} by user: ${user.email}`));

  //   try {
  //     const libraryUser = await this.prisma.libraryResourceUser.findUnique({
  //       where: { id: user.sub },
  //       select: { platformId: true, email: true },
  //     });

  //     if (!libraryUser) {
  //       this.logger.error(colors.red('Library user not found'));
  //       throw new NotFoundException('Library user not found');
  //     }

  //     const material = await this.prisma.libraryGeneralMaterial.findFirst({
  //       where: {
  //         id: materialId,
  //         platformId: libraryUser.platformId,
  //       },
  //       select: {
  //         id: true,
  //         title: true,
  //       },
  //     });

  //     if (!material) {
  //       this.logger.error(colors.red(`General material not found or does not belong to your platform: ${materialId}`));
  //       throw new NotFoundException('General material not found or does not belong to your platform');
  //     }

  //     const lastChapter = await this.prisma.libraryGeneralMaterialChapter.findFirst({
  //       where: {
  //         materialId: materialId,
  //         platformId: libraryUser.platformId,
  //       },
  //       orderBy: {
  //         order: 'desc',
  //       },
  //       select: {
  //         order: true,
  //       },
  //     });

  //     const nextOrder = (lastChapter?.order || 0) + 1;

  //     // Verify material has isAiEnabled=true if chapter is being enabled
  //     if (payload.isAiEnabled === true) {
  //       const materialCheck = await this.prisma.libraryGeneralMaterial.findFirst({
  //         where: {
  //           id: materialId,
  //           platformId: libraryUser.platformId,
  //           isAiEnabled: true,
  //         },
  //         select: { id: true },
  //       });

  //       if (!materialCheck) {
  //         this.logger.error(colors.red(`Cannot enable AI for chapter: Material must have isAiEnabled=true first`));
  //         throw new BadRequestException('Cannot enable AI for chapter: The parent material must have AI enabled first');
  //       }
  //     }

  //     const chapter = await this.prisma.libraryGeneralMaterialChapter.create({
  //       data: {
  //         materialId: materialId,
  //         platformId: libraryUser.platformId,
  //         title: payload.title,
  //         description: payload.description ?? null,
  //         pageStart: payload.pageStart ?? null,
  //         pageEnd: payload.pageEnd ?? null,
  //         isAiEnabled: payload.isAiEnabled ?? false,
  //         order: nextOrder,
  //       },
  //     });

  //     this.logger.log(colors.green(`[GENERAL MATERIALS] Chapter created successfully: ${chapter.id}`));
  //     return new ApiResponse(true, 'General material chapter created successfully', chapter);
  //   } catch (error: any) {
  //     if (error instanceof NotFoundException || error instanceof BadRequestException) {
  //       throw error;
  //     }

  //     this.logger.error(colors.red(`Error creating general material chapter: ${error.message}`), error.stack);
  //     throw new InternalServerErrorException('Failed to create general material chapter');
  //   }
  // }

  /**
   * Create a chapter with file upload in one step
   */
  async createChapterWithFile( 
    user: any,
    materialId: string,
    payload: CreateChapterWithFileDto,
    file: Express.Multer.File,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Creating chapter with file for material: ${materialId} by user: ${user.email}`));

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

      // Verify material exists and belongs to the user's platform
      const material = await this.prisma.libraryGeneralMaterial.findFirst({
        where: {
          id: materialId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          isAiEnabled: true, // Select the field value, not filter
        },
      });

      if (!material) {
        this.logger.error(colors.red(`General material not found or does not belong to your platform: ${materialId}`));
        throw new NotFoundException('General material not found or does not belong to your platform');
      }

      // Get next order for chapter (only count active chapters)
      const lastChapter = await this.prisma.libraryGeneralMaterialChapter.findFirst({
        where: {
          materialId: materialId,
          platformId: libraryUser.platformId,
          chapterStatus: 'active', // Only count active chapters for ordering
        },
        orderBy: {
          order: 'desc',
        },
        select: {
          order: true,
        },
      });

      const nextChapterOrder = (lastChapter?.order || 0) + 1;

      // AI chat is always enabled for chapters created with files
      // Verify material has isAiEnabled=true
      if (!material.isAiEnabled) {
        this.logger.error(colors.red('Material does not have AI chat enabled'));
        throw new BadRequestException('Material does not have AI chat enabled. Please enable AI chat for the material first.');
      }

      // AI processing is always enabled for chapter files
      const shouldEnableAiChat = true;

      // Get library platform to find/create corresponding Organisation
      const libraryPlatform = await this.prisma.libraryPlatform.findUnique({
        where: { id: libraryUser.platformId },
        select: { id: true, name: true },
      });

      if (!libraryPlatform) {
        this.logger.error(colors.red('Library platform not found'));
        throw new NotFoundException('Library platform not found');
      }

      // Find or create Organisation
      let organisation = await this.prisma.organisation.findUnique({
        where: { name: libraryPlatform.name },
        select: { id: true },
      });

      if (!organisation) {
        organisation = await this.prisma.organisation.create({
          data: {
            name: libraryPlatform.name,
            email: `${libraryPlatform.name.toLowerCase().replace(/\s+/g, '-')}@library.com`,
          },
        });
        this.logger.log(colors.cyan(`Created Organisation for LibraryPlatform: ${organisation.id}`));
      }

      // Get or create Library System school (for library materials that don't belong to a real school)
      const librarySchool = await this.prisma.school.upsert({
        where: { school_email: 'library-chat@system.com' },
        update: {},
        create: {
          school_name: 'Library Chat System',
          school_email: 'library-chat@system.com',
          school_phone: '+000-000-0000',
          school_address: 'System Default',
          school_type: 'primary_and_secondary',
          school_ownership: 'private',
          status: 'approved',
        },
        select: { id: true },
      });

      // Get or create User record for PDFMaterial
      let pdfMaterialUploadedBy = await this.prisma.user.findUnique({
        where: { email: libraryUser.email },
        select: { id: true, school_id: true },
      });

      if (!pdfMaterialUploadedBy) {
        pdfMaterialUploadedBy = await this.prisma.user.create({
          data: {
            email: libraryUser.email,
            password: 'library-user',
            first_name: libraryUser.email.split('@')[0],
            last_name: 'Library',
            phone_number: '+000-000-0000',
            school_id: librarySchool.id, // Use library system school
            role: 'super_admin',
          },
          select: { id: true, school_id: true },
        });
      }

      // Determine file type
      let fileType: LibraryMaterialType = payload.fileType || LibraryMaterialType.PDF;
      if (!payload.fileType) {
        const ext = file.originalname.split('.').pop()?.toLowerCase();
        if (ext === 'doc' || ext === 'docx') fileType = LibraryMaterialType.DOC;
        else if (ext === 'ppt' || ext === 'pptx') fileType = LibraryMaterialType.PPT;
        else if (ext === 'pdf') fileType = LibraryMaterialType.PDF;
        else if (ext === 'mp4' || ext === 'mov' || ext === 'avi') fileType = LibraryMaterialType.VIDEO;
        else fileType = LibraryMaterialType.NOTE;
      }

      // Upload file to S3 first (before database operations)
      this.logger.log(colors.blue(`🚀 Starting S3 document upload...`));
      let uploadResult: any;
      let s3Key: string | undefined;
      let uploadSucceeded = false;

      try {
        // Use existing general materials path structure
        const uploadFolder = `library/general-materials/chapters/${libraryUser.platformId}/${materialId}`;
        const documentTitle = payload.fileTitle || file.originalname.replace(/\.[^/.]+$/, '');
        const fileName = `${documentTitle.replace(/\s+/g, '_')}_${Date.now()}.${validationResult.fileType}`;
        uploadResult = await this.s3Service.uploadFile(file, uploadFolder, fileName);
        s3Key = uploadResult.key;
        uploadSucceeded = true;
        this.logger.log(colors.green(`✅ File uploaded to S3: ${s3Key}`));
      } catch (s3Error: any) {
        this.logger.error(colors.red(`❌ S3 upload failed: ${s3Error.message}`));
        throw new InternalServerErrorException('Failed to upload file to cloud storage');
      }

      // Calculate document size
      const documentSize = FileValidationHelper.formatFileSize(file.size);
      this.logger.log(colors.blue(`📊 Document size: ${documentSize}`));

      // Create chapter and file in a transaction
      let result: any;
      let dbSucceeded = false;

      try {
        result = await this.prisma.$transaction(async (tx) => {
          // Create chapter
          const chapter = await tx.libraryGeneralMaterialChapter.create({
            data: {
              materialId: materialId,
              platformId: libraryUser.platformId,
              title: payload.title,
              description: payload.description ?? null,
            pageStart: payload.pageStart ?? null,
            pageEnd: payload.pageEnd ?? null,
            isAiEnabled: true, // Always enabled when created with file
            order: nextChapterOrder,
            },
          });

          // Create PDFMaterial for backward compatibility (using PDFMaterial.id for lookup later)
          const pdfMaterial = await tx.pDFMaterial.create({
            data: {
              title: payload.fileTitle || file.originalname,
              description: payload.fileDescription ?? null,
              url: uploadResult.url,
              platformId: organisation.id,
              uploadedById: pdfMaterialUploadedBy.id,
              schoolId: librarySchool.id, // Use library system school (required for processing, but library materials don't belong to real schools)
              topic_id: null,
              downloads: 0,
              size: documentSize,
              status: 'published',
              order: payload.fileOrder || 1,
              fileType: validationResult.fileType,
              originalName: file.originalname,
              materialId: chapter.id, // Link to chapter
            },
          });

          // Create chapter file
          const chapterFile = await tx.libraryGeneralMaterialChapterFile.create({
            data: {
              chapterId: chapter.id,
              platformId: libraryUser.platformId,
              uploadedById: user.sub,
              fileName: file.originalname,
              fileType: fileType,
              url: uploadResult.url,
              s3Key: uploadResult.key,
              sizeBytes: file.size,
              pageCount: null,
              title: payload.fileTitle || null,
              description: payload.fileDescription ?? null,
              order: payload.fileOrder || 1,
            },
          });

          return { chapter, chapterFile, pdfMaterial };
        });

        dbSucceeded = true;
        this.logger.log(colors.green(`✅ Database records created successfully`));
      } catch (dbError: any) {
        // If database transaction fails, rollback S3 upload
        this.logger.error(colors.red(`❌ Database transaction failed, rolling back S3 upload: ${dbError.message}`));
        
        if (uploadSucceeded && s3Key) {
          try {
            await this.s3Service.deleteFile(s3Key);
            this.logger.log(colors.yellow('✅ Rollback: Deleted uploaded file from S3'));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to delete file from S3 during rollback: ${deleteError.message}`));
          }
        }

        throw dbError;
      }

      // Process for AI chat if enabled (must succeed or rollback everything)
      if (shouldEnableAiChat) {
        this.logger.log(colors.blue(`[GENERAL MATERIALS] Setting up AI chat processing for PDFMaterial: ${result.pdfMaterial.id}`));
        
        try {
          // Use library system school for library materials (school_id is required by schema)
          // Library materials don't belong to a real school, so we use the default library school
          const schoolIdForProcessing = librarySchool.id;

          // Create material processing record
          this.logger.log(colors.blue(`⚙️ Creating material processing record...`));
          
          const materialProcessing = await this.prisma.materialProcessing.create({
            data: {
              material_id: result.pdfMaterial.id, // Use PDFMaterial.id for lookup
              school_id: schoolIdForProcessing, // Use library system school (required by schema)
              status: 'PENDING',
              total_chunks: 0,
              processed_chunks: 0,
              failed_chunks: 0,
              embedding_model: 'text-embedding-3-small', // Default embedding model
            },
          });

          this.logger.log(colors.green(`✅ Material processing record created with ID: ${materialProcessing.id}`));

          // Auto-start processing in background using explore chat DocumentProcessingService
          this.logger.log(colors.blue(`🔄 Starting document processing in background...`));
          this.documentProcessingService.processDocument(result.pdfMaterial.id);
          this.logger.log(colors.green(`✅ Document processing started`));

          // Update chapter status (isProcessed will be determined by MaterialProcessing.status)
          await this.prisma.libraryGeneralMaterialChapter.update({
            where: { id: result.chapter.id },
            data: {
              isAiEnabled: true,
              // Don't set isProcessed here - it should come from MaterialProcessing.status
              // The status will be checked dynamically when querying chapters
            },
          });

          this.logger.log(colors.green(`[GENERAL MATERIALS] AI chat processing setup completed for chapter: ${result.chapter.id}`));
        } catch (aiProcessingError: any) {
          // If AI processing setup fails, rollback EVERYTHING (S3 + Database)
          this.logger.error(colors.red(`❌ AI processing setup failed, rolling back all changes: ${aiProcessingError.message}`));
          
          // Delete from S3
          if (uploadSucceeded && s3Key) {
            try {
              await this.s3Service.deleteFile(s3Key);
              this.logger.log(colors.yellow('✅ Rollback: Deleted uploaded file from S3'));
            } catch (deleteError: any) {
              this.logger.error(colors.red(`❌ Failed to delete file from S3 during rollback: ${deleteError.message}`));
            }
          }

          // Delete database records
          try {
            await this.prisma.$transaction(async (tx) => {
              if (result.pdfMaterial?.id) {
                await tx.pDFMaterial.delete({ where: { id: result.pdfMaterial.id } });
              }
              if (result.chapterFile?.id) {
                await tx.libraryGeneralMaterialChapterFile.delete({ where: { id: result.chapterFile.id } });
              }
              if (result.chapter?.id) {
                await tx.libraryGeneralMaterialChapter.delete({ where: { id: result.chapter.id } });
              }
            });
            this.logger.log(colors.yellow('✅ Rollback: Deleted all database records'));
          } catch (deleteDbError: any) {
            this.logger.error(colors.red(`❌ Failed to delete database records during rollback: ${deleteDbError.message}`));
          }

          throw new InternalServerErrorException(`AI processing setup failed: ${aiProcessingError.message}. All changes have been rolled back.`);
        }
      }

      // Fetch complete chapter with file
      const completeChapter = await this.prisma.libraryGeneralMaterialChapter.findUnique({
        where: { id: result.chapter.id },
        include: {
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
      });

      this.logger.log(colors.green(`[GENERAL MATERIALS] Chapter with file created successfully: ${result.chapter.id}`));
      return new ApiResponse(true, 'Chapter with file created successfully', completeChapter);
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error creating chapter with file: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to create chapter with file');
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

      // Verify chapter exists and belongs to the user's platform and material (must be active)
      const chapter = await this.prisma.libraryGeneralMaterialChapter.findFirst({
        where: {
          id: chapterId,
          materialId: materialId,
          platformId: libraryUser.platformId,
          chapterStatus: 'active', // Only allow uploading to active chapters
        },
        select: {
          id: true,
          title: true,
          materialId: true,
          isAiEnabled: true,
          isProcessed: true,
          material: {
            select: {
              id: true,
              title: true,
              isAiEnabled: true,
            },
          },
        },
      });

      if (!chapter) {
        this.logger.error(colors.red(`Chapter not found or does not belong to your platform: ${chapterId}`));
        throw new NotFoundException('Chapter not found or does not belong to your platform');
      }

      // Check if AI chat is enabled (default true) but material doesn't have AI enabled
      const shouldEnableAiChat = payload.enableAiChat !== false; // Default to true unless explicitly set to false
      if (shouldEnableAiChat && !chapter.material.isAiEnabled) {
        this.logger.error(colors.red('AI chat enabled by default but material does not have AI chat enabled'));
        throw new BadRequestException('Material does not have AI chat enabled. Please enable AI chat for the material first.');
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

      // Validate platformId exists BEFORE uploading to S3
      // This ensures we don't upload files that will fail later
      if (!libraryUser.platformId) {
        this.logger.error(colors.red(`❌ Library user ${libraryUser.id} does not have a platformId`));
        throw new BadRequestException('Library user does not have a platform ID');
      }

      // Get library platform to find/create corresponding Organisation
      const libraryPlatform = await this.prisma.libraryPlatform.findUnique({
        where: { id: libraryUser.platformId },
        select: { id: true, name: true },
      });

      if (!libraryPlatform) {
        this.logger.error(colors.red('Library platform not found'));
        throw new NotFoundException('Library platform not found');
      }

      // Find or create Organisation with same name as LibraryPlatform
      // Organisation is linked to LibraryPlatform by name, not by ID
      let organisation = await this.prisma.organisation.findUnique({
        where: { name: libraryPlatform.name },
        select: { id: true },
      });

      if (!organisation) {
        // Create Organisation if it doesn't exist
        organisation = await this.prisma.organisation.create({
          data: {
            name: libraryPlatform.name,
            email: `${libraryPlatform.name.toLowerCase().replace(/\s+/g, '-')}@library.com`,
          },
        });
        this.logger.log(colors.cyan(`✅ Created Organisation for LibraryPlatform: ${organisation.id} (name: ${libraryPlatform.name})`));
      } else {
        this.logger.log(colors.cyan(`✅ Found existing Organisation: ${organisation.id} for LibraryPlatform: ${libraryPlatform.name}`));
      }

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

      // Upload file to S3 first (before database operations)
      const uploadFolder = `library/general-materials/chapters/${libraryUser.platformId}/${materialId}/${chapterId}`;
      let uploadResult: any;
      let s3Key: string | undefined;
      let uploadSucceeded = false;
      
      try {
        uploadResult = await this.s3Service.uploadFile(file, uploadFolder);
        s3Key = uploadResult.key;
        uploadSucceeded = true;
        this.logger.log(colors.green(`✅ File uploaded to S3: ${s3Key}`));
      } catch (s3Error: any) {
        this.logger.error(colors.red(`❌ S3 upload failed: ${s3Error.message}`));
        throw new InternalServerErrorException('Failed to upload file to storage');
      }

      // Wrap all database operations in a transaction
      // If any operation fails, everything will be rolled back automatically
      let chapterFile: any;
      let pdfMaterial: any;
      let dbSucceeded = false;
      
      try {
        const result = await this.prisma.$transaction(async (tx) => {
          // Create chapter file record
          const createdChapterFile = await tx.libraryGeneralMaterialChapterFile.create({
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

          // Create PDFMaterial record
          // Note: chatAnalytics is created separately when chat happens, not during material creation
          const createdPdfMaterial = await tx.pDFMaterial.create({
            data: {
              title: createdChapterFile.title || file.originalname,
              description: createdChapterFile.description,
              url: createdChapterFile.url,
              platformId: organisation.id,
              uploadedById: libraryUser.id,
              schoolId: null,
              topic_id: null,
              downloads: 0,
              size: file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : null,
              status: 'published',
              order: 1,
              fileType: file.mimetype || 'application/pdf',
              originalName: file.originalname,
              materialId: createdChapterFile.id,
            },
          });

          return { chapterFile: createdChapterFile, pdfMaterial: createdPdfMaterial };
        });

        chapterFile = result.chapterFile;
        pdfMaterial = result.pdfMaterial;
        dbSucceeded = true;

        this.logger.log(colors.green(`✅ Database records created successfully: ${chapterFile.id}`));
      } catch (dbError: any) {
        // If database transaction fails, rollback S3 upload
        this.logger.error(colors.red(`❌ Database transaction failed, rolling back S3 upload: ${dbError.message}`));
        
        if (uploadSucceeded && s3Key) {
          try {
            await this.s3Service.deleteFile(s3Key);
            this.logger.log(colors.yellow('✅ Rollback: Deleted uploaded file from S3'));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to delete file from S3 during rollback: ${deleteError.message}`));
          }
        }

        throw dbError;
      }

      // Process for AI chat (happens outside transaction since it involves external services)
      // If this fails, we'll rollback EVERYTHING (S3 + Database)
      if (shouldEnableAiChat) {
        this.logger.log(colors.blue(`[GENERAL MATERIALS] Processing chapter file for AI chat: ${chapterFile.id}`));
        
        try {
          const fileTypeString = this.mapLibraryMaterialTypeToFileType(fileType);
          await this.processChapterFileForAiChatFromBuffer(
            chapterFile,
            chapter,
            file.buffer,
            fileTypeString,
            libraryUser.platformId,
            pdfMaterial.id, // Pass PDFMaterial.id for Pinecone storage
          );

          // Update chapter status (in a separate transaction to avoid long-running transaction)
          await this.prisma.libraryGeneralMaterialChapter.update({
            where: { id: chapterId },
            data: {
              isAiEnabled: true,
              isProcessed: true,
            },
          });

          this.logger.log(colors.green(`[GENERAL MATERIALS] AI chat processing completed for chapter file: ${chapterFile.id}`));
        } catch (aiProcessingError: any) {
          // If AI processing fails, rollback EVERYTHING (S3 + Database)
          this.logger.error(colors.red(`❌ AI processing failed, rolling back all changes: ${aiProcessingError.message}`));
          
          // Delete from S3
          if (uploadSucceeded && s3Key) {
            try {
              await this.s3Service.deleteFile(s3Key);
              this.logger.log(colors.yellow('✅ Rollback: Deleted uploaded file from S3'));
            } catch (deleteError: any) {
              this.logger.error(colors.red(`❌ Failed to delete file from S3 during rollback: ${deleteError.message}`));
            }
          }

          // Delete database records
          try {
            await this.prisma.$transaction(async (tx) => {
              if (pdfMaterial?.id) {
                await tx.pDFMaterial.delete({ where: { id: pdfMaterial.id } });
              }
              if (chapterFile?.id) {
                await tx.libraryGeneralMaterialChapterFile.delete({ where: { id: chapterFile.id } });
              }
            });
            this.logger.log(colors.yellow('✅ Rollback: Deleted all database records'));
          } catch (deleteDbError: any) {
            this.logger.error(colors.red(`❌ Failed to delete database records during rollback: ${deleteDbError.message}`));
          }

          throw new InternalServerErrorException(`AI processing failed: ${aiProcessingError.message}. All changes have been rolled back.`);
        }
      }

      return new ApiResponse(
        true,
        shouldEnableAiChat
          ? 'Chapter file uploaded successfully and AI chat processing completed'
          : 'Chapter file uploaded successfully',
        {
          ...chapterFile,
          aiChatProcessed: shouldEnableAiChat,
        }
      );
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error uploading chapter file: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to upload chapter file');
    }
  }

  /**
   * Process a chapter file for AI chat from buffer (more efficient - no S3 download needed)
   */
  private async processChapterFileForAiChatFromBuffer(
    chapterFile: any,
    chapter: any,
    fileBuffer: Buffer,
    fileType: string,
    platformId: string,
    pdfMaterialId: string, // PDFMaterial.id to use for Pinecone storage (like ai-chat pattern)
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.log(colors.cyan(`🔄 Processing chapter file for AI chat from buffer: ${chapterFile.fileName}`));

    try {
      // Step 1: Ensure processing record exists
      let processing = await this.prisma.libraryGeneralMaterialProcessing.findUnique({
        where: { materialId: chapter.materialId },
      });

      if (!processing) {
        processing = await this.prisma.libraryGeneralMaterialProcessing.create({
          data: {
            materialId: chapter.materialId,
            platformId: platformId,
            status: 'PROCESSING',
            totalChunks: 0,
            processedChunks: 0,
            failedChunks: 0,
            embeddingModel: 'text-embedding-3-small',
            processingStartedAt: new Date(),
          },
        });
        this.logger.log(colors.blue(`📝 Created processing record for material: ${chapter.materialId}`));
      } else {
        await this.prisma.libraryGeneralMaterialProcessing.update({
          where: { id: processing.id },
          data: {
            status: 'PROCESSING',
            processingStartedAt: new Date(),
          },
        });
      }

      // Step 2: Extract text directly from buffer
      this.logger.log(colors.blue(`📄 Extracting text from file buffer...`));
      const extractedText = await this.textExtractionService.extractText(fileBuffer, fileType);

      // Step 3: Chunk the document
      this.logger.log(colors.blue(`✂️ Chunking document into sections...`));
      const chunkingResult = await this.chunkingService.chunkDocument(
        extractedText.text,
        chapter.materialId,
        {
          pageCount: extractedText.pageCount,
          originalName: chapterFile.fileName,
        }
      );

      // Step 4: Generate embeddings
      this.logger.log(colors.blue(`🧠 Generating embeddings for ${chunkingResult.chunks.length} chunks...`));
      const embeddingResult = await this.embeddingService.generateBatchEmbeddings(
        chunkingResult.chunks.map(chunk => chunk.content)
      );

      if (embeddingResult.successCount === 0) {
        throw new Error('No valid embeddings generated - cannot save to Pinecone');
      }

      // Step 5: Save chunks and embeddings to Pinecone and database
      // Use PDFMaterial.id for Pinecone storage (like ai-chat pattern)
      // But use LibraryGeneralMaterial.id for database table (foreign key constraint)
      this.logger.log(colors.blue(`💾 Saving chunks and embeddings with PDFMaterial ID: ${pdfMaterialId} for Pinecone, LibraryGeneralMaterial ID: ${chapter.materialId} for database...`));
      await this.saveLibraryChunksAndEmbeddings(
        pdfMaterialId, // PDFMaterial.id for Pinecone storage
        chapter.materialId, // LibraryGeneralMaterial.id for database foreign key
        chapter.id,
        chunkingResult.chunks,
        embeddingResult.embeddings,
        platformId,
        processing.id,
      );

      // Step 6: Update processing status
      await this.prisma.libraryGeneralMaterialProcessing.update({
        where: { id: processing.id },
        data: {
          status: 'COMPLETED',
          totalChunks: chunkingResult.totalChunks,
          processedChunks: embeddingResult.successCount,
          failedChunks: embeddingResult.failureCount,
          processingCompletedAt: new Date(),
        },
      });

      // Update chapter chunk count
      const chunkCount = await this.prisma.libraryGeneralMaterialChunk.count({
        where: { chapterId: chapter.id },
      });

      await this.prisma.libraryGeneralMaterialChapter.update({
        where: { id: chapter.id },
        data: { chunkCount },
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(colors.green(`🎉 Chapter file processing completed successfully in ${processingTime}ms`));

    } catch (error: any) {
      this.logger.error(colors.red(`❌ Error processing chapter file: ${error.message}`));

      // Update processing status to failed if processing record exists
      if (chapter.materialId) {
        try {
          const processing = await this.prisma.libraryGeneralMaterialProcessing.findUnique({
            where: { materialId: chapter.materialId },
          });

          if (processing) {
            await this.prisma.libraryGeneralMaterialProcessing.update({
              where: { id: processing.id },
              data: {
                status: 'FAILED',
                errorMessage: error.message,
              },
            });
          }
        } catch (updateError: any) {
          this.logger.error(colors.red(`❌ Failed to update processing status: ${updateError.message}`));
        }
      }

      // Re-throw error to fail the entire upload transaction
      throw error;
    }
  }


  /**
   * Download file from S3
   */
  private async downloadFileFromS3(s3Url: string): Promise<Buffer> {
    try {
      const url = new URL(s3Url);
      const s3Key = url.pathname.substring(1); // Remove leading slash

      const presignedUrl = await this.s3Service.generateReadPresignedUrl(s3Key);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(presignedUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SmartEdu-Library/1.0' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }

      const chunks: Uint8Array[] = [];
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));

    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('S3 download timed out after 60 seconds');
      }
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  }

  /**
   * Map LibraryMaterialType to file type string
   */
  private mapLibraryMaterialTypeToFileType(materialType: LibraryMaterialType): string {
    switch (materialType) {
      case LibraryMaterialType.PDF:
        return 'pdf';
      case LibraryMaterialType.DOC:
        return 'doc';
      case LibraryMaterialType.PPT:
        return 'ppt';
      default:
        return 'pdf';
    }
  }

  /**
   * Save chunks and embeddings to Pinecone and database for library materials
   * Uses PDFMaterial.id for Pinecone storage (like ai-chat pattern)
   * Uses LibraryGeneralMaterial.id for database table (foreign key constraint)
   * @param pdfMaterialId - PDFMaterial.id for Pinecone storage
   * @param libraryMaterialId - LibraryGeneralMaterial.id for database foreign key
   */
  private async saveLibraryChunksAndEmbeddings(
    pdfMaterialId: string, // PDFMaterial.id for Pinecone storage
    libraryMaterialId: string, // LibraryGeneralMaterial.id for database foreign key
    chapterId: string,
    chunks: any[],
    embeddings: any[],
    platformId: string,
    processingId: string,
  ): Promise<void> {
    try {
      // Convert chunks to Pinecone format
      // Use PDFMaterial.id for Pinecone storage (like ai-chat pattern)
      const pineconeChunks = chunks.map((chunk, index) =>
        this.pineconeService.convertToPineconeChunk(
          chunk,
          embeddings[index]?.embedding || [],
          pdfMaterialId, // PDFMaterial.id stored in Pinecone
          platformId, // Using platformId as school_id equivalent
        )
      );

      // Save to Pinecone
      await this.pineconeService.upsertChunks(pineconeChunks);

      // Save chunks to database (using UPSERT to handle duplicate IDs)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];
        
        // Format embedding array as PostgreSQL vector string: [0.1, 0.2, 0.3]
        const embeddingArray = embedding?.embedding || [];
        const embeddingString = `[${embeddingArray.join(',')}]`;
        
        // Escape single quotes in content and section title for SQL
        const escapedContent = chunk.content.replace(/\0/g, '').replace(/'/g, "''");
        const escapedSectionTitle = chunk.metadata.sectionTitle?.replace(/\0/g, '').replace(/'/g, "''") || null;
        const sectionTitleValue = escapedSectionTitle ? `'${escapedSectionTitle}'` : 'NULL';

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "LibraryGeneralMaterialChunk" (
            id, "materialId", "chapterId", "processingId", "platformId", content,
            "chunkType", "pageNumber", "sectionTitle", embedding, "embeddingModel",
            "tokenCount", "wordCount", "orderIndex", keywords, summary, "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7::"ChunkType", $8, ${sectionTitleValue}, '${embeddingString}'::vector, $9,
            $10, $11, $12, $13::text[], $14, NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            "materialId" = EXCLUDED."materialId",
            "chapterId" = EXCLUDED."chapterId",
            "processingId" = EXCLUDED."processingId",
            "platformId" = EXCLUDED."platformId",
            content = EXCLUDED.content,
            "chunkType" = EXCLUDED."chunkType",
            "pageNumber" = EXCLUDED."pageNumber",
            "sectionTitle" = EXCLUDED."sectionTitle",
            embedding = EXCLUDED.embedding,
            "embeddingModel" = EXCLUDED."embeddingModel",
            "tokenCount" = EXCLUDED."tokenCount",
            "wordCount" = EXCLUDED."wordCount",
            "orderIndex" = EXCLUDED."orderIndex",
            keywords = EXCLUDED.keywords,
            summary = EXCLUDED.summary,
            "updatedAt" = NOW()
        `,
          chunk.id,
          libraryMaterialId,
          chapterId,
          processingId,
          platformId,
          escapedContent,
          this.mapChunkType(chunk.chunkType),
          chunk.metadata.pageNumber || null,
          embedding?.model || 'text-embedding-3-small',
          chunk.tokenCount,
          Math.ceil(chunk.content.split(' ').length),
          chunk.chunkIndex,
          [],
          null
        );
      }

      this.logger.log(colors.green(`✅ Saved ${chunks.length} chunks to Pinecone and database`));
    } catch (error: any) {
      this.logger.error(colors.red(`❌ Error saving chunks: ${error.message}`));
      throw new Error(`Failed to save chunks: ${error.message}`);
    }
  }

  /**
   * Map chunk type to database enum
   */
  private mapChunkType(chunkType: string): 'TEXT' | 'HEADING' | 'PARAGRAPH' | 'LIST' | 'TABLE' | 'IMAGE_CAPTION' | 'FOOTNOTE' {
    switch (chunkType) {
      case 'text':
        return 'TEXT';
      case 'heading':
        return 'HEADING';
      case 'paragraph':
        return 'PARAGRAPH';
      case 'list':
        return 'LIST';
      case 'table':
        return 'TABLE';
      case 'image_caption':
        return 'IMAGE_CAPTION';
      case 'footnote':
        return 'FOOTNOTE';
      default:
        return 'TEXT';
    }
  }

  /**
   * Get processing status for a material (by PDFMaterial.id)
  //  */
  // async getProcessingStatus(user: any, materialId: string): Promise<ApiResponse<any>> {
  //   this.logger.log(colors.cyan(`[GENERAL MATERIALS] Getting processing status for material: ${materialId}`));

  //   try {
  //     // Verify the material exists and belongs to the user's platform
  //     const pdfMaterial = await this.prisma.pDFMaterial.findUnique({
  //       where: { id: materialId },
  //       select: { id: true, platformId: true },
  //     });

  //     if (!pdfMaterial) {
  //       throw new NotFoundException('Material not found');
  //     }

  //     // Get processing status
  //     const status = await this.documentProcessingService.getProcessingStatus(materialId);

  //     if (!status) {
  //       return new ApiResponse(
  //         false,
  //         'Processing status not found for this material',
  //         { materialId, status: null }
  //       );
  //     }

  //     return new ApiResponse(
  //       true,
  //       'Processing status retrieved successfully',
  //       {
  //         materialId,
  //         status: status.status,
  //         totalChunks: status.total_chunks,
  //         processedChunks: status.processed_chunks,
  //         failedChunks: status.failed_chunks,
  //         errorMessage: status.error_message,
  //         embeddingModel: status.embedding_model,
  //         createdAt: status.createdAt.toISOString(),
  //         updatedAt: status.updatedAt.toISOString(),
  //       }
  //     );
  //   } catch (error: any) {
  //     this.logger.error(colors.red(`❌ Error getting processing status: ${error.message}`));
      
  //     if (error instanceof NotFoundException) {
  //       throw error;
  //     }
      
  //     throw new InternalServerErrorException(`Failed to get processing status: ${error.message}`);
  //   }
  // }

  /**
   * Retry processing for a material (by PDFMaterial.id)
   * This will download the document from S3, reprocess it, and wait for completion
   */
  async retryProcessing(user: any, chapterId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Retrying processing for chapter: ${chapterId}`));

    try {
      // Find PDFMaterial linked to this chapter (PDFMaterial.materialId = chapter.id)
      const pdfMaterial = await this.prisma.pDFMaterial.findFirst({
        where: { materialId: chapterId }, // chapterId is the chapter.id, PDFMaterial.materialId links to it
        select: { id: true, platformId: true, url: true },
      });

      if (!pdfMaterial) {
        throw new NotFoundException('PDFMaterial not found for this chapter. The chapter may not have been processed yet.');
      }

      // Check if file exists on S3
      if (!pdfMaterial.url) {
        throw new BadRequestException('Material does not have a file URL. Cannot retry processing.');
      }

      // Helper function to convert technical errors to user-friendly messages
      const getUserFriendlyError = (errorMessage: string | null | undefined): string => {
        if (!errorMessage) return 'Unknown error occurred';
        
        if (errorMessage.includes('404 Not Found') || errorMessage.includes('Failed to download')) {
          return 'The document file could not be found. The file may have been deleted or moved. Please re-upload the document.';
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          return 'The document processing took too long. The file may be too large. Please try again or contact support.';
        } else if (errorMessage.includes('S3') || errorMessage.includes('cloud storage')) {
          return 'Unable to access the document file. Please check if the file exists and try again.';
        } else if (errorMessage.includes('embedding') || errorMessage.includes('OpenAI')) {
          return 'Failed to generate document embeddings. Please check your API configuration and try again.';
        } else if (errorMessage.includes('Pinecone') || errorMessage.includes('vector')) {
          return 'Failed to save document to the search database. Please try again or contact support.';
        }
        
        return 'Failed to process document. Please try again later.';
      };

      // Retry processing and wait for it to complete (use PDFMaterial.id for processing)
      this.logger.log(colors.blue(`🔄 Starting retry processing and waiting for completion...`));
      const processingResult = await this.documentProcessingService.retryProcessing(pdfMaterial.id);

      // Get final status from database (use PDFMaterial.id)
      const finalStatus = await this.documentProcessingService.getProcessingStatus(pdfMaterial.id);

      if (!finalStatus) {
        // If processing completed but status not found, return the processing result
        const userFriendlyError = processingResult.success 
          ? null 
          : getUserFriendlyError(processingResult.error);
        
        return new ApiResponse(
          processingResult.success,
          processingResult.success 
            ? 'Document processing completed successfully' 
            : userFriendlyError || 'Document processing failed',
          {
            chapterId,
            pdfMaterialId: pdfMaterial.id,
            status: processingResult.success ? 'COMPLETED' : 'FAILED',
            success: processingResult.success,
            processingTime: processingResult.processingTime,
            totalChunks: processingResult.chunkingResult?.totalChunks || 0,
            processedChunks: processingResult.embeddingResult?.successCount || 0,
            failedChunks: processingResult.embeddingResult?.failureCount || 0,
            errorMessage: userFriendlyError || processingResult.error || null,
          }
        );
      }

      // Return complete status from database
      const userFriendlyError = finalStatus.status === 'FAILED' 
        ? getUserFriendlyError(finalStatus.error_message)
        : null;

      return new ApiResponse(
        finalStatus.status === 'COMPLETED',
        finalStatus.status === 'COMPLETED' 
          ? 'Document processing completed successfully' 
          : finalStatus.status === 'FAILED'
          ? userFriendlyError || 'Document processing failed'
          : 'Document processing completed',
        {
          chapterId,
          pdfMaterialId: pdfMaterial.id,
          status: finalStatus.status,
          totalChunks: finalStatus.total_chunks,
          processedChunks: finalStatus.processed_chunks,
          failedChunks: finalStatus.failed_chunks,
          errorMessage: userFriendlyError || finalStatus.error_message || null,
          embeddingModel: finalStatus.embedding_model,
          processingTime: processingResult.processingTime,
          createdAt: finalStatus.createdAt.toISOString(),
          updatedAt: finalStatus.updatedAt.toISOString(),
        }
      );
    } catch (error: any) {
      this.logger.error(colors.red(`❌ Error retrying processing: ${error.message}`));
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // Provide user-friendly error messages for common issues
      let userFriendlyMessage = 'Failed to process document. Please try again later.';
      
      if (error.message?.includes('404 Not Found') || error.message?.includes('Failed to download')) {
        userFriendlyMessage = 'The document file could not be found. The file may have been deleted or moved. Please re-upload the document.';
      } else if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        userFriendlyMessage = 'The document processing took too long. The file may be too large. Please try again or contact support.';
      } else if (error.message?.includes('S3') || error.message?.includes('cloud storage')) {
        userFriendlyMessage = 'Unable to access the document file. Please check if the file exists and try again.';
      } else if (error.message?.includes('embedding') || error.message?.includes('OpenAI')) {
        userFriendlyMessage = 'Failed to generate document embeddings. Please check your API configuration and try again.';
      } else if (error.message?.includes('Pinecone') || error.message?.includes('vector')) {
        userFriendlyMessage = 'Failed to save document to the search database. Please try again or contact support.';
      }
      
      throw new InternalServerErrorException(userFriendlyMessage);
    }
  }

  /**
   * Delete a chapter (soft delete - sets chapterStatus to deleted)
   * Chapter remains in database for chat history purposes
   */
  async deleteChapter(user: any, materialId: string, chapterId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[GENERAL MATERIALS] Soft deleting chapter: ${chapterId} for material: ${materialId}`));

    try {
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true, email: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Verify material exists and belongs to user's platform
      const material = await this.prisma.libraryGeneralMaterial.findFirst({
        where: {
          id: materialId,
          platformId: libraryUser.platformId,
        },
        select: { id: true },
      });

      if (!material) {
        this.logger.error(colors.red(`Material not found or does not belong to your platform: ${materialId}`));
        throw new NotFoundException('Material not found or does not belong to your platform');
      }

      // Verify chapter exists and belongs to the material and platform
      const chapter = await this.prisma.libraryGeneralMaterialChapter.findFirst({
        where: {
          id: chapterId,
          materialId: materialId,
          platformId: libraryUser.platformId,
        },
        select: { id: true, title: true, chapterStatus: true },
      });

      if (!chapter) {
        throw new NotFoundException('Chapter not found or does not belong to this material');
      }

      // Check if already deleted
      if (chapter.chapterStatus === 'deleted') {
        return new ApiResponse(
          true,
          'Chapter is already deleted',
          {
            chapterId,
            materialId,
            status: 'deleted',
            message: 'Chapter was already deleted',
          }
        );
      }

      // Soft delete: Update status to deleted
      const updatedChapter = await this.prisma.libraryGeneralMaterialChapter.update({
        where: { id: chapterId },
        data: { chapterStatus: 'deleted' },
        select: {
          id: true,
          title: true,
          chapterStatus: true,
          updatedAt: true,
        },
      });

      this.logger.log(colors.green(`✅ Chapter soft deleted successfully: ${chapterId}`));

      return new ApiResponse(
        true,
        'Chapter deleted successfully. It has been hidden but remains in the database for chat history.',
        {
          chapterId: updatedChapter.id,
          materialId,
          title: updatedChapter.title,
          status: updatedChapter.chapterStatus,
          deletedAt: updatedChapter.updatedAt.toISOString(),
          message: 'Chapter has been soft deleted. Chat history will remain accessible.',
        }
      );
    } catch (error: any) {
      this.logger.error(colors.red(`❌ Error deleting chapter: ${error.message}`));
      
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Failed to delete chapter: ${error.message}`);
    }
  }
}
