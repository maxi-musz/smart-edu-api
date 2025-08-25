/*
  Warnings:

  - You are about to drop the column `email` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the column `phone_number` on the `Parent` table. All the data in the column will be lost.
  - You are about to drop the `_ParentChildren` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `Parent` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parent_id]` on the table `Parent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `parent_id` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `school_id` to the `Parent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `Parent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ParentChildren" DROP CONSTRAINT "_ParentChildren_A_fkey";

-- DropForeignKey
ALTER TABLE "_ParentChildren" DROP CONSTRAINT "_ParentChildren_B_fkey";

-- DropIndex
DROP INDEX "Parent_email_key";

-- AlterTable
ALTER TABLE "Parent" DROP COLUMN "email",
DROP COLUMN "first_name",
DROP COLUMN "last_name",
DROP COLUMN "password",
DROP COLUMN "phone_number",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "emergency_contact" TEXT,
ADD COLUMN     "employer" TEXT,
ADD COLUMN     "is_primary_contact" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "parent_id" TEXT NOT NULL,
ADD COLUMN     "relationship" TEXT,
ADD COLUMN     "school_id" TEXT NOT NULL,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "user_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "_ParentChildren";

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "employee_number" TEXT,
    "qualification" TEXT,
    "specialization" TEXT,
    "years_of_experience" INTEGER,
    "hire_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salary" DOUBLE PRECISION,
    "department" TEXT,
    "is_class_teacher" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "admission_number" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "admission_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_class_id" TEXT,
    "guardian_name" TEXT,
    "guardian_phone" TEXT,
    "guardian_email" TEXT,
    "address" TEXT,
    "emergency_contact" TEXT,
    "blood_group" TEXT,
    "medical_conditions" TEXT,
    "allergies" TEXT,
    "previous_school" TEXT,
    "academic_level" TEXT,
    "parent_id" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_user_id_key" ON "Teacher"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_teacher_id_key" ON "Teacher"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employee_number_key" ON "Teacher"("employee_number");

-- CreateIndex
CREATE INDEX "Teacher_school_id_idx" ON "Teacher"("school_id");

-- CreateIndex
CREATE INDEX "Teacher_teacher_id_idx" ON "Teacher"("teacher_id");

-- CreateIndex
CREATE INDEX "Teacher_employee_number_idx" ON "Teacher"("employee_number");

-- CreateIndex
CREATE INDEX "Teacher_department_idx" ON "Teacher"("department");

-- CreateIndex
CREATE INDEX "Teacher_is_class_teacher_idx" ON "Teacher"("is_class_teacher");

-- CreateIndex
CREATE UNIQUE INDEX "Student_user_id_key" ON "Student"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_student_id_key" ON "Student"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admission_number_key" ON "Student"("admission_number");

-- CreateIndex
CREATE INDEX "Student_school_id_idx" ON "Student"("school_id");

-- CreateIndex
CREATE INDEX "Student_current_class_id_idx" ON "Student"("current_class_id");

-- CreateIndex
CREATE INDEX "Student_student_id_idx" ON "Student"("student_id");

-- CreateIndex
CREATE INDEX "Student_admission_number_idx" ON "Student"("admission_number");

-- CreateIndex
CREATE INDEX "Student_parent_id_idx" ON "Student"("parent_id");

-- CreateIndex
CREATE INDEX "Student_academic_level_idx" ON "Student"("academic_level");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_user_id_key" ON "Parent"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Parent_parent_id_key" ON "Parent"("parent_id");

-- CreateIndex
CREATE INDEX "Parent_school_id_idx" ON "Parent"("school_id");

-- CreateIndex
CREATE INDEX "Parent_parent_id_idx" ON "Parent"("parent_id");

-- CreateIndex
CREATE INDEX "Parent_relationship_idx" ON "Parent"("relationship");

-- CreateIndex
CREATE INDEX "Parent_is_primary_contact_idx" ON "Parent"("is_primary_contact");

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
