/*
  Warnings:

  - You are about to drop the column `classId` on the `LibraryGeneralMaterial` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "LibraryGeneralMaterial" DROP CONSTRAINT "LibraryGeneralMaterial_classId_fkey";

-- DropIndex
DROP INDEX "LibraryGeneralMaterial_classId_idx";

-- AlterTable
ALTER TABLE "LibraryGeneralMaterial" DROP COLUMN "classId";

-- CreateTable
CREATE TABLE "LibraryGeneralMaterialClass" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LibraryGeneralMaterialClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LibraryGeneralMaterialClass_materialId_idx" ON "LibraryGeneralMaterialClass"("materialId");

-- CreateIndex
CREATE INDEX "LibraryGeneralMaterialClass_classId_idx" ON "LibraryGeneralMaterialClass"("classId");

-- CreateIndex
CREATE INDEX "LibraryGeneralMaterialClass_createdAt_idx" ON "LibraryGeneralMaterialClass"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryGeneralMaterialClass_materialId_classId_key" ON "LibraryGeneralMaterialClass"("materialId", "classId");

-- AddForeignKey
ALTER TABLE "LibraryGeneralMaterialClass" ADD CONSTRAINT "LibraryGeneralMaterialClass_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "LibraryGeneralMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LibraryGeneralMaterialClass" ADD CONSTRAINT "LibraryGeneralMaterialClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "LibraryClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
