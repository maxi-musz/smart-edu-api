import { Module } from '@nestjs/common';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { StorageModule } from '../../shared/services/providers/storage.module';
import { ChapterModule } from './chapter/chapter.module';

@Module({
  imports: [PrismaModule, LibraryAuthModule, StorageModule, ChapterModule],
  controllers: [SubjectController],
  providers: [SubjectService],
  exports: [SubjectService],
})
export class SubjectModule {}

