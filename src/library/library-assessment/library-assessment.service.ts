import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../shared/services/providers/storage.service';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';
import * as colors from 'colors';
import { CreateLibraryAssessmentDto } from './dto/create-assessment.dto';
import { GetLibraryAssessmentsQueryDto } from './dto/get-assessments-query.dto';
import { UpdateLibraryAssessmentDto } from './dto/update-assessment.dto';
import { SubmitLibraryAssessmentDto } from './dto/submit-assessment.dto';
import { DuplicateLibraryAssessmentDto } from './dto/duplicate-assessment.dto';
import { AddLibraryQuestionsDto } from './dto/add-questions.dto';
import { UpdateLibraryQuestionDto } from './dto/update-question.dto';
import {
  AssessmentType,
  GradingType,
  Prisma,
  QuestionType,
  DifficultyLevel,
} from '@prisma/client';

@Injectable()
export class LibraryAssessmentService {
  private readonly logger = new Logger(LibraryAssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // ========================================
  // HELPER: Resolve library user & platformId
  // ========================================

  private async resolveLibraryUser(user: any) {
    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: user.sub },
      select: { id: true, platformId: true },
    });
    if (!libraryUser) throw new NotFoundException('Library user not found');
    return libraryUser;
  }

  // ========================================
  // CREATE ASSESSMENT
  // ========================================

  async createAssessment(dto: CreateLibraryAssessmentDto, user: any) {
    const { id: userId, platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(`[LIBRARY] Creating Assessment: ${dto.title}`),
    );

    const librarySubject = await this.prisma.librarySubject.findFirst({
      where: { id: dto.subjectId, platformId },
      include: {
        topics: dto.topicId
          ? { where: { id: dto.topicId }, take: 1 }
          : false,
      },
    });

    if (!librarySubject) {
      throw new NotFoundException(
        'Library subject not found or does not belong to your platform',
      );
    }

    if (dto.topicId && librarySubject.topics?.length === 0) {
      throw new NotFoundException(
        'Library topic not found or does not belong to this subject',
      );
    }

    const assessment = await this.prisma.libraryAssessment.create({
      data: {
        platformId,
        subjectId: dto.subjectId,
        topicId: dto.topicId || null,
        createdById: userId,
        title: dto.title,
        description: dto.description,
        instructions: dto.instructions,
        assessmentType:
          (dto.assessmentType as AssessmentType) || AssessmentType.CBT,
        gradingType: (dto.gradingType as GradingType) || 'AUTOMATIC',
        duration: dto.duration,
        maxAttempts: dto.maxAttempts || 1,
        passingScore: dto.passingScore || 50.0,
        totalPoints: dto.totalPoints || 100.0,
        shuffleQuestions: dto.shuffleQuestions || false,
        shuffleOptions: dto.shuffleOptions || false,
        showCorrectAnswers: dto.showCorrectAnswers || false,
        showFeedback: dto.showFeedback !== false,
        allowReview: dto.allowReview !== false,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate
          ? new Date(dto.endDate)
          : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeLimit: dto.timeLimit,
        autoSubmit: dto.autoSubmit || false,
        tags: dto.tags || [],
        status: 'DRAFT',
        isPublished: false,
      },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        topic: { select: { id: true, title: true } },
        createdBy: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    this.logger.log(
      colors.green(`[LIBRARY] Assessment created: ${assessment.id}`),
    );

    return ResponseHelper.success('Library assessment created successfully', {
      ...assessment,
      assessmentContext: 'library',
    });
  }

  // ========================================
  // GET ALL ASSESSMENTS
  // ========================================

  async getAllAssessments(query: GetLibraryAssessmentsQueryDto, user: any) {
    const { platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(
        `[LIBRARY] Fetching assessments for platform: ${platformId}`,
      ),
    );

    const baseWhere: Prisma.LibraryAssessmentWhereInput = { platformId };

    if (query.subjectId) baseWhere.subjectId = query.subjectId;
    if (query.topicId) baseWhere.topicId = query.topicId;
    if (query.status) baseWhere.status = query.status as any;
    if (query.assessmentType)
      baseWhere.assessmentType = query.assessmentType as AssessmentType;
    if (query.isPublished !== undefined) baseWhere.isPublished = query.isPublished;

    if (query.search) {
      baseWhere.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const analyticsWhere: Prisma.LibraryAssessmentWhereInput = { ...baseWhere };
    delete analyticsWhere.status;
    delete analyticsWhere.isPublished;

    const [total, assessments, statusCounts] = await Promise.all([
      this.prisma.libraryAssessment.count({ where: baseWhere }),
      this.prisma.libraryAssessment.findMany({
        where: baseWhere,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit,
        orderBy: { [query.sortBy!]: query.sortOrder },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          topic: { select: { id: true, title: true } },
          createdBy: {
            select: { id: true, first_name: true, last_name: true },
          },
          _count: { select: { questions: true, attempts: true } },
        },
      }),
      this.prisma.libraryAssessment.groupBy({
        by: ['status'],
        where: analyticsWhere,
        _count: { id: true },
      }),
    ]);

    const statusAnalytics: Record<string, number> = {
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
      statusAnalytics[item.status.toLowerCase()] = count;
    });

    const totalPages = Math.ceil(total / query.limit!);

    this.logger.log(
      colors.green(
        `[LIBRARY] Fetched ${assessments.length} assessments (page ${query.page}/${totalPages})`,
      ),
    );

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

  // ========================================
  // GET ASSESSMENT DETAILS
  // ========================================

  async getAssessmentDetails(assessmentId: string, user: any) {
    const { platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(`[LIBRARY] Getting assessment details: ${assessmentId}`),
    );

    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: { id: assessmentId, platformId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        topic: { select: { id: true, title: true } },
        createdBy: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        platform: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Library assessment not found');
    }

    const [questions, attempts] = await Promise.all([
      this.prisma.libraryAssessmentQuestion.findMany({
        where: { assessmentId: assessment.id },
        include: {
          options: { orderBy: { order: 'asc' } },
          correctAnswers: true,
          _count: { select: { responses: true } },
        },
        orderBy: { order: 'asc' },
      }),
      this.prisma.libraryAssessmentAttempt.findMany({
        where: { assessmentId: assessment.id },
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

    const attemptsByUser = new Map<string, any[]>();
    attempts.forEach((attempt) => {
      const odUserId = attempt.user?.id || 'unknown';
      if (!attemptsByUser.has(odUserId)) attemptsByUser.set(odUserId, []);
      attemptsByUser.get(odUserId)!.push(attempt);
    });

    const usersWithAttempts = Array.from(attemptsByUser.entries()).map(
      ([, userAttempts]) => {
        const firstAttempt = userAttempts[0];
        const bestAttempt = userAttempts.reduce((best, current) =>
          (current.percentage || 0) > (best.percentage || 0) ? current : best,
        );

        return {
          user: {
            id: firstAttempt.user?.id,
            first_name: firstAttempt.user?.first_name,
            last_name: firstAttempt.user?.last_name,
            email: firstAttempt.user?.email,
            display_picture: firstAttempt.user?.display_picture,
          },
          attempts: userAttempts.map((a) => ({
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
      },
    );

    const totalUsers = usersWithAttempts.length;
    const usersPassed = usersWithAttempts.filter((u) => u.passed).length;

    this.logger.log(
      colors.green(
        `[LIBRARY] Details retrieved: ${questions.length} questions, ${attempts.length} attempts`,
      ),
    );

    return ResponseHelper.success(
      'Library assessment details retrieved successfully',
      {
        assessment,
        questions: { total: questions.length, items: questions },
        submissions: {
          summary: {
            totalUsers,
            totalAttempts: attempts.length,
            usersPassed,
            passRate:
              totalUsers > 0
                ? Math.round((usersPassed / totalUsers) * 100)
                : 0,
          },
          users: usersWithAttempts,
        },
        assessmentContext: 'library',
      },
    );
  }

  // ========================================
  // UPDATE ASSESSMENT
  // ========================================

  async updateAssessment(
    assessmentId: string,
    updateDto: UpdateLibraryAssessmentDto,
    user: any,
  ) {
    const { platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(`[LIBRARY] Updating assessment: ${assessmentId}`),
    );

    const existingAssessment = await this.prisma.libraryAssessment.findFirst({
      where: { id: assessmentId, platformId },
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
      throw new NotFoundException(
        'Assessment not found or you do not have permission to update it',
      );
    }

    if (['PUBLISHED', 'ACTIVE'].includes(existingAssessment.status)) {
      throw new BadRequestException(
        `Cannot update assessment with status "${existingAssessment.status}". Change status to DRAFT first to make modifications.`,
      );
    }

    if (
      updateDto.subjectId &&
      updateDto.subjectId !== existingAssessment.subjectId
    ) {
      const subject = await this.prisma.librarySubject.findFirst({
        where: { id: updateDto.subjectId, platformId },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found in this platform');
      }
    }

    if (updateDto.topicId && updateDto.topicId !== existingAssessment.topicId) {
      const effectiveSubjectId =
        updateDto.subjectId || existingAssessment.subjectId;
      const topic = await this.prisma.libraryTopic.findFirst({
        where: { id: updateDto.topicId, subjectId: effectiveSubjectId },
      });
      if (!topic) {
        throw new NotFoundException(
          'Topic not found or does not belong to the specified subject',
        );
      }
    }

    const updateData: any = {};

    const directFields = [
      'title',
      'description',
      'instructions',
      'subjectId',
      'topicId',
      'duration',
      'maxAttempts',
      'passingScore',
      'totalPoints',
      'shuffleQuestions',
      'shuffleOptions',
      'showCorrectAnswers',
      'showFeedback',
      'allowReview',
      'timeLimit',
      'gradingType',
      'autoSubmit',
      'tags',
      'assessmentType',
      'isResultReleased',
      'studentCanViewGrading',
      'status',
    ];

    for (const field of directFields) {
      if (updateDto[field] !== undefined) {
        updateData[field] = updateDto[field];
      }
    }

    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    if (updateDto.status) {
      const isBeingPublished =
        ['PUBLISHED', 'ACTIVE'].includes(updateDto.status) &&
        !existingAssessment.isPublished;

      if (isBeingPublished) {
        const effectiveEndDate =
          updateData.endDate ?? existingAssessment.endDate;
        if (effectiveEndDate && new Date(effectiveEndDate) < new Date()) {
          throw new BadRequestException(
            'Cannot publish an assessment that has already expired. Please set an end date in the future first.',
          );
        }
        updateData.isPublished = true;
        updateData.publishedAt = new Date();
      }

      if (
        updateDto.status === 'DRAFT' &&
        existingAssessment.isPublished
      ) {
        updateData.isPublished = false;
      }
    }

    if (
      updateData.assessmentType === '' ||
      updateData.assessmentType === undefined
    ) {
      delete updateData.assessmentType;
    }

    const updatedAssessment = await this.prisma.libraryAssessment.update({
      where: { id: assessmentId },
      data: updateData,
      include: {
        subject: { select: { id: true, name: true, code: true } },
        topic: { select: { id: true, title: true } },
        createdBy: {
          select: { id: true, first_name: true, last_name: true },
        },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    this.logger.log(
      colors.green(`[LIBRARY] Assessment updated: ${assessmentId}`),
    );

    return ResponseHelper.success('Assessment updated successfully', {
      assessment: updatedAssessment,
      assessmentContext: 'library',
    });
  }

  // ========================================
  // GET QUESTIONS (owner preview with answers)
  // ========================================

  async getAssessmentQuestions(assessmentId: string, user: any) {
    const { id: userId, platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(`[LIBRARY] Fetching questions: ${assessmentId}`),
    );

    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: { id: assessmentId, platformId },
      include: {
        subject: { select: { id: true, name: true, code: true } },
        createdBy: {
          select: { id: true, first_name: true, last_name: true },
        },
        questions: {
          include: {
            options: {
              select: {
                id: true,
                optionText: true,
                isCorrect: true,
                order: true,
              },
              orderBy: { order: 'asc' },
            },
            correctAnswers: {
              select: { id: true, answerText: true, optionIds: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found or not available');
    }

    const questions = assessment.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      points: q.points,
      order: q.order,
      imageUrl: q.imageUrl,
      audioUrl: q.audioUrl,
      videoUrl: q.videoUrl,
      isRequired: q.isRequired,
      explanation: q.explanation,
      difficultyLevel: q.difficultyLevel,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.optionText,
        isCorrect: o.isCorrect,
        order: o.order,
      })),
      correctAnswers: q.correctAnswers.map((ca) => ({
        id: ca.id,
        answerText: ca.answerText,
        optionIds: ca.optionIds,
      })),
    }));

    this.logger.log(
      colors.green(`[LIBRARY] Questions retrieved: ${questions.length}`),
    );

    return ResponseHelper.success(
      'Assessment questions retrieved successfully (preview mode)',
      {
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
        totalQuestions: questions.length,
        isPreview: true,
        assessmentContext: 'library',
      },
    );
  }

  // ========================================
  // SUBMIT ASSESSMENT
  // ========================================

  async submitAssessment(
    assessmentId: string,
    submitDto: SubmitLibraryAssessmentDto,
    user: any,
  ) {
    const { id: userId, platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(`[LIBRARY] Submitting assessment: ${assessmentId}`),
    );

    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId,
        status: { in: ['PUBLISHED', 'ACTIVE'] },
      },
      include: {
        questions: {
          include: {
            correctAnswers: true,
            options: { select: { id: true, isCorrect: true } },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found or not available');
    }

    const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
      where: { assessmentId, userId },
    });

    if (attemptCount >= assessment.maxAttempts) {
      throw new ForbiddenException(
        'Maximum attempts reached for this assessment',
      );
    }

    const normalizedAnswers = this.normalizeAnswers(submitDto.answers);
    const { gradedAnswers, totalScore, totalPoints } =
      this.gradeAnswers(normalizedAnswers, assessment.questions);

    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const passed = percentage >= assessment.passingScore;
    const grade = this.calculateGrade(percentage);
    const timeSpent = submitDto.timeTaken || 0;

    const result = await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.libraryAssessmentAttempt.create({
        data: {
          assessmentId,
          userId,
          attemptNumber: attemptCount + 1,
          status: 'GRADED',
          startedAt: new Date(),
          submittedAt: submitDto.submissionTime
            ? new Date(submitDto.submissionTime)
            : new Date(),
          timeSpent,
          totalScore,
          maxScore: assessment.totalPoints,
          percentage,
          passed,
          isGraded: true,
          gradedAt: new Date(),
          gradeLetter: grade,
        },
      });

      const responses = await Promise.all(
        gradedAnswers.map((answer) =>
          tx.libraryAssessmentResponse.create({
            data: {
              attemptId: attempt.id,
              questionId: answer.questionId,
              userId,
              textAnswer: answer.textAnswer || null,
              numericAnswer: answer.numericAnswer || null,
              dateAnswer: answer.dateAnswer || null,
              selectedOptions: answer.selectedOptions || [],
              isCorrect: answer.isCorrect,
              pointsEarned: answer.pointsEarned,
              maxPoints: answer.maxPoints,
            },
          }),
        ),
      );

      return { attempt, responses };
    });

    this.logger.log(
      colors.green(
        `[LIBRARY] Assessment submitted: ${totalScore}/${totalPoints} (${percentage.toFixed(1)}%)`,
      ),
    );

    return ResponseHelper.success('Assessment submitted successfully', {
      attemptId: result.attempt.id,
      assessmentId,
      totalScore,
      totalPoints,
      percentage,
      passed,
      grade,
      answers: gradedAnswers.map((a) => ({
        questionId: a.questionId,
        isCorrect: a.isCorrect,
        pointsEarned: a.pointsEarned,
        maxPoints: a.maxPoints,
      })),
      submittedAt: result.attempt.submittedAt,
      timeSpent,
      attemptNumber: result.attempt.attemptNumber,
      remainingAttempts: assessment.maxAttempts - (attemptCount + 1),
      assessmentContext: 'library',
    });
  }

  // ========================================
  // DUPLICATE ASSESSMENT
  // ========================================

  async duplicateAssessment(
    assessmentId: string,
    duplicateDto: DuplicateLibraryAssessmentDto,
    user: any,
  ) {
    const { id: userId, platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(`[LIBRARY] Duplicating assessment: ${assessmentId}`),
    );

    const sourceAssessment = await this.prisma.libraryAssessment.findFirst({
      where: { id: assessmentId, platformId },
      include: {
        questions: {
          include: { options: true, correctAnswers: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!sourceAssessment) {
      throw new NotFoundException('Assessment not found');
    }

    let questions = [...sourceAssessment.questions];
    if (duplicateDto.shuffleQuestions) {
      questions = this.shuffleArray(questions);
    }

    const newAssessment = await this.prisma.$transaction(async (tx) => {
      const assessment = await tx.libraryAssessment.create({
        data: {
          platformId,
          subjectId: sourceAssessment.subjectId,
          topicId: sourceAssessment.topicId,
          createdById: userId,
          title: duplicateDto.newTitle,
          description:
            duplicateDto.newDescription || sourceAssessment.description,
          instructions: sourceAssessment.instructions,
          assessmentType: sourceAssessment.assessmentType,
          gradingType: sourceAssessment.gradingType,
          duration: sourceAssessment.duration,
          maxAttempts: sourceAssessment.maxAttempts,
          passingScore: sourceAssessment.passingScore,
          totalPoints: sourceAssessment.totalPoints,
          shuffleQuestions:
            duplicateDto.shuffleQuestions || sourceAssessment.shuffleQuestions,
          shuffleOptions:
            duplicateDto.shuffleOptions || sourceAssessment.shuffleOptions,
          showCorrectAnswers: sourceAssessment.showCorrectAnswers,
          showFeedback: sourceAssessment.showFeedback,
          allowReview: sourceAssessment.allowReview,
          timeLimit: sourceAssessment.timeLimit,
          autoSubmit: sourceAssessment.autoSubmit,
          tags: sourceAssessment.tags,
          status: 'DRAFT',
          isPublished: false,
          startDate: null,
          endDate: null,
        },
      });

      for (let i = 0; i < questions.length; i++) {
        const src = questions[i];

        let options = [...src.options];
        if (duplicateDto.shuffleOptions) {
          options = this.shuffleArray(options);
        }

        const newQuestion = await tx.libraryAssessmentQuestion.create({
          data: {
            assessmentId: assessment.id,
            questionText: src.questionText,
            questionType: src.questionType,
            order: i + 1,
            points: src.points,
            isRequired: src.isRequired,
            timeLimit: src.timeLimit,
            imageUrl: src.imageUrl,
            imageS3Key: src.imageS3Key,
            audioUrl: src.audioUrl,
            videoUrl: src.videoUrl,
            allowMultipleAttempts: src.allowMultipleAttempts,
            showHint: src.showHint,
            hintText: src.hintText,
            minLength: src.minLength,
            maxLength: src.maxLength,
            minValue: src.minValue,
            maxValue: src.maxValue,
            explanation: src.explanation,
            difficultyLevel: src.difficultyLevel,
          },
        });

        const optionIdMap = new Map<string, string>();

        for (let j = 0; j < options.length; j++) {
          const srcOpt = options[j];
          const newOption = await tx.libraryAssessmentOption.create({
            data: {
              questionId: newQuestion.id,
              optionText: srcOpt.optionText,
              order: j + 1,
              isCorrect: srcOpt.isCorrect,
              imageUrl: srcOpt.imageUrl,
              imageS3Key: srcOpt.imageS3Key,
              audioUrl: srcOpt.audioUrl,
            },
          });
          optionIdMap.set(srcOpt.id, newOption.id);
        }

        for (const srcAnswer of src.correctAnswers) {
          const newOptionIds = (srcAnswer.optionIds || []).map(
            (oldId) => optionIdMap.get(oldId) || oldId,
          );

          await tx.libraryAssessmentCorrectAnswer.create({
            data: {
              questionId: newQuestion.id,
              answerText: srcAnswer.answerText,
              answerNumber: srcAnswer.answerNumber,
              answerDate: srcAnswer.answerDate,
              optionIds: newOptionIds,
              answerJson: srcAnswer.answerJson ?? undefined,
            },
          });
        }
      }

      return tx.libraryAssessment.findUnique({
        where: { id: assessment.id },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          topic: { select: { id: true, title: true } },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          _count: { select: { questions: true } },
        },
      });
    });

    this.logger.log(
      colors.green(
        `[LIBRARY] Assessment duplicated: ${newAssessment!.id}`,
      ),
    );

    return ResponseHelper.success('Assessment duplicated successfully', {
      assessment: newAssessment,
      sourceAssessmentId: assessmentId,
      shuffleApplied: {
        questions: duplicateDto.shuffleQuestions || false,
        options: duplicateDto.shuffleOptions || false,
      },
    });
  }

  // ========================================
  // ADD QUESTIONS
  // ========================================

  async addQuestions(
    assessmentId: string,
    addQuestionsDto: AddLibraryQuestionsDto,
    user: any,
  ) {
    const { id: userId, platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(
        `[LIBRARY] Adding ${addQuestionsDto.questions.length} question(s) to: ${assessmentId}`,
      ),
    );

    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: { id: assessmentId, platformId },
      include: { _count: { select: { questions: true } } },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot add questions to a ${assessment.status} assessment. Change the status to DRAFT or CLOSED first.`,
      );
    }

    const lastQuestion =
      await this.prisma.libraryAssessmentQuestion.findFirst({
        where: { assessmentId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
    let nextOrder = (lastQuestion?.order ?? 0) + 1;

    const createdQuestions = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const questionDto of addQuestionsDto.questions) {
        const questionOrder = questionDto.order ?? nextOrder++;

        const newQuestion = await tx.libraryAssessmentQuestion.create({
          data: {
            assessmentId,
            questionText: questionDto.questionText,
            questionType: questionDto.questionType as QuestionType,
            order: questionOrder,
            points: questionDto.points ?? 1.0,
            isRequired: questionDto.isRequired ?? true,
            timeLimit: questionDto.timeLimit ?? null,
            imageUrl: questionDto.imageUrl ?? null,
            imageS3Key: questionDto.imageS3Key ?? null,
            audioUrl: questionDto.audioUrl ?? null,
            videoUrl: questionDto.videoUrl ?? null,
            allowMultipleAttempts: questionDto.allowMultipleAttempts ?? false,
            showHint: questionDto.showHint ?? false,
            hintText: questionDto.hintText ?? null,
            minLength: questionDto.minLength ?? null,
            maxLength: questionDto.maxLength ?? null,
            minValue: questionDto.minValue ?? null,
            maxValue: questionDto.maxValue ?? null,
            explanation: questionDto.explanation ?? null,
            difficultyLevel: (questionDto.difficultyLevel ??
              'MEDIUM') as DifficultyLevel,
          },
        });

        const createdOptionIds: string[] = [];

        if (questionDto.options?.length) {
          for (let j = 0; j < questionDto.options.length; j++) {
            const optDto = questionDto.options[j];
            const newOption = await tx.libraryAssessmentOption.create({
              data: {
                questionId: newQuestion.id,
                optionText: optDto.optionText,
                order: optDto.order ?? j + 1,
                isCorrect: optDto.isCorrect,
                imageUrl: optDto.imageUrl ?? null,
                imageS3Key: optDto.imageS3Key ?? null,
                audioUrl: optDto.audioUrl ?? null,
              },
            });
            if (optDto.isCorrect) {
              createdOptionIds.push(newOption.id);
            }
          }

          if (createdOptionIds.length > 0) {
            await tx.libraryAssessmentCorrectAnswer.create({
              data: {
                questionId: newQuestion.id,
                optionIds: createdOptionIds,
              },
            });
          }
        }

        if (questionDto.correctAnswers?.length) {
          for (const answerDto of questionDto.correctAnswers) {
            await tx.libraryAssessmentCorrectAnswer.create({
              data: {
                questionId: newQuestion.id,
                answerText: answerDto.answerText ?? null,
                answerNumber: answerDto.answerNumber ?? null,
                answerDate: answerDto.answerDate
                  ? new Date(answerDto.answerDate)
                  : null,
                answerJson: answerDto.answerJson ?? undefined,
              },
            });
          }
        }

        const fullQuestion = await tx.libraryAssessmentQuestion.findUnique({
          where: { id: newQuestion.id },
          include: {
            options: { orderBy: { order: 'asc' } },
            correctAnswers: true,
          },
        });

        results.push(fullQuestion);
      }

      const totalPoints = await tx.libraryAssessmentQuestion.aggregate({
        where: { assessmentId },
        _sum: { points: true },
      });

      await tx.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum.points ?? 0 },
      });

      return results;
    });

    this.logger.log(
      colors.green(
        `[LIBRARY] Added ${createdQuestions.length} question(s) to: ${assessmentId}`,
      ),
    );

    return ResponseHelper.success('Questions added successfully', {
      assessmentId,
      questionsAdded: createdQuestions.length,
      totalQuestions: assessment._count.questions + createdQuestions.length,
      questions: createdQuestions,
    });
  }

  // ========================================
  // ADD QUESTION WITH IMAGE
  // ========================================

  async addQuestionWithImage(
    assessmentId: string,
    questionDataString: string,
    questionImage: Express.Multer.File | undefined,
    optionImages: Express.Multer.File[],
    user: any,
  ) {
    const { id: userId, platformId } = await this.resolveLibraryUser(user);
    const uploadedKeys: string[] = [];

    try {
      this.logger.log(
        colors.cyan(
          `[LIBRARY] Creating question with images for: ${assessmentId}`,
        ),
      );

      let questionData: any;
      try {
        questionData = JSON.parse(questionDataString);
      } catch {
        throw new BadRequestException('Invalid JSON in questionData field');
      }

      const assessment = await this.prisma.libraryAssessment.findFirst({
        where: { id: assessmentId, platformId },
        include: { _count: { select: { questions: true } } },
      });

      if (!assessment) {
        throw new NotFoundException(
          'Assessment not found or you do not have access to it',
        );
      }

      if (
        ['PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'].includes(
          assessment.status,
        )
      ) {
        throw new BadRequestException(
          'Cannot add questions to a published, active, closed, or archived assessment',
        );
      }

      const s3Folder = `assessment-images/platforms/${platformId}/assessments/${assessmentId}`;

      if (questionImage) {
        this.validateImageFile(questionImage);
        const fileName = `question_${Date.now()}_${questionImage.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadResult = await this.storageService.uploadFile(
          questionImage,
          s3Folder,
          fileName,
        );
        uploadedKeys.push(uploadResult.key);
        questionData.imageUrl = uploadResult.url;
        questionData.imageS3Key = uploadResult.key;
      }

      if (optionImages.length > 0 && questionData.options?.length) {
        for (let i = 0; i < optionImages.length; i++) {
          const optFile = optionImages[i];
          this.validateImageFile(optFile);
          const fileName = `option_${Date.now()}_${i}_${optFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const uploadResult = await this.storageService.uploadFile(
            optFile,
            s3Folder,
            fileName,
          );
          uploadedKeys.push(uploadResult.key);

          const matchingOption = questionData.options.find(
            (opt: any) => opt.imageIndex === i,
          );
          if (matchingOption) {
            matchingOption.imageUrl = uploadResult.url;
            matchingOption.imageS3Key = uploadResult.key;
          }
        }
      }

      try {
        const addQuestionsDto: AddLibraryQuestionsDto = {
          questions: [questionData],
        };
        return await this.addQuestions(assessmentId, addQuestionsDto, user);
      } catch (questionError) {
        if (uploadedKeys.length > 0) {
          this.logger.warn(
            colors.yellow(
              `[LIBRARY] Question creation failed. Rolling back ${uploadedKeys.length} image(s)`,
            ),
          );
          for (const key of uploadedKeys) {
            try {
              await this.storageService.deleteFile(key);
            } catch (deleteError) {
              this.logger.error(
                colors.red(`[LIBRARY] Failed to rollback: ${key}`),
              );
            }
          }
        }
        throw questionError;
      }
    } catch (error) {
      this.logger.error(
        colors.red(`[LIBRARY] Error in addQuestionWithImage: ${error.message}`),
      );
      throw error;
    }
  }

  // ========================================
  // UPDATE QUESTION
  // ========================================

  async updateQuestion(
    assessmentId: string,
    questionId: string,
    updateDto: UpdateLibraryQuestionDto,
    user: any,
  ) {
    const { id: userId, platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(
        `[LIBRARY] Updating question: ${questionId} in: ${assessmentId}`,
      ),
    );

    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: { id: assessmentId, platformId },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot update questions in a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    const question = await this.prisma.libraryAssessmentQuestion.findFirst({
      where: { id: questionId, assessmentId },
      include: {
        options: { orderBy: { order: 'asc' } },
        correctAnswers: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const updatedQuestion = await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (updateDto.questionText !== undefined)
        updateData.questionText = updateDto.questionText;
      if (updateDto.questionType !== undefined)
        updateData.questionType = updateDto.questionType as QuestionType;
      if (updateDto.order !== undefined) updateData.order = updateDto.order;
      if (updateDto.points !== undefined) updateData.points = updateDto.points;
      if (updateDto.isRequired !== undefined)
        updateData.isRequired = updateDto.isRequired;
      if (updateDto.timeLimit !== undefined)
        updateData.timeLimit = updateDto.timeLimit;

      const imageUpdateRequested =
        updateDto.imageUrl !== undefined || updateDto.imageS3Key !== undefined;
      if (imageUpdateRequested && question.imageS3Key) {
        try {
          await this.storageService.deleteFile(question.imageS3Key);
        } catch {
          this.logger.warn(
            colors.yellow(
              `[LIBRARY] Failed to delete old question image: ${question.imageS3Key}`,
            ),
          );
        }
      }

      if (updateDto.imageUrl !== undefined)
        updateData.imageUrl = updateDto.imageUrl;
      if (updateDto.imageS3Key !== undefined)
        updateData.imageS3Key = updateDto.imageS3Key;
      if (updateDto.audioUrl !== undefined)
        updateData.audioUrl = updateDto.audioUrl;
      if (updateDto.videoUrl !== undefined)
        updateData.videoUrl = updateDto.videoUrl;
      if (updateDto.allowMultipleAttempts !== undefined)
        updateData.allowMultipleAttempts = updateDto.allowMultipleAttempts;
      if (updateDto.showHint !== undefined)
        updateData.showHint = updateDto.showHint;
      if (updateDto.hintText !== undefined)
        updateData.hintText = updateDto.hintText;
      if (updateDto.minLength !== undefined)
        updateData.minLength = updateDto.minLength;
      if (updateDto.maxLength !== undefined)
        updateData.maxLength = updateDto.maxLength;
      if (updateDto.minValue !== undefined)
        updateData.minValue = updateDto.minValue;
      if (updateDto.maxValue !== undefined)
        updateData.maxValue = updateDto.maxValue;
      if (updateDto.explanation !== undefined)
        updateData.explanation = updateDto.explanation;
      if (updateDto.difficultyLevel !== undefined)
        updateData.difficultyLevel =
          updateDto.difficultyLevel as DifficultyLevel;

      await tx.libraryAssessmentQuestion.update({
        where: { id: questionId },
        data: updateData,
      });

      if (updateDto.options !== undefined) {
        if (updateDto.options.length === 0) {
          throw new BadRequestException(
            'options cannot be empty when provided',
          );
        }

        const correctOptionIds: string[] = [];

        for (let j = 0; j < updateDto.options.length; j++) {
          const optDto = updateDto.options[j];

          if (optDto.id) {
            const existingOption = question.options.find(
              (opt) => opt.id === optDto.id,
            );
            if (!existingOption) {
              throw new BadRequestException(
                `Option with id ${optDto.id} not found in this question`,
              );
            }

            const updateOptionData: any = {};

            if (optDto.optionText !== undefined) {
              if (optDto.optionText === '') {
                throw new BadRequestException('optionText cannot be empty');
              }
              updateOptionData.optionText = optDto.optionText;
            }
            if (optDto.order !== undefined)
              updateOptionData.order = optDto.order;
            if (optDto.isCorrect !== undefined)
              updateOptionData.isCorrect = optDto.isCorrect;
            if (optDto.audioUrl !== undefined)
              updateOptionData.audioUrl = optDto.audioUrl;

            if (optDto.imageUrl !== undefined) {
              if (
                existingOption.imageS3Key &&
                optDto.imageS3Key !== existingOption.imageS3Key
              ) {
                try {
                  await this.storageService.deleteFile(
                    existingOption.imageS3Key,
                  );
                } catch {
                  this.logger.warn(
                    colors.yellow(
                      `[LIBRARY] Failed to delete old option image: ${existingOption.imageS3Key}`,
                    ),
                  );
                }
              }
              updateOptionData.imageUrl = optDto.imageUrl;
              updateOptionData.imageS3Key = optDto.imageS3Key ?? null;
            }

            const updatedOption = await tx.libraryAssessmentOption.update({
              where: { id: optDto.id },
              data: updateOptionData,
            });

            const isCorrect =
              optDto.isCorrect !== undefined
                ? optDto.isCorrect
                : existingOption.isCorrect;
            if (isCorrect) correctOptionIds.push(updatedOption.id);
          } else {
            const optionText = optDto.optionText ?? '';
            if (optionText === '') {
              throw new BadRequestException(
                'optionText is required when creating new options',
              );
            }
            if (optDto.isCorrect === undefined) {
              throw new BadRequestException(
                'isCorrect is required when creating new options',
              );
            }

            const newOption = await tx.libraryAssessmentOption.create({
              data: {
                questionId,
                optionText,
                order: optDto.order ?? j + 1,
                isCorrect: optDto.isCorrect,
                imageUrl: optDto.imageUrl ?? null,
                imageS3Key: optDto.imageS3Key ?? null,
                audioUrl: optDto.audioUrl ?? null,
              },
            });

            if (optDto.isCorrect) correctOptionIds.push(newOption.id);
          }
        }

        if (correctOptionIds.length > 0) {
          await tx.libraryAssessmentCorrectAnswer.deleteMany({
            where: { questionId },
          });
          await tx.libraryAssessmentCorrectAnswer.create({
            data: { questionId, optionIds: correctOptionIds },
          });
        }
      }

      if (updateDto.correctAnswers !== undefined && !updateDto.options) {
        await tx.libraryAssessmentCorrectAnswer.deleteMany({
          where: { questionId },
        });
        for (const answerDto of updateDto.correctAnswers) {
          await tx.libraryAssessmentCorrectAnswer.create({
            data: {
              questionId,
              answerText: answerDto.answerText ?? null,
              answerNumber: answerDto.answerNumber ?? null,
              answerDate: answerDto.answerDate
                ? new Date(answerDto.answerDate)
                : null,
              answerJson: answerDto.answerJson ?? undefined,
            },
          });
        }
      }

      const fullQuestion = await tx.libraryAssessmentQuestion.findUnique({
        where: { id: questionId },
        include: {
          options: { orderBy: { order: 'asc' } },
          correctAnswers: true,
        },
      });

      const totalPoints = await tx.libraryAssessmentQuestion.aggregate({
        where: { assessmentId },
        _sum: { points: true },
      });

      await tx.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum.points ?? 0 },
      });

      return fullQuestion;
    });

    this.logger.log(
      colors.green(`[LIBRARY] Updated question: ${questionId}`),
    );

    return ResponseHelper.success('Question updated successfully', {
      assessmentId,
      question: updatedQuestion,
    });
  }

  // ========================================
  // UPDATE QUESTION WITH IMAGE
  // ========================================

  async updateQuestionWithImage(
    assessmentId: string,
    questionId: string,
    updateDto: UpdateLibraryQuestionDto,
    user: any,
    newQuestionImage?: Express.Multer.File,
    optionImageUpdates?: Array<{ optionId: string; oldS3Key?: string }>,
    newOptionImages?: Express.Multer.File[],
  ) {
    const { id: userId, platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(`[LIBRARY] Updating question with images: ${questionId}`),
    );

    const uploadedFiles: string[] = [];

    try {
      if (newQuestionImage) {
        const timestamp = Date.now();
        const sanitizedFilename = newQuestionImage.originalname.replace(
          /[^a-zA-Z0-9._-]/g,
          '_',
        );
        const s3Folder = `assessment-images/platforms/${platformId}/assessments/${assessmentId}`;
        const fileName = `question_${timestamp}_${sanitizedFilename}`;

        const uploadResult = await this.storageService.uploadFile(
          newQuestionImage,
          s3Folder,
          fileName,
        );
        uploadedFiles.push(uploadResult.key);

        if (updateDto.imageS3Key) {
          try {
            await this.storageService.deleteFile(updateDto.imageS3Key);
          } catch {
            this.logger.warn(
              colors.yellow(
                `[LIBRARY] Failed to delete old question image: ${updateDto.imageS3Key}`,
              ),
            );
          }
        }

        updateDto.imageUrl = uploadResult.url;
        updateDto.imageS3Key = uploadResult.key;
      }

      if (optionImageUpdates && newOptionImages && newOptionImages.length > 0) {
        if (optionImageUpdates.length !== newOptionImages.length) {
          throw new BadRequestException(
            'Mismatch between optionImageUpdates and newOptionImages count',
          );
        }

        if (!updateDto.options) {
          updateDto.options = [];
        }

        for (let i = 0; i < optionImageUpdates.length; i++) {
          const { optionId, oldS3Key } = optionImageUpdates[i];
          const imageFile = newOptionImages[i];

          const timestamp = Date.now();
          const sanitizedFilename = imageFile.originalname.replace(
            /[^a-zA-Z0-9._-]/g,
            '_',
          );
          const s3Folder = `assessment-images/platforms/${platformId}/assessments/${assessmentId}`;
          const fileName = `option_${timestamp}_${i}_${sanitizedFilename}`;

          const uploadResult = await this.storageService.uploadFile(
            imageFile,
            s3Folder,
            fileName,
          );
          uploadedFiles.push(uploadResult.key);

          if (oldS3Key) {
            try {
              await this.storageService.deleteFile(oldS3Key);
            } catch {
              this.logger.warn(
                colors.yellow(
                  `[LIBRARY] Failed to delete old option image: ${oldS3Key}`,
                ),
              );
            }
          }

          let optionUpdate = updateDto.options.find(
            (opt) => opt.id === optionId,
          );
          if (!optionUpdate) {
            optionUpdate = { id: optionId };
            updateDto.options.push(optionUpdate);
          }

          optionUpdate.imageUrl = uploadResult.url;
          optionUpdate.imageS3Key = uploadResult.key;
        }
      }

      const result = await this.updateQuestion(
        assessmentId,
        questionId,
        updateDto,
        user,
      );

      this.logger.log(
        colors.green(
          `[LIBRARY] Updated question with images: ${questionId}`,
        ),
      );
      return result;
    } catch (error) {
      this.logger.error(
        colors.red(
          `[LIBRARY] Error updating question with images, rolling back...`,
        ),
      );

      for (const s3Key of uploadedFiles) {
        try {
          await this.storageService.deleteFile(s3Key);
        } catch {
          this.logger.warn(
            colors.red(`[LIBRARY] Failed to rollback file: ${s3Key}`),
          );
        }
      }

      throw error;
    }
  }

  // ========================================
  // DELETE QUESTION
  // ========================================

  async deleteQuestion(
    assessmentId: string,
    questionId: string,
    user: any,
  ) {
    const { platformId } = await this.resolveLibraryUser(user);

    this.logger.log(
      colors.cyan(
        `[LIBRARY] Deleting question: ${questionId} from: ${assessmentId}`,
      ),
    );

    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: { id: assessmentId, platformId },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot delete questions from a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    const question = await this.prisma.libraryAssessmentQuestion.findFirst({
      where: { id: questionId, assessmentId },
      include: { options: true },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.libraryAssessmentQuestion.delete({
        where: { id: questionId },
      });

      const mediaToDelete: string[] = [];
      if (question.imageS3Key) mediaToDelete.push(question.imageS3Key);

      for (const option of question.options) {
        if (option.imageS3Key) mediaToDelete.push(option.imageS3Key);
      }

      for (const key of mediaToDelete) {
        try {
          await this.storageService.deleteFile(key);
        } catch {
          this.logger.warn(
            colors.yellow(`[LIBRARY] Failed to delete media: ${key}`),
          );
        }
      }

      const totalPoints = await tx.libraryAssessmentQuestion.aggregate({
        where: { assessmentId },
        _sum: { points: true },
      });

      await tx.libraryAssessment.update({
        where: { id: assessmentId },
        data: { totalPoints: totalPoints._sum.points ?? 0 },
      });
    });

    this.logger.log(
      colors.green(`[LIBRARY] Deleted question: ${questionId}`),
    );

    return ResponseHelper.success('Question deleted successfully', {
      assessmentId,
      deletedQuestionId: questionId,
      message: 'Question and all associated media have been removed',
    });
  }

  // ========================================
  // PRIVATE HELPERS: Grading
  // ========================================

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private validateImageFile(file: Express.Multer.File): void {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image file type: ${file.originalname}. Allowed: JPEG, PNG, GIF, WEBP`,
      );
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `Image file ${file.originalname} exceeds 5MB limit`,
      );
    }
  }

  private normalizeAnswers(answers: any[]): any[] {
    return (answers || []).map((a: any) => {
      const normalized = { ...a };
      if (normalized.selectedOptions == null && normalized.answer != null) {
        normalized.selectedOptions = Array.isArray(normalized.answer)
          ? normalized.answer
          : [normalized.answer];
      }
      return normalized;
    });
  }

  private gradeAnswers(
    answers: any[],
    questions: any[],
  ): {
    gradedAnswers: any[];
    totalScore: number;
    totalPoints: number;
  } {
    let totalScore = 0;
    let totalPoints = 0;
    const gradedAnswers: any[] = [];

    for (const answer of answers) {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) {
        this.logger.warn(
          colors.yellow(`Question not found: ${answer.questionId}`),
        );
        continue;
      }

      const isCorrect = this.checkAnswerCorrectness(answer, question);
      const pointsEarned = isCorrect ? question.points : 0;

      gradedAnswers.push({
        questionId: answer.questionId,
        questionType: answer.questionType || question.questionType,
        isCorrect,
        pointsEarned,
        maxPoints: question.points,
        selectedOptions: answer.selectedOptions || [],
        textAnswer: answer.textAnswer,
        numericAnswer:
          answer.questionType === 'NUMERIC' && answer.textAnswer
            ? parseFloat(answer.textAnswer)
            : null,
        dateAnswer:
          answer.questionType === 'DATE' && answer.textAnswer
            ? new Date(answer.textAnswer)
            : null,
      });

      totalScore += pointsEarned;
      totalPoints += question.points;
    }

    return { gradedAnswers, totalScore, totalPoints };
  }

  private checkAnswerCorrectness(answer: any, question: any): boolean {
    const correctAnswers = question.correctAnswers;
    const questionType = question.questionType;

    if (!correctAnswers || correctAnswers.length === 0) {
      const selectedOptions = answer.selectedOptions || [];
      if (selectedOptions.length > 0) {
        const options = question.options || [];
        const correctOptionIds = options
          .filter((o: any) => o.isCorrect)
          .map((o: any) => o.id);

        if (correctOptionIds.length > 0) {
          const studentOptions = [...selectedOptions].sort();
          const correctSorted = [...correctOptionIds].sort();
          return (
            JSON.stringify(studentOptions) === JSON.stringify(correctSorted)
          );
        }
      }
      return false;
    }

    const correctAnswer = correctAnswers[0];
    const selectedOptions = answer.selectedOptions || [];
    const optionIds = correctAnswer.optionIds;

    switch (questionType) {
      case 'MULTIPLE_CHOICE':
      case 'MULTIPLE_CHOICE_SINGLE':
      case 'TRUE_FALSE':
        if (selectedOptions.length > 0 && optionIds) {
          const studentOptions = [...selectedOptions].sort();
          const correctOptions = [...(optionIds || [])].sort();
          return (
            JSON.stringify(studentOptions) === JSON.stringify(correctOptions)
          );
        }
        break;

      case 'FILL_IN_BLANK':
      case 'SHORT_ANSWER':
        if (answer.textAnswer && correctAnswer.answerText) {
          return (
            answer.textAnswer.toLowerCase().trim() ===
            correctAnswer.answerText.toLowerCase().trim()
          );
        }
        break;

      case 'NUMERIC':
        if (answer.textAnswer && correctAnswer.answerNumber !== undefined) {
          const studentNumber = parseFloat(answer.textAnswer);
          return (
            !isNaN(studentNumber) &&
            Math.abs(studentNumber - correctAnswer.answerNumber) < 0.01
          );
        }
        break;

      case 'DATE':
        if (answer.textAnswer && correctAnswer.answerDate) {
          const studentDate = new Date(answer.textAnswer);
          const correctDate = new Date(correctAnswer.answerDate);
          return (
            !isNaN(studentDate.getTime()) &&
            studentDate.getTime() === correctDate.getTime()
          );
        }
        break;

      case 'ESSAY':
        return false;
    }

    return false;
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }
}
