/*
  Warnings:

  - You are about to drop the column `passingScore` on the `CBTQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `platformId` on the `CBTQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `CBTQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuestions` on the `CBTQuiz` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `CBTQuiz` table. All the data in the column will be lost.
  - The `status` column on the `CBTQuiz` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `academic_session_id` to the `CBTQuiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `CBTQuiz` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_id` to the `CBTQuiz` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'SHORT_ANSWER', 'LONG_ANSWER', 'TRUE_FALSE', 'FILL_IN_BLANK', 'MATCHING', 'ORDERING', 'FILE_UPLOAD', 'NUMERIC', 'DATE', 'RATING_SCALE');

-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'GRADED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GradingType" AS ENUM ('AUTOMATIC', 'MANUAL', 'MIXED');

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_platformId_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuiz" DROP CONSTRAINT "CBTQuiz_uploadedById_fkey";

-- DropIndex
DROP INDEX "CBTQuiz_createdAt_idx";

-- DropIndex
DROP INDEX "CBTQuiz_platformId_idx";

-- DropIndex
DROP INDEX "CBTQuiz_schoolId_idx";

-- AlterTable
ALTER TABLE "CBTQuiz" DROP COLUMN "passingScore",
DROP COLUMN "platformId",
DROP COLUMN "schoolId",
DROP COLUMN "totalQuestions",
DROP COLUMN "uploadedById",
ADD COLUMN     "academic_session_id" TEXT NOT NULL,
ADD COLUMN     "allow_review" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "auto_submit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "grading_type" "GradingType" NOT NULL DEFAULT 'AUTOMATIC',
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "max_attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "passing_score" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "school_id" TEXT NOT NULL,
ADD COLUMN     "show_correct_answers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show_feedback" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shuffle_options" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shuffle_questions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "start_date" TIMESTAMP(3),
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "time_limit" INTEGER,
ADD COLUMN     "total_points" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
DROP COLUMN "status",
ADD COLUMN     "status" "QuizStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "CBTQuestion" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" "QuestionType" NOT NULL,
    "order" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "time_limit" INTEGER,
    "image_url" TEXT,
    "audio_url" TEXT,
    "video_url" TEXT,
    "allow_multiple_attempts" BOOLEAN NOT NULL DEFAULT false,
    "show_hint" BOOLEAN NOT NULL DEFAULT false,
    "hint_text" TEXT,
    "min_length" INTEGER,
    "max_length" INTEGER,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "explanation" TEXT,
    "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CBTQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CBTOption" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "audio_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CBTOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CBTCorrectAnswer" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT,
    "answer_number" DOUBLE PRECISION,
    "answer_date" TIMESTAMP(3),
    "option_ids" TEXT[],
    "answer_json" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CBTCorrectAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CBTQuizAttempt" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "status" "QuizAttemptStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "started_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "time_spent" INTEGER,
    "total_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_score" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "is_graded" BOOLEAN NOT NULL DEFAULT false,
    "graded_at" TIMESTAMP(3),
    "graded_by" TEXT,
    "overall_feedback" TEXT,
    "grade_letter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CBTQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CBTResponse" (
    "id" TEXT NOT NULL,
    "attempt_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "text_answer" TEXT,
    "numeric_answer" DOUBLE PRECISION,
    "date_answer" TIMESTAMP(3),
    "selected_options" TEXT[],
    "file_urls" TEXT[],
    "is_correct" BOOLEAN,
    "points_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_points" DOUBLE PRECISION NOT NULL,
    "time_spent" INTEGER,
    "feedback" TEXT,
    "is_graded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CBTResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CBTQuizAnalytics" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "average_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_time" INTEGER NOT NULL DEFAULT 0,
    "pass_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "question_stats" JSONB NOT NULL,
    "daily_attempts" JSONB NOT NULL,
    "hourly_attempts" JSONB NOT NULL,
    "completion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "abandonment_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CBTQuizAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ResponseOptions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ResponseOptions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "CBTQuestion_quiz_id_order_idx" ON "CBTQuestion"("quiz_id", "order");

-- CreateIndex
CREATE INDEX "CBTQuestion_question_type_idx" ON "CBTQuestion"("question_type");

-- CreateIndex
CREATE INDEX "CBTOption_question_id_order_idx" ON "CBTOption"("question_id", "order");

-- CreateIndex
CREATE INDEX "CBTCorrectAnswer_question_id_idx" ON "CBTCorrectAnswer"("question_id");

-- CreateIndex
CREATE INDEX "CBTQuizAttempt_quiz_id_idx" ON "CBTQuizAttempt"("quiz_id");

-- CreateIndex
CREATE INDEX "CBTQuizAttempt_student_id_idx" ON "CBTQuizAttempt"("student_id");

-- CreateIndex
CREATE INDEX "CBTQuizAttempt_status_idx" ON "CBTQuizAttempt"("status");

-- CreateIndex
CREATE INDEX "CBTQuizAttempt_submitted_at_idx" ON "CBTQuizAttempt"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "CBTQuizAttempt_quiz_id_student_id_attempt_number_key" ON "CBTQuizAttempt"("quiz_id", "student_id", "attempt_number");

-- CreateIndex
CREATE INDEX "CBTResponse_attempt_id_idx" ON "CBTResponse"("attempt_id");

-- CreateIndex
CREATE INDEX "CBTResponse_question_id_idx" ON "CBTResponse"("question_id");

-- CreateIndex
CREATE INDEX "CBTResponse_student_id_idx" ON "CBTResponse"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "CBTResponse_attempt_id_question_id_key" ON "CBTResponse"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "CBTQuizAnalytics_quiz_id_key" ON "CBTQuizAnalytics"("quiz_id");

-- CreateIndex
CREATE INDEX "CBTQuizAnalytics_quiz_id_idx" ON "CBTQuizAnalytics"("quiz_id");

-- CreateIndex
CREATE INDEX "_ResponseOptions_B_index" ON "_ResponseOptions"("B");

-- CreateIndex
CREATE INDEX "CBTQuiz_school_id_academic_session_id_idx" ON "CBTQuiz"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "CBTQuiz_created_by_idx" ON "CBTQuiz"("created_by");

-- CreateIndex
CREATE INDEX "CBTQuiz_status_idx" ON "CBTQuiz"("status");

-- CreateIndex
CREATE INDEX "CBTQuiz_is_published_idx" ON "CBTQuiz"("is_published");

-- CreateIndex
CREATE INDEX "CBTQuiz_start_date_end_date_idx" ON "CBTQuiz"("start_date", "end_date");

-- AddForeignKey
ALTER TABLE "CBTQuiz" ADD CONSTRAINT "CBTQuiz_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuiz" ADD CONSTRAINT "CBTQuiz_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuiz" ADD CONSTRAINT "CBTQuiz_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuestion" ADD CONSTRAINT "CBTQuestion_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "CBTQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTOption" ADD CONSTRAINT "CBTOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "CBTQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTCorrectAnswer" ADD CONSTRAINT "CBTCorrectAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "CBTQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuizAttempt" ADD CONSTRAINT "CBTQuizAttempt_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "CBTQuiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuizAttempt" ADD CONSTRAINT "CBTQuizAttempt_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuizAttempt" ADD CONSTRAINT "CBTQuizAttempt_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuizAttempt" ADD CONSTRAINT "CBTQuizAttempt_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuizAttempt" ADD CONSTRAINT "CBTQuizAttempt_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTResponse" ADD CONSTRAINT "CBTResponse_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "CBTQuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTResponse" ADD CONSTRAINT "CBTResponse_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "CBTQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTResponse" ADD CONSTRAINT "CBTResponse_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CBTQuizAnalytics" ADD CONSTRAINT "CBTQuizAnalytics_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "CBTQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponseOptions" ADD CONSTRAINT "_ResponseOptions_A_fkey" FOREIGN KEY ("A") REFERENCES "CBTOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponseOptions" ADD CONSTRAINT "_ResponseOptions_B_fkey" FOREIGN KEY ("B") REFERENCES "CBTResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
