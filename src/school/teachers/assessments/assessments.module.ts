import { Module } from '@nestjs/common';
import { AssignmentsModule } from './assignments/assignments.module';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { LiveClassesModule } from './live-classes/live-classes.module';
import { ExamsModule } from './exams/exams.module';
import { GradingModule } from './grading/grading.module';
import { PrismaModule } from '../../../prisma/prisma.module';
import { StorageModule } from '../../../shared/services/providers/storage.module';
import { PushNotificationsModule } from '../../../push-notifications/push-notifications.module';

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    PushNotificationsModule,
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
