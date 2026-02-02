-- CreateTable
CREATE TABLE "SchoolResourceExclusion" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "excludedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolResourceExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherResourceExclusion" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "classId" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherResourceExclusion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SchoolResourceExclusion_schoolId_idx" ON "SchoolResourceExclusion"("schoolId");

-- CreateIndex
CREATE INDEX "SchoolResourceExclusion_platformId_idx" ON "SchoolResourceExclusion"("platformId");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolResourceExclusion_schoolId_platformId_subjectId_key" ON "SchoolResourceExclusion"("schoolId", "platformId", "subjectId");

-- CreateIndex
CREATE INDEX "TeacherResourceExclusion_schoolId_subjectId_idx" ON "TeacherResourceExclusion"("schoolId", "subjectId");

-- CreateIndex
CREATE INDEX "TeacherResourceExclusion_teacherId_idx" ON "TeacherResourceExclusion"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherResourceExclusion_classId_idx" ON "TeacherResourceExclusion"("classId");

-- CreateIndex
CREATE INDEX "TeacherResourceExclusion_studentId_idx" ON "TeacherResourceExclusion"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherResourceExclusion_teacherId_schoolId_subjectId_resou_key" ON "TeacherResourceExclusion"("teacherId", "schoolId", "subjectId", "resourceType", "resourceId", "classId", "studentId");

-- AddForeignKey
ALTER TABLE "SchoolResourceExclusion" ADD CONSTRAINT "SchoolResourceExclusion_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceExclusion" ADD CONSTRAINT "SchoolResourceExclusion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LibrarySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceExclusion" ADD CONSTRAINT "SchoolResourceExclusion_excludedById_fkey" FOREIGN KEY ("excludedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceExclusion" ADD CONSTRAINT "TeacherResourceExclusion_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceExclusion" ADD CONSTRAINT "TeacherResourceExclusion_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceExclusion" ADD CONSTRAINT "TeacherResourceExclusion_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LibrarySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceExclusion" ADD CONSTRAINT "TeacherResourceExclusion_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceExclusion" ADD CONSTRAINT "TeacherResourceExclusion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
