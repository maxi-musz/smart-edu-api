import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AssessmentService } from './assessment.service';
import { CreateLibraryCBTDto } from './cbt-dto/create-cbt.dto';
import { UpdateLibraryCBTDto } from './cbt-dto/update-cbt.dto';
import { CreateLibraryCBTQuestionDto } from './cbt-dto/create-cbt-question.dto';
import { UpdateLibraryCBTQuestionDto } from './cbt-dto/update-cbt-question.dto';
import { ApiResponse } from '../../shared/helper-functions/response';
import { PrismaService } from '../../prisma/prisma.service';
import * as colors from 'colors';

/**
 * Service for managing Library CBT Assessments
 * Wraps AssessmentService and ensures only CBT type assessments are created/managed
 */
@Injectable()
export class CBTService {
  private readonly logger = new Logger(CBTService.name);

  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new CBT Assessment (automatically sets assessmentType to 'CBT')
   */
  async createCBT(createCBTDto: CreateLibraryCBTDto, user: any): Promise<ApiResponse<any>> {
    // Determine scope: topic > chapter > subject
    let scopeInfo = '';
    if (createCBTDto.topicId) {
      scopeInfo = `for topic: ${createCBTDto.topicId}`;
    } else if (createCBTDto.chapterId) {
      scopeInfo = `for chapter: ${createCBTDto.chapterId}`;
    } else {
      scopeInfo = `for subject: ${createCBTDto.subjectId}`;
    }
    
    this.logger.log(colors.cyan(`[LIBRARY CBT] Creating new CBT: ${createCBTDto.title} ${scopeInfo} for user: ${user.email}`));
    
    // Convert CBT DTO to Assessment DTO and force assessmentType to 'CBT'
    const createAssessmentDto = {
      ...createCBTDto,
      assessmentType: 'CBT', // Force CBT type
    };

    return await this.assessmentService.createAssessment(createAssessmentDto, user);
  }

  /**
   * Upload an image for a question in a CBT
   */
  async uploadQuestionImage(
    assessmentId: string,
    imageFile: Express.Multer.File,
    userId: string,
  ): Promise<ApiResponse<any>> {
    return await this.assessmentService.uploadQuestionImage(assessmentId, imageFile, userId);
  }

