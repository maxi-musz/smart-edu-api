import { Controller, Post, Get, UseGuards, HttpCode, HttpStatus, Body, UseInterceptors, UploadedFiles, BadRequestException, Param, Sse, Logger, Query, Delete } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AiChatService, AiChatDeletionService } from './ai-chat.service';
import { UploadProgressService } from './upload-progress.service';
import { DocumentProcessingService, ChatService } from './services';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UploadDocumentDto, DocumentUploadResponseDto, UploadSessionDto, UploadProgressDto } from './dto';
import { SendMessageDto, ChatMessageResponseDto, CreateConversationDto, ConversationResponseDto, GetChatHistoryDto } from './dto/chat.dto';
import { InitiateAiChatDto, InitiateAiChatResponseDto } from './dto/initiate-ai-chat.dto';
import { 
  UploadDocumentDocs, 
  StartUploadDocs, 
  UploadProgressDocs, 
  UploadStatusDocs,
  ProcessDocumentDocs,
  ProcessingStatusDocs,
  DocumentChunksDocs,
  SearchChunksDocs,
  CreateConversationDocs,
  SendMessageDocs,
  InitiateAiChatDocs,
  GetUserConversationsDocs,
  GetChatHistoryDocs,
  DeleteConversationDocs
} from './api-docs';
import { Observable } from 'rxjs';
import * as colors from 'colors';

