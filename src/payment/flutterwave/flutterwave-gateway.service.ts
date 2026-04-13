import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  InitializeGatewayPaymentInput,
  InitializeGatewayPaymentResult,
  VerifyGatewayTransactionResult,
} from '../payment-gateway.types';
import * as crypto from 'crypto';
import {
  resolveFlutterwaveClientId,
  resolveFlutterwaveEncryptionKey,
  resolveFlutterwaveSecretKey,
  resolveFlutterwaveV3ApiBaseUrl,
  resolveFlutterwaveWebhookSecretHash,
} from './flutterwave-env.util';

@Injectable()
export class FlutterwaveGatewayService {
  private readonly logger = new Logger(FlutterwaveGatewayService.name);

  constructor(private readonly configService: ConfigService) {
    const hasClientId = !!resolveFlutterwaveClientId(this.configService);
    const hasEnc = !!resolveFlutterwaveEncryptionKey(this.configService);
    const base = resolveFlutterwaveV3ApiBaseUrl(this.configService);
    this.logger.log(
      `Flutterwave v3 API base=${base}; API secret=${!!resolveFlutterwaveSecretKey(this.configService)}, webhook hash=${!!resolveFlutterwaveWebhookSecretHash(this.configService)}, encryption key=${hasEnc}, client id=${hasClientId}`,
    );
  }

  private v3Base(): string {
    return resolveFlutterwaveV3ApiBaseUrl(this.configService);
  }

  private secret(): string {
    return resolveFlutterwaveSecretKey(this.configService);
  }

  /** Dashboard “secret hash” for webhook `verif-hash` header validation. */
  webhookSecretHash(): string {
    return resolveFlutterwaveWebhookSecretHash(this.configService);
  }

  /** For client-side card encryption or future routes; not required for hosted payment link flow. */
  getEncryptionKey(): string {
    return resolveFlutterwaveEncryptionKey(this.configService);
  }

  /** Optional; v3 REST uses Bearer secret only — kept for dashboard / future SDK use. */
  getClientId(): string {
    return resolveFlutterwaveClientId(this.configService);
  }

  async initializeTransaction(
    input: InitializeGatewayPaymentInput,
  ): Promise<InitializeGatewayPaymentResult> {
    const secretKey = this.secret();
    const body = {
      tx_ref: input.reference,
      amount: String(input.amountNaira),
      currency: 'NGN',
      redirect_url: input.callbackUrl || '',
      customer: { email: input.email },
      customizations: {
        title: 'Smart Edu Hub',
        description: 'Payment',
      },
      meta: input.metadata,
    };

    const response = await fetch(`${this.v3Base()}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      status?: string;
      message?: string;
      data?: { link?: string };
    };

    if (data.status !== 'success' || !data.data?.link) {
      this.logger.warn(`Flutterwave init failed: ${data.message}`);
      throw new Error(data.message || 'Flutterwave initialization failed');
    }

    return {
      authorization_url: data.data.link,
      reference: input.reference,
    };
  }

  async verifyTransaction(
    reference: string,
  ): Promise<VerifyGatewayTransactionResult> {
    const secretKey = this.secret();
    const url = `${this.v3Base()}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const data = (await response.json()) as {
      status?: string;
      message?: string;
      data?: {
        status?: string;
        amount?: number;
        currency?: string;
      };
    };

    if (data.status !== 'success' || !data.data) {
      return {
        ok: false,
        reference,
        amountNaira: 0,
        providerStatus: 'failed',
        raw: data,
      };
    }

    const amount = Number(data.data.amount ?? 0);
    return {
      ok: true,
      reference,
      amountNaira: amount,
      providerStatus: data.data.status || 'unknown',
      raw: data,
    };
  }

  /** Compare `verif-hash` header from Flutterwave to configured secret hash. */
  verifyWebhookHash(headerHash: string | undefined): boolean {
    const expected = this.webhookSecretHash();
    if (!expected || !headerHash) return false;
    return headerHash === expected;
  }

  /** Optional: verify payload integrity with SHA256(secret). */
  verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = this.secret();
    if (!secret) return false;
    const hash = crypto.createHash('sha256').update(secret).digest('hex');
    return hash === signature;
  }
}
