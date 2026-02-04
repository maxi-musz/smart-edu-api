import { Module } from '@nestjs/common';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AcademicSessionModule } from '../../../academic-session/academic-session.module';

import { S3Module } from '../../../shared/services/s3.module';
import { HlsTranscodeModule } from '../../../shared/services/hls-transcode.module';
import { AiChatModule } from '../../ai-chat/ai-chat.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule, S3Module, HlsTranscodeModule, AiChatModule],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService]
})
export class TopicsModule {}
