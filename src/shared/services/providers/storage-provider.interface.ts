/**
 * Storage Provider Interface
 * Defines the contract for all storage providers (S3, Cloudinary, etc.)
 */
export interface StorageUploadResult {
  url: string;
  key: string; // S3 key or Cloudinary public_id
  bucket?: string; // Optional, for S3
  etag?: string; // Optional, for S3
}

export interface IStorageProvider {
  /**
   * Upload a file to storage
   * @param file - The file to upload
   * @param folder - Folder/path where the file should be stored
   * @param fileName - Optional custom file name
   * @param onProgress - Optional progress callback
   */
  uploadFile(
    file: Express.Multer.File,
    folder: string,
    fileName?: string,
    onProgress?: (loadedBytes: number, totalBytes?: number) => void
  ): Promise<StorageUploadResult>;

  /**
   * Delete a file from storage
   * @param key - The storage key (S3 key or Cloudinary public_id)
   */
  deleteFile(key: string): Promise<void>;

  /**
   * Get the public URL for a stored file
   * @param key - The storage key
   * Note: For private buckets, this may return a placeholder. Use getPresignedUrl() if available.
   */
  getFileUrl(key: string): string;
}

