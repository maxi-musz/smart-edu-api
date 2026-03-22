-- CreateEnum
CREATE TYPE "DirectUploadUserType" AS ENUM ('library_user', 'school_user');

-- CreateEnum
CREATE TYPE "DirectUploadType" AS ENUM ('single', 'multipart');

-- CreateEnum
CREATE TYPE "DirectUploadStatus" AS ENUM ('pending', 'uploading', 'uploaded', 'processing', 'completed', 'failed', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "DirectUpload" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "DirectUploadUserType" NOT NULL,
    "platformId" TEXT,
    "schoolId" TEXT,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'video/mp4',
    "fileSize" BIGINT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "uploadType" "DirectUploadType" NOT NULL DEFAULT 'single',
    "multipartUploadId" TEXT,
    "thumbnailS3Key" TEXT,
    "status" "DirectUploadStatus" NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "videoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectUpload_pkey" PRIMARY KEY ("id")
);

-- AlterTable: LibraryVideoLesson.sizeBytes Int -> BigInt (for files > 2GB)
ALTER TABLE "LibraryVideoLesson" ALTER COLUMN "sizeBytes" TYPE BIGINT USING ("sizeBytes"::bigint);

-- CreateIndex
CREATE INDEX "DirectUpload_userId_status_idx" ON "DirectUpload"("userId", "status");

-- CreateIndex
CREATE INDEX "DirectUpload_userId_userType_createdAt_idx" ON "DirectUpload"("userId", "userType", "createdAt");

-- CreateIndex
CREATE INDEX "DirectUpload_platformId_status_idx" ON "DirectUpload"("platformId", "status");

-- CreateIndex
CREATE INDEX "DirectUpload_schoolId_status_idx" ON "DirectUpload"("schoolId", "status");
