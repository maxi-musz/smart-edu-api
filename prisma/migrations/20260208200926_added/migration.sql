-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditForType" ADD VALUE 'release_results';
ALTER TYPE "AuditForType" ADD VALUE 'unrelease_results';

-- AlterTable
ALTER TABLE "Assessment" ALTER COLUMN "student_can_view_grading" SET DEFAULT false;
