import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../shared/services/s3.service';
import { FileValidationHelper } from '../../shared/helper-functions/file-validation.helper';
import { ApiResponse } from '../../shared/helper-functions/response';
import { User } from '@prisma/client';
import * as colors from 'colors';
import { UploadDocumentDto, DocumentUploadResponseDto, UploadSessionDto } from './dto';
import { UploadProgressService } from './upload-progress.service';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly uploadProgressService: UploadProgressService
  ) {}

  ////////////////////////////////////////////////////////////////////////// HELPER METHODS
  private generateTitleFromFilename(filename: string): string {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // Replace underscores and hyphens with spaces
    const cleanName = nameWithoutExt.replace(/[_-]/g, ' ');
    
    // Capitalize first letter of each word
    const title = cleanName.replace(/\b\w/g, l => l.toUpperCase());
    
    return title || 'Untitled Document';
  }

  ////////////////////////////////////////////////////////////////////////// START UPLOAD WITH PROGRESS TRACKING
  // POST - /api/v1/ai-chat/start-upload
  async startUpload(
    uploadDto: UploadDocumentDto,
    documentFile: Express.Multer.File,
    user: User
  ): Promise<ApiResponse<UploadSessionDto>> {
    // Auto-generate title from filename if not provided
    const documentTitle = uploadDto.title || this.generateTitleFromFilename(documentFile.originalname);
    
    this.logger.log(colors.cyan(`🚀 Starting upload with progress tracking: ${documentTitle}`));

    try {
      // Create upload session
      const sessionId = this.uploadProgressService.createUploadSession(
        user.id,
        user.school_id,
        documentFile.size
      );

      // Start upload process in background
      this.processUploadInBackground(uploadDto, documentFile, user, sessionId, documentTitle);

      const responseData: UploadSessionDto = {
        sessionId,
        progressEndpoint: `/api/v1/ai-chat/upload-progress/${sessionId}`
      };

      this.logger.log(colors.green(`✅ Upload session created: ${sessionId}`));

      return new ApiResponse(
        true,
        'Upload started successfully. Use the progress endpoint to track progress.',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error starting upload: ${error.message}`));
      throw new Error(`Failed to start upload: ${error.message}`);
    }
  }

  ////////////////////////////////////////////////////////////////////////// PROCESS UPLOAD IN BACKGROUND
  private async processUploadInBackground(
    uploadDto: UploadDocumentDto,
    documentFile: Express.Multer.File,
    user: User,
    sessionId: string,
    documentTitle: string
  ): Promise<void> {
    try {
      // Stage 1: Validation (0-10%)
      this.uploadProgressService.updateProgress(sessionId, 'validating', 0, 'Validating file...');
      
      const validationResult = FileValidationHelper.validateMaterialFile(documentFile);
      if (!validationResult.isValid) {
        this.uploadProgressService.updateProgress(sessionId, 'error', 0, 'File validation failed', validationResult.error);
        return;
      }

      this.uploadProgressService.updateProgress(sessionId, 'validating', documentFile.size * 0.1, 'File validation passed');

      // Stage 2: Upload to S3 (10-80%)
      this.uploadProgressService.updateProgress(sessionId, 'uploading', documentFile.size * 0.1, 'Uploading to cloud storage...');

      // Get user's school ID and ID
      const existingUser = await this.prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, school_id: true }
      });
      if (!existingUser) {
        this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.8, 'User not found');
        return;
      }
      const schoolId = existingUser.school_id;
      const userId = existingUser.id;
      if (!schoolId) {
        this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.8, 'User must be associated with a school');
        return;
      }

      let s3Path = `ai-chat/pubic/${schoolId}`;
      if (uploadDto.subject_id) {
        s3Path += `/subjects/${uploadDto.subject_id}`;
      }
      if (uploadDto.topic_id) {
        s3Path += `/topics/${uploadDto.topic_id}`;
      }
      s3Path += '/materials';

      const documentUploadResult = await this.s3Service.uploadFile(
        documentFile,
        s3Path,
        `${documentTitle.replace(/\s+/g, '_')}_${Date.now()}.${validationResult.fileType}`
      );

      this.uploadProgressService.updateProgress(sessionId, 'uploading', documentFile.size * 0.8, 'Upload completed');

      // Stage 3: Processing (80-90%)
      this.uploadProgressService.updateProgress(sessionId, 'processing', documentFile.size * 0.8, 'Processing document for AI chat...');

      // Validate subject and topic if provided
      let subject: any = null;
      let topic: any = null;

      if (uploadDto.subject_id) {
        subject = await this.prisma.subject.findFirst({
          where: { id: uploadDto.subject_id, schoolId: schoolId },
        });
        if (!subject) {
          this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.8, 'Subject not found');
          return;
        }
      }

      if (uploadDto.topic_id) {
        topic = await this.prisma.topic.findFirst({
          where: {
            id: uploadDto.topic_id,
            subject_id: uploadDto.subject_id,
            school_id: schoolId,
            is_active: true,
          },
        });
        if (!topic) {
          this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.8, 'Topic not found');
          return;
        }
      }

      this.uploadProgressService.updateProgress(sessionId, 'processing', documentFile.size * 0.9, 'Validation completed');

      // Stage 4: Saving to database (90-100%)
      this.uploadProgressService.updateProgress(sessionId, 'saving', documentFile.size * 0.9, 'Saving to database...');

      const documentSize = FileValidationHelper.formatFileSize(documentFile.size);

      // Get or create default AI Chat platform
      const aiChatPlatform = await this.prisma.organisation.upsert({
        where: { name: 'AI Chat Platform' },
        update: {},
        create: {
          name: 'AI Chat Platform',
          email: 'ai-chat@platform.com'
        }
      });

      const material = await this.prisma.pDFMaterial.create({
        data: {
          title: documentTitle, // Use auto-generated title
          description: uploadDto.description || null,
          topic_id: uploadDto.topic_id || null,
          url: documentUploadResult.url,
          schoolId: schoolId,
          platformId: aiChatPlatform.id, // Use AI Chat platform
          uploadedById: userId,
          order: 1,
          size: documentSize,
          status: 'published',
          fileType: validationResult.fileType,
          originalName: documentFile.originalname,
        },
      });

      const materialProcessing = await this.prisma.materialProcessing.create({
        data: {
          material_id: material.id,
          school_id: schoolId,
          status: 'PENDING',
          total_chunks: 0,
          processed_chunks: 0,
          failed_chunks: 0,
          embedding_model: 'text-embedding-3-small',
        },
      });

      // Stage 5: Completed
      this.uploadProgressService.updateProgress(
        sessionId, 
        'completed', 
        documentFile.size, 
        'Upload completed successfully!', 
        undefined, 
        material.id
      );

      this.logger.log(colors.green(`🎉 Upload completed successfully: ${material.title}`));

    } catch (error) {
      this.logger.error(colors.red(`❌ Error in background upload: ${error.message}`));
      this.uploadProgressService.updateProgress(sessionId, 'error', 0, 'Upload failed', error.message);
    }
  }

  ////////////////////////////////////////////////////////////////////////// UPLOAD DOCUMENT FOR AI CHAT (LEGACY - WITHOUT PROGRESS)
  // POST - /api/v1/ai-chat/upload-document
  async uploadDocument(
    uploadDto: UploadDocumentDto,
    documentFile: Express.Multer.File,
    user: User
  ): Promise<ApiResponse<DocumentUploadResponseDto>> {
    // Auto-generate title from filename if not provided
    const documentTitle = uploadDto.title || this.generateTitleFromFilename(documentFile.originalname);
    
    this.logger.log(colors.cyan(`📄 Starting document upload for AI chat without progress tracking: ${documentTitle}`));

    try {
      // Validate file
      this.logger.log(colors.blue(`🔍 Validating uploaded file...`));
      const validationResult = FileValidationHelper.validateMaterialFile(documentFile);

      if (!validationResult.isValid) {
        this.logger.error(colors.red(`❌ File validation failed: ${validationResult.error}`));
        throw new BadRequestException(validationResult.error);
      }

      this.logger.log(colors.green(`✅ File validation passed: ${documentFile.originalname}`));

      // Get user's school ID and ID
      const existingUser = await this.prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true, school_id: true }
      });
      if (!existingUser) {
        this.logger.error(colors.red(`❌ User not found`));
        throw new BadRequestException('User not found');
      }
      const schoolId = existingUser.school_id;
      const userId = existingUser.id;
      if (!schoolId) {
        this.logger.error(colors.red(`❌ User has no school_id`));
        throw new BadRequestException('User must be associated with a school');
      }

      // Validate subject and topic if provided (optional for AI chat)
      let subject: any = null;
      let topic: any = null;

      if (uploadDto.subject_id) {
        this.logger.log(colors.blue(`📚 Validating subject (optional)...`));
        subject = await this.prisma.subject.findFirst({
          where: {
            id: uploadDto.subject_id,
            schoolId: schoolId,
          },
        });

        if (!subject) {
          this.logger.error(colors.red(`❌ Subject not found: ${uploadDto.subject_id}`));
          throw new NotFoundException('Subject not found or does not belong to this school');
        }
        this.logger.log(colors.green(`✅ Subject validated: ${subject.name}`));
      }

      if (uploadDto.topic_id) {
        this.logger.log(colors.blue(`📖 Validating topic (optional)...`));
        topic = await this.prisma.topic.findFirst({
          where: {
            id: uploadDto.topic_id,
            subject_id: uploadDto.subject_id,
            school_id: schoolId,
            is_active: true,
          },
        });

        if (!topic) {
          this.logger.error(colors.red(`❌ Topic not found: ${uploadDto.topic_id}`));
          throw new NotFoundException('Topic not found or does not belong to this subject');
        }
        this.logger.log(colors.green(`✅ Topic validated: ${topic.title}`));
      }

      this.logger.log(colors.green(`✅ Validation completed - Subject: ${subject?.name || 'None'}, Topic: ${topic?.title || 'None'}`));

      // For AI chat materials, we don't need ordering - they're temporary/standalone
      // Users upload, chat, and may never return - ordering is irrelevant
      this.logger.log(colors.blue(`📄 AI chat material - standalone/temporary use`));

      // Upload document to S3 with flexible path structure
      this.logger.log(colors.blue(`🚀 Starting S3 document upload...`));
      
      // Create S3 path based on available data
      let s3Path = `ai-chat/pubic/${schoolId}`;
      if (uploadDto.subject_id) {
        s3Path += `/subjects/${uploadDto.subject_id}`;
      }
      if (uploadDto.topic_id) {
        s3Path += `/topics/${uploadDto.topic_id}`;
      }
      s3Path += '/materials'; // General materials folder

      const documentUploadResult = await this.s3Service.uploadFile(
        documentFile,
        s3Path,
        `${documentTitle.replace(/\s+/g, '_')}_${Date.now()}.${validationResult.fileType}`
      );

      this.logger.log(colors.green(`✅ Document uploaded successfully to S3`));

      // Calculate document size
      const documentSize = FileValidationHelper.formatFileSize(documentFile.size);

      // Get or create default AI Chat platform
      this.logger.log(colors.blue(`🏢 Getting or creating AI Chat platform...`));
      const aiChatPlatform = await this.prisma.organisation.upsert({
        where: { name: 'AI Chat Platform' },
        update: {},
        create: {
          name: 'AI Chat Platform',
          email: 'ai-chat@platform.com'
        }
      });
      this.logger.log(colors.green(`✅ AI Chat platform ready: ${aiChatPlatform.id}`));

      // Create material record in database
      this.logger.log(colors.blue(`💾 Saving document to database...`));
      
      const material = await this.prisma.pDFMaterial.create({
        data: {
          title: documentTitle, // Use auto-generated title
          description: uploadDto.description || null,
          topic_id: uploadDto.topic_id || null, // Optional topic
          url: documentUploadResult.url,
          schoolId: schoolId,
          platformId: aiChatPlatform.id, // Use AI Chat platform
          uploadedById: userId,
          order: 1, // Fixed order - not relevant for temporary AI chat materials
          size: documentSize,
          status: 'published',
          fileType: validationResult.fileType,
          originalName: documentFile.originalname,
        },
      });

      this.logger.log(colors.green(`✅ Document saved to database with ID: ${material.id}`));

      // Create material processing record
      this.logger.log(colors.blue(`⚙️ Creating material processing record...`));
      
      const materialProcessing = await this.prisma.materialProcessing.create({
        data: {
          material_id: material.id,
          school_id: schoolId,
          status: 'PENDING',
          total_chunks: 0,
          processed_chunks: 0,
          failed_chunks: 0,
          embedding_model: 'text-embedding-3-small', // Default embedding model
        },
      });

      this.logger.log(colors.green(`✅ Material processing record created with ID: ${materialProcessing.id}`));

      // Format response
      const responseData: DocumentUploadResponseDto = {
        id: material.id,
        title: documentTitle, // Use auto-generated title
        description: material.description || '',
        url: material.url,
        fileType: material.fileType || 'unknown',
        size: material.size || '0 Bytes',
        originalName: material.originalName || documentFile.originalname,
        subject_id: uploadDto.subject_id || '', // Optional subject
        topic_id: material.topic_id || '', // Optional topic
        processing_status: materialProcessing.status,
        createdAt: material.createdAt.toISOString(),
        updatedAt: material.updatedAt.toISOString(),
      };

      this.logger.log(colors.green(`🎉 Document upload completed successfully: ${material.title}`));

      return new ApiResponse(
        true,
        'Document uploaded successfully and ready for AI chat processing',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error uploading document: ${error.message}`));
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }
}
