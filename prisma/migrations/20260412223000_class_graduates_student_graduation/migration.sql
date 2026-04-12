-- AlterTable
ALTER TABLE "Class" ADD COLUMN "is_graduates" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Class_schoolId_academic_session_id_is_graduates_idx" ON "Class"("schoolId", "academic_session_id", "is_graduates");

-- CreateTable
CREATE TABLE "StudentGraduation" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_session_id" TEXT NOT NULL,
    "from_class_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentGraduation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentGraduation_student_id_academic_session_id_key" ON "StudentGraduation"("student_id", "academic_session_id");

-- CreateIndex
CREATE INDEX "StudentGraduation_academic_session_id_idx" ON "StudentGraduation"("academic_session_id");

-- AddForeignKey
ALTER TABLE "StudentGraduation" ADD CONSTRAINT "StudentGraduation_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGraduation" ADD CONSTRAINT "StudentGraduation_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
