import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../../shared/services/providers/storage.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { LibraryExamBodySubjectController } from './exam-body-subject.controller';
import { LibraryExamBodySubjectService } from './exam-body-subject.service';

@Module({
  imports: [PrismaModule, StorageModule, LibraryAuthModule],
  controllers: [LibraryExamBodySubjectController],
  providers: [LibraryExamBodySubjectService],
})
export class LibraryExamBodySubjectModule {}
