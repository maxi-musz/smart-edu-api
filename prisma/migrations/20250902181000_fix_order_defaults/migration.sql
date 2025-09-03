-- Migration: Fix order field defaults from 0 to 1
-- Migration: 20250902181000_fix_order_defaults

-- Update VideoContent order default
ALTER TABLE "VideoContent" ALTER COLUMN "order" SET DEFAULT 1;

-- Update PDFMaterial order default  
ALTER TABLE "PDFMaterial" ALTER COLUMN "order" SET DEFAULT 1;

-- Update CBTQuiz order default
ALTER TABLE "CBTQuiz" ALTER COLUMN "order" SET DEFAULT 1;

-- Update LiveClass order default
ALTER TABLE "LiveClass" ALTER COLUMN "order" SET DEFAULT 1;

-- Update LibraryResource order default
ALTER TABLE "LibraryResource" ALTER COLUMN "order" SET DEFAULT 1;

-- Update existing records to start from 1 instead of 0
UPDATE "VideoContent" SET "order" = 1 WHERE "order" = 0;
UPDATE "PDFMaterial" SET "order" = 1 WHERE "order" = 0;
UPDATE "CBTQuiz" SET "order" = 1 WHERE "order" = 0;
UPDATE "LiveClass" SET "order" = 1 WHERE "order" = 0;
UPDATE "LibraryResource" SET "order" = 1 WHERE "order" = 0;

-- Down Migration (rollback)
-- ALTER TABLE "VideoContent" ALTER COLUMN "order" SET DEFAULT 0;
-- ALTER TABLE "PDFMaterial" ALTER COLUMN "order" SET DEFAULT 0;
-- ALTER TABLE "CBTQuiz" ALTER COLUMN "order" SET DEFAULT 0;
-- ALTER TABLE "LiveClass" ALTER COLUMN "order" SET DEFAULT 0;
-- ALTER TABLE "LibraryResource" ALTER COLUMN "order" SET DEFAULT 0;
