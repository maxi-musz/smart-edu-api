-- AlterEnum
ALTER TYPE "AuditForType" ADD VALUE 'management_academic_session_create';
ALTER TYPE "AuditForType" ADD VALUE 'management_academic_session_update';
ALTER TYPE "AuditForType" ADD VALUE 'management_academic_session_delete';
ALTER TYPE "AuditForType" ADD VALUE 'management_set_current_session';
ALTER TYPE "AuditForType" ADD VALUE 'management_class_reorder';
ALTER TYPE "AuditForType" ADD VALUE 'management_student_promote';
ALTER TYPE "AuditForType" ADD VALUE 'management_student_demote';
ALTER TYPE "AuditForType" ADD VALUE 'management_student_bulk_assign_class';

-- AlterTable Class
ALTER TABLE "Class" ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0;

-- Backfill ladder order from existing sequence per session
UPDATE "Class" SET "display_order" = "classId";

-- AlterTable AuditLog
ALTER TABLE "AuditLog" ADD COLUMN "school_id" TEXT;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "AuditLog_school_id_idx" ON "AuditLog"("school_id");

CREATE INDEX "Class_schoolId_academic_session_id_display_order_idx" ON "Class"("schoolId", "academic_session_id", "display_order");
