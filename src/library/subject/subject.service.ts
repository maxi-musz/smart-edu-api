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

  async deleteSubject(user: any, subjectId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY SUBJECT] Deleting subject: ${subjectId} for library user: ${user.email}`));

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
      // Fetch all related content to collect storage keys for cleanup
      const existingSubject = await this.prisma.librarySubject.findFirst({
        where: {
          id: subjectId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          name: true,
          thumbnailKey: true,
          // Videos directly under subject
          videos: {
            select: {
              id: true,
              videoS3Key: true,
              thumbnailS3Key: true,
              hlsS3Prefix: true,
            },
          },
          // Materials directly under subject
          materials: {
            select: {
              id: true,
              s3Key: true,
            },
          },
          // Assignments under subject (via topics)
          assignments: {
            select: {
              id: true,
              attachmentS3Key: true,
            },
          },
          // Links (no storage keys)
          links: {
            select: { id: true },
          },
          // Comments on subject
          comments: {
            select: { id: true },
          },
          // Assessments with questions that may have images
          assessments: {
            select: {
              id: true,
              questions: {
                select: {
                  id: true,
                  imageS3Key: true,
                },
              },
            },
          },
          // General materials
          generalMaterials: {
            select: {
              id: true,
              s3Key: true,
              thumbnailS3Key: true,
              chapters: {
                select: {
                  id: true,
                  files: {
                    select: {
                      id: true,
                      s3Key: true,
                    },
                  },
                },
              },
            },
          },
          // Topics with all their content
          topics: {
            select: {
              id: true,
              videos: {
                select: {
                  id: true,
                  videoS3Key: true,
                  thumbnailS3Key: true,
                  hlsS3Prefix: true,
                },
              },
              materials: {
                select: {
                  id: true,
                  s3Key: true,
                },
              },
              assignments: {
                select: {
                  id: true,
                  attachmentS3Key: true,
                },
              },
              links: {
                select: { id: true },
              },
              comments: {
                select: { id: true },
              },
              assessments: {
                select: {
                  id: true,
                  questions: {
                    select: {
                      id: true,
                      imageS3Key: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!existingSubject) {
        this.logger.error(colors.red(`Subject not found or does not belong to user's platform: ${subjectId}`));
        throw new NotFoundException('Subject not found or does not belong to your platform');
      }

      // Collect all storage keys to delete
      const storageKeysToDelete: string[] = [];
      const hlsPrefixesToDelete: string[] = [];

      // Subject thumbnail
      if (existingSubject.thumbnailKey) {
        storageKeysToDelete.push(existingSubject.thumbnailKey);
      }

      // Videos directly under subject
      for (const video of existingSubject.videos) {
        if (video.videoS3Key) storageKeysToDelete.push(video.videoS3Key);
        if (video.thumbnailS3Key) storageKeysToDelete.push(video.thumbnailS3Key);
        if (video.hlsS3Prefix) hlsPrefixesToDelete.push(video.hlsS3Prefix);
      }

      // Materials directly under subject
      for (const material of existingSubject.materials) {
        if (material.s3Key) storageKeysToDelete.push(material.s3Key);
      }

      // Assignments directly under subject
      for (const assignment of existingSubject.assignments) {
        if (assignment.attachmentS3Key) storageKeysToDelete.push(assignment.attachmentS3Key);
      }

      // Assessment question images
      for (const assessment of existingSubject.assessments) {
        for (const question of assessment.questions) {
          if (question.imageS3Key) storageKeysToDelete.push(question.imageS3Key);
        }
      }

      // General materials
      for (const gm of existingSubject.generalMaterials) {
        if (gm.s3Key) storageKeysToDelete.push(gm.s3Key);
        if (gm.thumbnailS3Key) storageKeysToDelete.push(gm.thumbnailS3Key);
        for (const chapter of gm.chapters) {
          for (const file of chapter.files) {
            if (file.s3Key) storageKeysToDelete.push(file.s3Key);
          }
        }
      }

      // Content under topics
      for (const topic of existingSubject.topics) {
        for (const video of topic.videos) {
          if (video.videoS3Key) storageKeysToDelete.push(video.videoS3Key);
          if (video.thumbnailS3Key) storageKeysToDelete.push(video.thumbnailS3Key);
          if (video.hlsS3Prefix) hlsPrefixesToDelete.push(video.hlsS3Prefix);
        }
        for (const material of topic.materials) {
          if (material.s3Key) storageKeysToDelete.push(material.s3Key);
        }
        for (const assignment of topic.assignments) {
          if (assignment.attachmentS3Key) storageKeysToDelete.push(assignment.attachmentS3Key);
        }
        for (const assessment of topic.assessments) {
          for (const question of assessment.questions) {
            if (question.imageS3Key) storageKeysToDelete.push(question.imageS3Key);
          }
        }
      }

      // Count items for logging
      const topicsCount = existingSubject.topics.length;
      const videosCount = existingSubject.videos.length + existingSubject.topics.reduce((acc, t) => acc + t.videos.length, 0);
      const materialsCount = existingSubject.materials.length + existingSubject.topics.reduce((acc, t) => acc + t.materials.length, 0);
      const assignmentsCount = existingSubject.assignments.length + existingSubject.topics.reduce((acc, t) => acc + t.assignments.length, 0);
      const assessmentsCount = existingSubject.assessments.length + existingSubject.topics.reduce((acc, t) => acc + t.assessments.length, 0);
      const linksCount = existingSubject.links.length + existingSubject.topics.reduce((acc, t) => acc + t.links.length, 0);
      const commentsCount = existingSubject.comments.length + existingSubject.topics.reduce((acc, t) => acc + t.comments.length, 0);
      const generalMaterialsCount = existingSubject.generalMaterials.length;

      this.logger.log(colors.yellow(`🗑️ Preparing to delete subject "${existingSubject.name}" with:`));
      this.logger.log(colors.yellow(`   - ${topicsCount} topics`));
      this.logger.log(colors.yellow(`   - ${videosCount} videos`));
      this.logger.log(colors.yellow(`   - ${materialsCount} materials`));
      this.logger.log(colors.yellow(`   - ${assignmentsCount} assignments`));
      this.logger.log(colors.yellow(`   - ${assessmentsCount} assessments`));
      this.logger.log(colors.yellow(`   - ${linksCount} links`));
      this.logger.log(colors.yellow(`   - ${commentsCount} comments`));
      this.logger.log(colors.yellow(`   - ${generalMaterialsCount} general materials`));
      this.logger.log(colors.yellow(`   - ${storageKeysToDelete.length} storage files`));
      this.logger.log(colors.yellow(`   - ${hlsPrefixesToDelete.length} HLS folders`));

      // Delete all database records in a transaction (order matters due to foreign keys)
      await this.prisma.$transaction(async (tx) => {
        // 1. Delete access control records first (they reference subjects/topics)
        await tx.libraryResourceAccess.deleteMany({ where: { subjectId } });
        await tx.schoolResourceAccess.deleteMany({ where: { subjectId } });
        await tx.teacherResourceAccess.deleteMany({ where: { subjectId } });
        await tx.schoolResourceExclusion.deleteMany({ where: { subjectId } });
        await tx.teacherResourceExclusion.deleteMany({ where: { subjectId } });

        // Also delete topic-level access controls
        const topicIds = existingSubject.topics.map(t => t.id);
        if (topicIds.length > 0) {
          await tx.libraryResourceAccess.deleteMany({ where: { topicId: { in: topicIds } } });
          await tx.schoolResourceAccess.deleteMany({ where: { topicId: { in: topicIds } } });
          await tx.teacherResourceAccess.deleteMany({ where: { topicId: { in: topicIds } } });
        }

        // 2. Delete comments (can be nested, need to delete replies first)
        await tx.libraryComment.deleteMany({ where: { subjectId } });
        if (topicIds.length > 0) {
          await tx.libraryComment.deleteMany({ where: { topicId: { in: topicIds } } });
        }

        // 3. Delete video watch history and views
        const videoIds = [
          ...existingSubject.videos.map(v => v.id),
          ...existingSubject.topics.flatMap(t => t.videos.map(v => v.id)),
        ];
        if (videoIds.length > 0) {
          await tx.libraryVideoWatchHistory.deleteMany({ where: { videoId: { in: videoIds } } });
          await tx.libraryVideoView.deleteMany({ where: { videoId: { in: videoIds } } });
        }

        // 4. Delete assessment attempts, responses, and analytics
        const assessmentIds = [
          ...existingSubject.assessments.map(a => a.id),
          ...existingSubject.topics.flatMap(t => t.assessments.map(a => a.id)),
        ];
        if (assessmentIds.length > 0) {
          await tx.libraryAssessmentResponse.deleteMany({ where: { attempt: { assessmentId: { in: assessmentIds } } } });
          await tx.libraryAssessmentAttempt.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
          await tx.libraryAssessmentAnalytics.deleteMany({ where: { assessmentId: { in: assessmentIds } } });
        }

        // 5. Delete general material related records (chunks, chapters, files, purchases, chats)
        const gmIds = existingSubject.generalMaterials.map(gm => gm.id);
        if (gmIds.length > 0) {
          await tx.libraryGeneralMaterialChatContext.deleteMany({ where: { materialId: { in: gmIds } } });
          await tx.libraryGeneralMaterialChatMessage.deleteMany({ where: { materialId: { in: gmIds } } });
          await tx.libraryGeneralMaterialChatConversation.deleteMany({ where: { materialId: { in: gmIds } } });
          await tx.libraryGeneralMaterialChunk.deleteMany({ where: { materialId: { in: gmIds } } });
          await tx.libraryGeneralMaterialProcessing.deleteMany({ where: { materialId: { in: gmIds } } });
          await tx.libraryGeneralMaterialPurchase.deleteMany({ where: { materialId: { in: gmIds } } });
          
          // Delete chapter files first, then chapters
          const chapterIds = existingSubject.generalMaterials.flatMap(gm => gm.chapters.map(c => c.id));
          if (chapterIds.length > 0) {
            await tx.libraryGeneralMaterialChapterFile.deleteMany({ where: { chapterId: { in: chapterIds } } });
            await tx.libraryGeneralMaterialChapter.deleteMany({ where: { id: { in: chapterIds } } });
          }
          
          // Delete general material class associations
          await tx.libraryGeneralMaterialClass.deleteMany({ where: { materialId: { in: gmIds } } });
        }

        // 6. Delete content under topics
        if (topicIds.length > 0) {
          await tx.libraryVideoLesson.deleteMany({ where: { topicId: { in: topicIds } } });
          await tx.libraryMaterial.deleteMany({ where: { topicId: { in: topicIds } } });
          await tx.libraryAssignment.deleteMany({ where: { topicId: { in: topicIds } } });
          await tx.libraryLink.deleteMany({ where: { topicId: { in: topicIds } } });
          await tx.libraryAssessment.deleteMany({ where: { topicId: { in: topicIds } } });
        }

        // 7. Delete content directly under subject
        await tx.libraryVideoLesson.deleteMany({ where: { subjectId, topicId: null } });
        await tx.libraryMaterial.deleteMany({ where: { subjectId, topicId: null } });
        await tx.libraryAssignment.deleteMany({ where: { subjectId } });
        await tx.libraryLink.deleteMany({ where: { subjectId, topicId: null } });
        await tx.libraryAssessment.deleteMany({ where: { subjectId, topicId: null } });
        await tx.libraryGeneralMaterial.deleteMany({ where: { subjectId } });

        // 8. Delete topics
        await tx.libraryTopic.deleteMany({ where: { subjectId } });

        // 9. Finally delete the subject
        await tx.librarySubject.delete({ where: { id: subjectId } });
      }, {
        maxWait: 10000,
        timeout: 60000, // Longer timeout for cascade delete
      });

      this.logger.log(colors.green(`✅ Database records deleted successfully`));

      // Delete storage files (after successful database transaction)
      let deletedFilesCount = 0;
      let failedFilesCount = 0;

      // Delete individual files
      for (const key of storageKeysToDelete) {
        try {
          await this.storageService.deleteFile(key);
          deletedFilesCount++;
        } catch (deleteError: any) {
          this.logger.error(colors.yellow(`⚠️ Failed to delete file: ${key} - ${deleteError.message}`));
          failedFilesCount++;
        }
      }

      // Delete HLS folders (each prefix contains multiple .ts segments and .m3u8 files)
      for (const prefix of hlsPrefixesToDelete) {
        try {
          // Cast to any to avoid TS complaints in case the method
          // is not present on some storage implementations
          await (this.storageService as any).deleteFolder(prefix);
          this.logger.log(colors.green(`✅ Deleted HLS folder: ${prefix}`));
        } catch (deleteError: any) {
          this.logger.error(colors.yellow(`⚠️ Failed to delete HLS folder: ${prefix} - ${deleteError.message}`));
          failedFilesCount++;
        }
      }

      this.logger.log(colors.green(`✅ Storage cleanup: ${deletedFilesCount} files deleted, ${failedFilesCount} failed`));
      this.logger.log(colors.green(`Subject "${existingSubject.name}" deleted successfully with all content`));

      return new ApiResponse(true, 'Subject and all its content deleted successfully', {
        id: subjectId,
        name: existingSubject.name,
        deletedContent: {
          topics: topicsCount,
          videos: videosCount,
          materials: materialsCount,
          assignments: assignmentsCount,
          assessments: assessmentsCount,
          links: linksCount,
          comments: commentsCount,
          generalMaterials: generalMaterialsCount,
          storageFiles: deletedFilesCount,
          hlsFolders: hlsPrefixesToDelete.length,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error deleting subject: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to delete subject');
    }
  }
}

