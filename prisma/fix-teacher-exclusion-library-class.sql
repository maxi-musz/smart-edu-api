-- Fix TeacherResourceExclusion: add libraryClassId and sync with migration history.
-- Run with: npx prisma db execute --file prisma/fix-teacher-exclusion-library-class.sql
-- Or: psql $DATABASE_URL -f prisma/fix-teacher-exclusion-library-class.sql

-- 1. Add column (idempotent)
ALTER TABLE "TeacherResourceExclusion" ADD COLUMN IF NOT EXISTS "libraryClassId" TEXT;

-- 2. Drop old unique index if it exists (without libraryClassId)
DROP INDEX IF EXISTS "TeacherResourceExclusion_teacherId_schoolId_subjectId_resou_key";

-- 3. Create new unique index (with libraryClassId) - may already exist
CREATE UNIQUE INDEX IF NOT EXISTS "TeacherResourceExclusion_teacherId_schoolId_subjectId_resou_key"
  ON "TeacherResourceExclusion"("teacherId", "schoolId", "subjectId", "resourceType", "resourceId", "classId", "studentId", "libraryClassId");

-- 4. Create index on libraryClassId
CREATE INDEX IF NOT EXISTS "TeacherResourceExclusion_libraryClassId_idx" ON "TeacherResourceExclusion"("libraryClassId");

-- 5. Add FK only if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'TeacherResourceExclusion_libraryClassId_fkey'
  ) THEN
    ALTER TABLE "TeacherResourceExclusion"
    ADD CONSTRAINT "TeacherResourceExclusion_libraryClassId_fkey"
    FOREIGN KEY ("libraryClassId") REFERENCES "LibraryClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- 6. Remove stale migration row (modified/deleted migration)
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260202125421_access';
