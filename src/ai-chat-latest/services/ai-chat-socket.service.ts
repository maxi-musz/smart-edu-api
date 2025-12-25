import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatService } from '../../school/ai-chat/services/chat.service';
import { User } from '@prisma/client';
import * as colors from 'colors';
import {
  SocketSendMessageDto,
  SocketMessageResponseDto,
  SocketConversationResponseDto,
  SocketErrorResponseDto,
  SocketSuccessResponseDto,
} from '../dto/socket-events.dto';

/**
 * Service for handling AI chat operations via Socket.IO
 * Wraps the existing ChatService to emit real-time events
 */
@Injectable()
export class AiChatSocketService {
  private readonly logger = new Logger(AiChatSocketService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  /**
   * Send a message and return the response
   * This will be used by the gateway to emit real-time updates
   */
  async sendMessage(
    user: User,
    sendMessageDto: SocketSendMessageDto,
  ): Promise<SocketMessageResponseDto> {
    try {
      this.logger.log(colors.cyan(`💬 Processing socket message from user: ${user.id || (user as any).sub}`));

      // Use the existing chat service to handle the message
      const response = await this.chatService.sendMessage(user, {
        message: sendMessageDto.message,
        materialId: sendMessageDto.materialId,
        conversationId: sendMessageDto.conversationId,
      });

      return {
        id: response.id,
        content: response.content,
        role: response.role,
        conversationId: response.conversationId,
        materialId: response.materialId,
        chatTitle: response.chatTitle,
        contextChunks: response.contextChunks,
        tokensUsed: response.tokensUsed,
        responseTimeMs: response.responseTimeMs,
        createdAt: response.createdAt,
        usageLimits: response.usageLimits,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error processing socket message: ${error.message}`));
      throw error;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    user: User,
    createConversationDto: { title?: string; materialId?: string },
  ): Promise<SocketConversationResponseDto> {
    try {
      this.logger.log(colors.cyan(`💬 Creating conversation via socket for user: ${user.id || (user as any).sub}`));

      const response = await this.chatService.createConversation(user, {
        title: createConversationDto.title,
        materialId: createConversationDto.materialId,
      });

      return {
        id: response.id,
        title: response.title,
        chatTitle: response.chatTitle,
        status: response.status,
        materialId: response.materialId,
        totalMessages: response.totalMessages,
        lastActivity: response.lastActivity,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating conversation: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get user's conversations
   */
  async getUserConversations(user: User): Promise<SocketConversationResponseDto[]> {
    try {
      const conversations = await this.chatService.getUserConversations(user);
      return conversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        chatTitle: conv.chatTitle,
        status: conv.status,
        materialId: conv.materialId,
        totalMessages: conv.totalMessages,
        lastActivity: conv.lastActivity,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting conversations: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get chat history for a conversation
   */
  async getChatHistory(
    user: User,
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    try {
      return await this.chatService.getChatHistory(user, conversationId, { limit, offset });
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting chat history: ${error.message}`));
      throw error;
    }
  }

  /**
   * Convert user payload to User object
   */
  convertPayloadToUser(payload: any): User {
    return {
      id: payload.sub,
      email: payload.email,
      school_id: payload.school_id,
      role: payload.role,
    } as User;
  }
}

