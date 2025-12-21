import { Module } from '@nestjs/common';
import { UploadProgressService } from '../../school/ai-chat/upload-progress.service';

/**
 * Shared Upload Module
 * 
 * Provides reusable upload progress tracking functionality.
 * Can be imported by any module that needs upload progress tracking.
 */
@Module({
  providers: [UploadProgressService],
  exports: [UploadProgressService],
})
export class UploadModule {}

