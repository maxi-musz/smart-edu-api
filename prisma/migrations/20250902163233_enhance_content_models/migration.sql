-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "maxScore" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "timeLimit" INTEGER;

-- AlterTable
ALTER TABLE "CBTQuiz" ADD COLUMN     "passingScore" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN     "totalQuestions" INTEGER;

-- AlterTable
ALTER TABLE "LibraryResource" ADD COLUMN     "format" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'available';

-- AlterTable
ALTER TABLE "LiveClass" ADD COLUMN     "maxParticipants" INTEGER,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'scheduled';

-- AlterTable
ALTER TABLE "PDFMaterial" ADD COLUMN     "downloads" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published';

-- AlterTable
ALTER TABLE "VideoContent" ADD COLUMN     "duration" TEXT,
ADD COLUMN     "size" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'published',
ADD COLUMN     "thumbnail" JSONB,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");

-- CreateIndex
CREATE INDEX "Assignment_createdAt_idx" ON "Assignment"("createdAt");

-- CreateIndex
CREATE INDEX "CBTQuiz_status_idx" ON "CBTQuiz"("status");

-- CreateIndex
CREATE INDEX "CBTQuiz_createdAt_idx" ON "CBTQuiz"("createdAt");

-- CreateIndex
CREATE INDEX "LibraryResource_status_idx" ON "LibraryResource"("status");

-- CreateIndex
CREATE INDEX "LibraryResource_createdAt_idx" ON "LibraryResource"("createdAt");

-- CreateIndex
CREATE INDEX "LiveClass_status_idx" ON "LiveClass"("status");

-- CreateIndex
CREATE INDEX "LiveClass_createdAt_idx" ON "LiveClass"("createdAt");

-- CreateIndex
CREATE INDEX "PDFMaterial_status_idx" ON "PDFMaterial"("status");

-- CreateIndex
CREATE INDEX "PDFMaterial_createdAt_idx" ON "PDFMaterial"("createdAt");

-- CreateIndex
CREATE INDEX "VideoContent_status_idx" ON "VideoContent"("status");

-- CreateIndex
CREATE INDEX "VideoContent_createdAt_idx" ON "VideoContent"("createdAt");
