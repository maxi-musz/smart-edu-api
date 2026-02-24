import { Module } from '@nestjs/common';
import { AssessmentController } from './assessment.controller';
import { AssessmentService } from './assessment.service';
import { SchoolAssessmentService } from './services/school-assessment.service';
import { LibraryAssessmentService } from './services/library-assessment.service';
import { AssessmentGradingService } from './services/assessment-grading.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../shared/services/providers/storage.module';
import { PushNotificationsModule } from '../push-notifications/push-notifications.module';

@Module({
  imports: [PrismaModule, StorageModule, PushNotificationsModule],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    SchoolAssessmentService,
    LibraryAssessmentService,
    AssessmentGradingService,
  ],
  exports: [
    AssessmentService,
    SchoolAssessmentService,
    LibraryAssessmentService,
  ],
})
export class AssessmentModule {}