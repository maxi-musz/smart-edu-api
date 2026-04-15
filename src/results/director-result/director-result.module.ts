import { Module } from '@nestjs/common';
import { DirectorResultController } from './director-result.controller';
import { DirectorResultService } from './director-result.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PushNotificationsModule } from '../../push-notifications/push-notifications.module';
import { GradingScaleModule } from '../../school/director/grading-scale/grading-scale.module';

@Module({
  imports: [PrismaModule, PushNotificationsModule, GradingScaleModule],
  controllers: [DirectorResultController],
  providers: [DirectorResultService],
  exports: [DirectorResultService],
})
export class DirectorResultModule {}
