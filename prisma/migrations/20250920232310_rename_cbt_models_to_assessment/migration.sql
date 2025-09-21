/*
  Warnings:

  - You are about to drop the `CBTCorrectAnswer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CBTOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CBTQuestion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CBTQuizAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CBTQuizAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CBTResponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CBTCorrectAnswer" DROP CONSTRAINT "CBTCorrectAnswer_question_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTOption" DROP CONSTRAINT "CBTOption_question_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuestion" DROP CONSTRAINT "CBTQuestion_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuizAnalytics" DROP CONSTRAINT "CBTQuizAnalytics_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuizAttempt" DROP CONSTRAINT "CBTQuizAttempt_academic_session_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuizAttempt" DROP CONSTRAINT "CBTQuizAttempt_graded_by_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuizAttempt" DROP CONSTRAINT "CBTQuizAttempt_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuizAttempt" DROP CONSTRAINT "CBTQuizAttempt_school_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTQuizAttempt" DROP CONSTRAINT "CBTQuizAttempt_student_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTResponse" DROP CONSTRAINT "CBTResponse_attempt_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTResponse" DROP CONSTRAINT "CBTResponse_question_id_fkey";

-- DropForeignKey
ALTER TABLE "CBTResponse" DROP CONSTRAINT "CBTResponse_student_id_fkey";

-- DropForeignKey
ALTER TABLE "_ResponseOptions" DROP CONSTRAINT "_ResponseOptions_A_fkey";

-- DropForeignKey
ALTER TABLE "_ResponseOptions" DROP CONSTRAINT "_ResponseOptions_B_fkey";

-- DropTable
DROP TABLE "CBTCorrectAnswer";

-- DropTable
DROP TABLE "CBTOption";

-- DropTable
DROP TABLE "CBTQuestion";

-- DropTable
DROP TABLE "CBTQuizAnalytics";

-- DropTable
DROP TABLE "CBTQuizAttempt";

-- DropTable
DROP TABLE "CBTResponse";

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
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

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentOption" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "image_url" TEXT,
    "audio_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCorrectAnswer" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT,
    "answer_number" DOUBLE PRECISION,
    "answer_date" TIMESTAMP(3),
    "option_ids" TEXT[],
    "answer_json" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentCorrectAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
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

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResponse" (
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

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAnalytics" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
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

    CONSTRAINT "AssessmentAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessment_id_order_idx" ON "AssessmentQuestion"("assessment_id", "order");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_question_type_idx" ON "AssessmentQuestion"("question_type");

-- CreateIndex
CREATE INDEX "AssessmentOption_question_id_order_idx" ON "AssessmentOption"("question_id", "order");

-- CreateIndex
CREATE INDEX "AssessmentCorrectAnswer_question_id_idx" ON "AssessmentCorrectAnswer"("question_id");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessment_id_idx" ON "AssessmentAttempt"("assessment_id");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_student_id_idx" ON "AssessmentAttempt"("student_id");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_status_idx" ON "AssessmentAttempt"("status");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_submitted_at_idx" ON "AssessmentAttempt"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_assessment_id_student_id_attempt_number_key" ON "AssessmentAttempt"("assessment_id", "student_id", "attempt_number");

-- CreateIndex
CREATE INDEX "AssessmentResponse_attempt_id_idx" ON "AssessmentResponse"("attempt_id");

-- CreateIndex
CREATE INDEX "AssessmentResponse_question_id_idx" ON "AssessmentResponse"("question_id");

-- CreateIndex
CREATE INDEX "AssessmentResponse_student_id_idx" ON "AssessmentResponse"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResponse_attempt_id_question_id_key" ON "AssessmentResponse"("attempt_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnalytics_assessment_id_key" ON "AssessmentAnalytics"("assessment_id");

-- CreateIndex
CREATE INDEX "AssessmentAnalytics_assessment_id_idx" ON "AssessmentAnalytics"("assessment_id");

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentOption" ADD CONSTRAINT "AssessmentOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentCorrectAnswer" ADD CONSTRAINT "AssessmentCorrectAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "AssessmentQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnalytics" ADD CONSTRAINT "AssessmentAnalytics_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponseOptions" ADD CONSTRAINT "_ResponseOptions_A_fkey" FOREIGN KEY ("A") REFERENCES "AssessmentOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResponseOptions" ADD CONSTRAINT "_ResponseOptions_B_fkey" FOREIGN KEY ("B") REFERENCES "AssessmentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
