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
      const userId = user.id || (user as any).sub;
      
      if (!userId) {
        throw new Error('User ID not found');
      }

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
   * Get chat history by material ID and user ID
   */
  async getChatHistory(
    user: User,
    materialId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    try {
      const userId = user.id || (user as any).sub;
      
      if (!userId) {
        this.logger.error(colors.red(`❌ User ID not found for user: ${user.id || (user as any).sub}`));
        throw new Error('User ID not found');
      }

      if (!materialId) {
        this.logger.error(colors.red(`❌ Material ID is required`));
        throw new Error('Material ID is required');
      }

      // Validate that the material exists in PDFMaterial table
      const material = await this.prisma.pDFMaterial.findUnique({
        where: { id: materialId },
        select: { id: true, title: true, status: true },
      });

      if (!material) {
        this.logger.error(colors.red(`❌ Material not found: ${materialId}`));
        throw new Error(`Material not found: ${materialId}`);
      }

      if (material.status !== 'published') {
        this.logger.warn(colors.yellow(`⚠️ Material is not published: ${materialId}, status: ${material.status}`));
      }

      const parsedLimit = parseInt(limit.toString());
      const parsedOffset = parseInt(offset.toString());

      this.logger.log(colors.cyan(`📖 Loading chat history by material - Material: ${materialId} (${material.title}), User: ${userId}, Limit: ${parsedLimit}, Offset: ${parsedOffset}`));

      // Get chat history by material_id and user_id
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          material_id: materialId,
          user_id: userId,
        },
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset,
      });

      this.logger.log(
        colors.green(`✅ Chat history loaded: ${messages.length} messages found for material ${materialId}`)
      );

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
      const schoolId = user.school_id || (user as any).school_id;
      const usageLimits = await this.getUserUsageLimits(userId, schoolId, user.role);
      this.logger.log(colors.green(`✅ Conversation history retrieved: ${JSON.stringify(conversationHistory, null, 2)}`));
      return {
        conversationHistory,
        usageLimits,
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting chat history: ${error.message}`));
      throw new Error(`Failed to get chat history: ${error.message}`);
    }
  }

  /**
   * Get user's usage limits (merged with subscription plan limits)
   */
  private async getUserUsageLimits(
    userId: string,
    schoolId: string | null,
    userRole: string | null,
  ): Promise<any> {
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

      // Get school's subscription plan if schoolId exists
      let subscriptionPlan: Awaited<ReturnType<typeof this.prisma.platformSubscriptionPlan.findUnique>> = null;
      if (schoolId) {
        subscriptionPlan = await this.prisma.platformSubscriptionPlan.findUnique({
          where: { school_id: schoolId }
        });
      }

      // Determine max document uploads based on role and plan
      let maxDocumentUploadsPerDay: number;
      if (subscriptionPlan) {
        if (userRole === 'student') {
          maxDocumentUploadsPerDay = subscriptionPlan.max_document_uploads_per_student_per_day || 3;
        } else if (userRole === 'teacher') {
          maxDocumentUploadsPerDay = subscriptionPlan.max_document_uploads_per_teacher_per_day || 10;
        } else {
          maxDocumentUploadsPerDay = subscriptionPlan.max_document_uploads_per_teacher_per_day || 10;
        }
      } else {
        // Defaults if no plan
        maxDocumentUploadsPerDay = userRole === 'student' ? 3 : 10;
      }

      // Use plan limits where available, fallback to user model defaults
      const usageLimits = {
        filesUploadedThisMonth: user.filesUploadedThisMonth,
        totalFilesUploadedAllTime: user.totalFilesUploadedAllTime,
        totalStorageUsedMB: user.totalStorageUsedMB,
        maxFilesPerMonth: subscriptionPlan?.max_files_per_month ?? user.maxFilesPerMonth,
        maxFileSizeMB: subscriptionPlan?.max_file_size_mb ?? user.maxFileSizeMB,
        maxStorageMB: subscriptionPlan?.max_storage_mb ?? user.maxStorageMB,
        tokensUsedThisWeek: user.tokensUsedThisWeek,
        tokensUsedThisDay: user.tokensUsedThisDay,
        tokensUsedAllTime: user.tokensUsedAllTime,
        maxTokensPerWeek: subscriptionPlan?.max_weekly_tokens_per_user ?? user.maxTokensPerWeek,
        maxTokensPerDay: subscriptionPlan?.max_daily_tokens_per_user ?? user.maxTokensPerDay,
        maxDocumentUploadsPerDay: maxDocumentUploadsPerDay,
        lastFileResetDate: user.lastFileResetDate?.toISOString() || new Date().toISOString(),
        lastTokenResetDate: user.lastTokenResetDateAllTime?.toISOString() || new Date().toISOString(),
      };

      this.logger.log(colors.green(`✅ Retrieved usage limits for user (plan: ${subscriptionPlan?.plan_type || 'none'})`));
      return usageLimits;

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching usage limits: ${error.message}`));
      throw new Error(`Failed to fetch usage limits: ${error.message}`);
    }
  }

  /**
   * Get chat history by materialId (finds conversation automatically)
   */
  // async getChatHistoryByMaterial(
  //   user: User,
  //   materialId: string,
  //   limit: number = 50,
  //   offset: number = 0,
  // ) {
  //   try {
  //     return await this.chatService.getChatHistoryByMaterial(user, materialId, limit, offset);
  //   } catch (error) {
  //     this.logger.error(colors.red(`❌ Error getting chat history by material: ${error.message}`));
  //     throw error;
  //   }
  // }

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

