export type ActivePaymentProvider = 'paystack' | 'flutterwave';

export interface InitializeGatewayPaymentInput {
  email: string;
  amountNaira: number;
  reference: string;
  callbackUrl?: string;
  metadata: Record<string, unknown>;
}

export interface InitializeGatewayPaymentResult {
  authorization_url: string;
  reference: string;
}

/** Normalized result after calling provider verify API. */
export interface VerifyGatewayTransactionResult {
  ok: boolean;
  reference: string;
  /** Amount in NGN */
  amountNaira: number;
  providerStatus: string;
  raw: unknown;
}
