import { Module } from '@nestjs/common';
import { PushNotificationsService } from './push-notifications.service';
import { PushNotificationsController } from './push-notifications.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AcademicSessionModule } from 'src/academic-session/academic-session.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule],
  controllers: [PushNotificationsController],
  providers: [PushNotificationsService],
  exports: [PushNotificationsService]
})
export class PushNotificationsModule {}
