-- PaymentGateway enum + gateway_reference on FeePayment and WalletTopUp

CREATE TYPE "PaymentGateway" AS ENUM ('PAYSTACK', 'FLUTTERWAVE');

ALTER TYPE "FeePaymentMethod" ADD VALUE 'FLUTTERWAVE';
ALTER TYPE "WalletTopUpSource" ADD VALUE 'FLUTTERWAVE';

ALTER TABLE "FeePayment" ADD COLUMN "gateway_reference" TEXT,
ADD COLUMN "payment_gateway" "PaymentGateway";

ALTER TABLE "WalletTopUp" ADD COLUMN "gateway_reference" TEXT,
ADD COLUMN "payment_gateway" "PaymentGateway";

CREATE UNIQUE INDEX "FeePayment_gateway_reference_key" ON "FeePayment"("gateway_reference");
CREATE UNIQUE INDEX "WalletTopUp_gateway_reference_key" ON "WalletTopUp"("gateway_reference");

CREATE INDEX "FeePayment_gateway_reference_idx" ON "FeePayment"("gateway_reference");
CREATE INDEX "WalletTopUp_gateway_reference_idx" ON "WalletTopUp"("gateway_reference");

UPDATE "FeePayment"
SET "gateway_reference" = "paystack_reference",
    "payment_gateway" = 'PAYSTACK'::"PaymentGateway"
WHERE "paystack_reference" IS NOT NULL;

UPDATE "WalletTopUp"
SET "gateway_reference" = "paystack_reference",
    "payment_gateway" = 'PAYSTACK'::"PaymentGateway"
WHERE "paystack_reference" IS NOT NULL;
