-- CreateEnum
CREATE TYPE "AuditForType" AS ENUM ('onboard_school');

-- CreateEnum
CREATE TYPE "AuditPerformedByType" AS ENUM ('school_user', 'library_user');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "audit_for_type" "AuditForType" NOT NULL,
    "target_id" TEXT,
    "performed_by_id" TEXT,
    "performed_by_type" "AuditPerformedByType",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_audit_for_type_idx" ON "AuditLog"("audit_for_type");

-- CreateIndex
CREATE INDEX "AuditLog_target_id_idx" ON "AuditLog"("target_id");

-- CreateIndex
CREATE INDEX "AuditLog_performed_by_id_idx" ON "AuditLog"("performed_by_id");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
