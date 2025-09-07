import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { LiveClassesModule } from './live-classes/live-classes.module';
import { ExamsModule } from './exams/exams.module';
import { GradingModule } from './grading/grading.module';

@Module({
  imports: [
    AssignmentsModule,
    QuizzesModule,
    LiveClassesModule,
    ExamsModule,
    GradingModule,
  ],
  exports: [
    AssignmentsModule,
    QuizzesModule,
    LiveClassesModule,
    ExamsModule,
    GradingModule,
  ],
})
export class AssessmentsModule {}
