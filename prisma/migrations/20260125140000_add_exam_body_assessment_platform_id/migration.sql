-- DropIndex
DROP INDEX IF EXISTS "ExamBodyAssessment_examBodyId_subjectId_yearId_key";

-- AlterTable
ALTER TABLE "ExamBodyAssessment" ADD COLUMN IF NOT EXISTS "platformId" TEXT;
ALTER TABLE "ExamBodyAssessment" ALTER COLUMN "maxAttempts" DROP NOT NULL;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ExamBodyAssessment_platformId_idx" ON "ExamBodyAssessment"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ExamBodyAssessment_platformId_examBodyId_subjectId_yearId_key" ON "ExamBodyAssessment"("platformId", "examBodyId", "subjectId", "yearId");

-- AddForeignKey
ALTER TABLE "ExamBodyAssessment" ADD CONSTRAINT "ExamBodyAssessment_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "LibraryPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;
