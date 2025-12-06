import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { S3StorageProvider } from './aws-provider/s3-storage.provider';
import { CloudinaryStorageProvider } from './cloudinary-provider/cloudinary-storage.provider';

@Module({
  providers: [
    StorageService,
    S3StorageProvider,
    CloudinaryStorageProvider,
  ],
  exports: [StorageService],
})
export class StorageModule {}

