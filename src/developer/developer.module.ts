import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LibraryDevModule } from './librarydev/librarydev.module';
import { IdentityModule } from './identity/identity.module';
import { ExamBodyModule } from './exam-body/exam-body.module';
import { ExamBodySubjectModule } from './exam-body-subject/exam-body-subject.module';
import { ExamBodyYearModule } from './exam-body-year/exam-body-year.module';
import { ExamBodyAssessmentModule } from './exam-body-assessment/exam-body-assessment.module';

@Module({
  imports: [
    PrismaModule,
    LibraryDevModule,
    IdentityModule,
    ExamBodyModule,
    ExamBodySubjectModule,
    ExamBodyYearModule,
    ExamBodyAssessmentModule,
  ],
})
export class DeveloperModule {}

