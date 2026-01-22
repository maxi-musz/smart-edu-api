import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as colors from 'colors';
import * as crypto from 'crypto';
import { Readable } from 'stream';

export interface TTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0, default 1.0
  language?: string; // ISO 639-1 language code
}

interface CachedAudio {
  buffer: Buffer;
  timestamp: number;
}

@Injectable()
export class TextToSpeechService {
  private readonly logger = new Logger(TextToSpeechService.name);
  private readonly openai: OpenAI;
  private readonly audioCache = new Map<string, CachedAudio>();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CHUNK_SIZE = 2000; // Characters per chunk for faster processing
  private readonly MAX_CACHE_SIZE = 100; // Maximum cached items

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Clean up expired cache entries every hour
    setInterval(() => this.cleanupCache(), 60 * 60 * 1000);
  }

  /**
   * Generate cache key from text and options
   */
  private getCacheKey(text: string, options: TTSOptions): string {
    const keyData = `${text}|${options.voice || 'alloy'}|${options.speed || 1.0}`;
    return crypto.createHash('sha256').update(keyData).digest('hex');
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, value] of this.audioCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.audioCache.delete(key);
        cleaned++;
      }
    }
    
    // If cache is still too large, remove oldest entries
    if (this.audioCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.audioCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = this.audioCache.size - this.MAX_CACHE_SIZE;
      for (let i = 0; i < toRemove; i++) {
        this.audioCache.delete(entries[i][0]);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.log(colors.yellow(`🧹 Cleaned up ${cleaned} cache entries`));
    }
  }

  /**
   * Chunk text into smaller pieces for faster processing
   */
  private chunkText(text: string): string[] {
    if (text.length <= this.CHUNK_SIZE) {
      return [text];
    }

    const chunks: string[] = [];
    // Split by sentences first (periods, exclamation, question marks)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    let currentChunk = '';
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= this.CHUNK_SIZE) {
        currentChunk += sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        // If single sentence is too long, split by words
        if (sentence.length > this.CHUNK_SIZE) {
          const words = sentence.split(/\s+/);
          let wordChunk = '';
          for (const word of words) {
            if (wordChunk.length + word.length + 1 <= this.CHUNK_SIZE) {
              wordChunk += (wordChunk ? ' ' : '') + word;
            } else {
              if (wordChunk) chunks.push(wordChunk);
              wordChunk = word;
            }
          }
          if (wordChunk) currentChunk = wordChunk;
        } else {
          currentChunk = sentence;
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Convert text to speech using OpenAI TTS (with caching and chunking)
   * @param text - The text to convert to speech
   * @param options - TTS options (voice, speed, language)
   * @returns Audio buffer (MP3 format)
   */
  async textToSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<Buffer> {
    try {
      const {
        voice = 'alloy',
        speed = 1.0,
        language = 'en',
      } = options;

      // Check cache first
      const cacheKey = this.getCacheKey(text, options);
      const cached = this.audioCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.log(colors.green(`✅ Cache hit for TTS (${text.length} chars)`));
        return cached.buffer;
      }

      // Validate text length
      const maxLength = 4096; // OpenAI TTS character limit
      const originalText = text;
      if (text.length > maxLength) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Text length (${text.length}) exceeds limit (${maxLength}). Truncating...`
          )
        );
        text = text.substring(0, maxLength);
      }

      // Validate speed
      const validSpeed = Math.max(0.25, Math.min(4.0, speed));

      this.logger.log(
        colors.cyan(
          `🔊 Converting text to speech (${text.length} chars, voice: ${voice}, speed: ${validSpeed})...`
        )
      );

      const startTime = Date.now();

      // For long texts, chunk and process in parallel
      if (text.length > this.CHUNK_SIZE) {
        const chunks = this.chunkText(text);
        this.logger.log(colors.blue(`📦 Splitting into ${chunks.length} chunks for faster processing...`));
        
        // Process chunks in parallel
        const chunkPromises = chunks.map(chunk =>
          this.openai.audio.speech.create({
            model: 'tts-1',
            voice: voice as any,
            input: chunk,
            speed: validSpeed,
          })
        );

        const responses = await Promise.all(chunkPromises);
        
        // Convert all chunks to buffers and concatenate
        const buffers = await Promise.all(
          responses.map(response => response.arrayBuffer())
        );
        
        const audioBuffers = buffers.map(buf => Buffer.from(buf));
        const combinedBuffer = Buffer.concat(audioBuffers);

        const processingTime = Date.now() - startTime;
        this.logger.log(
          colors.green(
            `✅ Text-to-speech conversion completed (${combinedBuffer.length} bytes, ${processingTime}ms, ${chunks.length} chunks)`
          )
        );

        // Cache the result
        this.audioCache.set(cacheKey, {
          buffer: combinedBuffer,
          timestamp: Date.now(),
        });

        return combinedBuffer;
      } else {
        // Single chunk - process normally
        const response = await this.openai.audio.speech.create({
          model: 'tts-1',
          voice: voice as any,
          input: text,
          speed: validSpeed,
        });

        const buffer = Buffer.from(await response.arrayBuffer());

        const processingTime = Date.now() - startTime;
        this.logger.log(
          colors.green(
            `✅ Text-to-speech conversion completed (${buffer.length} bytes, ${processingTime}ms)`
          )
        );

        // Cache the result
        this.audioCache.set(cacheKey, {
          buffer,
          timestamp: Date.now(),
        });

        return buffer;
      }
    } catch (error: any) {
      this.logger.error(
        colors.red(`❌ Error converting text to speech: ${error.message}`)
      );
      throw new Error(`Failed to convert text to speech: ${error.message}`);
    }
  }

  /**
   * Convert text to speech and return as stream (fast - starts immediately)
   * @param text - The text to convert to speech
   * @param options - TTS options
   * @returns Readable stream of audio data
   */
  async textToSpeechStream(
    text: string,
    options: TTSOptions = {}
  ): Promise<NodeJS.ReadableStream> {
    try {
      const {
        voice = 'alloy',
        speed = 1.0,
      } = options;

      // Validate text length
      const maxLength = 4096;
      if (text.length > maxLength) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Text length (${text.length}) exceeds limit (${maxLength}). Truncating...`
          )
        );
        text = text.substring(0, maxLength);
      }

      // Validate speed
      const validSpeed = Math.max(0.25, Math.min(4.0, speed));

      this.logger.log(
        colors.cyan(
          `🔊 Streaming text to speech (${text.length} chars, voice: ${voice}, speed: ${validSpeed})...`
        )
      );

      // Use OpenAI's native streaming - starts sending audio immediately
      const response = await this.openai.audio.speech.create({
        model: 'tts-1', // Fastest model
        voice: voice as any,
        input: text,
        speed: validSpeed,
      });

      // Convert Web ReadableStream to Node.js ReadableStream
      // OpenAI returns a Web API ReadableStream, we need to convert it for Express
      const webStream = response.body as any;
      
      // Verify webStream is actually a ReadableStream
      if (!webStream || typeof webStream.getReader !== 'function') {
        this.logger.error(colors.red(`❌ Invalid Web stream: ${typeof webStream}`));
        throw new Error('Invalid response stream from OpenAI');
      }
      
      // Try using Readable.fromWeb (Node.js 18+) - most reliable method
      if (Readable.fromWeb && typeof Readable.fromWeb === 'function') {
        try {
          this.logger.log(colors.blue(`📡 Using Readable.fromWeb for stream conversion...`));
          const nodeStream = Readable.fromWeb(webStream);
          
          // Add logging to track stream progress
          let chunkCount = 0;
          let totalBytes = 0;
          nodeStream.on('data', (chunk: Buffer) => {
            chunkCount++;
            totalBytes += chunk.length;
            // Log first 3 chunks, then every 100th chunk, and last chunk
            if (chunkCount <= 3 || chunkCount % 100 === 0) {
              this.logger.log(
                colors.blue(
                  `📦 Chunk ${chunkCount}: ${chunk.length} bytes (total: ${totalBytes} bytes)`
                )
              );
            }
          });
          
          nodeStream.on('end', () => {
            this.logger.log(
              colors.green(
                `✅ Stream ended: ${chunkCount} chunks, ${totalBytes} bytes total`
              )
            );
          });
          
          nodeStream.on('error', (error: any) => {
            this.logger.error(colors.red(`❌ Stream error: ${error.message}`));
          });
          
          return nodeStream;
        } catch (fromWebError: any) {
          this.logger.warn(colors.yellow(`⚠️ Readable.fromWeb failed: ${fromWebError.message}, falling back to manual conversion`));
        }
      }
      
      // Fallback: Manual conversion (for older Node versions or if fromWeb fails)
      this.logger.log(colors.blue(`📡 Using manual stream conversion...`));
      
      // Create a proper Node.js Readable stream
      const nodeStream = new Readable({
        objectMode: false,
        read() {
          // This will be called by Node.js when it needs more data
          // We'll handle reading in the background loop below
        },
      });

      // Read from Web stream continuously in the background
      // This ensures all chunks are read and pushed, not just the first one
      let chunkCount = 0;
      let totalBytes = 0;
      let streamError: Error | null = null;
      
      (async () => {
        const reader = webStream.getReader();
        
        try {
          this.logger.log(colors.blue(`📡 Starting to read from Web stream...`));
          
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              // End of stream - push null to signal end
              this.logger.log(
                colors.green(
                  `✅ Stream completed: ${chunkCount} chunks, ${totalBytes} bytes total`
                )
              );
              nodeStream.push(null);
              break;
            }

            chunkCount++;
            totalBytes += value.length;

            // Log first few chunks for debugging
            if (chunkCount <= 3) {
              this.logger.log(
                colors.blue(
                  `📦 Chunk ${chunkCount}: ${value.length} bytes (total: ${totalBytes} bytes)`
                )
              );
            }

            // Check if stream is destroyed before pushing
            if (nodeStream.destroyed) {
              this.logger.warn(colors.yellow(`⚠️ Stream was destroyed, stopping read loop`));
              break;
            }
            
            // Push chunk to Node stream
            // If the stream is full, this will wait until there's space
            const canContinue = nodeStream.push(Buffer.from(value));
            
            if (!canContinue) {
              // Stream is full, wait for drain event before pushing more
              this.logger.log(colors.yellow(`⏸️ Stream buffer full, waiting for drain...`));
              await new Promise(resolve => {
                // Check if stream is destroyed while waiting
                if (nodeStream.destroyed) {
                  resolve(undefined);
                  return;
                }
                nodeStream.once('drain', () => {
                  this.logger.log(colors.blue(`▶️ Stream drained, continuing...`));
                  resolve(undefined);
                });
                // Also listen for close/destroy events
                nodeStream.once('close', () => resolve(undefined));
                nodeStream.once('error', () => resolve(undefined));
              });
            }
          }
        } catch (error: any) {
          // Error reading from stream
          streamError = error;
          this.logger.error(
            colors.red(`❌ Stream error after ${chunkCount} chunks: ${error.message}`)
          );
          this.logger.error(colors.red(`❌ Stream error stack: ${error.stack}`));
          
          // Destroy the stream with error
          if (!nodeStream.destroyed) {
            nodeStream.destroy(error);
          }
        } finally {
          // Always release the reader
          try {
            reader.releaseLock();
          } catch (releaseError: any) {
            this.logger.warn(colors.yellow(`⚠️ Error releasing reader: ${releaseError.message}`));
          }
        }
      })();
      
      // Handle stream errors
      nodeStream.on('error', (error) => {
        this.logger.error(colors.red(`❌ Node stream error: ${error.message}`));
      });
      
      nodeStream.on('end', () => {
        if (!streamError) {
          this.logger.log(colors.green(`✅ Node stream ended successfully`));
        }
      });
      
      return nodeStream;
    } catch (error: any) {
      this.logger.error(
        colors.red(`❌ Error streaming text to speech: ${error.message}`)
      );
      throw new Error(`Failed to stream text to speech: ${error.message}`);
    }
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): Array<{ value: string; description: string }> {
    return [
      { value: 'alloy', description: 'Neutral, balanced voice' },
      { value: 'echo', description: 'Clear, confident voice' },
      { value: 'fable', description: 'Warm, expressive voice' },
      { value: 'onyx', description: 'Deep, authoritative voice' },
      { value: 'nova', description: 'Bright, energetic voice' },
      { value: 'shimmer', description: 'Soft, gentle voice' },
    ];
  }
}
