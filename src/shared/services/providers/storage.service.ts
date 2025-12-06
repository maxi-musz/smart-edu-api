import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as colors from 'colors';
import { IStorageProvider, StorageUploadResult } from './storage-provider.interface';
import { S3StorageProvider } from './aws-provider/s3-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-provider/cloudinary-storage.provider';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private storageProvider: IStorageProvider;

  constructor(
    private config: ConfigService,
    private s3Provider: S3StorageProvider,
    private cloudinaryProvider: CloudinaryStorageProvider,
  ) {}

  onModuleInit() {
    const provider = this.config.get('STORAGE_PROVIDER') || 's3';
    
    try {
      switch (provider.toLowerCase()) {
        case 's3':
        case 'aws':
        case 'aws-s3':
          this.storageProvider = this.s3Provider;
          this.logger.log(colors.green(`✅ Storage Service initialized with provider: AWS S3`));
          break;
        
        case 'cloudinary':
          this.storageProvider = this.cloudinaryProvider;
          this.logger.log(colors.green(`✅ Storage Service initialized with provider: Cloudinary`));
          break;
        
        default:
          this.logger.warn(colors.yellow(`⚠️ Unknown storage provider: ${provider}. Defaulting to S3.`));
          this.storageProvider = this.s3Provider;
      }
    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to initialize storage provider: ${error.message}`));
      throw error;
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    fileName?: string,
    onProgress?: (loadedBytes: number, totalBytes?: number) => void
  ): Promise<StorageUploadResult> {
    return this.storageProvider.uploadFile(file, folder, fileName, onProgress);
  }

  async deleteFile(key: string): Promise<void> {
    return this.storageProvider.deleteFile(key);
  }

  getFileUrl(key: string): string {
    return this.storageProvider.getFileUrl(key);
  }
}

