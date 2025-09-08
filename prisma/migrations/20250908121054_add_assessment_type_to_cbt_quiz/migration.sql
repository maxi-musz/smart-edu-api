-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('FORMATIVE', 'SUMMATIVE', 'DIAGNOSTIC', 'BENCHMARK', 'PRACTICE', 'MOCK_EXAM', 'QUIZ', 'TEST', 'EXAM', 'ASSIGNMENT');

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_subject_id_fkey";

-- AlterTable
ALTER TABLE "CBTQuiz" ADD COLUMN     "assessment_type" "AssessmentType" NOT NULL DEFAULT 'QUIZ';

-- CreateIndex
CREATE INDEX "CBTQuiz_assessment_type_idx" ON "CBTQuiz"("assessment_type");

-- AddForeignKey
ALTER TABLE "CBTQuiz" ADD CONSTRAINT "CBTQuiz_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
