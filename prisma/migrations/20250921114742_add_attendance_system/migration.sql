-- CreateEnum
CREATE TYPE "AttendanceSessionType" AS ENUM ('DAILY', 'MORNING', 'AFTERNOON', 'EVENING', 'SPECIAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceRecordStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "AttendancePeriodType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'TERM', 'YEARLY');

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "session_type" "AttendanceSessionType" NOT NULL DEFAULT 'DAILY',
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "total_students" INTEGER NOT NULL DEFAULT 0,
    "present_count" INTEGER NOT NULL DEFAULT 0,
    "absent_count" INTEGER NOT NULL DEFAULT 0,
    "late_count" INTEGER NOT NULL DEFAULT 0,
    "excused_count" INTEGER NOT NULL DEFAULT 0,
    "attendance_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "attendance_session_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "status" "AttendanceRecordStatus" NOT NULL DEFAULT 'ABSENT',
    "marked_at" TIMESTAMP(3),
    "marked_by" TEXT,
    "reason" TEXT,
    "is_excused" BOOLEAN NOT NULL DEFAULT false,
    "excuse_note" TEXT,
    "parent_notified" BOOLEAN NOT NULL DEFAULT false,
    "parent_notified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSummary" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "student_id" TEXT,
    "period_type" "AttendancePeriodType" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL DEFAULT 0,
    "present_days" INTEGER NOT NULL DEFAULT 0,
    "absent_days" INTEGER NOT NULL DEFAULT 0,
    "late_days" INTEGER NOT NULL DEFAULT 0,
    "excused_days" INTEGER NOT NULL DEFAULT 0,
    "attendance_rate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSettings" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "late_threshold_minutes" INTEGER NOT NULL DEFAULT 15,
    "auto_mark_absent_minutes" INTEGER NOT NULL DEFAULT 30,
    "require_excuse_note" BOOLEAN NOT NULL DEFAULT true,
    "parent_notification_enabled" BOOLEAN NOT NULL DEFAULT true,
    "attendance_tracking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "minimum_attendance_rate" DOUBLE PRECISION NOT NULL DEFAULT 75.0,
    "max_consecutive_absences" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AttendanceSession_school_id_academic_session_id_idx" ON "AttendanceSession"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AttendanceSession_class_id_date_idx" ON "AttendanceSession"("class_id", "date");

-- CreateIndex
CREATE INDEX "AttendanceSession_teacher_id_date_idx" ON "AttendanceSession"("teacher_id", "date");

-- CreateIndex
CREATE INDEX "AttendanceSession_status_idx" ON "AttendanceSession"("status");

-- CreateIndex
CREATE INDEX "AttendanceSession_date_idx" ON "AttendanceSession"("date");

-- CreateIndex
CREATE INDEX "AttendanceSession_attendance_rate_idx" ON "AttendanceSession"("attendance_rate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_class_id_date_session_type_key" ON "AttendanceSession"("class_id", "date", "session_type");

-- CreateIndex
CREATE INDEX "AttendanceRecord_school_id_academic_session_id_idx" ON "AttendanceRecord"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_class_id_idx" ON "AttendanceRecord"("class_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_student_id_idx" ON "AttendanceRecord"("student_id");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_marked_at_idx" ON "AttendanceRecord"("marked_at");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_attendance_session_id_student_id_key" ON "AttendanceRecord"("attendance_session_id", "student_id");

-- CreateIndex
CREATE INDEX "AttendanceSummary_school_id_academic_session_id_idx" ON "AttendanceSummary"("school_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "AttendanceSummary_class_id_period_type_idx" ON "AttendanceSummary"("class_id", "period_type");

-- CreateIndex
CREATE INDEX "AttendanceSummary_student_id_period_type_idx" ON "AttendanceSummary"("student_id", "period_type");

-- CreateIndex
CREATE INDEX "AttendanceSummary_period_start_period_end_idx" ON "AttendanceSummary"("period_start", "period_end");

-- CreateIndex
CREATE INDEX "AttendanceSummary_attendance_rate_idx" ON "AttendanceSummary"("attendance_rate");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSummary_school_id_academic_session_id_class_id_st_key" ON "AttendanceSummary"("school_id", "academic_session_id", "class_id", "student_id", "period_type", "period_start");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSettings_school_id_key" ON "AttendanceSettings"("school_id");

-- CreateIndex
CREATE INDEX "AttendanceSettings_school_id_academic_session_id_idx" ON "AttendanceSettings"("school_id", "academic_session_id");

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_attendance_session_id_fkey" FOREIGN KEY ("attendance_session_id") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSummary" ADD CONSTRAINT "AttendanceSummary_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSettings" ADD CONSTRAINT "AttendanceSettings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSettings" ADD CONSTRAINT "AttendanceSettings_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
