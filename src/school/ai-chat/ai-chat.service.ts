import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Service } from '../../shared/services/s3.service';
import { FileValidationHelper } from '../../shared/helper-functions/file-validation.helper';
import { ApiResponse } from '../../shared/helper-functions/response';
import { User } from '@prisma/client';
import * as colors from 'colors';
import { UploadDocumentDto, DocumentUploadResponseDto, UploadSessionDto } from './dto';
import { InitiateAiChatDto, TeacherMaterialDto, SupportedDocumentTypeDto } from './dto/initiate-ai-chat.dto';
import { UploadProgressService } from './upload-progress.service';
import { DocumentProcessingService } from './services';
import { PineconeService } from './services/pinecone.service';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly uploadProgressService: UploadProgressService,
    private readonly documentProcessingService: DocumentProcessingService,
    private readonly pineconeService: PineconeService,
  ) {}

  ////////////////////////////////////////////////////////////////////////// HELPER METHODS
  
  /**
   * Process document directly from uploaded file (more efficient than S3 download)
   */
  private async processDocumentFromFile(
    materialId: string, 
    documentFile: Express.Multer.File, 
    fileType: string
  ): Promise<void> {
    try {
      this.logger.log(colors.cyan(`🔄 Processing document directly from uploaded file: ${documentFile.originalname}`));
      
      // Process the file buffer directly instead of downloading from S3
      const result = await this.documentProcessingService.processDocumentFromBuffer(
        materialId,
        documentFile.buffer,
        fileType
      );
      
      if (result.success) {
        this.logger.log(colors.green(`✅ Document processed successfully: ${materialId}`));
      } else {
        this.logger.error(colors.red(`❌ Document processing failed: ${result.error}`));
      }
    } catch (error) {
      this.logger.error(colors.red(`❌ Error processing document from file: ${error.message}`));
    }
  }

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
      this.logger.log(colors.cyan(`🔄 Background upload process started for: ${documentTitle}`));
      
      // Stage 1: Validation (0-10%)
      this.uploadProgressService.updateProgress(sessionId, 'validating', 0, 'Validating file...');
      
      const validationResult = FileValidationHelper.validateMaterialFile(documentFile);
      if (!validationResult.isValid) {
        this.logger.error(colors.red(`❌ File validation failed: ${validationResult.error}`));
        this.uploadProgressService.updateProgress(sessionId, 'error', 0, 'File validation failed', validationResult.error);
        return;
      }

      this.logger.log(colors.green(`✅ File validation passed`));
      this.uploadProgressService.updateProgress(sessionId, 'validating', documentFile.size * 0.1, 'File validation passed');

      // Stage 2: Upload to S3 (10-80%)
      this.uploadProgressService.updateProgress(sessionId, 'uploading', documentFile.size * 0.1, 'Uploading to cloud storage...');

      // Get user's school ID and ID
      const existingUser = await this.prisma.user.findUnique({
        where: { id: (user as any).sub },
        select: { id: true, school_id: true }
      });
      if (!existingUser) {
        this.logger.error(colors.red(`❌ User not found: ${(user as any).sub}`));
        this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.8, 'User not found');
        return;
      }
      const schoolId = existingUser.school_id;
      const userId = existingUser.id;
      this.logger.log(colors.green(`✅ User found: ${userId}, School: ${schoolId}`));
      
      if (!schoolId) {
        this.logger.error(colors.red(`❌ User not associated with school`));
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
      
      let documentUploadResult;
      try {
        documentUploadResult = await this.s3Service.uploadFile(
          documentFile,
          s3Path,
          `${documentTitle.replace(/\s+/g, '_')}_${Date.now()}.${validationResult.fileType}`
        );

        this.logger.log(colors.green(`✅ S3 upload completed`));
        this.uploadProgressService.updateProgress(sessionId, 'uploading', documentFile.size * 0.8, 'Upload completed');
      } catch (s3Error) {
        this.logger.error(colors.red(`❌ S3 upload failed: ${s3Error.message}`));
        this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.8, 'S3 upload failed', s3Error.message);
        return;
      }

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
      let aiChatPlatform;
      try {
        aiChatPlatform = await this.prisma.organisation.upsert({
          where: { name: 'AI Chat Platform' },
          update: {},
          create: {
            name: 'AI Chat Platform',
            email: 'ai-chat@platform.com'
          }
        });
        this.logger.log(colors.green(`✅ AI Chat platform ready`));
      } catch (platformError) {
        this.logger.error(colors.red(`❌ Platform creation failed: ${platformError.message}`));
        this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.9, 'Platform creation failed', platformError.message);
        return;
      }

      let material;
      try {
        material = await this.prisma.pDFMaterial.create({
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
        this.logger.log(colors.green(`✅ Material record created`));
      } catch (materialError) {
        this.logger.error(colors.red(`❌ Material creation failed: ${materialError.message}`));
        this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.9, 'Material creation failed', materialError.message);
        return;
      }

      let materialProcessing;
      try {
        materialProcessing = await this.prisma.materialProcessing.create({
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
        this.logger.log(colors.green(`✅ Material processing record created`));
      } catch (processingError) {
        this.logger.error(colors.red(`❌ Material processing creation failed: ${processingError.message}`));
        this.uploadProgressService.updateProgress(sessionId, 'error', documentFile.size * 0.9, 'Material processing creation failed', processingError.message);
        return;
      }

      // Process document directly from uploaded file (more efficient)
      this.logger.log(colors.blue(`🔄 Starting document processing directly from uploaded file...`));
      this.processDocumentFromFile(material.id, documentFile, validationResult.fileType || 'pdf');
      this.logger.log(colors.green(`✅ Document processing started`));

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
      this.logger.error(colors.red(`❌ Error stack: ${error.stack}`));
      this.uploadProgressService.updateProgress(sessionId, 'error', 0, 'Upload failed', error.message);
    }
  }

  ////////////////////////////////////////////////////////////////////////// UPLOAD DOCUMENT FOR AI CHAT (LEGACY - WITHOUT PROGRESS)
  // POST - /api/v1/ai-chat/upload-document
  async uploadDocument(
    uploadDto: UploadDocumentDto,
    files: { document?: Express.Multer.File[] },
    user: User
  ): Promise<ApiResponse<DocumentUploadResponseDto>> {
    this.logger.log(colors.cyan(`📄 Starting document upload for AI chat without progress tracking`));

    const documentFile = files.document?.[0];

    if (!documentFile) {
      this.logger.error(colors.red(`❌ Document file is required`));
      throw new BadRequestException('Document file is required');
    }
    
    // Auto-generate title from filename if not provided
    const documentTitle = uploadDto.title || this.generateTitleFromFilename(documentFile.originalname);
    

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

      // Auto-start processing in background
      this.logger.log(colors.blue(`🔄 Starting document processing in background...`));
      this.documentProcessingService.processDocument(material.id);
      this.logger.log(colors.green(`✅ Document processing started`));

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

  /**
   * Initiate AI chat session based on user role
   */
  async initiateAiChat(
    user: User,
    initiateDto: InitiateAiChatDto
  ): Promise<{
    userRole: string;
    documentCount: number;
    supportedDocumentTypes: SupportedDocumentTypeDto[];
    uploadedDocuments: TeacherMaterialDto[];
    conversations: any[];
    usageLimits: any;
  }> {
    try {
      this.logger.log(colors.cyan(`🤖 Initiating AI chat for user role: ${initiateDto.userRole}`));

      // Extract user data from JWT payload (now includes school_id)
      const userId = user.id || (user as any).sub;
      const schoolId = user.school_id;

      if (!userId) {
        this.logger.error(colors.red(`❌ User ID not found in token`));
        throw new Error('User ID not found in token');
      }

      if (!schoolId) {
        this.logger.error(colors.red(`❌ User school_id is missing from token`));
        throw new Error('User school_id is missing from token');
      }

      // Get supported document types
      const supportedDocumentTypes = this.getSupportedDocumentTypes();

      // Get user's conversations
      const conversations = await this.getUserConversations(userId);

      // Get user's usage limits
      const usageLimits = await this.getUserUsageLimits(userId);

      // Handle different user roles
      switch (initiateDto.userRole) {
        case 'teacher':
          const teacherData = await this.getTeacherMaterials(userId, schoolId);
          return {
            userRole: 'teacher',
            usageLimits,
            documentCount: teacherData.documentCount,
            supportedDocumentTypes,
            uploadedDocuments: teacherData.uploadedDocuments,
            conversations,
          };
        
        case 'student':
          // For now, return empty for students
          return {
            userRole: 'student',
            usageLimits,
            documentCount: 0,
            supportedDocumentTypes,
            uploadedDocuments: [],
            conversations,
          };
        
        case 'school_director':
        case 'school_admin':
          // For now, return empty for admins
          return {
            userRole: initiateDto.userRole,
            usageLimits,
            documentCount: 0,
            supportedDocumentTypes,
            uploadedDocuments: [],
            conversations,
          };
        
        default:
          this.logger.error(colors.red(`❌ Unsupported user role: ${initiateDto.userRole}`));
          throw new Error(`Unsupported user role: ${initiateDto.userRole}`);
      }

    } catch (error) {
      this.logger.error(colors.red(`❌ Error initiating AI chat: ${error.message}`));
      throw new Error(`Failed to initiate AI chat: ${error.message}`);
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
          // messagesSentThisWeek: true,
          maxTokensPerWeek: true,
          // maxMessagesPerWeek: true,
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
        // messagesSentThisWeek: user.messagesSentThisWeek,
        maxTokensPerWeek: user.maxTokensPerWeek,
        // maxMessagesPerWeek: user.maxMessagesPerWeek,
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
   * Get teacher's uploaded materials
   */
  private async getTeacherMaterials(
    userId: string,
    schoolId: string
  ): Promise<{
    documentCount: number;
    uploadedDocuments: TeacherMaterialDto[];
  }> {
    try {
      this.logger.log(colors.blue(`📚 Fetching materials for teacher: ${userId}`));

      // Get teacher's uploaded materials
      const materials = await this.prisma.pDFMaterial.findMany({
        where: {
          uploadedById: userId,
          schoolId: schoolId,
          status: 'published'
        },
        select: {
          id: true,
          title: true,
          description: true,
          fileType: true,
          originalName: true,
          size: true,
          status: true,
          createdAt: true,
          materialProcessings: {
            select: {
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform materials to DTO format
      const uploadedDocuments: TeacherMaterialDto[] = materials.map(material => ({
        id: material.id,
        title: material.title,
        description: material.description,
        fileType: material.fileType,
        originalName: material.originalName,
        size: material.size,
        status: material.status,
        createdAt: material.createdAt.toISOString(),
        isProcessed: material.materialProcessings?.status === 'COMPLETED'
      }));

      this.logger.log(colors.green(`✅ Found ${materials.length} materials for teacher`));

      return {
        documentCount: materials.length,
        uploadedDocuments
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching teacher materials: ${error.message}`));
      throw new Error(`Failed to fetch teacher materials: ${error.message}`);
    }
  }

  /**
   * Get user's conversations
   */
  private async getUserConversations(userId: string): Promise<any[]> {
    try {
      this.logger.log(colors.blue(`💬 Fetching conversations for user: ${userId}`));

      const conversations = await this.prisma.chatConversation.findMany({
        where: {
          user_id: userId,
        },
        orderBy: { last_activity: 'desc' },
        take: 50,
        select: {
          id: true,
          title: true,
          status: true,
          material_id: true,
          total_messages: true,
          last_activity: true,
          createdAt: true,
          updatedAt: true,
          material: {
            select: {
              title: true,
              originalName: true
            }
          }
        }
      });

      const formattedConversations = conversations.map(conversation => ({
        id: conversation.id,
        title: conversation.material?.title || conversation.title,
        documentTitle: conversation.material?.title || null,
        originalFileName: conversation.material?.originalName || null,
        status: conversation.status,
        materialId: conversation.material_id,
        totalMessages: conversation.total_messages,
        lastActivity: conversation.last_activity.toISOString(),
        createdAt: conversation.createdAt.toISOString(),
        updatedAt: conversation.updatedAt.toISOString(),
      }));

      this.logger.log(colors.green(`✅ Found ${conversations.length} conversations for user`));

      return formattedConversations;

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching user conversations: ${error.message}`));
      return [];
    }
  }

  /**
   * Get supported document types for upload
   */
  private getSupportedDocumentTypes(): SupportedDocumentTypeDto[] {
    return [
      {
        type: 'PDF',
        extension: '.pdf',
        mimeType: 'application/pdf',
        maxSize: '50MB',
        description: 'Portable Document Format files'
      },
      {
        type: 'Word Document',
        extension: '.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        maxSize: '25MB',
        description: 'Microsoft Word documents'
      },
      {
        type: 'Word Document (Legacy)',
        extension: '.doc',
        mimeType: 'application/msword',
        maxSize: '25MB',
        description: 'Legacy Microsoft Word documents'
      },
      {
        type: 'PowerPoint',
        extension: '.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        maxSize: '50MB',
        description: 'Microsoft PowerPoint presentations'
      },
      {
        type: 'Excel',
        extension: '.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        maxSize: '25MB',
        description: 'Microsoft Excel spreadsheets'
      },
      {
        type: 'Text Document',
        extension: '.txt',
        mimeType: 'text/plain',
        maxSize: '10MB',
        description: 'Plain text documents'
      },
      {
        type: 'Rich Text Format',
        extension: '.rtf',
        mimeType: 'application/rtf',
        maxSize: '10MB',
        description: 'Rich Text Format documents'
      }
    ];
  }
}

// ==================== DELETE HELPERS AND ENDPOINT SERVICE ====================

@Injectable()
export class AiChatDeletionService {
  private readonly logger = new Logger(AiChatDeletionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
    private readonly pineconeService: PineconeService,
  ) {}

  async deleteConversation(
    user: any,
    params: { conversationId: string; materialId?: string; alsoDeleteDocument?: boolean }
  ): Promise<ApiResponse<null>> {
    const { conversationId, materialId, alsoDeleteDocument } = params;

    // 1) Delete conversation messages and contexts
    await this.prisma.$transaction(async (tx) => {
      const messages = await tx.chatMessage.findMany({
        where: { conversation_id: conversationId, user_id: user.id },
        select: { id: true },
      });
      const messageIds = messages.map(m => m.id);

      if (messageIds.length > 0) {
        await tx.chatContext.deleteMany({ where: { message_id: { in: messageIds } } });
      }
      await tx.chatMessage.deleteMany({ where: { conversation_id: conversationId, user_id: user.id } });
      await tx.chatConversation.deleteMany({ where: { id: conversationId, user_id: user.id } });
    });

    // 2) Optionally delete the document and its vectors
    if (alsoDeleteDocument && materialId) {
      const material = await this.prisma.pDFMaterial.findUnique({
        where: { id: materialId },
        select: { id: true, url: true, uploadedById: true, schoolId: true },
      });

      if (!material || material.uploadedById !== user.id || material.schoolId !== user.school_id) {
        throw new BadRequestException('Material not found or not owned by user');
      }

      // a) Delete Pinecone vectors
      await this.pineconeService.deleteChunksByMaterial(materialId);

      // b) Delete DB chunks and processing rows
      await this.prisma.$transaction(async (tx) => {
        await tx.documentChunk.deleteMany({ where: { material_id: materialId } });
        await tx.materialProcessing.deleteMany({ where: { material_id: materialId } });
      });

      // c) Delete S3 object
      try {
        const url = new URL(material.url);
        const key = url.pathname.slice(1);
        await this.s3Service.deleteFile(key);
      } catch (e) {
        this.logger.warn(`S3 delete warning: ${e.message}`);
      }

      // d) Delete material record
      await this.prisma.pDFMaterial.delete({ where: { id: materialId } });
    }

    return new ApiResponse(true, 'Conversation deleted successfully', null);
  }
}
