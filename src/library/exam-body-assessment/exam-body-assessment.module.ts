import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { LibraryAuthModule } from '../library-auth/library-auth.module';
import { StorageModule } from '../../shared/services/providers/storage.module';
import { LibraryExamBodyAssessmentController } from './exam-body-assessment.controller';
import { LibraryExamBodyAssessmentService } from './exam-body-assessment.service';

@Module({
  imports: [PrismaModule, LibraryAuthModule, StorageModule],
  controllers: [LibraryExamBodyAssessmentController],
  providers: [LibraryExamBodyAssessmentService],
})
export class LibraryExamBodyAssessmentModule {}
