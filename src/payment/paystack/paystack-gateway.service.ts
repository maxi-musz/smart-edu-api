import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FINANCE_CONSTANTS } from 'src/finance/common/finance.constants';
import { nairaToKobo, koboToNaira } from 'src/finance/common/finance-helpers';
import type {
  InitializeGatewayPaymentInput,
  InitializeGatewayPaymentResult,
  VerifyGatewayTransactionResult,
} from '../payment-gateway.types';
import * as crypto from 'crypto';
import { resolvePaystackSecretKey } from './paystack-secret.util';

@Injectable()
export class PaystackGatewayService {
  private readonly logger = new Logger(PaystackGatewayService.name);
  private readonly baseUrl = FINANCE_CONSTANTS.PAYSTACK_BASE_URL;

  constructor(private readonly configService: ConfigService) {}

  private secret(): string {
    return resolvePaystackSecretKey(this.configService);
  }

  async initializeTransaction(
    input: InitializeGatewayPaymentInput,
  ): Promise<InitializeGatewayPaymentResult> {
    const secretKey = this.secret();
    const amountInKobo = nairaToKobo(input.amountNaira);
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        amount: amountInKobo,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    });
    const data = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string };
    };
    if (!data.status || !data.data?.authorization_url) {
      this.logger.warn(`Paystack init failed: ${data.message}`);
      throw new Error(data.message || 'Paystack initialization failed');
    }
    return {
      authorization_url: data.data.authorization_url,
      reference: input.reference,
    };
  }

  async verifyTransaction(
    reference: string,
  ): Promise<VerifyGatewayTransactionResult> {
    const secretKey = this.secret();
    const response = await fetch(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const data = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: { status?: string; amount?: number };
    };
    if (!data.status || !data.data) {
      return {
        ok: false,
        reference,
        amountNaira: 0,
        providerStatus: 'failed',
        raw: data,
      };
    }
    const amountNaira = koboToNaira(data.data.amount ?? 0);
    return {
      ok: true,
      reference,
      amountNaira,
      providerStatus: data.data.status || 'unknown',
      raw: data,
    };
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const secretKey = this.secret();
    if (!secretKey) return false;
    const hash = crypto
      .createHmac('sha512', secretKey)
      .update(body)
      .digest('hex');
    return hash === signature;
  }
}
