-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MaterialProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRYING');

-- CreateEnum
CREATE TYPE "ChunkType" AS ENUM ('TEXT', 'HEADING', 'PARAGRAPH', 'LIST', 'TABLE', 'IMAGE_CAPTION', 'FOOTNOTE');

-- AlterTable
ALTER TABLE "CBTQuiz" ADD COLUMN     "submissions" JSONB;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "postal_code" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "MaterialProcessing" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "status" "MaterialProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "total_chunks" INTEGER NOT NULL DEFAULT 0,
    "processed_chunks" INTEGER NOT NULL DEFAULT 0,
    "failed_chunks" INTEGER NOT NULL DEFAULT 0,
    "processing_started_at" TIMESTAMP(3),
    "processing_completed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "vector_database_id" TEXT,
    "embedding_model" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialProcessing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "material_processing_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunk_type" "ChunkType" NOT NULL DEFAULT 'TEXT',
    "page_number" INTEGER,
    "section_title" TEXT,
    "embedding" vector(1536) NOT NULL,
    "embedding_model" TEXT NOT NULL,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "word_count" INTEGER NOT NULL DEFAULT 0,
    "order_index" INTEGER NOT NULL,
    "keywords" TEXT[],
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatConversation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "material_id" TEXT,
    "title" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "system_prompt" TEXT,
    "context_summary" TEXT,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "last_activity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "material_id" TEXT,
    "role" "MessageRole" NOT NULL DEFAULT 'USER',
    "content" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'TEXT',
    "model_used" TEXT,
    "tokens_used" INTEGER,
    "response_time_ms" INTEGER,
    "context_chunks" TEXT[],
    "context_summary" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "parent_message_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatContext" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "chunk_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "relevance_score" DOUBLE PRECISION NOT NULL,
    "context_type" TEXT NOT NULL DEFAULT 'semantic',
    "position_in_context" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatAnalytics" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "material_id" TEXT,
    "user_id" TEXT,
    "total_conversations" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "total_tokens_used" INTEGER NOT NULL DEFAULT 0,
    "average_response_time_ms" INTEGER NOT NULL DEFAULT 0,
    "average_relevance_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "most_used_chunks" TEXT[],
    "popular_questions" TEXT[],
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daily_usage" INTEGER NOT NULL DEFAULT 0,
    "weekly_usage" INTEGER NOT NULL DEFAULT 0,
    "monthly_usage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaterialProcessing_school_id_idx" ON "MaterialProcessing"("school_id");

-- CreateIndex
CREATE INDEX "MaterialProcessing_status_idx" ON "MaterialProcessing"("status");

-- CreateIndex
CREATE INDEX "MaterialProcessing_createdAt_idx" ON "MaterialProcessing"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MaterialProcessing_material_id_key" ON "MaterialProcessing"("material_id");

-- CreateIndex
CREATE INDEX "DocumentChunk_material_id_idx" ON "DocumentChunk"("material_id");

-- CreateIndex
CREATE INDEX "DocumentChunk_school_id_idx" ON "DocumentChunk"("school_id");

-- CreateIndex
CREATE INDEX "DocumentChunk_chunk_type_idx" ON "DocumentChunk"("chunk_type");

-- CreateIndex
CREATE INDEX "DocumentChunk_page_number_idx" ON "DocumentChunk"("page_number");

-- CreateIndex
CREATE INDEX "DocumentChunk_order_index_idx" ON "DocumentChunk"("order_index");

-- CreateIndex
CREATE INDEX "DocumentChunk_createdAt_idx" ON "DocumentChunk"("createdAt");

-- CreateIndex
CREATE INDEX "ChatConversation_user_id_idx" ON "ChatConversation"("user_id");

-- CreateIndex
CREATE INDEX "ChatConversation_school_id_idx" ON "ChatConversation"("school_id");

-- CreateIndex
CREATE INDEX "ChatConversation_material_id_idx" ON "ChatConversation"("material_id");

-- CreateIndex
CREATE INDEX "ChatConversation_status_idx" ON "ChatConversation"("status");

-- CreateIndex
CREATE INDEX "ChatConversation_last_activity_idx" ON "ChatConversation"("last_activity");

-- CreateIndex
CREATE INDEX "ChatMessage_conversation_id_idx" ON "ChatMessage"("conversation_id");

-- CreateIndex
CREATE INDEX "ChatMessage_user_id_idx" ON "ChatMessage"("user_id");

-- CreateIndex
CREATE INDEX "ChatMessage_school_id_idx" ON "ChatMessage"("school_id");

-- CreateIndex
CREATE INDEX "ChatMessage_material_id_idx" ON "ChatMessage"("material_id");

-- CreateIndex
CREATE INDEX "ChatMessage_role_idx" ON "ChatMessage"("role");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "ChatContext_conversation_id_idx" ON "ChatContext"("conversation_id");

-- CreateIndex
CREATE INDEX "ChatContext_message_id_idx" ON "ChatContext"("message_id");

-- CreateIndex
CREATE INDEX "ChatContext_chunk_id_idx" ON "ChatContext"("chunk_id");

-- CreateIndex
CREATE INDEX "ChatContext_school_id_idx" ON "ChatContext"("school_id");

-- CreateIndex
CREATE INDEX "ChatContext_relevance_score_idx" ON "ChatContext"("relevance_score");

-- CreateIndex
CREATE UNIQUE INDEX "ChatContext_message_id_chunk_id_key" ON "ChatContext"("message_id", "chunk_id");

-- CreateIndex
CREATE INDEX "ChatAnalytics_school_id_idx" ON "ChatAnalytics"("school_id");

-- CreateIndex
CREATE INDEX "ChatAnalytics_material_id_idx" ON "ChatAnalytics"("material_id");

-- CreateIndex
CREATE INDEX "ChatAnalytics_user_id_idx" ON "ChatAnalytics"("user_id");

-- CreateIndex
CREATE INDEX "ChatAnalytics_date_idx" ON "ChatAnalytics"("date");

-- AddForeignKey
ALTER TABLE "MaterialProcessing" ADD CONSTRAINT "MaterialProcessing_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialProcessing" ADD CONSTRAINT "MaterialProcessing_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_material_processing_id_fkey" FOREIGN KEY ("material_processing_id") REFERENCES "MaterialProcessing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatConversation" ADD CONSTRAINT "ChatConversation_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ChatConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "DocumentChunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatContext" ADD CONSTRAINT "ChatContext_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "PDFMaterial"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
