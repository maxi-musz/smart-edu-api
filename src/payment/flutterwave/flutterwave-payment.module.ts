import { Module } from '@nestjs/common';
import { FlutterwaveGatewayService } from './flutterwave-gateway.service';

@Module({
  providers: [FlutterwaveGatewayService],
  exports: [FlutterwaveGatewayService],
})
export class FlutterwavePaymentModule {}
