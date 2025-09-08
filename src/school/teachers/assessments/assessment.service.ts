import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import { Logger } from '@nestjs/common';
import * as colors from 'colors';
import { CreateCBTQuizDto, CreateCBTQuestionDto, UpdateCBTQuizDto, UpdateCBTQuestionDto } from './cbt-dto';

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
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
  async createQuiz(
    createQuizDto: CreateCBTQuizDto,
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
        end_date: createQuizDto.end_date ? new Date(createQuizDto.end_date) : null,
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
      const quiz = await this.prisma.cBTQuiz.create({
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

      // Get teacher record to access academic session ID
      const teacher = await this.getTeacherByUserId(userId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
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

      // get currrent academic session id
      const currentSessionId = await this.prisma.academicSession.findFirst({
        where: {
          school_id: teacher.school_id,
          is_current: true
        }
      });

      
      if (!currentSessionId) {
        this.logger.error(colors.red(`Current academic session not found: ${teacher.school_id}`));
        throw new NotFoundException('Current academic session not found');
      }
      
      // Build base where clause - include current academic session
      const baseWhere: any = {
        created_by: userId,
        academic_session_id: currentSessionId.id, 
      };

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
        this.prisma.cBTQuiz.findMany({
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
        this.prisma.cBTQuiz.groupBy({
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
      const assessment = await this.prisma.cBTQuiz.findFirst({
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
      const questions = await this.prisma.cBTQuestion.findMany({
        where: {
          quiz_id: assessmentId
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
   * Get all assessments for a specific topic
   * @param topicId - ID of the topic
   * @param teacherId - ID of the teacher
   * @param schoolId - ID of the school
   */
  async getTopicQuizzes(topicId: string, teacherId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Getting quizzes for topic: ${topicId}`));

      // Verify teacher has access to the topic
      await this.verifyTeacherTopicAccess(topicId, teacherId, schoolId);

      const quizzes = await this.prisma.cBTQuiz.findMany({
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
   * @param teacherId - ID of the teacher
   * @param schoolId - ID of the school
   */
  async getQuizById(quizId: string, userId: string) {
    try {
      this.logger.log(colors.cyan(`Getting quiz: ${quizId}`));

      const teacher = await this.prisma.teacher.findFirst({
        where: {
          user_id: userId
        }
      });

      if (!teacher) {
          this.logger.error(colors.red(`Teacher not found: ${userId}`));
        throw new NotFoundException('Teacher not found');
      }

      const quiz = await this.prisma.cBTQuiz.findFirst({
        where: {
          id: quizId,
          created_by: teacher.id
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
   * @param teacherId - ID of the teacher
   * @param schoolId - ID of the school
   */
  async updateQuiz(
    quizId: string,
    updateQuizDto: UpdateCBTQuizDto,
    teacherId: string,
    schoolId: string
  ) {
    try {
      this.logger.log(colors.cyan(`Updating quiz: ${quizId}`));

      // Verify quiz exists and teacher has access
      const existingQuiz = await this.prisma.cBTQuiz.findFirst({
        where: {
          id: quizId,
          school_id: schoolId,
          created_by: teacherId
        }
      });

      if (!existingQuiz) {
        throw new NotFoundException('Quiz not found or access denied');
      }

      // If topic is being changed, verify access to new topic
      if (updateQuizDto.topic_id && updateQuizDto.topic_id !== existingQuiz.topic_id) {
        await this.verifyTeacherTopicAccess(updateQuizDto.topic_id, teacherId, schoolId);
      }

      const updateData: any = { ...updateQuizDto };
      
      // Convert date strings to Date objects
      if (updateQuizDto.start_date) {
        updateData.start_date = new Date(updateQuizDto.start_date);
      }
      if (updateQuizDto.end_date) {
        updateData.end_date = new Date(updateQuizDto.end_date);
      }

      const quiz = await this.prisma.cBTQuiz.update({
        where: { id: quizId },
        data: updateData,
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
          }
        }
      });

      this.logger.log(colors.green(`Quiz updated successfully: ${quiz.title}`));
      return ResponseHelper.success('Quiz updated successfully', quiz);
    } catch (error) {
      this.logger.error(colors.red(`Error updating quiz: ${error.message}`));
      throw error;
    }
  }

  /**
   * Delete a quiz
   * @param quizId - ID of the quiz
   * @param teacherId - ID of the teacher
   * @param schoolId - ID of the school
   */
  async deleteQuiz(quizId: string, teacherId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Deleting quiz: ${quizId}`));

      // Verify quiz exists and teacher has access
      const existingQuiz = await this.prisma.cBTQuiz.findFirst({
        where: {
          id: quizId,
          school_id: schoolId,
          created_by: teacherId
        }
      });

      if (!existingQuiz) {
        throw new NotFoundException('Quiz not found or access denied');
      }

      // Check if quiz has attempts (prevent deletion if students have taken it)
      const attemptCount = await this.prisma.cBTQuizAttempt.count({
        where: { quiz_id: quizId }
      });

      if (attemptCount > 0) {
        throw new BadRequestException('Cannot delete quiz that has student attempts. Consider archiving instead.');
      }

      await this.prisma.cBTQuiz.delete({
        where: { id: quizId }
      });

      this.logger.log(colors.green(`Quiz deleted successfully: ${quizId}`));
      return ResponseHelper.success('Quiz deleted successfully');
    } catch (error) {
      this.logger.error(colors.red(`Error deleting quiz: ${error.message}`));
      throw error;
    }
  }

  /**
   * Publish a quiz (make it available to students)
   * @param quizId - ID of the quiz
   * @param teacherId - ID of the teacher
   * @param schoolId - ID of the school
   */
  async publishQuiz(quizId: string, teacherId: string, schoolId: string) {
    try {
      this.logger.log(colors.cyan(`Publishing quiz: ${quizId}`));

      // Verify quiz exists and teacher has access
      const existingQuiz = await this.prisma.cBTQuiz.findFirst({
        where: {
          id: quizId,
          school_id: schoolId,
          created_by: teacherId
        },
        include: {
          questions: true
        }
      });

      if (!existingQuiz) {
        throw new NotFoundException('Quiz not found or access denied');
      }

      // Check if quiz has questions
      if (existingQuiz.questions.length === 0) {
        throw new BadRequestException('Cannot publish quiz without questions');
      }

      const quiz = await this.prisma.cBTQuiz.update({
        where: { id: quizId },
        data: {
          status: 'PUBLISHED',
          is_published: true,
          published_at: new Date()
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
          }
        }
      });

      this.logger.log(colors.green(`Quiz published successfully: ${quiz.title}`));
      return ResponseHelper.success('Quiz published successfully', quiz);
    } catch (error) {
      this.logger.error(colors.red(`Error publishing quiz: ${error.message}`));
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
