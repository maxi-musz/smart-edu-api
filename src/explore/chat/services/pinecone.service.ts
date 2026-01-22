import { Injectable, Logger } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import * as colors from 'colors';

export interface PineconeChunk {
  id: string;
  values: number[];
  metadata: {
    material_id: string;
    school_id: string;
    content: string;
    chunk_type: string;
    chunk_index: number;
    page_number?: number;
    section_title?: string;
    token_count: number;
    char_count: number;
  };
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: {
    material_id: string;
    school_id: string;
    content: string;
    chunk_type: string;
    chunk_index: number;
    page_number?: number;
    section_title?: string;
    token_count: number;
    char_count: number;
  };
}

@Injectable()
export class PineconeService {
  private readonly logger = new Logger(PineconeService.name);
  private readonly pinecone: Pinecone;
  private readonly indexName: string;

  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;
    const environment = process.env.PINECONE_ENVIRONMENT;

    if (!apiKey || !environment) {
      throw new Error('Pinecone API key and environment must be provided');
    }

    // Set index name based on NODE_ENV
    const nodeEnv = process.env.NODE_ENV || 'development';
    switch (nodeEnv.toLowerCase()) {
      case 'production':
        this.indexName = 'smeh-prod';
        break;
      case 'staging':
        this.indexName = 'smeh-stag';
        break;
      case 'development':
      default:
        this.indexName = 'smeh-dev';
        break;
    }

    this.pinecone = new Pinecone({
      apiKey,
    });

    this.logger.log(colors.green(`✅ Pinecone service initialized with index: ${this.indexName}`));
    
    // Initialize index on startup
    this.initializeIndex().catch(error => {
      this.logger.error(colors.red(`❌ Failed to initialize Pinecone index: ${error.message}`));
    });
  }

  /**
   * Initialize Pinecone index
   */
  async initializeIndex(): Promise<void> {
    try {
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(index => index.name === this.indexName);

      if (!indexExists) {
        this.logger.log(colors.blue(`🔧 Creating Pinecone index: ${this.indexName}`));
        
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-3-small dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
            },
          },
        });

        this.logger.log(colors.green(`✅ Pinecone index created: ${this.indexName}`));
      } else {
        this.logger.log(colors.blue(`📋 Pinecone index already exists: ${this.indexName}`));
        
        // Verify index dimension matches
        const indexDescription = await this.pinecone.describeIndex(this.indexName);
        const indexDimension = indexDescription.dimension;
        
        if (indexDimension !== 1536) {
          this.logger.error(colors.red(`❌ Pinecone index dimension mismatch!`));
          this.logger.error(colors.red(`   Index dimension: ${indexDimension}`));
          this.logger.error(colors.red(`   Required dimension: 1536 (text-embedding-3-small)`));
          this.logger.error(colors.yellow(`   ⚠️  You need to either:`));
          this.logger.error(colors.yellow(`   1. Delete the existing index and let it recreate with correct dimension`));
          this.logger.error(colors.yellow(`   2. Or use a different index name`));
          throw new Error(`Pinecone index dimension mismatch: index has ${indexDimension} dimensions but embeddings are 1536. Please delete the index '${this.indexName}' and restart to recreate it with the correct dimension.`);
        }
        
        this.logger.log(colors.green(`✅ Index dimension verified: ${indexDimension}`));
      }
    } catch (error) {
      this.logger.error(colors.red(`❌ Error initializing Pinecone index: ${error.message}`));
      throw new Error(`Failed to initialize Pinecone index: ${error.message}`);
    }
  }

  /**
   * Get Pinecone index
   */
  private async getIndex() {
    return this.pinecone.index(this.indexName);
  }

  /**
   * Upsert chunks to Pinecone
   */
  async upsertChunks(chunks: PineconeChunk[]): Promise<void> {
    try {
      const index = await this.getIndex();
      
      this.logger.log(colors.blue(`📤 Upserting ${chunks.length} chunks to Pinecone...`));

      // Process in batches of 100 (Pinecone limit)
      const batchSize = 100;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        await index.upsert(batch);
        
        this.logger.log(colors.blue(`   Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`));
      }

      this.logger.log(colors.green(`✅ Successfully upserted ${chunks.length} chunks to Pinecone`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error upserting chunks to Pinecone: ${error.message}`));
      throw new Error(`Failed to upsert chunks to Pinecone: ${error.message}`);
    }
  }

  /**
   * Search for similar chunks
   */
  async searchSimilarChunks(
    queryEmbedding: number[],
    materialId: string,
    topK: number = 5,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    try {
      const index = await this.getIndex();
      
      const searchRequest = {
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: {
          material_id: { $eq: materialId },
          ...filter,
        },
      };

      this.logger.log(colors.blue(`🔍 Searching Pinecone for material: ${materialId}`));
      
      const searchResponse = await index.query(searchRequest);
      
      const results: SearchResult[] = searchResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as SearchResult['metadata'],
      })) || [];

      this.logger.log(colors.green(`✅ Found ${results.length} similar chunks`));
      
      return results;
    } catch (error) {
      this.logger.error(colors.red(`❌ Error searching Pinecone: ${error.message}`));
      throw new Error(`Failed to search Pinecone: ${error.message}`);
    }
  }

  /**
   * Delete chunks by material ID
   */
  async deleteChunksByMaterial(materialId: string): Promise<void> {
    try {
      const index = await this.getIndex();
      
      this.logger.log(colors.blue(`🗑️ Deleting chunks for material: ${materialId}`));
      
      await index.deleteMany({
        filter: {
          material_id: { $eq: materialId },
        },
      });

      this.logger.log(colors.green(`✅ Deleted chunks for material: ${materialId}`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error deleting chunks from Pinecone: ${error.message}`));
      throw new Error(`Failed to delete chunks from Pinecone: ${error.message}`);
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const index = await this.getIndex();
      const stats = await index.describeIndexStats();
      
      this.logger.log(colors.blue(`📊 Pinecone index stats: ${JSON.stringify(stats)}`));
      
      return stats;
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting Pinecone stats: ${error.message}`));
      throw new Error(`Failed to get Pinecone stats: ${error.message}`);
    }
  }

  /**
   * Convert document chunk to Pinecone format
   */
  convertToPineconeChunk(
    chunk: any,
    embedding: number[],
    materialId: string,
    schoolId: string
  ): PineconeChunk {
    return {
      id: chunk.id,
      values: embedding,
      metadata: {
        material_id: materialId,
        school_id: schoolId,
        content: chunk.content,
        chunk_type: chunk.chunkType,
        chunk_index: chunk.chunkIndex,
        page_number: chunk.metadata.pageNumber,
        section_title: chunk.metadata.sectionTitle,
        token_count: chunk.tokenCount,
        char_count: chunk.charCount,
      },
    };
  }
}
