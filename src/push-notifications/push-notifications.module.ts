import { Module } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { PushNotificationsController } from './push-notifications.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcademicSessionModule } from 'src/academic-session/academic-session.module';
import { AssessmentNotificationsService } from './assessment/assessment-notifications.service';

@Module({
  imports: [PrismaModule, AcademicSessionModule],
  controllers: [PushNotificationsController],
  providers: [PushNotificationsService, AssessmentNotificationsService],
  exports: [PushNotificationsService, AssessmentNotificationsService]
})
export class PushNotificationsModule {}
