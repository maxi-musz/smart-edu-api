import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PaymentModule } from 'src/payment/payment.module';
import { PlatformSubscriptionService } from './platform-subscription.service';
import { PlatformSubscriptionController } from './platform-subscription.controller';

@Module({
  imports: [PrismaModule, PaymentModule],
  controllers: [PlatformSubscriptionController],
  providers: [PlatformSubscriptionService],
  exports: [PlatformSubscriptionService],
})
export class PlatformSubscriptionModule {}
