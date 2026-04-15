-- CreateEnum
CREATE TYPE "ResultComputationScope" AS ENUM ('STUDENTS', 'CLASS');

-- CreateEnum
CREATE TYPE "ResultComputationBatchStatus" AS ENUM ('ACTIVE', 'REVERSED');

-- CreateTable
CREATE TABLE "result_computation_batches" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "scope" "ResultComputationScope" NOT NULL,
    "class_id" TEXT,
    "status" "ResultComputationBatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_user_id" TEXT NOT NULL,
    "reversed_at" TIMESTAMP(3),
    "reversed_by_user_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "result_computation_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "result_subject_lines" (
    "id" TEXT NOT NULL,
    "result_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "ca_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "exam_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_max_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grade" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "result_subject_lines_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "computation_batch_id" TEXT;

-- CreateIndex
CREATE INDEX "result_computation_batches_school_id_academic_session_id_idx" ON "result_computation_batches"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "result_computation_batches_status_idx" ON "result_computation_batches"("status");

-- CreateIndex
CREATE INDEX "Result_computation_batch_id_idx" ON "Result"("computation_batch_id");

-- CreateIndex
CREATE INDEX "result_subject_lines_school_id_academic_session_id_idx" ON "result_subject_lines"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "result_subject_lines_student_id_academic_session_id_idx" ON "result_subject_lines"("student_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "result_subject_lines_subject_id_academic_session_id_idx" ON "result_subject_lines"("subject_id", "academic_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "result_subject_lines_result_id_subject_id_key" ON "result_subject_lines"("result_id", "subject_id");

-- AddForeignKey
ALTER TABLE "result_computation_batches" ADD CONSTRAINT "result_computation_batches_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_computation_batches" ADD CONSTRAINT "result_computation_batches_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_computation_batches" ADD CONSTRAINT "result_computation_batches_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_computation_batches" ADD CONSTRAINT "result_computation_batches_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_computation_batches" ADD CONSTRAINT "result_computation_batches_reversed_by_user_id_fkey" FOREIGN KEY ("reversed_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_computation_batch_id_fkey" FOREIGN KEY ("computation_batch_id") REFERENCES "result_computation_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "result_subject_lines" ADD CONSTRAINT "result_subject_lines_result_id_fkey" FOREIGN KEY ("result_id") REFERENCES "Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;
