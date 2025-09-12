import { Injectable, Logger } from '@nestjs/common';
import * as colors from 'colors';

export interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: number;
  tokenCount: number;
  charCount: number;
  chunkType: 'text' | 'heading' | 'paragraph' | 'list' | 'table' | 'image_caption' | 'footnote';
  metadata: {
    pageNumber?: number;
    sectionTitle?: string;
    originalPosition: number;
  };
}

export interface ChunkingResult {
  chunks: DocumentChunk[];
  totalChunks: number;
  totalTokens: number;
  averageChunkSize: number;
  processingTime: number;
}

@Injectable()
export class DocumentChunkingService {
  private readonly logger = new Logger(DocumentChunkingService.name);
  
  // Chunking configuration
  private readonly CHUNK_SIZE = 800; // Target tokens per chunk
  private readonly CHUNK_OVERLAP = 100; // Overlap tokens between chunks
  private readonly MIN_CHUNK_SIZE = 50; // Minimum tokens per chunk
  private readonly MAX_CHUNK_SIZE = 1200; // Maximum tokens per chunk

  /**
   * Chunk document text into smaller sections
   */
  async chunkDocument(
    text: string, 
    materialId: string, 
    metadata?: { pageCount?: number; originalName?: string }
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logger.log(colors.blue(`✂️ Starting document chunking for material: ${materialId}`));

    try {
      // Clean and normalize text
      const cleanedText = this.cleanText(text);
      
      // Split text into sentences
      const sentences = this.splitIntoSentences(cleanedText);
      
      // Group sentences into chunks
      const chunks = this.createChunks(sentences, materialId, metadata);
      
      const processingTime = Date.now() - startTime;
      const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
      const averageChunkSize = chunks.length > 0 ? totalTokens / chunks.length : 0;

      this.logger.log(colors.green(`✅ Document chunking completed`));
      this.logger.log(colors.blue(`   - Total chunks: ${chunks.length}`));
      this.logger.log(colors.blue(`   - Total tokens: ${totalTokens}`));
      this.logger.log(colors.blue(`   - Average chunk size: ${Math.round(averageChunkSize)} tokens`));
      this.logger.log(colors.blue(`   - Processing time: ${processingTime}ms`));

      return {
        chunks,
        totalChunks: chunks.length,
        totalTokens,
        averageChunkSize,
        processingTime,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error chunking document: ${error.message}`));
      throw new Error(`Failed to chunk document: ${error.message}`);
    }
  }

  /**
   * Clean and normalize text for chunking
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim();
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Enhanced sentence splitting regex
    const sentenceRegex = /(?<=[.!?])\s+(?=[A-Z])|(?<=[.!?])\s*\n\s*(?=[A-Z])/g;
    
    let sentences = text.split(sentenceRegex);
    
    // Filter out empty sentences and clean them
    sentences = sentences
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 0);
    
    return sentences;
  }

  /**
   * Create chunks from sentences
   */
  private createChunks(
    sentences: string[], 
    materialId: string, 
    metadata?: { pageCount?: number; originalName?: string }
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let currentChunk: string[] = [];
    let currentTokens = 0;
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceTokens = this.estimateTokenCount(sentence);
      
      // If adding this sentence would exceed max chunk size, finalize current chunk
      if (currentTokens + sentenceTokens > this.MAX_CHUNK_SIZE && currentChunk.length > 0) {
        chunks.push(this.createChunkFromSentences(currentChunk, materialId, chunkIndex, metadata));
        chunkIndex++;
        
        // Start new chunk with overlap
        currentChunk = this.createOverlapChunk(currentChunk);
        currentTokens = this.estimateTokenCount(currentChunk.join(' '));
      }
      
      // Add sentence to current chunk
      currentChunk.push(sentence);
      currentTokens += sentenceTokens;
      
      // If chunk is large enough, finalize it
      if (currentTokens >= this.CHUNK_SIZE) {
        chunks.push(this.createChunkFromSentences(currentChunk, materialId, chunkIndex, metadata));
        chunkIndex++;
        
        // Start new chunk with overlap
        currentChunk = this.createOverlapChunk(currentChunk);
        currentTokens = this.estimateTokenCount(currentChunk.join(' '));
      }
    }
    
    // Add remaining sentences as final chunk
    if (currentChunk.length > 0) {
      chunks.push(this.createChunkFromSentences(currentChunk, materialId, chunkIndex, metadata));
    }

    return chunks;
  }

  /**
   * Create overlap chunk from previous chunk
   */
  private createOverlapChunk(previousChunk: string[]): string[] {
    const overlapSentences = Math.min(
      Math.floor(this.CHUNK_OVERLAP / 20), // Rough estimate: 20 tokens per sentence
      previousChunk.length
    );
    
    return previousChunk.slice(-overlapSentences);
  }

  /**
   * Create a chunk from sentences
   */
  private createChunkFromSentences(
    sentences: string[], 
    materialId: string, 
    chunkIndex: number,
    metadata?: { pageCount?: number; originalName?: string }
  ): DocumentChunk {
    const content = sentences.join(' ');
    const tokenCount = this.estimateTokenCount(content);
    const charCount = content.length;
    
    // Determine chunk type based on content
    const chunkType = this.determineChunkType(content);
    
    return {
      id: `${materialId}_chunk_${chunkIndex}`,
      content,
      chunkIndex,
      tokenCount,
      charCount,
      chunkType,
      metadata: {
        originalPosition: chunkIndex,
        sectionTitle: this.extractSectionTitle(content),
      },
    };
  }

  /**
   * Determine chunk type based on content
   */
  private determineChunkType(content: string): DocumentChunk['chunkType'] {
    const trimmed = content.trim();
    
    // Check for headings (short text, often in caps or with numbers)
    if (trimmed.length < 100 && (trimmed.toUpperCase() === trimmed || /^\d+\.?\s/.test(trimmed))) {
      return 'heading';
    }
    
    // Check for lists
    if (trimmed.split('\n').every(line => /^[\s]*[-•*]\s/.test(line) || /^[\s]*\d+\.\s/.test(line))) {
      return 'list';
    }
    
    // Check for tables (multiple lines with consistent spacing)
    const lines = trimmed.split('\n');
    if (lines.length > 2 && lines.every(line => line.includes('|') || /\s{3,}/.test(line))) {
      return 'table';
    }
    
    // Check for footnotes
    if (trimmed.startsWith('[') && trimmed.includes(']')) {
      return 'footnote';
    }
    
    // Check for image captions
    if (trimmed.length < 200 && (trimmed.toLowerCase().includes('figure') || trimmed.toLowerCase().includes('image'))) {
      return 'image_caption';
    }
    
    // Default to paragraph
    return 'paragraph';
  }

  /**
   * Extract section title from chunk content
   */
  private extractSectionTitle(content: string): string | undefined {
    const lines = content.split('\n');
    const firstLine = lines[0]?.trim();
    
    // If first line is short and looks like a title
    if (firstLine && firstLine.length < 100 && firstLine.length > 3) {
      return firstLine;
    }
    
    return undefined;
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    if (!text) return 0;
    
    // Rough estimation: 1 token ≈ 4 characters for English text
    // This is a simplified approximation - for production, use tiktoken or similar
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate chunk quality
   */
  validateChunks(chunks: DocumentChunk[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (chunks.length === 0) {
      issues.push('No chunks created from document');
    }

    // Check for chunks that are too small
    const smallChunks = chunks.filter(chunk => chunk.tokenCount < this.MIN_CHUNK_SIZE);
    if (smallChunks.length > 0) {
      issues.push(`${smallChunks.length} chunks are too small (less than ${this.MIN_CHUNK_SIZE} tokens)`);
    }

    // Check for chunks that are too large
    const largeChunks = chunks.filter(chunk => chunk.tokenCount > this.MAX_CHUNK_SIZE);
    if (largeChunks.length > 0) {
      issues.push(`${largeChunks.length} chunks are too large (more than ${this.MAX_CHUNK_SIZE} tokens)`);
    }

    // Check for empty chunks
    const emptyChunks = chunks.filter(chunk => chunk.content.trim().length === 0);
    if (emptyChunks.length > 0) {
      issues.push(`${emptyChunks.length} chunks are empty`);
    }

    const isValid = issues.length === 0;

    if (!isValid) {
      this.logger.warn(colors.yellow(`⚠️ Chunk validation issues:`));
      issues.forEach(issue => this.logger.warn(colors.yellow(`   - ${issue}`)));
    }

    return { isValid, issues };
  }
}
