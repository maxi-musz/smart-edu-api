import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { LiveClassesModule } from './live-classes/live-classes.module';
import { ExamsModule } from './exams/exams.module';
import { GradingModule } from './grading/grading.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AssignmentsModule,
    LiveClassesModule,
    ExamsModule,
    GradingModule,
  ],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [
    AssessmentService,
    AssignmentsModule,
    LiveClassesModule,
    ExamsModule,
    GradingModule,
  ],
})
export class AssessmentsModule {}
