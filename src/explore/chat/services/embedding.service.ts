import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as colors from 'colors';

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
  model: string;
  processingTime: number;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  totalTokens: number;
  totalProcessingTime: number;
  successCount: number;
  failureCount: number;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly openai: OpenAI;
  private readonly embeddingModel = 'text-embedding-3-small'; // Cost-effective model
  private readonly maxTokensPerRequest = 8000; // OpenAI limit
  private readonly batchSize = 100; // Process embeddings in batches

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate embedding for a single text chunk
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const startTime = Date.now();
    this.logger.log(colors.blue(`🧠 Generating embedding for text (${text.length} chars)...`));

    try {
      // Truncate text if too long
      const truncatedText = this.truncateText(text);
      
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: truncatedText,
        encoding_format: 'float',
      });

      const processingTime = Date.now() - startTime;
      const tokenCount = response.usage.total_tokens;

      this.logger.log(colors.green(`✅ Embedding generated successfully`));
      this.logger.log(colors.blue(`   - Tokens used: ${tokenCount}`));
      this.logger.log(colors.blue(`   - Processing time: ${processingTime}ms`));

      return {
        embedding: response.data[0].embedding,
        tokenCount,
        model: this.embeddingModel,
        processingTime,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error generating embedding: ${error.message}`));
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple text chunks in batches
   */
  async generateBatchEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    this.logger.log(colors.blue(`🧠 Generating batch embeddings for ${texts.length} texts...`));

    const results: EmbeddingResult[] = [];
    let totalTokens = 0;
    let successCount = 0;
    let failureCount = 0;

    try {
      // Process texts in batches
      for (let i = 0; i < texts.length; i += this.batchSize) {
        const batch = texts.slice(i, i + this.batchSize);
        this.logger.log(colors.blue(`   Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(texts.length / this.batchSize)}`));

        try {
          const batchResults = await this.processBatch(batch);
          results.push(...batchResults.embeddings);
          totalTokens += batchResults.totalTokens;
          successCount += batchResults.successCount;
          failureCount += batchResults.failureCount;
        } catch (error) {
          this.logger.error(colors.red(`❌ Error processing batch: ${error.message}`));
          failureCount += batch.length;
        }
      }

      const totalProcessingTime = Date.now() - startTime;

      this.logger.log(colors.green(`✅ Batch embedding generation completed`));
      this.logger.log(colors.blue(`   - Success: ${successCount}`));
      this.logger.log(colors.blue(`   - Failures: ${failureCount}`));
      this.logger.log(colors.blue(`   - Total tokens: ${totalTokens}`));
      this.logger.log(colors.blue(`   - Total time: ${totalProcessingTime}ms`));

      return {
        embeddings: results,
        totalTokens,
        totalProcessingTime,
        successCount,
        failureCount,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error in batch embedding generation: ${error.message}`));
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Process a batch of texts
   */
  private async processBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const batchStartTime = Date.now();
    const embeddings: EmbeddingResult[] = [];
    let totalTokens = 0;
    let successCount = 0;
    let failureCount = 0;

    try {
      // Truncate texts and prepare for batch processing
      const truncatedTexts = texts.map(text => this.truncateText(text));
      
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: truncatedTexts,
        encoding_format: 'float',
      });

      const processingTime = Date.now() - batchStartTime;
      totalTokens = response.usage.total_tokens;

      // Process each embedding result
      for (let i = 0; i < response.data.length; i++) {
        try {
          const embeddingData = response.data[i];
          const embedding: EmbeddingResult = {
            embedding: embeddingData.embedding,
            tokenCount: Math.floor(totalTokens / texts.length), // Approximate per-text token count
            model: this.embeddingModel,
            processingTime: processingTime / texts.length, // Approximate per-text processing time
          };
          
          embeddings.push(embedding);
          successCount++;
        } catch (error) {
          this.logger.error(colors.red(`❌ Error processing embedding ${i}: ${error.message}`));
          failureCount++;
        }
      }

      return {
        embeddings,
        totalTokens,
        totalProcessingTime: processingTime,
        successCount,
        failureCount,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error in batch processing: ${error.message}`));
      failureCount = texts.length;
      throw error;
    }
  }

  /**
   * Truncate text to fit within token limits
   */
  private truncateText(text: string): string {
    if (!text) return '';
    
    // Rough estimation: 1 token ≈ 4 characters
    const maxChars = this.maxTokensPerRequest * 4;
    
    if (text.length <= maxChars) {
      return text;
    }
    
    // Truncate and add ellipsis
    return text.substring(0, maxChars - 3) + '...';
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Find most similar chunks using cosine similarity
   */
  findSimilarChunks(
    queryEmbedding: number[],
    chunkEmbeddings: { id: string; embedding: number[] }[],
    topK: number = 5
  ): { id: string; similarity: number }[] {
    const similarities = chunkEmbeddings.map(chunk => ({
      id: chunk.id,
      similarity: this.calculateSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Sort by similarity (descending) and return top K
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * Validate embedding quality
   */
  validateEmbedding(embedding: number[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!embedding || embedding.length === 0) {
      issues.push('Embedding is empty or null');
    }

    if (embedding.length !== 1536) { // text-embedding-3-small dimension
      issues.push(`Expected embedding dimension 1536, got ${embedding.length}`);
    }

    // Check for NaN or infinite values
    const hasInvalidValues = embedding.some(value => !isFinite(value));
    if (hasInvalidValues) {
      issues.push('Embedding contains NaN or infinite values');
    }

    // Check if all values are zero (might indicate an error)
    const allZero = embedding.every(value => value === 0);
    if (allZero) {
      issues.push('Embedding contains only zeros');
    }

    const isValid = issues.length === 0;

    if (!isValid) {
      this.logger.warn(colors.yellow(`⚠️ Embedding validation issues:`));
      issues.forEach(issue => this.logger.warn(colors.yellow(`   - ${issue}`)));
    }

    return { isValid, issues };
  }

  /**
   * Get embedding model information
   */
  getModelInfo(): { model: string; dimensions: number; maxTokens: number } {
    return {
      model: this.embeddingModel,
      dimensions: 1536, // text-embedding-3-small dimensions
      maxTokens: this.maxTokensPerRequest,
    };
  }
}
