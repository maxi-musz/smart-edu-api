-- AlterTable
ALTER TABLE "LibraryMaterial" ADD COLUMN     "isAiEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "processingStatus" "MaterialProcessingStatus" NOT NULL DEFAULT 'PENDING';
