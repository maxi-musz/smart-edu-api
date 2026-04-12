-- AlterTable: business IDs on User for login (per-school uniqueness)
ALTER TABLE "User" ADD COLUMN "student_id" TEXT;
ALTER TABLE "User" ADD COLUMN "teacher_id" TEXT;

-- Student: global unique -> per-school + student_id
DROP INDEX IF EXISTS "Student_student_id_key";
CREATE UNIQUE INDEX "Student_school_id_student_id_key" ON "Student"("school_id", "student_id");

-- Teacher: global unique -> per-school + teacher_id
DROP INDEX IF EXISTS "Teacher_teacher_id_key";
CREATE UNIQUE INDEX "Teacher_school_id_teacher_id_key" ON "Teacher"("school_id", "teacher_id");

-- User: composite uniqueness for business IDs
CREATE UNIQUE INDEX "User_school_id_student_id_key" ON "User"("school_id", "student_id");
CREATE UNIQUE INDEX "User_school_id_teacher_id_key" ON "User"("school_id", "teacher_id");

-- Backfill from existing Student / Teacher rows
UPDATE "User" u
SET "student_id" = s.student_id
FROM "Student" s
WHERE s.user_id = u.id;

UPDATE "User" u
SET "teacher_id" = t.teacher_id
FROM "Teacher" t
WHERE t.user_id = u.id;
