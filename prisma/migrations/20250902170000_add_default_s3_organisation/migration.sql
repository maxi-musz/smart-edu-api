-- Migration: Add default S3 and Cloudinary organisations
-- Migration: 20250902170000_add_default_s3_organisation

-- Up Migration
-- Add default S3 organisation
INSERT INTO "Organisation" ("id", "name", "email", "createdAt", "updatedAt") 
VALUES (
  's3-platform-001', 
  'AWS S3', 
  's3@smart-edu.com', 
  NOW(), 
  NOW()
) ON CONFLICT ("name") DO NOTHING;

-- Add default Cloudinary organisation
INSERT INTO "Organisation" ("id", "name", "email", "createdAt", "updatedAt") 
VALUES (
  'cloudinary-platform-001', 
  'Cloudinary', 
  'cloudinary@smart-edu.com', 
  NOW(), 
  NOW()
) ON CONFLICT ("name") DO NOTHING;

-- Down Migration (rollback)
-- DELETE FROM "Organisation" WHERE "name" IN ('AWS S3', 'Cloudinary');
