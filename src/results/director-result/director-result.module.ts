import { Module } from '@nestjs/common';
import { DirectorResultController } from './director-result.controller';
import { DirectorResultService } from './director-result.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PushNotificationsModule } from '../../push-notifications/push-notifications.module';

@Module({
  imports: [PrismaModule, PushNotificationsModule],
  controllers: [DirectorResultController],
  providers: [DirectorResultService],
  exports: [DirectorResultService],
})
export class DirectorResultModule {}
