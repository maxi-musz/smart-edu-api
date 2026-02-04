import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudFrontService } from '../shared/services/cloudfront.service';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import * as colors from 'colors';

@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudFrontService: CloudFrontService,
  ) {}

  /**
   * Universal video playback endpoint
   * Supports both LibraryVideoLesson and VideoContent models
   * Tracks views, watch history, and provides playback URL
   */
  async playVideo(user: any, videoId: string, videoType?: 'library' | 'school') {
    const userId = user.sub || user.id;
    this.logger.log(colors.cyan(`🎥 Universal video playback requested: ${videoId} by user ${userId}`));

    try {
      // Try to determine video type if not provided
      if (!videoType) {
        videoType = await this.detectVideoType(videoId);
      }

      if (videoType === 'library') {
        return await this.playLibraryVideo(user, videoId);
      } else {
        return await this.playSchoolVideo(user, videoId);
      }
    } catch (error) {
      this.logger.error(colors.red(`❌ Error in universal video playback: ${error.message}`));
      throw error;
    }
  }

  /**
   * Detect video type by checking which table contains the video
   */
  private async detectVideoType(videoId: string): Promise<'library' | 'school'> {
    const [libraryVideo, schoolVideo] = await Promise.all([
      this.prisma.libraryVideoLesson.findUnique({ where: { id: videoId }, select: { id: true } }),
      this.prisma.videoContent.findUnique({ where: { id: videoId }, select: { id: true } }),
    ]);

    if (libraryVideo) return 'library';
    if (schoolVideo) return 'school';
    throw new NotFoundException('Video not found');
  }

  /**
   * Play library video (LibraryVideoLesson)
   * Supports both school users (User) and library users (LibraryResourceUser)
   */
  private async playLibraryVideo(user: any, videoId: string) {
    const userId = user.sub || user.id;
    
    // Detect user type: library users have platform_id, school users have school_id
    const isLibraryUser = !!user.platform_id;
    const isSchoolUser = !!user.school_id;

    this.logger.log(
      colors.cyan(
        `🎥 Library video playback: ${videoId} by ${isLibraryUser ? 'library' : 'school'} user ${userId}`,
      ),
    );

    const video = await this.prisma.libraryVideoLesson.findUnique({
      where: {
        id: videoId,
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        videoS3Key: true,
        hlsPlaybackUrl: true,
        hlsStatus: true,
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
            description: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            thumbnailUrl: true,
          },
        },
        platform: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found or not published');
    }

    // Build view query based on user type
    const viewWhere = {
      videoId: videoId,
      ...(isLibraryUser
        ? { libraryResourceUserId: userId }
        : isSchoolUser
          ? { userId: userId }
          : { userId: userId }), // Default to userId if type unclear
    };

    // Track unique view
    const existingView = await this.prisma.libraryVideoView.findFirst({
      where: viewWhere,
    });

    let updatedViews = video.views;

    if (!existingView) {
      // Build create data based on user type
      const viewData = {
        videoId: videoId,
        ...(isLibraryUser
          ? { libraryResourceUserId: userId, userId: null }
          : { userId: userId, libraryResourceUserId: null }),
      };

      await this.prisma.$transaction([
        this.prisma.libraryVideoLesson.update({
          where: { id: videoId },
          data: { views: { increment: 1 } },
        }),
        this.prisma.libraryVideoView.create({
          data: viewData,
        }),
      ]);

      updatedViews = video.views + 1;
      this.logger.log(
        colors.green(
          `✅ New unique view: "${video.title}" by ${isLibraryUser ? 'library' : 'school'} user (Total: ${updatedViews})`,
        ),
      );
    } else {
      this.logger.log(
        colors.yellow(
          `⚠️ Repeat view (not counted): "${video.title}" by ${isLibraryUser ? 'library' : 'school'} user`,
        ),
      );
    }

    // Get last watch position for resume functionality
    const watchHistoryWhere = {
      videoId: videoId,
      ...(isLibraryUser
        ? { libraryResourceUserId: userId }
        : { userId: userId }),
    };

    const lastWatch = await this.prisma.libraryVideoWatchHistory.findFirst({
      where: watchHistoryWhere,
      orderBy: { watchedAt: 'desc' },
      select: {
        lastWatchPosition: true,
        completionPercentage: true,
        isCompleted: true,
        watchedAt: true,
      },
    });

    // Build playback URL - prefer HLS if available, then CloudFront MP4, then S3
    const isHlsReady = video.hlsStatus === 'completed' && video.hlsPlaybackUrl;
    const playbackUrl = isHlsReady && video.hlsPlaybackUrl
      ? this.cloudFrontService.getHlsPlaybackUrl(video.hlsPlaybackUrl)
      : this.cloudFrontService.getVideoUrl(video.videoS3Key, video.videoUrl);

    // Remove internal fields from response
    const { hlsStatus, hlsPlaybackUrl, videoS3Key, ...videoData } = video;

    return ResponseHelper.success('Video retrieved for playback', {
      ...videoData,
      videoUrl: playbackUrl, // Use HLS or CloudFront URL when available
      streamingType: isHlsReady ? 'hls' : 'mp4', // Inform client of stream type
      views: updatedViews,
      hasViewedBefore: !!existingView,
      viewedAt: existingView?.viewedAt || null,
      lastWatchPosition: lastWatch?.lastWatchPosition || 0,
      completionPercentage: lastWatch?.completionPercentage || 0,
      isCompleted: lastWatch?.isCompleted || false,
      videoType: 'library',
    });
  }

  /**
   * Play school video (VideoContent)
   */
  private async playSchoolVideo(user: any, videoId: string) {
    const userId = user.sub || user.id;

    const video = await this.prisma.videoContent.findUnique({
      where: {
        id: videoId,
        status: 'published',
      },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        videoS3Key: true,
        hlsPlaybackUrl: true,
        hlsStatus: true,
        thumbnail: true,
        duration: true,
        size: true,
        views: true,
        order: true,
        createdAt: true,
        updatedAt: true,
        topic: {
          select: {
            id: true,
            title: true,
            description: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
              },
            },
          },
        },
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found or not published');
    }

    // Track unique view (YouTube-style - only count once per user)
    const existingView = await this.prisma.schoolVideoView.findFirst({
      where: {
        videoId: videoId,
        userId: userId,
      },
    });

    let updatedViews = video.views;

    // Only increment view count if this is a new unique view
    if (!existingView) {
      await this.prisma.$transaction([
        // Increment view count
        this.prisma.videoContent.update({
          where: { id: videoId },
          data: { views: { increment: 1 } },
        }),
        // Record the unique view
        this.prisma.schoolVideoView.create({
          data: {
            videoId: videoId,
            userId: userId,
          },
        }),
      ]);

      updatedViews = video.views + 1;
      this.logger.log(colors.green(`✅ New unique view: "${video.title}" by user ${userId} (Total: ${updatedViews})`));
    } else {
      this.logger.log(colors.yellow(`⚠️ Repeat view (not counted): "${video.title}" by user ${userId}`));
    }

    // Get last watch position for resume functionality
    const lastWatch = await this.prisma.schoolVideoWatchHistory.findFirst({
      where: {
        videoId: videoId,
        userId: userId,
      },
      orderBy: { watchedAt: 'desc' },
      select: {
        lastWatchPosition: true,
        completionPercentage: true,
        isCompleted: true,
        watchedAt: true,
      },
    });

    // Parse duration to seconds for consistency
    const durationSeconds = this.parseDurationToSeconds(video.duration || '00:00:00');

    // Build playback URL - prefer HLS if available, then CloudFront MP4, then S3
    const isHlsReady = video.hlsStatus === 'completed' && video.hlsPlaybackUrl;
    const playbackUrl = isHlsReady && video.hlsPlaybackUrl
      ? this.cloudFrontService.getHlsPlaybackUrl(video.hlsPlaybackUrl)
      : this.cloudFrontService.getVideoUrl(video.videoS3Key, video.url);

    return ResponseHelper.success('Video retrieved for playback', {
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl: playbackUrl, // Use HLS or CloudFront URL when available
      streamingType: isHlsReady ? 'hls' : 'mp4', // Inform client of stream type
      thumbnailUrl: video.thumbnail ? (video.thumbnail as any).secure_url || null : null,
      durationSeconds: durationSeconds,
      size: video.size,
      views: updatedViews,
      order: video.order,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
      topic: video.topic,
      subject: video.topic?.subject || null,
      school: video.school,
      hasViewedBefore: !!existingView,
      viewedAt: existingView?.viewedAt || null,
      lastWatchPosition: lastWatch?.lastWatchPosition || 0,
      completionPercentage: lastWatch?.completionPercentage || 0,
      isCompleted: lastWatch?.isCompleted || false,
      videoType: 'school',
    });
  }

  /**
   * Track video watch progress and history
   * Works for both library and school videos
   */
  async trackWatchProgress(
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
    },
    videoType?: 'library' | 'school',
  ) {
    const userId = user.sub || user.id;
    this.logger.log(colors.cyan(`📺 Watch progress update received: ${videoId} by user ${userId}`));
    this.logger.log(colors.blue(`   📊 Progress Data:`));
    this.logger.log(colors.blue(`      - Position: ${watchData.lastWatchPosition || 0}s`));
    this.logger.log(colors.blue(`      - Watch Duration: ${watchData.watchDurationSeconds || 0}s`));
    this.logger.log(colors.blue(`      - Device: ${watchData.deviceType || 'unknown'}`));
    this.logger.log(colors.blue(`      - Platform: ${watchData.platform || 'unknown'}`));
    this.logger.log(colors.blue(`      - Session: ${watchData.sessionId || 'none'}`));

    try {
      // Detect video type if not provided
      if (!videoType) {
        videoType = await this.detectVideoType(videoId);
      }

      if (videoType === 'library') {
        return await this.trackLibraryWatch(user, videoId, watchData);
      } else {
        return await this.trackSchoolWatch(user, videoId, watchData);
      }
    } catch (error) {
      this.logger.error(colors.red(`❌ Error tracking watch progress: ${error.message}`));
      throw error;
    }
  }

  /**
   * Track library video watch history
   * Supports both school users (User) and library users (LibraryResourceUser)
   */
  private async trackLibraryWatch(
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
    },
  ) {
    const userId = user.sub || user.id;
    
    // Detect user type: library users have platform_id, school users have school_id
    const isLibraryUser = !!user.platform_id;
    const isSchoolUser = !!user.school_id;

    // Get video details
    const video = await this.prisma.libraryVideoLesson.findUnique({
      where: { id: videoId },
      select: {
        durationSeconds: true,
        title: true,
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Get user context based on user type
    let schoolId: string | null = null;
    let classId: string | null = null;
    let userRole: string | null = null;

    if (isSchoolUser) {
      // Fetch school user context
      const regularUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          school_id: true,
          role: true,
          student: {
            select: { current_class_id: true },
          },
        },
      });
      schoolId = regularUser?.school_id || null;
      classId = regularUser?.student?.current_class_id || null;
      userRole = regularUser?.role || null;
    } else if (isLibraryUser) {
      // Library users don't have school/class context
      userRole = 'libraryresourceowner';
    } else {
      // Fallback: try to get user context
      const regularUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          school_id: true,
          role: true,
          student: {
            select: { current_class_id: true },
          },
        },
      });
      schoolId = regularUser?.school_id || null;
      classId = regularUser?.student?.current_class_id || null;
      userRole = regularUser?.role || null;
    }

    // Calculate completion percentage
    const completionPercentage =
      video.durationSeconds && watchData.watchDurationSeconds
        ? (watchData.watchDurationSeconds / video.durationSeconds) * 100
        : 0;

    const isCompleted = completionPercentage >= 90;

    // Build watch history data based on user type
    const watchHistoryData = {
      videoId,
      ...(isLibraryUser
        ? { libraryResourceUserId: userId, userId: null }
        : { userId: userId, libraryResourceUserId: null }),
      schoolId,
      classId,
      userRole,
      watchDurationSeconds: watchData.watchDurationSeconds,
      videoDurationSeconds: video.durationSeconds,
      completionPercentage: Math.round(completionPercentage * 10) / 10,
      isCompleted,
      lastWatchPosition: watchData.lastWatchPosition || 0,
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
      data: watchHistoryData,
    });

    this.logger.log(
      colors.green(
        `📺 Watch tracked: ${video.title} | Completion: ${completionPercentage.toFixed(1)}% | ` +
          `Position: ${watchData.lastWatchPosition}s | Completed: ${isCompleted ? 'Yes ✓' : 'No'} | ` +
          `User: ${isLibraryUser ? 'library' : 'school'}`,
      ),
    );

    return ResponseHelper.success('Watch progress tracked successfully', {
      watchId: watchHistory.id,
      completionPercentage: watchHistory.completionPercentage,
      isCompleted: watchHistory.isCompleted,
      lastWatchPosition: watchHistory.lastWatchPosition,
    });
  }

  /**
   * Track school video watch history
   */
  private async trackSchoolWatch(
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
    },
  ) {
    const userId = user.sub || user.id;

    // Get video details
    const video = await this.prisma.videoContent.findUnique({
      where: { id: videoId },
      select: {
        duration: true,
        title: true,
        schoolId: true,
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Get user context
    const regularUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        school_id: true,
        role: true,
        student: {
          select: { current_class_id: true },
        },
      },
    });

    // Parse duration to seconds
    const videoDurationSeconds = this.parseDurationToSeconds(video.duration || '00:00:00');

    // Calculate completion percentage
    const completionPercentage =
      videoDurationSeconds > 0 && watchData.watchDurationSeconds
        ? (watchData.watchDurationSeconds / videoDurationSeconds) * 100
        : 0;

    const isCompleted = completionPercentage >= 90;

    // Create watch history record
    const watchHistory = await this.prisma.schoolVideoWatchHistory.create({
      data: {
        videoId,
        userId: userId,
        schoolId: regularUser?.school_id || video.schoolId || null,
        classId: regularUser?.student?.current_class_id || null,
        userRole: regularUser?.role || null,
        watchDurationSeconds: watchData.watchDurationSeconds,
        videoDurationSeconds: videoDurationSeconds > 0 ? videoDurationSeconds : null,
        completionPercentage: Math.round(completionPercentage * 10) / 10,
        isCompleted,
        lastWatchPosition: watchData.lastWatchPosition || 0,
        deviceType: watchData.deviceType,
        platform: watchData.platform,
        referrerSource: watchData.referrerSource,
        videoQuality: watchData.videoQuality,
        bufferingEvents: watchData.bufferingEvents || 0,
        playbackSpeed: watchData.playbackSpeed || 1.0,
        sessionId: watchData.sessionId,
        userAgent: watchData.userAgent,
      },
    });

    this.logger.log(
      colors.green(
        `📺 Watch tracked: ${video.title} | Completion: ${completionPercentage.toFixed(1)}% | ` +
          `Position: ${watchData.lastWatchPosition}s | Completed: ${isCompleted ? 'Yes ✓' : 'No'}`,
      ),
    );

    return ResponseHelper.success('Watch progress tracked successfully', {
      watchId: watchHistory.id,
      completionPercentage: watchHistory.completionPercentage,
      isCompleted: watchHistory.isCompleted,
      lastWatchPosition: watchHistory.lastWatchPosition,
    });
  }

  /**
   * Parse duration string (HH:MM:SS) to seconds
   */
  private parseDurationToSeconds(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }
}

