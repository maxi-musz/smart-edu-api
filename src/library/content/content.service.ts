import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../shared/services/s3.service';
import { UploadProgressService } from '../../school/ai-chat/upload-progress.service';
import { FileValidationHelper } from '../../shared/helper-functions/file-validation.helper';
import { ApiResponse } from '../../shared/helper-functions/response';
import { UploadLibraryVideoDto } from './dto/upload-video.dto';
import { UploadLibraryMaterialDto } from './dto/upload-material.dto';
import { CreateLibraryLinkDto } from './dto/create-link.dto';
import { UpdateLibraryVideoDto } from './dto/update-video.dto';
import * as colors from 'colors';
import * as ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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

      // Extract video duration
      this.logger.log(colors.cyan(`🎬 Extracting video duration...`));
      const durationSeconds = await this.extractVideoDuration(videoFile);

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
            durationSeconds: durationSeconds,
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
        },
      });

      if (!topic) {
        throw new NotFoundException('Topic not found or does not belong to your platform');
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
   * Get video for playback (tracks unique views like YouTube)
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

      this.logger.log(colors.blue(`Video URL: ${video.videoUrl}`));

      // Extract userId and determine user type
      const userId = user.sub || user.id;
      let isLibraryUser = false;
      
      if (!userId) {
        this.logger.error(colors.red(`❌ No valid user ID found in token. user.sub: ${user.sub}, user.id: ${user.id}`));
        throw new BadRequestException('Invalid user session. Please log in again.');
      }

      // Determine which table the user belongs to
      const regularUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!regularUser) {
        // Check library resource users table
        const libraryUser = await this.prisma.libraryResourceUser.findUnique({
          where: { id: userId },
          select: { id: true }
        });

        if (!libraryUser) {
          this.logger.error(colors.red(`❌ User not found in any table: ${userId}`));
          throw new NotFoundException('User not found');
        }
        
        isLibraryUser = true;
        this.logger.log(colors.blue(`📚 Library resource user detected: ${userId}`));
      } else {
        this.logger.log(colors.blue(`👤 Regular user detected: ${userId}`));
      }

      // Check if user has already viewed this video (unique view tracking)
      const existingView = await this.prisma.libraryVideoView.findFirst({
        where: {
          videoId: videoId,
          ...(isLibraryUser 
            ? { libraryResourceUserId: userId }
            : { userId: userId }
          ),
        },
      });

      let updatedViews = video.views;

      // Only increment view count if this is a new unique view
      if (!existingView) {
        try {
          await this.prisma.$transaction([
            // Increment view count
            this.prisma.libraryVideoLesson.update({
              where: { id: videoId },
              data: { views: { increment: 1 } },
            }),
            // Record the unique view
            this.prisma.libraryVideoView.create({
              data: {
                videoId: videoId,
                userId: !isLibraryUser ? userId : null,
                libraryResourceUserId: isLibraryUser ? userId : null,
              },
            }),
          ]);

          updatedViews = video.views + 1;
          const userType = isLibraryUser ? 'library user' : 'user';
          this.logger.log(colors.green(`✅ New unique view recorded for video: ${video.title} by ${userType}: ${userId} (Total views: ${updatedViews})`));
        } catch (viewError) {
          // If view tracking fails, log error but still return video
          this.logger.error(colors.red(`❌ Failed to track view: ${viewError.message}`));
          this.logger.warn(colors.yellow(`⚠️ Video playback will continue despite view tracking failure`));
          // Don't throw - allow video playback to continue
        }
      } else {
        this.logger.log(colors.yellow(`⚠️ User ${userId} has already viewed video: ${video.title} (View not counted)`));
      }

      const responseData = {
        ...video,
        views: updatedViews,
        hasViewedBefore: !!existingView,
      };

      this.logger.log(colors.green(`Video retrieved for playback: ${video.title} (Total unique views: ${updatedViews})`));
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
   * Track detailed video watch history (YouTube-like tracking)
   * Call this method when user stops watching or at regular intervals
   */
  async trackVideoWatch(
    user: any,
    videoId: string,
    watchData: {
      watchDurationSeconds?: number;
      lastWatchPosition?: number;
      deviceType?: string;
      platform?: string;
      referrerSource?: string;
      videoQuality?: string;
      playbackSpeed?: number;
      bufferingEvents?: number;
      sessionId?: string;
      userAgent?: string;
    }
  ): Promise<ApiResponse<any>> {
    try {
      // Extract userId and determine user type
      const userId = user.sub || user.id;
      let isLibraryUser = false;
      
      if (!userId) {
        throw new BadRequestException('Invalid user session');
      }

      // Determine user type
      const regularUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          school_id: true,
          role: true,
          student: { select: { current_class_id: true } }
        }
      });

      if (!regularUser) {
        const libraryUser = await this.prisma.libraryResourceUser.findUnique({
          where: { id: userId },
          select: { id: true }
        });

        if (!libraryUser) {
          throw new NotFoundException('User not found');
        }
        
        isLibraryUser = true;
      }

      // Get video details
      const video = await this.prisma.libraryVideoLesson.findUnique({
        where: { id: videoId },
        select: { id: true, title: true, durationSeconds: true }
      });

      if (!video) {
        throw new NotFoundException('Video not found');
      }

      // Calculate completion percentage
      const completionPercentage = video.durationSeconds && watchData.watchDurationSeconds
        ? Math.min(100, (watchData.watchDurationSeconds / video.durationSeconds) * 100)
        : 0;

      const isCompleted = completionPercentage >= 90; // Consider 90%+ as completed

      // Prepare watch history data
      const watchHistoryData: any = {
        videoId,
        userId: !isLibraryUser ? userId : null,
        libraryResourceUserId: isLibraryUser ? userId : null,
        schoolId: regularUser?.school_id || null,
        classId: regularUser?.student?.current_class_id || null,
        userRole: regularUser?.role || null,
        watchDurationSeconds: watchData.watchDurationSeconds,
        videoDurationSeconds: video.durationSeconds,
        completionPercentage: Math.round(completionPercentage * 10) / 10, // Round to 1 decimal
        isCompleted,
        lastWatchPosition: watchData.lastWatchPosition || 0,
        watchCount: 1,
        deviceType: watchData.deviceType,
        platform: watchData.platform,
        referrerSource: watchData.referrerSource,
        videoQuality: watchData.videoQuality,
        bufferingEvents: watchData.bufferingEvents || 0,
        playbackSpeed: watchData.playbackSpeed || 1.0,
        sessionId: watchData.sessionId,
        userAgent: watchData.userAgent,
      };

      // Create watch history record
      const watchHistory = await this.prisma.libraryVideoWatchHistory.create({
        data: watchHistoryData
      });

      this.logger.log(colors.green(
        `📺 Watch tracked: ${video.title} | User: ${userId} | ` +
        `Completion: ${completionPercentage.toFixed(1)}% | ` +
        `Duration: ${watchData.watchDurationSeconds}s | ` +
        `Completed: ${isCompleted ? 'Yes ✓' : 'No'}`
      ));

      return new ApiResponse(
        true,
        'Watch history tracked successfully',
        {
          watchId: watchHistory.id,
          completionPercentage: watchHistory.completionPercentage,
          isCompleted: watchHistory.isCompleted
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to track watch history: ${error.message}`));
      // Don't throw - tracking failure shouldn't block video playback
      return new ApiResponse(false, 'Failed to track watch history', null);
    }
  }

  /**
   * Get user's watch history (chronological)
   */
  async getUserWatchHistory(
    user: any,
    options: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<any>> {
    try {
      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const userId = user.sub || user.id;
      let isLibraryUser = false;

      // Determine user type
      const regularUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!regularUser) {
        const libraryUser = await this.prisma.libraryResourceUser.findUnique({
          where: { id: userId },
          select: { id: true }
        });

        if (!libraryUser) {
          throw new NotFoundException('User not found');
        }
        
        isLibraryUser = true;
      }

      // Get watch history
      const [history, total] = await Promise.all([
        this.prisma.libraryVideoWatchHistory.findMany({
          where: isLibraryUser
            ? { libraryResourceUserId: userId }
            : { userId },
          include: {
            video: {
              select: {
                id: true,
                title: true,
                description: true,
                thumbnailUrl: true,
                durationSeconds: true,
                views: true,
                subject: {
                  select: { id: true, name: true, code: true, color: true }
                },
                topic: {
                  select: { id: true, title: true }
                }
              }
            }
          },
          orderBy: { watchedAt: 'desc' },
          take: limit,
          skip
        }),
        this.prisma.libraryVideoWatchHistory.count({
          where: isLibraryUser
            ? { libraryResourceUserId: userId }
            : { userId }
        })
      ]);

      this.logger.log(colors.blue(`📋 Watch history retrieved: ${history.length} records for user: ${userId}`));

      return new ApiResponse(true, 'Watch history retrieved successfully', {
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      this.logger.error(colors.red(`Error retrieving watch history: ${error.message}`));
      throw new InternalServerErrorException('Failed to retrieve watch history');
    }
  }

  /**
   * Get "Continue Watching" videos (10-90% completion)
   */
  async getContinueWatching(user: any): Promise<ApiResponse<any>> {
    try {
      const userId = user.sub || user.id;
      let isLibraryUser = false;

      // Determine user type
      const regularUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!regularUser) {
        const libraryUser = await this.prisma.libraryResourceUser.findUnique({
          where: { id: userId },
          select: { id: true }
        });

        if (!libraryUser) {
          throw new NotFoundException('User not found');
        }
        
        isLibraryUser = true;
      }

      // Get videos with partial completion
      const continueWatching = await this.prisma.libraryVideoWatchHistory.findMany({
        where: {
          ...(isLibraryUser
            ? { libraryResourceUserId: userId }
            : { userId }
          ),
          completionPercentage: { gte: 10, lte: 90 },
          isCompleted: false
        },
        distinct: ['videoId'],
        include: {
          video: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnailUrl: true,
              durationSeconds: true,
              subject: { select: { name: true, color: true } },
              topic: { select: { title: true } }
            }
          }
        },
        orderBy: { watchedAt: 'desc' },
        take: 10
      });

      const enriched = continueWatching.map(watch => ({
        ...watch.video,
        watchProgress: {
          lastPosition: watch.lastWatchPosition,
          completionPercentage: watch.completionPercentage,
          lastWatched: watch.watchedAt,
          watchDuration: watch.watchDurationSeconds
        }
      }));

      this.logger.log(colors.blue(`▶️ Continue watching: ${enriched.length} videos for user: ${userId}`));

      return new ApiResponse(true, 'Continue watching videos retrieved', enriched);
    } catch (error) {
      this.logger.error(colors.red(`Error retrieving continue watching: ${error.message}`));
      throw new InternalServerErrorException('Failed to retrieve continue watching');
    }
  }

  /**
   * Delete a video
   */
  async deleteVideo(user: any, videoId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Deleting video: ${videoId} for library user: ${user.email}`));

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
      const video = await this.prisma.libraryVideoLesson.findFirst({
        where: {
          id: videoId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          videoS3Key: true,
          thumbnailS3Key: true,
          topicId: true,
          order: true,
        },
      }) as any;

      if (!video) {
        this.logger.error(colors.red(`Video not found or does not belong to your platform: ${videoId}`));
        throw new NotFoundException('Video not found or does not belong to your platform');
      }

      // Delete in transaction: files first, then database
      await this.prisma.$transaction(async (tx) => {
        // Delete video file from storage
        if (video.videoS3Key) {
          try {
            await this.s3Service.deleteFile(video.videoS3Key);
            this.logger.log(colors.green(`✅ Deleted video file from storage: ${video.videoS3Key}`));
          } catch (error) {
            this.logger.error(colors.yellow(`⚠️ Failed to delete video file from storage: ${error.message}`));
            // Continue with DB deletion even if file deletion fails
          }
        }

        // Delete thumbnail from storage
        if (video.thumbnailS3Key) {
          try {
            await this.s3Service.deleteFile(video.thumbnailS3Key);
            this.logger.log(colors.green(`✅ Deleted thumbnail from storage: ${video.thumbnailS3Key}`));
          } catch (error) {
            this.logger.error(colors.yellow(`⚠️ Failed to delete thumbnail from storage: ${error.message}`));
            // Continue with DB deletion even if file deletion fails
          }
        }

        // Delete from database
        await tx.libraryVideoLesson.delete({
          where: { id: videoId },
        });

        // Reorder remaining videos in the same topic (close gaps)
        // Get all videos in the same topic with order greater than deleted video's order
        const videosToReorder = await tx.libraryVideoLesson.findMany({
          where: {
            topicId: video.topicId,
            platformId: libraryUser.platformId,
            order: {
              gt: video.order,
            },
          },
          select: {
            id: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        });

        // Decrement order for all videos after the deleted one
        for (const vid of videosToReorder) {
          await tx.libraryVideoLesson.update({
            where: { id: vid.id },
            data: { order: vid.order - 1 },
          });
        }

        if (videosToReorder.length > 0) {
          this.logger.log(colors.cyan(`🔄 Reordered ${videosToReorder.length} video(s) after deletion`));
        }
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      this.logger.log(colors.green(`✅ Video deleted successfully: ${video.title}`));
      return new ApiResponse(true, 'Video deleted successfully', { id: videoId, title: video.title });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error deleting video: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to delete video');
    }
  }

  /**
   * Update a video (title, description, order swap)
   */
  async updateVideo(user: any, videoId: string, payload: UpdateLibraryVideoDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Updating video: ${videoId} for library user: ${user.email}`));

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

      // Get current video and verify it belongs to user's platform
      const currentVideo = await this.prisma.libraryVideoLesson.findFirst({
        where: {
          id: videoId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          topicId: true,
        },
      }) as any;

      if (!currentVideo) {
        this.logger.error(colors.red(`Video not found or does not belong to your platform: ${videoId}`));
        throw new NotFoundException('Video not found or does not belong to your platform');
      }

      // Update in transaction
      const updatedVideo = await this.prisma.$transaction(async (tx) => {
        // If swapping order, handle that first
        if (payload.swapOrderWith) {
          // Get target video
          const targetVideo = await tx.libraryVideoLesson.findFirst({
            where: {
              id: payload.swapOrderWith,
              platformId: libraryUser.platformId,
              topicId: currentVideo.topicId, // Must be in same topic
            },
            select: {
              id: true,
              order: true,
            },
          }) as any;

          if (!targetVideo) {
            throw new NotFoundException('Target video not found, does not belong to your platform, or is not in the same topic');
          }

          // Swap orders
          await tx.libraryVideoLesson.update({
            where: { id: videoId },
            data: { order: targetVideo.order },
          });

          await tx.libraryVideoLesson.update({
            where: { id: payload.swapOrderWith },
            data: { order: currentVideo.order },
          });

          this.logger.log(colors.cyan(`🔄 Swapped orders: Video ${videoId} (${currentVideo.order} ↔ ${targetVideo.order}) with Video ${payload.swapOrderWith}`));
        }

        // Build update data (title, description)
        const updateData: any = {};
        if (payload.title !== undefined) updateData.title = payload.title;
        if (payload.description !== undefined) updateData.description = payload.description ?? null;

        // Update video if there are other fields to update
        if (Object.keys(updateData).length > 0) {
          return await tx.libraryVideoLesson.update({
            where: { id: videoId },
            data: updateData,
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
          });
        } else {
          // If only order swap, just return the updated video
          const video = await tx.libraryVideoLesson.findUnique({
            where: { id: videoId },
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
          });
          if (!video) {
            throw new NotFoundException('Video not found after update');
          }
          return video;
        }
      }, {
        maxWait: 5000,
        timeout: 15000,
      }) as any;

      if (!updatedVideo) {
        throw new NotFoundException('Video not found after update');
      }

      this.logger.log(colors.green(`✅ Video updated successfully: ${updatedVideo.title}`));
      return new ApiResponse(true, 'Video updated successfully', updatedVideo);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error updating video: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to update video');
    }
  }

  /**
   * Delete a material
   */
  async deleteMaterial(user: any, materialId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Deleting material: ${materialId} for library user: ${user.email}`));

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

      // Get material and verify it belongs to user's platform
      const material = await this.prisma.libraryMaterial.findFirst({
        where: {
          id: materialId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          s3Key: true,
          topicId: true,
          order: true,
        },
      }) as any;

      if (!material) {
        this.logger.error(colors.red(`Material not found or does not belong to your platform: ${materialId}`));
        throw new NotFoundException('Material not found or does not belong to your platform');
      }

      // Delete in transaction: file first, then database
      await this.prisma.$transaction(async (tx) => {
        // Delete material file from storage
        if (material.s3Key) {
          try {
            await this.s3Service.deleteFile(material.s3Key);
            this.logger.log(colors.green(`✅ Deleted material file from storage: ${material.s3Key}`));
          } catch (error) {
            this.logger.error(colors.yellow(`⚠️ Failed to delete material file from storage: ${error.message}`));
            // Continue with DB deletion even if file deletion fails
          }
        }

        // Delete from database
        await tx.libraryMaterial.delete({
          where: { id: materialId },
        });

        // Reorder remaining materials in the same topic (close gaps)
        const materialsToReorder = await tx.libraryMaterial.findMany({
          where: {
            topicId: material.topicId,
            platformId: libraryUser.platformId,
            order: {
              gt: material.order,
            },
          },
          select: {
            id: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        });

        // Decrement order for all materials after the deleted one
        for (const mat of materialsToReorder) {
          await tx.libraryMaterial.update({
            where: { id: mat.id },
            data: { order: mat.order - 1 },
          });
        }

        if (materialsToReorder.length > 0) {
          this.logger.log(colors.cyan(`🔄 Reordered ${materialsToReorder.length} material(s) after deletion`));
        }
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      this.logger.log(colors.green(`✅ Material deleted successfully: ${material.title}`));
      return new ApiResponse(true, 'Material deleted successfully', { id: materialId, title: material.title });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error deleting material: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to delete material');
    }
  }

  /**
   * Delete a link
   */
  async deleteLink(user: any, linkId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Deleting link: ${linkId} for library user: ${user.email}`));

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

      // Get link and verify it belongs to user's platform
      const link = await this.prisma.libraryLink.findFirst({
        where: {
          id: linkId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          topicId: true,
          order: true,
        },
      }) as any;

      if (!link) {
        this.logger.error(colors.red(`Link not found or does not belong to your platform: ${linkId}`));
        throw new NotFoundException('Link not found or does not belong to your platform');
      }

      // Delete in transaction
      await this.prisma.$transaction(async (tx) => {
        // Delete from database (links don't have files, just URLs)
        await tx.libraryLink.delete({
          where: { id: linkId },
        });

        // Reorder remaining links in the same topic (close gaps)
        if (link.topicId) {
          const linksToReorder = await tx.libraryLink.findMany({
            where: {
              topicId: link.topicId,
              platformId: libraryUser.platformId,
              order: {
                gt: link.order,
              },
            },
            select: {
              id: true,
              order: true,
            },
            orderBy: {
              order: 'asc',
            },
          });

          // Decrement order for all links after the deleted one
          for (const l of linksToReorder) {
            await tx.libraryLink.update({
              where: { id: l.id },
              data: { order: l.order - 1 },
            });
          }

          if (linksToReorder.length > 0) {
            this.logger.log(colors.cyan(`🔄 Reordered ${linksToReorder.length} link(s) after deletion`));
          }
        }
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      this.logger.log(colors.green(`✅ Link deleted successfully: ${link.title}`));
      return new ApiResponse(true, 'Link deleted successfully', { id: linkId, title: link.title });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error deleting link: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to delete link');
    }
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(user: any, assignmentId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CONTENT] Deleting assignment: ${assignmentId} for library user: ${user.email}`));

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

      // Get assignment and verify it belongs to user's platform
      const assignment = await this.prisma.libraryAssignment.findFirst({
        where: {
          id: assignmentId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          attachmentS3Key: true,
          topicId: true,
          order: true,
        },
      }) as any;

      if (!assignment) {
        this.logger.error(colors.red(`Assignment not found or does not belong to your platform: ${assignmentId}`));
        throw new NotFoundException('Assignment not found or does not belong to your platform');
      }

      // Delete in transaction: file first, then database
      await this.prisma.$transaction(async (tx) => {
        // Delete assignment file from storage
        if (assignment.attachmentS3Key) {
          try {
            await this.s3Service.deleteFile(assignment.attachmentS3Key);
            this.logger.log(colors.green(`✅ Deleted assignment file from storage: ${assignment.attachmentS3Key}`));
          } catch (error) {
            this.logger.error(colors.yellow(`⚠️ Failed to delete assignment file from storage: ${error.message}`));
            // Continue with DB deletion even if file deletion fails
          }
        }

        // Delete from database
        await tx.libraryAssignment.delete({
          where: { id: assignmentId },
        });

        // Reorder remaining assignments in the same topic (close gaps)
        const assignmentsToReorder = await tx.libraryAssignment.findMany({
          where: {
            topicId: assignment.topicId,
            platformId: libraryUser.platformId,
            order: {
              gt: assignment.order,
            },
          },
          select: {
            id: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        });

        // Decrement order for all assignments after the deleted one
        for (const ass of assignmentsToReorder) {
          await tx.libraryAssignment.update({
            where: { id: ass.id },
            data: { order: ass.order - 1 },
          });
        }

        if (assignmentsToReorder.length > 0) {
          this.logger.log(colors.cyan(`🔄 Reordered ${assignmentsToReorder.length} assignment(s) after deletion`));
        }
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      this.logger.log(colors.green(`✅ Assignment deleted successfully: ${assignment.title}`));
      return new ApiResponse(true, 'Assignment deleted successfully', { id: assignmentId, title: assignment.title });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error deleting assignment: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to delete assignment');
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

  /**
   * Helper: Extract video duration from video file buffer
   */
  private async extractVideoDuration(videoFile: Express.Multer.File): Promise<number | null> {
    return new Promise((resolve) => {
      try {
        // Create a temporary file from the buffer
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, `temp_video_${Date.now()}_${videoFile.originalname}`);
        
        fs.writeFileSync(tempFilePath, videoFile.buffer);
        
        // Use ffprobe to get video metadata
        ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
          // Clean up temp file
          try {
            fs.unlinkSync(tempFilePath);
          } catch (cleanupErr) {
            this.logger.warn(colors.yellow(`⚠️ Failed to clean up temp file: ${cleanupErr.message}`));
          }

          if (err) {
            this.logger.warn(colors.yellow(`⚠️ Could not extract video duration: ${err.message}`));
            return resolve(null);
          }

          const duration = metadata?.format?.duration;
          if (duration && !isNaN(duration)) {
            this.logger.log(colors.cyan(`📹 Video duration: ${Math.floor(duration)} seconds`));
            return resolve(Math.floor(duration));
          }

          this.logger.warn(colors.yellow(`⚠️ Video duration not found in metadata`));
          return resolve(null);
        });
      } catch (error) {
        this.logger.warn(colors.yellow(`⚠️ Error extracting video duration: ${error.message}`));
        return resolve(null);
      }
    });
  }
}

