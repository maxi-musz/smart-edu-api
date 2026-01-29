import { Injectable, Logger, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { StorageService } from '../../shared/services/providers/storage.service';
import { CreateLibraryAssessmentDto } from './dto/create-assessment.dto';
import { UpdateLibraryAssessmentDto } from './dto/update-assessment.dto';
import { CreateLibraryAssessmentQuestionDto } from './dto/create-question.dto';
import { UpdateLibraryAssessmentQuestionDto } from './dto/update-question.dto';
import * as colors from 'colors';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get all assessments under a specific topic
   */
  async getAssessmentsByTopic(user: any, topicId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY ASSESSMENT] Fetching assessments for topic: ${topicId} for library user: ${user.email}`));

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

      // Verify the topic exists and belongs to the user's platform
      const topic = await this.prisma.libraryTopic.findFirst({
        where: {
          id: topicId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (!topic) {
        this.logger.error(colors.red(`Topic not found or does not belong to user's platform: ${topicId}`));
        throw new NotFoundException('Topic not found or does not belong to your platform');
      }

      // Fetch all assessments for this topic
      const assessments = await this.prisma.libraryAssessment.findMany({
        where: {
          topicId: topicId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          instructions: true,
          assessmentType: true,
          status: true,
          duration: true,
          timeLimit: true,
          startDate: true,
          endDate: true,
          maxAttempts: true,
          totalPoints: true,
          passingScore: true,
          isPublished: true,
          publishedAt: true,
          isResultReleased: true,
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
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });

      this.logger.log(colors.green(`Successfully retrieved ${assessments.length} assessments for topic: ${topic.title}`));

      const responseData = {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          subject: topic.subject,
        },
        assessments,
        totalCount: assessments.length,
      };

      return new ApiResponse(true, 'Assessments retrieved successfully', responseData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching assessments: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve assessments');
    }
  }

  /**
   * Get assessment analytics with user participation breakdown
   */
  async getAssessmentAnalytics(user: any, assessmentId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY ASSESSMENT] Fetching analytics for assessment: ${assessmentId}`));

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

      // Verify the assessment exists and belongs to the user's platform
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          totalPoints: true,
          passingScore: true,
        },
      });

      if (!assessment) {
        this.logger.error(colors.red(`Assessment not found or does not belong to user's platform: ${assessmentId}`));
        throw new NotFoundException('Assessment not found or does not belong to your platform');
      }

      // Get all attempts with user information
      const attempts = await this.prisma.libraryAssessmentAttempt.findMany({
        where: {
          assessmentId: assessmentId,
        },
        select: {
          id: true,
          userId: true,
          attemptNumber: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          timeSpent: true,
          totalScore: true,
          maxScore: true,
          percentage: true,
          passed: true,
          gradeLetter: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              school_id: true,
              school: {
                select: {
                  id: true,
                  school_name: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      // Calculate analytics
      const totalAttempts = attempts.length;
      const submittedAttempts = attempts.filter(a => a.status === 'SUBMITTED' || a.status === 'GRADED');
      const uniqueUsers = new Set(attempts.map(a => a.userId)).size;
      
      const scores = submittedAttempts.map(a => a.percentage).filter(s => s !== null && s !== undefined);
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      
      const passedCount = submittedAttempts.filter(a => a.passed).length;
      const passRate = submittedAttempts.length > 0 
        ? (passedCount / submittedAttempts.length) * 100 
        : 0;

      const timeSpentValues = submittedAttempts
        .map(a => a.timeSpent)
        .filter(t => t !== null && t !== undefined) as number[];
      const averageTime = timeSpentValues.length > 0
        ? Math.round(timeSpentValues.reduce((sum, time) => sum + time, 0) / timeSpentValues.length)
        : 0;

      // User participation breakdown
      const userParticipation = attempts.reduce((acc, attempt) => {
        const userId = attempt.userId;
        if (!acc[userId]) {
          acc[userId] = {
            user: attempt.user,
            totalAttempts: 0,
            submittedAttempts: 0,
            bestScore: 0,
            bestPercentage: 0,
            averageScore: 0,
            passedCount: 0,
            lastAttemptAt: null,
          };
        }
        
        acc[userId].totalAttempts++;
        if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
          acc[userId].submittedAttempts++;
          if (attempt.percentage > acc[userId].bestPercentage) {
            acc[userId].bestPercentage = attempt.percentage;
            acc[userId].bestScore = attempt.totalScore;
          }
          if (attempt.passed) {
            acc[userId].passedCount++;
          }
          if (!acc[userId].lastAttemptAt || (attempt.submittedAt && attempt.submittedAt > acc[userId].lastAttemptAt)) {
            acc[userId].lastAttemptAt = attempt.submittedAt;
          }
        }
        
        return acc;
      }, {} as Record<string, any>);

      // Calculate average scores per user
      Object.keys(userParticipation).forEach(userId => {
        const userData = userParticipation[userId];
        const userScores = attempts
          .filter(a => a.userId === userId && (a.status === 'SUBMITTED' || a.status === 'GRADED'))
          .map(a => a.percentage)
          .filter(s => s !== null && s !== undefined);
        
        userData.averageScore = userScores.length > 0
          ? userScores.reduce((sum: number, score: number) => sum + score, 0) / userScores.length
          : 0;
      });

      const analytics = {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          totalPoints: assessment.totalPoints,
          passingScore: assessment.passingScore,
        },
        overview: {
          totalAttempts,
          submittedAttempts: submittedAttempts.length,
          uniqueUsers,
          averageScore: Math.round(averageScore * 100) / 100,
          passRate: Math.round(passRate * 100) / 100,
          averageTimeSeconds: averageTime,
          averageTimeFormatted: this.formatDuration(averageTime),
        },
        userParticipation: Object.values(userParticipation),
        attempts: attempts.slice(0, 50), // Limit to last 50 attempts for response size
      };

      this.logger.log(colors.green(`Successfully retrieved analytics for assessment: ${assessment.title}`));
      return new ApiResponse(true, 'Assessment analytics retrieved successfully', analytics);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching assessment analytics: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve assessment analytics');
    }
  }

  /**
   * Get all assessments taken by a specific user (across all assessments)
   */
  async getUserAssessmentHistory(userId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY ASSESSMENT] Fetching assessment history for user: ${userId}`));

    try {
      // Verify user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get all attempts by this user
      const attempts = await this.prisma.libraryAssessmentAttempt.findMany({
        where: {
          userId: userId,
        },
        select: {
          id: true,
          assessmentId: true,
          attemptNumber: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          timeSpent: true,
          totalScore: true,
          maxScore: true,
          percentage: true,
          passed: true,
          gradeLetter: true,
          createdAt: true,
          assessment: {
            select: {
              id: true,
              title: true,
              description: true,
              assessmentType: true,
              totalPoints: true,
              passingScore: true,
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
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      });

      // Calculate user statistics
      const submittedAttempts = attempts.filter(a => a.status === 'SUBMITTED' || a.status === 'GRADED');
      const uniqueAssessments = new Set(attempts.map(a => a.assessmentId)).size;
      
      const scores = submittedAttempts.map(a => a.percentage).filter(s => s !== null && s !== undefined);
      const averageScore = scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
        : 0;
      
      const passedCount = submittedAttempts.filter(a => a.passed).length;
      const passRate = submittedAttempts.length > 0 
        ? (passedCount / submittedAttempts.length) * 100 
        : 0;

      const statistics = {
        totalAttempts: attempts.length,
        submittedAttempts: submittedAttempts.length,
        uniqueAssessments,
        averageScore: Math.round(averageScore * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        passedCount,
        failedCount: submittedAttempts.length - passedCount,
      };

      const responseData = {
        user,
        statistics,
        attempts,
      };

      this.logger.log(colors.green(`Successfully retrieved ${attempts.length} attempts for user: ${user.email}`));
      return new ApiResponse(true, 'User assessment history retrieved successfully', responseData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching user assessment history: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve user assessment history');
    }
  }

  /**
   * Create a new library assessment
   */
  async createAssessment(createAssessmentDto: CreateLibraryAssessmentDto, user: any): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`[LIBRARY ASSESSMENT] Creating New Library Assessment: ${createAssessmentDto.title}`));

      // Get library user to ensure they exist and get their platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red(`Library user not found: ${user.sub}`));
        throw new NotFoundException('Library user not found');
      }

      // Verify subject exists and belongs to the user's platform
      const subject = await this.prisma.librarySubject.findFirst({
        where: {
          id: createAssessmentDto.subjectId,
          platformId: libraryUser.platformId,
        },
      });

      if (!subject) {
        this.logger.error(colors.red(`Subject not found or does not belong to your Platform`));
        throw new NotFoundException('Subject not found or does not belong to your platform');
      }

      // If topicId is provided, verify it exists and belongs to the subject
      if (createAssessmentDto.topicId) {
        const topic = await this.prisma.libraryTopic.findFirst({
          where: {
            id: createAssessmentDto.topicId,
            subjectId: createAssessmentDto.subjectId,
            platformId: libraryUser.platformId,
          },
        });

        if (!topic) {
          this.logger.error(colors.red(`Topic not found or does not belong to this subject`));
          throw new NotFoundException('Topic not found or does not belong to this subject');
        }
      }

      // Prepare the data object
      const createData: any = {
        platformId: libraryUser.platformId,
        subjectId: createAssessmentDto.subjectId,
        createdById: user.sub,
        title: createAssessmentDto.title,
        description: createAssessmentDto.description,
        instructions: createAssessmentDto.instructions,
        assessmentType: createAssessmentDto.assessmentType || 'CBT',
        gradingType: createAssessmentDto.gradingType || 'AUTOMATIC',
        duration: createAssessmentDto.duration,
        maxAttempts: createAssessmentDto.maxAttempts || 1,
        passingScore: createAssessmentDto.passingScore || 50.0,
        totalPoints: createAssessmentDto.totalPoints || 100.0,
        shuffleQuestions: createAssessmentDto.shuffleQuestions || false,
        shuffleOptions: createAssessmentDto.shuffleOptions || false,
        showCorrectAnswers: createAssessmentDto.showCorrectAnswers || false,
        showFeedback: createAssessmentDto.showFeedback !== false,
        allowReview: createAssessmentDto.allowReview !== false,
        startDate: createAssessmentDto.startDate ? new Date(createAssessmentDto.startDate) : null,
        endDate: createAssessmentDto.endDate ? new Date(createAssessmentDto.endDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeLimit: createAssessmentDto.timeLimit,
        autoSubmit: createAssessmentDto.autoSubmit || false,
        tags: createAssessmentDto.tags || [],
        status: 'DRAFT',
        isPublished: false,
      };

      // Only add topicId if provided
      if (createAssessmentDto.topicId) {
        createData.topicId = createAssessmentDto.topicId;
      }

      // Create the assessment
      const assessment = await this.prisma.libraryAssessment.create({
        data: createData,
        include: {
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
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      this.logger.log(colors.green(`Assessment created successfully: ${assessment.id}`));
      return new ApiResponse(true, 'Assessment created successfully', assessment);
    } catch (error) {
      this.logger.error(colors.red(`Error creating Assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Upload an image for a question (separate endpoint)
   */
  async uploadQuestionImage(assessmentId: string, imageFile: Express.Multer.File, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Uploading question image for assessment: ${assessmentId} by user: ${userId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red(`Library user not found: ${userId}`));
        throw new NotFoundException('Library user not found');
      }

      // Verify the assessment exists and the user has access to it
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
        include: {
          platform: {
            select: {
              id: true,
            },
          },
        },
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
      const s3Folder = `assessment-images/platforms/${assessment.platform.id}/assessments/${assessmentId}`;
      const fileName = `question_${Date.now()}_${imageFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      try {
        const uploadResult = await this.storageService.uploadFile(imageFile, s3Folder, fileName);
        this.logger.log(colors.green(`✅ Image uploaded to S3: ${uploadResult.key}`));

        return new ApiResponse(
          true,
          'Image uploaded successfully',
          {
            imageUrl: uploadResult.url,
            imageS3Key: uploadResult.key,
          }
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
   * Create a new question for an assessment
   */
  async createQuestion(
    assessmentId: string, 
    createQuestionDto: CreateLibraryAssessmentQuestionDto, 
    userId: string,
    imageFile?: Express.Multer.File
  ): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Creating question for assessment: ${assessmentId} by user: ${userId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify the assessment exists and the user has access to it
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if the assessment is in a state that allows adding questions
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot add questions to a closed or archived assessment');
      }

      // Handle image upload if file is provided
      let imageUrl: string | undefined;
      let imageS3Key: string | undefined;

      if (imageFile) {
        this.logger.log(colors.cyan(`Image file provided, uploading to S3...`));
        try {
          const timestamp = Date.now();
          const s3Folder = `library-assessment-images/platforms/${libraryUser.platformId}/assessments/${assessmentId}`;
          const fileName = `question_${timestamp}_${imageFile.originalname}`;
          
          const uploadResult = await this.storageService.uploadFile(imageFile, s3Folder, fileName);

          imageUrl = uploadResult.url;
          imageS3Key = uploadResult.key;
          this.logger.log(colors.green(`✅ Image uploaded successfully to S3: ${imageS3Key}`));
        } catch (uploadError) {
          this.logger.error(colors.red(`Error uploading image to S3: ${uploadError.message}`), uploadError.stack);
          throw new InternalServerErrorException('Failed to upload image to S3');
        }
      }

      // Auto-calculate the next available order if not provided
      let questionOrder = createQuestionDto.order;
      
      if (!questionOrder) {
        const lastQuestion = await this.prisma.libraryAssessmentQuestion.findFirst({
          where: { assessmentId: assessmentId },
          orderBy: { order: 'desc' },
        });
        questionOrder = lastQuestion ? lastQuestion.order + 1 : 1;
      } else {
        const existingQuestion = await this.prisma.libraryAssessmentQuestion.findFirst({
          where: {
            assessmentId: assessmentId,
            order: questionOrder,
          },
        });

        if (existingQuestion) {
          const lastQuestion = await this.prisma.libraryAssessmentQuestion.findFirst({
            where: { assessmentId: assessmentId },
            orderBy: { order: 'desc' },
          });
          questionOrder = lastQuestion ? lastQuestion.order + 1 : 1;
          this.logger.log(colors.yellow(`Order ${createQuestionDto.order} already exists, auto-assigning order ${questionOrder}`));
        }
      }

      // Create the question with options and correct answers in a transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create the question
        const question = await prisma.libraryAssessmentQuestion.create({
          data: {
            assessmentId: assessmentId,
            questionText: createQuestionDto.questionText,
            questionType: createQuestionDto.questionType,
            order: questionOrder,
            points: createQuestionDto.points || 1.0,
            isRequired: createQuestionDto.isRequired !== undefined ? createQuestionDto.isRequired : true,
            timeLimit: createQuestionDto.timeLimit,
            imageUrl: imageUrl ?? undefined,
            imageS3Key: imageS3Key ?? undefined,
            audioUrl: createQuestionDto.audioUrl,
            videoUrl: createQuestionDto.videoUrl,
            allowMultipleAttempts: createQuestionDto.allowMultipleAttempts || false,
            showHint: createQuestionDto.showHint || false,
            hintText: createQuestionDto.hintText,
            minLength: createQuestionDto.minLength,
            maxLength: createQuestionDto.maxLength,
            minValue: createQuestionDto.minValue,
            maxValue: createQuestionDto.maxValue,
            explanation: createQuestionDto.explanation,
            difficultyLevel: createQuestionDto.difficultyLevel || 'MEDIUM',
          },
        });

        // Create options if provided
        let options: any[] = [];
        if (createQuestionDto.options && createQuestionDto.options.length > 0) {
          options = await Promise.all(
            createQuestionDto.options.map(async (optionData: any) => {
              return await prisma.libraryAssessmentOption.create({
                data: {
                  questionId: question.id,
                  optionText: optionData.optionText,
                  order: optionData.order,
                  isCorrect: optionData.isCorrect,
                  imageUrl: optionData.imageUrl,
                  audioUrl: optionData.audioUrl,
                },
              });
            })
          );
        }

        // Create correct answers if provided explicitly
        let correctAnswers: any[] = [];
        if (createQuestionDto.correctAnswers && createQuestionDto.correctAnswers.length > 0) {
          correctAnswers = await Promise.all(
            createQuestionDto.correctAnswers.map(async (answerData: any) => {
              return await prisma.libraryAssessmentCorrectAnswer.create({
                data: {
                  questionId: question.id,
                  answerText: answerData.answerText,
                  answerNumber: answerData.answerNumber,
                  answerDate: answerData.answerDate ? new Date(answerData.answerDate) : null,
                  optionIds: answerData.optionIds || [],
                  answerJson: answerData.answerJson,
                },
              });
            })
          );
        } else if (options.length > 0) {
          // AUTO-GENERATE correct answers from options marked as isCorrect
          const correctOptionIds = options.filter(opt => opt.isCorrect).map(opt => opt.id);
          
          if (correctOptionIds.length > 0) {
            this.logger.log(colors.yellow(`🔧 Auto-generating correct answer from ${correctOptionIds.length} correct options`));
            
            const correctAnswer = await prisma.libraryAssessmentCorrectAnswer.create({
              data: {
                questionId: question.id,
                optionIds: correctOptionIds,
              },
            });
            correctAnswers = [correctAnswer];
            
            this.logger.log(colors.green(`✅ Correct answer auto-generated with optionIds: [${correctOptionIds.join(', ')}]`));
          } else {
            this.logger.warn(colors.red(`⚠️ No options marked as correct and no correctAnswers provided for question: ${question.questionText}`));
          }
        }

        return { question, options, correctAnswers };
      });

      // Update the assessment's total points
      const totalPoints = await this.prisma.libraryAssessmentQuestion.aggregate({
        where: { assessmentId: assessmentId },
        _sum: { points: true },
      });

      await this.prisma.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum?.points || 0 },
      });

      this.logger.log(colors.green(`Question created successfully with ID: ${result.question.id}`));

      return new ApiResponse(
        true,
        'Question created successfully',
        {
          question: {
            id: result.question.id,
            questionText: result.question.questionText,
            questionType: result.question.questionType,
            order: result.question.order,
            points: result.question.points,
            isRequired: result.question.isRequired,
            timeLimit: result.question.timeLimit,
            imageUrl: result.question.imageUrl,
            audioUrl: result.question.audioUrl,
            videoUrl: result.question.videoUrl,
            allowMultipleAttempts: result.question.allowMultipleAttempts,
            showHint: result.question.showHint,
            hintText: result.question.hintText,
            minLength: result.question.minLength,
            maxLength: result.question.maxLength,
            minValue: result.question.minValue,
            maxValue: result.question.maxValue,
            explanation: result.question.explanation,
            difficultyLevel: result.question.difficultyLevel,
            createdAt: result.question.createdAt,
            updatedAt: result.question.updatedAt,
          },
          options: result.options.map(option => ({
            id: option.id,
            optionText: option.optionText,
            order: option.order,
            isCorrect: option.isCorrect,
            imageUrl: option.imageUrl,
            audioUrl: option.audioUrl,
          })),
          correctAnswers: result.correctAnswers.map(answer => ({
            id: answer.id,
            answerText: answer.answerText,
            answerNumber: answer.answerNumber,
            answerDate: answer.answerDate,
            optionIds: answer.optionIds,
            answerJson: answer.answerJson,
          })),
          assessment: {
            id: assessment.id,
            title: assessment.title,
            totalPoints: totalPoints._sum?.points || 0,
          },
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`Error creating question: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get all questions for a specific assessment
   */
  async getAssessmentQuestions(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Getting questions for assessment: ${assessmentId} by user: ${userId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify the assessment exists and the user has access to it
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
        include: {
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
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Get all questions for this assessment
      const questions = await this.prisma.libraryAssessmentQuestion.findMany({
        where: {
          assessmentId: assessmentId,
        },
        include: {
          options: {
            orderBy: {
              order: 'asc',
            },
          },
          correctAnswers: true,
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });

      this.logger.log(colors.green(`Found ${questions.length} question`));

      return new ApiResponse(
        true,
        'Assessment questions retrieved successfully',
        {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            assessmentType: assessment.assessmentType,
            status: assessment.status,
            totalPoints: assessment.totalPoints,
            duration: assessment.duration,
            subject: assessment.subject,
            topic: assessment.topic,
          },
          questions: questions.map(question => ({
            id: question.id,
            questionText: question.questionText,
            questionType: question.questionType,
            order: question.order,
            points: question.points,
            isRequired: question.isRequired,
            timeLimit: question.timeLimit,
            imageUrl: question.imageUrl,
            audioUrl: question.audioUrl,
            videoUrl: question.videoUrl,
            allowMultipleAttempts: question.allowMultipleAttempts,
            showHint: question.showHint,
            hintText: question.hintText,
            minLength: question.minLength,
            maxLength: question.maxLength,
            minValue: question.minValue,
            maxValue: question.maxValue,
            explanation: question.explanation,
            difficultyLevel: question.difficultyLevel,
            options: question.options.map(option => ({
              id: option.id,
              optionText: option.optionText,
              order: option.order,
              isCorrect: option.isCorrect,
              imageUrl: option.imageUrl,
              audioUrl: option.audioUrl,
            })),
            correctAnswers: question.correctAnswers.map(answer => ({
              id: answer.id,
              answerText: answer.answerText,
              answerNumber: answer.answerNumber,
              answerDate: answer.answerDate,
              optionIds: answer.optionIds,
              answerJson: answer.answerJson,
            })),
            totalResponses: question._count.responses,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
          })),
          totalQuestions: questions.length,
          totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`Error getting assessment questions: ${error.message}`));
      throw error;
    }
  }

  /**
   * Update a specific question in an assessment
   */
  async updateQuestion(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: UpdateLibraryAssessmentQuestionDto,
    userId: string,
    imageFile?: Express.Multer.File
  ): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Updating question: ${questionId} in assessment: ${assessmentId} by user: ${userId}`));
      this.logger.log(colors.cyan(`📋 Update payload: options=${updateQuestionDto.options !== undefined ? `${updateQuestionDto.options?.length || 0} items` : 'not provided'}, correctAnswers=${updateQuestionDto.correctAnswers !== undefined ? `${updateQuestionDto.correctAnswers?.length || 0} items` : 'not provided'}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify the assessment exists and the user has access to it
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
        include: {
          platform: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if the assessment is in a state that allows editing questions
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot edit questions in a closed or archived assessment');
      }

      // Verify the question exists and belongs to this assessment
      const existingQuestion = await this.prisma.libraryAssessmentQuestion.findFirst({
        where: {
          id: questionId,
          assessmentId: assessmentId,
        },
      });

      if (!existingQuestion) {
        throw new NotFoundException('Question not found in this assessment');
      }

      // Handle image upload/replacement if new image file is provided
      let imageUrl: string | undefined = updateQuestionDto.imageUrl;
      let imageS3Key: string | undefined = existingQuestion.imageS3Key ?? undefined;
      let oldImageS3Key: string | undefined = existingQuestion.imageS3Key ?? undefined;

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
        const s3Folder = `assessment-images/platforms/${assessment.platform.id}/assessments/${assessmentId}`;
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
      } else if (updateQuestionDto.imageUrl === null || updateQuestionDto.imageUrl === '') {
        // If image_url is explicitly set to null/empty, remove the image
        imageUrl = undefined;
        imageS3Key = undefined;
        oldImageS3Key = existingQuestion.imageS3Key ?? undefined;
      }

      // If order is being changed, check for conflicts
      if (updateQuestionDto.order && updateQuestionDto.order !== existingQuestion.order) {
        const conflictingQuestion = await this.prisma.libraryAssessmentQuestion.findFirst({
          where: {
            assessmentId: assessmentId,
            order: updateQuestionDto.order,
            id: { not: questionId },
          },
        });

        if (conflictingQuestion) {
          throw new BadRequestException(`A question with order ${updateQuestionDto.order} already exists in this assessment`);
        }
      }

      // Update the question with options and correct answers in a transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Prepare update data
        const updateData: any = {};
        if (updateQuestionDto.questionText !== undefined) updateData.questionText = updateQuestionDto.questionText;
        if (updateQuestionDto.questionType !== undefined) updateData.questionType = updateQuestionDto.questionType;
        if (updateQuestionDto.order !== undefined) updateData.order = updateQuestionDto.order;
        if (updateQuestionDto.points !== undefined) updateData.points = updateQuestionDto.points;
        if (updateQuestionDto.isRequired !== undefined) updateData.isRequired = updateQuestionDto.isRequired;
        if (updateQuestionDto.timeLimit !== undefined) updateData.timeLimit = updateQuestionDto.timeLimit;
        if (updateQuestionDto.audioUrl !== undefined) updateData.audioUrl = updateQuestionDto.audioUrl;
        if (updateQuestionDto.videoUrl !== undefined) updateData.videoUrl = updateQuestionDto.videoUrl;
        if (updateQuestionDto.allowMultipleAttempts !== undefined) updateData.allowMultipleAttempts = updateQuestionDto.allowMultipleAttempts;
        if (updateQuestionDto.showHint !== undefined) updateData.showHint = updateQuestionDto.showHint;
        if (updateQuestionDto.hintText !== undefined) updateData.hintText = updateQuestionDto.hintText;
        if (updateQuestionDto.minLength !== undefined) updateData.minLength = updateQuestionDto.minLength;
        if (updateQuestionDto.maxLength !== undefined) updateData.maxLength = updateQuestionDto.maxLength;
        if (updateQuestionDto.minValue !== undefined) updateData.minValue = updateQuestionDto.minValue;
        if (updateQuestionDto.maxValue !== undefined) updateData.maxValue = updateQuestionDto.maxValue;
        if (updateQuestionDto.explanation !== undefined) updateData.explanation = updateQuestionDto.explanation;
        if (updateQuestionDto.difficultyLevel !== undefined) updateData.difficultyLevel = updateQuestionDto.difficultyLevel;

        // Only update image fields if they've changed
        if (imageFile || updateQuestionDto.imageUrl === null || updateQuestionDto.imageUrl === '') {
          updateData.imageUrl = imageUrl;
          updateData.imageS3Key = imageS3Key;
        } else if (updateQuestionDto.imageUrl !== undefined) {
          updateData.imageUrl = updateQuestionDto.imageUrl;
        }

        // Update the question
        const updatedQuestion = await prisma.libraryAssessmentQuestion.update({
          where: { id: questionId },
          data: updateData,
        });

        // Handle options update if provided
        let options: any[] = [];
        if (updateQuestionDto.options !== undefined) {
          // Delete existing options
          await prisma.libraryAssessmentOption.deleteMany({
            where: { questionId: questionId },
          });

          // Create new options if provided
          if (updateQuestionDto.options.length > 0) {
            options = await Promise.all(
              updateQuestionDto.options.map(async (optionData: any) => {
                return await prisma.libraryAssessmentOption.create({
                  data: {
                    questionId: questionId,
                    optionText: optionData.optionText,
                    order: optionData.order,
                    isCorrect: optionData.isCorrect,
                    imageUrl: optionData.imageUrl,
                    audioUrl: optionData.audioUrl,
                  },
                });
              })
            );
          }
        } else {
          // Keep existing options
          options = await prisma.libraryAssessmentOption.findMany({
            where: { questionId: questionId },
            orderBy: { order: 'asc' },
          });
        }

        // Handle correct answers update if provided
        let correctAnswers: any[] = [];
        if (updateQuestionDto.correctAnswers !== undefined) {
          // Delete existing correct answers
          await prisma.libraryAssessmentCorrectAnswer.deleteMany({
            where: { questionId: questionId },
          });

          this.logger.log(colors.cyan(`📝 Processing correctAnswers update: ${updateQuestionDto.correctAnswers.length} answers provided`));

          // Create new correct answers if provided
          if (updateQuestionDto.correctAnswers.length > 0) {
            // If options were also updated, validate that optionIds in correctAnswers match the new option IDs
            if (updateQuestionDto.options !== undefined && options.length > 0) {
              const newOptionIds = new Set(options.map(opt => opt.id));
              for (const answerData of updateQuestionDto.correctAnswers) {
                if (answerData.optionIds && answerData.optionIds.length > 0) {
                  const invalidOptionIds = answerData.optionIds.filter(id => !newOptionIds.has(id));
                  if (invalidOptionIds.length > 0) {
                    this.logger.warn(colors.yellow(`⚠️ Warning: correctAnswers contains optionIds that don't match new options: [${invalidOptionIds.join(', ')}]`));
                  }
                }
              }
            }

            correctAnswers = await Promise.all(
              updateQuestionDto.correctAnswers.map(async (answerData: any) => {
                const created = await prisma.libraryAssessmentCorrectAnswer.create({
                  data: {
                    questionId: questionId,
                    answerText: answerData.answerText,
                    answerNumber: answerData.answerNumber,
                    answerDate: answerData.answerDate ? new Date(answerData.answerDate) : null,
                    optionIds: answerData.optionIds || [],
                    answerJson: answerData.answerJson,
                  },
                });
                this.logger.log(colors.green(`✅ Created correct answer with optionIds: [${(answerData.optionIds || []).join(', ')}]`));
                return created;
              })
            );
          } else if (options.length > 0 && (updateQuestionDto.questionType === 'MULTIPLE_CHOICE_SINGLE' || updateQuestionDto.questionType === 'MULTIPLE_CHOICE_MULTIPLE' || !updateQuestionDto.questionType)) {
            // If correctAnswers is explicitly set to empty array and options exist, auto-generate from options marked as isCorrect
            // This handles the case where user updates options but doesn't send correctAnswers
            const correctOptionIds = options.filter(opt => opt.isCorrect).map(opt => opt.id);
            
            if (correctOptionIds.length > 0) {
              this.logger.log(colors.yellow(`🔧 Auto-generating correct answer from ${correctOptionIds.length} correct options (update)`));
              
              const correctAnswer = await prisma.libraryAssessmentCorrectAnswer.create({
                data: {
                  questionId: questionId,
                  optionIds: correctOptionIds,
                },
              });
              correctAnswers = [correctAnswer];
              
              this.logger.log(colors.green(`✅ Correct answer auto-generated with optionIds: [${correctOptionIds.join(', ')}]`));
            }
          } else {
            this.logger.log(colors.yellow(`⚠️ correctAnswers explicitly set to empty array, all correct answers removed`));
          }
        } else if (updateQuestionDto.options !== undefined && options.length > 0) {
          // If options were updated but correctAnswers were not provided, auto-generate from new options
          // This ensures correctAnswers reference the NEW option IDs, not the old ones
          const correctOptionIds = options.filter(opt => opt.isCorrect).map(opt => opt.id);
          
          if (correctOptionIds.length > 0) {
            // Delete old correct answers first
            await prisma.libraryAssessmentCorrectAnswer.deleteMany({
              where: { questionId: questionId },
            });
            
            this.logger.log(colors.yellow(`🔧 Auto-updating correct answers from ${correctOptionIds.length} correct options (options updated)`));
            
            const correctAnswer = await prisma.libraryAssessmentCorrectAnswer.create({
              data: {
                questionId: questionId,
                optionIds: correctOptionIds,
              },
            });
            correctAnswers = [correctAnswer];
            
            this.logger.log(colors.green(`✅ Correct answer auto-updated with new optionIds: [${correctOptionIds.join(', ')}]`));
          } else {
            // No correct options, but options were updated - delete old correct answers
            await prisma.libraryAssessmentCorrectAnswer.deleteMany({
              where: { questionId: questionId },
            });
            this.logger.log(colors.yellow(`⚠️ No options marked as correct after update, removed old correct answers`));
          }
        } else {
          // Keep existing correct answers (neither options nor correctAnswers were updated)
          correctAnswers = await prisma.libraryAssessmentCorrectAnswer.findMany({
            where: { questionId: questionId },
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
      const totalPoints = await this.prisma.libraryAssessmentQuestion.aggregate({
        where: { assessmentId: assessmentId },
        _sum: { points: true },
      });

      await this.prisma.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum?.points || 0 },
      });

      this.logger.log(colors.green(`Question updated successfully: ${questionId}`));

      return new ApiResponse(
        true,
        'Question updated successfully',
        {
          question: {
            id: result.question.id,
            questionText: result.question.questionText,
            questionType: result.question.questionType,
            order: result.question.order,
            points: result.question.points,
            isRequired: result.question.isRequired,
            timeLimit: result.question.timeLimit,
            imageUrl: result.question.imageUrl,
            audioUrl: result.question.audioUrl,
            videoUrl: result.question.videoUrl,
            allowMultipleAttempts: result.question.allowMultipleAttempts,
            showHint: result.question.showHint,
            hintText: result.question.hintText,
            minLength: result.question.minLength,
            maxLength: result.question.maxLength,
            minValue: result.question.minValue,
            maxValue: result.question.maxValue,
            explanation: result.question.explanation,
            difficultyLevel: result.question.difficultyLevel,
            createdAt: result.question.createdAt,
            updatedAt: result.question.updatedAt,
          },
          options: result.options.map(option => ({
            id: option.id,
            optionText: option.optionText,
            order: option.order,
            isCorrect: option.isCorrect,
            imageUrl: option.imageUrl,
            audioUrl: option.audioUrl,
          })),
          correctAnswers: result.correctAnswers.map(answer => ({
            id: answer.id,
            answerText: answer.answerText,
            answerNumber: answer.answerNumber,
            answerDate: answer.answerDate,
            optionIds: answer.optionIds,
            answerJson: answer.answerJson,
          })),
          assessment: {
            id: assessment.id,
            title: assessment.title,
            totalPoints: totalPoints._sum?.points || 0,
          },
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`Error updating question: ${error.message}`));
      throw error;
    }
  }

  /**
   * Delete an orphaned image by S3 key (for images uploaded but never attached to a question)
   */
  async deleteOrphanedImage(assessmentId: string, imageS3Key: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Deleting orphaned image: ${imageS3Key} for assessment: ${assessmentId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify the assessment exists and the user has access to it
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Delete the image from S3
      try {
        await this.storageService.deleteFile(imageS3Key);
        this.logger.log(colors.green(`✅ Orphaned image deleted from S3: ${imageS3Key}`));
      } catch (s3Error) {
        this.logger.error(colors.red(`Failed to delete orphaned image from S3: ${s3Error.message}`));
        throw new BadRequestException(`Failed to delete image from S3: ${s3Error.message}`);
      }

      return new ApiResponse(
        true,
        'Orphaned image deleted successfully',
        {
          assessmentId: assessmentId,
          imageS3Key: imageS3Key,
          imageDeleted: true,
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`Error deleting orphaned image: ${error.message}`));
      throw error;
    }
  }

  /**
   * Delete the image for a specific question
   */
  async deleteQuestionImage(assessmentId: string, questionId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Deleting image for question: ${questionId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify the assessment exists and the user has access to it
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if the assessment is in a state that allows editing questions
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot edit questions in a closed or archived assessment');
      }

      // Verify the question exists and belongs to this assessment
      const existingQuestion = await this.prisma.libraryAssessmentQuestion.findFirst({
        where: {
          id: questionId,
          assessmentId: assessmentId,
        },
        select: {
          id: true,
          imageS3Key: true,
          imageUrl: true,
        },
      });

      if (!existingQuestion) {
        throw new NotFoundException('Question not found in this assessment');
      }

      // Check if the question has an image
      if (!existingQuestion.imageS3Key && !existingQuestion.imageUrl) {
        throw new BadRequestException('Question does not have an image to delete');
      }

      // Delete the image from S3 if S3 key exists
      if (existingQuestion.imageS3Key) {
        try {
          await this.storageService.deleteFile(existingQuestion.imageS3Key);
          this.logger.log(colors.green(`✅ Image deleted from S3: ${existingQuestion.imageS3Key}`));
        } catch (s3Error) {
          // Log error but don't fail - the image might already be deleted
          this.logger.warn(colors.yellow(`⚠️ Failed to delete image from S3 (may already be deleted): ${s3Error.message}`));
        }
      }

      // Update the question to remove imageUrl and imageS3Key
      await this.prisma.libraryAssessmentQuestion.update({
        where: { id: questionId },
        data: {
          imageUrl: null,
          imageS3Key: null,
        },
      });

      this.logger.log(colors.green(`Image deleted successfully for question: ${questionId}`));

      return new ApiResponse(
        true,
        'Question image deleted successfully',
        {
          questionId: questionId,
          imageDeleted: true,
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`Error deleting question image: ${error.message}`));
      throw error;
    }
  }

  /**
   * Delete a specific question from an assessment
   */
  async deleteQuestion(assessmentId: string, questionId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Deleting question: ${questionId} from assessment: ${assessmentId} by user: ${userId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify the assessment exists and the user has access to it
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check if the assessment is in a state that allows deleting questions
      if (assessment.status === 'CLOSED' || assessment.status === 'ARCHIVED') {
        throw new BadRequestException('Cannot delete questions from a closed or archived assessment');
      }

      // Verify the question exists and belongs to this assessment
      const existingQuestion = await this.prisma.libraryAssessmentQuestion.findFirst({
        where: {
          id: questionId,
          assessmentId: assessmentId,
        },
        select: {
          id: true,
          questionText: true,
          order: true,
          points: true,
          imageS3Key: true,
          _count: {
            select: {
              responses: true,
            },
          },
        },
      });

      if (!existingQuestion) {
        throw new NotFoundException('Question not found in this assessment');
      }

      // Check if the question has any user responses
      if (existingQuestion._count.responses > 0) {
        throw new BadRequestException('Cannot delete question that has user responses. Consider archiving the assessment instead.');
      }

      // Store S3 key for deletion after question is deleted
      const imageS3Key = existingQuestion.imageS3Key;

      // Delete the question and all related data in a transaction
      await this.prisma.$transaction(async (prisma) => {
        // Delete correct answers first (due to foreign key constraints)
        await prisma.libraryAssessmentCorrectAnswer.deleteMany({
          where: { questionId: questionId },
        });

        // Delete options
        await prisma.libraryAssessmentOption.deleteMany({
          where: { questionId: questionId },
        });

        // Delete the question
        await prisma.libraryAssessmentQuestion.delete({
          where: { id: questionId },
        });
      });

      // Update the assessment's total points
      const totalPoints = await this.prisma.libraryAssessmentQuestion.aggregate({
        where: { assessmentId: assessmentId },
        _sum: { points: true },
      });

      await this.prisma.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum?.points || 0 },
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

      return new ApiResponse(
        true,
        'Question deleted successfully',
        {
          deletedQuestion: {
            id: questionId,
            questionText: existingQuestion.questionText,
            order: existingQuestion.order,
            points: existingQuestion.points,
          },
          assessment: {
            id: assessment.id,
            title: assessment.title,
            totalPoints: totalPoints._sum?.points || 0,
          },
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`Error deleting question: ${error.message}`));
      throw error;
    }
  }

  /**
   * Update an assessment
   */
  async updateAssessment(
    assessmentId: string,
    updateAssessmentDto: UpdateLibraryAssessmentDto,
    userId: string
  ): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Updating assessment: ${assessmentId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify assessment exists and user has access
      const existingAssessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
      });

      if (!existingAssessment) {
        throw new NotFoundException('Assessment not found or access denied');
      }

      // If subject is being changed, verify access to new subject
      if (updateAssessmentDto.subjectId && updateAssessmentDto.subjectId !== existingAssessment.subjectId) {
        const subject = await this.prisma.librarySubject.findFirst({
          where: {
            id: updateAssessmentDto.subjectId,
            platformId: libraryUser.platformId,
          },
        });

        if (!subject) {
          throw new NotFoundException('Subject not found or does not belong to your platform');
        }
      }

      // If topic is being changed, verify access
      if (updateAssessmentDto.topicId && updateAssessmentDto.topicId !== existingAssessment.topicId) {
        const topic = await this.prisma.libraryTopic.findFirst({
          where: {
            id: updateAssessmentDto.topicId,
            subjectId: updateAssessmentDto.subjectId || existingAssessment.subjectId,
            platformId: libraryUser.platformId,
          },
        });

        if (!topic) {
          throw new NotFoundException('Topic not found or does not belong to this subject');
        }
      }

      // Check if assessment has attempts and is being changed to a state that would affect users
      if (updateAssessmentDto.status && ['CLOSED', 'ARCHIVED'].includes(updateAssessmentDto.status)) {
        const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
          where: { assessmentId: assessmentId },
        });

        if (attemptCount > 0) {
          this.logger.warn(colors.yellow(`Assessment ${assessmentId} has ${attemptCount} attempts but status is being changed to ${updateAssessmentDto.status}`));
        }
      }

      const updateData: any = { ...updateAssessmentDto };
      
      // Convert date strings to Date objects
      if (updateAssessmentDto.startDate) {
        updateData.startDate = new Date(updateAssessmentDto.startDate);
      }
      if (updateAssessmentDto.endDate) {
        updateData.endDate = new Date(updateAssessmentDto.endDate);
      }

      // Track status changes
      const wasPublished = existingAssessment.status === 'ACTIVE' || existingAssessment.status === 'PUBLISHED' || existingAssessment.isPublished;
      const isBeingUnpublished = updateAssessmentDto.status === 'DRAFT' && wasPublished;
      const isBeingPublished = (updateAssessmentDto.status === 'PUBLISHED' || updateAssessmentDto.status === 'ACTIVE') && !wasPublished;

      // If status is being changed to PUBLISHED/ACTIVE, set published_at
      if (isBeingPublished) {
        updateData.isPublished = true;
        updateData.publishedAt = new Date();
        if (!updateData.status) {
          updateData.status = 'ACTIVE';
        }
      }

      // If status is being changed to DRAFT, set is_published to false
      if (isBeingUnpublished) {
        updateData.isPublished = false;
      }

      // Map DTO field names to Prisma field names
      const mappedData: any = {};
      if (updateData.subjectId !== undefined) mappedData.subjectId = updateData.subjectId;
      if (updateData.topicId !== undefined) mappedData.topicId = updateData.topicId;
      if (updateData.title !== undefined) mappedData.title = updateData.title;
      if (updateData.description !== undefined) mappedData.description = updateData.description;
      if (updateData.instructions !== undefined) mappedData.instructions = updateData.instructions;
      if (updateData.assessmentType !== undefined) mappedData.assessmentType = updateData.assessmentType;
      if (updateData.gradingType !== undefined) mappedData.gradingType = updateData.gradingType;
      if (updateData.duration !== undefined) mappedData.duration = updateData.duration;
      if (updateData.maxAttempts !== undefined) mappedData.maxAttempts = updateData.maxAttempts;
      if (updateData.passingScore !== undefined) mappedData.passingScore = updateData.passingScore;
      if (updateData.totalPoints !== undefined) mappedData.totalPoints = updateData.totalPoints;
      if (updateData.shuffleQuestions !== undefined) mappedData.shuffleQuestions = updateData.shuffleQuestions;
      if (updateData.shuffleOptions !== undefined) mappedData.shuffleOptions = updateData.shuffleOptions;
      if (updateData.showCorrectAnswers !== undefined) mappedData.showCorrectAnswers = updateData.showCorrectAnswers;
      if (updateData.showFeedback !== undefined) mappedData.showFeedback = updateData.showFeedback;
      if (updateData.allowReview !== undefined) mappedData.allowReview = updateData.allowReview;
      if (updateData.startDate !== undefined) mappedData.startDate = updateData.startDate;
      if (updateData.endDate !== undefined) mappedData.endDate = updateData.endDate;
      if (updateData.timeLimit !== undefined) mappedData.timeLimit = updateData.timeLimit;
      if (updateData.autoSubmit !== undefined) mappedData.autoSubmit = updateData.autoSubmit;
      if (updateData.tags !== undefined) mappedData.tags = updateData.tags;
      if (updateData.status !== undefined) mappedData.status = updateData.status;
      if (updateData.isPublished !== undefined) mappedData.isPublished = updateData.isPublished;
      if (updateData.publishedAt !== undefined) mappedData.publishedAt = updateData.publishedAt;

      const assessment = await this.prisma.libraryAssessment.update({
        where: { id: assessmentId },
        data: mappedData,
        include: {
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
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      });

      this.logger.log(colors.green(`Assessment updated successfully: ${assessment.title}`));
      return new ApiResponse(true, 'Assessment updated successfully', assessment);
    } catch (error) {
      this.logger.error(colors.red(`Error updating assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Delete an assessment
   */
  async deleteAssessment(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Deleting Assessment: ${assessmentId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify assessment exists and user has access
      const existingAssessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
      });

      if (!existingAssessment) {
        throw new NotFoundException('Assessment not found or access denied');
      }

      // Check if assessment has attempts (prevent deletion if users have taken it)
      const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
        where: { assessmentId: assessmentId },
      });

      if (attemptCount > 0) {
        throw new BadRequestException('Cannot delete assessment that has user attempts. Consider archiving instead.');
      }

      await this.prisma.libraryAssessment.delete({
        where: { id: assessmentId },
      });

      this.logger.log(colors.green(`Assessment deleted successfully: ${assessmentId}`));
      return new ApiResponse(true, 'Assessment deleted successfully');
    } catch (error) {
      this.logger.error(colors.red(`Error deleting assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Publish an assessment (make it available to users)
   */
  async publishAssessment(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Publishing assessment: ${assessmentId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify assessment exists and user has access
      const existingAssessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
        include: {
          questions: true,
        },
      });

      if (!existingAssessment) {
        throw new NotFoundException('Assessment not found or access denied');
      }

      // Check if assessment has questions
      if (existingAssessment.questions.length === 0) {
        throw new BadRequestException('Cannot publish assessment without questions');
      }

      const assessment = await this.prisma.libraryAssessment.update({
        where: { id: assessmentId },
        data: {
          status: 'ACTIVE',
          isPublished: true,
          publishedAt: new Date(),
        },
        include: {
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
        },
      });

      this.logger.log(colors.green(`Assessment published successfully: ${assessment.title}`));
      return new ApiResponse(true, 'Assessment published successfully', assessment);
    } catch (error) {
      this.logger.error(colors.red(`Error publishing assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Unpublish an assessment (make it unavailable to users)
   */
  async unpublishAssessment(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Unpublishing assessment: ${assessmentId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify assessment exists and user has access
      const existingAssessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
      });

      if (!existingAssessment) {
        throw new NotFoundException('Assessment not found or access denied');
      }

      const assessment = await this.prisma.libraryAssessment.update({
        where: { id: assessmentId },
        data: {
          status: 'DRAFT',
          isPublished: false,
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      this.logger.log(colors.green(`Assessment unpublished successfully: ${assessment.title}`));
      return new ApiResponse(true, 'Assessment unpublished successfully', assessment);
    } catch (error) {
      this.logger.error(colors.red(`Error unpublishing assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Release assessment results and close the assessment
   */
  async releaseResults(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Releasing results for assessment: ${assessmentId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify assessment exists and user has access
      const existingAssessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
      });

      if (!existingAssessment) {
        throw new NotFoundException('Assessment not found or access denied');
      }

      // Check if results are already released
      if (existingAssessment.isResultReleased) {
        this.logger.warn(colors.yellow(`Results already released for assessment: ${assessmentId}`));
        return new ApiResponse(true, 'Results already released', existingAssessment);
      }

      // Update assessment: release results and close it
      const assessment = await this.prisma.libraryAssessment.update({
        where: { id: assessmentId },
        data: {
          isResultReleased: true,
          resultReleasedAt: new Date(),
          status: 'CLOSED',
        },
        include: {
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
        },
      });

      this.logger.log(colors.green(`✅ Results released and assessment closed: ${assessment.title}`));
      return new ApiResponse(true, 'Assessment results released successfully. Assessment has been closed.', assessment);
    } catch (error) {
      this.logger.error(colors.red(`Error releasing assessment results: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get a specific assessment by ID
   */
  async getAssessmentById(assessmentId: string, userId: string): Promise<ApiResponse<any>> {
    try {
      this.logger.log(colors.cyan(`Getting assessment: ${assessmentId}`));

      // Get library user
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: userId },
        select: { platformId: true },
      });

      if (!libraryUser) {
        throw new NotFoundException('Library user not found');
      }

      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: libraryUser.platformId,
          createdById: userId,
        },
        include: {
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
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          questions: {
            include: {
              options: true,
              correctAnswers: true,
              _count: {
                select: {
                  responses: true,
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
          _count: {
            select: {
              attempts: true,
            },
          },
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or access denied');
      }

      this.logger.log(colors.green(`Assessment retrieved successfully: ${assessment.title}`));
      return new ApiResponse(true, 'Assessment retrieved successfully', assessment);
    } catch (error) {
      this.logger.error(colors.red(`Error getting assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Helper: Format duration in seconds to HH:MM:SS
   */
  private formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

