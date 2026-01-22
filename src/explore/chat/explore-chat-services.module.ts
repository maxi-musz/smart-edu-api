import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { S3Module } from '../../shared/services/s3.module';
import { 
  TextExtractionService,
  DocumentChunkingService,
  EmbeddingService,
  PineconeService,
  DocumentProcessingService,
  TextToSpeechService,
} from './services';

@Module({
  imports: [PrismaModule, S3Module],
  providers: [
    TextExtractionService,
    DocumentChunkingService,
    EmbeddingService,
    PineconeService,
    DocumentProcessingService,
    TextToSpeechService,
  ],
  exports: [
    DocumentProcessingService,
    TextExtractionService,
    DocumentChunkingService,
    EmbeddingService,
    PineconeService,
    TextToSpeechService,
  ],
})
export class ExploreChatServicesModule {}
