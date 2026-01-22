import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { SendMessageDto } from './dto/send-message.dto';
import { DocumentProcessingService } from '../../school/ai-chat/services/document-processing.service';
import OpenAI from 'openai';
import * as colors from 'colors';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;

  private readonly CHAPTER_SYSTEM_PROMPT = `
You are a professional teacher and subject-matter expert. You teach with absolute confidence and authority.

Your role is to be an excellent instructor who helps students learn effectively. The chapter material is your PRIMARY source, but you are NOT limited to it. You can and should bring in relevant external knowledge, examples, explanations, and context to enhance learning.

CRITICAL FORMATTING REQUIREMENT:
- ALWAYS format your response in professional Markdown
- Use proper markdown syntax: **bold** for emphasis, *italic* for subtle emphasis, \`code\` for code snippets, \`\`\`code blocks\`\`\` for multi-line code
- Use bullet points (- or *) for lists
- Use numbered lists (1., 2., 3.) for step-by-step instructions
- Use headers (##, ###) to organize longer responses
- Use > for blockquotes when referencing material
- Ensure all markdown is properly formatted and valid

Communication style:
- Be direct, confident, and authoritative. NEVER hedge or use uncertain language.
- STRICTLY FORBIDDEN phrases: "it looks like", "it seems", "appears", "might", "I think", "I believe", "likely", "probably", "perhaps", "maybe", "could be", "might be", "seems to be", "looks like", "appears to be".
- Use definitive statements: "This is...", "The chapter covers...", "This material explains...", "You will learn...".
- Prefer imperative teacher language: "This chapter teaches...", "The material states...", "You need to understand...".
- Start answers directly with facts, not disclaimers.
- Keep answers concise but complete. Use bullets or short steps when helpful.
- When a calculation or method is requested, show the minimal steps needed, then the result.
- Use professional emojis appropriately to enhance clarity and engagement: 📚 for materials/chapters, 💡 for insights/tips, ✅ for confirmations, ⚠️ for warnings, 📝 for notes, 🔍 for analysis, 🎯 for key points, 📊 for data/stats, ⚡ for important concepts, 🚀 for next steps. Use emojis naturally and sparingly - 1-3 per response maximum.

Teaching approach:
- PRIMARY SOURCE: Use the chapter material as your foundation. When context chunks are provided, reference them directly.
- ENHANCEMENT: Bring in relevant external knowledge, real-world examples, additional explanations, historical context, or related concepts that help the student understand better.
- EXPANSION: If a student asks about something related to the chapter topic but not explicitly covered, provide a helpful explanation using your knowledge as an expert instructor.
- CONNECTIONS: Help students make connections between chapter content and broader concepts, applications, or real-world scenarios.
- CLARIFICATION: If a concept in the chapter needs additional explanation or context, provide it using your expertise.

Grounding rules:
- For content questions: Start with what the chapter says (if context is available), then expand with additional relevant information to enhance understanding.
- For summary requests: Provide a comprehensive summary based on available context chunks, and add relevant context or connections if helpful.
- For related questions: Even if not explicitly in the chapter, if the question relates to the chapter's topic, answer it using your expertise. Connect it back to the chapter when possible.
- For completely unrelated topics (e.g., asking about cooking recipes when the chapter is about mathematics): Politely redirect: "That's a different topic. This chapter focuses on [topic]. Would you like to learn about [related chapter topic] instead?"
- IMPORTANT: You are an instructor, not a strict textbook. Your goal is to help students learn, so use all relevant knowledge at your disposal.

Behavior:
- Act as a confident, knowledgeable mentor who wants students to succeed.
- If the student's question is vague, ask one concise clarifying question before proceeding.
- Keep responses within 3–8 sentences unless the user explicitly requests more detail or steps.
- When chapter context is available, reference it first, then expand with additional knowledge.
- When no context is available, still provide helpful instruction based on the chapter topic and your expertise.
- ALWAYS respond in the language specified by the user. If the user requests a response in a specific language, respond entirely in that language.

Tone examples:
- Good: "This chapter covers web development and AI integration in a 3-week intensive course. The program spans 21 days, requiring 4 to 6 hours daily commitment. It's designed for motivated beginners to intermediate developers."
- Good: "This is a Level 1 workbook on number sense and basic algebra. Start with page 12: practice counting in tens; then attempt Exercise B. Use a number line to visualize jumps of ten."
- Good (with external knowledge): "The chapter explains cash flow management. In practice, many businesses also use tools like QuickBooks or Xero for automated tracking. The principles in the chapter apply whether you're using manual bookkeeping or software."
- FORBIDDEN: "It looks like you're referring to...", "It seems this chapter is about...", "This appears to be..."

REMEMBER: 
- You are a teacher, not a strict textbook. Help students learn effectively.
- Chapter content is your foundation, but your expertise extends beyond it.
- All responses MUST be formatted in professional Markdown. This is not optional.
`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentProcessingService: DocumentProcessingService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Send a message for a chapter (materialId is actually chapterId)
   * Basic implementation - returns a simple response
   * Language parameter will be used for OpenAI integration to return responses in the specified language
   * AI integration and DB persistence will be added later
   */
  async sendMessage(user: any, sendMessageDto: SendMessageDto): Promise<ApiResponse<any>> {
      this.logger.log(
        colors.cyan(
          `[EXPLORE CHAT] Sending message from user: ${user.email || user.sub} for chapter: ${sendMessageDto.materialId}, language: ${sendMessageDto.language || 'en'}`,
        ),
      );

    try {
      const userId = user.sub || user.id;
      const { message, materialId, language } = sendMessageDto;
      
      // Default language to 'en' if not provided
      const responseLanguage = language || 'en';

      // Validate chapter exists (materialId is actually chapterId)
      const chapter = await this.prisma.libraryGeneralMaterialChapter.findFirst({
        where: {
          id: materialId,
          isAiEnabled: true, // Only allow AI-enabled chapters
        },
        select: {
          id: true,
          title: true,
          materialId: true,
          material: {
            select: {
              id: true,
              title: true,
              isAvailable: true,
              status: true,
            },
          },
        },
      });

      if (!chapter) {
        this.logger.error(colors.red(`❌ Chapter not found or not AI-enabled: ${materialId}`));
        return new ApiResponse(false, 'Chapter not found or AI chat not enabled for this chapter', null);
      }

      // Check if parent material is available and published
      if (!chapter.material.isAvailable || chapter.material.status !== 'published') {
        this.logger.error(colors.red(`❌ Parent material not available: ${chapter.materialId}`));
        return new ApiResponse(false, 'Parent material not available or not published', null);
      }

      // Find PDFMaterial for Pinecone search
      // PDFMaterial.materialId can be either:
      // 1. chapter.id (when created via "create chapter with file" endpoint)
      // 2. chapterFile.id (when created via "upload file to existing chapter" endpoint)
      // Chunks are stored in Pinecone with material_id = PDFMaterial.id
      this.logger.log(colors.cyan(`🔍 Searching for PDFMaterial with materialId: ${materialId} (chapter ID)...`));
      let pdfMaterial = await this.prisma.pDFMaterial.findFirst({
        where: { materialId: materialId }, // Try chapter ID first (most common case)
        select: { id: true, materialId: true },
      });

      // If not found, try finding via chapter file
      if (!pdfMaterial) {
        this.logger.log(colors.yellow(`⚠️ PDFMaterial not found with chapter ID, trying chapter file...`));
        const chapterFile = await this.prisma.libraryGeneralMaterialChapterFile.findFirst({
          where: { chapterId: materialId },
          select: { id: true },
        });

        if (chapterFile) {
          this.logger.log(colors.cyan(`📚 Found chapter file: ${chapterFile.id}, searching for PDFMaterial...`));
          pdfMaterial = await this.prisma.pDFMaterial.findFirst({
            where: { materialId: chapterFile.id }, // Try chapter file ID
            select: { id: true, materialId: true },
          });
        } else {
          this.logger.warn(colors.yellow(`⚠️ Chapter file not found for chapter: ${materialId}`));
        }
      }

      // Get relevant context chunks from Pinecone using PDFMaterial.id
      let contextChunks: any[] = [];
      if (pdfMaterial) {
        this.logger.log(colors.cyan(`📚 Found PDFMaterial: ${pdfMaterial.id} (materialId: ${pdfMaterial.materialId}), searching Pinecone...`));
        
        // Check if chunks exist in database for this PDFMaterial (to verify processing happened)
        // Chunks are stored in DocumentChunk table with material_id = PDFMaterial.id
        const chunkCount = await this.prisma.documentChunk.count({
          where: { material_id: pdfMaterial.id },
        });
        this.logger.log(colors.cyan(`📊 Found ${chunkCount} chunks in database for PDFMaterial: ${pdfMaterial.id}`));
        
        try {
          // For summary requests, use a broader search with more chunks
          const isSummaryRequest = /summary|summarize|overview|what is this chapter about|what does this chapter cover/i.test(message);
          const topK = isSummaryRequest ? 10 : 5; // Get more chunks for summaries
          
          // For summary requests, use chapter title as search query to get broader context
          const searchQuery = isSummaryRequest ? chapter.title : message;
          contextChunks = await this.documentProcessingService.searchRelevantChunks(
            pdfMaterial.id,
            searchQuery,
            topK,
          );

          if (contextChunks.length > 0) {
            this.logger.log(colors.green(`✅ Found ${contextChunks.length} relevant chunks from Pinecone for PDFMaterial: ${pdfMaterial.id}`));
            // Log chunk previews for debugging
            contextChunks.slice(0, 2).forEach((chunk, idx) => {
              this.logger.log(colors.blue(`   Chunk ${idx + 1} preview: ${chunk.content.substring(0, 100)}...`));
            });
          } else {
            this.logger.warn(colors.yellow(`⚠️ No chunks found in Pinecone for PDFMaterial: ${pdfMaterial.id} (but ${chunkCount} chunks exist in database - processing may not have completed or chunks may not be indexed yet)`));
            this.logger.warn(colors.yellow(`⚠️ This may indicate: 1) Processing is still in progress, 2) Chunks failed to save to Pinecone, or 3) Search query didn't match any chunks`));
          }
        } catch (error: any) {
          this.logger.error(colors.red(`❌ Could not search chunks: ${error.message}`));
          contextChunks = [];
        }
      } else {
        this.logger.error(colors.red(`❌ PDFMaterial not found for chapter: ${materialId}. Document may not have been processed yet.`));
      }

      // Generate AI response using OpenAI with context chunks
      const startTime = Date.now();
      const aiResponse = await this.generateAIResponse(
        message,
        chapter.title,
        chapter.material.title,
        responseLanguage,
        contextChunks,
      );
      const responseTime = Date.now() - startTime;

      const responseData = {
        response: aiResponse.content,
        userId,
        chapterId: materialId, // The materialId is actually chapterId
        chapterTitle: chapter.title,
        materialId: chapter.materialId,
        materialTitle: chapter.material.title,
        language: responseLanguage,
        tokensUsed: aiResponse.tokensUsed,
        responseTimeMs: responseTime,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        colors.green(
          `✅ Message processed successfully for user: ${userId} (${aiResponse.tokensUsed} tokens, ${responseTime}ms)`,
        ),
      );

      return new ApiResponse(true, 'Message sent successfully', responseData);
    } catch (error: any) {
      this.logger.error(colors.red(`❌ Error sending message: ${error.message}`));
      throw error;
    }
  }

  /**
   * Generate AI response using OpenAI
   * @param userMessage - The user's message/question
   * @param chapterTitle - The title of the chapter
   * @param materialTitle - The title of the parent material
   * @param language - Language code for the response (ISO 639-1)
   * @param contextChunks - Relevant chunks from Pinecone for context
   * @returns AI response content and token usage
   */
  private async generateAIResponse(
    userMessage: string,
    chapterTitle: string,
    materialTitle: string,
    language: string,
    contextChunks: any[] = [],
  ): Promise<{ content: string; tokensUsed: number }> {
    try {
      // Build context from chunks
      const context = contextChunks.length > 0
        ? `\n\nRelevant document context from the chapter:\n${contextChunks.map((chunk, index) =>
            `[Chunk ${index + 1}]: ${chunk.content.substring(0, 800)}${chunk.content.length > 800 ? '...' : ''}`
          ).join('\n\n')}`
        : '\n\nNote: No specific document chunks were found. However, you should still provide helpful information about the chapter topic based on the chapter title and material title.';

      // Build system prompt with language instruction and context
      const languageInstruction = this.getLanguageInstruction(language);
      const systemPrompt = `${this.CHAPTER_SYSTEM_PROMPT}\n\n${languageInstruction}\n\nYou are teaching about chapter "${chapterTitle}" from the material "${materialTitle}".${context}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ];

      this.logger.log(colors.cyan(`🤖 Sending request to OpenAI (language: ${language})...`));

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages as any,
        max_tokens: 4000,
        temperature: 0.25, // Lower temperature for more factual, consistent responses
      });

      const content = response.choices[0].message.content || 'I apologize, but I could not generate a response.';
      const tokensUsed = response.usage?.total_tokens || 0;

      this.logger.log(colors.green(`✅ OpenAI response received (${tokensUsed} tokens)`));

      return {
        content,
        tokensUsed,
      };
    } catch (error: any) {
      this.logger.error(colors.red(`❌ Error generating AI response: ${error.message}`));
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  /**
   * Get language instruction for the system prompt
   * @param language - Language code (ISO 639-1)
   * @returns Language instruction string
   */
  private getLanguageInstruction(language: string): string {
    const languageMap: Record<string, string> = {
      en: 'Respond in English.',
      fr: 'Répondez en français.',
      es: 'Responde en español.',
      de: 'Antworten Sie auf Deutsch.',
      it: 'Rispondi in italiano.',
      pt: 'Responda em português.',
      ru: 'Отвечайте на русском языке.',
      ja: '日本語で回答してください。',
      zh: '用中文回答。',
      ar: 'أجب بالعربية.',
      hi: 'हिंदी में उत्तर दें।',
      sw: 'Jibu kwa Kiswahili.',
      yo: 'Dahun ni ede Yoruba.',
      ig: 'Zaa n\'asụsụ Igbo.',
      ha: 'Amsa da Hausa.',
    };

    const instruction = languageMap[language.toLowerCase()] || `Respond in the language with code "${language}".`;
    return `LANGUAGE REQUIREMENT: ${instruction} All your responses must be in this language, formatted in professional Markdown.`;
  }
}
