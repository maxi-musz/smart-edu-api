-- AlterTable
ALTER TABLE "LibraryGeneralMaterialChatConversation" ADD COLUMN "chapterId" TEXT;

-- AddForeignKey
ALTER TABLE "LibraryGeneralMaterialChatConversation" ADD CONSTRAINT "LibraryGeneralMaterialChatConversation_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "LibraryGeneralMaterialChapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "LibraryGeneralMaterialChatConversation_chapterId_idx" ON "LibraryGeneralMaterialChatConversation"("chapterId");

-- CreateIndex
CREATE INDEX "LibraryGeneralMaterialChatConversation_userId_chapterId_idx" ON "LibraryGeneralMaterialChatConversation"("userId", "chapterId");
