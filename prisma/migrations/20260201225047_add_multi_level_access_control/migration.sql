-- CreateEnum
CREATE TYPE "LibraryResourceType" AS ENUM ('SUBJECT', 'TOPIC', 'VIDEO', 'MATERIAL', 'ASSESSMENT', 'ALL');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('FULL', 'READ_ONLY', 'LIMITED');

-- CreateTable
CREATE TABLE "LibraryResourceAccess" (
    "id" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "subjectId" TEXT,
    "topicId" TEXT,
    "videoId" TEXT,
    "materialId" TEXT,
    "assessmentId" TEXT,
    "resourceType" "LibraryResourceType" NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'FULL',
    "grantedById" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryResourceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolResourceAccess" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "libraryResourceAccessId" TEXT NOT NULL,
    "userId" TEXT,
    "roleType" "Roles",
    "classId" TEXT,
    "subjectId" TEXT,
    "topicId" TEXT,
    "videoId" TEXT,
    "materialId" TEXT,
    "assessmentId" TEXT,
    "resourceType" "LibraryResourceType" NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'READ_ONLY',
    "grantedById" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolResourceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherResourceAccess" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "schoolResourceAccessId" TEXT NOT NULL,
    "studentId" TEXT,
    "classId" TEXT,
    "subjectId" TEXT,
    "topicId" TEXT,
    "videoId" TEXT,
    "materialId" TEXT,
    "assessmentId" TEXT,
    "resourceType" "LibraryResourceType" NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'READ_ONLY',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeacherResourceAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessControlAuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "performedByRole" TEXT NOT NULL,
    "schoolId" TEXT,
    "platformId" TEXT,
    "changes" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccessControlAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryResourceAccess_platformId_schoolId_isActive_idx" ON "LibraryResourceAccess"("platformId", "schoolId", "isActive");

-- CreateIndex
CREATE INDEX "LibraryResourceAccess_schoolId_isActive_resourceType_idx" ON "LibraryResourceAccess"("schoolId", "isActive", "resourceType");

-- CreateIndex
CREATE INDEX "LibraryResourceAccess_platformId_isActive_idx" ON "LibraryResourceAccess"("platformId", "isActive");

-- CreateIndex
CREATE INDEX "LibraryResourceAccess_grantedById_idx" ON "LibraryResourceAccess"("grantedById");

-- CreateIndex
CREATE INDEX "LibraryResourceAccess_expiresAt_idx" ON "LibraryResourceAccess"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryResourceAccess_platformId_schoolId_resourceType_subj_key" ON "LibraryResourceAccess"("platformId", "schoolId", "resourceType", "subjectId", "topicId", "videoId", "materialId", "assessmentId");

-- CreateIndex
CREATE INDEX "SchoolResourceAccess_schoolId_isActive_idx" ON "SchoolResourceAccess"("schoolId", "isActive");

-- CreateIndex
CREATE INDEX "SchoolResourceAccess_userId_isActive_resourceType_idx" ON "SchoolResourceAccess"("userId", "isActive", "resourceType");

-- CreateIndex
CREATE INDEX "SchoolResourceAccess_classId_isActive_idx" ON "SchoolResourceAccess"("classId", "isActive");

-- CreateIndex
CREATE INDEX "SchoolResourceAccess_roleType_isActive_idx" ON "SchoolResourceAccess"("roleType", "isActive");

-- CreateIndex
CREATE INDEX "SchoolResourceAccess_libraryResourceAccessId_idx" ON "SchoolResourceAccess"("libraryResourceAccessId");

-- CreateIndex
CREATE INDEX "SchoolResourceAccess_grantedById_idx" ON "SchoolResourceAccess"("grantedById");

-- CreateIndex
CREATE INDEX "TeacherResourceAccess_teacherId_isActive_idx" ON "TeacherResourceAccess"("teacherId", "isActive");

-- CreateIndex
CREATE INDEX "TeacherResourceAccess_studentId_isActive_resourceType_idx" ON "TeacherResourceAccess"("studentId", "isActive", "resourceType");

-- CreateIndex
CREATE INDEX "TeacherResourceAccess_classId_isActive_idx" ON "TeacherResourceAccess"("classId", "isActive");

-- CreateIndex
CREATE INDEX "TeacherResourceAccess_schoolResourceAccessId_idx" ON "TeacherResourceAccess"("schoolResourceAccessId");

-- CreateIndex
CREATE INDEX "TeacherResourceAccess_schoolId_teacherId_idx" ON "TeacherResourceAccess"("schoolId", "teacherId");

-- CreateIndex
CREATE INDEX "AccessControlAuditLog_entityType_entityId_idx" ON "AccessControlAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AccessControlAuditLog_performedById_idx" ON "AccessControlAuditLog"("performedById");

-- CreateIndex
CREATE INDEX "AccessControlAuditLog_schoolId_idx" ON "AccessControlAuditLog"("schoolId");

-- CreateIndex
CREATE INDEX "AccessControlAuditLog_platformId_idx" ON "AccessControlAuditLog"("platformId");

-- CreateIndex
CREATE INDEX "AccessControlAuditLog_createdAt_idx" ON "AccessControlAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "LibraryResourceAccess" ADD CONSTRAINT "LibraryResourceAccess_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "LibraryPlatform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResourceAccess" ADD CONSTRAINT "LibraryResourceAccess_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResourceAccess" ADD CONSTRAINT "LibraryResourceAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "LibraryResourceUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResourceAccess" ADD CONSTRAINT "LibraryResourceAccess_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LibrarySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResourceAccess" ADD CONSTRAINT "LibraryResourceAccess_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "LibraryTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResourceAccess" ADD CONSTRAINT "LibraryResourceAccess_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "LibraryVideoLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResourceAccess" ADD CONSTRAINT "LibraryResourceAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LibraryMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryResourceAccess" ADD CONSTRAINT "LibraryResourceAccess_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "LibraryAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_libraryResourceAccessId_fkey" FOREIGN KEY ("libraryResourceAccessId") REFERENCES "LibraryResourceAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LibrarySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "LibraryTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "LibraryVideoLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LibraryMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolResourceAccess" ADD CONSTRAINT "SchoolResourceAccess_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "LibraryAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_schoolResourceAccessId_fkey" FOREIGN KEY ("schoolResourceAccessId") REFERENCES "SchoolResourceAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "LibrarySubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "LibraryTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "LibraryVideoLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LibraryMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherResourceAccess" ADD CONSTRAINT "TeacherResourceAccess_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "LibraryAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
