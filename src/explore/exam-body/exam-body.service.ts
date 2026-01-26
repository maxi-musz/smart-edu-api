import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { SubmitExamBodyAssessmentDto } from './dto/submit-assessment.dto';
import * as colors from 'colors';

@Injectable()
export class ExploreExamBodyService {
  private readonly logger = new Logger(ExploreExamBodyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Get all active exam bodies with their subjects and years
  async findAllExamBodies(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('📚 Fetching all exam bodies'));

    const examBodies = await this.prisma.examBody.findMany({
      where: { status: 'active' },
      include: {
        subjects: {
          where: { status: 'active' },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            code: true,
            iconUrl: true,
            order: true,
          },
        },
        years: {
          where: { status: 'active' },
          orderBy: { order: 'desc' },
          select: {
            id: true,
            year: true,
            order: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return new ApiResponse(true, 'Exam bodies retrieved successfully', examBodies);
  }

  // Get a single exam body with subjects and years
  async findOneExamBody(examBodyId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`📚 Fetching exam body: ${examBodyId}`));

    const examBody = await this.prisma.examBody.findUnique({
      where: { id: examBodyId, status: 'active' },
      include: {
        subjects: {
          where: { status: 'active' },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            code: true,
            iconUrl: true,
            order: true,
          },
        },
        years: {
          where: { status: 'active' },
          orderBy: { order: 'desc' },
          select: {
            id: true,
            year: true,
            order: true,
          },
        },
      },
    });

    if (!examBody) {
      throw new NotFoundException('Exam body not found');
    }

    return new ApiResponse(true, 'Exam body retrieved successfully', examBody);
  }

  // Get subjects for an exam body
  async getSubjects(examBodyId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`📚 Fetching subjects for exam body: ${examBodyId}`));

    const examBody = await this.prisma.examBody.findUnique({
      where: { id: examBodyId, status: 'active' },
      select: { id: true },
    });

    if (!examBody) {
      throw new NotFoundException('Exam body not found');
    }

