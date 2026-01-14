import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitExamAssessmentDto } from './dto';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import { QuizAttemptStatus, QuestionType } from '@prisma/client';
import * as colors from 'colors';

@Injectable()
export class ExamPracticeService {
  private readonly logger = new Logger(ExamPracticeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getExamBodiesWithSubjects() {
    this.logger.log(colors.cyan('📚 Fetching exam bodies with subjects'));

    const examBodies = await this.prisma.examBody.findMany({
      where: { status: 'active' },
      include: {
        subjects: {
          where: { status: 'active' },
          orderBy: { order: 'asc' },
        },
        years: {
          where: { status: 'active' },
          orderBy: { order: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return ResponseHelper.success('Exam bodies retrieved successfully', examBodies);
  }

  async getAssessmentsByFilters(examBodyId: string, subjectId?: string, yearId?: string) {
    this.logger.log(colors.cyan(`📚 Fetching assessments for exam body: ${examBodyId}`));

    const assessments = await this.prisma.examBodyAssessment.findMany({
      where: {
        examBodyId,
        ...(subjectId && { subjectId }),
        ...(yearId && { yearId }),
        isPublished: true,
        status: 'active',
      },
      include: {
        examBody: true,
        subject: true,
        year: true,
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return ResponseHelper.success('Assessments retrieved successfully', assessments);
  }

  async getAssessmentDetails(userId: string, assessmentId: string) {
    this.logger.log(colors.cyan(`🔍 Getting assessment details: ${assessmentId} for user: ${userId}`));

    const assessment = await this.prisma.examBodyAssessment.findUnique({
      where: { id: assessmentId, isPublished: true, status: 'active' },
      include: {
        examBody: true,
        subject: true,
        year: true,
        _count: { select: { questions: true } },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found or not published');
    }

    const attemptCount = await this.prisma.examBodyAssessmentAttempt.count({
      where: { assessmentId, userId },
    });

    const previousAttempts = await this.prisma.examBodyAssessmentAttempt.findMany({
      where: { assessmentId, userId },
      select: {
        id: true,
        attemptNumber: true,
        status: true,
        totalScore: true,
        maxScore: true,
        percentage: true,
        passed: true,
        submittedAt: true,
        isGraded: true,
      },
      orderBy: { attemptNumber: 'desc' },
    });

    const canAttempt = attemptCount < assessment.maxAttempts;

    return ResponseHelper.success('Assessment details retrieved successfully', {
      ...assessment,
      attemptsTaken: attemptCount,
      attemptsRemaining: assessment.maxAttempts - attemptCount,
      previousAttempts,
      canAttempt,
    });
  }

  async getAssessmentQuestions(userId: string, assessmentId: string) {
    this.logger.log(colors.cyan(`📝 Getting questions for assessment: ${assessmentId}`));

    const assessment = await this.prisma.examBodyAssessment.findUnique({
      where: { id: assessmentId, isPublished: true, status: 'active' },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found or not published');
    }

    const attemptCount = await this.prisma.examBodyAssessmentAttempt.count({
      where: { assessmentId, userId },
    });

    if (attemptCount >= assessment.maxAttempts) {
      throw new BadRequestException('No attempts remaining for this assessment');
    }

    let questions = await this.prisma.examBodyAssessmentQuestion.findMany({
      where: { assessmentId },
      include: {
        options: {
          select: { id: true, optionText: true, order: true, imageUrl: true, audioUrl: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    if (assessment.shuffleQuestions) {
      questions = this.shuffleArray(questions);
    }

    if (assessment.shuffleOptions) {
      questions = questions.map(q => ({
        ...q,
        options: this.shuffleArray(q.options),
      }));
    }

    return ResponseHelper.success('Questions retrieved successfully', {
      assessmentId: assessment.id,
      title: assessment.title,
      questions,
      attemptsRemaining: assessment.maxAttempts - attemptCount,
    });
  }

  async submitAssessment(user: any, assessmentId: string, submitDto: SubmitExamAssessmentDto) {
    this.logger.log(colors.cyan(`📤 User ${user.sub} submitting exam assessment: ${assessmentId}`));

    const assessment = await this.prisma.examBodyAssessment.findUnique({
      where: { id: assessmentId, isPublished: true, status: 'active' },
      include: {
        questions: {
          include: {
            correctAnswers: true,
            options: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const attemptCount = await this.prisma.examBodyAssessmentAttempt.count({
      where: { assessmentId, userId: user.sub },
    });

    if (attemptCount >= assessment.maxAttempts) {
      throw new BadRequestException('No attempts remaining');
    }

    const attemptNumber = attemptCount + 1;

    this.logger.log(colors.yellow(`📝 Processing attempt ${attemptNumber}/${assessment.maxAttempts}`));

    const gradedResponses: any[] = [];
    let totalScore = 0;
    let correctCount = 0;
    let incorrectCount = 0;

    for (const response of submitDto.responses) {
      const question = assessment.questions.find(q => q.id === response.questionId);
      if (!question || !question.correctAnswers || question.correctAnswers.length === 0) continue;

      const correctAnswer = question.correctAnswers[0];
      const gradeResult = this.gradeResponse(question, correctAnswer, response);

      gradedResponses.push({
        questionId: question.id,
        questionText: question.questionText,
        questionType: question.questionType,
        maxPoints: question.points,
        textAnswer: response.textAnswer,
        numericAnswer: response.numericAnswer,
        dateAnswer: response.dateAnswer,
        selectedOptions: response.selectedOptions,
        isCorrect: gradeResult.isCorrect,
        pointsEarned: gradeResult.pointsEarned,
        feedback: gradeResult.feedback,
        correctAnswer: gradeResult.correctAnswer,
        explanation: assessment.showExplanation ? question.explanation : null,
      });

      if (gradeResult.isCorrect) {
        correctCount++;
        totalScore += gradeResult.pointsEarned;
      } else {
        incorrectCount++;
      }
    }

    const percentage = (totalScore / assessment.totalPoints) * 100;
    const passed = percentage >= assessment.passingScore;

    this.logger.log(colors.cyan(`📊 Score: ${totalScore}/${assessment.totalPoints} (${percentage.toFixed(2)}%) - ${passed ? 'PASSED ✅' : 'FAILED ❌'}`));

    const attempt = await this.prisma.$transaction(async (tx) => {
      const newAttempt = await tx.examBodyAssessmentAttempt.create({
        data: {
          assessmentId,
          userId: user.sub,
          attemptNumber,
          status: QuizAttemptStatus.SUBMITTED,
          startedAt: submitDto.startedAt,
          submittedAt: new Date(),
          timeSpent: submitDto.timeSpent,
          totalScore,
          maxScore: assessment.totalPoints,
          percentage,
          passed,
          isGraded: true,
          gradedAt: new Date(),
        },
      });

      await tx.examBodyAssessmentResponse.createMany({
        data: gradedResponses.map(gr => ({
          attemptId: newAttempt.id,
          questionId: gr.questionId,
          userId: user.sub,
          textAnswer: gr.textAnswer,
          numericAnswer: gr.numericAnswer,
          dateAnswer: gr.dateAnswer ? new Date(gr.dateAnswer) : null,
          selectedOptions: gr.selectedOptions || [],
          isCorrect: gr.isCorrect,
          pointsEarned: gr.pointsEarned,
          maxPoints: gr.maxPoints,
          feedback: gr.feedback,
          isGraded: true,
        })),
      });

      return newAttempt;
    });

    const attemptsRemaining = assessment.maxAttempts - attempt.attemptNumber;

    this.logger.log(colors.green(`✅ Assessment submitted. Score: ${totalScore}/${assessment.totalPoints}`));

    return ResponseHelper.success('Assessment submitted successfully', {
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentage: parseFloat(attempt.percentage.toFixed(2)),
        passed: attempt.passed,
      },
      results: {
        totalQuestions: assessment.questions.length,
        correctAnswers: correctCount,
        incorrectAnswers: incorrectCount,
        passed,
      },
      responses: assessment.showCorrectAnswers ? gradedResponses : gradedResponses.map(r => ({
        questionId: r.questionId,
        questionText: r.questionText,
        isCorrect: r.isCorrect,
        pointsEarned: r.pointsEarned,
      })),
      feedback: {
        attemptsRemaining,
      },
    });
  }

  private gradeResponse(question: any, correctAnswer: any, userResponse: any) {
    switch (question.questionType) {
      case QuestionType.MULTIPLE_CHOICE_SINGLE:
      case QuestionType.TRUE_FALSE:
        const selectedOption = userResponse.selectedOptions?.[0];
        const correctOptionId = correctAnswer.optionIds?.[0];
        const isCorrect = selectedOption === correctOptionId;
        return {
          isCorrect,
          pointsEarned: isCorrect ? question.points : 0,
          correctAnswer: correctOptionId,
          feedback: isCorrect ? 'Correct!' : 'Incorrect.',
        };

      case QuestionType.MULTIPLE_CHOICE_MULTIPLE:
        const selectedOptions = userResponse.selectedOptions || [];
        const correctOptions = correctAnswer.optionIds || [];
        const isMultipleCorrect = selectedOptions.length === correctOptions.length &&
          selectedOptions.every((opt: string) => correctOptions.includes(opt));
        return {
          isCorrect: isMultipleCorrect,
          pointsEarned: isMultipleCorrect ? question.points : 0,
          correctAnswer: correctOptions,
          feedback: isMultipleCorrect ? 'Correct!' : 'Incorrect.',
        };

      case QuestionType.SHORT_ANSWER:
        const userAnswer = userResponse.textAnswer?.trim().toLowerCase() || '';
        const correctText = correctAnswer.answerText?.trim().toLowerCase() || '';
        const isTextCorrect = userAnswer === correctText;
        return {
          isCorrect: isTextCorrect,
          pointsEarned: isTextCorrect ? question.points : 0,
          correctAnswer: correctAnswer.answerText,
          feedback: isTextCorrect ? 'Correct!' : 'Incorrect.',
        };

      default:
        return {
          isCorrect: null,
          pointsEarned: 0,
          correctAnswer: null,
          feedback: 'Requires manual grading',
        };
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

