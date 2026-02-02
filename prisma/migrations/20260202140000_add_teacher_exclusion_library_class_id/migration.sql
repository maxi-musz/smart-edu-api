-- AlterTable
ALTER TABLE "TeacherResourceExclusion" ADD COLUMN "libraryClassId" TEXT;

-- DropIndex
DROP INDEX "TeacherResourceExclusion_teacherId_schoolId_subjectId_resou_key";

-- CreateIndex
CREATE UNIQUE INDEX "TeacherResourceExclusion_teacherId_schoolId_subjectId_resou_key" ON "TeacherResourceExclusion"("teacherId", "schoolId", "subjectId", "resourceType", "resourceId", "classId", "studentId", "libraryClassId");

-- CreateIndex
CREATE INDEX "TeacherResourceExclusion_libraryClassId_idx" ON "TeacherResourceExclusion"("libraryClassId");

-- AddForeignKey
ALTER TABLE "TeacherResourceExclusion" ADD CONSTRAINT "TeacherResourceExclusion_libraryClassId_fkey" FOREIGN KEY ("libraryClassId") REFERENCES "LibraryClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
