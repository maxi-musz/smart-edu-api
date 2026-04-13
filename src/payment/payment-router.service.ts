import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaystackGatewayService } from './paystack/paystack-gateway.service';
import { FlutterwaveGatewayService } from './flutterwave/flutterwave-gateway.service';
import type { ActivePaymentProvider } from './payment-gateway.types';
import type {
  InitializeGatewayPaymentInput,
  InitializeGatewayPaymentResult,
  VerifyGatewayTransactionResult,
} from './payment-gateway.types';

@Injectable()
export class PaymentRouterService {
  constructor(
    private readonly configService: ConfigService,
    private readonly paystackGateway: PaystackGatewayService,
    private readonly flutterwaveGateway: FlutterwaveGatewayService,
  ) {}

  activeProvider(): ActivePaymentProvider {
    const p = (
      this.configService.get<string>('PAYMENT_PROVIDER') || 'paystack'
    ).toLowerCase();
    return p === 'flutterwave' ? 'flutterwave' : 'paystack';
  }

  async initializeWalletOrFeePayment(
    input: InitializeGatewayPaymentInput,
  ): Promise<InitializeGatewayPaymentResult> {
    if (this.activeProvider() === 'flutterwave') {
      return this.flutterwaveGateway.initializeTransaction(input);
    }
    return this.paystackGateway.initializeTransaction(input);
  }

  async verifyTransaction(
    reference: string,
  ): Promise<VerifyGatewayTransactionResult> {
    if (this.activeProvider() === 'flutterwave') {
      return this.flutterwaveGateway.verifyTransaction(reference);
    }
    return this.paystackGateway.verifyTransaction(reference);
  }

  getPaystackGateway(): PaystackGatewayService {
    return this.paystackGateway;
  }

  getFlutterwaveGateway(): FlutterwaveGatewayService {
    return this.flutterwaveGateway;
  }
}
