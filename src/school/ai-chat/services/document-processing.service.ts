import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { S3Service } from '../../../shared/services/s3.service';
import { TextExtractionService, ExtractedText } from './text-extraction.service';
import { DocumentChunkingService, DocumentChunk, ChunkingResult } from './document-chunking.service';
import { EmbeddingService, EmbeddingResult, BatchEmbeddingResult } from './embedding.service';
import { PineconeService, PineconeChunk } from './pinecone.service';
import * as colors from 'colors';

export interface ProcessingResult {
  materialId: string;
  success: boolean;
  extractedText?: ExtractedText;
  chunkingResult?: ChunkingResult;
  embeddingResult?: BatchEmbeddingResult;
  error?: string;
  processingTime: number;
}

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly textExtractionService: TextExtractionService,
    private readonly chunkingService: DocumentChunkingService,
    private readonly embeddingService: EmbeddingService,
    private readonly pineconeService: PineconeService,
  ) {}

  /**
   * Process a document from start to finish
   */
  async processDocument(materialId: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    this.logger.log(colors.cyan(`🔄 Starting document processing for material: ${materialId}`));

    try {
      // Step 1: Get material from database
      const material = await this.getMaterial(materialId);
      if (!material) {
        throw new Error(`Material not found: ${materialId}`);
      }

      // Step 2: Download document from S3
      this.logger.log(colors.blue(`📥 Downloading document from S3...`));
      const documentBuffer = await this.downloadDocument(material.url);
      
      // Step 3: Extract text
      this.logger.log(colors.blue(`📄 Extracting text from document...`));
      const extractedText = await this.textExtractionService.extractText(
        documentBuffer, 
        material.fileType || 'pdf'
      );

      // Validate extraction (warnings only, don't fail on encoding issues)
      const extractionValidation = this.textExtractionService.validateExtraction(extractedText);
      if (!extractionValidation.isValid) {
        this.logger.warn(colors.yellow(`⚠️ Text extraction validation issues: ${extractionValidation.issues.join(', ')}`));
        this.logger.warn(colors.yellow(`⚠️ Continuing with processing despite warnings...`));
      }

      // Step 4: Chunk the document
      this.logger.log(colors.blue(`✂️ Chunking document into sections...`));
      const chunkingResult = await this.chunkingService.chunkDocument(
        extractedText.text,
        materialId,
        {
          pageCount: extractedText.pageCount,
          originalName: material.originalName || undefined,
        }
      );

      // Validate chunking
      const chunkingValidation = this.chunkingService.validateChunks(chunkingResult.chunks);
      if (!chunkingValidation.isValid) {
        this.logger.warn(colors.yellow(`⚠️ Chunking validation issues: ${chunkingValidation.issues.join(', ')}`));
      }

      // Step 5: Generate embeddings
      this.logger.log(colors.blue(`🧠 Generating embeddings for ${chunkingResult.chunks.length} chunks...`));
      const embeddingResult = await this.embeddingService.generateBatchEmbeddings(
        chunkingResult.chunks.map(chunk => chunk.content)
      );

      // Step 6: Save chunks and embeddings to Pinecone
      this.logger.log(colors.blue(`💾 Saving chunks and embeddings to Pinecone...`));
      await this.saveChunksAndEmbeddings(materialId, chunkingResult.chunks, embeddingResult.embeddings, material.schoolId || '');

      // Step 7: Update material processing status
      await this.updateProcessingStatus(materialId, 'COMPLETED', {
        totalChunks: chunkingResult.totalChunks,
        processedChunks: embeddingResult.successCount,
        failedChunks: embeddingResult.failureCount,
      });

      const processingTime = Date.now() - startTime;
      this.logger.log(colors.green(`🎉 Document processing completed successfully in ${processingTime}ms`));

      return {
        materialId,
        success: true,
        extractedText,
        chunkingResult,
        embeddingResult,
        processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(colors.red(`❌ Document processing failed: ${error.message}`));

      // Update processing status to failed
      await this.updateProcessingStatus(materialId, 'FAILED', {
        error: error.message,
      });

      return {
        materialId,
        success: false,
        error: error.message,
        processingTime,
      };
    }
  }

  /**
   * Get material from database
   */
  private async getMaterial(materialId: string) {
    return this.prisma.pDFMaterial.findUnique({
      where: { id: materialId },
      select: {
        id: true,
        title: true,
        url: true,
        fileType: true,
        originalName: true,
        schoolId: true,
      },
    });
  }

  /**
   * Download document from S3
   */
  private async downloadDocument(s3Url: string): Promise<Buffer> {
    try {
      // Extract S3 key from URL
      const url = new URL(s3Url);
      const s3Key = url.pathname.substring(1); // Remove leading slash
      
      // Download from S3 using presigned URL
      const presignedUrl = await this.s3Service.generateReadPresignedUrl(s3Key);
      const response = await fetch(presignedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throw new Error(`Failed to download document from S3: ${error.message}`);
    }
  }

  /**
   * Save chunks and embeddings to Pinecone
   */
  private async saveChunksAndEmbeddings(
    materialId: string,
    chunks: DocumentChunk[],
    embeddings: EmbeddingResult[],
    schoolId: string
  ): Promise<void> {
    try {
      // Convert chunks to Pinecone format
      const pineconeChunks: PineconeChunk[] = chunks.map((chunk, index) => 
        this.pineconeService.convertToPineconeChunk(
          chunk,
          embeddings[index]?.embedding || [],
          materialId,
          schoolId
        )
      );

      // Save to Pinecone
      await this.pineconeService.upsertChunks(pineconeChunks);

      // Also save basic chunk info to database (without embeddings)
      const chunkData = chunks.map((chunk, index) => ({
        id: chunk.id,
        material_id: materialId,
        content: chunk.content,
        chunk_index: chunk.chunkIndex,
        token_count: chunk.tokenCount,
        char_count: chunk.charCount,
        chunk_type: this.mapChunkType(chunk.chunkType),
        page_number: chunk.metadata.pageNumber,
        section_title: chunk.metadata.sectionTitle,
        original_position: chunk.metadata.originalPosition,
        embedding_model: embeddings[index]?.model || 'text-embedding-3-small',
        material_processing_id: '', // Will be set by the system
        school_id: schoolId,
        order_index: chunk.chunkIndex,
      }));

      // Save basic chunk info to database
      for (const chunk of chunkData) {
        await this.prisma.$executeRaw`
          INSERT INTO "DocumentChunk" (
            id, material_id, content, chunk_index, token_count, char_count, 
            chunk_type, page_number, section_title, original_position, 
            embedding_model, material_processing_id, school_id, order_index
          ) VALUES (
            ${chunk.id}, ${chunk.material_id}, ${chunk.content}, ${chunk.chunk_index}, 
            ${chunk.token_count}, ${chunk.char_count}, ${chunk.chunk_type}, 
            ${chunk.page_number}, ${chunk.section_title}, ${chunk.original_position}, 
            ${chunk.embedding_model}, ${chunk.material_processing_id}, ${chunk.school_id}, ${chunk.order_index}
          )
        `;
      }

      this.logger.log(colors.green(`✅ Saved ${chunkData.length} chunks to Pinecone and database`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error saving chunks: ${error.message}`));
      throw new Error(`Failed to save chunks: ${error.message}`);
    }
  }

  /**
   * Update material processing status
   */
  private async updateProcessingStatus(
    materialId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING',
    data?: {
      totalChunks?: number;
      processedChunks?: number;
      failedChunks?: number;
      error?: string;
    }
  ): Promise<void> {
    try {
        await this.prisma.materialProcessing.updateMany({
        where: { material_id: materialId },
        data: {
          status,
          total_chunks: data?.totalChunks || 0,
          processed_chunks: data?.processedChunks || 0,
          failed_chunks: data?.failedChunks || 0,
          error_message: data?.error || null,
          updatedAt: new Date(),
        },
      });

      this.logger.log(colors.blue(`📊 Updated processing status to: ${status}`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating processing status: ${error.message}`));
    }
  }

  /**
   * Get processing status for a material
   */
  async getProcessingStatus(materialId: string) {
    return this.prisma.materialProcessing.findFirst({
      where: { material_id: materialId },
      select: {
        id: true,
        status: true,
        total_chunks: true,
        processed_chunks: true,
        failed_chunks: true,
        error_message: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Get processed chunks for a material
   */
  async getMaterialChunks(materialId: string, limit: number = 100) {
    return this.prisma.documentChunk.findMany({
      where: { material_id: materialId },
      orderBy: { order_index: 'asc' },
      take: limit,
      select: {
        id: true,
        content: true,
        order_index: true,
        chunk_type: true,
        token_count: true,
        section_title: true,
        page_number: true,
        createdAt: true,
      },
    });
  }

  /**
   * Search for relevant chunks using Pinecone vector similarity
   */
  async searchRelevantChunks(
    materialId: string,
    query: string,
    topK: number = 5
  ): Promise<{ id: string; content: string; similarity: number; chunk_type: string }[]> {
    try {
      // Generate embedding for query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      // Search Pinecone
      const results = await this.pineconeService.searchSimilarChunks(
        queryEmbedding.embedding,
        materialId,
        topK
      );

      return results.map(result => ({
        id: result.id,
        content: result.metadata.content,
        chunk_type: result.metadata.chunk_type,
        similarity: result.score,
      }));

    } catch (error) {
      this.logger.error(colors.red(`❌ Error searching relevant chunks: ${error.message}`));
      throw new Error(`Failed to search relevant chunks: ${error.message}`);
    }
  }

  /**
   * Map chunk type to database enum
   */
  private mapChunkType(chunkType: string): 'TEXT' | 'HEADING' | 'PARAGRAPH' | 'LIST' | 'TABLE' | 'IMAGE_CAPTION' | 'FOOTNOTE' {
    switch (chunkType) {
      case 'text':
        return 'TEXT';
      case 'heading':
        return 'HEADING';
        
      case 'paragraph':
        return 'PARAGRAPH';
      case 'list':
        return 'LIST';
      case 'table':
        return 'TABLE';
      case 'image_caption':
        return 'IMAGE_CAPTION';
      case 'footnote':
        return 'FOOTNOTE';
      default:
        return 'TEXT';
    }
  }

  /**
   * Retry failed processing
   */
  async retryProcessing(materialId: string): Promise<ProcessingResult> {
    this.logger.log(colors.yellow(`🔄 Retrying processing for material: ${materialId}`));
    
    // Update status to retrying
    await this.updateProcessingStatus(materialId, 'RETRYING');
    
    // Process the document again
    return this.processDocument(materialId);
  }
}
