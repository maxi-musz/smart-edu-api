import { Injectable, Logger } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as colors from 'colors';

export interface ExtractedText {
  text: string;
  pageCount?: number;
  wordCount: number;
  charCount: number;
  extractionTime: number;
}

@Injectable()
export class TextExtractionService {
  private readonly logger = new Logger(TextExtractionService.name);

  /**
   * Extract text from PDF file
   */
  async extractFromPDF(buffer: Buffer): Promise<ExtractedText> {
    const startTime = Date.now();
    this.logger.log(colors.blue(`📄 Extracting text from PDF...`));

    try {
      const data = await pdfParse(buffer, {
        // PDF parsing options
        max: 0, // No page limit
        version: 'v1.10.100', // PDF.js version
      });

      const extractionTime = Date.now() - startTime;
      const wordCount = this.countWords(data.text);
      const charCount = data.text.length;

      this.logger.log(colors.green(`✅ PDF text extracted successfully`));
      this.logger.log(colors.blue(`   - Pages: ${data.numpages}`));
      this.logger.log(colors.blue(`   - Words: ${wordCount}`));
      this.logger.log(colors.blue(`   - Characters: ${charCount}`));
      this.logger.log(colors.blue(`   - Extraction time: ${extractionTime}ms`));

      return {
        text: data.text,
        pageCount: data.numpages,
        wordCount,
        charCount,
        extractionTime,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error extracting PDF text: ${error.message}`));
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from DOC/DOCX file
   */
  async extractFromDOC(buffer: Buffer, fileType: 'doc' | 'docx'): Promise<ExtractedText> {
    const startTime = Date.now();
    this.logger.log(colors.blue(`📄 Extracting text from ${fileType.toUpperCase()}...`));

    try {
      let result: any;

      if (fileType === 'docx') {
        result = await mammoth.extractRawText({ buffer });
      } else {
        // For .doc files, we need a different approach
        // For now, we'll throw an error and suggest conversion
        throw new Error('DOC files are not supported. Please convert to DOCX format.');
      }

      const text = result.value;
      const extractionTime = Date.now() - startTime;
      const wordCount = this.countWords(text);
      const charCount = text.length;

      this.logger.log(colors.green(`✅ ${fileType.toUpperCase()} text extracted successfully`));
      this.logger.log(colors.blue(`   - Words: ${wordCount}`));
      this.logger.log(colors.blue(`   - Characters: ${charCount}`));
      this.logger.log(colors.blue(`   - Extraction time: ${extractionTime}ms`));

      return {
        text,
        wordCount,
        charCount,
        extractionTime,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error extracting ${fileType.toUpperCase()} text: ${error.message}`));
      throw new Error(`Failed to extract text from ${fileType.toUpperCase()}: ${error.message}`);
    }
  }

  /**
   * Extract text from PPT/PPTX file
   */
  async extractFromPPT(buffer: Buffer, fileType: 'ppt' | 'pptx'): Promise<ExtractedText> {
    const startTime = Date.now();
    this.logger.log(colors.blue(`📄 Extracting text from ${fileType.toUpperCase()}...`));

    try {
      // For PowerPoint files, we'll use mammoth as a fallback
      // Note: This won't extract slide content properly, just raw text
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;
      const extractionTime = Date.now() - startTime;
      const wordCount = this.countWords(text);
      const charCount = text.length;

      this.logger.log(colors.yellow(`⚠️ ${fileType.toUpperCase()} text extraction limited (raw text only)`));
      this.logger.log(colors.blue(`   - Words: ${wordCount}`));
      this.logger.log(colors.blue(`   - Characters: ${charCount}`));
      this.logger.log(colors.blue(`   - Extraction time: ${extractionTime}ms`));

      return {
        text,
        wordCount,
        charCount,
        extractionTime,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error extracting ${fileType.toUpperCase()} text: ${error.message}`));
      throw new Error(`Failed to extract text from ${fileType.toUpperCase()}: ${error.message}`);
    }
  }

  /**
   * Extract text from any supported file type
   */
  async extractText(buffer: Buffer, fileType: string): Promise<ExtractedText> {
    this.logger.log(colors.cyan(`🔍 Starting text extraction for file type: ${fileType}`));

    switch (fileType.toLowerCase()) {
      case 'pdf':
        return this.extractFromPDF(buffer);
      
      case 'docx':
        return this.extractFromDOC(buffer, 'docx');
      
      case 'doc':
        return this.extractFromDOC(buffer, 'doc');
      
      case 'pptx':
        return this.extractFromPPT(buffer, 'pptx');
      
      case 'ppt':
        return this.extractFromPPT(buffer, 'ppt');
      
      default:
        throw new Error(`Unsupported file type for text extraction: ${fileType}`);
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    
    // Remove extra whitespace and split by spaces
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  /**
   * Clean and normalize extracted text
   */
  cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
      .replace(/\s{2,}/g, ' ') // Remove excessive spaces
      .trim();
  }

  /**
   * Validate extracted text quality
   */
  validateExtraction(extractedText: ExtractedText): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (extractedText.text.length === 0) {
      issues.push('No text extracted from document');
    }

    if (extractedText.wordCount < 10) {
      issues.push('Very few words extracted - document might be image-based or corrupted');
    }

    if (extractedText.charCount < 50) {
      issues.push('Very few characters extracted - document might be empty or corrupted');
    }

    // Check for common extraction issues
    if (extractedText.text.includes('') || extractedText.text.includes('???')) {
      issues.push('Text contains encoding issues - document might be corrupted');
    }

    const isValid = issues.length === 0;

    if (!isValid) {
      this.logger.warn(colors.yellow(`⚠️ Text extraction validation issues:`));
      issues.forEach(issue => this.logger.warn(colors.yellow(`   - ${issue}`)));
    }

    return { isValid, issues };
  }
}
