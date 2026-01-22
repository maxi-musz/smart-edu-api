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
import {
  ExploreChatSendMessageDto,
  ExploreChatErrorResponseDto,
  ExploreChatSuccessResponseDto,
} from './socket-events.dto';
import { ChatService } from '../chat/chat.service';
import * as colors from 'colors';
import { ExploreChatSocketJwtGuard } from './socket-jwt.guard';

/**
 * Socket.IO Gateway for Explore Chat
 * Handles real-time communication for explore chat functionality
 */
@WebSocketGateway({
  namespace: '/explore-chat',
  cors: {
    origin: (origin, callback) => {
      // Allow all origins for now - configure based on your CORS settings
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
  },
  transports: ['websocket', 'polling'],
})
export class ExploreChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ExploreChatGateway.name);

  constructor(
    private readonly socketJwtGuard: ExploreChatSocketJwtGuard,
    private readonly chatService: ChatService,
  ) {}

  afterInit(server: Server) {
    this.logger.log(colors.green('✅ Explore Chat Gateway initialized'));
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

      // Join user-specific room for targeted messaging
      await client.join(`user:${userId}`);

      this.logger.log(colors.green(`🔌 NEW CLIENT CONNECTED - User: ${user.email || userId}`));

      // Emit connection success
      client.emit('connection:success', {
        success: true,
        message: 'Connected to Explore Chat',
        data: {
          userId,
          socketId: client.id,
          timestamp: new Date().toISOString(),
        },
        event: 'connection:success',
      } as ExploreChatSuccessResponseDto);
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
      this.logger.log(
        colors.red('═══════════════════════════════════════════════════════════'),
      );
      
      client.emit('connection:error', {
        success: false,
        message: 'Connection failed',
        error: error.message,
        event: 'connection:error',
      } as ExploreChatErrorResponseDto);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.data.userId || 'unknown';
      const userEmail = client.data.user?.email || 'unknown';
      
      // Safely get total clients count
      let totalClients = 0;
      try {
        totalClients = this.server?.sockets?.sockets?.size || 0;
      } catch (e) {
        totalClients = 0;
      }

      this.logger.log(colors.yellow(`🔌 CLIENT DISCONNECTED - User: ${userEmail || userId}`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error logging disconnect: ${error.message}`));
    }
  }

  /**
   * Handle sending a message
   * Event: 'message:send'
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: ExploreChatSendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      const userId = client.data.userId;

      // Log the full received payload
      this.logger.log(
        colors.cyan('═══════════════════════════════════════════════════════════'),
      );
      this.logger.log(colors.blue('💬 MESSAGE RECEIVED FROM FRONTEND'));
      this.logger.log(colors.cyan(`   User: ${user.email || userId}`));
      this.logger.log(colors.cyan(`   Socket ID: ${client.id}`));
      this.logger.log(colors.cyan(`   Received At: ${new Date().toISOString()}`));
      this.logger.log(colors.cyan('   Payload:'));
      this.logger.log(colors.cyan(`     - message: "${data.message}"`));
      this.logger.log(colors.cyan(`     - materialId (chapterId): "${data.materialId}"`));
      this.logger.log(colors.cyan(`     - userId: "${data.userId}"`));
      this.logger.log(colors.cyan(`     - language: "${data.language || 'en'}" (${data.language ? 'provided' : 'default'})`));
      this.logger.log(
        colors.cyan('═══════════════════════════════════════════════════════════'),
      );

      // Validate that the userId in the message matches the authenticated user
      if (data.userId !== userId) {
        this.logger.error(colors.red(`❌ User ID mismatch. Authenticated: ${userId}, Provided: ${data.userId}`));
        client.emit('message:error', {
          success: false,
          message: 'User ID mismatch',
          error: 'The provided userId does not match the authenticated user',
          event: 'message:error',
        } as ExploreChatErrorResponseDto);
        return;
      }

      // Emit typing indicator
      client.emit('message:typing', {
        success: true,
        message: 'AI is typing...',
        data: { isTyping: true },
        event: 'message:typing',
      } as ExploreChatSuccessResponseDto);

      // Use ChatService to process the message (handles material validation and returns markdown)
      const sendMessageDto = {
        message: data.message,
        materialId: data.materialId,
        language: data.language, // Language for OpenAI response
      };
      
      const result = await this.chatService.sendMessage(user, sendMessageDto);

      // Check if material was not found
      if (!result.success) {
        client.emit('message:error', {
          success: false,
          message: result.message,
          error: result.message,
          event: 'message:error',
        } as ExploreChatErrorResponseDto);

        // Stop typing indicator
        client.emit('message:typing', {
          success: true,
          message: 'AI finished typing',
          data: { isTyping: false },
          event: 'message:typing',
        } as ExploreChatSuccessResponseDto);
        return;
      }

      // Emit the response (response is already in markdown format from service)
      client.emit('message:response', {
        success: true,
        message: 'Message received and processed',
        data: {
          response: result.data.response, // Markdown formatted response
          userId: result.data.userId,
          materialId: result.data.materialId,
          materialTitle: result.data.materialTitle,
          timestamp: result.data.timestamp,
        },
        event: 'message:response',
      } as ExploreChatSuccessResponseDto);

      // Stop typing indicator
      client.emit('message:typing', {
        success: true,
        message: 'AI finished typing',
        data: { isTyping: false },
        event: 'message:typing',
      } as ExploreChatSuccessResponseDto);

      this.logger.log(colors.green(`✅ Message processed successfully for user: ${userId}`));
    } catch (error) {
      this.logger.error(colors.red(`❌ Error processing message: ${error.message}`));
      
      client.emit('message:error', {
        success: false,
        message: 'Failed to process message',
        error: error.message,
        event: 'message:error',
      } as ExploreChatErrorResponseDto);

      // Stop typing indicator on error
      client.emit('message:typing', {
        success: true,
        message: 'AI finished typing',
        data: { isTyping: false },
        event: 'message:typing',
      } as ExploreChatSuccessResponseDto);
    }
  }
}
