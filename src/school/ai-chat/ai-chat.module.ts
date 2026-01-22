import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService, AiChatDeletionService } from './ai-chat.service';
import { UploadProgressService } from './upload-progress.service';
import { 
  TextExtractionService, 
  DocumentChunkingService, 
  EmbeddingService, 
  DocumentProcessingService,
  ChatService
} from './services';
import { ExploreChatServicesModule } from '../../explore/chat/explore-chat-services.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../../shared/services/s3.module';

@Module({
  imports: [PrismaModule, S3Module, ExploreChatServicesModule],
  controllers: [AiChatController],
  providers: [
    AiChatService, 
    AiChatDeletionService,
    UploadProgressService,
    TextExtractionService,
    DocumentChunkingService,
    EmbeddingService,
    DocumentProcessingService,
    ChatService,
  ],
  exports: [
    AiChatService, 
    AiChatDeletionService,
    UploadProgressService,
    DocumentProcessingService,
    TextExtractionService,
    DocumentChunkingService,
    EmbeddingService,
    ChatService,
  ]
})
export class AiChatModule {}
