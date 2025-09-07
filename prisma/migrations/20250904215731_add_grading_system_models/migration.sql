/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `maxScore` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `platformId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `timeLimit` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedById` on the `Assignment` table. All the data in the column will be lost.
  - The `status` column on the `Assignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `academic_session_id` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_id` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Made the column `topic_id` on table `Assignment` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('HOMEWORK', 'PROJECT', 'ESSAY', 'RESEARCH', 'PRACTICAL', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'GRADED', 'RETURNED', 'RESUBMITTED');

-- CreateEnum
CREATE TYPE "GradeStatus" AS ENUM ('PENDING', 'GRADED', 'RETURNED', 'DISPUTED', 'FINAL');

-- CreateEnum
CREATE TYPE "RubricScale" AS ENUM ('POINTS', 'PERCENTAGE', 'LETTER_GRADE', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_platformId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_topic_id_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_uploadedById_fkey";

-- DropIndex
DROP INDEX "Assignment_createdAt_idx";

-- DropIndex
DROP INDEX "Assignment_dueDate_idx";

-- DropIndex
DROP INDEX "Assignment_platformId_idx";

-- DropIndex
DROP INDEX "Assignment_schoolId_idx";

-- AlterTable
ALTER TABLE "Assignment" DROP COLUMN "dueDate",
DROP COLUMN "maxScore",
DROP COLUMN "platformId",
DROP COLUMN "schoolId",
DROP COLUMN "timeLimit",
DROP COLUMN "uploadedById",
ADD COLUMN     "academic_session_id" TEXT NOT NULL,
ADD COLUMN     "allow_late_submission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "assignment_type" "AssignmentType" NOT NULL DEFAULT 'HOMEWORK',
ADD COLUMN     "attachment_type" TEXT,
ADD COLUMN     "attachment_url" TEXT,
ADD COLUMN     "auto_grade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "created_by" TEXT NOT NULL,
ADD COLUMN     "difficulty_level" "DifficultyLevel" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "due_date" TIMESTAMP(3),
ADD COLUMN     "grading_rubric_id" TEXT,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "late_penalty" DOUBLE PRECISION,
ADD COLUMN     "max_score" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "school_id" TEXT NOT NULL,
ADD COLUMN     "time_limit" INTEGER,
ALTER COLUMN "topic_id" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateTable
CREATE TABLE "GradingRubric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "total_points" DOUBLE PRECISION NOT NULL,
    "scale_type" "RubricScale" NOT NULL DEFAULT 'POINTS',
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentSubmission" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "content" TEXT,
    "attachment_url" TEXT,
    "attachment_type" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "late_submission" BOOLEAN NOT NULL DEFAULT false,
    "word_count" INTEGER,
    "file_size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "topicId" TEXT,

    CONSTRAINT "AssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssignmentGrade" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "max_score" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "letter_grade" TEXT,
    "feedback" TEXT,
    "comments" TEXT,
    "rubric_scores" JSONB,
    "status" "GradeStatus" NOT NULL DEFAULT 'PENDING',
    "graded_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "grading_time" INTEGER,
    "is_final" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentGrade_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradingRubric_school_id_academic_session_id_idx" ON "GradingRubric"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "GradingRubric_created_by_idx" ON "GradingRubric"("created_by");

-- CreateIndex
CREATE INDEX "GradingRubric_is_template_idx" ON "GradingRubric"("is_template");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_assignment_id_idx" ON "AssignmentSubmission"("assignment_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_student_id_idx" ON "AssignmentSubmission"("student_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_school_id_academic_session_id_idx" ON "AssignmentSubmission"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AssignmentSubmission_submitted_at_idx" ON "AssignmentSubmission"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentSubmission_assignment_id_student_id_key" ON "AssignmentSubmission"("assignment_id", "student_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_assignment_id_idx" ON "AssignmentGrade"("assignment_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_student_id_idx" ON "AssignmentGrade"("student_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_teacher_id_idx" ON "AssignmentGrade"("teacher_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_school_id_academic_session_id_idx" ON "AssignmentGrade"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AssignmentGrade_graded_at_idx" ON "AssignmentGrade"("graded_at");

-- CreateIndex
CREATE UNIQUE INDEX "AssignmentGrade_submission_id_key" ON "AssignmentGrade"("submission_id");

-- CreateIndex
CREATE INDEX "Assignment_school_id_academic_session_id_idx" ON "Assignment"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "Assignment_created_by_idx" ON "Assignment"("created_by");

-- CreateIndex
CREATE INDEX "Assignment_due_date_idx" ON "Assignment"("due_date");

-- CreateIndex
CREATE INDEX "Assignment_status_idx" ON "Assignment"("status");

-- CreateIndex
CREATE INDEX "Assignment_is_published_idx" ON "Assignment"("is_published");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_grading_rubric_id_fkey" FOREIGN KEY ("grading_rubric_id") REFERENCES "GradingRubric"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingRubric" ADD CONSTRAINT "GradingRubric_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingRubric" ADD CONSTRAINT "GradingRubric_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingRubric" ADD CONSTRAINT "GradingRubric_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSubmission" ADD CONSTRAINT "AssignmentSubmission_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "AssignmentSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentGrade" ADD CONSTRAINT "AssignmentGrade_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
