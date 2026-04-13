import type { Prisma } from '@prisma/client';

/** Match legacy `paystack_reference` or unified `gateway_reference`. */
export function feePaymentByExternalRef(
  reference: string,
): Prisma.FeePaymentWhereInput {
  return {
    OR: [
      { gateway_reference: reference },
      { paystack_reference: reference },
    ],
  };
}

export function walletTopUpByExternalRef(
  reference: string,
): Prisma.WalletTopUpWhereInput {
  return {
    OR: [
      { gateway_reference: reference },
      { paystack_reference: reference },
    ],
  };
}
