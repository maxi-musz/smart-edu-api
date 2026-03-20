import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudFrontService } from './cloudfront.service';
import { HlsTranscodeStatus } from '@prisma/client';
import { TranscodeProvider } from './transcode-providers';
import { FfmpegTranscodeProvider } from './transcode-providers/ffmpeg.provider';
import { MediaConvertTranscodeProvider } from './transcode-providers/mediaconvert.provider';
import * as colors from 'colors';

interface TranscodeResult {
  success: boolean;
  hlsPlaybackUrl?: string;
  hlsS3Prefix?: string;
  error?: string;
  attempts?: number;
}

interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
}

/**
 * HLS Transcode Service with pluggable providers.
 *
 * Set HLS_TRANSCODE_PROVIDER env var to switch providers:
 * - 'ffmpeg' (default): Local FFmpeg transcoding (free, uses server CPU)
 * - 'mediaconvert': AWS MediaConvert (paid ~$0.015/min, fast, managed)
 *
 * Concurrency is capped by MAX_CONCURRENT_TRANSCODES (default 2) so that
 * a burst of uploads doesn't overwhelm the server. Excess jobs wait in line.
 */
@Injectable()
export class HlsTranscodeService {
  private readonly logger = new Logger(HlsTranscodeService.name);
  private readonly provider: TranscodeProvider;
  private readonly providerName: string;

  private readonly maxConcurrentTranscodes: number;
  private activeTranscodes = 0;
  private readonly transcodeQueue: Array<{
    run: () => Promise<TranscodeResult>;
    resolve: (v: TranscodeResult) => void;
    reject: (e: any) => void;
  }> = [];

