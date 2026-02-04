/**
 * Common interface for video transcoding providers.
 * Implementations: FFmpeg (local) or AWS MediaConvert (managed).
 */

export interface TranscodeOptions {
  sourceS3Key: string;
  hlsS3Prefix: string;
  title: string;
  localFilePath?: string; // Optional: skip S3 download when file is already on disk
}

export interface TranscodeOutput {
  success: boolean;
  error?: string;
}

export interface VideoResolution {
  name: string;      // e.g. '480p', '720p', '1080p'
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}

export const DEFAULT_RESOLUTIONS: VideoResolution[] = [
  { name: '480p', width: 854, height: 480, videoBitrate: '1400k', audioBitrate: '128k' },
  { name: '720p', width: 1280, height: 720, videoBitrate: '2800k', audioBitrate: '128k' },
  { name: '1080p', width: 1920, height: 1080, videoBitrate: '5000k', audioBitrate: '192k' },
];

export interface TranscodeProvider {
  /**
   * Provider name for logging
   */
  readonly name: string;

  /**
   * Transcode a video to HLS format with multiple resolutions.
   * Uploads the result to S3 under the given prefix.
   */
  transcode(options: TranscodeOptions): Promise<TranscodeOutput>;
}
