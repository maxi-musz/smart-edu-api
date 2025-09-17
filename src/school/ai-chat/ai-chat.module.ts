import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService, AiChatDeletionService } from './ai-chat.service';
import { UploadProgressService } from './upload-progress.service';
import { 
  TextExtractionService, 
  DocumentChunkingService, 
  EmbeddingService, 
  PineconeService,
  DocumentProcessingService,
  ChatService
} from './services';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../../shared/services/s3.module';

@Module({
  imports: [PrismaModule, S3Module],
  controllers: [AiChatController],
  providers: [
    AiChatService, 
    AiChatDeletionService,
    UploadProgressService,
    TextExtractionService,
    DocumentChunkingService,
    EmbeddingService,
    PineconeService,
    DocumentProcessingService,
    ChatService,
  ],
  exports: [
    AiChatService, 
    AiChatDeletionService,
    UploadProgressService,
    DocumentProcessingService,
  ]
})
export class AiChatModule {}
