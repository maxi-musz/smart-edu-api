import { Injectable, Logger } from '@nestjs/common';
import { MessageRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { SendMessageDto } from './dto/send-message.dto';
import {
  ExploreListConversationsDto,
  ExploreConversationMessagesDto,
} from './dto/explore-conversations.dto';
import { DocumentProcessingService } from '../../school/ai-chat/services/document-processing.service';
import OpenAI from 'openai';
import * as colors from 'colors';

const EXPLORE_CHAT_HISTORY_LIMIT = 10;

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
   * Explore chat: chapter-scoped AI with persisted conversation history (library general material chat tables).
   * sendMessageDto.materialId is the chapter id.
   */
  async sendMessage(
    user: any,
    sendMessageDto: SendMessageDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(
        `[EXPLORE CHAT] Sending message from user: ${user.email || user.sub} for chapter: ${sendMessageDto.materialId}, language: ${sendMessageDto.language || 'en'}, conversationId: ${sendMessageDto.conversationId || 'new'}`,
      ),
    );

    try {
      const clientUserId = user.sub || user.id;
      const { message, materialId, language, conversationId } = sendMessageDto;
      const responseLanguage = language || 'en';

      const chapter = await this.prisma.libraryGeneralMaterialChapter.findFirst(
        {
          where: {
            id: materialId,
            isAiEnabled: true,
          },
          select: {
            id: true,
            title: true,
            materialId: true,
            platformId: true,
            material: {
              select: {
                id: true,
                title: true,
                isAvailable: true,
                status: true,
              },
            },
          },
        },
      );

      if (!chapter) {
        this.logger.error(
          colors.red(`❌ Chapter not found or not AI-enabled: ${materialId}`),
        );
        return new ApiResponse(
          false,
          'Chapter not found or AI chat not enabled for this chapter',
          null,
        );
      }

      if (
        !chapter.material.isAvailable ||
        chapter.material.status !== 'published'
      ) {
        this.logger.error(
          colors.red(`❌ Parent material not available: ${chapter.materialId}`),
        );
        return new ApiResponse(
          false,
          'Parent material not available or not published',
          null,
        );
      }

      const persistenceUserId = await this.resolvePersistenceUserId(user);

      let conversation =
        await this.prisma.libraryGeneralMaterialChatConversation.findFirst({
          where: conversationId
            ? { id: conversationId, userId: persistenceUserId }
            : { id: '__never__' },
        });

      if (conversationId) {
        if (!conversation) {
          return new ApiResponse(false, 'Conversation not found', null);
        }
        if (
          conversation.materialId !== chapter.materialId ||
          conversation.platformId !== chapter.platformId
        ) {
          return new ApiResponse(
            false,
            'Conversation does not match this chapter or material',
            null,
          );
        }
        if (
          conversation.chapterId != null &&
          conversation.chapterId !== chapter.id
        ) {
          return new ApiResponse(
            false,
            'Conversation does not match this chapter',
            null,
          );
        }
      } else {
        const title = await this.generateChatTitle(message);
        conversation =
          await this.prisma.libraryGeneralMaterialChatConversation.create({
            data: {
              userId: persistenceUserId,
              materialId: chapter.materialId,
              platformId: chapter.platformId,
              chapterId: chapter.id,
              title,
            },
          });
      }

      const history = await this.loadRecentHistoryForOpenAi(conversation.id);

      this.logger.log(
        colors.cyan(
          `🔍 Searching for PDFMaterial with materialId: ${materialId} (chapter ID)...`,
        ),
      );
      let pdfMaterial = await this.prisma.pDFMaterial.findFirst({
        where: { materialId: materialId },
        select: { id: true, materialId: true },
      });

      if (!pdfMaterial) {
        this.logger.log(
          colors.yellow(
            `⚠️ PDFMaterial not found with chapter ID, trying chapter file...`,
          ),
        );
        const chapterFile =
          await this.prisma.libraryGeneralMaterialChapterFile.findFirst({
            where: { chapterId: materialId },
            select: { id: true },
          });

        if (chapterFile) {
          this.logger.log(
            colors.cyan(
              `📚 Found chapter file: ${chapterFile.id}, searching for PDFMaterial...`,
            ),
          );
          pdfMaterial = await this.prisma.pDFMaterial.findFirst({
            where: { materialId: chapterFile.id },
            select: { id: true, materialId: true },
          });
        } else {
          this.logger.warn(
            colors.yellow(
              `⚠️ Chapter file not found for chapter: ${materialId}`,
            ),
          );
        }
      }

      let contextChunks: any[] = [];
      if (pdfMaterial) {
        this.logger.log(
          colors.cyan(
            `📚 Found PDFMaterial: ${pdfMaterial.id} (materialId: ${pdfMaterial.materialId}), searching Pinecone...`,
          ),
        );

        const chunkCount = await this.prisma.documentChunk.count({
          where: { material_id: pdfMaterial.id },
        });
        this.logger.log(
          colors.cyan(
            `📊 Found ${chunkCount} chunks in database for PDFMaterial: ${pdfMaterial.id}`,
          ),
        );

        try {
          const isSummaryRequest =
            /summary|summarize|overview|what is this chapter about|what does this chapter cover/i.test(
              message,
            );
          const topK = isSummaryRequest ? 10 : 5;
          const searchQuery = isSummaryRequest ? chapter.title : message;
          contextChunks =
            await this.documentProcessingService.searchRelevantChunks(
              pdfMaterial.id,
              searchQuery,
              topK,
            );

          if (contextChunks.length > 0) {
            this.logger.log(
              colors.green(
                `✅ Found ${contextChunks.length} relevant chunks from Pinecone for PDFMaterial: ${pdfMaterial.id}`,
              ),
            );
            contextChunks.slice(0, 2).forEach((chunk, idx) => {
              this.logger.log(
                colors.blue(
                  `   Chunk ${idx + 1} preview: ${chunk.content.substring(0, 100)}...`,
                ),
              );
            });
          } else {
            this.logger.warn(
              colors.yellow(
                `⚠️ No chunks found in Pinecone for PDFMaterial: ${pdfMaterial.id} (but ${chunkCount} chunks exist in database - processing may not have completed or chunks may not be indexed yet)`,
              ),
            );
          }
        } catch (error: any) {
          this.logger.error(
            colors.red(`❌ Could not search chunks: ${error.message}`),
          );
          contextChunks = [];
        }
      } else {
        this.logger.error(
          colors.red(
            `❌ PDFMaterial not found for chapter: ${materialId}. Document may not have been processed yet.`,
          ),
        );
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.libraryGeneralMaterialChatMessage.create({
          data: {
            conversationId: conversation.id,
            materialId: chapter.materialId,
            userId: persistenceUserId,
            role: MessageRole.USER,
            content: message,
          },
        });
        await tx.libraryGeneralMaterialChatConversation.update({
          where: { id: conversation.id },
          data: {
            totalMessages: { increment: 1 },
            lastActivity: new Date(),
          },
        });
      });

      const startTime = Date.now();
      let aiResponse: { content: string; tokensUsed: number };
      try {
        aiResponse = await this.generateAIResponse(
          message,
          chapter.title,
          chapter.material.title,
          responseLanguage,
          contextChunks,
          history,
        );
      } catch (aiErr: any) {
        this.logger.error(
          colors.red(`❌ OpenAI failed after user message saved: ${aiErr.message}`),
        );
        return new ApiResponse(
          false,
          aiErr.message || 'Failed to generate AI response',
          {
            conversationId: conversation.id,
            conversationTitle: conversation.title,
            userId: clientUserId,
            chapterId: materialId,
            chapterTitle: chapter.title,
            materialId: chapter.materialId,
            materialTitle: chapter.material.title,
          },
        );
      }
      const responseTime = Date.now() - startTime;

      await this.prisma.$transaction(async (tx) => {
        await tx.libraryGeneralMaterialChatMessage.create({
          data: {
            conversationId: conversation.id,
            materialId: chapter.materialId,
            userId: persistenceUserId,
            role: MessageRole.ASSISTANT,
            content: aiResponse.content,
            tokensUsed: aiResponse.tokensUsed,
            model: 'gpt-4o-mini',
          },
        });
        await tx.libraryGeneralMaterialChatConversation.update({
          where: { id: conversation.id },
          data: {
            totalMessages: { increment: 1 },
            lastActivity: new Date(),
          },
        });
      });

      const refreshed =
        await this.prisma.libraryGeneralMaterialChatConversation.findUnique({
          where: { id: conversation.id },
        });

      const responseData = {
        response: aiResponse.content,
        userId: clientUserId,
        conversationId: conversation.id,
        conversationTitle: refreshed?.title ?? conversation.title,
        chapterId: materialId,
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
          `✅ Message processed successfully for user: ${clientUserId} (${aiResponse.tokensUsed} tokens, ${responseTime}ms)`,
        ),
      );

      return new ApiResponse(true, 'Message sent successfully', responseData);
    } catch (error: any) {
      this.logger.error(
        colors.red(`❌ Error sending message: ${error.message}`),
      );
      throw error;
    }
  }

  async listConversations(
    user: any,
    query: ExploreListConversationsDto,
  ): Promise<ApiResponse<any>> {
    try {
      const persistenceUserId = await this.resolvePersistenceUserId(user);
      const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);

      let lastActivityBefore: Date | undefined;
      if (query.cursor) {
        const cursorRow =
          await this.prisma.libraryGeneralMaterialChatConversation.findFirst({
            where: { id: query.cursor, userId: persistenceUserId },
            select: { lastActivity: true },
          });
        if (!cursorRow) {
          return new ApiResponse(false, 'Invalid cursor', null);
        }
        lastActivityBefore = cursorRow.lastActivity;
      }

      const rows =
        await this.prisma.libraryGeneralMaterialChatConversation.findMany({
          where: {
            userId: persistenceUserId,
            ...(query.chapterId ? { chapterId: query.chapterId } : {}),
            ...(query.materialId ? { materialId: query.materialId } : {}),
            ...(lastActivityBefore
              ? { lastActivity: { lt: lastActivityBefore } }
              : {}),
          },
          orderBy: { lastActivity: 'desc' },
          take: limit + 1,
          include: {
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: { content: true, role: true },
            },
          },
        });

      const hasMore = rows.length > limit;
      const page = hasMore ? rows.slice(0, limit) : rows;
      const nextCursor = hasMore ? page[page.length - 1]?.id : null;

      const conversations = page.map((c) => ({
        id: c.id,
        title: c.title,
        chapterId: c.chapterId,
        materialId: c.materialId,
        platformId: c.platformId,
        lastActivity: c.lastActivity.toISOString(),
        totalMessages: c.totalMessages,
        preview: c.messages[0]?.content?.substring(0, 200) ?? null,
      }));

      return new ApiResponse(true, 'Conversations loaded', {
        conversations,
        nextCursor,
      });
    } catch (error: any) {
      this.logger.error(
        colors.red(`❌ listConversations: ${error.message}`),
      );
      return new ApiResponse(false, error.message || 'Failed to list conversations', null);
    }
  }

  async getConversationMessages(
    user: any,
    query: ExploreConversationMessagesDto,
  ): Promise<ApiResponse<any>> {
    try {
      const persistenceUserId = await this.resolvePersistenceUserId(user);
      const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);

      const conv =
        await this.prisma.libraryGeneralMaterialChatConversation.findFirst({
          where: {
            id: query.conversationId,
            userId: persistenceUserId,
          },
        });
      if (!conv) {
        return new ApiResponse(false, 'Conversation not found', null);
      }

      let createdAtGt: Date | undefined;
      if (query.cursor) {
        const cur = await this.prisma.libraryGeneralMaterialChatMessage.findFirst(
          {
            where: {
              id: query.cursor,
              conversationId: conv.id,
            },
            select: { createdAt: true },
          },
        );
        if (!cur) {
          return new ApiResponse(false, 'Invalid message cursor', null);
        }
        createdAtGt = cur.createdAt;
      }

      const messages =
        await this.prisma.libraryGeneralMaterialChatMessage.findMany({
          where: {
            conversationId: conv.id,
            ...(createdAtGt ? { createdAt: { gt: createdAtGt } } : {}),
          },
          orderBy: { createdAt: 'asc' },
          take: limit + 1,
          select: {
            id: true,
            role: true,
            content: true,
            tokensUsed: true,
            model: true,
            createdAt: true,
          },
        });

      const hasMore = messages.length > limit;
      const page = hasMore ? messages.slice(0, limit) : messages;
      const nextCursor = hasMore ? page[page.length - 1]?.id : null;

      return new ApiResponse(true, 'Messages loaded', {
        conversationId: conv.id,
        messages: page.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          tokensUsed: m.tokensUsed,
          model: m.model,
          createdAt: m.createdAt.toISOString(),
        })),
        nextCursor,
      });
    } catch (error: any) {
      this.logger.error(
        colors.red(`❌ getConversationMessages: ${error.message}`),
      );
      return new ApiResponse(
        false,
        error.message || 'Failed to load messages',
        null,
      );
    }
  }

  private async resolvePersistenceUserId(user: any): Promise<string> {
    const sub = user.sub || user.id;
    if (!sub) {
      throw new Error('User ID not found in token');
    }

    const existingById = await this.prisma.user.findUnique({
      where: { id: sub },
      select: { id: true },
    });
    if (existingById) {
      return existingById.id;
    }

    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: sub },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
      },
    });

    if (libraryUser) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email: libraryUser.email },
        select: { id: true },
      });
      if (byEmail) {
        return byEmail.id;
      }

      const librarySchool = await this.prisma.school.upsert({
        where: { school_email: 'library-chat@system.com' },
        update: {},
        create: {
          school_name: 'Library Chat System',
          school_email: 'library-chat@system.com',
          school_phone: '+000-000-0000',
          school_address: 'System Default',
          school_type: 'primary_and_secondary',
          school_ownership: 'private',
          status: 'approved',
        },
      });

      await this.prisma.user.create({
        data: {
          id: libraryUser.id,
          email: libraryUser.email,
          school_id: librarySchool.id,
          password: 'library-user-placeholder',
          first_name: libraryUser.first_name || 'Library',
          last_name: libraryUser.last_name || 'User',
          phone_number: libraryUser.phone_number || '+000-000-0000',
          role: 'student',
          status: 'active',
        },
      });
      return libraryUser.id;
    }

    throw new Error(
      'Chat history requires a library or school user linked to this account',
    );
  }

  private async loadRecentHistoryForOpenAi(
    conversationId: string,
  ): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
    const rows = await this.prisma.libraryGeneralMaterialChatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: EXPLORE_CHAT_HISTORY_LIMIT,
      select: { role: true, content: true },
    });

    const chronological = rows.reverse();
    const out: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const r of chronological) {
      if (r.role === MessageRole.USER) {
        out.push({ role: 'user', content: r.content });
      } else if (r.role === MessageRole.ASSISTANT) {
        out.push({ role: 'assistant', content: r.content });
      }
    }
    return out;
  }

  private async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              "Generate a short, descriptive title (max 5 words) for this conversation based on the user's first message. Return only the title, nothing else.",
          },
          {
            role: 'user',
            content: firstMessage,
          },
        ],
        max_tokens: 20,
        temperature: 0.3,
      });

      const title =
        response.choices[0].message.content?.trim() || 'New conversation';
      this.logger.log(colors.cyan(`📝 Generated explore chat title: "${title}"`));
      return title;
    } catch (error: any) {
      this.logger.error(
        colors.red(`❌ Error generating chat title: ${error.message}`),
      );
      return 'New conversation';
    }
  }

  private async generateAIResponse(
    userMessage: string,
    chapterTitle: string,
    materialTitle: string,
    language: string,
    contextChunks: any[] = [],
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<{ content: string; tokensUsed: number }> {
    try {
      const context =
        contextChunks.length > 0
          ? `\n\nRelevant document context from the chapter:\n${contextChunks
              .map(
                (chunk, index) =>
                  `[Chunk ${index + 1}]: ${chunk.content.substring(0, 800)}${chunk.content.length > 800 ? '...' : ''}`,
              )
              .join('\n\n')}`
          : '\n\nNote: No specific document chunks were found. However, you should still provide helpful information about the chapter topic based on the chapter title and material title.';

      const languageInstruction = this.getLanguageInstruction(language);
      const systemPrompt = `${this.CHAPTER_SYSTEM_PROMPT}\n\n${languageInstruction}\n\nYou are teaching about chapter "${chapterTitle}" from the material "${materialTitle}".${context}`;

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        { role: 'user', content: userMessage },
      ];

      this.logger.log(
        colors.cyan(
          `🤖 OpenAI request (language: ${language}, history turns: ${history.length})`,
        ),
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 16000,
        temperature: 0.25,
      });

      const content =
        response.choices[0].message.content ||
        'I apologize, but I could not generate a response.';
      const tokensUsed = response.usage?.total_tokens || 0;

      this.logger.log(
        colors.green(`✅ OpenAI response received (${tokensUsed} tokens)`),
      );

      return {
        content,
        tokensUsed,
      };
    } catch (error: any) {
      this.logger.error(
        colors.red(`❌ Error generating AI response: ${error.message}`),
      );
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

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
      ig: "Zaa n'asụsụ Igbo.",
      ha: 'Amsa da Hausa.',
    };

    const instruction =
      languageMap[language.toLowerCase()] ||
      `Respond in the language with code "${language}".`;
    return `LANGUAGE REQUIREMENT: ${instruction} All your responses must be in this language, formatted in professional Markdown.`;
  }
}
