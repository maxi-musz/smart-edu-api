import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { StudentAssessmentController } from './student-assessment.controller';
import { StudentAssessmentService } from './student-assessment.service';

@Module({
  imports: [PrismaModule],
  controllers: [StudentAssessmentController],
  providers: [StudentAssessmentService],
})
export class StudentAssessmentModule {}