  // Retry configuration
  private readonly retryConfig: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 30000, // 30 seconds
    maxDelayMs: 120000, // 2 minutes
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudFrontService: CloudFrontService,
    private readonly configService: ConfigService,
    private readonly ffmpegProvider: FfmpegTranscodeProvider,
    private readonly mediaConvertProvider: MediaConvertTranscodeProvider,
  ) {
    // Select provider based on env var (default: ffmpeg)
    this.providerName =
      this.configService.get<string>('HLS_TRANSCODE_PROVIDER') || 'ffmpeg';

    if (this.providerName.toLowerCase() === 'mediaconvert') {
      this.provider = this.mediaConvertProvider;
    } else {
      this.provider = this.ffmpegProvider;
    }

    this.maxConcurrentTranscodes =
      Number(this.configService.get('MAX_CONCURRENT_TRANSCODES')) || 2;
  }

  /**
   * Enqueue a transcode job. If we're below the concurrency cap it runs
   * immediately; otherwise it waits until a slot opens up.
   */
  private enqueueTranscode(
    run: () => Promise<TranscodeResult>,
  ): Promise<TranscodeResult> {
    if (this.activeTranscodes < this.maxConcurrentTranscodes) {
      return this.runTranscodeSlot(run);
    }

    this.logger.log(
      colors.yellow(
        `⏳ Transcode queued (${this.transcodeQueue.length + 1} waiting, ${this.activeTranscodes} active)`,
      ),
    );

    return new Promise<TranscodeResult>((resolve, reject) => {
      this.transcodeQueue.push({ run, resolve, reject });
    });
  }

  private async runTranscodeSlot(
    run: () => Promise<TranscodeResult>,
  ): Promise<TranscodeResult> {
    this.activeTranscodes++;
    try {
      return await run();
    } finally {
      this.activeTranscodes--;
      this.drainQueue();
    }
  }

  private drainQueue(): void {
    if (
      this.transcodeQueue.length > 0 &&
      this.activeTranscodes < this.maxConcurrentTranscodes
    ) {
      const next = this.transcodeQueue.shift()!;
      this.runTranscodeSlot(next.run).then(next.resolve, next.reject);
    }
  }

  /**
   * Log the active HLS transcode provider (called from main.ts after app init so it appears last).
   */
  logActiveProvider(): void {
    this.logger.log(
      colors.cyan(
        `🎬 HLS Active provider: ${this.provider.name} (HLS_TRANSCODE_PROVIDER=${this.providerName})`,
      ),
    );
  }

  /**
   * Master playlist filename differs by provider: MediaConvert uses main.m3u8, FFmpeg uses master.m3u8.
   */
  private getMasterPlaylistFilename(): string {
    return this.providerName.toLowerCase() === 'mediaconvert'
      ? 'main.m3u8'
      : 'master.m3u8';
  }

  /**
   * Calculate delay for exponential backoff
   */
  private getRetryDelay(attempt: number): number {
    const delay = this.retryConfig.initialDelayMs * Math.pow(2, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Options for transcode when the source file is already on disk (e.g. right after upload).
   * When set, skips downloading from S3 and uses the local file instead.
   */
  async transcodeLibraryVideo(
    videoId: string,
    options?: { localFilePath: string },
  ): Promise<TranscodeResult> {
    return this.enqueueTranscode(() =>
      this.doTranscodeLibraryVideo(videoId, options),
    );
  }

  private async doTranscodeLibraryVideo(
    videoId: string,
    options?: { localFilePath: string },
  ): Promise<TranscodeResult> {
    this.logger.log(
      colors.cyan(`🎬 Starting HLS transcode for library video: ${videoId}`),
    );

    let lastError: string = '';

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        this.logger.log(
          colors.blue(
            `🔄 Transcode attempt ${attempt}/${this.retryConfig.maxAttempts} for library video: ${videoId}`,
          ),
        );

        // Get video details
        const video = await this.prisma.libraryVideoLesson.findUnique({
          where: { id: videoId },
          select: {
            id: true,
            title: true,
            videoS3Key: true,
            platformId: true,
            subjectId: true,
            topicId: true,
          },
        });

        if (!video) {
          throw new Error(`Video not found: ${videoId}`);
        }

        if (!video.videoS3Key) {
          throw new Error(`Video has no S3 key: ${videoId}`);
        }

        // Update status to processing
        await this.prisma.libraryVideoLesson.update({
          where: { id: videoId },
          data: { hlsStatus: HlsTranscodeStatus.processing },
        });

        // Define HLS output prefix (simplified path)
        // Previous (more verbose) structure:
        // library/videos-hls/platforms/${video.platformId}/subjects/${video.subjectId}/topics/${video.topicId || 'general'}/${videoId}
        // Now we just use the videoId to keep URLs shorter and cleaner.
        const hlsS3Prefix = `library/videos-hls/${videoId}`;

        // Perform transcode (use local file when provided to avoid re-downloading from S3)
        const result = await this.performTranscode(
          video.videoS3Key,
          hlsS3Prefix,
          video.title,
          options?.localFilePath,
        );

        if (result.success) {
          // Build CloudFront URL for the master playlist (MediaConvert: main.m3u8, FFmpeg: master.m3u8)
          const masterPlaylist = this.getMasterPlaylistFilename();
          const hlsPlaybackUrl = this.cloudFrontService.getUrl(
            `${hlsS3Prefix}/${masterPlaylist}`,
            `https://${this.configService.get('AWS_S3_BUCKET')}.s3.amazonaws.com/${hlsS3Prefix}/${masterPlaylist}`,
          );

          // Update video with HLS info
          await this.prisma.libraryVideoLesson.update({
            where: { id: videoId },
            data: {
              hlsPlaybackUrl,
              hlsS3Prefix,
              hlsStatus: HlsTranscodeStatus.completed,
            },
          });

          this.logger.log(
            colors.green(
              `✅ HLS transcode completed for library video: ${videoId} (attempt ${attempt})`,
            ),
          );
          return {
            success: true,
            hlsPlaybackUrl,
            hlsS3Prefix,
            attempts: attempt,
          };
        } else {
          throw new Error(result.error || 'Transcode failed');
        }
      } catch (error) {
        lastError = error.message;
        this.logger.error(
          colors.red(
            `❌ Attempt ${attempt} failed for library video ${videoId}: ${error.message}`,
          ),
        );

        // If not the last attempt, wait and retry
        if (attempt < this.retryConfig.maxAttempts) {
          const delay = this.getRetryDelay(attempt);
          this.logger.log(colors.yellow(`⏳ Retrying in ${delay / 1000}s...`));
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted - mark as failed
    this.logger.error(
      colors.red(
        `❌ All ${this.retryConfig.maxAttempts} attempts failed for library video ${videoId}`,
      ),
    );
    await this.prisma.libraryVideoLesson.update({
      where: { id: videoId },
      data: { hlsStatus: HlsTranscodeStatus.failed },
    });

    return {
      success: false,
      error: lastError,
      attempts: this.retryConfig.maxAttempts,
    };
  }

  /**
   * Transcode a school video to HLS format with automatic retry.
   * Pass options.localFilePath when the file is already on disk (e.g. right after upload) to skip S3 download.
   */
  async transcodeSchoolVideo(
    videoId: string,
    options?: { localFilePath: string },
  ): Promise<TranscodeResult> {
    return this.enqueueTranscode(() =>
      this.doTranscodeSchoolVideo(videoId, options),
    );
  }

  private async doTranscodeSchoolVideo(
    videoId: string,
    options?: { localFilePath: string },
  ): Promise<TranscodeResult> {
    this.logger.log(
      colors.cyan(`🎬 Starting HLS transcode for school video: ${videoId}`),
    );

    let lastError: string = '';

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        this.logger.log(
          colors.blue(
            `🔄 Transcode attempt ${attempt}/${this.retryConfig.maxAttempts} for school video: ${videoId}`,
          ),
        );

        // Get video details
        const video = await this.prisma.videoContent.findUnique({
          where: { id: videoId },
          select: {
            id: true,
            title: true,
            videoS3Key: true,
            schoolId: true,
            platformId: true,
            topic_id: true,
          },
        });

        if (!video) {
          throw new Error(`Video not found: ${videoId}`);
        }

        if (!video.videoS3Key) {
          throw new Error(`Video has no S3 key: ${videoId}`);
        }

        // Update status to processing
        await this.prisma.videoContent.update({
          where: { id: videoId },
          data: { hlsStatus: HlsTranscodeStatus.processing },
        });

        // Define HLS output prefix
        const hlsS3Prefix = `school/videos-hls/schools/${video.schoolId || 'general'}/topics/${video.topic_id || 'general'}/${videoId}`;

        // Perform transcode (use local file when provided to avoid re-downloading from S3)
        const result = await this.performTranscode(
          video.videoS3Key,
          hlsS3Prefix,
          video.title,
          options?.localFilePath,
        );

        if (result.success) {
          // Build CloudFront URL for the master playlist (MediaConvert: main.m3u8, FFmpeg: master.m3u8)
          const masterPlaylist = this.getMasterPlaylistFilename();
          const hlsPlaybackUrl = this.cloudFrontService.getUrl(
            `${hlsS3Prefix}/${masterPlaylist}`,
            `https://${this.configService.get('AWS_S3_BUCKET')}.s3.amazonaws.com/${hlsS3Prefix}/${masterPlaylist}`,
          );

          // Update video with HLS info
          await this.prisma.videoContent.update({
            where: { id: videoId },
            data: {
              hlsPlaybackUrl,
              hlsS3Prefix,
              hlsStatus: HlsTranscodeStatus.completed,
            },
          });

          this.logger.log(
            colors.green(
              `✅ HLS transcode completed for school video: ${videoId} (attempt ${attempt})`,
            ),
          );
          return {
            success: true,
            hlsPlaybackUrl,
            hlsS3Prefix,
            attempts: attempt,
          };
        } else {
          throw new Error(result.error || 'Transcode failed');
        }
      } catch (error) {
        lastError = error.message;
        this.logger.error(
          colors.red(
            `❌ Attempt ${attempt} failed for school video ${videoId}: ${error.message}`,
          ),
        );

        // If not the last attempt, wait and retry
        if (attempt < this.retryConfig.maxAttempts) {
          const delay = this.getRetryDelay(attempt);
          this.logger.log(colors.yellow(`⏳ Retrying in ${delay / 1000}s...`));
          await this.sleep(delay);
        }
      }
    }

    // All retries exhausted - mark as failed
    this.logger.error(
      colors.red(
        `❌ All ${this.retryConfig.maxAttempts} attempts failed for school video ${videoId}`,
      ),
    );
    await this.prisma.videoContent.update({
      where: { id: videoId },
      data: { hlsStatus: HlsTranscodeStatus.failed },
    });

    return {
      success: false,
      error: lastError,
      attempts: this.retryConfig.maxAttempts,
    };
  }

  /**
   * Core transcode logic - delegates to the configured provider (FFmpeg or MediaConvert).
   */
  private async performTranscode(
    sourceS3Key: string,
    hlsS3Prefix: string,
    title: string,
    localFilePath?: string,
  ): Promise<TranscodeResult> {
    this.logger.log(
      colors.cyan(`🎬 Using ${this.provider.name} for transcoding`),
    );

    const result = await this.provider.transcode({
      sourceS3Key,
      hlsS3Prefix,
      title,
      localFilePath,
    });

    return result;
  }

  /**
   * Get transcode status for a library video
   */
  async getLibraryVideoTranscodeStatus(videoId: string) {
    const video = await this.prisma.libraryVideoLesson.findUnique({
      where: { id: videoId },
      select: {
        hlsStatus: true,
        hlsPlaybackUrl: true,
      },
    });
    return video;
  }

  /**
   * Get transcode status for a school video
   */
  async getSchoolVideoTranscodeStatus(videoId: string) {
    const video = await this.prisma.videoContent.findUnique({
      where: { id: videoId },
      select: {
        hlsStatus: true,
        hlsPlaybackUrl: true,
      },
    });
    return video;
  }

  /**
   * Retry failed transcode for a library video
   */
  async retryLibraryVideoTranscode(videoId: string): Promise<TranscodeResult> {
    // Reset status to pending first
    await this.prisma.libraryVideoLesson.update({
      where: { id: videoId },
      data: { hlsStatus: HlsTranscodeStatus.pending },
    });
    return this.transcodeLibraryVideo(videoId);
  }

  /**
   * Retry failed transcode for a school video
   */
  async retrySchoolVideoTranscode(videoId: string): Promise<TranscodeResult> {
    // Reset status to pending first
    await this.prisma.videoContent.update({
      where: { id: videoId },
      data: { hlsStatus: HlsTranscodeStatus.pending },
    });
    return this.transcodeSchoolVideo(videoId);
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Get all failed library video transcodes
   */
  async getFailedLibraryVideos() {
    return this.prisma.libraryVideoLesson.findMany({
      where: { hlsStatus: HlsTranscodeStatus.failed },
      select: {
        id: true,
        title: true,
        videoS3Key: true,
        hlsStatus: true,
        createdAt: true,
        updatedAt: true,
        platform: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get all failed school video transcodes
   */
  async getFailedSchoolVideos() {
    return this.prisma.videoContent.findMany({
      where: { hlsStatus: HlsTranscodeStatus.failed },
      select: {
        id: true,
        title: true,
        videoS3Key: true,
        hlsStatus: true,
        createdAt: true,
        updatedAt: true,
        school: { select: { id: true, school_name: true } },
        topic: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get transcode statistics
   */
  async getTranscodeStats() {
    const [libraryStats, schoolStats] = await Promise.all([
      this.prisma.libraryVideoLesson.groupBy({
        by: ['hlsStatus'],
        _count: { id: true },
      }),
      this.prisma.videoContent.groupBy({
        by: ['hlsStatus'],
        _count: { id: true },
      }),
    ]);

    const formatStats = (stats: any[]) => {
      const result: Record<string, number> = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        none: 0,
      };
      stats.forEach((s) => {
        const status = s.hlsStatus || 'none';
        result[status] = s._count.id;
      });
      return result;
    };

    return {
      library: formatStats(libraryStats),
      school: formatStats(schoolStats),
    };
  }

  /**
   * Retry all failed library video transcodes
   */
  async retryAllFailedLibraryVideos(): Promise<{
    queued: number;
    videoIds: string[];
  }> {
    const failedVideos = await this.prisma.libraryVideoLesson.findMany({
      where: { hlsStatus: HlsTranscodeStatus.failed },
      select: { id: true },
    });

    const videoIds = failedVideos.map((v) => v.id);

    // Trigger retries in background (don't await)
    videoIds.forEach((id) => {
      this.retryLibraryVideoTranscode(id)
        .then(() =>
          this.logger.log(
            colors.green(`✅ Retry completed for library video: ${id}`),
          ),
        )
        .catch((err) =>
          this.logger.error(
            colors.red(
              `❌ Retry failed for library video ${id}: ${err.message}`,
            ),
          ),
        );
    });

    return { queued: videoIds.length, videoIds };
  }

  /**
   * Retry all failed school video transcodes
   */
  async retryAllFailedSchoolVideos(): Promise<{
    queued: number;
    videoIds: string[];
  }> {
    const failedVideos = await this.prisma.videoContent.findMany({
      where: { hlsStatus: HlsTranscodeStatus.failed },
      select: { id: true },
    });

    const videoIds = failedVideos.map((v) => v.id);

    // Trigger retries in background (don't await)
    videoIds.forEach((id) => {
      this.retrySchoolVideoTranscode(id)
        .then(() =>
          this.logger.log(
            colors.green(`✅ Retry completed for school video: ${id}`),
          ),
        )
        .catch((err) =>
          this.logger.error(
            colors.red(
              `❌ Retry failed for school video ${id}: ${err.message}`,
            ),
          ),
        );
    });

    return { queued: videoIds.length, videoIds };
  }
}
