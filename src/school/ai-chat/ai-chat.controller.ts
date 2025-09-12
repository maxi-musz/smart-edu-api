import { Controller, Post, Get, UseGuards, HttpCode, HttpStatus, Body, UseInterceptors, UploadedFiles, BadRequestException, Param, Sse, Logger } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AiChatService } from './ai-chat.service';
import { UploadProgressService } from './upload-progress.service';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { User } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UploadDocumentDto, DocumentUploadResponseDto, UploadSessionDto, UploadProgressDto } from './dto';
import { UploadDocumentDocs, StartUploadDocs, UploadProgressDocs, UploadStatusDocs } from './api-docs';
import { Observable } from 'rxjs';
import * as colors from 'colors';

@ApiTags('AI Chat')
@Controller('ai-chat')
@UseGuards(JwtGuard)
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name);

  constructor(
    private readonly aiChatService: AiChatService,
    private readonly uploadProgressService: UploadProgressService
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
    const documentFile = files.document?.[0];

    if (!documentFile) {
      this.logger.error(colors.red(`❌ Document file is required`));
      throw new BadRequestException('Document file is required');
    }

    return this.aiChatService.uploadDocument(uploadDto, documentFile, user);
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
}