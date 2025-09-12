import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { UploadProgressService } from './upload-progress.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../../shared/services/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [AiChatController],
  providers: [AiChatService, UploadProgressService],
  exports: [AiChatService, UploadProgressService]
})
export class AiChatModule {}
