import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import { Logger } from '@nestjs/common';
import * as colors from 'colors';
import { CreateAssessmentDto, CreateAssessmentQuestionDto, UpdateAssessmentDto, UpdateAssessmentQuestionDto } from './cbt-dto';
import { StorageService } from '../../../shared/services/providers/storage.service';
import { AssessmentNotificationsService } from '../../../push-notifications/assessment/assessment-notifications.service';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly assessmentNotificationsService: AssessmentNotificationsService,
  ) {}

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get teacher by user ID
   * @param userId - User ID
   */
  async getTeacherByUserId(userId: string) {
    return this.prisma.teacher.findUnique({
      where: { user_id: userId },
      select: {
        id: true,
        school_id: true,
        academic_session_id: true,
        first_name: true,
        last_name: true,
        email: true
      }
    });
  }

  // ========================================
  // CBT QUIZ MANAGEMENT METHODS
  // ========================================

  /**
   * Create a new CBT quiz
   * @param createQuizDto - Quiz creation data
   * @param teacherId - ID of the teacher creating the quiz
   * @param schoolId - ID of the school
   * @param academicSessionId - ID of the academic session
   */
  async createAssessment(
    createQuizDto: CreateAssessmentDto,
    user: any
  ) {
    try {
      this.logger.log(colors.cyan(`Creating New Assessment: ${createQuizDto.title}`));

      // fetch teacher from db
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          user_id: user.sub
        }
      });

      if (!teacher) {
        this.logger.error(colors.red(`Teacher not found: ${user.sub}`));
        throw new NotFoundException('Teacher not found');
      }

      const teacherId = teacher.id;
      const schoolId = teacher.school_id;
      const academicSessionId = teacher.academic_session_id;
  
      // Verify teacher has access to the subject
      await this.verifyTeacherSubjectAccess(createQuizDto.subject_id, user.sub);
      
      // If topic_id is provided, verify access to that specific topic
      if (createQuizDto.topic_id) {
        await this.verifyTeacherTopicAccess(createQuizDto.topic_id, teacherId, schoolId);
      }
  
      // Prepare the data object with scalar field IDs
      const createData: any = {
        title: createQuizDto.title,
        description: createQuizDto.description,
        instructions: createQuizDto.instructions,
        // Use scalar field IDs instead of connect operations
        subject_id: createQuizDto.subject_id,
        school_id: schoolId,
        academic_session_id: academicSessionId,
        created_by: user.sub, // Use the User ID, not Teacher ID
        // Quiz settings
        duration: createQuizDto.duration,
        max_attempts: createQuizDto.max_attempts || 1,
        passing_score: createQuizDto.passing_score || 50.0,
        total_points: createQuizDto.total_points || 100.0,
        shuffle_questions: createQuizDto.shuffle_questions || false,
        shuffle_options: createQuizDto.shuffle_options || false,
        show_correct_answers: createQuizDto.show_correct_answers || false,
        show_feedback: createQuizDto.show_feedback !== false, // default true
        allow_review: createQuizDto.allow_review !== false, // default true
        start_date: createQuizDto.start_date ? new Date(createQuizDto.start_date) : null,
        end_date: createQuizDto.end_date ? new Date(createQuizDto.end_date) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Default: 2 days from now
        time_limit: createQuizDto.time_limit,
        grading_type: createQuizDto.grading_type || 'AUTOMATIC',
        auto_submit: createQuizDto.auto_submit || false,
        assessment_type: createQuizDto.assessment_type || 'CBT',
        tags: createQuizDto.tags || [],
        status: 'DRAFT',
        is_published: false,
      };
  
      // Only add topic_id if provided
      if (createQuizDto.topic_id) {
        createData.topic_id = createQuizDto.topic_id;
      }
  
      // Create the quiz
      const quiz = await this.prisma.assessment.create({
        data: createData,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      });
  
      this.logger.log(colors.green(`Assessment created successfully: ${quiz.id}`));
      return ResponseHelper.success('Assessment created successfully', quiz);
    } catch (error) {
      this.logger.error(colors.red(`Error creating Assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get all CBT quizzes created by a teacher for the current academic session
   * @param userId - User ID of the teacher
   * @param filters - Filters for status, subject (required), topic, assessment type, pagination
   */
  async getAllAssessments(
    userId: string,
    filters: {
      status?: string;
      subjectId: string;
      topicId?: string;
      assessmentType?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      // Log only the parameters that are actually passed in
      const receivedParams = Object.entries(filters)
        .filter(([key, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}=${value}`)
        .join(', ');
      
      this.logger.log(colors.cyan(`Getting all assessments for user: ${userId} with params: ${receivedParams}`));

      // Validate required subjectId
      if (!filters.subjectId) {
        throw new BadRequestException('subject_id is required');
      }

      // Get user to check role and school_id
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          school_id: true
        }
      });

      if (!user || !user.school_id) {
        throw new NotFoundException('User not found or missing school data');
      }

      // Check if user is a director
      const isDirector = user.role === 'school_director';

      // Get teacher record (for teachers) or use user data (for directors)
      let schoolId: string;
      let currentSessionId: any;

      if (isDirector) {
        this.logger.log(colors.cyan(`✅ User is a director - fetching all assessments for school: ${user.school_id}`));
        schoolId = user.school_id;
        
        // Get current academic session for the school
        currentSessionId = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true
          }
        });

        if (!currentSessionId) {
          this.logger.error(colors.red(`Current academic session not found for school: ${schoolId}`));
          throw new NotFoundException('Current academic session not found');
        }
      } else {
        // For teachers, get teacher record to access academic session ID
        const teacher = await this.getTeacherByUserId(userId);
        if (!teacher) {
          throw new NotFoundException('Teacher not found');
        }
        schoolId = teacher.school_id;

        // get current academic session id
        currentSessionId = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true
          }
        });

        if (!currentSessionId) {
          this.logger.error(colors.red(`Current academic session not found: ${schoolId}`));
          throw new NotFoundException('Current academic session not found');
        }
      }

      const {
        status,
        subjectId,
        topicId,
        assessmentType,
        page = 1,
        limit = 10
      } = filters;

      // Convert string parameters to numbers
      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

      // Build base where clause - include current academic session
      // Directors can see all assessments in the school, teachers only see their own
      const baseWhere: any = {
        academic_session_id: currentSessionId.id,
        school_id: schoolId,
        subject_id: subjectId, // Always filter by subject_id
      };

      // Only filter by created_by for teachers (directors see all)
      if (!isDirector) {
        baseWhere.created_by = userId;
      }

      // Add optional filters to base where
      if (status) {
        baseWhere.status = status;
      }
      if (subjectId) {
        baseWhere.subject_id = subjectId;
      }
      if (topicId) {
        baseWhere.topic_id = topicId;
      }

      // If specific assessment type is requested, filter by it
      if (assessmentType) {
        baseWhere.assessment_type = assessmentType;
      }

      // Calculate pagination
      const skip = (pageNum - 1) * limitNum;

      // Get all assessments grouped by type
      const [allAssessments, assessmentTypeCounts] = await Promise.all([
        this.prisma.assessment.findMany({
          where: baseWhere,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            topic: {
              select: {
                id: true,
                title: true
              }
            },
            _count: {
              select: {
                questions: true,
                attempts: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        // Get counts for each assessment type
        this.prisma.assessment.groupBy({
          by: ['assessment_type'],
          where: baseWhere,
          _count: {
            assessment_type: true
          }
        })
      ]);

      // Group assessments by type
      const groupedAssessments = allAssessments.reduce((acc, assessment) => {
        const type = assessment.assessment_type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(assessment);
        return acc;
      }, {} as Record<string, any[]>);

      // Create counts object
      const counts = assessmentTypeCounts.reduce((acc, item) => {
        acc[item.assessment_type] = item._count.assessment_type;
        return acc;
      }, {} as Record<string, number>);

      // If specific assessment type is requested, return only that type with pagination
      if (assessmentType) {
        const typeAssessments = groupedAssessments[assessmentType] || [];
        const total = typeAssessments.length;
        const paginatedAssessments = typeAssessments.slice(skip, skip + limitNum);
        const totalPages = Math.ceil(total / limitNum);

        return ResponseHelper.success(
          'Assessments retrieved successfully',
          {
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages
            },
            assessments: paginatedAssessments,
            counts
          }
        );
      }

      // Return all assessments grouped by type
      this.logger.log(colors.green(`Found ${allAssessments.length} assessments for teacher`));
      return ResponseHelper.success(
        'Assessments retrieved successfully',
        {
          assessments: groupedAssessments,
          counts,
          total: allAssessments.length
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`Error getting all assessments: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get all questions for a specific assessment
   * @param assessmentId - ID of the assessment
   * @param userId - ID of the teacher
   */
  async getAssessmentQuestions(assessmentId: string, userId: string) {
    try {
      this.logger.log(colors.cyan(`Getting questions for assessment: ${assessmentId} by user: ${userId}`));

      // First verify the assessment exists and the teacher has access to it
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          created_by: userId
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Get all questions for this assessment with their options and correct answers
      const questions = await this.prisma.assessmentQuestion.findMany({
        where: {
          assessment_id: assessmentId
        },
        include: {
          options: {
            orderBy: {
              order: 'asc'
            }
          },
          correct_answers: true,
          _count: {
            select: {
              responses: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        }
      });

      this.logger.log(colors.green(`Found ${questions.length} questions for assessment: ${assessmentId}`));

      // Log detailed question information
      // questions.forEach((question, index) => {
      //   this.logger.log(colors.cyan(`\n📝 Question ${index + 1}:`));
      //   this.logger.log(colors.white(`   ID: ${question.id}`));
      //   this.logger.log(colors.white(`   Text: ${question.question_text}`));
      //   this.logger.log(colors.white(`   Type: ${question.question_type}`));
      //   this.logger.log(colors.white(`   Points: ${question.points}`));
      //   this.logger.log(colors.white(`   Order: ${question.order}`));
      //   this.logger.log(colors.white(`   Required: ${question.is_required}`));
      //   this.logger.log(colors.white(`   Difficulty: ${question.difficulty_level}`));
        
      //   // Always show media fields (even if null)
      //   this.logger.log(colors.blue(`   Image URL: ${question.image_url || 'null'}`));
      //   if (question.audio_url) {
      //     this.logger.log(colors.blue(`   Audio URL: ${question.audio_url}`));
      //   }
      //   if (question.video_url) {
      //     this.logger.log(colors.blue(`   Video URL: ${question.video_url}`));
      //   }
        
      //   if (question.options.length > 0) {
      //     this.logger.log(colors.yellow(`   Options (${question.options.length}):`));
      //     question.options.forEach((option, optIdx) => {
      //       const correctMarker = option.is_correct ? '✓' : '✗';
      //       this.logger.log(colors.white(`      ${optIdx + 1}. ${option.option_text} [${correctMarker}]`));
      //     });
      //   }
        
      //   if (question.correct_answers.length > 0) {
      //     this.logger.log(colors.green(`   Correct Answers: ${JSON.stringify(question.correct_answers)}`));
      //   }
        
      //   this.logger.log(colors.white(`   Total Responses: ${question._count.responses}`));
      // });

      return ResponseHelper.success(
        'Assessment questions retrieved successfully',
        {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            assessment_type: assessment.assessment_type,
            status: assessment.status,
            total_points: assessment.total_points,
            duration: assessment.duration,
            subject: assessment.subject,
            topic: assessment.topic
          },
          questions: questions.map(question => ({
            id: question.id,
            question_text: question.question_text,
            question_type: question.question_type,
            order: question.order,
            points: question.points,
            is_required: question.is_required,
            time_limit: question.time_limit,
            image_url: question.image_url,
            audio_url: question.audio_url,
            video_url: question.video_url,
            allow_multiple_attempts: question.allow_multiple_attempts,
            show_hint: question.show_hint,
            hint_text: question.hint_text,
            min_length: question.min_length,
            max_length: question.max_length,
            min_value: question.min_value,
            max_value: question.max_value,
            explanation: question.explanation,
            difficulty_level: question.difficulty_level,
            options: question.options.map(option => ({
              id: option.id,
              option_text: option.option_text,
              order: option.order,
              is_correct: option.is_correct,
              image_url: option.image_url,
              audio_url: option.audio_url
            })),
            correct_answers: question.correct_answers.map(answer => ({
              id: answer.id,
              answer_text: answer.answer_text,
              answer_number: answer.answer_number,
              answer_date: answer.answer_date,
              option_ids: answer.option_ids,
              answer_json: answer.answer_json
            })),
            total_responses: question._count.responses,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt
          })),
          total_questions: questions.length,
          total_points: questions.reduce((sum, q) => sum + q.points, 0)
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`Error getting assessment questions: ${error.message}`));
      throw error;
    }
  }

  /**
   * Upload an image for a question (separate endpoint)
   * @param assessmentId - ID of the assessment
   * @param imageFile - Image file to upload
   * @param userId - ID of the teacher
   */
  async uploadQuestionImage(assessmentId: string, imageFile: Express.Multer.File, userId: string) {
    try {
      this.logger.log(colors.cyan(`Uploading question image for assessment: ${assessmentId} by user: ${userId}`));

      // Verify the assessment exists and the teacher has access to it
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          created_by: userId
        },
        include: {
          school: {
            select: {
              id: true
            }
          }
        }
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Validate image file type
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(imageFile.mimetype)) {
        throw new BadRequestException('Invalid image file type. Allowed types: JPEG, PNG, GIF, WEBP');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        throw new BadRequestException('Image file size exceeds 5MB limit');
      }

      // Upload to S3
      const s3Folder = `assessment-images/schools/${assessment.school.id}/assessments/${assessmentId}`;
      const fileName = `question_${Date.now()}_${imageFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      try {
        const uploadResult = await this.storageService.uploadFile(imageFile, s3Folder, fileName);
        this.logger.log(colors.green(`✅ Image uploaded to S3: ${uploadResult.key}`));

        return ResponseHelper.success(
          'Image uploaded successfully',
          {
            image_url: uploadResult.url,
            image_s3_key: uploadResult.key
          },
          201
        );
      } catch (s3Error) {
        this.logger.error(colors.red(`❌ Failed to upload image to S3: ${s3Error.message}`));
        throw new BadRequestException(`Failed to upload image: ${s3Error.message}`);
      }
    } catch (error) {
      this.logger.error(colors.red(`Error uploading question image: ${error.message}`));
      throw error;
    }
  }

  /**
   * Create question with image in a single atomic operation (RECOMMENDED)
   * Uploads image, creates question, and rolls back image if question creation fails
   * @param assessmentId - ID of the assessment
   * @param questionDataString - JSON string of question data
   * @param imageFile - Optional image file
   * @param userId - ID of the teacher
   */
  async createQuestionWithImage(
    assessmentId: string, 
    questionDataString: string, 
    imageFile: Express.Multer.File | undefined,
    userId: string
  ) {
    let uploadedImageKey: string | undefined;
    
    try {
      this.logger.log(colors.cyan(`Creating question with image for assessment: ${assessmentId}`));
      
      // Parse question data from JSON string
      let createQuestionDto: CreateAssessmentQuestionDto;
      try {
        createQuestionDto = JSON.parse(questionDataString);
      } catch (parseError) {
        throw new BadRequestException('Invalid JSON in questionData field');
      }
      
      // Verify assessment exists and teacher has access
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          created_by: userId
        },
        include: {
          school: {
            select: {
              id: true
            }
          }
        }
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if assessment allows modifications
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot add questions to a closed or archived assessment');
      }
      
      // Upload image to S3 if provided
      if (imageFile) {
        this.logger.log(colors.blue(`📤 Uploading image: ${imageFile.originalname}`));
        
        // Validate image
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(imageFile.mimetype)) {
          throw new BadRequestException('Invalid image file type. Allowed: JPEG, PNG, GIF, WEBP');
        }
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          throw new BadRequestException('Image file size exceeds 5MB limit');
        }
        
        // Upload to S3
        const s3Folder = `assessment-images/schools/${assessment.school.id}/assessments/${assessmentId}`;
        const fileName = `question_${Date.now()}_${imageFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        try {
          const uploadResult = await this.storageService.uploadFile(imageFile, s3Folder, fileName);
          uploadedImageKey = uploadResult.key;
          
          // Add image data to DTO
          createQuestionDto.image_url = uploadResult.url;
          createQuestionDto.image_s3_key = uploadResult.key;
          
          this.logger.log(colors.green(`✅ Image uploaded: ${uploadResult.key}`));
        } catch (uploadError) {
          this.logger.error(colors.red(`❌ Image upload failed: ${uploadError.message}`));
          throw new BadRequestException(`Failed to upload image: ${uploadError.message}`);
        }
      }
      
      // Create question in database
      try {
        const question = await this.createQuestion(assessmentId, createQuestionDto, userId);
        this.logger.log(colors.green(`✅ Question created successfully with image`));
        return question;
      } catch (questionError) {
        // Question creation failed - rollback image upload
        if (uploadedImageKey) {
          this.logger.warn(colors.yellow(`⚠️  Question creation failed. Rolling back image upload: ${uploadedImageKey}`));
          try {
            await this.storageService.deleteFile(uploadedImageKey);
            this.logger.log(colors.green(`✅ Orphaned image deleted from S3`));
          } catch (deleteError) {
            this.logger.error(colors.red(`❌ Failed to delete orphaned image: ${deleteError.message}`));
            // Continue throwing the original error
          }
        }
        throw questionError;
      }
      
    } catch (error) {
      this.logger.error(colors.red(`❌ Error in createQuestionWithImage: ${error.message}`));
      throw error;
    }
  }

  /**
   * Create a new question for an assessment
   * @param assessmentId - ID of the assessment
   * @param createQuestionDto - Question data (includes image_url if image was uploaded separately)
   * @param userId - ID of the teacher
   */
  async createQuestion(assessmentId: string, createQuestionDto: CreateAssessmentQuestionDto, userId: string) {
    try {
      this.logger.log(colors.cyan(`Creating question for assessment: ${assessmentId} by user: ${userId}`));

      // First verify the assessment exists and the teacher has access to it
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          created_by: userId
        },
        include: {
          school: {
            select: {
              id: true
            }
          }
        }
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if the assessment is in a state that allows adding questions
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot add questions to a closed or archived assessment');
      }

      // Extract image_url and image_s3_key from DTO if provided
      let imageUrl: string | undefined = createQuestionDto.image_url;
      let imageS3Key: string | undefined = createQuestionDto.image_s3_key;

      // If image_s3_key not provided but image_url is, try to extract it from the URL
      if (imageUrl && !imageS3Key) {
        // Extract S3 key from URL if it's an S3 URL
        // Format: https://bucket.s3.region.amazonaws.com/key
        const s3UrlMatch = imageUrl.match(/https:\/\/[^/]+\.s3\.[^/]+\/(.+)$/);
        if (s3UrlMatch) {
          imageS3Key = s3UrlMatch[1];
        }
      }

      // Auto-calculate the next available order if not provided or if the provided order already exists
      let questionOrder = createQuestionDto.order;
      
      if (!questionOrder) {
        // If no order provided, get the highest order and add 1
        const lastQuestion = await this.prisma.assessmentQuestion.findFirst({
          where: { assessment_id: assessmentId },
          orderBy: { order: 'desc' }
        });
        questionOrder = lastQuestion ? lastQuestion.order + 1 : 1;
      } else {
        // If order is provided, check if it already exists
        const existingQuestion = await this.prisma.assessmentQuestion.findFirst({
          where: {
            assessment_id: assessmentId,
            order: questionOrder
          }
        });

        if (existingQuestion) {
          // If the provided order exists, find the next available order
          const lastQuestion = await this.prisma.assessmentQuestion.findFirst({
            where: { assessment_id: assessmentId },
            orderBy: { order: 'desc' }
          });
          questionOrder = lastQuestion ? lastQuestion.order + 1 : 1;
          this.logger.log(colors.yellow(`Order ${createQuestionDto.order} already exists, auto-assigning order ${questionOrder}`));
        }
      }

      // Create the question with options and correct answers in a transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create the question
        const question = await prisma.assessmentQuestion.create({
          data: {
            assessment_id: assessmentId,
            question_text: createQuestionDto.question_text,
            question_type: createQuestionDto.question_type,
            order: questionOrder,
            points: createQuestionDto.points || 1.0,
            is_required: createQuestionDto.is_required !== undefined ? createQuestionDto.is_required : true,
            time_limit: createQuestionDto.time_limit,
            image_url: imageUrl ?? undefined,
            image_s3_key: imageS3Key ?? undefined,
            audio_url: createQuestionDto.audio_url,
            video_url: createQuestionDto.video_url,
            allow_multiple_attempts: createQuestionDto.allow_multiple_attempts || false,
            show_hint: createQuestionDto.show_hint || false,
            hint_text: createQuestionDto.hint_text,
            min_length: createQuestionDto.min_length,
            max_length: createQuestionDto.max_length,
            min_value: createQuestionDto.min_value,
            max_value: createQuestionDto.max_value,
            explanation: createQuestionDto.explanation,
            difficulty_level: createQuestionDto.difficulty_level || 'MEDIUM'
          }
        });

        // Create options if provided
        let options: any[] = [];
        if (createQuestionDto.options && createQuestionDto.options.length > 0) {
          options = await Promise.all(
            createQuestionDto.options.map(async (optionData: any) => {
              return await prisma.assessmentOption.create({
                data: {
                  question_id: question.id,
                  option_text: optionData.option_text,
                  order: optionData.order,
                  is_correct: optionData.is_correct,
                  image_url: optionData.image_url,
                  audio_url: optionData.audio_url
                }
              });
            })
          );
        }

        // Create correct answers if provided
        let correctAnswers: any[] = [];
        if (createQuestionDto.correct_answers && createQuestionDto.correct_answers.length > 0) {
          correctAnswers = await Promise.all(
            createQuestionDto.correct_answers.map(async (answerData: any) => {
              return await prisma.assessmentCorrectAnswer.create({
                data: {
                  question_id: question.id,
                  answer_text: answerData.answer_text,
                  answer_number: answerData.answer_number,
                  answer_date: answerData.answer_date ? new Date(answerData.answer_date) : null,
                  option_ids: answerData.option_ids || [],
                  answer_json: answerData.answer_json
                }
              });
            })
          );
        }

        return { question, options, correctAnswers };
      });

      // Update the assessment's total points
      const totalPoints = await this.prisma.assessmentQuestion.aggregate({
        where: { assessment_id: assessmentId },
        _sum: { points: true }
      });

      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: { total_points: totalPoints._sum?.points || 0 }
      });

      this.logger.log(colors.green(`Question created successfully with ID: ${result.question.id}`));

      return ResponseHelper.success(
        'Question created successfully',
        {
          question: {
            id: result.question.id,
            question_text: result.question.question_text,
            question_type: result.question.question_type,
            order: result.question.order,
            points: result.question.points,
            is_required: result.question.is_required,
            time_limit: result.question.time_limit,
            image_url: result.question.image_url,
            audio_url: result.question.audio_url,
            video_url: result.question.video_url,
            allow_multiple_attempts: result.question.allow_multiple_attempts,
            show_hint: result.question.show_hint,
            hint_text: result.question.hint_text,
            min_length: result.question.min_length,
            max_length: result.question.max_length,
            min_value: result.question.min_value,
            max_value: result.question.max_value,
            explanation: result.question.explanation,
            difficulty_level: result.question.difficulty_level,
            createdAt: result.question.createdAt,
            updatedAt: result.question.updatedAt
          },
          options: result.options.map(option => ({
            id: option.id,
            option_text: option.option_text,
            order: option.order,
            is_correct: option.is_correct,
            image_url: option.image_url,
            audio_url: option.audio_url
          })),
          correct_answers: result.correctAnswers.map(answer => ({
            id: answer.id,
            answer_text: answer.answer_text,
            answer_number: answer.answer_number,
            answer_date: answer.answer_date,
            option_ids: answer.option_ids,
            answer_json: answer.answer_json
          })),
          assessment: {
            id: assessment.id,
            title: assessment.title,
            total_points: totalPoints._sum?.points || 0
          }
        },
        201
      );

    } catch (error) {
      this.logger.error(colors.red(`Error creating question: ${error.message}`));
      throw error;
    }
  }

  /**
   * Update a specific question in an assessment
   * @param assessmentId - ID of the assessment
   * @param questionId - ID of the question
   * @param updateQuestionDto - Updated question data
   * @param userId - ID of the teacher
   * @param imageFile - Optional image file to upload (replaces existing image)
   */
  async updateQuestion(assessmentId: string, questionId: string, updateQuestionDto: any, userId: string, imageFile?: Express.Multer.File) {
    try {
      this.logger.log(colors.cyan(`Updating question: ${questionId} in assessment: ${assessmentId} by user: ${userId}`));

      // First verify the assessment exists and the teacher has access to it
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          created_by: userId
        },
        include: {
          school: {
            select: {
              id: true
            }
          }
        }
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if the assessment is in a state that allows editing questions
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot edit questions in a closed or archived assessment');
      }

      // Verify the question exists and belongs to this assessment
      const existingQuestion = await this.prisma.assessmentQuestion.findFirst({
        where: {
          id: questionId,
          assessment_id: assessmentId
        }
      });

      if (!existingQuestion) {
        throw new NotFoundException('Question not found in this assessment');
      }

      // Handle image upload/replacement if new image file is provided
      let imageUrl: string | undefined = updateQuestionDto.image_url;
      let imageS3Key: string | undefined = existingQuestion.image_s3_key ?? undefined;
      let oldImageS3Key: string | undefined = existingQuestion.image_s3_key ?? undefined;

      if (imageFile) {
        // Validate image file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(imageFile.mimetype)) {
          throw new BadRequestException('Invalid image file type. Allowed types: JPEG, PNG, GIF, WEBP');
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          throw new BadRequestException('Image file size exceeds 5MB limit');
        }

        // Upload new image to S3
        const s3Folder = `assessment-images/schools/${assessment.school.id}/assessments/${assessmentId}`;
        const fileName = `question_${Date.now()}_${imageFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        try {
          const uploadResult = await this.storageService.uploadFile(imageFile, s3Folder, fileName);
          imageUrl = uploadResult.url;
          imageS3Key = uploadResult.key;
          this.logger.log(colors.green(`✅ New image uploaded to S3: ${imageS3Key}`));
        } catch (s3Error) {
          this.logger.error(colors.red(`❌ Failed to upload image to S3: ${s3Error.message}`));
          throw new BadRequestException(`Failed to upload image: ${s3Error.message}`);
        }
      } else if (updateQuestionDto.image_url === null || updateQuestionDto.image_url === '') {
        // If image_url is explicitly set to null/empty, remove the image
        imageUrl = undefined;
        imageS3Key = undefined;
        oldImageS3Key = existingQuestion.image_s3_key ?? undefined;
      }

      // If order is being changed, check for conflicts
      if (updateQuestionDto.order && updateQuestionDto.order !== existingQuestion.order) {
        const conflictingQuestion = await this.prisma.assessmentQuestion.findFirst({
          where: {
            assessment_id: assessmentId,
            order: updateQuestionDto.order,
            id: { not: questionId }
          }
        });

        if (conflictingQuestion) {
          throw new BadRequestException(`A question with order ${updateQuestionDto.order} already exists in this assessment`);
        }
      }

      // Update the question with options and correct answers in a transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Prepare update data
        const updateData: any = {
          question_text: updateQuestionDto.question_text,
          question_type: updateQuestionDto.question_type,
          order: updateQuestionDto.order,
          points: updateQuestionDto.points,
          is_required: updateQuestionDto.is_required,
          time_limit: updateQuestionDto.time_limit,
          audio_url: updateQuestionDto.audio_url,
          video_url: updateQuestionDto.video_url,
          allow_multiple_attempts: updateQuestionDto.allow_multiple_attempts,
          show_hint: updateQuestionDto.show_hint,
          hint_text: updateQuestionDto.hint_text,
          min_length: updateQuestionDto.min_length,
          max_length: updateQuestionDto.max_length,
          min_value: updateQuestionDto.min_value,
          max_value: updateQuestionDto.max_value,
          explanation: updateQuestionDto.explanation,
          difficulty_level: updateQuestionDto.difficulty_level
        };

        // Only update image fields if they've changed
        if (imageFile || updateQuestionDto.image_url === null || updateQuestionDto.image_url === '') {
          updateData.image_url = imageUrl;
          updateData.image_s3_key = imageS3Key;
        } else if (updateQuestionDto.image_url !== undefined) {
          updateData.image_url = updateQuestionDto.image_url;
        }

        // Update the question
        const updatedQuestion = await prisma.assessmentQuestion.update({
          where: { id: questionId },
          data: updateData
        });

        // Handle options update if provided
        let options: any[] = [];
        if (updateQuestionDto.options !== undefined) {
          // Delete existing options
          await prisma.assessmentOption.deleteMany({
            where: { question_id: questionId }
          });

          // Create new options if provided
          if (updateQuestionDto.options.length > 0) {
            options = await Promise.all(
              updateQuestionDto.options.map(async (optionData: any) => {
                return await prisma.assessmentOption.create({
                  data: {
                    question_id: questionId,
                    option_text: optionData.option_text,
                    order: optionData.order,
                    is_correct: optionData.is_correct,
                    image_url: optionData.image_url,
                    audio_url: optionData.audio_url
                  }
                });
              })
            );
          }
        } else {
          // Keep existing options
          options = await prisma.assessmentOption.findMany({
            where: { question_id: questionId },
            orderBy: { order: 'asc' }
          });
        }

        // Handle correct answers update if provided
        let correctAnswers: any[] = [];
        if (updateQuestionDto.correct_answers !== undefined) {
          // Delete existing correct answers
          await prisma.assessmentCorrectAnswer.deleteMany({
            where: { question_id: questionId }
          });

          // Create new correct answers if provided
          if (updateQuestionDto.correct_answers.length > 0) {
            correctAnswers = await Promise.all(
              updateQuestionDto.correct_answers.map(async (answerData: any) => {
                return await prisma.assessmentCorrectAnswer.create({
                  data: {
                    question_id: questionId,
                    answer_text: answerData.answer_text,
                    answer_number: answerData.answer_number,
                    answer_date: answerData.answer_date ? new Date(answerData.answer_date) : null,
                    option_ids: answerData.option_ids || [],
                    answer_json: answerData.answer_json
                  }
                });
              })
            );
          }
        } else {
          // Keep existing correct answers
          correctAnswers = await prisma.assessmentCorrectAnswer.findMany({
            where: { question_id: questionId }
          });
        }

        return { question: updatedQuestion, options, correctAnswers };
      });

      // Delete old image from S3 if it was replaced
      if (oldImageS3Key && imageS3Key !== oldImageS3Key) {
        try {
          await this.storageService.deleteFile(oldImageS3Key);
          this.logger.log(colors.green(`🗑️ Old image deleted from S3: ${oldImageS3Key}`));
        } catch (deleteError) {
          // Log error but don't fail the update
          this.logger.error(colors.yellow(`⚠️ Failed to delete old image from S3: ${deleteError.message}`));
        }
      }

      // Update the assessment's total points
      const totalPoints = await this.prisma.assessmentQuestion.aggregate({
        where: { assessment_id: assessmentId },
        _sum: { points: true }
      });

      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: { total_points: totalPoints._sum?.points || 0 }
      });

      this.logger.log(colors.green(`Question updated successfully: ${questionId}`));

      return ResponseHelper.success(
        'Question updated successfully',
        {
          question: {
            id: result.question.id,
            question_text: result.question.question_text,
            question_type: result.question.question_type,
            order: result.question.order,
            points: result.question.points,
            is_required: result.question.is_required,
            time_limit: result.question.time_limit,
            image_url: result.question.image_url,
            audio_url: result.question.audio_url,
            video_url: result.question.video_url,
            allow_multiple_attempts: result.question.allow_multiple_attempts,
            show_hint: result.question.show_hint,
            hint_text: result.question.hint_text,
            min_length: result.question.min_length,
            max_length: result.question.max_length,
            min_value: result.question.min_value,
            max_value: result.question.max_value,
            explanation: result.question.explanation,
            difficulty_level: result.question.difficulty_level,
            createdAt: result.question.createdAt,
            updatedAt: result.question.updatedAt
          },
          options: result.options.map(option => ({
            id: option.id,
            option_text: option.option_text,
            order: option.order,
            is_correct: option.is_correct,
            image_url: option.image_url,
            audio_url: option.audio_url
          })),
          correct_answers: result.correctAnswers.map(answer => ({
            id: answer.id,
            answer_text: answer.answer_text,
            answer_number: answer.answer_number,
            answer_date: answer.answer_date,
            option_ids: answer.option_ids,
            answer_json: answer.answer_json
          })),
          assessment: {
            id: assessment.id,
            title: assessment.title,
            total_points: totalPoints._sum?.points || 0
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`Error updating question: ${error.message}`));
      throw error;
    }
  }

  /**
   * Delete the image for a specific question
   * @param assessmentId - ID of the assessment
   * @param questionId - ID of the question
   * @param userId - ID of the teacher
   */
  async deleteQuestionImage(assessmentId: string, questionId: string, userId: string) {
    try {
      this.logger.log(colors.cyan(`Deleting image for question: ${questionId}`));

      // First verify the assessment exists and the teacher has access to it
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          created_by: userId
        }
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if the assessment is in a state that allows editing questions
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot edit questions in a closed or archived assessment');
      }

      // Verify the question exists and belongs to this assessment
      const existingQuestion = await this.prisma.assessmentQuestion.findFirst({
        where: {
          id: questionId,
          assessment_id: assessmentId
        },
        select: {
          id: true,
          image_s3_key: true,
          image_url: true
        }
      });

      if (!existingQuestion) {
        throw new NotFoundException('Question not found in this assessment');
      }

      // Check if the question has an image
      if (!existingQuestion.image_s3_key && !existingQuestion.image_url) {
        throw new BadRequestException('Question does not have an image to delete');
      }

      // Delete the image from S3 if S3 key exists
      if (existingQuestion.image_s3_key) {
        try {
          await this.storageService.deleteFile(existingQuestion.image_s3_key);
          this.logger.log(colors.green(`✅ Image deleted from S3: ${existingQuestion.image_s3_key}`));
        } catch (s3Error) {
          // Log error but don't fail - the image might already be deleted
          this.logger.warn(colors.yellow(`⚠️ Failed to delete image from S3 (may already be deleted): ${s3Error.message}`));
        }
      }

      // Update the question to remove image_url and image_s3_key
      await this.prisma.assessmentQuestion.update({
        where: { id: questionId },
        data: {
          image_url: null,
          image_s3_key: null
        }
      });

      this.logger.log(colors.green(`Image deleted successfully for question: ${questionId}`));

      return ResponseHelper.success(
        'Question image deleted successfully',
        {
          question_id: questionId,
          image_deleted: true
        },
        200
      );

    } catch (error) {
      this.logger.error(colors.red(`Error deleting question image: ${error.message}`));
      throw error;
    }
  }

  /**
   * Delete a specific question from an assessment
   * @param assessmentId - ID of the assessment
   * @param questionId - ID of the question
   * @param userId - ID of the teacher
   */
  async deleteQuestion(assessmentId: string, questionId: string, userId: string) {
    try {
      this.logger.log(colors.cyan(`Deleting question: ${questionId} from assessment: ${assessmentId} by user: ${userId}`));

      // First verify the assessment exists and the teacher has access to it
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          created_by: userId
        }
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if the assessment is in a state that allows deleting questions
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot delete questions from a closed or archived assessment');
      }

      // Verify the question exists and belongs to this assessment
      const existingQuestion = await this.prisma.assessmentQuestion.findFirst({
        where: {
          id: questionId,
          assessment_id: assessmentId
        },
        select: {
          id: true,
          question_text: true,
          order: true,
          points: true,
          image_s3_key: true,
          _count: {
            select: {
              responses: true
            }
          }
        }
      });

      if (!existingQuestion) {
        throw new NotFoundException('Question not found in this assessment');
      }

      // Check if the question has any student responses
      if (existingQuestion._count.responses > 0) {
        throw new BadRequestException('Cannot delete question that has student responses. Consider archiving the assessment instead.');
      }

      // Store S3 key for deletion after question is deleted
      const imageS3Key = existingQuestion.image_s3_key;

      // Delete the question and all related data in a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Delete correct answers first (due to foreign key constraints)
        await prisma.assessmentCorrectAnswer.deleteMany({
          where: { question_id: questionId }
        });

        // Delete options
        await prisma.assessmentOption.deleteMany({
          where: { question_id: questionId }
        });

        // Delete the question
        await prisma.assessmentQuestion.delete({
          where: { id: questionId }
        });
      });

      // Update the assessment's total points
      const totalPoints = await this.prisma.assessmentQuestion.aggregate({
        where: { assessment_id: assessmentId },
        _sum: { points: true }
      });

      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: { total_points: totalPoints._sum?.points || 0 }
      });

      // Delete associated image from S3 if it exists
      if (imageS3Key) {
        try {
          await this.storageService.deleteFile(imageS3Key);
          this.logger.log(colors.green(`🗑️ Image deleted from S3: ${imageS3Key}`));
        } catch (deleteError) {
          // Log error but don't fail the deletion
          this.logger.error(colors.yellow(`⚠️ Failed to delete image from S3: ${deleteError.message}`));
        }
      }

      this.logger.log(colors.green(`Question deleted successfully: ${questionId}`));

      return ResponseHelper.success(
        'Question deleted successfully',
        {
          deleted_question: {
            id: questionId,
            question_text: existingQuestion.question_text,
            order: existingQuestion.order,
            points: existingQuestion.points
          },
          assessment: {
            id: assessment.id,
            title: assessment.title,
            total_points: totalPoints._sum?.points || 0
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`Error deleting question: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get all assessments for a specific topic
   * @param topicId - ID of the topic
   * @param userId - ID of the user (teacher)
   * @param schoolId - ID of the school
   */
  async getTopicQuizzes(topicId: string, userId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Getting quizzes for topic: ${topicId}`));

      // Get teacher record
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Verify teacher has access to the topic
      await this.verifyTeacherTopicAccess(topicId, teacher.id, schoolId);

      const quizzes = await this.prisma.assessment.findMany({
        where: {
          topic_id: topicId,
          school_id: schoolId,
        },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          _count: {
            select: {
              questions: true,
              attempts: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      this.logger.log(colors.green(`Found ${quizzes.length} quizzes for topic`));
      return ResponseHelper.success('Topic quizzes retrieved successfully', quizzes);
    } catch (error) {
      this.logger.error(colors.red(`Error getting topic quizzes: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get a specific quiz by ID
   * @param quizId - ID of the quiz
   * @param userId - ID of the user (teacher)
   */
  async getQuizById(quizId: string, userId: string) {
    try {
      this.logger.log(colors.cyan(`Getting quiz: ${quizId}`));

      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const quiz = await this.prisma.assessment.findFirst({
        where: {
          id: quizId,
          created_by: userId
        },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          questions: {
            include: {
              options: true,
              correct_answers: true,
              _count: {
                select: {
                  responses: true
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          },
          _count: {
            select: {
              attempts: true
            }
          }
        }
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found or access denied');
      }

      this.logger.log(colors.green(`Quiz retrieved successfully: ${quiz.title}`));
      return ResponseHelper.success('Quiz retrieved successfully', quiz);
    } catch (error) {
      this.logger.error(colors.red(`Error getting quiz: ${error.message}`));
      throw error;
    }
  }

  /**
   * Update a quiz
   * @param quizId - ID of the quiz
   * @param updateQuizDto - Update data
   * @param userId - ID of the user (teacher)
   */
  async updateQuiz(
    quizId: string,
    updateQuizDto: UpdateAssessmentDto,
    userId: string
  ) {
    try {
      // Log exactly what the user is sending for update
      this.logger.log(colors.cyan(`Updating assessment: ${quizId}`));
      this.logger.log(colors.yellow(`Update payload received: ${JSON.stringify(updateQuizDto, null, 2)}`));

      // Get teacher record to access school and academic session
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Verify quiz exists and teacher has access
      const existingQuiz = await this.prisma.assessment.findFirst({
        where: {
          id: quizId,
          school_id: teacher.school_id,
          created_by: userId
        }
      });

      if (!existingQuiz) {
        this.logger.error(colors.red(`Assessment not found or access denied: ${quizId}`));
        throw new NotFoundException('Assessment not found or access denied');
      }

      // If subject is being changed, verify access to new subject
      if (updateQuizDto.subject_id && updateQuizDto.subject_id !== existingQuiz.subject_id) {
        await this.verifyTeacherSubjectAccess(updateQuizDto.subject_id, userId);
      }

      // If topic is being changed, verify access to new topic
      if (updateQuizDto.topic_id && updateQuizDto.topic_id !== existingQuiz.topic_id) {
        await this.verifyTeacherTopicAccess(updateQuizDto.topic_id, teacher.id, teacher.school_id);
      }

      // Check if quiz has attempts and is being changed to a state that would affect students
      if (updateQuizDto.status && ['CLOSED', 'ARCHIVED'].includes(updateQuizDto.status)) {
        const attemptCount = await this.prisma.assessmentAttempt.count({
          where: { assessment_id: quizId }
        });

        if (attemptCount > 0) {
          this.logger.warn(colors.yellow(`Assessment ${quizId} has ${attemptCount} attempts but status is being changed to ${updateQuizDto.status}`));
        }
      }

      const updateData: any = { ...updateQuizDto };
      
      // Convert date strings to Date objects
      if (updateQuizDto.start_date) {
        updateData.start_date = new Date(updateQuizDto.start_date);
      }
      if (updateQuizDto.end_date) {
        updateData.end_date = new Date(updateQuizDto.end_date);
      }

      // Track status changes for notifications
      const wasPublished = existingQuiz.status === 'ACTIVE' || existingQuiz.status === 'PUBLISHED' || existingQuiz.is_published;
      const isBeingUnpublished = updateQuizDto.status === 'DRAFT' && wasPublished;
      const isBeingPublished = (updateQuizDto.status === 'PUBLISHED' || updateQuizDto.status === 'ACTIVE') && !wasPublished;

      // If status is being changed to PUBLISHED/ACTIVE, set published_at
      if (isBeingPublished) {
        updateData.is_published = true;
        updateData.published_at = new Date();
        if (!updateData.status) {
          updateData.status = 'ACTIVE';
        }
      }

      // If status is being changed to DRAFT, set is_published to false
      if (isBeingUnpublished) {
        updateData.is_published = false;
      }

      const quiz = await this.prisma.assessment.update({
        where: { id: quizId },
        data: updateData,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          _count: {
            select: {
              questions: true,
              attempts: true
            }
          }
        }
      });

      this.logger.log(colors.green(`Assessment updated successfully: ${quiz.title}`));

      // Send notifications if status changed
      if (isBeingPublished) {
        try {
          await this.assessmentNotificationsService.sendAssessmentPublishedNotifications(quiz, teacher.school_id);
        } catch (notificationError) {
          this.logger.error(colors.yellow(`⚠️ Failed to send published notifications: ${notificationError.message}`));
        }
      } else if (isBeingUnpublished) {
        try {
          await this.assessmentNotificationsService.sendAssessmentUnpublishedNotifications(quiz, teacher.school_id);
        } catch (notificationError) {
          this.logger.error(colors.yellow(`⚠️ Failed to send unpublished notifications: ${notificationError.message}`));
        }
      }

      return ResponseHelper.success('Assessment updated successfully', quiz);
    } catch (error) {
      this.logger.error(colors.red(`Error updating assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Delete a quiz
   * @param quizId - ID of the quiz
   * @param userId - ID of the user (teacher)
   * @param schoolId - ID of the school
   */
  async deleteQuiz(quizId: string, userId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Deleting Assessment: ${quizId}`));

      // Get teacher record
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Verify quiz exists and teacher has access
      const existingQuiz = await this.prisma.assessment.findFirst({
        where: {
          id: quizId,
          school_id: schoolId,
          created_by: userId
        }
      });

      if (!existingQuiz) {
        throw new NotFoundException('Assessment not found or access denied');
      }

      // Check if quiz has attempts (prevent deletion if students have taken it)
      const attemptCount = await this.prisma.assessmentAttempt.count({
        where: { assessment_id: quizId }
      });

      if (attemptCount > 0) {
        throw new BadRequestException('Cannot delete assessment that has student attempts. Consider archiving instead.');
      }

      await this.prisma.assessment.delete({
        where: { id: quizId }
      });

      this.logger.log(colors.green(`Assessment deleted successfully: ${quizId}`));
      return ResponseHelper.success('Assessment deleted successfully');
    } catch (error) {
      this.logger.error(colors.red(`Error deleting assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Publish a quiz (make it available to students)
   * @param quizId - ID of the quiz
   * @param userId - ID of the user (teacher)
   * @param schoolId - ID of the school
   */
  async publishQuiz(quizId: string, userId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Publishing quiz: ${quizId}`));

      // Get teacher record
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Verify quiz exists and teacher has access
      const existingQuiz = await this.prisma.assessment.findFirst({
        where: {
          id: quizId,
          school_id: schoolId,
          created_by: userId
        },
        include: {
          questions: true
        }
      });

      if (!existingQuiz) {
        this.logger.error(colors.red(`Quiz not found or access denied: ${quizId}`));
        throw new NotFoundException('Quiz not found or access denied');
      }

      // Check if quiz has questions
      if (existingQuiz.questions.length === 0) {
        this.logger.error(colors.red(`Quiz ${quizId} has no questions`));
        throw new BadRequestException('Cannot publish quiz without questions');
      }

      const quiz = await this.prisma.assessment.update({
        where: { id: quizId },
        data: {
          status: 'ACTIVE',
          is_published: true,
          published_at: new Date()
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      this.logger.log(colors.green(`Quiz published successfully: ${quiz.title}`));

      // Send push notifications and emails to students enrolled in classes with this subject
      try {
        await this.assessmentNotificationsService.sendAssessmentPublishedNotifications(quiz, schoolId);
      } catch (notificationError) {
        // Log error but don't fail the publish operation
        this.logger.error(colors.yellow(`⚠️ Failed to send notifications: ${notificationError.message}`));
      }

      return ResponseHelper.success('Quiz published successfully', quiz);
    } catch (error) {
      this.logger.error(colors.red(`Error publishing quiz: ${error.message}`));
      throw error;
    }
  }

  /**
   * Unpublish a quiz (make it unavailable to students)
   * @param quizId - ID of the quiz
   * @param userId - ID of the user (teacher)
   * @param schoolId - ID of the school
   */
  async unpublishQuiz(quizId: string, userId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Unpublishing quiz: ${quizId}`));

      // Get teacher record
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Verify quiz exists and teacher has access
      const existingQuiz = await this.prisma.assessment.findFirst({
        where: {
          id: quizId,
          school_id: schoolId,
          created_by: userId
        }
      });

      if (!existingQuiz) {
        this.logger.error(colors.red(`Quiz not found or access denied: ${quizId}`));
        throw new NotFoundException('Quiz not found or access denied');
      }

      const quiz = await this.prisma.assessment.update({
        where: { id: quizId },
        data: {
          status: 'DRAFT',
          is_published: false
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      this.logger.log(colors.green(`Quiz unpublished successfully: ${quiz.title}`));

      // Send push notifications and emails to students enrolled in classes with this subject
      try {
        await this.assessmentNotificationsService.sendAssessmentUnpublishedNotifications(quiz, schoolId);
      } catch (notificationError) {
        // Log error but don't fail the unpublish operation
        this.logger.error(colors.yellow(`⚠️ Failed to send notifications: ${notificationError.message}`));
      }

      return ResponseHelper.success('Quiz unpublished successfully', quiz);
    } catch (error) {
      this.logger.error(colors.red(`Error unpublishing quiz: ${error.message}`));
      throw error;
    }
  }

  /**
   * Release assessment results and close the assessment
   * @param quizId - ID of the quiz
   * @param userId - ID of the user (teacher)
   * @param schoolId - ID of the school
   */
  async releaseAssessmentResults(quizId: string, userId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Releasing results for assessment: ${quizId}`));

      // Get teacher record
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Verify quiz exists and teacher has access
      const existingQuiz = await this.prisma.assessment.findFirst({
        where: {
          id: quizId,
          school_id: schoolId,
          created_by: userId
        }
      });

      if (!existingQuiz) {
        this.logger.error(colors.red(`Quiz not found or access denied: ${quizId}`));
        throw new NotFoundException('Quiz not found or access denied');
      }

      // Check if results are already released
      if (existingQuiz.is_result_released) {
        this.logger.warn(colors.yellow(`Results already released for assessment: ${quizId}`));
        return ResponseHelper.success('Results already released', existingQuiz);
      }

      // Update assessment: release results and close it
      const quiz = await this.prisma.assessment.update({
        where: { id: quizId },
        data: {
          is_result_released: true,
          result_released_at: new Date(),
          status: 'CLOSED'
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      this.logger.log(colors.green(`✅ Results released and assessment closed: ${quiz.title}`));

      // Send push notifications and emails to students enrolled in classes with this subject
      try {
        await this.assessmentNotificationsService.sendAssessmentResultReleasedNotifications(quiz, schoolId);
      } catch (notificationError) {
        // Log error but don't fail the release operation
        this.logger.error(colors.yellow(`⚠️ Failed to send notifications: ${notificationError.message}`));
      }

      return ResponseHelper.success('Assessment results released successfully. Assessment has been closed.', quiz);
    } catch (error) {
      this.logger.error(colors.red(`Error releasing assessment results: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get all students and their attempts for an assessment
   * @param assessmentId - ID of the assessment
   * @param userId - ID of the teacher
   * @param schoolId - ID of the school
   */
  async getAssessmentAttempts(assessmentId: string, userId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Getting assessment attempts for: ${assessmentId}`));

      // Get teacher record
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Verify assessment exists and teacher has access
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: schoolId,
          created_by: userId
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!assessment) {
        this.logger.error(colors.red(`Assessment not found or access denied: ${assessmentId}`));
        throw new NotFoundException('Assessment not found or access denied');
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true
        }
      });

      if (!currentSession) {
        throw new NotFoundException('Current academic session not found');
      }

      // Find all classes that have this subject
      const classesWithSubject = await this.prisma.class.findMany({
        where: {
          schoolId: schoolId,
          academic_session_id: currentSession.id,
          subjects: {
            some: {
              id: assessment.subject_id,
              academic_session_id: currentSession.id
            }
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (classesWithSubject.length === 0) {
        return ResponseHelper.success('Assessment attempts retrieved successfully', {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            subject: assessment.subject,
            topic: assessment.topic
          },
          totalStudents: 0,
          studentsAttempted: 0,
          studentsNotAttempted: 0,
          classes: [],
          students: []
        });
      }

      const classIds = classesWithSubject.map(cls => cls.id);

      // Get all active students in these classes
      const allStudents = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          current_class_id: { in: classIds },
          status: 'active'
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true
            }
          },
          current_class: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          user: {
            last_name: 'asc'
          }
        }
      });

      // Get all attempts for this assessment
      const attempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          assessment_id: assessmentId,
          school_id: schoolId,
          academic_session_id: currentSession.id
        },
        select: {
          id: true,
          student_id: true,
          attempt_number: true,
          status: true,
          started_at: true,
          submitted_at: true,
          time_spent: true,
          total_score: true,
          max_score: true,
          percentage: true,
          passed: true,
          is_graded: true,
          graded_at: true,
          grade_letter: true,
          overall_feedback: true,
          createdAt: true
        },
        orderBy: {
          submitted_at: 'desc'
        }
      });

      // Create a map of student_id to attempts
      const attemptsByStudent = new Map<string, typeof attempts>();
      attempts.forEach(attempt => {
        if (!attemptsByStudent.has(attempt.student_id)) {
          attemptsByStudent.set(attempt.student_id, []);
        }
        attemptsByStudent.get(attempt.student_id)!.push(attempt);
      });

      // Combine students with their attempts
      const studentsWithAttempts = allStudents.map(student => {
        const studentAttempts = attemptsByStudent.get(student.user_id) || [];
        const latestAttempt = studentAttempts.length > 0 
          ? studentAttempts[0] // Most recent attempt (already sorted by submitted_at desc)
          : null;

        return {
          studentId: student.id,
          userId: student.user_id,
          studentNumber: student.student_id,
          firstName: student.user.first_name,
          lastName: student.user.last_name,
          email: student.user.email,
          displayPicture: student.user.display_picture,
          className: student.current_class?.name || 'Unknown',
          classId: student.current_class_id,
          hasAttempted: studentAttempts.length > 0,
          attemptCount: studentAttempts.length,
          latestAttempt: latestAttempt ? {
            id: latestAttempt.id,
            attemptNumber: latestAttempt.attempt_number,
            status: latestAttempt.status,
            startedAt: latestAttempt.started_at,
            submittedAt: latestAttempt.submitted_at,
            timeSpent: latestAttempt.time_spent,
            totalScore: latestAttempt.total_score,
            maxScore: latestAttempt.max_score,
            percentage: latestAttempt.percentage,
            passed: latestAttempt.passed,
            isGraded: latestAttempt.is_graded,
            gradedAt: latestAttempt.graded_at,
            gradeLetter: latestAttempt.grade_letter,
            overallFeedback: latestAttempt.overall_feedback,
            createdAt: latestAttempt.createdAt
          } : null,
          allAttempts: studentAttempts.map(attempt => ({
            id: attempt.id,
            attemptNumber: attempt.attempt_number,
            status: attempt.status,
            startedAt: attempt.started_at,
            submittedAt: attempt.submitted_at,
            timeSpent: attempt.time_spent,
            totalScore: attempt.total_score,
            maxScore: attempt.max_score,
            percentage: attempt.percentage,
            passed: attempt.passed,
            isGraded: attempt.is_graded,
            gradedAt: attempt.graded_at,
            gradeLetter: attempt.grade_letter,
            overallFeedback: attempt.overall_feedback,
            createdAt: attempt.createdAt
          }))
        };
      });

      // Calculate statistics
      const studentsAttempted = studentsWithAttempts.filter(s => s.hasAttempted).length;
      const studentsNotAttempted = allStudents.length - studentsAttempted;
      const totalAttempts = attempts.length;

      // Calculate average score
      const completedAttempts = attempts.filter(a => a.submitted_at && a.status === 'SUBMITTED');
      const averageScore = completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
        : 0;

      // Group by class
      const studentsByClass = studentsWithAttempts.reduce((acc, student) => {
        const className = student.className;
        if (!acc[className]) {
          acc[className] = [];
        }
        acc[className].push(student);
        return acc;
      }, {} as Record<string, typeof studentsWithAttempts>);

      const classesData = Object.entries(studentsByClass).map(([className, students]) => ({
        className,
        totalStudents: students.length,
        studentsAttempted: students.filter(s => s.hasAttempted).length,
        studentsNotAttempted: students.filter(s => !s.hasAttempted).length
      }));

      this.logger.log(colors.green(`✅ Retrieved attempts for ${allStudents.length} students, ${studentsAttempted} have attempted`));

      return ResponseHelper.success('Assessment attempts retrieved successfully', {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          subject: assessment.subject,
          topic: assessment.topic,
          totalPoints: assessment.total_points,
          passingScore: assessment.passing_score
        },
        statistics: {
          totalStudents: allStudents.length,
          studentsAttempted,
          studentsNotAttempted,
          totalAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          completionRate: allStudents.length > 0 
            ? Math.round((studentsAttempted / allStudents.length) * 100 * 100) / 100 
            : 0
        },
        classes: classesData,
        students: studentsWithAttempts
      });
    } catch (error) {
      this.logger.error(colors.red(`Error getting assessment attempts: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get a specific student's submission for an assessment
   * @param assessmentId - ID of the assessment
   * @param studentId - ID of the student (user_id)
   * @param userId - ID of the teacher
   * @param schoolId - ID of the school
   */
  async getStudentSubmission(assessmentId: string, studentId: string, userId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Getting student submission for assessment: ${assessmentId}, student: ${studentId}`));

      // Get teacher record
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Verify assessment exists and teacher has access
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: schoolId,
          created_by: userId
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!assessment) {
        this.logger.error(colors.red(`Assessment not found or access denied: ${assessmentId}`));
        throw new NotFoundException('Assessment not found or access denied');
      }

      this.logger.log(colors.green(`Assessment found`));

      // Verify student exists and belongs to the school
      // studentId is the Student record id, not the user_id
      this.logger.log(colors.cyan(`Looking for student with id: ${studentId}`));
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          school_id: schoolId
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true
            }
          },
          current_class: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!student) {
        this.logger.error(colors.red(`Student not found with id: ${studentId}`));
        throw new NotFoundException('Student not found');
      }

      this.logger.log(colors.green(`Student found: ${student.user.first_name} ${student.user.last_name} (user_id: ${student.user_id})`));

      // Get current academic session
      this.logger.log(colors.cyan(`Getting current academic session for school: ${schoolId}`));
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true
        }
      });

      if (!currentSession) {
        throw new NotFoundException('Current academic session not found');
      }

      this.logger.log(colors.green(`Current session found: ${currentSession.id}`));

      // Get all attempts for this student and assessment
      // Note: AssessmentAttempt.student_id is the User.id (user_id), not the Student record id
      this.logger.log(colors.cyan(`Fetching attempts for assessment: ${assessmentId}, user_id: ${student.user_id}`));
      const attempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          assessment_id: assessmentId,
          student_id: student.user_id,
          school_id: schoolId,
          academic_session_id: currentSession.id
        },
        include: {
          responses: {
            include: {
              question: {
                select: {
                  id: true,
                  question_text: true,
                  question_type: true,
                  points: true,
                  order: true,
                  image_url: true,
                  options: {
                    select: {
                      id: true,
                      option_text: true,
                      is_correct: true,
                      order: true
                    },
                    orderBy: {
                      order: 'asc'
                    }
                  }
                }
              },
              selectedOptions: {
                select: {
                  id: true,
                  option_text: true,
                  is_correct: true,
                  order: true
                },
                orderBy: {
                  order: 'asc'
                }
              }
            },
            orderBy: {
              question: {
                order: 'asc'
              }
            }
          }
        },
        orderBy: {
          submitted_at: 'desc'
        }
      });

      if (attempts.length === 0) {
        return ResponseHelper.success('Student submission retrieved successfully', {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            subject: assessment.subject,
            topic: assessment.topic,
            totalPoints: assessment.total_points,
            passingScore: assessment.passing_score
          },
          student: {
            id: student.id,
            userId: student.user_id,
            studentNumber: student.student_id,
            firstName: student.user.first_name,
            lastName: student.user.last_name,
            email: student.user.email,
            displayPicture: student.user.display_picture,
            className: student.current_class?.name || 'Unknown',
            classId: student.current_class_id
          },
          attempts: [],
          hasAttempted: false
        });
      }

      // Format attempts with responses
      const formattedAttempts = attempts.map(attempt => ({
        id: attempt.id,
        attemptNumber: attempt.attempt_number,
        status: attempt.status,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        timeSpent: attempt.time_spent,
        totalScore: attempt.total_score,
        maxScore: attempt.max_score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        isGraded: attempt.is_graded,
        gradedAt: attempt.graded_at,
        gradedBy: attempt.graded_by,
        gradeLetter: attempt.grade_letter,
        overallFeedback: attempt.overall_feedback,
        createdAt: attempt.createdAt,
        responses: attempt.responses.map(response => ({
          id: response.id,
          question: {
            id: response.question.id,
            questionText: response.question.question_text,
            questionType: response.question.question_type,
            points: response.question.points,
            order: response.question.order,
            imageUrl: response.question.image_url,
            options: response.question.options
          },
          textAnswer: response.text_answer,
          numericAnswer: response.numeric_answer,
          dateAnswer: response.date_answer,
          selectedOptions: response.selectedOptions,
          fileUrls: response.file_urls,
          isCorrect: response.is_correct,
          pointsEarned: response.points_earned,
          maxPoints: response.max_points,
          timeSpent: response.time_spent,
          feedback: response.feedback,
          isGraded: response.is_graded,
          createdAt: response.createdAt
        }))
      }));

      this.logger.log(colors.green(`✅ Retrieved ${attempts.length} attempt(s) for student ${student.user.first_name} ${student.user.last_name}`));

      return ResponseHelper.success('Student submission retrieved successfully', {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          subject: assessment.subject,
          topic: assessment.topic,
          totalPoints: assessment.total_points,
          passingScore: assessment.passing_score
        },
        student: {
          id: student.id,
          userId: student.user_id,
          studentNumber: student.student_id,
          firstName: student.user.first_name,
          lastName: student.user.last_name,
          email: student.user.email,
          displayPicture: student.user.display_picture,
          className: student.current_class?.name || 'Unknown',
          classId: student.current_class_id
        },
        attempts: formattedAttempts,
        hasAttempted: true,
        attemptCount: attempts.length,
        latestAttempt: formattedAttempts[0] || null
      });
    } catch (error) {
      this.logger.error(colors.red(`Error getting student submission: ${error.message}`));
      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Verify that a teacher has access to a topic
   * @param topicId - ID of the topic
   * @param teacherId - ID of the teacher
   * @param schoolId - ID of the school
   */
  private async verifyTeacherTopicAccess(topicId: string, teacherId: string, schoolId: string) {
    const topic = await this.prisma.topic.findFirst({
      where: {
        id: topicId,
        school_id: schoolId
      },
      include: {
        subject: {
          include: {
            teacherSubjects: {
              where: {
                teacher: {
                  user_id: teacherId
                }
              }
            }
          }
        }
      }
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if teacher teaches this subject
    if (topic.subject.teacherSubjects.length === 0) {
      throw new ForbiddenException('You do not have permission to create quizzes for this subject');
    }

    return topic;
  }

  /**
   * Verify that a teacher has access to a subject
   * @param subjectId - ID of the subject
   * @param teacherId - ID of the teacher
   */
  private async verifyTeacherSubjectAccess(subjectId: string, teacherId: string) {
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
      },
      include: {
        teacherSubjects: {
          where: {
            teacher: {
              user_id: teacherId
            }
          }
        }
      }
    });

    if (!subject) {
      this.logger.error(colors.red(`Subject not found: ${subjectId}`));
      throw new NotFoundException('Subject not found');
    }

    // Check if teacher teaches this subject
    if (subject.teacherSubjects.length === 0) {
      throw new ForbiddenException('You do not have permission to create quizzes for this subject');
    }

    return subject;
  }
}
