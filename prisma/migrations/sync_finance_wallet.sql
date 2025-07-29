-- Migration to sync Finance and Wallet data
-- This ensures both models stay in sync

-- 1. Create wallets for existing schools that don't have one
INSERT INTO "Wallet" (id, school_id, balance, currency, wallet_type, is_active, last_updated, "createdAt", "updatedAt")
SELECT 
  gen_random_uuid() as id,
  s.id as school_id,
  COALESCE(f.total_revenue, 0) as balance,
  'NGN' as currency,
  'SCHOOL_WALLET' as wallet_type,
  true as is_active,
  NOW() as last_updated,
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "School" s
LEFT JOIN "Finance" f ON s.id = f.school_id
LEFT JOIN "Wallet" w ON s.id = w.school_id
WHERE w.id IS NULL;

-- 2. Create wallet transactions for existing payments
INSERT INTO "WalletTransaction" (id, wallet_id, transaction_type, amount, description, reference, status, "processed_at", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid() as id,
  w.id as wallet_id,
  CASE 
    WHEN p.transaction_type = 'credit' THEN 'CREDIT'
    WHEN p.transaction_type = 'debit' THEN 'DEBIT'
    ELSE 'FEE_PAYMENT'
  END as transaction_type,
  p.amount,
  CONCAT(p.payment_for, ' - ', u.first_name, ' ', u.last_name) as description,
  CONCAT('PAY-', p.id) as reference,
  'COMPLETED' as status,
  p.payment_date as "processed_at",
  p."createdAt",
  p."updatedAt"
FROM "Payment" p
JOIN "User" u ON p.student_id = u.id
JOIN "School" s ON u.school_id = s.id
JOIN "Wallet" w ON s.id = w.school_id
WHERE p."createdAt" >= (NOW() - INTERVAL '30 days'); -- Sync recent payments

-- 3. Update wallet balances based on transactions
UPDATE "Wallet" 
SET balance = (
  SELECT COALESCE(SUM(
    CASE 
      WHEN wt.transaction_type IN ('CREDIT', 'FEE_PAYMENT', 'GRANT', 'DONATION') THEN wt.amount
      WHEN wt.transaction_type IN ('DEBIT', 'WITHDRAWAL', 'REFUND') THEN -wt.amount
      ELSE 0
    END
  ), 0)
  FROM "WalletTransaction" wt
  WHERE wt.wallet_id = "Wallet".id
  AND wt.status = 'COMPLETED'
),
last_updated = NOW()
WHERE id IN (SELECT id FROM "Wallet");

-- 4. Update Finance model to reflect wallet balance
UPDATE "Finance" 
SET total_revenue = (
  SELECT COALESCE(w.balance, 0)
  FROM "Wallet" w
  WHERE w.school_id = "Finance".school_id
),
updatedAt = NOW()
WHERE school_id IN (SELECT school_id FROM "Wallet"); 