@ApiTags('AI Chat')
@Controller('ai-chat')
@UseGuards(JwtGuard)
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name);

  constructor(
    private readonly aiChatService: AiChatService,
    private readonly uploadProgressService: UploadProgressService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly chatService: ChatService,
    private readonly aiChatDeletionService: AiChatDeletionService,
  ) {}

  @Post('upload-document')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @UploadDocumentDocs.operation()
  @UploadDocumentDocs.consumes()
  @UploadDocumentDocs.body()
  @UploadDocumentDocs.responses.success()
  @UploadDocumentDocs.responses.badRequest()
  @UploadDocumentDocs.responses.unauthorized()
  @UploadDocumentDocs.responses.notFound()
  @UploadDocumentDocs.responses.tooLarge()
  async uploadDocument(
    @Body() uploadDto: UploadDocumentDto,
    @UploadedFiles() files: { document?: Express.Multer.File[] },
    @GetUser() user: User
  ) {
    return this.aiChatService.uploadDocument(uploadDto, files, user); 
  }

  @Post('start-upload')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBearerAuth('JWT-auth')
  @StartUploadDocs.operation()
  @StartUploadDocs.consumes()
  @StartUploadDocs.body()
  @StartUploadDocs.responses.success()
  @StartUploadDocs.responses.badRequest()
  @StartUploadDocs.responses.unauthorized()
  async startUpload(
    @Body() uploadDto: UploadDocumentDto,
    @UploadedFiles() files: { document?: Express.Multer.File[] },
    @GetUser() user: User
  ) {
    const documentFile = files.document?.[0];
    
    if (!documentFile) {
      this.logger.error(colors.red(`❌ Document file is required`));
      throw new BadRequestException('Document file is required');
    }
    
    return this.aiChatService.startUpload(uploadDto, documentFile, user);
  }

  @Get('upload-progress/:sessionId')
  @Sse('upload-progress/:sessionId')
  @UploadProgressDocs.operation()
  @UploadProgressDocs.responses.success()
  @UploadProgressDocs.responses.notFound()
  getUploadProgress(@Param('sessionId') sessionId: string): Observable<MessageEvent> {
    return new Observable(observer => {
      // Send current progress immediately
      const currentProgress = this.uploadProgressService.getCurrentProgress(sessionId);
      if (currentProgress) {
        observer.next({
          data: JSON.stringify(currentProgress)
        } as MessageEvent);
      }

      // Subscribe to progress updates
      const unsubscribe = this.uploadProgressService.subscribeToProgress(sessionId, (progress) => {
        observer.next({
          data: JSON.stringify(progress)
        } as MessageEvent);

        // Close stream when upload is completed or errored
        if (progress.stage === 'completed' || progress.stage === 'error') {
          observer.complete();
        }
      });

      // Cleanup on unsubscribe
      return () => {
        unsubscribe();
      };
    });
  }

  @Get('upload-status/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @UploadStatusDocs.operation()
  @UploadStatusDocs.responses.success()
  @UploadStatusDocs.responses.notFound()
  getUploadStatus(@Param('sessionId') sessionId: string) {
    const progress = this.uploadProgressService.getCurrentProgress(sessionId);
    
    if (!progress) {
      this.logger.error(colors.red(`❌ Upload session not found`));
      throw new BadRequestException('Upload session not found');
    }

    return {
      success: true,
      message: 'Upload status retrieved',
      data: progress,
      statusCode: 200
    };
  }

  @Post('process-document/:materialId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiBearerAuth('JWT-auth')
  @ProcessDocumentDocs.operation()
  @ProcessDocumentDocs.responses.success()
  @ProcessDocumentDocs.responses.notFound()
  async processDocument(@Param('materialId') materialId: string) {
    this.logger.log(colors.cyan(`🔄 Starting document processing for: ${materialId}`));
    
    try {
      // Start processing in background
      this.documentProcessingService.processDocument(materialId);
      
      return {
        success: true,
        message: 'Document processing started successfully',
        data: {
          materialId,
          status: 'PROCESSING'
        },
        statusCode: 202
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error starting document processing: ${error.message}`));
      throw new BadRequestException(`Failed to start document processing: ${error.message}`);
    }
  }

  @Get('processing-status/:materialId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ProcessingStatusDocs.operation()
  @ProcessingStatusDocs.responses.success()
  async getProcessingStatus(@Param('materialId') materialId: string) {
    try {
      const status = await this.documentProcessingService.getProcessingStatus(materialId);
      
      if (!status) {
        throw new BadRequestException('Processing status not found for this material');
      }

      return {
        success: true,
        message: 'Processing status retrieved',
        data: {
          materialId,
          status: status.status,
          totalChunks: status.total_chunks,
          processedChunks: status.processed_chunks,
          failedChunks: status.failed_chunks,
          errorMessage: status.error_message,
          createdAt: status.createdAt.toISOString(),
          updatedAt: status.updatedAt.toISOString(),
        },
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting processing status: ${error.message}`));
      throw new BadRequestException(`Failed to get processing status: ${error.message}`);
    }
  }

  @Get('chunks/:materialId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @DocumentChunksDocs.operation()
  @DocumentChunksDocs.responses.success()
  async getDocumentChunks(@Param('materialId') materialId: string) {
    try {
      const chunks = await this.documentProcessingService.getMaterialChunks(materialId);
      
      return {
        success: true,
        message: 'Document chunks retrieved',
        data: chunks,
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting document chunks: ${error.message}`));
      throw new BadRequestException(`Failed to get document chunks: ${error.message}`);
    }
  }

  @Get('search-chunks/:materialId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @SearchChunksDocs.operation()
  @SearchChunksDocs.responses.success()
  async searchChunks(
    @Param('materialId') materialId: string,
    @Query('query') query: string,
    @Query('topK') topK: string = '5'
  ) {
    try {
      if (!query) {
        throw new BadRequestException('Query parameter is required');
      }

      const topKNumber = parseInt(topK, 10) || 5;
      const chunks = await this.documentProcessingService.searchRelevantChunks(
        materialId, 
        query, 
        topKNumber
      );
      
      return {
        success: true,
        message: 'Relevant chunks found',
        data: chunks,
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error searching chunks: ${error.message}`));
      throw new BadRequestException(`Failed to search chunks: ${error.message}`);
    }
  }

  // ==================== CHAT ENDPOINTS ====================

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @CreateConversationDocs.operation()
  @CreateConversationDocs.responses.success()
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @GetUser() user: User
  ) {
    try {
      const conversation = await this.chatService.createConversation(user, createConversationDto);
      
      return {
        success: true,
        message: 'Conversation created successfully',
        data: conversation,
        statusCode: 201
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error creating conversation: ${error.message}`));
      throw new BadRequestException(`Failed to create conversation: ${error.message}`);
    }
  }

  @Post('send-message')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @SendMessageDocs.operation()
  @SendMessageDocs.responses.success()
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @GetUser() user: User
  ) {
    try {
      const response = await this.chatService.sendMessage(user, sendMessageDto);
      
      return {
        success: true,
        message: 'Message processed successfully',
        data: response,
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error sending message: ${error.message}`));
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  @Post('initiate-ai-chat')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @InitiateAiChatDocs.operation()
  @InitiateAiChatDocs.responses.success()
  @InitiateAiChatDocs.responses.badRequest()
  async initiateAiChat(
    @Body() initiateDto: InitiateAiChatDto,
    @GetUser() user: User
  ): Promise<InitiateAiChatResponseDto> {
    const response = await this.aiChatService.initiateAiChat(user, initiateDto);
    
    return {
      success: true,
      message: 'AI chat session initiated successfully',
      data: response,
      statusCode: 200
    };
  }

  @Get('conversations')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @GetUserConversationsDocs.operation()
  @GetUserConversationsDocs.responses.success()
  async getUserConversations(@GetUser() user: User) {
    try {
      const conversations = await this.chatService.getUserConversations(user);
      
      return {
        success: true,
        message: 'Conversations retrieved successfully',
        data: conversations,
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting conversations: ${error.message}`));
      throw new BadRequestException(`Failed to get conversations: ${error.message}`);
    }
  }

  @Get('conversations/:conversationId/messages')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @GetChatHistoryDocs.operation()
  @GetChatHistoryDocs.responses.success()
  async getChatHistory(
    @Param('conversationId') conversationId: string,
    @Query() getChatHistoryDto: GetChatHistoryDto,
    @GetUser() user: User
  ) {
    this.logger.log(colors.blue(`📖 HTTP Request: Loading conversation history - Conversation: ${conversationId}, User: ${user.email}`));
    
    const response = await this.chatService.getChatHistory(user, conversationId, getChatHistoryDto);
    
    this.logger.log(colors.green(`✅ HTTP Response: Conversation history sent - ${response.conversationHistory.length} messages`));
    
    return {
      success: true,
      message: 'Chat history retrieved successfully',
      data: response,
      statusCode: 200
    };
  }

  @Delete('conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @DeleteConversationDocs.operation()
  @DeleteConversationDocs.responses.success()
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @Body() body: { materialId?: string; alsoDeleteDocument?: boolean },
    @GetUser() user: User
  ) {
    try {
      const result = await this.aiChatDeletionService.deleteConversation(user, {
        conversationId,
        materialId: body?.materialId,
        alsoDeleteDocument: !!body?.alsoDeleteDocument,
      });

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        statusCode: 200
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error deleting conversation: ${error.message}`));
      throw new BadRequestException(`Failed to delete conversation: ${error.message}`);
    }
  }
}