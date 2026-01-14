import { Module } from '@nestjs/common';
import { ExamBodyAssessmentService } from './exam-body-assessment.service';
import { ExamBodyAssessmentController } from './exam-body-assessment.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExamBodyAssessmentController],
  providers: [ExamBodyAssessmentService],
  exports: [ExamBodyAssessmentService],
})
export class ExamBodyAssessmentModule {}

