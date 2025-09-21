/*
  Warnings:

  - You are about to drop the `_StudentClass` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_StudentClass" DROP CONSTRAINT "_StudentClass_A_fkey";

-- DropForeignKey
ALTER TABLE "_StudentClass" DROP CONSTRAINT "_StudentClass_B_fkey";

-- DropTable
DROP TABLE "_StudentClass";

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_current_class_id_fkey" FOREIGN KEY ("current_class_id") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
