-- Rollup row for SMEH subscription analytics (O(1) revenue reads)

CREATE TABLE "PlatformSubscriptionGlobalStats" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "total_confirmed_revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "confirmed_payment_count" INTEGER NOT NULL DEFAULT 0,
    "last_confirmed_payment_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSubscriptionGlobalStats_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformSubscriptionGlobalStats" ("id", "total_confirmed_revenue", "confirmed_payment_count", "last_confirmed_payment_at", "updated_at")
SELECT
    'default',
    COALESCE(SUM("total_amount"), 0),
    COUNT(*)::int,
    MAX("processed_at"),
    CURRENT_TIMESTAMP
FROM "PlatformSubscriptionPayment"
WHERE "status" = 'CONFIRMED';
