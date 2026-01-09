import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import { SubmitAssessmentDto } from './dto';
import * as colors from 'colors';

@Injectable()
export class ExploreAssessmentService {
  private readonly logger = new Logger(ExploreAssessmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAssessment(user: any, assessmentId: string) {
    this.logger.log(
      colors.cyan(
        `🎯 User ${user.sub} requesting assessment details: ${assessmentId}`,
      ),
    );

    try {
      // Fetch assessment details
      const assessment = await this.prisma.libraryAssessment.findUnique({
        where: {
          id: assessmentId,
          status: 'ACTIVE', // Only active assessments
          isPublished: true, // Only published assessments
        },
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
          allowReview: true,
          totalPoints: true,
          passingScore: true,
          showCorrectAnswers: true,
          showFeedback: true,
          studentCanViewGrading: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          isPublished: true,
          publishedAt: true,
          tags: true,
          createdAt: true,
          updatedAt: true,
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              thumbnailUrl: true,
            },
          },
          chapter: {
            select: {
              id: true,
              title: true,
              order: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          platform: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              questions: true,
            },
          },
        },
      });

      if (!assessment) {
        this.logger.error(
          colors.red(`❌ Assessment not found or not available: ${assessmentId}`),
        );
        throw new NotFoundException('Assessment not found or not available');
      }

