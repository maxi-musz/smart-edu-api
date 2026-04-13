/*
  Warnings:

  - A unique constraint covering the columns `[owner_id,owner_type]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `owner_id` to the `Wallet` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('SCHOOL_FEE', 'LESSON_FEE', 'TRANSPORT_FEE', 'UNIFORM_FEE', 'PTA_LEVY', 'LAB_FEE', 'DEVELOPMENT_LEVY', 'EXAMINATION_FEE', 'BOARDING_FEE', 'SPORTS_FEE', 'ICT_FEE', 'OTHER');

-- CreateEnum
CREATE TYPE "FeeAssignmentScope" AS ENUM ('ALL_CLASSES', 'SELECTED_CLASSES');

-- CreateEnum
CREATE TYPE "PaymentPlanType" AS ENUM ('ONE_TIME', 'FIXED_INSTALLMENTS', 'OPEN');

-- CreateEnum
CREATE TYPE "FeePaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'PAYSTACK', 'WALLET', 'POS', 'CHEQUE', 'OTHER');

-- CreateEnum
CREATE TYPE "FeePaymentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "FeePaymentType" AS ENUM ('FULL', 'PARTIAL', 'INSTALLMENT');

-- CreateEnum
CREATE TYPE "StudentFeeStatus" AS ENUM ('PENDING', 'PARTIAL', 'COMPLETED', 'WAIVED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "WalletOwnerType" AS ENUM ('SCHOOL', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "WalletTopUpSource" AS ENUM ('PAYSTACK', 'MANUAL_CASH', 'BANK_TRANSFER', 'TRANSFER_FROM_PARENT_WALLET');

-- CreateEnum
CREATE TYPE "WalletTopUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "WalletTransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateEnum
CREATE TYPE "WaiverType" AS ENUM ('FULL_WAIVER', 'PARTIAL_DISCOUNT', 'SCHOLARSHIP', 'STAFF_CHILD', 'SIBLING_DISCOUNT', 'OTHER');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "WaiverStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ScholarshipCoverageType" AS ENUM ('FULL_FEES', 'SELECTED_FEES', 'PERCENTAGE_OF_TOTAL', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARY', 'MAINTENANCE', 'SUPPLIES', 'UTILITIES', 'TRANSPORTATION', 'EVENTS', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InstallmentPaymentStatus" AS ENUM ('PENDING', 'PAID', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('FLAT_AMOUNT', 'PERCENTAGE_OF_OUTSTANDING', 'PERCENTAGE_OF_TOTAL');

-- CreateEnum
CREATE TYPE "PenaltyRecurrence" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PenaltyStatus" AS ENUM ('ACTIVE', 'WAIVED', 'PAID');

-- CreateEnum
CREATE TYPE "RefundType" AS ENUM ('FULL', 'PARTIAL');

-- CreateEnum
CREATE TYPE "RefundDestination" AS ENUM ('STUDENT_WALLET', 'PAYSTACK_REVERSAL', 'BANK_TRANSFER', 'CASH');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExpensePaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditForType" ADD VALUE 'finance_fee_create';
ALTER TYPE "AuditForType" ADD VALUE 'finance_fee_update';
ALTER TYPE "AuditForType" ADD VALUE 'finance_fee_delete';
ALTER TYPE "AuditForType" ADD VALUE 'finance_payment_record';
ALTER TYPE "AuditForType" ADD VALUE 'finance_payment_reverse';
ALTER TYPE "AuditForType" ADD VALUE 'finance_waiver_apply';
ALTER TYPE "AuditForType" ADD VALUE 'finance_waiver_revoke';
ALTER TYPE "AuditForType" ADD VALUE 'finance_scholarship_create';
ALTER TYPE "AuditForType" ADD VALUE 'finance_penalty_applied';
ALTER TYPE "AuditForType" ADD VALUE 'finance_penalty_waived';
ALTER TYPE "AuditForType" ADD VALUE 'finance_refund_request';
ALTER TYPE "AuditForType" ADD VALUE 'finance_refund_approved';
ALTER TYPE "AuditForType" ADD VALUE 'finance_refund_completed';
ALTER TYPE "AuditForType" ADD VALUE 'finance_wallet_topup';
ALTER TYPE "AuditForType" ADD VALUE 'finance_wallet_transfer';
ALTER TYPE "AuditForType" ADD VALUE 'finance_expense_record';

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_school_id_fkey";

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "freeze_reason" TEXT,
ADD COLUMN     "is_frozen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "owner_id" TEXT NOT NULL,
ADD COLUMN     "owner_type" "WalletOwnerType" NOT NULL DEFAULT 'SCHOOL',
ADD COLUMN     "total_funded_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_spent_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "school_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WalletTransaction" ADD COLUMN     "balance_after" DOUBLE PRECISION,
ADD COLUMN     "balance_before" DOUBLE PRECISION,
ADD COLUMN     "payment_id" TEXT,
ADD COLUMN     "recorded_by" TEXT;

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fee_type" "FeeType" NOT NULL,
    "base_amount" DOUBLE PRECISION NOT NULL,
    "assignment_scope" "FeeAssignmentScope" NOT NULL DEFAULT 'SELECTED_CLASSES',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_deduct_enabled" BOOLEAN NOT NULL DEFAULT false,
    "auto_deduct_date" TIMESTAMP(3),
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeClassAssignment" (
    "id" TEXT NOT NULL,
    "fee_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "amount_override" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeClassAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePaymentPlan" (
    "id" TEXT NOT NULL,
    "fee_id" TEXT NOT NULL,
    "plan_type" "PaymentPlanType" NOT NULL,
    "max_installments" INTEGER,
    "allow_partial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeInstallmentSchedule" (
    "id" TEXT NOT NULL,
    "payment_plan_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3),
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeInstallmentSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentFeeRecord" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "amount_owed" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "status" "StudentFeeStatus" NOT NULL DEFAULT 'PENDING',
    "waiver_id" TEXT,
    "due_date" TIMESTAMP(3),
    "last_payment_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentInstallmentPayment" (
    "id" TEXT NOT NULL,
    "student_fee_record_id" TEXT NOT NULL,
    "installment_schedule_id" TEXT NOT NULL,
    "fee_payment_id" TEXT NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InstallmentPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "student_id" TEXT NOT NULL,

    CONSTRAINT "StudentInstallmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "student_fee_record_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" "FeePaymentMethod" NOT NULL,
    "payment_type" "FeePaymentType" NOT NULL,
    "status" "FeePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "receipt_number" TEXT,
    "paystack_reference" TEXT,
    "recorded_by" TEXT,
    "includes_penalty" BOOLEAN NOT NULL DEFAULT false,
    "penalty_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "partially_refunded" BOOLEAN NOT NULL DEFAULT false,
    "total_refunded_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "installment_number" INTEGER,
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTopUp" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "owner_type" "WalletOwnerType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "source" "WalletTopUpSource" NOT NULL,
    "paystack_reference" TEXT,
    "paystack_status" TEXT,
    "recorded_by" TEXT,
    "status" "WalletTopUpStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "processed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTopUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransfer" (
    "id" TEXT NOT NULL,
    "from_wallet_id" TEXT NOT NULL,
    "to_wallet_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "WalletTransferStatus" NOT NULL DEFAULT 'PENDING',
    "initiated_by" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sponsor" TEXT,
    "coverage_type" "ScholarshipCoverageType" NOT NULL,
    "coverage_value" DOUBLE PRECISION,
    "applicable_fee_ids" TEXT[],
    "max_beneficiaries" INTEGER,
    "current_beneficiary_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeWaiver" (
    "id" TEXT NOT NULL,
    "student_fee_record_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "scholarship_id" TEXT,
    "waiver_type" "WaiverType" NOT NULL,
    "discount_type" "DiscountType",
    "discount_value" DOUBLE PRECISION,
    "original_amount_owed" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL,
    "effective_amount_after_waiver" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "WaiverStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "requested_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "revoked_by" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revocation_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeWaiver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePenaltyRule" (
    "id" TEXT NOT NULL,
    "fee_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "penalty_type" "PenaltyType" NOT NULL,
    "penalty_value" DOUBLE PRECISION NOT NULL,
    "grace_period_days" INTEGER NOT NULL DEFAULT 0,
    "recurrence" "PenaltyRecurrence" NOT NULL,
    "max_penalty_amount" DOUBLE PRECISION,
    "max_penalty_occurrences" INTEGER,
    "apply_to_partial_payers" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeePenaltyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeLatePenalty" (
    "id" TEXT NOT NULL,
    "student_fee_record_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "penalty_rule_id" TEXT NOT NULL,
    "occurrence_number" INTEGER NOT NULL,
    "penalty_type" "PenaltyType" NOT NULL,
    "penalty_value" DOUBLE PRECISION NOT NULL,
    "calculated_penalty_amount" DOUBLE PRECISION NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PenaltyStatus" NOT NULL DEFAULT 'ACTIVE',
    "waived_by" TEXT,
    "waived_at" TIMESTAMP(3),
    "waiver_reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeLatePenalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "fee_payment_id" TEXT NOT NULL,
    "student_fee_record_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "refund_type" "RefundType" NOT NULL,
    "original_payment_amount" DOUBLE PRECISION NOT NULL,
    "refund_amount" DOUBLE PRECISION NOT NULL,
    "refund_destination" "RefundDestination" NOT NULL,
    "bank_account_details" JSONB,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "processed_at" TIMESTAMP(3),
    "paystack_refund_reference" TEXT,
    "failure_reason" TEXT,
    "refund_includes_penalty" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletAnalytics" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "current_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_collected_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_withdrawn_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_refunded_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_waived_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_expected_current_session" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_collected_current_session" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_outstanding_current_session" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "collection_rate_current_session" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_students_enrolled" INTEGER NOT NULL DEFAULT 0,
    "total_students_paid_full" INTEGER NOT NULL DEFAULT 0,
    "total_students_paid_partial" INTEGER NOT NULL DEFAULT 0,
    "total_students_unpaid" INTEGER NOT NULL DEFAULT 0,
    "total_students_overdue" INTEGER NOT NULL DEFAULT 0,
    "total_students_waived" INTEGER NOT NULL DEFAULT 0,
    "this_month_collection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_month_collection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "month_on_month_change" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "month_on_month_growth_percent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "this_week_collection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_week_collection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "today_collection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fee_breakdown" JSONB,
    "class_breakdown" JSONB,
    "payment_method_breakdown" JSONB,
    "total_penalty_collected_current_session" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_penalty_collected_all_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_penalty_waived_current_session" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_scholarship_value_current_session" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_scholarship_beneficiaries_current_session" INTEGER NOT NULL DEFAULT 0,
    "last_payment_at" TIMESTAMP(3),
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaystackWebhookLog" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "reference" TEXT,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "signature_valid" BOOLEAN NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processing_error" TEXT,
    "processed_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaystackWebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL,
    "receipt_url" TEXT,
    "payment_method" "ExpensePaymentMethod" NOT NULL,
    "recorded_by" TEXT NOT NULL,
    "approved_by" TEXT,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeAutoDeductionSetting" (
    "id" TEXT NOT NULL,
    "fee_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "deduction_date" TIMESTAMP(3),
    "last_run_at" TIMESTAMP(3),
    "created_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeeAutoDeductionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Fee_school_id_idx" ON "Fee"("school_id");

-- CreateIndex
CREATE INDEX "Fee_academic_session_id_idx" ON "Fee"("academic_session_id");

-- CreateIndex
CREATE INDEX "Fee_fee_type_idx" ON "Fee"("fee_type");

-- CreateIndex
CREATE INDEX "Fee_is_active_idx" ON "Fee"("is_active");

-- CreateIndex
CREATE INDEX "Fee_school_id_academic_session_id_idx" ON "Fee"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "FeeClassAssignment_fee_id_idx" ON "FeeClassAssignment"("fee_id");

-- CreateIndex
CREATE INDEX "FeeClassAssignment_class_id_idx" ON "FeeClassAssignment"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeClassAssignment_fee_id_class_id_key" ON "FeeClassAssignment"("fee_id", "class_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeePaymentPlan_fee_id_key" ON "FeePaymentPlan"("fee_id");

-- CreateIndex
CREATE INDEX "FeeInstallmentSchedule_payment_plan_id_idx" ON "FeeInstallmentSchedule"("payment_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeInstallmentSchedule_payment_plan_id_installment_number_key" ON "FeeInstallmentSchedule"("payment_plan_id", "installment_number");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_student_id_idx" ON "StudentFeeRecord"("student_id");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_fee_id_idx" ON "StudentFeeRecord"("fee_id");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_school_id_idx" ON "StudentFeeRecord"("school_id");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_academic_session_id_idx" ON "StudentFeeRecord"("academic_session_id");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_class_id_idx" ON "StudentFeeRecord"("class_id");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_status_idx" ON "StudentFeeRecord"("status");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_is_completed_idx" ON "StudentFeeRecord"("is_completed");

-- CreateIndex
CREATE INDEX "StudentFeeRecord_school_id_academic_session_id_status_idx" ON "StudentFeeRecord"("school_id", "academic_session_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeRecord_student_id_fee_id_academic_session_id_key" ON "StudentFeeRecord"("student_id", "fee_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "StudentInstallmentPayment_student_fee_record_id_idx" ON "StudentInstallmentPayment"("student_fee_record_id");

-- CreateIndex
CREATE INDEX "StudentInstallmentPayment_installment_schedule_id_idx" ON "StudentInstallmentPayment"("installment_schedule_id");

-- CreateIndex
CREATE INDEX "StudentInstallmentPayment_fee_payment_id_idx" ON "StudentInstallmentPayment"("fee_payment_id");

-- CreateIndex
CREATE INDEX "StudentInstallmentPayment_student_id_idx" ON "StudentInstallmentPayment"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_receipt_number_key" ON "FeePayment"("receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "FeePayment_paystack_reference_key" ON "FeePayment"("paystack_reference");

-- CreateIndex
CREATE INDEX "FeePayment_student_id_idx" ON "FeePayment"("student_id");

-- CreateIndex
CREATE INDEX "FeePayment_fee_id_idx" ON "FeePayment"("fee_id");

-- CreateIndex
CREATE INDEX "FeePayment_school_id_idx" ON "FeePayment"("school_id");

-- CreateIndex
CREATE INDEX "FeePayment_academic_session_id_idx" ON "FeePayment"("academic_session_id");

-- CreateIndex
CREATE INDEX "FeePayment_student_fee_record_id_idx" ON "FeePayment"("student_fee_record_id");

-- CreateIndex
CREATE INDEX "FeePayment_status_idx" ON "FeePayment"("status");

-- CreateIndex
CREATE INDEX "FeePayment_payment_method_idx" ON "FeePayment"("payment_method");

-- CreateIndex
CREATE INDEX "FeePayment_receipt_number_idx" ON "FeePayment"("receipt_number");

-- CreateIndex
CREATE INDEX "FeePayment_paystack_reference_idx" ON "FeePayment"("paystack_reference");

-- CreateIndex
CREATE INDEX "FeePayment_school_id_academic_session_id_idx" ON "FeePayment"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "FeePayment_createdAt_idx" ON "FeePayment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTopUp_paystack_reference_key" ON "WalletTopUp"("paystack_reference");

-- CreateIndex
CREATE INDEX "WalletTopUp_wallet_id_idx" ON "WalletTopUp"("wallet_id");

-- CreateIndex
CREATE INDEX "WalletTopUp_owner_id_idx" ON "WalletTopUp"("owner_id");

-- CreateIndex
CREATE INDEX "WalletTopUp_status_idx" ON "WalletTopUp"("status");

-- CreateIndex
CREATE INDEX "WalletTopUp_paystack_reference_idx" ON "WalletTopUp"("paystack_reference");

-- CreateIndex
CREATE INDEX "WalletTopUp_createdAt_idx" ON "WalletTopUp"("createdAt");

-- CreateIndex
CREATE INDEX "WalletTransfer_from_wallet_id_idx" ON "WalletTransfer"("from_wallet_id");

-- CreateIndex
CREATE INDEX "WalletTransfer_to_wallet_id_idx" ON "WalletTransfer"("to_wallet_id");

-- CreateIndex
CREATE INDEX "WalletTransfer_status_idx" ON "WalletTransfer"("status");

-- CreateIndex
CREATE INDEX "WalletTransfer_createdAt_idx" ON "WalletTransfer"("createdAt");

-- CreateIndex
CREATE INDEX "Scholarship_school_id_idx" ON "Scholarship"("school_id");

-- CreateIndex
CREATE INDEX "Scholarship_academic_session_id_idx" ON "Scholarship"("academic_session_id");

-- CreateIndex
CREATE INDEX "Scholarship_is_active_idx" ON "Scholarship"("is_active");

-- CreateIndex
CREATE INDEX "Scholarship_school_id_academic_session_id_idx" ON "Scholarship"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "FeeWaiver_student_fee_record_id_idx" ON "FeeWaiver"("student_fee_record_id");

-- CreateIndex
CREATE INDEX "FeeWaiver_student_id_idx" ON "FeeWaiver"("student_id");

-- CreateIndex
CREATE INDEX "FeeWaiver_fee_id_idx" ON "FeeWaiver"("fee_id");

-- CreateIndex
CREATE INDEX "FeeWaiver_school_id_idx" ON "FeeWaiver"("school_id");

-- CreateIndex
CREATE INDEX "FeeWaiver_academic_session_id_idx" ON "FeeWaiver"("academic_session_id");

-- CreateIndex
CREATE INDEX "FeeWaiver_status_idx" ON "FeeWaiver"("status");

-- CreateIndex
CREATE INDEX "FeeWaiver_scholarship_id_idx" ON "FeeWaiver"("scholarship_id");

-- CreateIndex
CREATE INDEX "FeeWaiver_school_id_academic_session_id_status_idx" ON "FeeWaiver"("school_id", "academic_session_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FeePenaltyRule_fee_id_key" ON "FeePenaltyRule"("fee_id");

-- CreateIndex
CREATE INDEX "FeePenaltyRule_fee_id_idx" ON "FeePenaltyRule"("fee_id");

-- CreateIndex
CREATE INDEX "FeePenaltyRule_school_id_idx" ON "FeePenaltyRule"("school_id");

-- CreateIndex
CREATE INDEX "FeePenaltyRule_is_active_idx" ON "FeePenaltyRule"("is_active");

-- CreateIndex
CREATE INDEX "FeeLatePenalty_student_fee_record_id_idx" ON "FeeLatePenalty"("student_fee_record_id");

-- CreateIndex
CREATE INDEX "FeeLatePenalty_student_id_idx" ON "FeeLatePenalty"("student_id");

-- CreateIndex
CREATE INDEX "FeeLatePenalty_fee_id_idx" ON "FeeLatePenalty"("fee_id");

-- CreateIndex
CREATE INDEX "FeeLatePenalty_school_id_idx" ON "FeeLatePenalty"("school_id");

-- CreateIndex
CREATE INDEX "FeeLatePenalty_penalty_rule_id_idx" ON "FeeLatePenalty"("penalty_rule_id");

-- CreateIndex
CREATE INDEX "FeeLatePenalty_status_idx" ON "FeeLatePenalty"("status");

-- CreateIndex
CREATE INDEX "FeeLatePenalty_applied_at_idx" ON "FeeLatePenalty"("applied_at");

-- CreateIndex
CREATE INDEX "RefundRequest_school_id_idx" ON "RefundRequest"("school_id");

-- CreateIndex
CREATE INDEX "RefundRequest_student_id_idx" ON "RefundRequest"("student_id");

-- CreateIndex
CREATE INDEX "RefundRequest_fee_payment_id_idx" ON "RefundRequest"("fee_payment_id");

-- CreateIndex
CREATE INDEX "RefundRequest_student_fee_record_id_idx" ON "RefundRequest"("student_fee_record_id");

-- CreateIndex
CREATE INDEX "RefundRequest_status_idx" ON "RefundRequest"("status");

-- CreateIndex
CREATE INDEX "RefundRequest_school_id_status_idx" ON "RefundRequest"("school_id", "status");

-- CreateIndex
CREATE INDEX "RefundRequest_createdAt_idx" ON "RefundRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WalletAnalytics_wallet_id_key" ON "WalletAnalytics"("wallet_id");

-- CreateIndex
CREATE INDEX "PaystackWebhookLog_event_type_idx" ON "PaystackWebhookLog"("event_type");

-- CreateIndex
CREATE INDEX "PaystackWebhookLog_reference_idx" ON "PaystackWebhookLog"("reference");

-- CreateIndex
CREATE INDEX "PaystackWebhookLog_processed_idx" ON "PaystackWebhookLog"("processed");

-- CreateIndex
CREATE INDEX "PaystackWebhookLog_createdAt_idx" ON "PaystackWebhookLog"("createdAt");

-- CreateIndex
CREATE INDEX "Expense_school_id_idx" ON "Expense"("school_id");

-- CreateIndex
CREATE INDEX "Expense_academic_session_id_idx" ON "Expense"("academic_session_id");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE INDEX "Expense_expense_date_idx" ON "Expense"("expense_date");

-- CreateIndex
CREATE INDEX "Expense_school_id_academic_session_id_idx" ON "Expense"("school_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "FeeAutoDeductionSetting_fee_id_key" ON "FeeAutoDeductionSetting"("fee_id");

-- CreateIndex
CREATE INDEX "Wallet_owner_id_idx" ON "Wallet"("owner_id");

-- CreateIndex
CREATE INDEX "Wallet_owner_type_idx" ON "Wallet"("owner_type");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_owner_id_owner_type_key" ON "Wallet"("owner_id", "owner_type");

-- CreateIndex
CREATE INDEX "WalletTransaction_payment_id_idx" ON "WalletTransaction"("payment_id");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "FeePayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeClassAssignment" ADD CONSTRAINT "FeeClassAssignment_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "Fee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeClassAssignment" ADD CONSTRAINT "FeeClassAssignment_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePaymentPlan" ADD CONSTRAINT "FeePaymentPlan_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "Fee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeInstallmentSchedule" ADD CONSTRAINT "FeeInstallmentSchedule_payment_plan_id_fkey" FOREIGN KEY ("payment_plan_id") REFERENCES "FeePaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeRecord" ADD CONSTRAINT "StudentFeeRecord_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInstallmentPayment" ADD CONSTRAINT "StudentInstallmentPayment_student_fee_record_id_fkey" FOREIGN KEY ("student_fee_record_id") REFERENCES "StudentFeeRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInstallmentPayment" ADD CONSTRAINT "StudentInstallmentPayment_installment_schedule_id_fkey" FOREIGN KEY ("installment_schedule_id") REFERENCES "FeeInstallmentSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInstallmentPayment" ADD CONSTRAINT "StudentInstallmentPayment_fee_payment_id_fkey" FOREIGN KEY ("fee_payment_id") REFERENCES "FeePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInstallmentPayment" ADD CONSTRAINT "StudentInstallmentPayment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_student_fee_record_id_fkey" FOREIGN KEY ("student_fee_record_id") REFERENCES "StudentFeeRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTopUp" ADD CONSTRAINT "WalletTopUp_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_from_wallet_id_fkey" FOREIGN KEY ("from_wallet_id") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransfer" ADD CONSTRAINT "WalletTransfer_to_wallet_id_fkey" FOREIGN KEY ("to_wallet_id") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scholarship" ADD CONSTRAINT "Scholarship_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaiver" ADD CONSTRAINT "FeeWaiver_student_fee_record_id_fkey" FOREIGN KEY ("student_fee_record_id") REFERENCES "StudentFeeRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaiver" ADD CONSTRAINT "FeeWaiver_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaiver" ADD CONSTRAINT "FeeWaiver_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaiver" ADD CONSTRAINT "FeeWaiver_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaiver" ADD CONSTRAINT "FeeWaiver_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeWaiver" ADD CONSTRAINT "FeeWaiver_scholarship_id_fkey" FOREIGN KEY ("scholarship_id") REFERENCES "Scholarship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePenaltyRule" ADD CONSTRAINT "FeePenaltyRule_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePenaltyRule" ADD CONSTRAINT "FeePenaltyRule_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLatePenalty" ADD CONSTRAINT "FeeLatePenalty_student_fee_record_id_fkey" FOREIGN KEY ("student_fee_record_id") REFERENCES "StudentFeeRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLatePenalty" ADD CONSTRAINT "FeeLatePenalty_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLatePenalty" ADD CONSTRAINT "FeeLatePenalty_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLatePenalty" ADD CONSTRAINT "FeeLatePenalty_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeLatePenalty" ADD CONSTRAINT "FeeLatePenalty_penalty_rule_id_fkey" FOREIGN KEY ("penalty_rule_id") REFERENCES "FeePenaltyRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_fee_payment_id_fkey" FOREIGN KEY ("fee_payment_id") REFERENCES "FeePayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_student_fee_record_id_fkey" FOREIGN KEY ("student_fee_record_id") REFERENCES "StudentFeeRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletAnalytics" ADD CONSTRAINT "WalletAnalytics_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeAutoDeductionSetting" ADD CONSTRAINT "FeeAutoDeductionSetting_fee_id_fkey" FOREIGN KEY ("fee_id") REFERENCES "Fee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
