import { Module } from '@nestjs/common';
import { PaystackPaymentModule } from './paystack/paystack-payment.module';
import { FlutterwavePaymentModule } from './flutterwave/flutterwave-payment.module';
import { PaymentRouterService } from './payment-router.service';

@Module({
  imports: [PaystackPaymentModule, FlutterwavePaymentModule],
  providers: [PaymentRouterService],
  exports: [
    PaymentRouterService,
    PaystackPaymentModule,
    FlutterwavePaymentModule,
  ],
})
export class PaymentModule {}
