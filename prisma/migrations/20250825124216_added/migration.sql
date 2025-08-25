/*
  Warnings:

  - The `display_picture` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "display_picture" JSONB,
ADD COLUMN     "first_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "last_name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "phone_number" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "display_picture",
ADD COLUMN     "display_picture" JSONB;

-- CreateTable
CREATE TABLE "DisplayPicture" (
    "id" TEXT NOT NULL,
    "secure_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,

    CONSTRAINT "DisplayPicture_pkey" PRIMARY KEY ("id")
);
