-- CreateEnum
CREATE TYPE "HlsTranscodeStatus" AS ENUM ('pending', 'processing', 'completed', 'failed');

-- AlterTable
ALTER TABLE "LibraryVideoLesson" ADD COLUMN     "hlsPlaybackUrl" TEXT,
ADD COLUMN     "hlsS3Prefix" TEXT,
ADD COLUMN     "hlsStatus" "HlsTranscodeStatus";
