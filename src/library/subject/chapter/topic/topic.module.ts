import { Module } from '@nestjs/common';
import { TopicController } from './topic.controller';
import { TopicService } from './topic.service';
import { PrismaModule } from '../../../../prisma/prisma.module';
import { LibraryAuthModule } from '../../../library-auth/library-auth.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule],
  controllers: [TopicController],
  providers: [TopicService],
  exports: [TopicService],
})
export class TopicModule {}

