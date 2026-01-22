-- CreateEnum
CREATE TYPE "ChapterStatus" AS ENUM ('active', 'deleted');

-- AlterTable
ALTER TABLE "LibraryGeneralMaterialChapter" ADD COLUMN     "chapterStatus" "ChapterStatus" NOT NULL DEFAULT 'active';

-- CreateIndex
CREATE INDEX "LibraryGeneralMaterialChapter_chapterStatus_idx" ON "LibraryGeneralMaterialChapter"("chapterStatus");
