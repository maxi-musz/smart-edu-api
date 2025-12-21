import { Injectable, Logger, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { StorageService } from '../../shared/services/providers/storage.service';
import * as colors from 'colors';

@Injectable()
export class SubjectService {
  private readonly logger = new Logger(SubjectService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async createSubject(user: any, payload: CreateSubjectDto, thumbnailFile?: Express.Multer.File): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY SUBJECT] Creating subject for library user: ${user.email}`));

    try {
      // Get the library user to ensure they exist and get their platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Verify the class exists (classes are public/shared, not platform-specific)
      const libraryClass = await this.prisma.libraryClass.findUnique({
        where: {
          id: payload.classId,
        },
      });

      if (!libraryClass) {
        this.logger.error(colors.red(`Class not found: ${payload.classId}`));
        throw new NotFoundException('Class not found');
      }

      // Check if code is unique within the platform (if provided)
      if (payload.code) {
        const existingSubject = await this.prisma.librarySubject.findFirst({
          where: {
            platformId: libraryUser.platformId,
            code: payload.code,
          },
        });

        if (existingSubject) {
          this.logger.error(colors.red(`Subject code already exists in platform: ${payload.code}`));
          throw new BadRequestException(`Subject code '${payload.code}' already exists in your platform`);
        }
      }

      // Handle thumbnail upload if provided
      let thumbnailUrl: string | null = null;
      let thumbnailKey: string | null = null;
      let thumbnailUploadSucceeded = false;

      if (thumbnailFile) {
        // Validate file type (images only)
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(thumbnailFile.mimetype)) {
          this.logger.error(colors.red('Invalid thumbnail file type. Allowed types: JPEG, PNG, GIF, WEBP'));
          throw new BadRequestException('Invalid thumbnail file type. Allowed types: JPEG, PNG, GIF, WEBP');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (thumbnailFile.size > maxSize) {
          throw new BadRequestException('Thumbnail file size exceeds 5MB limit');
        }

        try {
          const folder = `library/subjects/thumbnails`;
          const fileName = `${Date.now()}_${thumbnailFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          this.logger.log(colors.cyan(`Uploading thumbnail: ${thumbnailFile.originalname}`));
          const uploadResult = await this.storageService.uploadFile(thumbnailFile, folder, fileName);
          
          thumbnailUrl = uploadResult.url;
          thumbnailKey = uploadResult.key;
          thumbnailUploadSucceeded = true;
          
          this.logger.log(colors.green(`✅ Thumbnail uploaded successfully: ${uploadResult.url}`));
        } catch (uploadError: any) {
          this.logger.error(colors.red(`❌ Failed to upload thumbnail: ${uploadError.message}`));
          throw new BadRequestException(`Failed to upload thumbnail: ${uploadError.message}`);
        }
      }

      // Create the subject in a transaction
      let subject: any;
      try {
        subject = await this.prisma.$transaction(async (tx) => {
          return await tx.librarySubject.create({
            data: {
              platformId: libraryUser.platformId,
              classId: payload.classId,
              name: payload.name,
              code: payload.code ?? null,
              color: payload.color ?? '#3B82F6',
              description: payload.description ?? null,
              thumbnailUrl: thumbnailUrl,
              thumbnailKey: thumbnailKey,
            },
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                },
              },
            },
          });
        }, {
          maxWait: 5000,
          timeout: 15000,
        });

        this.logger.log(colors.green(`Subject created successfully: ${subject.id}`));
        return new ApiResponse(true, 'Subject created successfully', subject);
      } catch (dbError: any) {
        // Rollback: Delete uploaded thumbnail if database operation failed
        if (thumbnailUploadSucceeded && thumbnailKey) {
          this.logger.log(colors.yellow(`🔄 Attempting to rollback thumbnail upload...`));
          try {
            await this.storageService.deleteFile(thumbnailKey);
            this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted thumbnail from storage due to database operation failure`));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to rollback thumbnail file: ${deleteError.message}`));
          }
        }
        throw dbError;
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error creating subject: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to create subject');
    }
  }

  async updateSubject(user: any, subjectId: string, payload: UpdateSubjectDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY SUBJECT] Updating subject: ${subjectId} for library user: ${user.email}`));

    try {
      // Get the library user to ensure they exist and get their platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Verify the subject exists and belongs to the user's platform
      const existingSubject = await this.prisma.librarySubject.findFirst({
        where: {
          id: subjectId,
          platformId: libraryUser.platformId,
        },
      });

      if (!existingSubject) {
        this.logger.error(colors.red(`Subject not found or does not belong to user's platform: ${subjectId}`));
        throw new NotFoundException('Subject not found or does not belong to your platform');
      }

      // Check if code is unique within the platform (if provided and different from current)
      if (payload.code && payload.code !== existingSubject.code) {
        const codeExists = await this.prisma.librarySubject.findFirst({
          where: {
            platformId: libraryUser.platformId,
            code: payload.code,
            id: { not: subjectId },
          },
        });

        if (codeExists) {
          this.logger.error(colors.red(`Subject code already exists in platform: ${payload.code}`));
          throw new BadRequestException(`Subject code '${payload.code}' already exists in your platform`);
        }
      }

      // Build update data object (only include fields that are provided)
      const updateData: any = {};
      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.code !== undefined) updateData.code = payload.code ?? null;
      if (payload.color !== undefined) updateData.color = payload.color;
      if (payload.description !== undefined) updateData.description = payload.description ?? null;

      // Update the subject in a transaction
      const subject = await this.prisma.$transaction(async (tx) => {
        return await tx.librarySubject.update({
          where: { id: subjectId },
          data: updateData,
          include: {
            class: {
              select: {
                id: true,
                name: true,
                order: true,
              },
            },
          },
        });
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      this.logger.log(colors.green(`Subject updated successfully: ${subject.id}`));
      return new ApiResponse(true, 'Subject updated successfully', subject);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error updating subject: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to update subject');
    }
  }

  async updateSubjectThumbnail(user: any, subjectId: string, thumbnailFile: Express.Multer.File): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY SUBJECT] Updating thumbnail for subject: ${subjectId} for library user: ${user.email}`));

    try {
      // Get the library user to ensure they exist and get their platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Verify the subject exists and belongs to the user's platform
      const existingSubject = await this.prisma.librarySubject.findFirst({
        where: {
          id: subjectId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          thumbnailKey: true,
        },
      });

      if (!existingSubject) {
        this.logger.error(colors.red(`Subject not found or does not belong to user's platform: ${subjectId}`));
        throw new NotFoundException('Subject not found or does not belong to your platform');
      }

      // Validate file type (images only)
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(thumbnailFile.mimetype)) {
        this.logger.error(colors.red('Invalid thumbnail file type. Allowed types: JPEG, PNG, GIF, WEBP'));
        throw new BadRequestException('Invalid thumbnail file type. Allowed types: JPEG, PNG, GIF, WEBP');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (thumbnailFile.size > maxSize) {
        throw new BadRequestException('Thumbnail file size exceeds 5MB limit');
      }

      // Upload new thumbnail
      let newThumbnailUrl: string | null = null;
      let newThumbnailKey: string | null = null;
      let thumbnailUploadSucceeded = false;
      const oldThumbnailKey = existingSubject.thumbnailKey;

      try {
        const folder = `library/subjects/thumbnails`;
        const fileName = `${Date.now()}_${thumbnailFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        this.logger.log(colors.cyan(`Uploading new thumbnail: ${thumbnailFile.originalname}`));
        const uploadResult = await this.storageService.uploadFile(thumbnailFile, folder, fileName);
        
        newThumbnailUrl = uploadResult.url;
        newThumbnailKey = uploadResult.key;
        thumbnailUploadSucceeded = true;
        
        this.logger.log(colors.green(`✅ New thumbnail uploaded successfully: ${uploadResult.url}`));
      } catch (uploadError: any) {
        this.logger.error(colors.red(`❌ Failed to upload thumbnail: ${uploadError.message}`));
        throw new BadRequestException(`Failed to upload thumbnail: ${uploadError.message}`);
      }

      // Update the subject in a transaction
      let subject: any;
      try {
        subject = await this.prisma.$transaction(async (tx) => {
          return await tx.librarySubject.update({
            where: { id: subjectId },
            data: {
              thumbnailUrl: newThumbnailUrl,
              thumbnailKey: newThumbnailKey,
            },
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                  order: true,
                },
              },
            },
          });
        }, {
          maxWait: 5000,
          timeout: 15000,
        });

        // Delete old thumbnail from storage after successful database update
        if (oldThumbnailKey) {
          try {
            this.logger.log(colors.cyan(`Deleting old thumbnail from storage: ${oldThumbnailKey}`));
            await this.storageService.deleteFile(oldThumbnailKey);
            this.logger.log(colors.green(`✅ Old thumbnail deleted successfully`));
          } catch (deleteError: any) {
            // Log error but don't fail the operation
            this.logger.error(colors.yellow(`⚠️ Failed to delete old thumbnail: ${deleteError.message}`));
          }
        }

        this.logger.log(colors.green(`Subject thumbnail updated successfully: ${subject.id}`));
        return new ApiResponse(true, 'Subject thumbnail updated successfully', subject);
      } catch (dbError: any) {
        // Rollback: Delete new uploaded thumbnail if database operation failed
        if (thumbnailUploadSucceeded && newThumbnailKey) {
          this.logger.log(colors.yellow(`🔄 Attempting to rollback thumbnail upload...`));
          try {
            await this.storageService.deleteFile(newThumbnailKey);
            this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted new thumbnail from storage due to database operation failure`));
          } catch (deleteError: any) {
            this.logger.error(colors.red(`❌ Failed to rollback thumbnail file: ${deleteError.message}`));
          }
        }
        throw dbError;
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error updating subject thumbnail: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to update subject thumbnail');
    }
  }
}

