import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as colors from 'colors';
import { IStorageProvider, StorageUploadResult } from '../storage-provider.interface';

@Injectable()
export class CloudinaryStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(CloudinaryStorageProvider.name);

  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
    
    // Force Cloudinary to use longer timeouts
    process.env.CLOUDINARY_TIMEOUT = '900000'; // 15 minutes
    process.env.CLOUDINARY_CHUNK_SIZE = '6000000'; // 6MB chunks

    this.logger.log(colors.green(`✅ Cloudinary Storage Provider initialized`));
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    fileName?: string,
    onProgress?: (loadedBytes: number, totalBytes?: number) => void
  ): Promise<StorageUploadResult> {
    const customFileName = fileName || `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const publicId = `${folder}/${customFileName.replace(/\.[^/.]+$/, '')}`; // Remove extension for Cloudinary
    
    this.logger.log(colors.cyan(`🚀 Starting Cloudinary upload: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`));
    
    try {
      return new Promise<StorageUploadResult>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            resource_type: 'auto',
            folder: folder,
            public_id: publicId,
            overwrite: true,
          },
          (error, result) => {
            if (error) {
              this.logger.error(colors.red(`❌ Cloudinary upload failed: ${error.message}`));
              reject(new Error(`Cloudinary upload failed: ${error.message}`));
            } else if (!result?.secure_url || !result?.public_id) {
              const errorMessage = `Invalid upload result for file: ${file.originalname}`;
              this.logger.error(colors.red(`❌ ${errorMessage}`));
              reject(new Error(errorMessage));
            } else {
              this.logger.log(colors.green(`✅ Cloudinary upload successful: ${file.originalname}`));
              this.logger.log(colors.blue(`   - URL: ${result.secure_url}`));
              this.logger.log(colors.blue(`   - Public ID: ${result.public_id}`));
              
              resolve({
                url: result.secure_url,
                key: result.public_id,
              });
            }
          }
        );

        // Simulate progress if callback provided
        if (onProgress) {
          // Cloudinary doesn't provide progress events, so we simulate
          const totalBytes = file.size;
          let loadedBytes = 0;
          const interval = setInterval(() => {
            loadedBytes = Math.min(loadedBytes + totalBytes / 10, totalBytes);
            onProgress(loadedBytes, totalBytes);
            if (loadedBytes >= totalBytes) {
              clearInterval(interval);
            }
          }, 100);
        }

        upload.end(file.buffer);
      });
    } catch (error) {
      this.logger.error(colors.red(`❌ Cloudinary upload failed: ${error.message}`));
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      // Cloudinary public_id should not include the folder prefix in delete operations
      // But we'll use it as-is since it might already be the full public_id
      const result = await cloudinary.uploader.destroy(key, {
        resource_type: 'auto',
      });

      if (result.result === 'ok' || result.result === 'not found') {
        this.logger.log(colors.green(`🗑️ File deleted from Cloudinary: ${key}`));
      } else {
        throw new Error(`Failed to delete file: ${result.result}`);
      }
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to delete file from Cloudinary: ${error.message}`));
      throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
    }
  }

  async deleteFolder(prefix: string): Promise<void> {
    try {
      this.logger.log(colors.cyan(`🗑️ Deleting folder from Cloudinary: ${prefix}`));
      
      // Delete all resources with the given prefix
      const result = await cloudinary.api.delete_resources_by_prefix(prefix, {
        resource_type: 'video', // HLS files are typically video resources
      });
      
      // Also try deleting image resources with the prefix
      await cloudinary.api.delete_resources_by_prefix(prefix, {
        resource_type: 'image',
      }).catch(() => {}); // Ignore errors for images
      
      // Delete the folder itself (if empty)
      await cloudinary.api.delete_folder(prefix).catch(() => {});
      
      this.logger.log(colors.green(`✅ Folder deleted from Cloudinary: ${prefix}`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to delete folder from Cloudinary: ${error.message}`));
      throw new Error(`Failed to delete folder from Cloudinary: ${error.message}`);
    }
  }

  getFileUrl(key: string): string {
    // Cloudinary public_id can be used to generate URL
    // But we need to know the resource type, so we'll return a generic URL
    // In practice, you should store the full URL from upload result
    return cloudinary.url(key, {
      secure: true,
    });
  }
}

