/*
  Warnings:

  - You are about to drop the `CBTQuiz` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[materialId]` on the table `PDFMaterial` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CBTQuestion" DROP CONSTRAINT "CBTQuestion_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_academic_session_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_created_by_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_school_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuizAnalytics" DROP CONSTRAINT "CBTQuizAnalytics_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuizAttempt" DROP CONSTRAINT "CBTQuizAttempt_quiz_id_fkey";

-- AlterTable
ALTER TABLE "DocumentChunk" ALTER COLUMN "keywords" SET DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "PDFMaterial" ADD COLUMN     "materialId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "filesUploadedThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastFileResetDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastTokenResetDateAllTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "maxFileSizeMB" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "maxFilesPerMonth" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "maxMessagesPerWeek" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "maxStorageMB" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "maxTokensPerDay" INTEGER NOT NULL DEFAULT 50000,
ADD COLUMN     "maxTokensPerWeek" INTEGER NOT NULL DEFAULT 50000,
ADD COLUMN     "messagesSentThisWeek" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tokensUsedAllTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tokensUsedThisDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tokensUsedThisWeek" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalFilesUploadedAllTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalStorageUsedMB" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "CBTQuiz";

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topic_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "academic_session_id" TEXT NOT NULL,
    "allow_review" BOOLEAN NOT NULL DEFAULT true,
    "auto_submit" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "end_date" TIMESTAMP(3),
    "grading_type" "GradingType" NOT NULL DEFAULT 'AUTOMATIC',
    "instructions" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "max_attempts" INTEGER NOT NULL DEFAULT 1,
    "passing_score" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "published_at" TIMESTAMP(3),
    "school_id" TEXT NOT NULL,
    "show_correct_answers" BOOLEAN NOT NULL DEFAULT false,
    "show_feedback" BOOLEAN NOT NULL DEFAULT true,
    "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
    "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "tags" TEXT[],
    "time_limit" INTEGER,
    "total_points" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT',
    "subject_id" TEXT NOT NULL,
    "assessment_type" "AssessmentType" NOT NULL DEFAULT 'CBT',
    "submissions" JSONB,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSubmission" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "submission_type" "AssessmentType" NOT NULL DEFAULT 'CBT',
    "content" TEXT,
    "attachment_url" TEXT,
    "attachment_type" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "late_submission" BOOLEAN NOT NULL DEFAULT false,
    "word_count" INTEGER,
    "file_size" TEXT,
    "total_score" DOUBLE PRECISION,
    "max_score" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "is_graded" BOOLEAN NOT NULL DEFAULT false,
    "graded_at" TIMESTAMP(3),
    "graded_by" TEXT,
    "feedback" TEXT,
    "grade_letter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assessment_school_id_academic_session_id_idx" ON "Assessment"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "Assessment_topic_id_idx" ON "Assessment"("topic_id");

-- CreateIndex
CREATE INDEX "Assessment_created_by_idx" ON "Assessment"("created_by");

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "Assessment"("status");

-- CreateIndex
CREATE INDEX "Assessment_is_published_idx" ON "Assessment"("is_published");

-- CreateIndex
CREATE INDEX "Assessment_assessment_type_idx" ON "Assessment"("assessment_type");

-- CreateIndex
CREATE INDEX "Assessment_start_date_end_date_idx" ON "Assessment"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_assessment_id_idx" ON "AssessmentSubmission"("assessment_id");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_student_id_idx" ON "AssessmentSubmission"("student_id");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_school_id_academic_session_id_idx" ON "AssessmentSubmission"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_submitted_at_idx" ON "AssessmentSubmission"("submitted_at");

-- CreateIndex
CREATE INDEX "AssessmentSubmission_status_idx" ON "AssessmentSubmission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSubmission_assessment_id_student_id_key" ON "AssessmentSubmission"("assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "document_chunk_embedding_cosine_idx" ON "DocumentChunk"("embedding");

-- CreateIndex
CREATE UNIQUE INDEX "PDFMaterial_materialId_key" ON "PDFMaterial"("materialId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuestion" ADD CONSTRAINT "CBTQuestion_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuizAttempt" ADD CONSTRAINT "CBTQuizAttempt_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSubmission" ADD CONSTRAINT "AssessmentSubmission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuizAnalytics" ADD CONSTRAINT "CBTQuizAnalytics_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
