import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../shared/services/s3.service';
import { UploadProgressService } from '../../school/ai-chat/upload-progress.service';
import { FileValidationHelper } from '../../shared/helper-functions/file-validation.helper';
import { ApiResponse } from '../../shared/helper-functions/response';
import { UploadLibraryVideoDto } from './dto/upload-video.dto';
import { UploadLibraryMaterialDto } from './dto/upload-material.dto';
import { CreateLibraryLinkDto } from './dto/create-link.dto';
import * as colors from 'colors';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly uploadProgressService: UploadProgressService,
  ) {}

  /**
   * Start video upload session
   */
  async startVideoUploadSession(
    uploadDto: UploadLibraryVideoDto,
    videoFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    user: any,
  ) {
    if (!videoFile) {
      throw new BadRequestException('Video file is required');
    }

    const maxVideoSize = 500 * 1024 * 1024; // 500MB
    if (videoFile.size > maxVideoSize) {
      throw new BadRequestException('Video file size exceeds 500MB limit');
    }

    const totalBytes = videoFile.size + (thumbnailFile?.size || 0);
    const sessionId = this.uploadProgressService.createUploadSession(user.sub, user.platform_id || 'library', totalBytes);

    this.uploadVideoWithProgress(uploadDto, videoFile, thumbnailFile, user, sessionId)
      .catch(err => this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, err.message));

    return new ApiResponse(
      true,
      'Video upload started successfully',
      {
        sessionId,
        progressEndpoint: `/api/v1/library/content/upload-progress/${sessionId}`,
      },
    );
  }

  /**
   * Upload video with progress tracking
   */
  private async uploadVideoWithProgress(
    uploadDto: UploadLibraryVideoDto,
    videoFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    user: any,
    sessionId: string,
  ) {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Starting video upload: "${uploadDto.title}"`));

    let smoother: NodeJS.Timeout | null = null;
    let s3Key: string | undefined;
    let thumbnailS3Key: string | undefined;
    let s3UploadSucceeded = false;
    let thumbnailUploadSucceeded = false;

    try {
      this.uploadProgressService.updateProgress(sessionId, 'validating', 0);

      // Get library user and platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Library user not found');
        throw new NotFoundException('Library user not found');
      }

      // Validate topic and subject
      const topic = await this.prisma.libraryTopic.findFirst({
        where: {
          id: uploadDto.topicId,
          subjectId: uploadDto.subjectId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!topic) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Topic not found or does not belong to your platform');
        throw new NotFoundException('Topic not found or does not belong to your platform');
      }

      // Upload video with progress
      const totalBytes = videoFile.size + (thumbnailFile?.size || 0);
      let lastPercent = -1;
      let lastKnownLoaded = 0;
      let emittedLoaded = 0;
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

      // Upload video to S3
      const videoUploadResult = await this.s3Service.uploadFile(
        videoFile,
        `library/videos/platforms/${libraryUser.platformId}/subjects/${uploadDto.subjectId}/topics/${uploadDto.topicId}`,
        `${uploadDto.title.replace(/\s+/g, '_')}_${Date.now()}.mp4`,
        (loaded) => {
          lastKnownLoaded = Math.min(loaded, videoFile.size);
        },
      );

      s3Key = videoUploadResult.key;
      s3UploadSucceeded = true;

      // Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      let thumbnailS3KeyResult: string | null = null;
      if (thumbnailFile) {
        const thumbResult = await this.s3Service.uploadFile(
          thumbnailFile,
          `library/video-thumbnails/platforms/${libraryUser.platformId}/subjects/${uploadDto.subjectId}/topics/${uploadDto.topicId}`,
          `${uploadDto.title.replace(/\s+/g, '_')}_thumbnail_${Date.now()}.${thumbnailFile.originalname.split('.').pop()}`,
          (loaded) => {
            lastKnownLoaded = Math.min(videoFile.size + loaded, totalBytes);
          },
        );
        thumbnailUrl = thumbResult.url;
        thumbnailS3KeyResult = thumbResult.key;
        thumbnailS3Key = thumbResult.key;
        thumbnailUploadSucceeded = true;
      }

      this.uploadProgressService.updateProgress(sessionId, 'processing', lastKnownLoaded);

      // Get next order
      const lastVideo = await this.prisma.libraryVideoLesson.findFirst({
        where: { topicId: uploadDto.topicId, platformId: libraryUser.platformId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const nextOrder = (lastVideo?.order || 0) + 1;

      this.uploadProgressService.updateProgress(sessionId, 'saving', lastKnownLoaded);

      // Save to database
      const videoLesson = await this.prisma.$transaction(async (tx) => {
        return await tx.libraryVideoLesson.create({
          data: {
            platformId: libraryUser.platformId,
            subjectId: uploadDto.subjectId,
            topicId: uploadDto.topicId,
            uploadedById: user.sub,
            title: uploadDto.title,
            description: uploadDto.description ?? null,
            videoUrl: videoUploadResult.url,
            videoS3Key: s3Key,
            thumbnailUrl: thumbnailUrl,
            thumbnailS3Key: thumbnailS3KeyResult,
            sizeBytes: videoFile.size,
            order: nextOrder,
            status: 'published',
          },
          include: {
            topic: {
              select: {
                id: true,
                title: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      // Complete
      lastKnownLoaded = totalBytes;
      emittedLoaded = totalBytes;
      if (smoother) clearInterval(smoother);
      this.uploadProgressService.updateProgress(sessionId, 'completed', totalBytes, undefined, undefined, videoLesson.id);

      this.logger.log(colors.green(`✅ Video uploaded successfully: ${videoLesson.id}`));
      return videoLesson;
    } catch (error) {
      if (smoother) clearInterval(smoother);
      this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, error.message);

      // Rollback: Delete uploaded files if DB save failed
      if (s3UploadSucceeded && s3Key) {
        try {
          await this.s3Service.deleteFile(s3Key);
          this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted video from storage`));
        } catch (deleteError) {
          this.logger.error(colors.red(`❌ Failed to rollback video file: ${deleteError.message}`));
        }
      }
      if (thumbnailUploadSucceeded && thumbnailS3Key) {
        try {
          await this.s3Service.deleteFile(thumbnailS3Key);
          this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted thumbnail from storage`));
        } catch (deleteError) {
          this.logger.error(colors.red(`❌ Failed to rollback thumbnail file: ${deleteError.message}`));
        }
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error uploading video: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to upload video');
    }
  }

  /**
   * Start material upload session
   */
  async startMaterialUploadSession(
    uploadDto: UploadLibraryMaterialDto,
    materialFile: Express.Multer.File,
    user: any,
  ) {
    if (!materialFile) {
      throw new BadRequestException('Material file is required');
    }

    const sessionId = this.uploadProgressService.createUploadSession(user.sub, user.platform_id || 'library', materialFile.size);

    this.uploadMaterialWithProgress(uploadDto, materialFile, user, sessionId)
      .catch(err => this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, err.message));

    return new ApiResponse(
      true,
      'Material upload started successfully',
      {
        sessionId,
        progressEndpoint: `/api/v1/library/content/upload-progress/${sessionId}`,
      },
    );
  }

  /**
   * Upload material with progress tracking
   */
  private async uploadMaterialWithProgress(
    uploadDto: UploadLibraryMaterialDto,
    materialFile: Express.Multer.File,
    user: any,
    sessionId: string,
  ) {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Starting material upload: "${uploadDto.title}"`));

    let smoother: NodeJS.Timeout | null = null;
    let s3Key: string | undefined;
    let s3UploadSucceeded = false;

    try {
      this.uploadProgressService.updateProgress(sessionId, 'validating', 0);

      // Validate file
      const validationResult = FileValidationHelper.validateMaterialFile(materialFile);
      if (!validationResult.isValid) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, validationResult.error);
        throw new BadRequestException(validationResult.error);
      }

      // Get library user and platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Library user not found');
        throw new NotFoundException('Library user not found');
      }

      // Validate topic and subject
      const topic = await this.prisma.libraryTopic.findFirst({
        where: {
          id: uploadDto.topicId,
          subjectId: uploadDto.subjectId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
        },
      });

      if (!topic) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Topic not found or does not belong to your platform');
        throw new NotFoundException('Topic not found or does not belong to your platform');
      }

      // Upload material with progress
      const totalBytes = materialFile.size;
      let lastPercent = -1;
      let lastKnownLoaded = 0;
      let emittedLoaded = 0;
      const onePercent = Math.max(1, Math.floor(totalBytes / 100));
      const tickMs = 250;

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

      // Upload to S3
      const materialUploadResult = await this.s3Service.uploadFile(
        materialFile,
        `library/materials/platforms/${libraryUser.platformId}/subjects/${uploadDto.subjectId}/topics/${uploadDto.topicId}`,
        `${uploadDto.title.replace(/\s+/g, '_')}_${Date.now()}.${validationResult.fileType}`,
        (loaded) => {
          lastKnownLoaded = Math.min(loaded, totalBytes);
        },
      );

      s3Key = materialUploadResult.key;
      s3UploadSucceeded = true;

      this.uploadProgressService.updateProgress(sessionId, 'processing', lastKnownLoaded);

      // Get next order
      const lastMaterial = await this.prisma.libraryMaterial.findFirst({
        where: { topicId: uploadDto.topicId, platformId: libraryUser.platformId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const nextOrder = (lastMaterial?.order || 0) + 1;

      this.uploadProgressService.updateProgress(sessionId, 'saving', lastKnownLoaded);

      // Determine material type from file extension
      const materialType = this.getMaterialTypeFromExtension(validationResult.fileType || 'pdf');

      // Save to database
      const material = await this.prisma.$transaction(async (tx) => {
        return await tx.libraryMaterial.create({
          data: {
            platformId: libraryUser.platformId,
            subjectId: uploadDto.subjectId,
            topicId: uploadDto.topicId,
            uploadedById: user.sub,
            title: uploadDto.title,
            description: uploadDto.description ?? null,
            materialType: materialType,
            url: materialUploadResult.url,
            s3Key: s3Key,
            sizeBytes: materialFile.size,
            order: nextOrder,
            status: 'published',
          },
          include: {
            topic: {
              select: {
                id: true,
                title: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      // Complete
      lastKnownLoaded = totalBytes;
      emittedLoaded = totalBytes;
      if (smoother) clearInterval(smoother);
      this.uploadProgressService.updateProgress(sessionId, 'completed', totalBytes, undefined, undefined, material.id);

      this.logger.log(colors.green(`✅ Material uploaded successfully: ${material.id}`));
      return material;
    } catch (error) {
      if (smoother) clearInterval(smoother);
      this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, error.message);

      // Rollback: Delete uploaded file if DB save failed
      if (s3UploadSucceeded && s3Key) {
        try {
          await this.s3Service.deleteFile(s3Key);
          this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted material from storage`));
        } catch (deleteError) {
          this.logger.error(colors.red(`❌ Failed to rollback material file: ${deleteError.message}`));
        }
      }

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error uploading material: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to upload material');
    }
  }

  /**
   * Create a link (no file upload required)
   */
  async createLink(user: any, payload: CreateLibraryLinkDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Creating link: "${payload.title}"`));

    try {
      // Get library user and platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Validate topic and subject
      const topic = await this.prisma.libraryTopic.findFirst({
        where: {
          id: payload.topicId,
          subjectId: payload.subjectId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          chapterId: true,
        },
      });

      if (!topic) {
        throw new NotFoundException('Topic not found or does not belong to your platform');
      }

      // Validate chapter if provided
      if (payload.chapterId && topic.chapterId !== payload.chapterId) {
        throw new BadRequestException('Chapter ID does not match the topic\'s chapter');
      }

      // Extract domain from URL
      let domain: string | null = null;
      try {
        const urlObj = new URL(payload.url);
        domain = urlObj.hostname;
      } catch {
        // Invalid URL, but validation should catch this
      }

      // Get next order
      const lastLink = await this.prisma.libraryLink.findFirst({
        where: { topicId: payload.topicId, platformId: libraryUser.platformId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      const nextOrder = (lastLink?.order || 0) + 1;

      // Create link
      const link = await this.prisma.libraryLink.create({
        data: {
          platformId: libraryUser.platformId,
          subjectId: payload.subjectId,
          chapterId: payload.chapterId ?? null,
          topicId: payload.topicId,
          uploadedById: user.sub,
          title: payload.title,
          description: payload.description ?? null,
          url: payload.url,
          linkType: payload.linkType ?? null,
          domain: domain,
          order: nextOrder,
          status: 'published',
        },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          chapter: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      this.logger.log(colors.green(`✅ Link created successfully: ${link.id}`));
      return new ApiResponse(true, 'Link created successfully', link);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error creating link: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to create link');
    }
  }

  /**
   * Get upload progress
   */
  getUploadProgress(sessionId: string) {
    const progress = this.uploadProgressService.getCurrentProgress(sessionId);
    if (!progress) {
      throw new BadRequestException('Upload session not found');
    }
    return new ApiResponse(true, 'Upload progress retrieved', progress);
  }

  /**
   * Get video for playback (tracks view)
   */
  async getVideoForPlayback(user: any, videoId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Getting video for playback: ${videoId} for library user: ${user.email}`));

    try {
      // Get library user and platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red(`Library user not found: ${user.email}`));
        throw new NotFoundException('Library user not found');
      }

      // Get video and verify it belongs to user's platform
      const video = await (this.prisma.libraryVideoLesson.findFirst({
        where: {
          id: videoId,
          platformId: libraryUser.platformId,
          status: 'published' as any,
        },
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          thumbnailUrl: true,
          durationSeconds: true,
          sizeBytes: true,
          views: true,
          order: true,
          createdAt: true,
          updatedAt: true,
          topic: {
            select: {
              id: true,
              title: true,
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
      }) as any);

      if (!video) {
        this.logger.error(colors.red(`Video not found or does not belong to your platform: ${videoId}`));
        throw new NotFoundException('Video not found or does not belong to your platform');
      }

    //   log video url 
    this.logger.log(colors.blue(`Video URL: ${video.videoUrl}`));

      // Increment view count
      const updatedVideo = await (this.prisma.libraryVideoLesson.update({
        where: { id: videoId },
        data: {
          views: {
            increment: 1,
          },
        },
        select: {
          views: true,
        },
      }) as any);

      const responseData = {
        ...video,
        views: updatedVideo.views,
      };

      this.logger.log(colors.green(`Video retrieved for playback: ${video.title} (Views: ${updatedVideo.views})`));
      return new ApiResponse(true, 'Video retrieved successfully', responseData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error getting video for playback: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve video');
    }
  }

  /**
   * Helper: Get material type from file extension
   */
  private getMaterialTypeFromExtension(extension: string): 'PDF' | 'DOC' | 'PPT' | 'VIDEO' | 'NOTE' | 'LINK' | 'OTHER' {
    const ext = extension.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'PDF';
      case 'doc':
      case 'docx':
        return 'DOC';
      case 'ppt':
      case 'pptx':
        return 'PPT';
      default:
        return 'OTHER';
    }
  }
}

