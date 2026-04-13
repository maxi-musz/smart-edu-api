import { Module } from '@nestjs/common';
import { PaystackGatewayService } from './paystack-gateway.service';

@Module({
  providers: [PaystackGatewayService],
  exports: [PaystackGatewayService],
})
export class PaystackPaymentModule {}
