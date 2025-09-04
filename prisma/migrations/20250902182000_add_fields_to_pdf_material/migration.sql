-- Migration: Add fileType and originalName fields to PDFMaterial
-- Migration: 20250902182000_add_fields_to_pdf_material

-- Add fileType field to PDFMaterial
ALTER TABLE "PDFMaterial" ADD COLUMN "fileType" TEXT;

-- Add originalName field to PDFMaterial
ALTER TABLE "PDFMaterial" ADD COLUMN "originalName" TEXT;

-- Update existing records to have default values
UPDATE "PDFMaterial" SET "fileType" = 'pdf' WHERE "fileType" IS NULL;
UPDATE "PDFMaterial" SET "originalName" = 'unknown' WHERE "originalName" IS NULL;

-- Down Migration (rollback)
-- ALTER TABLE "PDFMaterial" DROP COLUMN "fileType";
-- ALTER TABLE "PDFMaterial" DROP COLUMN "originalName";
