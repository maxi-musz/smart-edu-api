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

  /**
   * Create a new conversation
   */
  async createConversation(
    user: User,
    createConversationDto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    try {
      this.logger.log(colors.blue(`💬 Creating new conversation for user: ${user.id}`));

      const conversation = await this.prisma.chatConversation.create({
        data: {
          user_id: user.id,
          school_id: user.school_id,
          material_id: createConversationDto.materialId || null,
          title: createConversationDto.title || 'New Conversation',
          system_prompt: createConversationDto.systemPrompt || 'You are a helpful AI assistant.',
          status: 'ACTIVE',
          total_messages: 0,
        },
      });

      this.logger.log(colors.green(`✅ Conversation created: ${conversation.id}`));

      return {
        id: conversation.id,
        title: conversation.title || 'New Conversation',
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
      this.logger.log(colors.blue(`💬 Processing message from user: ${user.id}`));

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
          user_id: user.id,
          school_id: user.school_id,
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
      const aiResponse = await this.generateAIResponse(
        sendMessageDto.message,
        contextChunks,
        (conversation as any).system_prompt || 'You are a helpful AI assistant.',
        (conversation as any).material_id ? await this.getConversationHistory(conversation.id, 10) : []
      );

      // Save AI message
      const aiMessage = await this.prisma.chatMessage.create({
        data: {
          conversation_id: conversation.id,
          user_id: user.id,
          school_id: user.school_id,
          material_id: sendMessageDto.materialId || null,
          role: 'ASSISTANT',
          content: aiResponse.content,
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
          total_messages: (conversation as any).total_messages + 2, // User + AI message
          last_activity: new Date(),
        },
      });

      // Save context relationships
      if (contextChunks.length > 0) {
        await this.saveContextRelationships(aiMessage.id, contextChunks, conversation.id);
      }

      const responseTime = Date.now() - startTime;
      this.logger.log(colors.green(`✅ Message processed in ${responseTime}ms`));

      return {
        id: aiMessage.id,
        content: aiMessage.content,
        role: aiMessage.role,
        conversationId: aiMessage.conversation_id,
        materialId: aiMessage.material_id,
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
  ): Promise<ChatMessageResponseDto[]> {
    try {
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          conversation_id: conversationId,
          user_id: user.id,
        },
        orderBy: { createdAt: 'asc' },
        take: getChatHistoryDto.limit,
        skip: getChatHistoryDto.offset,
      });

      return messages.map(message => ({
        id: message.id,
        content: message.content,
        role: message.role,
        conversationId: message.conversation_id,
        materialId: message.material_id,
        tokensUsed: message.tokens_used,
        responseTimeMs: message.response_time_ms,
        createdAt: message.createdAt.toISOString(),
      }));

    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting chat history: ${error.message}`));
      throw new Error(`Failed to get chat history: ${error.message}`);
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(user: User): Promise<ConversationResponseDto[]> {
    try {
      const conversations = await this.prisma.chatConversation.findMany({
        where: {
          user_id: user.id,
        },
        orderBy: { last_activity: 'desc' },
        take: 50,
      });

      return conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.title,
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
    if (conversationId) {
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          user_id: user.id,
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
   * Generate AI response using OpenAI
   */
  private async generateAIResponse(
    userMessage: string,
    contextChunks: any[],
    systemPrompt: string,
    conversationHistory: any[]
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

      const messages = [
        { role: 'system', content: systemPrompt + context },
        ...(history ? [{ role: 'user', content: `Previous conversation:\n${history}` }] : []),
        { role: 'user', content: userMessage },
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages as any,
        max_tokens: 1000,
        temperature: 0.7,
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
  private async getConversationHistory(conversationId: string, limit: number) {
    const messages = await this.prisma.chatMessage.findMany({
      where: { conversation_id: conversationId },
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
   * Save context relationships
   */
  private async saveContextRelationships(
    messageId: string,
    contextChunks: any[],
    conversationId: string
  ) {
    try {
      const contextData = contextChunks.map((chunk, index) => ({
        conversation_id: conversationId,
        message_id: messageId,
        chunk_id: chunk.id,
        school_id: contextChunks[0]?.school_id || '',
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
