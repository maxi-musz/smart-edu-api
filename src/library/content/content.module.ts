import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { S3Module } from '../../shared/services/s3.module';
import { UploadModule } from '../../shared/upload/upload.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule, S3Module, UploadModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

