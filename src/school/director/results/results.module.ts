import { Module } from '@nestjs/common';
import { ResultsController } from './results.controller';
import { ResultsService } from './results.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PushNotificationsModule } from '../../../push-notifications/push-notifications.module';

@Module({
  imports: [PrismaModule, PushNotificationsModule],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService]
})
export class ResultsModule {}

