import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../shared/services/providers/storage.service';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';
import * as colors from 'colors';
import { CreateNewAssessmentDto, GetAssessmentsQueryDto, UpdateAssessmentDto, SubmitAssessmentDto, DuplicateAssessmentDto, AddQuestionsDto, UpdateQuestionDto } from '../dto';
import { AssessmentType, Prisma, QuestionType, DifficultyLevel } from '@prisma/client';
import { StatusAnalytics } from './assessment.types';
import { AssessmentGradingService } from './assessment-grading.service';

/**
 * Library Assessment Service
 * 
 * Handles all library-specific assessment operations:
 * - Create library assessments
 * - Get library assessments (list and details)
 * - Update library assessments
 * - Get questions for library users
 * - Submit library assessments
 * - Upload question images
 */
@Injectable()
export class LibraryAssessmentService {
  private readonly logger = new Logger(LibraryAssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly gradingService: AssessmentGradingService,
  ) {}

  // ========================================
  // CREATE ASSESSMENT
  // ========================================

  /**
   * Create a library assessment (for library owners)
   */
  async createLibraryAssessment(
    createAssessmentDto: CreateNewAssessmentDto,
    platformId: string,
    userId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Creating Library Assessment: ${createAssessmentDto.title}`));

    // Single query to validate platform, subject, and optionally topic
    const librarySubject = await this.prisma.librarySubject.findFirst({
      where: {
        id: createAssessmentDto.subject_id,
        platformId: platformId,
      },
      include: {
        topics: createAssessmentDto.topic_id
          ? { where: { id: createAssessmentDto.topic_id }, take: 1 }
          : false,
      },
    });

    if (!librarySubject) {
      this.logger.error(colors.red(`Library subject not found: ${createAssessmentDto.subject_id} for platform: ${platformId}`));
      throw new NotFoundException('Library subject not found or does not belong to your platform');
    }

    if (createAssessmentDto.topic_id && librarySubject.topics?.length === 0) {
      this.logger.error(colors.red(`Library topic not found: ${createAssessmentDto.topic_id} for subject: ${createAssessmentDto.subject_id}`));
      throw new NotFoundException('Library topic not found or does not belong to this subject');
    }

    // Create the library assessment
    const assessment = await this.prisma.libraryAssessment.create({
      data: {
        platformId: platformId,
        subjectId: createAssessmentDto.subject_id,
        topicId: createAssessmentDto.topic_id || null,
        createdById: userId,
        title: createAssessmentDto.title,
        description: createAssessmentDto.description,
        instructions: createAssessmentDto.instructions,
        assessmentType: (createAssessmentDto.assessment_type as AssessmentType) || AssessmentType.CBT,
        gradingType: createAssessmentDto.grading_type || 'AUTOMATIC',
        duration: createAssessmentDto.duration,
        maxAttempts: createAssessmentDto.max_attempts || 1,
        passingScore: createAssessmentDto.passing_score || 50.0,
        totalPoints: createAssessmentDto.total_points || 100.0,
        shuffleQuestions: createAssessmentDto.shuffle_questions || false,
        shuffleOptions: createAssessmentDto.shuffle_options || false,
        showCorrectAnswers: createAssessmentDto.show_correct_answers || false,
        showFeedback: createAssessmentDto.show_feedback !== false,
        allowReview: createAssessmentDto.allow_review !== false,
        startDate: createAssessmentDto.start_date ? new Date(createAssessmentDto.start_date) : null,
        endDate: createAssessmentDto.end_date ? new Date(createAssessmentDto.end_date) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeLimit: createAssessmentDto.time_limit,
        autoSubmit: createAssessmentDto.auto_submit || false,
        tags: createAssessmentDto.tags || [],
        status: 'DRAFT',
        isPublished: false,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        topic: {
          select: { id: true, title: true },
        },
        createdBy: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    this.logger.log(colors.green(`[LIBRARY] Assessment created successfully: ${assessment.id}`));
    return ResponseHelper.success('Library assessment created successfully', {
      ...assessment,
      assessmentContext: 'library',
    });
  }

  // ========================================
  // GET ASSESSMENTS
  // ========================================

  /**
   * Get all library assessments for library owners
   * Library owners can see all assessments in their platform
   */
  async getAllLibraryAssessments(
    query: GetAssessmentsQueryDto,
    platformId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Fetching library assessments for platform: ${platformId}`));

    // Build base where clause for LibraryAssessment
    const baseWhere: Prisma.LibraryAssessmentWhereInput = {
      platformId: platformId,
    };

    // Apply optional filters (using camelCase for library models)
    if (query.subject_id) baseWhere.subjectId = query.subject_id;
    if (query.topic_id) baseWhere.topicId = query.topic_id;
    if (query.status) baseWhere.status = query.status;
    if (query.assessment_type) baseWhere.assessmentType = query.assessment_type;
    if (query.is_published !== undefined) baseWhere.isPublished = query.is_published;
    if (query.created_by) baseWhere.createdById = query.created_by;

    // Apply search filter
    if (query.search) {
      baseWhere.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build analytics where clause (without status filter)
    const analyticsWhere: Prisma.LibraryAssessmentWhereInput = { ...baseWhere };
    delete analyticsWhere.status;
    delete analyticsWhere.isPublished;

    // Execute count, find, and status analytics in parallel
    const [total, assessments, statusCounts] = await Promise.all([
      this.prisma.libraryAssessment.count({ where: baseWhere }),
      this.prisma.libraryAssessment.findMany({
        where: baseWhere,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit,
        orderBy: { [query.sort_by === 'start_date' ? 'startDate' : query.sort_by === 'end_date' ? 'endDate' : query.sort_by!]: query.sort_order },
        include: {
          subject: {
            select: { id: true, name: true, code: true },
          },
          topic: {
            select: { id: true, title: true },
          },
          createdBy: {
            select: { id: true, first_name: true, last_name: true },
          },
          _count: {
            select: {
              questions: true,
              attempts: true,
            },
          },
        },
      }),
      this.prisma.libraryAssessment.groupBy({
        by: ['status'],
        where: analyticsWhere,
        _count: { id: true },
      }),
    ]);

    // Build status analytics object
    const statusAnalytics: StatusAnalytics = {
      all: 0,
      draft: 0,
      published: 0,
      active: 0,
      closed: 0,
      archived: 0,
    };

    statusCounts.forEach((item) => {
      const count = item._count.id;
      statusAnalytics.all += count;
      statusAnalytics[item.status.toLowerCase() as keyof StatusAnalytics] = count;
    });

    const totalPages = Math.ceil(total / query.limit!);

    this.logger.log(colors.green(`[LIBRARY] Fetched ${assessments.length} library assessments (page ${query.page}/${totalPages})`));

    return ResponseHelper.success('Library assessments fetched successfully', {
      analytics: statusAnalytics,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
      assessments,
      assessmentContext: 'library',
    });
  }

  /**
   * Get library assessment details by ID
   * Returns: assessment info, questions, and attempts
   */
  async getLibraryAssessmentDetails(
    assessmentId: string,
    platformId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Getting library assessment details: ${assessmentId}`));

    // Fetch the library assessment
    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        topic: {
          select: { id: true, title: true },
        },
        createdBy: {
          select: { id: true, first_name: true, last_name: true, email: true },
        },
        platform: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`[LIBRARY] Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Library assessment not found');
    }

    // Fetch questions and attempts in parallel
    const [questions, attempts] = await Promise.all([
      // Get all questions with options and correct answers
      this.prisma.libraryAssessmentQuestion.findMany({
        where: { assessmentId: assessment.id },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
          correctAnswers: true,
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { order: 'asc' },
      }),

      // Get all attempts for this assessment
      this.prisma.libraryAssessmentAttempt.findMany({
        where: {
          assessmentId: assessment.id,
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    // Group attempts by user
    const attemptsByUser = new Map<string, any[]>();
    attempts.forEach(attempt => {
      const odUserId = attempt.user?.id || 'unknown';
      if (!attemptsByUser.has(odUserId)) {
        attemptsByUser.set(odUserId, []);
      }
      attemptsByUser.get(odUserId)!.push(attempt);
    });

    // Build user submission report
    const usersWithAttempts = Array.from(attemptsByUser.entries()).map(([odUserId, userAttempts]) => {
      const firstAttempt = userAttempts[0];
      const bestAttempt = userAttempts.reduce((best, current) =>
        (current.percentage || 0) > (best.percentage || 0) ? current : best
      );

      return {
        user: {
          id: firstAttempt.user?.id,
          first_name: firstAttempt.user?.first_name,
          last_name: firstAttempt.user?.last_name,
          email: firstAttempt.user?.email,
          display_picture: firstAttempt.user?.display_picture,
        },
        attempts: userAttempts.map(a => ({
          id: a.id,
          attemptNumber: a.attemptNumber,
          status: a.status,
          startedAt: a.startedAt,
          submittedAt: a.submittedAt,
          timeSpent: a.timeSpent,
          totalScore: a.totalScore,
          maxScore: a.maxScore,
          percentage: a.percentage,
          passed: a.passed,
          isGraded: a.isGraded,
          gradedAt: a.gradedAt,
          gradeLetter: a.gradeLetter,
        })),
        totalAttempts: userAttempts.length,
        bestScore: bestAttempt?.percentage || null,
        passed: bestAttempt?.passed || false,
      };
    });

    const totalUsers = usersWithAttempts.length;
    const usersPassed = usersWithAttempts.filter(u => u.passed).length;

    this.logger.log(colors.green(`[LIBRARY] Assessment details retrieved: ${questions.length} questions, ${attempts.length} attempts`));

    return ResponseHelper.success('Library assessment details retrieved successfully', {
      assessment,
      questions: {
        total: questions.length,
        items: questions,
      },
      submissions: {
        summary: {
          totalUsers,
          totalAttempts: attempts.length,
          usersPassed,
          passRate: totalUsers > 0 ? Math.round((usersPassed / totalUsers) * 100) : 0,
        },
        users: usersWithAttempts,
      },
      assessmentContext: 'library',
    });
  }

  // ========================================
  // UPDATE ASSESSMENT
  // ========================================

  /**
   * Update a library assessment
   */
  async updateLibraryAssessment(
    assessmentId: string,
    updateDto: UpdateAssessmentDto,
    platformId: string,
    userId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Updating assessment: ${assessmentId}`));

    // Fetch existing assessment
    const existingAssessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
      },
      select: {
        id: true,
        status: true,
        isPublished: true,
        subjectId: true,
        topicId: true,
        endDate: true,
        title: true,
        createdById: true,
      },
    });

    if (!existingAssessment) {
      this.logger.error(colors.red(`Library assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found or you do not have permission to update it');
    }

    // Check if assessment is published - cannot update published assessments
    const publishedStatuses = ['PUBLISHED', 'ACTIVE'];
    if (publishedStatuses.includes(existingAssessment.status)) {
      this.logger.warn(colors.yellow(`Cannot update published library assessment: ${assessmentId} (status: ${existingAssessment.status})`));
      throw new BadRequestException(
        `Cannot update assessment with status "${existingAssessment.status}". Change status to DRAFT first to make modifications.`
      );
    }

    // Validate subject_id if being changed (maps to subjectId in library)
    if (updateDto.subject_id && updateDto.subject_id !== existingAssessment.subjectId) {
      const subject = await this.prisma.librarySubject.findFirst({
        where: {
          id: updateDto.subject_id,
          platformId: platformId,
        },
      });

      if (!subject) {
        this.logger.error(colors.red(`Library subject not found: ${updateDto.subject_id}`));
        throw new NotFoundException('Subject not found in this platform');
      }
    }

    // Validate topic_id if being changed (maps to topicId in library)
    if (updateDto.topic_id && updateDto.topic_id !== existingAssessment.topicId) {
      const effectiveSubjectId = updateDto.subject_id || existingAssessment.subjectId;
      const topic = await this.prisma.libraryTopic.findFirst({
        where: {
          id: updateDto.topic_id,
          subjectId: effectiveSubjectId,
        },
      });

      if (!topic) {
        this.logger.error(colors.red(`Library topic not found: ${updateDto.topic_id}`));
        throw new NotFoundException('Topic not found or does not belong to the specified subject');
      }
    }

    // Build update data with camelCase field mapping
    const updateData: any = {};

    // Map snake_case DTO fields to camelCase library fields
    const fieldMapping: Record<string, string> = {
      'subject_id': 'subjectId',
      'topic_id': 'topicId',
      'max_attempts': 'maxAttempts',
      'passing_score': 'passingScore',
      'total_points': 'totalPoints',
      'shuffle_questions': 'shuffleQuestions',
      'shuffle_options': 'shuffleOptions',
      'show_correct_answers': 'showCorrectAnswers',
      'show_feedback': 'showFeedback',
      'allow_review': 'allowReview',
      'time_limit': 'timeLimit',
      'grading_type': 'gradingType',
      'auto_submit': 'autoSubmit',
      'assessment_type': 'assessmentType',
      'is_result_released': 'isResultReleased',
      'student_can_view_grading': 'studentCanViewGrading',
      'start_date': 'startDate',
      'end_date': 'endDate',
    };

    // Copy fields with mapping
    const allowedFields = [
      'title', 'description', 'instructions', 'subject_id', 'topic_id',
      'duration', 'max_attempts', 'passing_score', 'total_points',
      'shuffle_questions', 'shuffle_options', 'show_correct_answers',
      'show_feedback', 'allow_review', 'time_limit', 'grading_type',
      'auto_submit', 'tags', 'assessment_type', 'is_result_released',
      'student_can_view_grading', 'status'
    ];

    for (const field of allowedFields) {
      if (updateDto[field] !== undefined) {
        const mappedField = fieldMapping[field] || field;
        updateData[mappedField] = updateDto[field];
      }
    }

    // Convert date strings to Date objects
    if (updateDto.start_date) {
      updateData.startDate = new Date(updateDto.start_date);
    }
    if (updateDto.end_date) {
      updateData.endDate = new Date(updateDto.end_date);
    }

    // Handle status changes
    if (updateDto.status) {
      const isBeingPublished = ['PUBLISHED', 'ACTIVE'].includes(updateDto.status) && !existingAssessment.isPublished;

      if (isBeingPublished) {
        // Validate endDate is not in the past
        const effectiveEndDate = updateData.endDate ?? existingAssessment.endDate;
        if (effectiveEndDate && new Date(effectiveEndDate) < new Date()) {
          this.logger.error(colors.red(`Cannot publish library assessment with past endDate: ${effectiveEndDate}`));
          throw new BadRequestException(
            'Cannot publish an assessment that has already expired. Please set an end date in the future first.'
          );
        }
        updateData.isPublished = true;
        updateData.publishedAt = new Date();
      }

      const isBeingUnpublished = updateDto.status === 'DRAFT' && existingAssessment.isPublished;
      if (isBeingUnpublished) {
        updateData.isPublished = false;
      }
    }

    // Don't pass empty/undefined assessmentType to Prisma
    if (updateData.assessmentType === '' || updateData.assessmentType === undefined) {
      delete updateData.assessmentType;
    }

    // Perform the update
    const updatedAssessment = await this.prisma.libraryAssessment.update({
      where: { id: assessmentId },
      data: updateData,
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        topic: {
          select: { id: true, title: true },
        },
        createdBy: {
          select: { id: true, first_name: true, last_name: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
    });

    this.logger.log(colors.green(`[LIBRARY] Assessment updated successfully: ${assessmentId}`));

    return ResponseHelper.success('Assessment updated successfully', {
      assessment: updatedAssessment,
      assessmentContext: 'library',
    });
  }

  // ========================================
  // GET QUESTIONS (FOR TAKING)
  // ========================================

  /**
   * Get library assessment questions for a user to take an assessment
   * @param isOwner - If true, shows preview with correct answers
   */
  async getLibraryAssessmentQuestions(
    assessmentId: string,
    platformId: string,
    userId: string,
    isOwner: boolean = false
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Fetching assessment questions: ${assessmentId}`));

    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
        ...(isOwner ? {} : { status: { in: ['PUBLISHED', 'ACTIVE'] } }),
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, first_name: true, last_name: true },
        },
        questions: {
          include: {
            options: {
              select: { id: true, optionText: true, isCorrect: true, order: true },
              orderBy: { order: 'asc' },
            },
            correctAnswers: {
              select: { id: true, answerText: true, optionIds: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { attempts: true },
        },
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Library assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found or not available');
    }

    // If owner, show preview with correct answers
    if (isOwner) {
      const questions = assessment.questions.map(q => ({
        id: q.id,
        question_text: q.questionText,
        question_type: q.questionType,
        points: q.points,
        order: q.order,
        image_url: q.imageUrl,
        audio_url: q.audioUrl,
        video_url: q.videoUrl,
        is_required: q.isRequired,
        explanation: q.explanation,
        difficulty_level: q.difficultyLevel,
        options: q.options.map(o => ({
          id: o.id,
          text: o.optionText,
          is_correct: o.isCorrect,
          order: o.order,
        })),
        correct_answers: q.correctAnswers.map(ca => ({
          id: ca.id,
          answer_text: ca.answerText,
          option_ids: ca.optionIds,
        })),
      }));

      this.logger.log(colors.green(`[LIBRARY PREVIEW] Questions retrieved: ${questions.length}`));

      return ResponseHelper.success('Assessment questions retrieved successfully (preview mode)', {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          description: assessment.description,
          instructions: assessment.instructions,
          duration: assessment.duration,
          timeLimit: assessment.timeLimit,
          totalPoints: assessment.totalPoints,
          maxAttempts: assessment.maxAttempts,
          passingScore: assessment.passingScore,
          status: assessment.status,
          isPublished: assessment.isPublished,
          startDate: assessment.startDate,
          endDate: assessment.endDate,
          subject: assessment.subject,
          createdBy: {
            id: assessment.createdBy.id,
            name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`,
          },
          totalAttempts: assessment._count.attempts,
        },
        questions,
        total_questions: questions.length,
        isPreview: true,
        assessmentContext: 'library',
      });
    }

    // For regular users taking the assessment
    const now = new Date();
    if (assessment.startDate && assessment.startDate > now) {
      throw new BadRequestException('Assessment has not started yet');
    }

    if (assessment.endDate && assessment.endDate < now) {
      await this.prisma.libraryAssessment.update({
        where: { id: assessmentId },
        data: { status: 'CLOSED' },
      }).catch(() => {});
      throw new BadRequestException('Assessment has expired');
    }

    // Check attempt count for the user
    const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
      where: {
        assessmentId: assessmentId,
        userId: userId,
      },
    });

    if (attemptCount >= assessment.maxAttempts) {
      throw new ForbiddenException('Maximum attempts reached for this assessment');
    }

    // Format questions (hide correct answers)
    const questions = assessment.questions.map(q => {
      let options = q.options.map(o => ({
        id: o.id,
        text: o.optionText,
        order: o.order,
      }));

      if (assessment.shuffleOptions) {
        options = this.gradingService.shuffleArray(options);
      }

      return {
        id: q.id,
        question_text: q.questionText,
        question_type: q.questionType,
        points: q.points,
        order: q.order,
        image_url: q.imageUrl,
        audio_url: q.audioUrl,
        video_url: q.videoUrl,
        is_required: q.isRequired,
        options,
      };
    });

    const finalQuestions = assessment.shuffleQuestions 
      ? this.gradingService.shuffleArray(questions) 
      : questions;

    this.logger.log(colors.green(`[LIBRARY] Questions retrieved: ${finalQuestions.length}`));

    return ResponseHelper.success('Assessment questions retrieved successfully', {
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        instructions: assessment.instructions,
        duration: assessment.duration,
        timeLimit: assessment.timeLimit,
        totalPoints: assessment.totalPoints,
        maxAttempts: assessment.maxAttempts,
        passingScore: assessment.passingScore,
        autoSubmit: assessment.autoSubmit,
        startDate: assessment.startDate,
        endDate: assessment.endDate,
        subject: assessment.subject,
        createdBy: {
          id: assessment.createdBy.id,
          name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`,
        },
      },
      questions: finalQuestions,
      total_questions: finalQuestions.length,
      user_attempts: attemptCount,
      remaining_attempts: assessment.maxAttempts - attemptCount,
      assessmentContext: 'library',
    });
  }

  // ========================================
  // SUBMIT ASSESSMENT
  // ========================================

  /**
   * Submit a library assessment
   */
  async submitLibraryAssessment(
    assessmentId: string,
    submitDto: SubmitAssessmentDto,
    platformId: string,
    userId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Submitting assessment: ${assessmentId}`));

    // Get the assessment with questions
    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
        status: { in: ['PUBLISHED', 'ACTIVE'] },
      },
      include: {
        questions: {
          include: {
            correctAnswers: true,
            options: {
              select: { id: true, isCorrect: true },
            },
          },
        },
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Library assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found or not available');
    }

    // Check attempt count
    const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
      where: {
        assessmentId: assessmentId,
        userId: userId,
      },
    });

    if (attemptCount >= assessment.maxAttempts) {
      this.logger.warn(colors.yellow(`Maximum attempts reached: ${assessmentId}`));
      throw new ForbiddenException('Maximum attempts reached for this assessment');
    }

    // Normalize answers
    const normalizedAnswers = this.gradingService.normalizeAnswers(submitDto.answers);

    // Grade answers
    const { gradedAnswers, totalScore, totalPoints } = this.gradingService.gradeLibraryAnswers(
      normalizedAnswers,
      assessment.questions
    );

    // Calculate final scores
    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const passed = percentage >= assessment.passingScore;
    const grade = this.gradingService.calculateGrade(percentage);
    const timeSpent = submitDto.time_taken || 0;

    // Create attempt and responses in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create attempt
      const attempt = await tx.libraryAssessmentAttempt.create({
        data: {
          assessmentId: assessmentId,
          userId: userId,
          attemptNumber: attemptCount + 1,
          status: 'GRADED',
          startedAt: new Date(),
          submittedAt: submitDto.submission_time ? new Date(submitDto.submission_time) : new Date(),
          timeSpent: timeSpent,
          totalScore: totalScore,
          maxScore: assessment.totalPoints,
          percentage: percentage,
          passed: passed,
          isGraded: true,
          gradedAt: new Date(),
          gradeLetter: grade,
        },
      });

      // Create responses
      const responses = await Promise.all(
        gradedAnswers.map((answer) =>
          tx.libraryAssessmentResponse.create({
            data: {
              attemptId: attempt.id,
              questionId: answer.question_id,
              userId: userId,
              textAnswer: answer.text_answer || null,
              numericAnswer: answer.numeric_answer || null,
              dateAnswer: answer.date_answer || null,
              selectedOptions: answer.selected_options || [],
              isCorrect: answer.is_correct,
              pointsEarned: answer.points_earned,
              maxPoints: answer.max_points,
            },
          })
        )
      );

      return { attempt, responses };
    });

    this.logger.log(colors.green(`[LIBRARY] Assessment submitted: ${totalScore}/${totalPoints} (${percentage.toFixed(1)}%)`));

    return ResponseHelper.success('Assessment submitted successfully', {
      attempt_id: result.attempt.id,
      assessment_id: assessmentId,
      total_score: totalScore,
      total_points: totalPoints,
      percentage: percentage,
      passed: passed,
      grade: grade,
      answers: gradedAnswers.map((a) => ({
        question_id: a.question_id,
        is_correct: a.is_correct,
        points_earned: a.points_earned,
        max_points: a.max_points,
      })),
      submission_metadata: {
        total_questions: submitDto.total_questions,
        questions_answered: submitDto.questions_answered,
        questions_skipped: submitDto.questions_skipped,
        submission_status: submitDto.submission_status,
        device_info: submitDto.device_info,
      },
      submitted_at: result.attempt.submittedAt,
      time_spent: timeSpent,
      attempt_number: result.attempt.attemptNumber,
      remaining_attempts: assessment.maxAttempts - (attemptCount + 1),
      assessmentContext: 'library',
    });
  }

  // ========================================
  // DUPLICATE ASSESSMENT
  // ========================================

  /**
   * Duplicate a library assessment
   * Creates a copy of an existing assessment with a new title.
   * Optionally shuffles questions and/or options.
   */
  async duplicateLibraryAssessment(
    assessmentId: string,
    duplicateDto: DuplicateAssessmentDto,
    platformId: string,
    userId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Duplicating assessment: ${assessmentId}`));

    // Fetch source assessment with all questions and options
    const sourceAssessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
      },
      include: {
        questions: {
          include: {
            options: true,
            correctAnswers: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!sourceAssessment) {
      this.logger.error(colors.red(`Library assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // Prepare questions with optional shuffling
    let questions = [...sourceAssessment.questions];
    if (duplicateDto.shuffle_questions) {
      questions = this.gradingService.shuffleArray(questions);
    }

    // Create the new assessment with questions in a transaction
    const newAssessment = await this.prisma.$transaction(async (tx) => {
      // Create the assessment
      const assessment = await tx.libraryAssessment.create({
        data: {
          platformId: platformId,
          subjectId: sourceAssessment.subjectId,
          topicId: sourceAssessment.topicId,
          createdById: userId,
          title: duplicateDto.new_title,
          description: duplicateDto.new_description || sourceAssessment.description,
          instructions: sourceAssessment.instructions,
          assessmentType: sourceAssessment.assessmentType,
          gradingType: sourceAssessment.gradingType,
          duration: sourceAssessment.duration,
          maxAttempts: sourceAssessment.maxAttempts,
          passingScore: sourceAssessment.passingScore,
          totalPoints: sourceAssessment.totalPoints,
          shuffleQuestions: duplicateDto.shuffle_questions || sourceAssessment.shuffleQuestions,
          shuffleOptions: duplicateDto.shuffle_options || sourceAssessment.shuffleOptions,
          showCorrectAnswers: sourceAssessment.showCorrectAnswers,
          showFeedback: sourceAssessment.showFeedback,
          allowReview: sourceAssessment.allowReview,
          timeLimit: sourceAssessment.timeLimit,
          autoSubmit: sourceAssessment.autoSubmit,
          tags: sourceAssessment.tags,
          status: 'DRAFT',
          isPublished: false,
          // Reset dates - user must set new dates
          startDate: null,
          endDate: null,
        },
      });

      // Create questions with their options and correct answers
      for (let i = 0; i < questions.length; i++) {
        const sourceQuestion = questions[i];

        // Prepare options with optional shuffling
        let options = [...sourceQuestion.options];
        if (duplicateDto.shuffle_options) {
          options = this.gradingService.shuffleArray(options);
        }

        // Create the question
        const newQuestion = await tx.libraryAssessmentQuestion.create({
          data: {
            assessmentId: assessment.id,
            questionText: sourceQuestion.questionText,
            questionType: sourceQuestion.questionType,
            order: i + 1, // Use new order
            points: sourceQuestion.points,
            isRequired: sourceQuestion.isRequired,
            timeLimit: sourceQuestion.timeLimit,
            imageUrl: sourceQuestion.imageUrl,
            imageS3Key: sourceQuestion.imageS3Key,
            audioUrl: sourceQuestion.audioUrl,
            videoUrl: sourceQuestion.videoUrl,
            allowMultipleAttempts: sourceQuestion.allowMultipleAttempts,
            showHint: sourceQuestion.showHint,
            hintText: sourceQuestion.hintText,
            minLength: sourceQuestion.minLength,
            maxLength: sourceQuestion.maxLength,
            minValue: sourceQuestion.minValue,
            maxValue: sourceQuestion.maxValue,
            explanation: sourceQuestion.explanation,
            difficultyLevel: sourceQuestion.difficultyLevel,
          },
        });

        // Create option ID mapping (old -> new) for correctAnswers
        const optionIdMap = new Map<string, string>();

        // Create options
        for (let j = 0; j < options.length; j++) {
          const sourceOption = options[j];
          const newOption = await tx.libraryAssessmentOption.create({
            data: {
              questionId: newQuestion.id,
              optionText: sourceOption.optionText,
              order: j + 1, // Use new order
              isCorrect: sourceOption.isCorrect,
              imageUrl: sourceOption.imageUrl,
              imageS3Key: sourceOption.imageS3Key,
              audioUrl: sourceOption.audioUrl,
            },
          });
          optionIdMap.set(sourceOption.id, newOption.id);
        }

        // Create correct answers with updated option IDs
        for (const sourceAnswer of sourceQuestion.correctAnswers) {
          // Map old option IDs to new option IDs
          const newOptionIds = (sourceAnswer.optionIds || []).map(
            (oldId) => optionIdMap.get(oldId) || oldId
          );

          await tx.libraryAssessmentCorrectAnswer.create({
            data: {
              questionId: newQuestion.id,
              answerText: sourceAnswer.answerText,
              answerNumber: sourceAnswer.answerNumber,
              answerDate: sourceAnswer.answerDate,
              optionIds: newOptionIds,
              answerJson: sourceAnswer.answerJson ?? undefined,
            },
          });
        }
      }

      // Fetch the complete new assessment
      return tx.libraryAssessment.findUnique({
        where: { id: assessment.id },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          topic: { select: { id: true, title: true } },
          createdBy: { select: { id: true, first_name: true, last_name: true, email: true } },
          _count: { select: { questions: true } },
        },
      });
    });

    this.logger.log(colors.green(`[LIBRARY] Assessment duplicated successfully: ${newAssessment!.id}`));

    return ResponseHelper.success('Assessment duplicated successfully', {
      assessment: newAssessment,
      source_assessment_id: assessmentId,
      shuffle_applied: {
        questions: duplicateDto.shuffle_questions || false,
        options: duplicateDto.shuffle_options || false,
      },
    });
  }

  // ========================================
  // ADD QUESTIONS TO ASSESSMENT
  // ========================================

  /**
   * Add questions to an existing library assessment
   *
   * - Validates assessment ownership by platform
   * - Prevents adding to PUBLISHED or ACTIVE assessments
   * - Auto-assigns order numbers starting after existing questions
   * - Creates questions, options, and correct answers in a single transaction
   * - Recalculates totalPoints on the assessment
   */
  async addLibraryAssessmentQuestions(
    assessmentId: string,
    addQuestionsDto: AddQuestionsDto,
    platformId: string,
    userId: string,
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Adding ${addQuestionsDto.questions.length} question(s) to assessment: ${assessmentId}`));

    // 1. Fetch the assessment and verify ownership
    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
      },
      include: {
        _count: { select: { questions: true } },
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Library assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // 2. Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot add questions to a ${assessment.status} assessment. Change the status to DRAFT or CLOSED first.`,
      );
    }

    // 3. Get current max order to continue numbering
    const lastQuestion = await this.prisma.libraryAssessmentQuestion.findFirst({
      where: { assessmentId: assessmentId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let nextOrder = (lastQuestion?.order ?? 0) + 1;

    // 4. Create all questions, options, and correct answers in a transaction
    const createdQuestions = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const questionDto of addQuestionsDto.questions) {
        const questionOrder = questionDto.order ?? nextOrder++;

        // Create the question
        const newQuestion = await tx.libraryAssessmentQuestion.create({
          data: {
            assessmentId: assessmentId,
            questionText: questionDto.question_text,
            questionType: questionDto.question_type as QuestionType,
            order: questionOrder,
            points: questionDto.points ?? 1.0,
            isRequired: questionDto.is_required ?? true,
            timeLimit: questionDto.time_limit ?? null,
            imageUrl: questionDto.image_url ?? null,
            imageS3Key: questionDto.image_s3_key ?? null,
            audioUrl: questionDto.audio_url ?? null,
            videoUrl: questionDto.video_url ?? null,
            allowMultipleAttempts: questionDto.allow_multiple_attempts ?? false,
            showHint: questionDto.show_hint ?? false,
            hintText: questionDto.hint_text ?? null,
            minLength: questionDto.min_length ?? null,
            maxLength: questionDto.max_length ?? null,
            minValue: questionDto.min_value ?? null,
            maxValue: questionDto.max_value ?? null,
            explanation: questionDto.explanation ?? null,
            difficultyLevel: (questionDto.difficulty_level ?? 'MEDIUM') as DifficultyLevel,
          },
        });

        // Track option IDs for correctAnswers referencing
        const createdOptionIds: string[] = [];

        // Create options (for MCQ / TRUE_FALSE)
        if (questionDto.options?.length) {
          for (let j = 0; j < questionDto.options.length; j++) {
            const optDto = questionDto.options[j];
            const newOption = await tx.libraryAssessmentOption.create({
              data: {
                questionId: newQuestion.id,
                optionText: optDto.option_text,
                order: optDto.order ?? j + 1,
                isCorrect: optDto.is_correct,
                imageUrl: optDto.image_url ?? null,
                imageS3Key: optDto.image_s3_key ?? null,
                audioUrl: optDto.audio_url ?? null,
              },
            });
            if (optDto.is_correct) {
              createdOptionIds.push(newOption.id);
            }
          }

          // Auto-create correctAnswer record linking correct option IDs (for MCQ types)
          if (createdOptionIds.length > 0) {
            await tx.libraryAssessmentCorrectAnswer.create({
              data: {
                questionId: newQuestion.id,
                optionIds: createdOptionIds,
              },
            });
          }
        }

        // Create explicit correct answers (for non-MCQ types)
        if (questionDto.correct_answers?.length) {
          for (const answerDto of questionDto.correct_answers) {
            await tx.libraryAssessmentCorrectAnswer.create({
              data: {
                questionId: newQuestion.id,
                answerText: answerDto.answer_text ?? null,
                answerNumber: answerDto.answer_number ?? null,
                answerDate: answerDto.answer_date ? new Date(answerDto.answer_date) : null,
                answerJson: answerDto.answer_json ?? undefined,
              },
            });
          }
        }

        // Fetch the full question with relations
        const fullQuestion = await tx.libraryAssessmentQuestion.findUnique({
          where: { id: newQuestion.id },
          include: {
            options: { orderBy: { order: 'asc' } },
            correctAnswers: true,
          },
        });

        results.push(fullQuestion);
      }

      // 5. Recalculate totalPoints on the assessment
      const totalPoints = await tx.libraryAssessmentQuestion.aggregate({
        where: { assessmentId: assessmentId },
        _sum: { points: true },
      });

      await tx.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum.points ?? 0 },
      });

      return results;
    });

    this.logger.log(colors.green(`[LIBRARY] Successfully added ${createdQuestions.length} question(s) to assessment: ${assessmentId}`));

    return ResponseHelper.success('Questions added successfully', {
      assessment_id: assessmentId,
      questions_added: createdQuestions.length,
      total_questions: assessment._count.questions + createdQuestions.length,
      questions: createdQuestions,
    });
  }

  // ========================================
  // ADD QUESTION WITH IMAGE (ATOMIC)
  // ========================================

  /**
   * Validates an image file (type and size)
   */
  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid image file type: ${file.originalname}. Allowed: JPEG, PNG, GIF, WEBP`);
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`Image file ${file.originalname} exceeds 5MB limit`);
    }
  }

  /**
   * Create a single question with image uploads in one atomic operation.
   * Supports a question image and multiple option images.
   * Uploads all images to S3, creates the question, and rolls back ALL images if creation fails.
   */
  async addQuestionWithImage(
    assessmentId: string,
    questionDataString: string,
    questionImage: Express.Multer.File | undefined,
    optionImages: Express.Multer.File[],
    platformId: string,
    userId: string,
  ) {
    const uploadedKeys: string[] = [];

    try {
      this.logger.log(colors.cyan(`[LIBRARY] Creating question with images for assessment: ${assessmentId}`));

      // Parse the JSON question data
      let questionData: any;
      try {
        questionData = JSON.parse(questionDataString);
      } catch (parseError) {
        throw new BadRequestException('Invalid JSON in questionData field');
      }

      // Verify the assessment exists and belongs to the platform
      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          id: assessmentId,
          platformId: platformId,
        },
        include: {
          _count: { select: { questions: true } },
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Check assessment status
      if (['PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'].includes(assessment.status)) {
        throw new BadRequestException('Cannot add questions to a published, active, closed, or archived assessment');
      }

      const s3Folder = `assessment-images/platforms/${platformId}/assessments/${assessmentId}`;

      // Upload question image if provided
      if (questionImage) {
        this.logger.log(colors.blue(`[LIBRARY] 📤 Uploading question image: ${questionImage.originalname}`));
        this.validateImageFile(questionImage);

        const fileName = `question_${Date.now()}_${questionImage.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadResult = await this.storageService.uploadFile(questionImage, s3Folder, fileName);
        uploadedKeys.push(uploadResult.key);

        questionData.image_url = uploadResult.url;
        questionData.image_s3_key = uploadResult.key;
        this.logger.log(colors.green(`[LIBRARY] ✅ Question image uploaded: ${uploadResult.key}`));
      }

      // Upload option images if provided
      if (optionImages.length > 0 && questionData.options?.length) {
        for (let i = 0; i < optionImages.length; i++) {
          const optFile = optionImages[i];
          this.logger.log(colors.blue(`[LIBRARY] 📤 Uploading option image [${i}]: ${optFile.originalname}`));
          this.validateImageFile(optFile);

          const fileName = `option_${Date.now()}_${i}_${optFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const uploadResult = await this.storageService.uploadFile(optFile, s3Folder, fileName);
          uploadedKeys.push(uploadResult.key);

          // Match option by imageIndex field
          const matchingOption = questionData.options.find((opt: any) => opt.imageIndex === i);
          if (matchingOption) {
            matchingOption.image_url = uploadResult.url;
            matchingOption.image_s3_key = uploadResult.key;
            this.logger.log(colors.green(`[LIBRARY] ✅ Option image [${i}] uploaded and matched`));
          } else {
            this.logger.warn(colors.yellow(`[LIBRARY] ⚠️ Option image [${i}] uploaded but no option has imageIndex: ${i}`));
          }
        }
      }

      // Wrap question data in AddQuestionsDto format and delegate to existing method
      try {
        const addQuestionsDto: AddQuestionsDto = { questions: [questionData] };
        const result = await this.addLibraryAssessmentQuestions(assessmentId, addQuestionsDto, platformId, userId);

        this.logger.log(colors.green(`[LIBRARY] ✅ Question created successfully with ${uploadedKeys.length} image(s)`));
        return result;
      } catch (questionError) {
        // Rollback: delete ALL uploaded images if question creation failed
        if (uploadedKeys.length > 0) {
          this.logger.warn(colors.yellow(`[LIBRARY] ⚠️ Question creation failed. Rolling back ${uploadedKeys.length} image(s)`));
          for (const key of uploadedKeys) {
            try {
              await this.storageService.deleteFile(key);
              this.logger.log(colors.green(`[LIBRARY] ✅ Rolled back: ${key}`));
            } catch (deleteError) {
              this.logger.error(colors.red(`[LIBRARY] ❌ Failed to rollback: ${key} - ${deleteError.message}`));
            }
          }
        }
        throw questionError;
      }
    } catch (error) {
      this.logger.error(colors.red(`[LIBRARY] ❌ Error in addQuestionWithImage: ${error.message}`));
      throw error;
    }
  }

  // ========================================
  // UPDATE QUESTION IN ASSESSMENT
  // ========================================

  /**
   * Update a question in a library assessment (partial update)
   * 
   * Supports updating all question properties:
   * - Question text, type, points, difficulty level
   * - Media (images, audio, video) - old media is automatically deleted from storage
   * - Options (MCQ/TRUE_FALSE) - can replace all options or update existing ones
   * - Correct answers (non-MCQ types) - can update answer definitions
   * 
   * @param assessmentId - Assessment ID
   * @param questionId - Question ID to update
   * @param updateQuestionDto - Partial question data to update
   * @param platformId - Platform ID for access control
   * @param userId - User ID for access control
   */
  async updateLibraryQuestion(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
    platformId: string,
    userId: string,
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Updating question: ${questionId} in assessment: ${assessmentId}`));

    // 1. Fetch the assessment and verify ownership
    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Library assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // 2. Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot update questions in a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    // 3. Fetch the question with all relations
    const question = await this.prisma.libraryAssessmentQuestion.findFirst({
      where: {
        id: questionId,
        assessmentId: assessmentId,
      },
      include: {
        options: { orderBy: { order: 'asc' } },
        correctAnswers: true,
      },
    });

    if (!question) {
      this.logger.error(colors.red(`Question not found: ${questionId}`));
      throw new NotFoundException('Question not found');
    }

    // 4. Update question in a transaction
    const updatedQuestion = await this.prisma.$transaction(async (tx) => {
      // Prepare update data (only include provided fields)
      const updateData: any = {};

      if (updateQuestionDto.question_text !== undefined) {
        updateData.questionText = updateQuestionDto.question_text;
      }
      if (updateQuestionDto.question_type !== undefined) {
        updateData.questionType = updateQuestionDto.question_type as QuestionType;
      }
      if (updateQuestionDto.order !== undefined) {
        updateData.order = updateQuestionDto.order;
      }
      if (updateQuestionDto.points !== undefined) {
        updateData.points = updateQuestionDto.points;
      }
      if (updateQuestionDto.is_required !== undefined) {
        updateData.isRequired = updateQuestionDto.is_required;
      }
      if (updateQuestionDto.time_limit !== undefined) {
        updateData.timeLimit = updateQuestionDto.time_limit;
      }
      const questionImageUpdateRequested =
        updateQuestionDto.image_url !== undefined ||
        updateQuestionDto.image_s3_key !== undefined;

      if (questionImageUpdateRequested && question.imageS3Key) {
        try {
          await this.storageService.deleteFile(question.imageS3Key);
          this.logger.log(colors.green(`[LIBRARY] ✅ Deleted old question image: ${question.imageS3Key}`));
        } catch (error) {
          this.logger.warn(colors.yellow(`[LIBRARY] ⚠️ Failed to delete old question image: ${question.imageS3Key}`));
        }
      }

      if (updateQuestionDto.image_url !== undefined) {
        updateData.imageUrl = updateQuestionDto.image_url;
      }
      if (updateQuestionDto.image_s3_key !== undefined) {
        updateData.imageS3Key = updateQuestionDto.image_s3_key;
      }
      if (updateQuestionDto.audio_url !== undefined) {
        updateData.audioUrl = updateQuestionDto.audio_url;
      }
      if (updateQuestionDto.video_url !== undefined) {
        updateData.videoUrl = updateQuestionDto.video_url;
      }
      if (updateQuestionDto.allow_multiple_attempts !== undefined) {
        updateData.allowMultipleAttempts = updateQuestionDto.allow_multiple_attempts;
      }
      if (updateQuestionDto.show_hint !== undefined) {
        updateData.showHint = updateQuestionDto.show_hint;
      }
      if (updateQuestionDto.hint_text !== undefined) {
        updateData.hintText = updateQuestionDto.hint_text;
      }
      if (updateQuestionDto.min_length !== undefined) {
        updateData.minLength = updateQuestionDto.min_length;
      }
      if (updateQuestionDto.max_length !== undefined) {
        updateData.maxLength = updateQuestionDto.max_length;
      }
      if (updateQuestionDto.min_value !== undefined) {
        updateData.minValue = updateQuestionDto.min_value;
      }
      if (updateQuestionDto.max_value !== undefined) {
        updateData.maxValue = updateQuestionDto.max_value;
      }
      if (updateQuestionDto.explanation !== undefined) {
        updateData.explanation = updateQuestionDto.explanation;
      }
      if (updateQuestionDto.difficulty_level !== undefined) {
        updateData.difficultyLevel = updateQuestionDto.difficulty_level as DifficultyLevel;
      }

      // Update the question
      const updQ = await tx.libraryAssessmentQuestion.update({
        where: { id: questionId },
        data: updateData,
      });

      // 4a. Smart merge/update options if provided
      if (updateQuestionDto.options !== undefined) {
        if (updateQuestionDto.options.length === 0) {
          throw new BadRequestException('options cannot be empty when provided');
        }

        const correctOptionIds: string[] = [];

        for (let j = 0; j < updateQuestionDto.options.length; j++) {
          const optDto = updateQuestionDto.options[j];

          if (optDto.id) {
            // UPDATE existing option (only provided fields)
            const existingOption = question.options.find(opt => opt.id === optDto.id);
            if (!existingOption) {
              throw new BadRequestException(`Option with id ${optDto.id} not found in this question`);
            }

            const updateOptionData: any = {};

            // Only update fields that are explicitly provided
            if (optDto.option_text !== undefined) {
              if (optDto.option_text === '') {
                throw new BadRequestException('option_text cannot be empty');
              }
              updateOptionData.optionText = optDto.option_text;
            }
            if (optDto.order !== undefined) {
              updateOptionData.order = optDto.order;
            }
            if (optDto.is_correct !== undefined) {
              updateOptionData.isCorrect = optDto.is_correct;
            }
            if (optDto.audio_url !== undefined) {
              updateOptionData.audioUrl = optDto.audio_url;
            }

            // Handle image updates (only if new image is provided)
            if (optDto.image_url !== undefined) {
              // Delete old image if it's being replaced with a different one
              if (existingOption.imageS3Key && optDto.image_s3_key !== existingOption.imageS3Key) {
                try {
                  await this.storageService.deleteFile(existingOption.imageS3Key);
                  this.logger.log(colors.green(`[LIBRARY] ✅ Deleted old option image: ${existingOption.imageS3Key}`));
                } catch (error) {
                  this.logger.warn(colors.yellow(`[LIBRARY] ⚠️ Failed to delete old option image: ${existingOption.imageS3Key}`));
                }
              }
              updateOptionData.imageUrl = optDto.image_url;
              updateOptionData.imageS3Key = optDto.image_s3_key ?? null;
            }

            const updatedOption = await tx.libraryAssessmentOption.update({
              where: { id: optDto.id },
              data: updateOptionData,
            });

            // Track correct options (use updated or existing is_correct value)
            const isCorrect = optDto.is_correct !== undefined ? optDto.is_correct : existingOption.isCorrect;
            if (isCorrect) {
              correctOptionIds.push(updatedOption.id);
            }

          } else {
            // CREATE new option
            const optionText = optDto.option_text ?? '';
            if (optionText === '') {
              throw new BadRequestException('option_text is required when creating new options');
            }
            if (optDto.is_correct === undefined) {
              throw new BadRequestException('is_correct is required when creating new options');
            }

            const newOption = await tx.libraryAssessmentOption.create({
              data: {
                questionId: questionId,
                optionText: optionText,
                order: optDto.order ?? j + 1,
                isCorrect: optDto.is_correct,
                imageUrl: optDto.image_url ?? null,
                imageS3Key: optDto.image_s3_key ?? null,
                audioUrl: optDto.audio_url ?? null,
              },
            });

            if (optDto.is_correct) {
              correctOptionIds.push(newOption.id);
            }
          }
        }

        // Rebuild correct_answers if we have MCQ-type questions
        if (correctOptionIds.length > 0) {
          // Delete all existing correctAnswers and recreate
          await tx.libraryAssessmentCorrectAnswer.deleteMany({
            where: { questionId: questionId },
          });

          await tx.libraryAssessmentCorrectAnswer.create({
            data: {
              questionId: questionId,
              optionIds: correctOptionIds,
            },
          });
        }
      }

      // 4b. Update correct answers if provided (for non-MCQ types)
      if (updateQuestionDto.correct_answers !== undefined) {
        // Only update if explicitly provided - don't overwrite auto-generated ones
        if (!updateQuestionDto.options) {
          // Delete all existing correct answers first
          await tx.libraryAssessmentCorrectAnswer.deleteMany({
            where: { questionId: questionId },
          });

          // Create new correct answers
          for (const answerDto of updateQuestionDto.correct_answers) {
            await tx.libraryAssessmentCorrectAnswer.create({
              data: {
                questionId: questionId,
                answerText: answerDto.answer_text ?? null,
                answerNumber: answerDto.answer_number ?? null,
                answerDate: answerDto.answer_date ? new Date(answerDto.answer_date) : null,
                answerJson: answerDto.answer_json ?? undefined,
              },
            });
          }
        }
      }

      // 4c. Fetch and return the updated question
      const fullQuestion = await tx.libraryAssessmentQuestion.findUnique({
        where: { id: questionId },
        include: {
          options: { orderBy: { order: 'asc' } },
          correctAnswers: true,
        },
      });

      // 4d. Recalculate assessment totalPoints
      const totalPoints = await tx.libraryAssessmentQuestion.aggregate({
        where: { assessmentId: assessmentId },
        _sum: { points: true },
      });

      await tx.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum.points ?? 0 },
      });

      return fullQuestion;
    });

    this.logger.log(colors.green(`[LIBRARY] ✅ Successfully updated question: ${questionId}`));

    return ResponseHelper.success('Question updated successfully', {
      assessment_id: assessmentId,
      question: updatedQuestion,
    });
  }

  // ========================================
  // UPDATE QUESTION WITH IMAGE UPLOADS
  // ========================================

  /**
   * Update a question with new image uploads (multipart)
   * 
   * Handles:
   * - Uploading new question image
   * - Uploading new option images
   * - Deleting old images from S3
   * - Updating question with new image URLs
   * 
   * @param assessmentId - Assessment ID
   * @param questionId - Question ID to update
   * @param updateQuestionDto - Update data
   * @param platformId - Platform ID
   * @param userId - User ID
   * @param newQuestionImage - New question image file (optional)
   * @param optionImageUpdates - Array of { optionId, oldS3Key } for options to update
   * @param newOptionImages - Array of new option image files
   */
  async updateLibraryQuestionWithImage(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
    platformId: string,
    userId: string,
    newQuestionImage?: Express.Multer.File,
    optionImageUpdates?: Array<{ optionId: string; oldS3Key?: string }>,
    newOptionImages?: Express.Multer.File[],
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Updating question with images: ${questionId}`));

    const uploadedFiles: string[] = []; // Track uploaded S3 keys for rollback

    try {
      // 1. Handle question image upload if provided
      if (newQuestionImage) {
        const timestamp = Date.now();
        const sanitizedFilename = newQuestionImage.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const s3Folder = `assessment-images/platforms/${platformId}/assessments/${assessmentId}`;
        const fileName = `question_${timestamp}_${sanitizedFilename}`;

        const uploadResult = await this.storageService.uploadFile(
          newQuestionImage,
          s3Folder,
          fileName,
        );

        uploadedFiles.push(uploadResult.key);

        // Delete old question image if it exists
        if (updateQuestionDto.image_s3_key) {
          try {
            await this.storageService.deleteFile(updateQuestionDto.image_s3_key);
            this.logger.log(colors.green(`[LIBRARY] ✅ Deleted old question image: ${updateQuestionDto.image_s3_key}`));
          } catch (error) {
            this.logger.warn(colors.yellow(`[LIBRARY] ⚠️ Failed to delete old question image: ${updateQuestionDto.image_s3_key}`));
          }
        }

        updateQuestionDto.image_url = uploadResult.url;
        updateQuestionDto.image_s3_key = uploadResult.key;
      }

      // 2. Handle option image uploads if provided
      if (optionImageUpdates && newOptionImages && newOptionImages.length > 0) {
        if (optionImageUpdates.length !== newOptionImages.length) {
          throw new BadRequestException('Mismatch between optionImageUpdates and newOptionImages count');
        }

        // Ensure options array exists in the DTO
        if (!updateQuestionDto.options) {
          updateQuestionDto.options = [];
        }

        for (let i = 0; i < optionImageUpdates.length; i++) {
          const { optionId, oldS3Key } = optionImageUpdates[i];
          const imageFile = newOptionImages[i];

          const timestamp = Date.now();
          const sanitizedFilename = imageFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          const s3Folder = `assessment-images/platforms/${platformId}/assessments/${assessmentId}`;
          const fileName = `option_${timestamp}_${i}_${sanitizedFilename}`;

          const uploadResult = await this.storageService.uploadFile(
            imageFile,
            s3Folder,
            fileName,
          );

          uploadedFiles.push(uploadResult.key);

          // Delete old option image if it exists
          if (oldS3Key) {
            try {
              await this.storageService.deleteFile(oldS3Key);
              this.logger.log(colors.green(`[LIBRARY] ✅ Deleted old option image: ${oldS3Key}`));
            } catch (error) {
              this.logger.warn(colors.yellow(`[LIBRARY] ⚠️ Failed to delete old option image: ${oldS3Key}`));
            }
          }

          // Find or create the option update in the DTO
          let optionUpdate = updateQuestionDto.options.find(opt => opt.id === optionId);
          if (!optionUpdate) {
            optionUpdate = { id: optionId };
            updateQuestionDto.options.push(optionUpdate);
          }

          optionUpdate.image_url = uploadResult.url;
          optionUpdate.image_s3_key = uploadResult.key;
        }
      }

      // 3. Call the regular update method with the updated DTO
      const result = await this.updateLibraryQuestion(
        assessmentId,
        questionId,
        updateQuestionDto,
        platformId,
        userId,
      );

      this.logger.log(colors.green(`[LIBRARY] ✅ Successfully updated question with images: ${questionId}`));
      return result;

    } catch (error) {
      // Rollback: Delete all uploaded files
      this.logger.error(colors.red(`[LIBRARY] ❌ Error updating question with images, rolling back...`));
      
      for (const s3Key of uploadedFiles) {
        try {
          await this.storageService.deleteFile(s3Key);
          this.logger.log(colors.yellow(`[LIBRARY] 🔙 Rolled back uploaded file: ${s3Key}`));
        } catch (rollbackError) {
          this.logger.warn(colors.red(`[LIBRARY] ⚠️ Failed to rollback file: ${s3Key}`));
        }
      }

      throw error;
    }
  }

  // ========================================
  // DELETE QUESTION FROM ASSESSMENT
  // ========================================

  /**
   * Delete a question from a library assessment
   * 
   * Handles cleanup of:
   * - Question record and all related options
   * - All media (images, audio, video) from storage
   * - All correct answer records
   * - All user responses for this question
   * - Total points recalculation
   * 
   * @param assessmentId - Assessment ID
   * @param questionId - Question ID to delete
   * @param platformId - Platform ID for access control
   * @param userId - User ID for access control
   */
  async deleteLibraryQuestion(
    assessmentId: string,
    questionId: string,
    platformId: string,
    userId: string,
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Deleting question: ${questionId} from assessment: ${assessmentId}`));

    // 1. Fetch the assessment and verify ownership
    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Library assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // 2. Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot delete questions from a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    // 3. Fetch the question with all relations to clean up media
    const question = await this.prisma.libraryAssessmentQuestion.findFirst({
      where: {
        id: questionId,
        assessmentId: assessmentId,
      },
      include: {
        options: true,
      },
    });

    if (!question) {
      this.logger.error(colors.red(`Question not found: ${questionId}`));
      throw new NotFoundException('Question not found');
    }

    // 4. Delete the question in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete question (cascade delete will handle options, correctAnswers, responses)
      await tx.libraryAssessmentQuestion.delete({
        where: { id: questionId },
      });

      // 5. Clean up media from storage (best effort - continue even if some fail)
      const mediaToDelete: string[] = [];

      // Collect question media
      if (question.imageS3Key) {
        mediaToDelete.push(question.imageS3Key);
      }
      if (question.audioUrl) {
        const urlMatch = question.audioUrl.match(/\/([^\/]+)$/);
        if (urlMatch) {
          mediaToDelete.push(urlMatch[1]);
        }
      }
      if (question.videoUrl) {
        const urlMatch = question.videoUrl.match(/\/([^\/]+)$/);
        if (urlMatch) {
          mediaToDelete.push(urlMatch[1]);
        }
      }

      // Collect option media
      for (const option of question.options) {
        if (option.imageS3Key) {
          mediaToDelete.push(option.imageS3Key);
        }
        if (option.audioUrl) {
          const urlMatch = option.audioUrl.match(/\/([^\/]+)$/);
          if (urlMatch) {
            mediaToDelete.push(urlMatch[1]);
          }
        }
      }

      // Delete media files
      for (const key of mediaToDelete) {
        try {
          await this.storageService.deleteFile(key);
          this.logger.log(colors.green(`[LIBRARY] ✅ Deleted media file: ${key}`));
        } catch (error) {
          this.logger.warn(colors.yellow(`[LIBRARY] ⚠️ Failed to delete media file: ${key} - ${error.message}`));
        }
      }

      // 6. Recalculate assessment totalPoints
      const totalPoints = await tx.libraryAssessmentQuestion.aggregate({
        where: { assessmentId: assessmentId },
        _sum: { points: true },
      });

      await tx.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum.points ?? 0 },
      });
    });

    this.logger.log(colors.green(`[LIBRARY] ✅ Successfully deleted question: ${questionId}`));

    return ResponseHelper.success('Question deleted successfully', {
      assessment_id: assessmentId,
      deleted_question_id: questionId,
      message: 'Question and all associated media have been removed',
    });
  }
}
