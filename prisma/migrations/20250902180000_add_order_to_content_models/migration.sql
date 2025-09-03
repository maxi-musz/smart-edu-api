-- Migration: Add order field to all content models
-- Migration: 20250902180000_add_order_to_content_models

-- Add order field to VideoContent
ALTER TABLE "VideoContent" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add order field to PDFMaterial
ALTER TABLE "PDFMaterial" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add order field to Assignment
ALTER TABLE "Assignment" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add order field to CBTQuiz
ALTER TABLE "CBTQuiz" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add order field to LiveClass
ALTER TABLE "LiveClass" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add order field to LibraryResource
ALTER TABLE "LibraryResource" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Create indexes for order fields
CREATE INDEX "VideoContent_order_idx" ON "VideoContent"("order");
CREATE INDEX "PDFMaterial_order_idx" ON "PDFMaterial"("order");
CREATE INDEX "Assignment_order_idx" ON "Assignment"("order");
CREATE INDEX "CBTQuiz_order_idx" ON "CBTQuiz"("order");
CREATE INDEX "LiveClass_order_idx" ON "LiveClass"("order");
CREATE INDEX "LibraryResource_order_idx" ON "LibraryResource"("order");

-- Down Migration (rollback)
-- ALTER TABLE "VideoContent" DROP COLUMN "order";
-- ALTER TABLE "PDFMaterial" DROP COLUMN "order";
-- ALTER TABLE "Assignment" DROP COLUMN "order";
-- ALTER TABLE "CBTQuiz" DROP COLUMN "order";
-- ALTER TABLE "LiveClass" DROP COLUMN "order";
-- ALTER TABLE "LibraryResource" DROP COLUMN "order";
-- DROP INDEX "VideoContent_order_idx";
-- DROP INDEX "PDFMaterial_order_idx";
-- DROP INDEX "Assignment_order_idx";
-- DROP INDEX "CBTQuiz_order_idx";
-- DROP INDEX "LiveClass_order_idx";
-- DROP INDEX "LibraryResource_order_idx";
