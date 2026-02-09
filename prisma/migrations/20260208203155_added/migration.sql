-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "can_edit_assessment" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "student_completed_assessment" BOOLEAN NOT NULL DEFAULT false;
