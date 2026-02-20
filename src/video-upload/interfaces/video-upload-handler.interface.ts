/**
 * Parameters passed to the handler when persisting an uploaded video.
 * The handler is responsible for saving to its own DB (e.g. LibraryVideoLesson or VideoContent).
 */
export interface VideoUploadPersistParams {
  videoUrl: string;
  videoS3Key: string;
  thumbnailUrl: string | null;
  thumbnailS3Key: string | null;
  sizeBytes: number;
  durationSeconds: number | null;
  title: string;
  description?: string | null;
}

/**
 * Handler interface for the central video upload flow.
 * Each consumer (library, teacher, etc.) implements this to provide context-specific
 * validation, S3 paths, persistence, and HLS trigger. HLS is always performed after persist.
 */
export interface IVideoUploadHandler {
  /** Optional: validate context (topic, user, permissions). Throw if invalid. */
  validate?(): Promise<void>;

  /**
   * Full S3 key for the video file (e.g. 'library/videos/platforms/xxx/subjects/yyy/topics/zzz/Title_123.mp4').
   * Used as the object key in the bucket.
   */
  getVideoS3Key(): string;

  /**
   * Full S3 key for the thumbnail (optional). If not provided and thumbnail file is present,
   * a default key is derived from the video key.
   */
  getThumbnailS3Key?(thumbnailOriginalName: string): string;

  /**
   * Persist the video to the consumer's database.
   * Return the created record id (used for progress completion and HLS).
   */
  persistVideo(params: VideoUploadPersistParams): Promise<{ id: string }>;

  /**
   * Trigger HLS transcode after persist. Required; every upload produces HLS.
   * If localFilePath is provided, transcode can use it to avoid re-downloading from S3.
   * Return value is ignored.
   */
  triggerHls(videoId: string, localFilePath?: string): Promise<void | unknown>;
}