  /**
   * Create a new question in a CBT
   */
  async createQuestion(
    assessmentId: string,
    createQuestionDto: CreateLibraryCBTQuestionDto,
    userId: string,
    imageFile?: Express.Multer.File,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CBT] Creating question in CBT: ${assessmentId}`));
    
    if (imageFile) {
      this.logger.log(colors.cyan(`Image file attached: ${imageFile.originalname} (${(imageFile.size / 1024).toFixed(2)} KB)`));
    }
    
    // Convert question field names from camelCase to snake_case for service compatibility
    const serviceQuestionDto = this.convertQuestionDtoToServiceFormat(createQuestionDto);
    
    return await this.assessmentService.createQuestion(assessmentId, serviceQuestionDto, userId, imageFile);
  }

  /**
   * Get all questions for a CBT
   */
  async getQuestions(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    return await this.assessmentService.getAssessmentQuestions(assessmentId, userId);
  }

  /**
   * Update a question in a CBT
   */
  async updateQuestion(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: UpdateLibraryCBTQuestionDto,
    userId: string,
    imageFile?: Express.Multer.File,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CBT] Updating question ${questionId} in CBT: ${assessmentId}`));
    
    // Convert question field names from camelCase to snake_case for service compatibility
    const serviceQuestionDto = this.convertQuestionDtoToServiceFormat(updateQuestionDto as any);
    
    return await this.assessmentService.updateQuestion(
      assessmentId,
      questionId,
      serviceQuestionDto,
      userId,
      imageFile,
    );
  }

  /**
   * Delete orphaned image (uploaded but not attached to any question)
   */
  async deleteOrphanedImage(
    assessmentId: string,
    imageS3Key: string,
    userId: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CBT] Deleting orphaned image: ${imageS3Key}`));
    return await this.assessmentService.deleteOrphanedImage(assessmentId, imageS3Key, userId);
  }

  /**
   * Delete question image
   */
  async deleteQuestionImage(
    assessmentId: string,
    questionId: string,
    userId: string,
  ): Promise<ApiResponse<any>> {
    return await this.assessmentService.deleteQuestionImage(assessmentId, questionId, userId);
  }

  /**
   * Delete a question from a CBT
   */
  async deleteQuestion(
    assessmentId: string,
    questionId: string,
    userId: string,
  ): Promise<ApiResponse<any>> {
    return await this.assessmentService.deleteQuestion(assessmentId, questionId, userId);
  }

  /**
   * Update a CBT
   */
  async updateCBT(
    assessmentId: string,
    updateCBTDto: UpdateLibraryCBTDto,
    userId: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CBT] Updating CBT: ${assessmentId}`));
    
    // Ensure assessmentType remains 'CBT' if it's being set
    const updateAssessmentDto = {
      ...updateCBTDto,
      assessmentType: 'CBT', // Force CBT type
    };

    return await this.assessmentService.updateAssessment(assessmentId, updateAssessmentDto, userId);
  }

  /**
   * Delete a CBT
   */
  async deleteCBT(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    return await this.assessmentService.deleteAssessment(assessmentId, userId);
  }

  /**
   * Publish a CBT
   */
  async publishCBT(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    return await this.assessmentService.publishAssessment(assessmentId, userId);
  }

  /**
   * Unpublish a CBT
   */
  async unpublishCBT(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    return await this.assessmentService.unpublishAssessment(assessmentId, userId);
  }

  /**
   * Get a CBT by ID
   */
  async getCBTById(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    return await this.assessmentService.getAssessmentById(assessmentId, userId);
  }

  /**
   * List/Filter CBTs
   */
  async listCBTs(
    user: any,
    filters?: { subjectId?: string; chapterId?: string; topicId?: string; status?: string },
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CBT] Listing CBTs for user: ${user.email}`));
    if (filters) {
      this.logger.log(colors.cyan(`[LIBRARY CBT] Filters: ${JSON.stringify(filters)}`));
    }
    
    try {
      // Get the library user to ensure they exist and get their platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Build dynamic where clause based on filters
      const whereClause: any = {
        platformId: libraryUser.platformId,
        createdById: user.sub,
        assessmentType: 'CBT', // Only CBT type
      };

      // Apply filters if provided
      if (filters?.subjectId) {
        whereClause.subjectId = filters.subjectId;
      }
      if (filters?.chapterId) {
        whereClause.chapterId = filters.chapterId;
      }
      if (filters?.topicId) {
        whereClause.topicId = filters.topicId;
      }
      if (filters?.status) {
        whereClause.status = filters.status;
      }

      // Get all CBT assessments for this platform with filters
      const assessments = await this.prisma.libraryAssessment.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          instructions: true,
          assessmentType: true,
          gradingType: true,
          status: true,
          duration: true,
          timeLimit: true,
          startDate: true,
          endDate: true,
          maxAttempts: true,
          passingScore: true,
          totalPoints: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          showCorrectAnswers: true,
          showFeedback: true,
          studentCanViewGrading: true,
          allowReview: true,
          autoSubmit: true,
          isPublished: true,
          publishedAt: true,
          isResultReleased: true,
          resultReleasedAt: true,
          tags: true,
          order: true,
          createdAt: true,
          updatedAt: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const filterSummary = filters 
        ? ` (filtered by: ${Object.entries(filters).filter(([_, v]) => v).map(([k, v]) => `${k}=${v}`).join(', ')})`
        : '';
      
      this.logger.log(colors.green(`Successfully retrieved ${assessments.length} CBT assessments${filterSummary}`));

      const responseData = {
        assessments,
        totalCount: assessments.length,
        filters: filters || {},
      };

      return new ApiResponse(true, 'CBT assessments retrieved successfully', responseData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error listing CBTs: ${error.message}`), error.stack);
      throw error;
    }
  }

  /**
   * Helper: Convert camelCase DTO to snake_case format for service compatibility
   * The AssessmentService expects snake_case field names from the original DTOs
   */
  private convertQuestionDtoToServiceFormat(dto: any): any {
    if (!dto) return dto;

    const converted: any = {};

    // Map camelCase to snake_case
    const fieldMapping = {
      questionText: 'questionText', // Keep as is - service uses camelCase for this
      questionType: 'questionType', // Keep as is
      order: 'order',
      points: 'points',
      isRequired: 'isRequired', // Keep as is
      timeLimit: 'timeLimit', // Keep as is
      imageUrl: 'imageUrl', // Keep as is
      imageS3Key: 'imageS3Key', // Keep as is
      audioUrl: 'audioUrl', // Keep as is
      videoUrl: 'videoUrl', // Keep as is
      allowMultipleAttempts: 'allowMultipleAttempts', // Keep as is
      showHint: 'showHint', // Keep as is
      hintText: 'hintText', // Keep as is
      minLength: 'minLength', // Keep as is
      maxLength: 'maxLength', // Keep as is
      minValue: 'minValue', // Keep as is
      maxValue: 'maxValue', // Keep as is
      explanation: 'explanation',
      difficultyLevel: 'difficultyLevel', // Keep as is
      options: 'options',
      correctAnswers: 'correctAnswers', // Keep as is
    };

    Object.keys(dto).forEach((key) => {
      const mappedKey = fieldMapping[key] || key;
      converted[mappedKey] = dto[key];
    });

    // Convert options array if present
    if (dto.options && Array.isArray(dto.options)) {
      converted.options = dto.options.map((option: any) => ({
        id: option.id,
        optionText: option.optionText,
        order: option.order,
        isCorrect: option.isCorrect,
        imageUrl: option.imageUrl,
        audioUrl: option.audioUrl,
      }));
    }

    // Convert correctAnswers array if present
    if (dto.correctAnswers && Array.isArray(dto.correctAnswers)) {
      converted.correctAnswers = dto.correctAnswers.map((answer: any) => ({
        id: answer.id,
        answerText: answer.answerText,
        answerNumber: answer.answerNumber,
        answerDate: answer.answerDate,
        optionIds: answer.optionIds,
        answerJson: answer.answerJson,
      }));
    }

    return converted;
  }
}

