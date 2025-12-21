import { Module } from '@nestjs/common';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { LibraryAuthModule } from '../../library-auth/library-auth.module';
import { TopicModule } from './topic/topic.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule, TopicModule],
  controllers: [ChapterController],
  providers: [ChapterService],
  exports: [ChapterService],
})
export class ChapterModule {}