      // Check if assessment is within date range (if dates are set)
      const now = new Date();
      if (assessment.startDate && now < assessment.startDate) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Assessment hasn't started yet. Start date: ${assessment.startDate.toISOString()}`,
          ),
        );
        const startDate = new Date(assessment.startDate).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        throw new ForbiddenException(
          `This assessment has not started yet. It will be available on ${startDate}.`,
        );
      }
      if (assessment.endDate && now > assessment.endDate) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Assessment has ended. End date: ${assessment.endDate.toISOString()}`,
          ),
        );
        const endDate = new Date(assessment.endDate).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        throw new ForbiddenException(
          `This assessment ended on ${endDate}. No more attempts are allowed.`,
        );
      }

      // Get user's previous attempts
      const userAttempts = await this.prisma.libraryAssessmentAttempt.findMany({
        where: {
          assessmentId: assessmentId,
          userId: user.sub,
        },
        select: {
          id: true,
          attemptNumber: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          totalScore: true,
          percentage: true,
          passed: true,
          isGraded: true,
          createdAt: true,
        },
        orderBy: {
          attemptNumber: 'desc',
        },
      });

      // Calculate remaining attempts
      const attemptsTaken = userAttempts.length;
      const attemptsRemaining = assessment.maxAttempts - attemptsTaken;
      const canTakeAssessment = attemptsRemaining > 0;

      // Find latest attempt
      const latestAttempt = userAttempts[0] || null;

      const data = {
        assessment: {
          ...assessment,
          questionsCount: assessment._count.questions,
        },
        userProgress: {
          attemptsTaken,
          attemptsRemaining,
          maxAttempts: assessment.maxAttempts,
          canTakeAssessment,
          latestAttempt,
        },
        attempts: userAttempts,
      };

      this.logger.log(
        colors.green(
          `✅ Assessment retrieved: "${assessment.title}" (${attemptsTaken}/${assessment.maxAttempts} attempts used)`,
        ),
      );

      return ResponseHelper.success('Assessment retrieved successfully', data);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        colors.red(`❌ Error retrieving assessment: ${error.message}`),
      );
      throw error;
    }
  }

  async getAssessmentQuestions(user: any, assessmentId: string) {
    this.logger.log(
      colors.cyan(
        `📝 User ${user.sub} requesting questions for assessment: ${assessmentId}`,
      ),
    );

    try {
      // Verify assessment exists and is available
      const assessment = await this.prisma.libraryAssessment.findUnique({
        where: {
          id: assessmentId,
          status: 'ACTIVE',
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          maxAttempts: true,
          showCorrectAnswers: true,
          shuffleQuestions: true,
          shuffleOptions: true,
        },
      });

      if (!assessment) {
        this.logger.error(
          colors.red(`❌ Assessment not found: ${assessmentId}`),
        );
        throw new NotFoundException('Assessment not found or not available');
      }

      // Check if user has attempts remaining
      const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
        where: {
          assessmentId: assessmentId,
          userId: user.sub,
        },
      });

      if (attemptCount >= assessment.maxAttempts) {
        throw new ForbiddenException('No attempts remaining for this assessment');
      }

      // Fetch all questions with options
      const questions = await this.prisma.libraryAssessmentQuestion.findMany({
        where: {
          assessmentId: assessmentId,
        },
        select: {
          id: true,
          questionText: true,
          questionType: true,
          order: true,
          points: true,
          isRequired: true,
          timeLimit: true,
          imageUrl: true,
          audioUrl: true,
          videoUrl: true,
          showHint: true,
          hintText: true,
          minLength: true,
          maxLength: true,
          minValue: true,
          maxValue: true,
          difficultyLevel: true,
          // DO NOT include explanation here (only shown after submission if enabled)
          options: {
            select: {
              id: true,
              optionText: true,
              order: true,
              imageUrl: true,
              audioUrl: true,
              // DO NOT include isCorrect (only shown after submission)
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
        orderBy: {
          order: 'asc',
        },
      });

      // Shuffle questions if enabled
      let finalQuestions = questions;
      if (assessment.shuffleQuestions) {
        finalQuestions = this.shuffleArray([...questions]);
        this.logger.log(colors.yellow('🔀 Questions shuffled'));
      }

      // Shuffle options if enabled
      if (assessment.shuffleOptions) {
        finalQuestions = finalQuestions.map((question) => ({
          ...question,
          options: this.shuffleArray([...question.options]),
        }));
        this.logger.log(colors.yellow('🔀 Options shuffled'));
      }

      const data = {
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        questions: finalQuestions,
        totalQuestions: finalQuestions.length,
        totalPoints: finalQuestions.reduce((sum, q) => sum + q.points, 0),
        showCorrectAnswers: assessment.showCorrectAnswers,
      };

      this.logger.log(
        colors.green(
          `✅ Questions retrieved: ${finalQuestions.length} questions for "${assessment.title}"`,
        ),
      );

      return ResponseHelper.success(
        'Assessment questions retrieved successfully',
        data,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        colors.red(`❌ Error retrieving questions: ${error.message}`),
      );
      throw error;
    }
  }

  async submitAssessment(
    user: any,
    assessmentId: string,
    submitDto: SubmitAssessmentDto,
  ) {
    this.logger.log(
      colors.cyan(
        `📤 User ${user.sub} submitting assessment: ${assessmentId}`,
      ),
    );

    try {
      // Fetch assessment with all questions and correct answers
      const assessment = await this.prisma.libraryAssessment.findUnique({
        where: {
          id: assessmentId,
          status: 'ACTIVE',
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          maxAttempts: true,
          totalPoints: true,
          passingScore: true,
          showCorrectAnswers: true,
          showFeedback: true,
          gradingType: true,
          questions: {
            select: {
              id: true,
              questionText: true,
              questionType: true,
              points: true,
              explanation: true,
              correctAnswers: {
                select: {
                  answerText: true,
                  answerNumber: true,
                  answerDate: true,
                  optionIds: true,
                },
              },
              options: {
                select: {
                  id: true,
                  optionText: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }

      // Check attempts remaining
      const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
        where: {
          assessmentId: assessmentId,
          userId: user.sub,
        },
      });

      if (attemptCount >= assessment.maxAttempts) {
        throw new ForbiddenException('No attempts remaining');
      }

      const attemptNumber = attemptCount + 1;

      this.logger.log(
        colors.yellow(
          `📝 Processing attempt ${attemptNumber}/${assessment.maxAttempts}`,
        ),
      );

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

        // Check if question has correct answers defined
        if (!question.correctAnswers || question.correctAnswers.length === 0) {
          this.logger.warn(
            colors.yellow(
              `⚠️ No correct answer defined for question: ${response.questionId} - "${question.questionText}"`,
            ),
          );
          // Add as unanswered/ungraded
          gradedResponses.push({
            ...response,
            questionText: question.questionText,
            questionType: question.questionType,
            maxPoints: question.points,
            isCorrect: null,
            pointsEarned: 0,
            feedback: 'This question requires manual grading or has no correct answer defined.',
            explanation: assessment.showFeedback ? question.explanation : null,
          });
          continue;
        }

        const correctAnswer = question.correctAnswers[0];
        const gradeResult = this.gradeResponse(
          question,
          correctAnswer,
          response,
        );

        gradedResponses.push({
          ...response,
          questionText: question.questionText,
          questionType: question.questionType,
          maxPoints: question.points,
          ...gradeResult,
          explanation: assessment.showFeedback ? question.explanation : null,
        });

        if (gradeResult.isCorrect) {
          correctCount++;
          totalScore += gradeResult.pointsEarned;
        }
      }

      const percentage = (totalScore / assessment.totalPoints) * 100;
      const passed = percentage >= assessment.passingScore;

      this.logger.log(
        colors.cyan(
          `📊 Score: ${totalScore}/${assessment.totalPoints} (${percentage.toFixed(2)}%) - ${passed ? 'PASSED ✅' : 'FAILED ❌'}`,
        ),
      );

      // Create attempt and responses in transaction
      const attempt = await this.prisma.$transaction(async (tx) => {
        // Create attempt
        const newAttempt = await tx.libraryAssessmentAttempt.create({
          data: {
            assessmentId: assessmentId,
            userId: user.sub,
            attemptNumber: attemptNumber,
            status: 'SUBMITTED',
            startedAt: new Date(Date.now() - (submitDto.timeSpent || 0) * 1000),
            submittedAt: new Date(),
            timeSpent: submitDto.timeSpent || 0,
            totalScore: totalScore,
            maxScore: assessment.totalPoints,
            percentage: percentage,
            passed: passed,
            isGraded: true,
            gradedAt: new Date(),
          },
        });

        // Create all responses
        await tx.libraryAssessmentResponse.createMany({
          data: gradedResponses.map((gr) => ({
            attemptId: newAttempt.id,
            questionId: gr.questionId,
            userId: user.sub,
            textAnswer: gr.textAnswer || null,
            numericAnswer: gr.numericAnswer || null,
            dateAnswer: gr.dateAnswer ? new Date(gr.dateAnswer) : null,
            selectedOptions: gr.selectedOptions || [],
            fileUrls: gr.fileUrls || [],
            isCorrect: gr.isCorrect,
            pointsEarned: gr.pointsEarned,
            maxPoints: gr.maxPoints,
            timeSpent: gr.timeSpent || 0,
            isGraded: true,
          })),
        });

        return newAttempt;
      });

      this.logger.log(
        colors.green(
          `✅ Assessment submitted successfully: ${correctCount}/${gradedResponses.length} correct`,
        ),
      );

      // Prepare response data
      const data = {
        attempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent,
          totalScore: totalScore,
          maxScore: assessment.totalPoints,
          percentage: percentage,
          passed: passed,
        },
        results: {
          totalQuestions: gradedResponses.length,
          correctAnswers: correctCount,
          incorrectAnswers: gradedResponses.length - correctCount,
          totalScore: totalScore,
          maxScore: assessment.totalPoints,
          percentage: percentage,
          passingScore: assessment.passingScore,
          passed: passed,
          grade: this.calculateGrade(percentage),
        },
        responses: assessment.showCorrectAnswers
          ? gradedResponses
          : gradedResponses.map((gr) => ({
              questionId: gr.questionId,
              questionText: gr.questionText,
              questionType: gr.questionType,
              isCorrect: gr.isCorrect,
              pointsEarned: gr.pointsEarned,
              maxPoints: gr.maxPoints,
              explanation: gr.explanation,
            })),
        feedback: {
          message: passed
            ? '🎉 Congratulations! You passed the assessment.'
            : '📚 Keep studying! You can retake the assessment.',
          attemptsRemaining: assessment.maxAttempts - attemptNumber,
        },
      };

      return ResponseHelper.success('Assessment submitted successfully', data);
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

  // Helper function to grade individual response
  private gradeResponse(question: any, correctAnswer: any, response: any) {
    const { questionType } = question;

    switch (questionType) {
      case 'MULTIPLE_CHOICE_SINGLE':
      case 'TRUE_FALSE':
        return this.gradeMultipleChoiceSingle(
          question,
          correctAnswer,
          response,
        );

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

      case 'LONG_ANSWER':
      case 'FILE_UPLOAD':
      case 'MATCHING':
      case 'ORDERING':
      case 'RATING_SCALE':
        // These require manual grading
        return {
          isCorrect: null,
          pointsEarned: 0,
          feedback: 'This response requires manual grading',
        };

      default:
        return {
          isCorrect: false,
          pointsEarned: 0,
          feedback: 'Unknown question type',
        };
    }
  }

  private gradeMultipleChoiceSingle(
    question: any,
    correctAnswer: any,
    response: any,
  ) {
    if (!correctAnswer?.optionIds || correctAnswer.optionIds.length === 0) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined for this question',
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

  private gradeMultipleChoiceMultiple(
    question: any,
    correctAnswer: any,
    response: any,
  ) {
    if (!correctAnswer?.optionIds || correctAnswer.optionIds.length === 0) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined for this question',
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
        feedback: 'No correct answer defined for this question',
      };
    }

    const userAnswer = response.textAnswer?.trim().toLowerCase() || '';
    const correctText = correctAnswer.answerText.trim().toLowerCase();

    // Simple exact match (can be enhanced with fuzzy matching)
    const isCorrect = userAnswer === correctText;

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      correctAnswer: correctAnswer.answerText,
      selectedAnswer: response.textAnswer,
    };
  }

  private gradeNumeric(question: any, correctAnswer: any, response: any) {
    if (correctAnswer?.answerNumber === undefined || correctAnswer?.answerNumber === null) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined for this question',
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
    if (!correctAnswer?.answerDate) {
      return {
        isCorrect: null,
        pointsEarned: 0,
        feedback: 'No correct answer defined for this question',
      };
    }

    const userDate = response.dateAnswer
      ? new Date(response.dateAnswer).toISOString().split('T')[0]
      : null;
    const correctDate = new Date(correctAnswer.answerDate).toISOString().split('T')[0];

    const isCorrect = userDate === correctDate;

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
      correctAnswer: correctDate,
      selectedAnswer: userDate,
    };
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  // Helper function to shuffle array (Fisher-Yates algorithm)
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

