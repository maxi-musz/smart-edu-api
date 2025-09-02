/*
  Warnings:

  - You are about to drop the column `subjectId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `CBTQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `LiveClass` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `PDFMaterial` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `VideoContent` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Assignment_subjectId_idx";

-- DropIndex
DROP INDEX "CBTQuiz_subjectId_idx";

-- DropIndex
DROP INDEX "LiveClass_subjectId_idx";

-- DropIndex
DROP INDEX "PDFMaterial_subjectId_idx";

-- DropIndex
DROP INDEX "VideoContent_subjectId_idx";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "subjectId",
ADD COLUMN     "topic_id" TEXT;

-- AlterTable
ALTER TABLE "CBTQuiz" DROP COLUMN "subjectId",
ADD COLUMN     "topic_id" TEXT;

-- AlterTable
ALTER TABLE "LibraryResource" ADD COLUMN     "topic_id" TEXT;

-- AlterTable
ALTER TABLE "LiveClass" DROP COLUMN "subjectId",
ADD COLUMN     "topic_id" TEXT;

-- AlterTable
ALTER TABLE "PDFMaterial" DROP COLUMN "subjectId",
ADD COLUMN     "topic_id" TEXT;

-- AlterTable
ALTER TABLE "VideoContent" DROP COLUMN "subjectId",
ADD COLUMN     "topic_id" TEXT;

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "subject_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Topic_subject_id_order_idx" ON "Topic"("subject_id", "order");

-- CreateIndex
CREATE INDEX "Topic_school_id_academic_session_id_idx" ON "Topic"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "Topic_created_by_idx" ON "Topic"("created_by");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_subject_id_title_academic_session_id_key" ON "Topic"("subject_id", "title", "academic_session_id");

-- CreateIndex
CREATE INDEX "Assignment_topic_id_idx" ON "Assignment"("topic_id");

-- CreateIndex
CREATE INDEX "CBTQuiz_topic_id_idx" ON "CBTQuiz"("topic_id");

-- CreateIndex
CREATE INDEX "LibraryResource_topic_id_idx" ON "LibraryResource"("topic_id");

-- CreateIndex
CREATE INDEX "LiveClass_topic_id_idx" ON "LiveClass"("topic_id");

-- CreateIndex
CREATE INDEX "PDFMaterial_topic_id_idx" ON "PDFMaterial"("topic_id");

-- CreateIndex
CREATE INDEX "VideoContent_topic_id_idx" ON "VideoContent"("topic_id");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoContent" ADD CONSTRAINT "VideoContent_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PDFMaterial" ADD CONSTRAINT "PDFMaterial_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuiz" ADD CONSTRAINT "CBTQuiz_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClass" ADD CONSTRAINT "LiveClass_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResource" ADD CONSTRAINT "LibraryResource_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