    const subjects = await this.prisma.examBodySubject.findMany({
      where: {
        examBodyId,
        status: 'active',
      },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        iconUrl: true,
        order: true,
      },
    });

    return new ApiResponse(true, 'Subjects retrieved successfully', subjects);
  }

  // Get years for an exam body
  async getYears(examBodyId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`📚 Fetching years for exam body: ${examBodyId}`));

    const examBody = await this.prisma.examBody.findUnique({
      where: { id: examBodyId, status: 'active' },
      select: { id: true },
    });

    if (!examBody) {
      throw new NotFoundException('Exam body not found');
    }

    const years = await this.prisma.examBodyYear.findMany({
      where: {
        examBodyId,
        status: 'active',
      },
      orderBy: { order: 'desc' },
      select: {
        id: true,
        year: true,
        order: true,
      },
    });

    return new ApiResponse(true, 'Years retrieved successfully', years);
  }

  // Get published assessments for exam body, subject, and year
  async getAssessments(
    examBodyId: string,
    subjectId?: string,
    yearId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(
        `📚 Fetching assessments for exam body: ${examBodyId}, subject: ${subjectId}, year: ${yearId}`,
      ),
    );

    // Verify exam body exists
    const examBody = await this.prisma.examBody.findUnique({
      where: { id: examBodyId, status: 'active' },
      select: { id: true },
    });

    if (!examBody) {
      throw new NotFoundException('Exam body not found');
    }

    // Verify subject exists if provided
    if (subjectId) {
      const subject = await this.prisma.examBodySubject.findFirst({
        where: { id: subjectId, examBodyId, status: 'active' },
        select: { id: true },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    // Verify year exists if provided
    if (yearId) {
      const year = await this.prisma.examBodyYear.findFirst({
        where: { id: yearId, examBodyId, status: 'active' },
        select: { id: true },
      });

      if (!year) {
        throw new NotFoundException('Year not found');
      }
    }

    // Build where clause
    const where: any = {
      examBodyId,
      isPublished: true,
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (yearId) {
      where.yearId = yearId;
    }

    const assessments = await this.prisma.examBodyAssessment.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            iconUrl: true,
          },
        },
        year: {
          select: {
            id: true,
            year: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return new ApiResponse(true, 'Assessments retrieved successfully', assessments);
  }

  // Get questions for an assessment (WITHOUT correct answers)
  async getQuestions(
    examBodyId: string,
    assessmentId: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(
        `📚 Fetching questions for assessment: ${assessmentId} (exam body: ${examBodyId})`,
      ),
    );

    // Verify assessment exists and is published
    const assessment = await this.prisma.examBodyAssessment.findFirst({
      where: {
        id: assessmentId,
        examBodyId,
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        maxAttempts: true,
        duration: true,
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found or not published');
    }

    // Get questions WITHOUT correct answers
    const questions = await this.prisma.examBodyAssessmentQuestion.findMany({
      where: { assessmentId },
      include: {
        options: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            optionText: true,
            order: true,
            imageUrl: true,
            audioUrl: true,
            // DO NOT include isCorrect - answers are hidden
          },
        },
        // DO NOT include correctAnswers - answers are hidden
      },
      orderBy: { order: 'asc' },
    });

    return new ApiResponse(true, 'Questions retrieved successfully', {
      assessment,
      questions,
    });
  }

  // Submit assessment and automatically grade
  async submitAssessment(
    user: any,
    examBodyId: string,
    assessmentId: string,
    submitDto: SubmitExamBodyAssessmentDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(
        `📤 User ${user.sub} submitting exam body assessment: ${assessmentId}`,
      ),
    );

    try {
      // Verify assessment exists and is published
      const assessment = await this.prisma.examBodyAssessment.findFirst({
        where: {
          id: assessmentId,
          examBodyId,
          isPublished: true,
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

      if (!assessment) {
        throw new NotFoundException('Assessment not found or not published');
      }

      // Check attempts remaining
      const attemptCount = await this.prisma.examBodyAssessmentAttempt.count({
        where: {
          assessmentId,
          userId: user.sub,
        },
      });

      // Handle maxAttempts: null means unlimited
      if (assessment.maxAttempts !== null && attemptCount >= assessment.maxAttempts) {
        throw new ForbiddenException('No attempts remaining for this assessment');
      }

      const attemptNumber = attemptCount + 1;

      // Calculate total points from questions
      const maxScore = assessment.questions.reduce((sum, q) => sum + q.points, 0);

      // Grade each response
      const gradedResponses: any[] = [];
      let totalScore = 0;
      let correctCount = 0;

      for (const response of submitDto.responses) {
        const question = assessment.questions.find(
          (q) => q.id === response.questionId,
        );

        if (!question) {
          this.logger.warn(
            colors.yellow(`⚠️ Question not found: ${response.questionId}`),
          );
          continue;
        }

        // Grade the response
        const gradingResult = this.gradeResponse(question, response);

        const isCorrect = gradingResult.isCorrect;
        const pointsEarned = gradingResult.pointsEarned || 0;

        if (isCorrect === true) {
          correctCount++;
        }

        totalScore += pointsEarned;

        // Store graded response
        gradedResponses.push({
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          maxPoints: question.points,
          isCorrect,
          pointsEarned,
          feedback: gradingResult.feedback,
          explanation: question.explanation,
          correctAnswer: gradingResult.correctAnswer || null,
          selectedAnswer: gradingResult.selectedAnswer || null,
        });
      }

      // Calculate percentage
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const passed = percentage >= 50; // Default passing score is 50%

      // Create attempt record
      const attempt = await this.prisma.examBodyAssessmentAttempt.create({
        data: {
          assessmentId,
          userId: user.sub,
          attemptNumber,
          status: 'GRADED',
          startedAt: new Date(), // Could be improved to track actual start time
          submittedAt: new Date(),
          timeSpent: submitDto.timeSpent || null,
          totalScore,
          maxScore,
          percentage,
          passed,
          isGraded: true,
          gradedAt: new Date(),
        },
      });

      // Create response records
      await Promise.all(
        gradedResponses.map((gr) =>
          this.prisma.examBodyAssessmentResponse.create({
            data: {
              attemptId: attempt.id,
              questionId: gr.questionId,
              userId: user.sub,
              textAnswer: submitDto.responses.find(
                (r) => r.questionId === gr.questionId,
              )?.textAnswer,
              numericAnswer: submitDto.responses.find(
                (r) => r.questionId === gr.questionId,
              )?.numericAnswer,
              dateAnswer: submitDto.responses.find(
                (r) => r.questionId === gr.questionId,
              )?.dateAnswer
                ? new Date(
                    submitDto.responses.find(
                      (r) => r.questionId === gr.questionId,
                    )!.dateAnswer!,
                  )
                : null,
              selectedOptions:
                submitDto.responses.find((r) => r.questionId === gr.questionId)
                  ?.selectedOptions || [],
              fileUrls:
                submitDto.responses.find((r) => r.questionId === gr.questionId)
                  ?.fileUrls || [],
              isCorrect: gr.isCorrect,
              pointsEarned: gr.pointsEarned,
              maxPoints: gr.maxPoints,
              feedback: gr.feedback,
              isGraded: true,
            },
          }),
        ),
      );

      // Calculate attempts remaining
      const attemptsRemaining =
        assessment.maxAttempts === null
          ? null
          : Math.max(assessment.maxAttempts - attemptNumber, 0);

      const data = {
        attempt: {
          id: attempt.id,
          attemptNumber,
          status: attempt.status,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent,
          totalScore,
          maxScore,
          percentage,
          passed,
        },
        results: {
          totalQuestions: gradedResponses.length,
          correctAnswers: correctCount,
          incorrectAnswers: gradedResponses.length - correctCount,
          totalScore,
          maxScore,
          percentage,
          passed,
          grade: this.calculateGrade(percentage),
        },
        responses: gradedResponses,
        feedback: {
          message: passed
            ? '🎉 Congratulations! You passed the assessment.'
            : '📚 Keep studying! You can retake the assessment.',
          attemptsRemaining,
        },
      };

      this.logger.log(
        colors.green(
          `✅ Assessment submitted successfully. Score: ${totalScore}/${maxScore} (${percentage.toFixed(2)}%)`,
        ),
      );

      return new ApiResponse(true, 'Assessment submitted successfully', data);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        colors.red(`❌ Error submitting assessment: ${error.message}`),
      );
      throw error;
    }
  }

  // Get all attempts for the authenticated user (optionally filtered by assessmentId)
  async getUserAttempts(
    user: any,
    assessmentId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`📊 Fetching attempts for user: ${user.sub}${assessmentId ? ` (assessment: ${assessmentId})` : ''}`),
    );

    const where: any = {
      userId: user.sub,
    };

    if (assessmentId) {
      where.assessmentId = assessmentId;
    }

    const attempts = await this.prisma.examBodyAssessmentAttempt.findMany({
      where,
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            maxAttempts: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            year: {
              select: {
                id: true,
                year: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return new ApiResponse(true, 'Attempts retrieved successfully', attempts);
  }

  // Get attempt results
  async getAttemptResults(
    user: any,
    attemptId: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`📊 Fetching attempt results: ${attemptId} for user: ${user.sub}`),
    );
    this.logger.log(colors.yellow(`👤 User ID: ${user.sub}`));
    this.logger.log(colors.yellow(`🆔 Attempt ID: ${attemptId}`));

    const attempt = await this.prisma.examBodyAssessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            description: true,
            maxAttempts: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            year: {
              select: {
                id: true,
                year: true,
              },
            },
          },
        },
        responses: {
          include: {
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                points: true,
                order: true,
                imageUrl: true,
                audioUrl: true,
                videoUrl: true,
                explanation: true,
                options: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    optionText: true,
                    order: true,
                    isCorrect: true,
                    imageUrl: true,
                    audioUrl: true,
                  },
                },
                correctAnswers: {
                  select: {
                    id: true,
                    answerText: true,
                    answerNumber: true,
                    answerDate: true,
                    optionIds: true,
                    answerJson: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!attempt) {
      this.logger.error(colors.red(`❌ Attempt not found: ${attemptId}`));
      throw new NotFoundException('Attempt not found');
    }

    this.logger.log(colors.blue(`✅ Attempt found - User ID: ${attempt.userId}, Requested by: ${user.sub}`));

    // Verify user owns this attempt
    if (attempt.userId !== user.sub) {
      this.logger.error(colors.red(`❌ Access denied - Attempt belongs to user ${attempt.userId}, but requested by ${user.sub}`));
      throw new ForbiddenException('You do not have access to this attempt');
    }

    const data = {
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeSpent: attempt.timeSpent, // Time spent in seconds
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        passed: attempt.passed,
        createdAt: attempt.createdAt,
      },
      assessment: {
        id: attempt.assessment.id,
        title: attempt.assessment.title,
        description: attempt.assessment.description,
        maxAttempts: attempt.assessment.maxAttempts,
        subject: attempt.assessment.subject,
        year: attempt.assessment.year,
      },
      questions: attempt.responses.map((r) => ({
        questionId: r.questionId,
        questionText: r.question.questionText,
        questionType: r.question.questionType,
        points: r.maxPoints,
        order: r.question.order || 0,
        imageUrl: r.question.imageUrl,
        audioUrl: r.question.audioUrl,
        videoUrl: r.question.videoUrl,
        explanation: r.question.explanation,
        // User's answer
        userAnswer: {
          selectedOptions: r.selectedOptions,
          textAnswer: r.textAnswer,
          numericAnswer: r.numericAnswer,
          dateAnswer: r.dateAnswer,
          fileUrls: r.fileUrls,
        },
        // Correct answer
        correctAnswer: r.question.correctAnswers?.[0] || null,
        // All options (with isCorrect flag visible)
        options: r.question.options,
        // Grading result
        isCorrect: r.isCorrect,
        pointsEarned: r.pointsEarned,
        maxPoints: r.maxPoints,
        feedback: r.feedback,
      })),
      results: {
        totalQuestions: attempt.responses.length,
        correctAnswers: attempt.responses.filter((r) => r.isCorrect === true)
          .length,
        incorrectAnswers: attempt.responses.filter(
          (r) => r.isCorrect === false,
        ).length,
        unanswered: attempt.responses.filter((r) => r.isCorrect === null).length,
        totalScore: attempt.totalScore,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        passed: attempt.passed,
        grade: this.calculateGrade(attempt.percentage),
      },
    };

    this.logger.log(colors.green(`✅ Attempt results prepared:`));
    this.logger.log(colors.cyan(`   - Attempt ID: ${data.attempt.id}`));
    this.logger.log(colors.cyan(`   - Score: ${data.results.totalScore}/${data.results.maxScore} (${data.results.percentage}%)`));
    this.logger.log(colors.cyan(`   - Questions: ${data.questions.length}`));
    this.logger.log(colors.cyan(`   - Time Spent: ${data.attempt.timeSpent} seconds`));
    this.logger.log(colors.cyan(`   - Status: ${data.attempt.status}`));
    
    const response = new ApiResponse(true, 'Attempt results retrieved successfully', data);
    
    this.logger.log(colors.magenta('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    this.logger.log(colors.magenta('📤 COMPLETE RESPONSE BEING SENT TO FRONTEND:'));
    this.logger.log(colors.yellow(JSON.stringify({
      success: response.success,
      message: response.message,
      data: response.data
    }, null, 2)));
    this.logger.log(colors.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    return response;
  }

  // Helper: Grade a single response
  private gradeResponse(question: any, response: any) {
    const { questionType } = question;

    // Get correct answer
    const correctAnswer = question.correctAnswers?.[0];

    if (!correctAnswer) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined for this question',
        correctAnswer: null,
        selectedAnswer: null,
      };
    }

    switch (questionType) {
      case 'MULTIPLE_CHOICE_SINGLE':
      case 'TRUE_FALSE':
        return this.gradeMultipleChoiceSingle(question, correctAnswer, response);

      case 'MULTIPLE_CHOICE_MULTIPLE':
        return this.gradeMultipleChoiceMultiple(
          question,
          correctAnswer,
          response,
        );

      case 'SHORT_ANSWER':
      case 'FILL_IN_BLANK':
        return this.gradeShortAnswer(question, correctAnswer, response);

      case 'NUMERIC':
        return this.gradeNumeric(question, correctAnswer, response);

      case 'DATE':
        return this.gradeDate(question, correctAnswer, response);

      default:
        return {
          isCorrect: null,
          pointsEarned: 0,
          feedback: 'This question type requires manual grading',
          correctAnswer: null,
          selectedAnswer: null,
        };
    }
  }

  private gradeMultipleChoiceSingle(question: any, correctAnswer: any, response: any) {
    if (!correctAnswer?.optionIds || correctAnswer.optionIds.length === 0) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined',
        correctAnswer: null,
        selectedAnswer: null,
      };
    }

    const selectedOption = response.selectedOptions?.[0];
    const correctOptionId = correctAnswer.optionIds[0];
    const isCorrect = selectedOption === correctOptionId;

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      correctAnswer: correctOptionId,
      selectedAnswer: selectedOption,
    };
  }

  private gradeMultipleChoiceMultiple(question: any, correctAnswer: any, response: any) {
    if (!correctAnswer?.optionIds || correctAnswer.optionIds.length === 0) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined',
        correctAnswer: null,
        selectedAnswer: null,
      };
    }

    const selectedOptions = response.selectedOptions || [];
    const correctOptions = correctAnswer.optionIds;

    const isCorrect =
      selectedOptions.length === correctOptions.length &&
      selectedOptions.every((opt: string) => correctOptions.includes(opt));

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      correctAnswer: correctOptions,
      selectedAnswer: selectedOptions,
    };
  }

  private gradeShortAnswer(question: any, correctAnswer: any, response: any) {
    if (!correctAnswer?.answerText) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined',
        correctAnswer: null,
        selectedAnswer: null,
      };
    }

    const userAnswer = response.textAnswer?.trim().toLowerCase() || '';
    const correctText = correctAnswer.answerText.trim().toLowerCase();
    const isCorrect = userAnswer === correctText;

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      correctAnswer: correctAnswer.answerText,
      selectedAnswer: response.textAnswer,
    };
  }

  private gradeNumeric(question: any, correctAnswer: any, response: any) {
    if (correctAnswer.answerNumber === null || correctAnswer.answerNumber === undefined) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined',
        correctAnswer: null,
        selectedAnswer: null,
      };
    }

    const userAnswer = response.numericAnswer;
    const correctNumber = correctAnswer.answerNumber;
    const isCorrect = userAnswer === correctNumber;

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      correctAnswer: correctNumber,
      selectedAnswer: userAnswer,
    };
  }

  private gradeDate(question: any, correctAnswer: any, response: any) {
    if (!correctAnswer.answerDate) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined',
        correctAnswer: null,
        selectedAnswer: null,
      };
    }

    const userDate = response.dateAnswer
      ? new Date(response.dateAnswer).toISOString().split('T')[0]
      : null;
    const correctDate = new Date(correctAnswer.answerDate)
      .toISOString()
      .split('T')[0];
    const isCorrect = userDate === correctDate;

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      correctAnswer: correctDate,
      selectedAnswer: userDate,
    };
  }

  // Helper: Calculate letter grade
  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }
}
