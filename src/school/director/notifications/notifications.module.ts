import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcademicSessionModule } from 'src/academic-session/academic-session.module';
import { PushNotificationsModule } from 'src/push-notifications/push-notifications.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule, PushNotificationsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
