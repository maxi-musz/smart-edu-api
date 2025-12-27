import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SocketJwtGuard } from './guards/socket-jwt.guard';
import { AiChatSocketService } from './services/ai-chat-socket.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  SocketSendMessageDto,
  SocketCreateConversationDto,
  SocketErrorResponseDto,
  SocketSuccessResponseDto,
} from './dto/socket-events.dto';
import * as colors from 'colors';

/**
 * Socket.IO Gateway for AI Chat Latest
 * Handles real-time communication for AI chat functionality
 */
@WebSocketGateway({
  namespace: '/ai-chat-latest',
  cors: {
    origin: (origin, callback) => {
      // Allow all origins for now - configure based on your CORS settings
      // You can use the same logic as in main.ts
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  transports: ['websocket', 'polling'],
})
export class AiChatLatestGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AiChatLatestGateway.name);

  constructor(
    private readonly aiChatSocketService: AiChatSocketService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly socketJwtGuard: SocketJwtGuard,
    private readonly prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log(colors.green('✅ AI Chat Latest Gateway initialized'));
  }

  async handleConnection(client: Socket) {
    try {
      // Authenticate the connection
      const context = {
        switchToWs: () => ({
          getClient: () => client,
        }),
      } as ExecutionContext;

      const canActivate = await this.socketJwtGuard.canActivate(context);
      if (!canActivate) {
        throw new Error('Authentication failed');
      }

      // User is now authenticated
      const user = client.data.user;
      const userId = client.data.userId;
      
      // Handle school_id - fetch from DB or use default for library users
      let schoolId = client.data.schoolId;
      if (!schoolId) {
        // Check if this is a library user (has platform_id instead of school_id)
        if (user.platform_id) {
          // Library user - get or create default "Library Chat" school
          try {
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
            schoolId = librarySchool.id;
            client.data.schoolId = schoolId;
            this.logger.log(colors.cyan(`   Library user - using default Library Chat school: ${schoolId}`));
          } catch (error) {
            this.logger.error(colors.red(`   Failed to get/create library school: ${error.message}`));
            throw new Error('Failed to initialize library chat school');
          }
        } else {
          // Regular user - fetch school_id from database
          try {
            const userRecord = await this.prisma.user.findUnique({
              where: { id: userId },
              select: { school_id: true },
            });
            schoolId = userRecord?.school_id || null;
            if (schoolId) {
              client.data.schoolId = schoolId;
              this.logger.log(colors.cyan(`   Fetched school_id from database: ${schoolId}`));
            } else {
              this.logger.warn(colors.yellow(`   User has no school_id in database`));
            }
          } catch (error) {
            this.logger.warn(colors.yellow(`   Could not fetch school_id from database: ${error.message}`));
          }
        }
      }
      
      const userRole = user?.role || 'unknown';
      const userEmail = user?.email || 'unknown';
      const clientIp = client.handshake.address || client.request?.socket?.remoteAddress || 'unknown';
      const userAgent = client.handshake.headers['user-agent'] || 'unknown';
      
      // Safely get total clients count (for this namespace)
      // Note: current socket might not be in collection yet, so we add 1
      let totalClients = 0;
      try {
        const sockets = (this.server as any)?.sockets;
        totalClients = (sockets?.size || 0) + 1; // +1 for current connecting socket
      } catch (e) {
        totalClients = 1; // At least this socket
      }

      // Enhanced connection logging
      this.logger.log(
        colors.green('═══════════════════════════════════════════════════════════'),
      );
      this.logger.log(colors.green('🔌 NEW CLIENT CONNECTED'));
      // this.logger.log(colors.cyan(`   Socket ID: ${client.id}`));
      // this.logger.log(colors.cyan(`   User ID: ${userId}`));
      // this.logger.log(colors.cyan(`   Email: ${userEmail}`));
      // this.logger.log(colors.cyan(`   Role: ${userRole}`));
      // this.logger.log(colors.cyan(`   School ID: ${schoolId}`));
      // this.logger.log(colors.cyan(`   IP Address: ${clientIp}`));
      // this.logger.log(colors.cyan(`   User Agent: ${userAgent.substring(0, 80)}${userAgent.length > 80 ? '...' : ''}`));
      // this.logger.log(colors.cyan(`   Connected At: ${new Date().toISOString()}`));
      // this.logger.log(colors.cyan(`   Total Connected Clients: ${totalClients}`));
      // this.logger.log(
      //   colors.green('═══════════════════════════════════════════════════════════'),
      // );

      // Join user-specific room for targeted messaging
      await client.join(`user:${userId}`);

      // Emit connection success
      client.emit('connection:success', {
        success: true,
        message: 'Connected to AI Chat Latest',
        data: {
          userId,
          socketId: client.id,
          timestamp: new Date().toISOString(),
        },
        event: 'connection:success',
      } as SocketSuccessResponseDto);

      // Send user's conversations on connect (only if we have schoolId)
      if (schoolId) {
        try {
          // Attach schoolId to user payload before converting
          const userWithSchoolId = { ...user, school_id: schoolId };
          const userObj = this.aiChatSocketService.convertPayloadToUser(userWithSchoolId);
          const conversations = await this.aiChatSocketService.getUserConversations(userObj);
          
          client.emit('conversations:list', {
            success: true,
            message: 'Your conversations',
            data: conversations,
            event: 'conversations:list',
          } as SocketSuccessResponseDto);
        } catch (error) {
          // If getting conversations fails (e.g., library user not in User table), just send empty list
          this.logger.warn(colors.yellow(`   Could not fetch conversations: ${error.message}, sending empty list`));
          client.emit('conversations:list', {
            success: true,
            message: 'Your conversations',
            data: [],
            event: 'conversations:list',
          } as SocketSuccessResponseDto);
        }
      } else {
        // No schoolId, send empty conversations list
        client.emit('conversations:list', {
          success: true,
          message: 'Your conversations',
          data: [],
          event: 'conversations:list',
        } as SocketSuccessResponseDto);
      }
    } catch (error) {
      const clientIp = client.handshake.address || client.request?.socket?.remoteAddress || 'unknown';
      const userAgent = client.handshake.headers['user-agent'] || 'unknown';
      
      this.logger.log(
        colors.red('═══════════════════════════════════════════════════════════'),
      );
      this.logger.error(colors.red('❌ CONNECTION FAILED'));
      this.logger.error(colors.red(`   Socket ID: ${client.id}`));
      this.logger.error(colors.red(`   IP Address: ${clientIp}`));
      this.logger.error(colors.red(`   User Agent: ${userAgent.substring(0, 80)}${userAgent.length > 80 ? '...' : ''}`));
      this.logger.error(colors.red(`   Error: ${error.message}`));
      this.logger.error(colors.red(`   Failed At: ${new Date().toISOString()}`));
      if (error.stack) {
        this.logger.error(colors.red(`   Stack: ${error.stack.substring(0, 200)}...`));
      }
      this.logger.log(
        colors.red('═══════════════════════════════════════════════════════════'),
      );
      
      client.emit('connection:error', {
        success: false,
        message: 'Connection failed',
        error: error.message,
        event: 'connection:error',
      } as SocketErrorResponseDto);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId || 'unknown';
      const userEmail = client.data.user?.email || 'unknown';
      
      // Safely get total clients count - server.sockets might be undefined if disconnect happens during failed connection
      let totalClients = 0;
      try {
        totalClients = this.server?.sockets?.sockets?.size || 0;
      } catch (e) {
        // Server not fully initialized or socket not in collection yet
        totalClients = 0;
      }

      this.logger.log(
        colors.yellow('═══════════════════════════════════════════════════════════'),
      );
      this.logger.log(colors.yellow('🔌 CLIENT DISCONNECTED'));
      // this.logger.log(colors.yellow(`   Socket ID: ${client.id}`));
      // this.logger.log(colors.yellow(`   User ID: ${userId}`));
      // this.logger.log(colors.yellow(`   Email: ${userEmail}`));
      // this.logger.log(colors.yellow(`   Disconnected At: ${new Date().toISOString()}`));
      // this.logger.log(colors.yellow(`   Remaining Connected Clients: ${totalClients}`));
      // this.logger.log(
      //   colors.yellow('═══════════════════════════════════════════════════════════'),
      // );
    } catch (error) {
      // Log disconnect error but don't throw - disconnect is already happening
      this.logger.error(colors.red(`❌ Error logging disconnect: ${error.message}`));
    }
  }

  /**
   * Helper to get user object with school_id attached
   */
  private getUserWithSchoolId(client: Socket) {
    const user = client.data.user;
    const schoolId = client.data.schoolId;
    const userWithSchoolId = { ...user, school_id: schoolId };
    return this.aiChatSocketService.convertPayloadToUser(userWithSchoolId);
  }

  /**
   * Handle sending a message
   * Event: 'message:send'
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: SocketSendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      const userObj = this.getUserWithSchoolId(client);

      this.logger.log(
        colors.blue(`💬 Message received from ${user.email}: ${data.message.substring(0, 50)}...`),
      );

      // Emit typing indicator
      client.emit('message:typing', {
        success: true,
        message: 'AI is typing...',
        data: { isTyping: true },
        event: 'message:typing',
      } as SocketSuccessResponseDto);

      // Process message
      const response = await this.aiChatSocketService.sendMessage(userObj, data);

      // Emit user message (echo back)
      client.emit('message:user', {
        success: true,
        message: 'Your message',
        data: {
          id: `temp-${Date.now()}`,
          content: data.message,
          role: 'USER',
          conversationId: response.conversationId,
          materialId: data.materialId,
          createdAt: new Date().toISOString(),
        },
        event: 'message:user',
      } as SocketSuccessResponseDto);

      // Emit AI response
      client.emit('message:assistant', {
        success: true,
        message: 'AI response',
        data: response,
        event: 'message:assistant',
      } as SocketSuccessResponseDto);

      // Emit typing stopped
      client.emit('message:typing', {
        success: true,
        message: 'AI stopped typing',
        data: { isTyping: false },
        event: 'message:typing',
      } as SocketSuccessResponseDto);

      // If conversation title was generated, emit update
      if (response.chatTitle) {
        client.emit('conversation:title-updated', {
          success: true,
          message: 'Conversation title updated',
          data: {
            conversationId: response.conversationId,
            title: response.chatTitle,
          },
          event: 'conversation:title-updated',
        } as SocketSuccessResponseDto);
      }
    } catch (error) {
      this.logger.error(colors.red(`❌ Error handling message: ${error.message}`));
      client.emit('message:error', {
        success: false,
        message: 'Failed to process message',
        error: error.message,
        event: 'message:error',
      } as SocketErrorResponseDto);
    }
  }

  /**
   * Handle creating a new conversation
   * Event: 'conversation:create'
   */
  @SubscribeMessage('conversation:create')
  async handleCreateConversation(
    @MessageBody() data: SocketCreateConversationDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      const userObj = this.getUserWithSchoolId(client);

      this.logger.log(colors.blue(`💬 Creating conversation for ${user.email}`));

      const conversation = await this.aiChatSocketService.createConversation(userObj, data);

      client.emit('conversation:created', {
        success: true,
        message: 'Conversation created successfully',
        data: conversation,
        event: 'conversation:created',
      } as SocketSuccessResponseDto);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating conversation: ${error.message}`));
      client.emit('conversation:error', {
        success: false,
        message: 'Failed to create conversation',
        error: error.message,
        event: 'conversation:error',
      } as SocketErrorResponseDto);
    }
  }

  /**
   * Handle getting chat history
   * Event: 'conversation:history'
   */
  @SubscribeMessage('conversation:history')
  async handleGetChatHistory(
    @MessageBody() data: { conversationId: string; limit?: number; offset?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      const userObj = await this.getUserWithSchoolId(client);

      this.logger.log(
        colors.blue(`📖 Loading conversation history via socket - Conversation: ${data.conversationId}, User: ${user?.email || 'unknown'}`)
      );

      const history = await this.aiChatSocketService.getChatHistory(
        userObj,
        data.conversationId,
        data.limit || 50,
        data.offset || 0,
      );

      this.logger.log(
        colors.green(`✅ Conversation history sent via socket - ${history.conversationHistory.length} messages loaded`)
      );

      client.emit('conversation:history', {
        success: true,
        message: 'Chat history retrieved',
        data: history,
        event: 'conversation:history',
      } as SocketSuccessResponseDto);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting chat history: ${error.message}`));
      client.emit('conversation:error', {
        success: false,
        message: 'Failed to get chat history',
        error: error.message,
        event: 'conversation:error',
      } as SocketErrorResponseDto);
    }
  }

  /**
   * Handle getting chat history by materialId
   * Event: 'history:by-material'
   */
  // @SubscribeMessage('history:by-material')
  // async handleGetHistoryByMaterial(
  //   @MessageBody() data: { materialId: string; limit?: number; offset?: number },
  //   @ConnectedSocket() client: Socket,
  // ) {
  //   try {
  //     const user = client.data.user;
  //     const userObj = await this.getUserWithSchoolId(client);

  //     this.logger.log(
  //       colors.blue(`📖 Loading conversation history by material via socket - Material: ${data.materialId}, User: ${user?.email || 'unknown'}`)
  //     );

  //     const history = await this.aiChatSocketService.getChatHistoryByMaterial(
  //       userObj,
  //       data.materialId,
  //       data.limit || 50,
  //       data.offset || 0,
  //     );

  //     this.logger.log(
  //       colors.green(`✅ Conversation history by material sent via socket - ${history.conversationHistory.length} messages loaded (Total: ${history.totalMessages}, Has More: ${history.hasMore})`)
  //     );

  //     client.emit('history:by-material', {
  //       success: true,
  //       message: 'Chat history retrieved by material',
  //       data: history,
  //       event: 'history:by-material',
  //     } as SocketSuccessResponseDto);
  //   } catch (error) {
  //     this.logger.error(colors.red(`❌ Error getting chat history by material: ${error.message}`));
  //     client.emit('history:error', {
  //       success: false,
  //       message: 'Failed to retrieve chat history by material',
  //       error: error.message,
  //       event: 'history:error',
  //     } as SocketErrorResponseDto);
  //   }
  // }

  /**
   * Handle getting user conversations
   * Event: 'conversations:get'
   */
  @SubscribeMessage('conversations:get')
  async handleGetConversations(@ConnectedSocket() client: Socket) {
    try {
      const userObj = await this.getUserWithSchoolId(client);

      const conversations = await this.aiChatSocketService.getUserConversations(userObj);

      client.emit('conversations:list', {
        success: true,
        message: 'Conversations retrieved',
        data: conversations,
        event: 'conversations:list',
      } as SocketSuccessResponseDto);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting conversations: ${error.message}`));
      client.emit('conversations:error', {
        success: false,
        message: 'Failed to get conversations',
        error: error.message,
        event: 'conversations:error',
      } as SocketErrorResponseDto);
    }
  }
}

