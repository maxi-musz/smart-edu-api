-- AlterEnum
-- Add update_subject to AuditForType enum for subject edit audit logging.
ALTER TYPE "AuditForType" ADD VALUE 'update_subject';
