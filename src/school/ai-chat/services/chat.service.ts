import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DocumentProcessingService } from './document-processing.service';
import { PineconeService } from './pinecone.service';
import { EmbeddingService } from './embedding.service';
import OpenAI from 'openai';
import { 
  SendMessageDto, 
  ChatMessageResponseDto, 
  CreateConversationDto, 
  ConversationResponseDto,
  GetChatHistoryDto 
} from '../dto/chat.dto';
import { User } from '@prisma/client';
import * as colors from 'colors';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly pineconeService: PineconeService,
    private readonly embeddingService: EmbeddingService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  private readonly MATERIAL_SYSTEM_PROMPT = `
  You are a professional teacher and subject‑matter expert.
  Your job is to teach with confidence using the uploaded material as your primary source. For questions about the material's content, use it directly. For improvement suggestions, analysis, or general guidance, provide helpful professional advice.

  Communication style:
  - Be direct, confident, and authoritative. Avoid hedging and filler.
  - Do NOT use weak phrases: "appears", "seems", "might", "I think", "I believe", "likely".
  - Prefer imperative teacher language: "Do X", "Recall that…", "Use method Y because…".
  - Keep answers concise but complete. Use bullets or short steps when helpful.
  - When a calculation or method is requested, show the minimal steps needed, then the result.

  Grounding rules:
  - For content questions: Use facts, definitions, notation, and examples from the material first.
  - For improvement/analysis questions: Provide professional guidance based on the material's structure and content, even if not explicitly stated.
  - For completely unrelated topics: Say "This question is outside the scope of this material" and redirect to the material.

  Behavior:
  - Act as a mentor guiding a student. Offer quick checks, common pitfalls, and next steps when appropriate.
  - If the student's question is vague, ask one concise clarifying question before proceeding.
  - Keep responses within 3–8 sentences unless the user explicitly requests more detail or steps.

  Tone examples:
  - Good: "This is a Level 1 workbook on number sense and basic algebra. Start with page 12: practice counting in tens; then attempt Exercise B. Use a number line to visualize jumps of ten."
  - Good: "To improve this form, add clear instructions, use consistent formatting, and include examples for each section."
  - Avoid: "This document appears to be… It might be about…"
`;

  private readonly GENERAL_SYSTEM_PROMPT = `
  You are a helpful AI assistant for educational purposes.
  You help school owners, teachers, and students with general questions and educational topics.
  Answer questions clearly and provide helpful explanations.
  Be encouraging and supportive in your responses.
  Keep your answers concise but complete when the user asks for specific amounts or detailed information.
  Note: If asked about very recent events (after October 2023), mention that your knowledge may be limited and suggest checking the latest sources.
`;

  /**
   * Extract user ID and fetch school ID from database
   */
  private async extractUserData(user: any): Promise<{ userId: string; schoolId: string }> {
    const userId = user.id || user.sub;
    
    if (!userId) {
      throw new Error('User ID not found in token');
    }
    
    // Fetch user data from database to get school_id
    const userData = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { school_id: true }
    });
    
    if (!userData) {
      throw new Error('User not found in database');
    }
    
    if (!userData.school_id) {
      throw new Error('User school_id is missing from database');
    }
    
    return { userId, schoolId: userData.school_id };
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    user: User,
    createConversationDto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    try {
      const { userId, schoolId } = await this.extractUserData(user);
      
      this.logger.log(colors.blue(`💬 Creating new conversation for user: ${userId}`));
      

      const conversation = await this.prisma.chatConversation.create({
        data: {
          user_id: userId,
          school_id: schoolId,
          material_id: createConversationDto.materialId ?? null,
          title: createConversationDto.title || 'New Conversation',
          system_prompt: createConversationDto.materialId ? this.MATERIAL_SYSTEM_PROMPT : this.GENERAL_SYSTEM_PROMPT,
          status: 'ACTIVE',
          total_messages: 0,
        },
      });

      this.logger.log(colors.green(`✅ Conversation created: ${conversation.id}`));

      return {
        id: conversation.id,
        title: conversation.title || 'New Conversation',
        chatTitle: conversation.title || 'New Conversation',
        status: conversation.status,
        materialId: conversation.material_id,
        totalMessages: conversation.total_messages,
        lastActivity: conversation.last_activity.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating conversation: ${error.message}`));
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    user: User,
    sendMessageDto: SendMessageDto
  ): Promise<ChatMessageResponseDto> {
    const startTime = Date.now();
    
    try {
      const { userId, schoolId } = await this.extractUserData(user);
      
      this.logger.log(colors.blue(`💬 Processing message from user: ${userId}`));
      
      this.logger.log(colors.blue(`💬 Send Message Dto: ${JSON.stringify(sendMessageDto, null, 2)}`));

      // Get or create conversation
      let conversation = await this.getOrCreateConversation(
        user,
        sendMessageDto.conversationId,
        sendMessageDto.materialId
      );

      // Save user message
      const userMessage = await this.prisma.chatMessage.create({
        data: {
          conversation_id: conversation.id,
          user_id: userId,
          school_id: schoolId,
          material_id: sendMessageDto.materialId || null,
          role: 'USER',
          content: sendMessageDto.message,
          message_type: 'TEXT',
        },
      });

      // Get relevant context chunks if material is specified
      let contextChunks: any[] = [];
      if (sendMessageDto.materialId) {
        contextChunks = await this.documentProcessingService.searchRelevantChunks(
          sendMessageDto.materialId,
          sendMessageDto.message,
          5
        );
      }

      // Generate AI response
      const systemPrompt = (conversation as any).material_id ? this.MATERIAL_SYSTEM_PROMPT : this.GENERAL_SYSTEM_PROMPT;
      const aiResponse = await this.generateAIResponse(
        sendMessageDto.message,
        contextChunks,
        systemPrompt,
        (conversation as any).material_id ? await this.getConversationHistory(conversation.id, 50, userId) : [],
        Boolean((conversation as any).material_id)
      );

      // Generate chat title for new conversations (first message)
      let chatTitle: string | null = null;
      this.logger.log(colors.cyan(`📝 Checking if should generate title. Total messages: ${(conversation as any).total_messages}`));
      
      // Check if this is a new conversation (total_messages is 0 or undefined, and no existing title)
      const isNewConversation = ((conversation as any).total_messages === 0 || (conversation as any).total_messages === undefined) && 
                                (!conversation.title || conversation.title === 'New Conversation' || conversation.title === 'General Chat');
      
      if (isNewConversation) {
        this.logger.log(colors.cyan(`📝 Generating chat title for first message: "${sendMessageDto.message}"`));
        chatTitle = await this.generateChatTitle(sendMessageDto.message);
        
        // Update conversation with the generated title
        await this.prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { title: chatTitle }
        });
        this.logger.log(colors.green(`✅ Updated conversation title to: "${chatTitle}"`));
      } else {
        this.logger.log(colors.cyan(`📝 Skipping title generation - not first message`));
      }

      // Save AI message
      const refinedContent = this.refineTone(aiResponse.content);

      const aiMessage = await this.prisma.chatMessage.create({
        data: {
          conversation_id: conversation.id,
          user_id: userId,
          school_id: schoolId,
          material_id: sendMessageDto.materialId || null,
          role: 'ASSISTANT',
          content: refinedContent,
          message_type: 'TEXT',
          model_used: 'gpt-4o-mini',
          tokens_used: aiResponse.tokensUsed,
          response_time_ms: Date.now() - startTime,
          context_chunks: contextChunks.map(chunk => chunk.id),
          context_summary: contextChunks.length > 0 ? 
            `Found ${contextChunks.length} relevant chunks from the document` : null,
        },
      });

      // Update conversation
      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: {
          total_messages: ((conversation as any).total_messages || 0) + 2, // User + AI message
          last_activity: new Date(),
        },
      });

      // Update user token usage
      await this.updateUserTokenUsage(userId, aiResponse.tokensUsed);

      // Save context relationships
      if (contextChunks.length > 0) {
        await this.saveContextRelationships(aiMessage.id, contextChunks, conversation.id, schoolId);
      }

      const responseTime = Date.now() - startTime;
      this.logger.log(colors.green(`✅ Message processed in ${responseTime}ms`));

      return {
        id: aiMessage.id,
        content: aiMessage.content,
        role: aiMessage.role,
        conversationId: aiMessage.conversation_id,
        materialId: aiMessage.material_id,
        chatTitle: chatTitle, // Include generated title
        contextChunks: contextChunks.map((chunk: any) => ({
          id: chunk.id,
          content: chunk.content.substring(0, 200) + '...', // Truncate for response
          similarity: chunk.similarity,
          chunkType: chunk.chunk_type,
        })),
        tokensUsed: aiMessage.tokens_used,
        responseTimeMs: aiMessage.response_time_ms,
        createdAt: aiMessage.createdAt.toISOString(),
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error processing message: ${error.message}`));
      throw new Error(`Failed to process message: ${error.message}`);
    }
  }

  /**
   * Get conversation history
   */
  async getChatHistory(
    user: User,
    conversationId: string,
    getChatHistoryDto: GetChatHistoryDto
  ): Promise<{ conversationHistory: ChatMessageResponseDto[]; usageLimits: any }> {

    this.logger.log(colors.blue(`💬 Getting chat history for conversation: ${conversationId}`));

    try {
      const { userId } = await this.extractUserData(user);
      
      // Get conversation history
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          conversation_id: conversationId,
          user_id: userId,
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt((getChatHistoryDto.limit || 25).toString()),
        skip: parseInt((getChatHistoryDto.offset || 0).toString()),
      });

      const conversationHistory = messages.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role,
        conversationId: message.conversation_id,
        materialId: message.material_id,
        tokensUsed: message.tokens_used,
        responseTimeMs: message.response_time_ms,
        createdAt: message.createdAt.toISOString(),
      }));

      // Get usage limits
      const usageLimits = await this.getUserUsageLimits(userId);

      return {
        conversationHistory,
        usageLimits
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting chat history: ${error.message}`));
      throw new Error(`Failed to get chat history: ${error.message}`);
    }
  }

  /**
   * Get user's usage limits
   */
  private async getUserUsageLimits(userId: string): Promise<any> {
    try {
      this.logger.log(colors.blue(`📊 Fetching usage limits for user: ${userId}`));

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          filesUploadedThisMonth: true,
          totalFilesUploadedAllTime: true,
          totalStorageUsedMB: true,
          maxFilesPerMonth: true,
          maxFileSizeMB: true,
          maxStorageMB: true,
          tokensUsedThisWeek: true,
          tokensUsedThisDay: true,
          tokensUsedAllTime: true,
          maxTokensPerWeek: true,
          maxTokensPerDay: true,
          lastFileResetDate: true,
          lastTokenResetDateAllTime: true,
        }
      });

      if (!user) {
        this.logger.error(colors.red(`❌ User not found: ${userId}`));
        throw new Error('User not found');
      }

      const usageLimits = {
        filesUploadedThisMonth: user.filesUploadedThisMonth,
        totalFilesUploadedAllTime: user.totalFilesUploadedAllTime,
        totalStorageUsedMB: user.totalStorageUsedMB,
        maxFilesPerMonth: user.maxFilesPerMonth,
        maxFileSizeMB: user.maxFileSizeMB,
        maxStorageMB: user.maxStorageMB,
        tokensUsedThisWeek: user.tokensUsedThisWeek,
        tokensUsedThisDay: user.tokensUsedThisDay,
        tokensUsedAllTime: user.tokensUsedAllTime,
        maxTokensPerWeek: user.maxTokensPerWeek,
        maxTokensPerDay: user.maxTokensPerDay,
        lastFileResetDate: user.lastFileResetDate.toISOString(),
        lastTokenResetDate: user.lastTokenResetDateAllTime.toISOString(),
      };

      this.logger.log(colors.green(`✅ Retrieved usage limits for user`));
      return usageLimits;

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching usage limits: ${error.message}`));
      throw new Error(`Failed to fetch usage limits: ${error.message}`);
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(user: User): Promise<ConversationResponseDto[]> {
    try {
      const { userId } = await this.extractUserData(user);
      
      const conversations = await this.prisma.chatConversation.findMany({
        where: {
          user_id: userId,
        },
        orderBy: { last_activity: 'desc' },
        take: 50,
      });

      return conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
        chatTitle: conversation.title, // Alias for clarity
        status: conversation.status,
        materialId: conversation.material_id,
        totalMessages: conversation.total_messages,
        lastActivity: conversation.last_activity.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      }));

    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting conversations: ${error.message}`));
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(
    user: User,
    conversationId?: string,
    materialId?: string
  ) {
    const { userId, schoolId } = await this.extractUserData(user);
    
    if (conversationId) {
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          user_id: userId,
        },
      });

      if (conversation) {
        return conversation;
      }
    }

    // Create new conversation
    return this.createConversation(user, {
      materialId,
      title: materialId ? 'Document Chat' : 'General Chat',
    });
  }

  /**
   * Generate chat title based on first message
   */
  private async generateChatTitle(firstMessage: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Generate a short, descriptive title (max 5 words) for this conversation based on the user\'s first message. Return only the title, nothing else.'
          },
          {
            role: 'user',
            content: firstMessage
          }
        ],
        max_tokens: 20,
        temperature: 0.3,
      });

      const title = response.choices[0].message.content?.trim() || 'New Chat';
      this.logger.log(colors.cyan(`📝 Generated chat title: "${title}"`));
      return title;

    } catch (error) {
      this.logger.error(colors.red(`❌ Error generating chat title: ${error.message}`));
      return 'New Chat';
    }
  }

  /**
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    userMessage: string,
    contextChunks: any[],
    systemPrompt: string,
    conversationHistory: any[],
    isMaterialChat: boolean
  ): Promise<{ content: string; tokensUsed: number }> {
    try {
      // Build context from chunks
      const context = contextChunks.length > 0 
        ? `\n\nRelevant document context:\n${contextChunks.map(chunk => 
            `- ${chunk.content.substring(0, 500)}...`
          ).join('\n')}`
        : '';

      // Build conversation history
      const history = conversationHistory.map(msg => 
        `${msg.role}: ${msg.content}`
      ).join('\n');

      // Log conversation history being sent to ChatGPT
      this.logger.log(colors.cyan(`📚 Conversation history (${conversationHistory.length} messages):`));
      if (conversationHistory.length > 0) {
        // conversationHistory.forEach((msg, index) => {
        //   this.logger.log(colors.cyan(`   ${index + 1}. ${msg.role.toUpperCase()}: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`));
        // });
      } else {
        this.logger.log(colors.cyan(`   No previous conversation history`));
      }

      const messages = [
        { role: 'system', content: systemPrompt + context },
        ...(history ? [{ role: 'user', content: `Previous conversation:\n${history}` }] : []),
        { role: 'user', content: userMessage },
      ];

      // Log the complete prompt being sent to ChatGPT
      this.logger.log(colors.cyan(`🤖 Full prompt being sent to ChatGPT:`));
      // messages.forEach((msg, index) => {
      //   this.logger.log(colors.cyan(`   ${index + 1}. ${msg.role.toUpperCase()}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`));
      // });

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages as any,
        max_tokens: 4000,
        temperature: isMaterialChat ? 0.25 : 0.7,
      });

      return {
        content: response.choices[0].message.content || 'I apologize, but I could not generate a response.',
        tokensUsed: response.usage?.total_tokens || 0,
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error generating AI response: ${error.message}`));
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  /**
   * Get conversation history for context
   */
  private async getConversationHistory(conversationId: string, limit: number, userId?: string) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { 
        conversation_id: conversationId,
        ...(userId && { user_id: userId })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return messages.reverse(); // Return in chronological order
  }

  /**
   * Update user token usage counters
   */
  private async updateUserTokenUsage(userId: string, tokensUsed: number) {
    try {
      this.logger.log(colors.blue(`📊 Updating token usage for user: ${userId}, tokens: ${tokensUsed}`));

      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());

      // Get current user data
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          tokensUsedThisDay: true,
          tokensUsedThisWeek: true,
          tokensUsedAllTime: true,
          lastTokenResetDateAllTime: true,
        }
      });

      if (!user) {
        console.log('User not found for token update: ', userId);
        this.logger.error(colors.red(`❌ User not found for token update: ${userId}`));
        return;
      }

      // Check if we need to reset daily/weekly counters
      const shouldResetDaily = user.lastTokenResetDateAllTime < startOfDay;
      const shouldResetWeekly = user.lastTokenResetDateAllTime < startOfWeek;

      // Calculate new values
      const newDailyTokens = shouldResetDaily ? tokensUsed : (user.tokensUsedThisDay || 0) + tokensUsed;
      const newWeeklyTokens = shouldResetWeekly ? tokensUsed : (user.tokensUsedThisWeek || 0) + tokensUsed;
      const newAllTimeTokens = (user.tokensUsedAllTime || 0) + tokensUsed;
      // Update user token usage
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tokensUsedThisDay: newDailyTokens,
          tokensUsedThisWeek: newWeeklyTokens,
          tokensUsedAllTime: newAllTimeTokens,
          lastTokenResetDateAllTime: today,
        }
      });

      // log previous values
      this.logger.log(colors.cyan(`📊 Previous token usage - Daily: ${user.tokensUsedThisDay}, Weekly: ${user.tokensUsedThisWeek}, All-time: ${user.tokensUsedAllTime}`));

      this.logger.log(colors.green(`✅ Updated token usage - Daily: ${newDailyTokens}, Weekly: ${newWeeklyTokens}, All-time: ${newAllTimeTokens}`));

    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating token usage: ${error.message}`));
    }
  }

  /**
   * Refine tone to remove hedging and start decisively
   */
  private refineTone(text: string): string {
    if (!text) return text;

    // Remove common hedging phrases
    const hedges = [
      /\bthis (document|workbook) (appears to|seems to|might)\b/gi,
      /\b(it|this) (appears|seems|might|likely)\b/gi,
      /\bI (think|believe)\b/gi,
      /\bprobably\b/gi,
    ];
    let refined = text;
    for (const h of hedges) {
      refined = refined.replace(h, (match) => match.replace(/(appears to|seems to|might|likely|I think|I believe|probably)/gi, 'is'));
    }

    // Ensure opening doesn’t start with weak framing
    refined = refined.replace(/^\s*the document you provided\s+is/iu, 'This material is');
    refined = refined.replace(/^\s*the document you provided\s+appears\s+to\s+be/iu, 'This material is');

    return refined.trim();
  }

  /**
   * Save context relationships
   */
  private async saveContextRelationships(
    messageId: string,
    contextChunks: any[],
    conversationId: string,
    schoolId: string
  ) {
    try {
      const contextData = contextChunks.map((chunk, index) => ({
        conversation_id: conversationId,
        message_id: messageId,
        chunk_id: chunk.id,
        school_id: schoolId,
        relevance_score: chunk.similarity,
        context_type: 'semantic',
        position_in_context: index,
      }));

      for (const context of contextData) {
        await this.prisma.chatContext.create({ data: context });
      }

    } catch (error) {
      this.logger.error(colors.red(`❌ Error saving context relationships: ${error.message}`));
    }
  }
}
