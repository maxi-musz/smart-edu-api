-- Remove LibraryChapter model and update LibraryTopic to work directly under LibrarySubject
-- This migration simplifies the library structure from Subject → Chapter → Topic to Subject → Topic

-- Step 1: Drop foreign key constraints that reference LibraryChapter
ALTER TABLE "LibraryTopic" DROP CONSTRAINT IF EXISTS "LibraryTopic_chapterId_fkey";
ALTER TABLE "LibraryComment" DROP CONSTRAINT IF EXISTS "LibraryComment_chapterId_fkey";
ALTER TABLE "LibraryLink" DROP CONSTRAINT IF EXISTS "LibraryLink_chapterId_fkey";
ALTER TABLE "LibraryAssessment" DROP CONSTRAINT IF EXISTS "LibraryAssessment_chapterId_fkey";

-- Step 2: Drop indexes that reference chapterId
DROP INDEX IF EXISTS "LibraryTopic_subjectId_chapterId_idx";
DROP INDEX IF EXISTS "LibraryTopic_chapterId_order_idx";
DROP INDEX IF EXISTS "LibraryComment_chapterId_idx";
DROP INDEX IF EXISTS "LibraryLink_chapterId_idx";
DROP INDEX IF EXISTS "LibraryAssessment_chapterId_idx";

-- Step 3: Remove chapterId column from LibraryTopic (topics now belong directly to subjects)
ALTER TABLE "LibraryTopic" DROP COLUMN IF EXISTS "chapterId";

-- Step 4: Remove chapterId column from LibraryComment (comments can only be on subjects or topics)
ALTER TABLE "LibraryComment" DROP COLUMN IF EXISTS "chapterId";

-- Step 5: Remove chapterId column from LibraryLink (links can only be on subjects or topics)
ALTER TABLE "LibraryLink" DROP COLUMN IF EXISTS "chapterId";

-- Step 6: Remove chapterId column from LibraryAssessment (assessments can only be on subjects or topics)
ALTER TABLE "LibraryAssessment" DROP COLUMN IF EXISTS "chapterId";

-- Step 7: Drop the LibraryChapter table
DROP TABLE IF EXISTS "LibraryChapter";

-- Step 8: Update indexes for LibraryTopic (now only needs subjectId and order)
CREATE INDEX IF NOT EXISTS "LibraryTopic_subjectId_order_idx" ON "LibraryTopic"("subjectId", "order");
