import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as colors from 'colors';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as ffmpeg from 'fluent-ffmpeg';
import { S3Service } from '../shared/services/s3.service';
import { UploadProgressService } from '../school/ai-chat/upload-progress.service';
import type { IVideoUploadHandler, VideoUploadPersistParams } from './interfaces/video-upload-handler.interface';

const DEFAULT_MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500MB

export interface StartVideoUploadOptions {
  videoFile: Express.Multer.File;
  thumbnailFile?: Express.Multer.File;
  userId: string;
  progressContextId: string;
  handler: IVideoUploadHandler;
  title: string;
  description?: string | null;
  maxVideoSizeBytes?: number;
  logLabel?: string;
}

export interface StartVideoUploadResult {
  sessionId: string;
}

/**
 * Central video upload service. Implements the professional upload flow:
 * session creation → validate → S3 upload (video + optional thumbnail) with progress →
 * extract duration → persist via handler → optional HLS → completed.
 * Any module (library, teachers, etc.) can use this by providing an IVideoUploadHandler.
 */
@Injectable()
export class VideoUploadService {
  private readonly logger = new Logger(VideoUploadService.name);

  constructor(
    private readonly s3Service: S3Service,
    private readonly uploadProgressService: UploadProgressService,
  ) {}

  /**
   * Start a video upload session. Returns immediately with sessionId (202-style).
   * Upload runs in background; progress is reported via UploadProgressService.
   */
  startVideoUploadSession(options: StartVideoUploadOptions): StartVideoUploadResult {
    const {
      videoFile,
      thumbnailFile,
      userId,
      progressContextId,
      handler,
      maxVideoSizeBytes = DEFAULT_MAX_VIDEO_SIZE_BYTES,
      logLabel = 'Video',
    } = options;

    if (!videoFile) {
      throw new BadRequestException('Video file is required');
    }

    if (videoFile.size > maxVideoSizeBytes) {
      throw new BadRequestException(
        `Video file size exceeds ${Math.round(maxVideoSizeBytes / 1024 / 1024)}MB limit`,
      );
    }

    const totalBytes = videoFile.size + (thumbnailFile?.size || 0);
    const sessionId = this.uploadProgressService.createUploadSession(
      userId,
      progressContextId,
      totalBytes,
    );

    this.runUploadWithProgress({
      ...options,
      sessionId,
    }).catch((err) =>
      this.uploadProgressService.updateProgress(
        sessionId,
        'error',
        undefined,
        undefined,
        err?.message ?? String(err),
      ),
    );

    return { sessionId };
  }

  /**
   * Get current progress for a session (for polling). Returns null if session not found.
   */
  getProgress(sessionId: string) {
    return this.uploadProgressService.getCurrentProgress(sessionId);
  }

  /**
   * Subscribe to progress updates (for SSE). Use this so clients get the same instance that created the session.
   */
  subscribeToProgress(sessionId: string, callback: (progress: any) => void): () => void {
    return this.uploadProgressService.subscribeToProgress(sessionId, callback);
  }

