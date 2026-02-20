import { Module } from '@nestjs/common';
import { VideoUploadService } from './video-upload.service';
import { S3Module } from '../shared/services/s3.module';
import { UploadModule } from '../shared/upload/upload.module';

@Module({
  imports: [S3Module, UploadModule],
  providers: [VideoUploadService],
  exports: [VideoUploadService],
})
export class VideoUploadModule {}
