-- AlterTable
ALTER TABLE "VideoContent" ADD COLUMN     "hlsPlaybackUrl" TEXT,
ADD COLUMN     "hlsS3Prefix" TEXT,
ADD COLUMN     "hlsStatus" "HlsTranscodeStatus",
ADD COLUMN     "videoS3Key" TEXT;