  /**
   * Internal: run the full upload pipeline with progress updates.
   */
  private async runUploadWithProgress(
    options: StartVideoUploadOptions & { sessionId: string },
  ): Promise<void> {
    const {
      videoFile,
      thumbnailFile,
      sessionId,
      handler,
      logLabel = 'Video',
    } = options;

    this.logger.log(colors.cyan(`[${logLabel}] Starting video upload`));

    let smoother: NodeJS.Timeout | null = null;
    let s3Key: string | undefined;
    let thumbnailS3Key: string | undefined;
    let s3UploadSucceeded = false;
    let thumbnailUploadSucceeded = false;

    try {
      this.uploadProgressService.updateProgress(sessionId, 'validating', 0);

      if (handler.validate) {
        await handler.validate();
      }

      const totalBytes = videoFile.size + (thumbnailFile?.size || 0);
      let lastKnownLoaded = 0;
      let emittedLoaded = 0;
      const onePercent = Math.max(1, Math.floor(totalBytes / 100));
      const tickMs = 300;

      this.uploadProgressService.updateProgress(sessionId, 'uploading', 0);
      smoother = setInterval(() => {
        if (emittedLoaded < lastKnownLoaded) {
          const delta = Math.max(
            onePercent,
            Math.floor((lastKnownLoaded - emittedLoaded) / 3),
          );
          emittedLoaded = Math.min(emittedLoaded + delta, lastKnownLoaded);
          this.uploadProgressService.updateProgress(
            sessionId,
            'uploading',
            emittedLoaded,
          );
        }
      }, tickMs);

      const videoS3KeyFull = handler.getVideoS3Key();

      const videoUploadResult = await this.s3Service.uploadFile(
        videoFile,
        '',
        videoS3KeyFull,
        (loaded) => {
          lastKnownLoaded = Math.min(loaded, videoFile.size);
        },
      );

      s3Key = videoUploadResult.key;
      s3UploadSucceeded = true;

      let thumbnailUrl: string | null = null;
      let thumbnailS3KeyResult: string | null = null;
      if (thumbnailFile) {
        const thumbKey = handler.getThumbnailS3Key
          ? handler.getThumbnailS3Key(thumbnailFile.originalname)
          : `${videoS3KeyFull.replace(/\.[^.]+$/, '')}_thumbnail_${Date.now()}.${thumbnailFile.originalname.split('.').pop()}`;
        const thumbResult = await this.s3Service.uploadFile(
          thumbnailFile,
          '',
          thumbKey,
          (loaded) => {
            lastKnownLoaded = Math.min(
              videoFile.size + loaded,
              totalBytes,
            );
          },
        );
        thumbnailUrl = thumbResult.url;
        thumbnailS3KeyResult = thumbResult.key;
        thumbnailS3Key = thumbResult.key;
        thumbnailUploadSucceeded = true;
      }

      this.uploadProgressService.updateProgress(
        sessionId,
        'processing',
        lastKnownLoaded,
      );

      const durationSeconds = await this.extractVideoDuration(videoFile);

      this.uploadProgressService.updateProgress(sessionId, 'saving', lastKnownLoaded);

      const persistParams: VideoUploadPersistParams = {
        videoUrl: videoUploadResult.url,
        videoS3Key: s3Key,
        thumbnailUrl,
        thumbnailS3Key: thumbnailS3KeyResult,
        sizeBytes: videoFile.size,
        durationSeconds,
        title: options.title,
        description: options.description ?? null,
      };

      const persisted = await handler.persistVideo(persistParams);

      if (smoother) clearInterval(smoother);
      this.uploadProgressService.updateProgress(
        sessionId,
        'completed',
        totalBytes,
        undefined,
        undefined,
        persisted.id,
      );

      this.logger.log(colors.green(`✅ Video uploaded successfully: ${persisted.id}`));

      let localPathForTranscode: string | undefined;
      const transcodeTempDir = path.join(os.tmpdir(), 'hls-transcode');
      try {
        fs.mkdirSync(transcodeTempDir, { recursive: true });
        localPathForTranscode = path.join(
          transcodeTempDir,
          `upload_${persisted.id}_${Date.now()}.mp4`,
        );
        if (videoFile?.path && fs.existsSync(videoFile.path)) {
          fs.copyFileSync(videoFile.path, localPathForTranscode);
        } else if (videoFile?.buffer) {
          fs.writeFileSync(localPathForTranscode, videoFile.buffer);
        } else {
          localPathForTranscode = undefined;
        }
      } catch (copyErr) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Could not save for local transcode: ${copyErr.message}`,
          ),
        );
        localPathForTranscode = undefined;
      }

      // HLS is required for every video upload
      handler
        .triggerHls(persisted.id, localPathForTranscode)
        .then(() =>
          this.logger.log(
            colors.green(`✅ HLS transcode completed for: ${persisted.id}`),
          ),
        )
        .catch((err) =>
          this.logger.error(
            colors.red(`❌ HLS transcode failed for ${persisted.id}: ${err?.message ?? String(err)}`),
          ),
        );
    } catch (error) {
      if (smoother) clearInterval(smoother);
      this.uploadProgressService.updateProgress(
        sessionId,
        'error',
        undefined,
        undefined,
        error?.message ?? String(error),
      );

      if (s3UploadSucceeded && s3Key) {
        try {
          await this.s3Service.deleteFile(s3Key);
          this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted video from storage`));
        } catch (deleteError) {
          this.logger.error(
            colors.red(`❌ Failed to rollback video file: ${deleteError.message}`),
          );
        }
      }
      if (thumbnailUploadSucceeded && thumbnailS3Key) {
        try {
          await this.s3Service.deleteFile(thumbnailS3Key);
          this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted thumbnail from storage`));
        } catch (deleteError) {
          this.logger.error(
            colors.red(`❌ Failed to rollback thumbnail: ${deleteError.message}`),
          );
        }
      }

      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        colors.red(`Error uploading video: ${error?.message}`),
        (error as Error)?.stack,
      );
      throw new InternalServerErrorException('Failed to upload video');
    }
  }

  private async extractVideoDuration(
    videoFile: Express.Multer.File,
  ): Promise<number | null> {
    return new Promise((resolve) => {
      try {
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(
          tempDir,
          `temp_video_${Date.now()}_${videoFile.originalname}`,
        );
        const buffer = videoFile.buffer ?? (videoFile as any).buffer;
        if (!buffer) {
          this.logger.warn(colors.yellow(`⚠️ No buffer available for duration extraction`));
          return resolve(null);
        }
        fs.writeFileSync(tempFilePath, buffer);
        ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
          try {
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
          } catch (cleanupErr) {
            this.logger.warn(
              colors.yellow(`⚠️ Failed to clean up temp file: ${cleanupErr.message}`),
            );
          }
          if (err) {
            this.logger.warn(
              colors.yellow(`⚠️ Could not extract video duration: ${err.message}`),
            );
            return resolve(null);
          }
          const duration = metadata?.format?.duration;
          if (duration != null && !isNaN(duration)) {
            this.logger.log(
              colors.cyan(`📹 Video duration: ${Math.floor(duration)} seconds`),
            );
            return resolve(Math.floor(duration));
          }
          return resolve(null);
        });
      } catch (error) {
        this.logger.warn(
          colors.yellow(`⚠️ Error extracting video duration: ${(error as Error).message}`),
        );
        return resolve(null);
      }
    });
  }
}
