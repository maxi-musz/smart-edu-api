-- Platform SMEH subscription checkout + platform wallet owner type

CREATE TYPE "PlatformSubscriptionPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');
CREATE TYPE "PlatformSubscriptionBillingMode" AS ENUM ('MONTHLY_BLOCK', 'YEARLY');

ALTER TYPE "WalletOwnerType" ADD VALUE 'PLATFORM';
ALTER TYPE "WalletType" ADD VALUE 'PLATFORM_WALLET';

CREATE TABLE "PlatformSubscriptionPayment" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "initiated_by_user_id" TEXT NOT NULL,
    "plan_template_id" TEXT NOT NULL,
    "billing_mode" "PlatformSubscriptionBillingMode" NOT NULL,
    "months" INTEGER NOT NULL,
    "unit_amount" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "PlatformSubscriptionPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paystack_reference" TEXT,
    "gateway_reference" TEXT,
    "payment_gateway" "PaymentGateway",
    "paystack_status" TEXT,
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSubscriptionPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformSubscriptionPayment_paystack_reference_key" ON "PlatformSubscriptionPayment"("paystack_reference");
CREATE UNIQUE INDEX "PlatformSubscriptionPayment_gateway_reference_key" ON "PlatformSubscriptionPayment"("gateway_reference");
CREATE INDEX "PlatformSubscriptionPayment_school_id_idx" ON "PlatformSubscriptionPayment"("school_id");
CREATE INDEX "PlatformSubscriptionPayment_status_idx" ON "PlatformSubscriptionPayment"("status");
CREATE INDEX "PlatformSubscriptionPayment_gateway_reference_idx" ON "PlatformSubscriptionPayment"("gateway_reference");
CREATE INDEX "PlatformSubscriptionPayment_createdAt_idx" ON "PlatformSubscriptionPayment"("createdAt");
CREATE INDEX "PlatformSubscriptionPayment_plan_template_id_idx" ON "PlatformSubscriptionPayment"("plan_template_id");

ALTER TABLE "PlatformSubscriptionPayment" ADD CONSTRAINT "PlatformSubscriptionPayment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlatformSubscriptionPayment" ADD CONSTRAINT "PlatformSubscriptionPayment_initiated_by_user_id_fkey" FOREIGN KEY ("initiated_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformSubscriptionPayment" ADD CONSTRAINT "PlatformSubscriptionPayment_plan_template_id_fkey" FOREIGN KEY ("plan_template_id") REFERENCES "PlatformSubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WalletTransaction" ADD COLUMN "platform_subscription_payment_id" TEXT;
CREATE UNIQUE INDEX "WalletTransaction_platform_subscription_payment_id_key" ON "WalletTransaction"("platform_subscription_payment_id");

ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_platform_subscription_payment_id_fkey" FOREIGN KEY ("platform_subscription_payment_id") REFERENCES "PlatformSubscriptionPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
