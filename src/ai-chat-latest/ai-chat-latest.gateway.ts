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
import { DocumentProcessingService } from '../school/ai-chat/services/document-processing.service';
import {
  SocketSendMessageDto,
  SocketCreateConversationDto,
  SocketErrorResponseDto,
  SocketSuccessResponseDto,
  SocketMessageResponseDto,
} from './dto/socket-events.dto';
import OpenAI from 'openai';
import { User } from '@prisma/client';
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
  private readonly openai: OpenAI;

  private readonly MATERIAL_SYSTEM_PROMPT = `
  You are a professional teacher and subject‑matter expert. You teach with absolute confidence and authority.

  Your job is to teach using the uploaded material as your primary source. You KNOW the content because you have direct access to it. Answer questions with certainty and authority.

  Communication style:
  - Be direct, confident, and authoritative. NEVER hedge or use uncertain language.
  - STRICTLY FORBIDDEN phrases: "it looks like", "it seems", "appears", "might", "I think", "I believe", "likely", "probably", "perhaps", "maybe", "could be", "might be", "seems to be", "looks like", "appears to be".
  - Use definitive statements: "This is...", "The chapter covers...", "This material explains...", "You will learn...".
  - Prefer imperative teacher language: "This chapter teaches...", "The material states...", "You need to understand...".
  - Start answers directly with facts, not disclaimers.
  - Keep answers concise but complete. Use bullets or short steps when helpful.
  - When a calculation or method is requested, show the minimal steps needed, then the result.
  - Use professional emojis appropriately to enhance clarity and engagement: 📚 for materials/chapters, 💡 for insights/tips, ✅ for confirmations, ⚠️ for warnings, 📝 for notes, 🔍 for analysis, 🎯 for key points, 📊 for data/stats, ⚡ for important concepts, 🚀 for next steps. Use emojis naturally and sparingly - 1-3 per response maximum.

  Grounding rules:
  - For content questions: State facts directly from the material. Use "The material states...", "According to this chapter...", "This chapter covers...".
  - For improvement/analysis questions: Provide confident professional guidance based on the material's structure and content.
  - For completely unrelated topics: Say "This question is outside the scope of this material" and redirect to the material.

  Behavior:
  - Act as a confident mentor. You KNOW the material, so teach it with authority.
  - If the student's question is vague, ask one concise clarifying question before proceeding.
  - Keep responses within 3–8 sentences unless the user explicitly requests more detail or steps.
  - Always start with what you KNOW from the material, not what you think or guess.

  Tone examples:
  - Good: "This chapter covers web development and AI integration in a 3-week intensive course. The program spans 21 days, requiring 4 to 6 hours daily commitment. It's designed for motivated beginners to intermediate developers."
  - Good: "This is a Level 1 workbook on number sense and basic algebra. Start with page 12: practice counting in tens; then attempt Exercise B. Use a number line to visualize jumps of ten."
  - FORBIDDEN: "It looks like you're referring to...", "It seems this chapter is about...", "This appears to be..."
`;

  private readonly GENERAL_SYSTEM_PROMPT = `
  You are a helpful AI assistant for educational purposes.
  You help school owners, teachers, and students with general questions and educational topics.
  Answer questions clearly and provide helpful explanations.
  Be encouraging and supportive in your responses.
  Keep your answers concise but complete when the user asks for specific amounts or detailed information.
  Use professional emojis appropriately to enhance clarity and engagement: 💡 for insights, ✅ for confirmations, ⚠️ for warnings, 📝 for notes, 🔍 for analysis, 🎯 for key points, 📊 for data, ⚡ for important concepts, 🚀 for next steps. Use emojis naturally and sparingly - 1-3 per response maximum.
  Note: If asked about very recent events (after October 2023), mention that your knowledge may be limited and suggest checking the latest sources.
`;

  constructor(
    private readonly aiChatSocketService: AiChatSocketService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly socketJwtGuard: SocketJwtGuard,
    private readonly prisma: PrismaService,
    private readonly documentProcessingService: DocumentProcessingService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

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
    const startTime = Date.now();
    
    try {
      const user = client.data.user;
      let userObj = this.getUserWithSchoolId(client);

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

      // Extract user data
      const userId = userObj.id || (userObj as any).sub;
      const schoolId = userObj.school_id || (userObj as any).school_id;

      if (!userId) {
        this.logger.error(colors.red(`❌ User ID not found for user: ${user.email}`));
        throw new Error('User ID not found');
      }

      // Check if user is a library platform owner (has platform_id instead of school_id)
      let finalSchoolId = schoolId;
     
      const frontendMaterialId = data.materialId;

      if (!frontendMaterialId) {
        this.logger.error(colors.red(`❌ Material ID is required but not provided`));
        throw new Error('Material ID is required');
      }

      this.logger.log(colors.cyan(`✅ Frontend Material ID: ${frontendMaterialId}`));

      // Check if this is a LibraryGeneralMaterialChapterFile or PDFMaterial
      // frontendMaterialId is a chapter ID, so we find chapter files belonging to that chapter
      const existingMaterial = await this.prisma.libraryGeneralMaterialChapterFile.findFirst({
        where: { chapterId: frontendMaterialId },
        select: { 
          id: true, 
          platformId: true,
          chapter: {
            select: {
              id: true,
              materialId: true, // This is the LibraryGeneralMaterial.id we need for Pinecone
            }
          }
        },
      });

      let materialIdForPineconeSearch: string | null = null;

      if (existingMaterial) {
        this.logger.log(colors.cyan(`📚 Detected LibraryGeneralMaterialChapterFile for chapter: ${frontendMaterialId}`));
        // Chunks are stored in Pinecone with material_id = LibraryGeneralMaterial.id
        // So we need to use the chapter's materialId for Pinecone search
        materialIdForPineconeSearch = existingMaterial.chapter.materialId;
        this.logger.log(colors.cyan(`📚 Using LibraryGeneralMaterial ID for Pinecone search: ${materialIdForPineconeSearch}`));
      } else {
        // Check if it's a PDFMaterial
        const pdfMaterial = await this.prisma.pDFMaterial.findUnique({
          where: { id: frontendMaterialId },
          select: { id: true },
        });
        
        if (pdfMaterial) {
          this.logger.log(colors.cyan(`📄 Detected PDFMaterial: ${frontendMaterialId}`));
          materialIdForPineconeSearch = frontendMaterialId;
        } else {
          this.logger.warn(colors.yellow(`⚠️ Material ID ${frontendMaterialId} not found in LibraryGeneralMaterialChapterFile or PDFMaterial tables`));
          throw new Error(`Material with ID ${frontendMaterialId} not found`);
        }
      }

      // Get or create conversation based on material type
      let conversation: any;
      if (existingMaterial) {
        conversation = await this.getOrCreateConversation(
          userObj,
          data.conversationId,
          frontendMaterialId
        );
      } else {
        conversation = await this.getOrCreateConversation(
          userObj,
          data.conversationId,
          frontendMaterialId
        );
      }

      // Save user message with error handling
      // Use conversation.material_id which is the validated PDFMaterial.id
      // (conversation.material_id is null if no material or if material validation failed)
      const validatedMaterialId = conversation.material_id;
      
      let userMessage: any;
      this.logger.log("Saving user message to database");
      try {
        userMessage = await this.prisma.chatMessage.create({
          data: {
            conversation_id: conversation.id,
            user_id: userId,
            school_id: finalSchoolId,
            material_id: validatedMaterialId,
            role: 'USER',
            content: data.message,
            message_type: 'TEXT',
          },
        });
        this.logger.log(colors.green(`✅ User message saved: ${userMessage.id}`));
      } catch (error) {
        this.logger.error(colors.red(`❌ Failed to save user message to database: ${error.message}`));
        throw new Error(`Failed to save message: ${error.message}`);
      }

      // Get relevant context chunks if material is specified
      // For chapter files: chunks are stored with material_id = LibraryGeneralMaterial.id
      // For PDFMaterials: chunks are stored with material_id = PDFMaterial.id
      let contextChunks: any[] = [];
      
      if (materialIdForPineconeSearch) {
        try {
          contextChunks = await this.documentProcessingService.searchRelevantChunks(
            materialIdForPineconeSearch,
            data.message,
            5
          );
          
          if (contextChunks.length > 0) {
            this.logger.log(colors.green(`✅ Found ${contextChunks.length} relevant chunks from material`));
          } else {
            this.logger.log(colors.yellow(`⚠️ No chunks found for material: ${materialIdForPineconeSearch}`));
          }
        } catch (error) {
          this.logger.warn(colors.yellow(`⚠️ Could not search chunks: ${error.message}`));
          contextChunks = [];
        }
      }

      // Generate AI response
      const systemPrompt = (conversation as any).material_id ? this.MATERIAL_SYSTEM_PROMPT : this.GENERAL_SYSTEM_PROMPT;
      const aiResponse = await this.generateAIResponse(
        data.message,
        contextChunks,
        systemPrompt,
        (conversation as any).material_id ? await this.getConversationHistory(conversation.id, 50, userId) : [],
        Boolean((conversation as any).material_id)
      );

      // Generate chat title for new conversations (first message)
      let chatTitle: string | null = null;
      const isNewConversation = ((conversation as any).total_messages === 0 || (conversation as any).total_messages === undefined) && 
                                (!conversation.title || conversation.title === 'New Conversation' || conversation.title === 'General Chat');
      
      if (isNewConversation) {
        this.logger.log(colors.cyan(`📝 Generating chat title for first message`));
        chatTitle = await this.generateChatTitle(data.message);
        
        await this.prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { title: chatTitle }
        });
        this.logger.log(colors.green(`✅ Updated conversation title to: "${chatTitle}"`));
      }

      // Save AI message with error handling
      const refinedContent = this.refineTone(aiResponse.content);

      let aiMessage;
      try {
        aiMessage = await this.prisma.chatMessage.create({
          data: {
            conversation_id: conversation.id,
            user_id: userId,
            school_id: finalSchoolId,
            material_id: validatedMaterialId,
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
        this.logger.log(colors.green(`✅ AI message saved: ${aiMessage.id}`));
      } catch (error) {
        this.logger.error(colors.red(`❌ Failed to save AI message to database: ${error.message}`));
        throw new Error(`Failed to save AI response: ${error.message}`);
      }

      // Update conversation with error handling
      try {
        await this.prisma.chatConversation.update({
          where: { id: conversation.id },
          data: {
            total_messages: ((conversation as any).total_messages || 0) + 2,
            last_activity: new Date(),
          },
        });
        this.logger.log(colors.green(`✅ Conversation updated`));
      } catch (error) {
        this.logger.error(colors.red(`❌ Failed to update conversation: ${error.message}`));
        // Don't throw - conversation update failure shouldn't block response
      }

      // Update user token usage with error handling
      try {
        await this.updateUserTokenUsage(userId, aiResponse.tokensUsed);
      } catch (error) {
        this.logger.error(colors.red(`❌ Failed to update token usage: ${error.message}`));
        // Don't throw - token update failure shouldn't block response
      }

      // Save context relationships with error handling
      if (contextChunks.length > 0) {
        try {
          await this.saveContextRelationships(aiMessage.id, contextChunks, conversation.id, finalSchoolId);
        } catch (error) {
          this.logger.error(colors.red(`❌ Failed to save context relationships: ${error.message}`));
          // Don't throw - context save failure shouldn't block response
        }
      }

      // Get usage limits
      const userData = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      const subscriptionPlan = await this.prisma.platformSubscriptionPlan.findUnique({
        where: { school_id: finalSchoolId }
      });

      const usageLimits = await this.getUserUsageLimits(userId, finalSchoolId, userData?.role || 'student', subscriptionPlan);

      const response: SocketMessageResponseDto = {
        id: aiMessage.id,
        content: aiMessage.content,
        role: aiMessage.role,
        conversationId: aiMessage.conversation_id || '',
        materialId: aiMessage.material_id,
        chatTitle: chatTitle,
        contextChunks: contextChunks.map((chunk: any) => ({
          id: chunk.id,
          content: chunk.content.substring(0, 200) + '...',
          similarity: chunk.similarity,
          chunkType: chunk.chunk_type,
        })),
        tokensUsed: aiMessage.tokens_used,
        responseTimeMs: aiMessage.response_time_ms,
        createdAt: aiMessage.createdAt.toISOString(),
        usageLimits: usageLimits,
      };

      // Emit user message (echo back)
      client.emit('message:user', {
        success: true,
        message: 'Your message',
        data: {
          id: userMessage.id,
          content: data.message,
          role: 'USER',
          conversationId: response.conversationId,
          materialId: data.materialId,
          createdAt: userMessage.createdAt.toISOString(),
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
      if (chatTitle) {
        client.emit('conversation:title-updated', {
          success: true,
          message: 'Conversation title updated',
          data: {
            conversationId: response.conversationId,
            title: chatTitle,
          },
          event: 'conversation:title-updated',
        } as SocketSuccessResponseDto);
      }

      const responseTime = Date.now() - startTime;
      this.logger.log(colors.green(`✅ Message processed in ${responseTime}ms`));

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
    @MessageBody() data: { materialId: string; limit?: number; offset?: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = client.data.user;
      const userObj = await this.getUserWithSchoolId(client);

      this.logger.log(
        colors.blue(`📖 Loading chat history via socket - Material: ${data.materialId}, User: ${user?.email || 'unknown'}`)
      );

      const userId = userObj.id || (userObj as any).sub;

      if (!userId) {
        this.logger.error(colors.red(`❌ User ID not found for user: ${user?.email}`));
        throw new Error('User ID not found');
      }

      if (!data.materialId) {
        this.logger.error(colors.red(`❌ Material ID is required`));
        throw new Error('Material ID is required');
      }

      // Validate that the material exists in PDFMaterial table
      let material = await this.prisma.pDFMaterial.findUnique({
        where: { id: data.materialId },
        select: { id: true, title: true, status: true },
      });

      // it can also be a library material
      const libraryMaterialChapter = await this.prisma.libraryGeneralMaterialChapter.findUnique({
        where: { id: data.materialId },
        select: { id: true, title: true },
      });

      if (libraryMaterialChapter) {
        material = {
          id: libraryMaterialChapter.id,
          title: libraryMaterialChapter.title,
          status: 'published',
        };
      }

      if (!material || !libraryMaterialChapter) {
        this.logger.error(colors.red(`❌ Material not found: ${data.materialId}`));
        throw new Error(`Material not found: ${data.materialId}`);
      }

      if (material && material.status !== 'published') {
        this.logger.warn(colors.yellow(`⚠️ Material is not published: ${data.materialId}, status: ${material.status}`));
      }

      const parsedLimit = parseInt((data.limit || 50).toString());
      const parsedOffset = parseInt((data.offset || 0).toString());

      this.logger.log(colors.cyan(`📖 Loading chat history by material - Material: ${data.materialId} (${material.title}), User: ${userId}, Limit: ${parsedLimit}, Offset: ${parsedOffset}`));

      // Get chat history by material_id and user_id
      const messages = await this.prisma.chatMessage.findMany({
        where: {
          material_id: data.materialId,
          user_id: userId,
        },
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset,
      });

      this.logger.log(
        colors.green(`✅ Chat history loaded: ${messages.length} messages found for material ${data.materialId}`)
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
      // if (!schoolId) {
      //   this.logger.error(colors.red(`❌ School ID not found for user: ${user?.email}`));
      //   throw new Error('School ID not found');
      // }

      const userData = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      const history = {
        conversationHistory,
        // usageLimits,
      };

      this.logger.log(
        colors.green(`✅ Chat history sent via socket - ${history.conversationHistory.length} messages loaded`)
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

  /**
   * Get or create conversation
   */
  private async getOrCreateConversation(
    user: User,
    conversationId?: string,
    materialId?: string
  ) {
    const userId = user.id || (user as any).sub;
    const schoolId = user.school_id || (user as any).school_id;

    if (!userId || !schoolId) {
      throw new Error('User ID or School ID not found');
    }
    
    if (conversationId) {
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          user_id: userId,
        },
      });

      if (conversation) {
        this.logger.log(colors.green(`✅ Conversation found: ${conversation.id}`));
        return conversation;
      }
    }

    // Validate material_id if provided
    let validatedMaterialId: string | null = null;
    
    if (materialId) {
      try {
        // First, check if materialId is a PDFMaterial
        const pdfMaterial = await this.prisma.pDFMaterial.findUnique({
          where: { id: materialId },
          select: { id: true, schoolId: true },
        });
        
        if (pdfMaterial) {
          // If it's a school-specific PDFMaterial, verify it belongs to the user's school
          if (pdfMaterial.schoolId && pdfMaterial.schoolId !== schoolId) {
            this.logger.warn(colors.yellow(`⚠️ PDF Material ${materialId} does not belong to school ${schoolId}`));
            validatedMaterialId = null;
          } else {
            validatedMaterialId = pdfMaterial.id;
            this.logger.log(colors.green(`✅ PDF Material validated: ${validatedMaterialId}`));
          }
        } else {
          // Check if it's a LibraryGeneralMaterialChapterFile
          // When a chapter file is created, a PDFMaterial is created with materialId = chapterFile.id
          // So we need to find the PDFMaterial that references this chapter file
          const pdfMaterialForChapterFile = await this.prisma.pDFMaterial.findFirst({
            where: { materialId: materialId },
            select: { id: true },
          });
          
          if (pdfMaterialForChapterFile) {
            validatedMaterialId = pdfMaterialForChapterFile.id;
            this.logger.log(colors.green(`✅ PDF Material found for chapter file ${materialId}: ${validatedMaterialId}`));
          } else {
            // Verify it's actually a chapter file
            const libraryMaterialChapterFile = await this.prisma.libraryGeneralMaterialChapterFile.findUnique({
              where: { id: materialId },
              select: { id: true, title: true },
            });
            
            if (libraryMaterialChapterFile) {
              this.logger.warn(colors.yellow(`⚠️ Chapter file ${materialId} found but no corresponding PDFMaterial exists`));
              validatedMaterialId = null;
            } else {
              this.logger.warn(colors.yellow(`⚠️ Material ${materialId} not found in PDFMaterial or LibraryGeneralMaterialChapterFile`));
              validatedMaterialId = null;
            }
          }
        }
      } catch (error) {
        this.logger.warn(colors.yellow(`⚠️ Error validating material: ${error.message}, using general chat`));
        validatedMaterialId = null;
      }
    }

    // Create new conversation
    this.logger.log(colors.green(`✅ Creating new conversation for material: ${validatedMaterialId || 'general chat'}`));
    const conversation = await this.prisma.chatConversation.create({
      data: {
        user_id: userId,
        school_id: schoolId,
        material_id: validatedMaterialId,
        title: validatedMaterialId ? 'Document Chat' : 'General Chat',
        system_prompt: validatedMaterialId ? this.MATERIAL_SYSTEM_PROMPT : this.GENERAL_SYSTEM_PROMPT,
        status: 'ACTIVE',
        total_messages: 0,
      },
    });

    this.logger.log(colors.green(`✅ Conversation created: ${conversation.id}`));

    return conversation;
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

      const messages = [
        { role: 'system', content: systemPrompt + context },
        ...(history ? [{ role: 'user', content: `Previous conversation:\n${history}` }] : []),
        { role: 'user', content: userMessage },
      ];

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
        this.logger.error(colors.red(`❌ User not found for token update: ${userId}`));
        return;
      }

      const shouldResetDaily = user.lastTokenResetDateAllTime < startOfDay;
      const shouldResetWeekly = user.lastTokenResetDateAllTime < startOfWeek;

      const newDailyTokens = shouldResetDaily ? tokensUsed : (user.tokensUsedThisDay || 0) + tokensUsed;
      const newWeeklyTokens = shouldResetWeekly ? tokensUsed : (user.tokensUsedThisWeek || 0) + tokensUsed;
      const newAllTimeTokens = (user.tokensUsedAllTime || 0) + tokensUsed;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          tokensUsedThisDay: newDailyTokens,
          tokensUsedThisWeek: newWeeklyTokens,
          tokensUsedAllTime: newAllTimeTokens,
          lastTokenResetDateAllTime: today,
        }
      });

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

    let refined = text;

    const hedges = [
      /\bit looks like\s+/gi,
      /\bit seems like\s+/gi,
      /\bit appears that\s+/gi,
      /\bit seems that\s+/gi,
      /\bthis (document|workbook|chapter|material) (appears to|seems to|might be)\s+/gi,
      /\b(it|this) (appears|seems|might|likely)\s+/gi,
      /\bI (think|believe)\s+/gi,
      /\bprobably\s+/gi,
      /\bperhaps\s+/gi,
      /\bmaybe\s+/gi,
      /\bcould be\s+/gi,
      /\bmight be\s+/gi,
    ];
    
    for (const h of hedges) {
      refined = refined.replace(h, '');
    }

    refined = refined.replace(/^\s*(it looks like|it seems like|it appears that|it seems that)\s+/i, '');
    refined = refined.replace(/^\s*the (document|workbook|chapter|material) you provided\s+(is|appears to be|seems to be)\s*/iu, 'This material ');
    refined = refined.replace(/^\s*the (document|workbook|chapter|material)\s+(appears|seems)\s+to\s+be\s*/iu, 'This material is ');
    refined = refined.replace(/\b(you're referring to|you are referring to)\s+a\s+/gi, 'This ');
    refined = refined.replace(/\bbased on the context provided\s*[,:]\s*/gi, '');
    refined = refined.replace(/^\.\s*/, '');
    refined = refined.replace(/^\s*,\s*/, '');
    
    if (refined.length > 0 && refined[0] === refined[0].toLowerCase()) {
      refined = refined.charAt(0).toUpperCase() + refined.slice(1);
    }

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
      // Verify chunks exist in DocumentChunk table before saving relationships
      // This prevents foreign key constraint violations for library material chunks
      const validChunks: any[] = [];
      
      for (const chunk of contextChunks) {
        try {
          const dbChunk = await this.prisma.documentChunk.findUnique({
            where: { id: chunk.id },
            select: { id: true },
          });
          
          if (dbChunk) {
            validChunks.push(chunk);
          } else {
            this.logger.warn(colors.yellow(`⚠️ Chunk ${chunk.id} not found in DocumentChunk table, skipping context relationship`));
          }
        } catch (error) {
          this.logger.warn(colors.yellow(`⚠️ Error checking chunk ${chunk.id}: ${error.message}`));
        }
      }

      if (validChunks.length === 0) {
        this.logger.warn(colors.yellow(`⚠️ No valid chunks found to save context relationships`));
        return;
      }

      const contextData = validChunks.map((chunk, index) => ({
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

      this.logger.log(colors.green(`✅ Saved ${validChunks.length} context relationships`));

    } catch (error) {
      this.logger.error(colors.red(`❌ Error saving context relationships: ${error.message}`));
    }
  }

  /**
   * Get user's usage limits (merged with subscription plan limits)
   */
  private async getUserUsageLimits(
    userId: string,
    schoolId: string,
    userRole: string,
    subscriptionPlan: any
  ): Promise<any> {
    try {
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
        throw new Error('User not found');
      }

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
        maxDocumentUploadsPerDay = userRole === 'student' ? 3 : 10;
      }

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

      return usageLimits;

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching usage limits: ${error.message}`));
      throw new Error(`Failed to fetch usage limits: ${error.message}`);
    }
  }
}

