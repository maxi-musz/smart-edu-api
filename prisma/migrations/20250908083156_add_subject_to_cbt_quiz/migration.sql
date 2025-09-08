/*
  Warnings:

  - Added the required column `subject_id` to the `CBTQuiz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CBTQuiz" ADD COLUMN     "subject_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "CBTQuiz" ADD CONSTRAINT "CBTQuiz_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
