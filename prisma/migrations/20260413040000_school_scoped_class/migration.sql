-- School-scoped Class: removes session ownership of class rows.
-- **If your database already has multiple Class rows per school with the same name**
-- (e.g. "JSS1" repeated per academic session), run `npm run merge-classes-school-scope`
-- *before* applying this migration, or the UNIQUE(schoolId, name) step will fail.

-- Drop indexes that include academic_session_id on Class
DROP INDEX IF EXISTS "Class_schoolId_academic_session_id_classId_key";
DROP INDEX IF EXISTS "Class_schoolId_academic_session_id_idx";
DROP INDEX IF EXISTS "Class_schoolId_academic_session_id_display_order_idx";
DROP INDEX IF EXISTS "Class_schoolId_academic_session_id_is_graduates_idx";

ALTER TABLE "Class" DROP CONSTRAINT IF EXISTS "Class_academic_session_id_fkey";

ALTER TABLE "Class" DROP COLUMN "academic_session_id";

CREATE UNIQUE INDEX "Class_schoolId_name_key" ON "Class"("schoolId", "name");

CREATE INDEX "Class_schoolId_display_order_idx" ON "Class"("schoolId", "display_order");

CREATE INDEX "Class_schoolId_is_graduates_idx" ON "Class"("schoolId", "is_graduates");
