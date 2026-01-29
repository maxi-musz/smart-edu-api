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
        `[EXPLORER - GET] 🎯 User requesting assessment details`,
      ),
    );

    try {
      // Fetch assessment details
      const assessment = await this.prisma.libraryAssessment.findUnique({
        where: {
          id: assessmentId,
          // status: 'ACTIVE', // Only active assessments
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

      // Calculate attempts (unlimited for explore assessments)
      const attemptsTaken = userAttempts.length;
      // Explore assessments allow unlimited attempts - ignore maxAttempts
      const canTakeAssessment = true;

      // Find latest attempt
      const latestAttempt = userAttempts[0] || null;

      const data = {
        assessment: {
          ...assessment,
          questionsCount: assessment._count.questions,
        },
        userProgress: {
          attemptsTaken,
          attemptsRemaining: null, // Unlimited for explore assessments
          maxAttempts: null, // Unlimited for explore assessments
          canTakeAssessment,
          latestAttempt,
        },
        attempts: userAttempts,
      };

      this.logger.log(
        colors.green(
          `✅ Assessment retrieved: "${assessment.title}" (${attemptsTaken} attempts taken - unlimited attempts allowed)`,
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

      // Get attempt count (for logging only - explore assessments allow unlimited attempts)
      const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
        where: {
          assessmentId: assessmentId,
          userId: user.sub,
        },
      });

      // Explore assessments allow unlimited attempts - no restriction check

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

      // ============ DETAILED LOGGING FOR DEBUGGING ============
      this.logger.log(colors.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      this.logger.log(colors.magenta('📥 SUBMISSION PAYLOAD FROM FRONTEND:'));
      this.logger.log(colors.yellow(JSON.stringify(submitDto, null, 2)));
      
      this.logger.log(colors.magenta('\n📚 ASSESSMENT QUESTIONS & CORRECT ANSWERS:'));
      assessment.questions.forEach((question, index) => {
        this.logger.log(colors.cyan(`\n--- Question ${index + 1} ---`));
        this.logger.log(colors.white(`ID: ${question.id}`));
        this.logger.log(colors.white(`Text: ${question.questionText}`));
        this.logger.log(colors.white(`Type: ${question.questionType}`));
        this.logger.log(colors.white(`Points: ${question.points}`));
        
        if (question.correctAnswers && question.correctAnswers.length > 0) {
          this.logger.log(colors.green('✅ Correct Answers:'));
          question.correctAnswers.forEach((ca, caIndex) => {
            this.logger.log(colors.green(`  [${caIndex}] answerText: ${ca.answerText}`));
            this.logger.log(colors.green(`  [${caIndex}] answerNumber: ${ca.answerNumber}`));
            this.logger.log(colors.green(`  [${caIndex}] answerDate: ${ca.answerDate}`));
            this.logger.log(colors.green(`  [${caIndex}] optionIds: ${JSON.stringify(ca.optionIds)}`));
          });
        } else {
          this.logger.log(colors.red('❌ NO CORRECT ANSWERS DEFINED!'));
        }
        
        if (question.options && question.options.length > 0) {
          this.logger.log(colors.blue('📋 Options:'));
          question.options.forEach(opt => {
            this.logger.log(colors.blue(`  - ${opt.id}: ${opt.optionText} (isCorrect: ${opt.isCorrect})`));
          });
        }
      });
      
      this.logger.log(colors.magenta('\n🔍 USER RESPONSES:'));
      submitDto.responses.forEach((response, index) => {
        this.logger.log(colors.yellow(`\n--- User Response ${index + 1} ---`));
        this.logger.log(colors.yellow(`Question ID: ${response.questionId}`));
        this.logger.log(colors.yellow(`Text Answer: ${response.textAnswer}`));
        this.logger.log(colors.yellow(`Numeric Answer: ${response.numericAnswer}`));
        this.logger.log(colors.yellow(`Date Answer: ${response.dateAnswer}`));
        this.logger.log(colors.yellow(`Selected Options: ${JSON.stringify(response.selectedOptions)}`));
        this.logger.log(colors.yellow(`File URLs: ${JSON.stringify(response.fileUrls)}`));
      });
      this.logger.log(colors.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
      // ============ END DETAILED LOGGING ============

      // Get attempt count (for logging only - explore assessments allow unlimited attempts)
      const attemptCount = await this.prisma.libraryAssessmentAttempt.count({
        where: {
          assessmentId: assessmentId,
          userId: user.sub,
        },
      });

      // Explore assessments allow unlimited attempts - no restriction check
      const attemptNumber = attemptCount + 1;

      this.logger.log(
        colors.yellow(
          `📝 Processing attempt ${attemptNumber} (unlimited attempts allowed)`,
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
        
        // LOG GRADING COMPARISON
        this.logger.log(colors.bgBlue.white(`\n⚖️  GRADING Question: ${question.questionText}`));
        this.logger.log(colors.cyan(`   Type: ${question.questionType}`));
        this.logger.log(colors.green(`   Correct Answer: ${JSON.stringify(correctAnswer)}`));
        this.logger.log(colors.yellow(`   User Response: ${JSON.stringify({
          textAnswer: response.textAnswer,
          numericAnswer: response.numericAnswer,
          dateAnswer: response.dateAnswer,
          selectedOptions: response.selectedOptions,
          fileUrls: response.fileUrls
        })}`));
        
        const gradeResult = this.gradeResponse(
          question,
          correctAnswer,
          response,
        );
        
        this.logger.log(colors.bold(gradeResult.isCorrect 
          ? colors.green(`   ✅ CORRECT! Points: ${gradeResult.pointsEarned}/${question.points}`)
          : colors.red(`   ❌ INCORRECT! Points: ${gradeResult.pointsEarned}/${question.points}`)
        ));

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
          attemptsRemaining: null, // Unlimited attempts for explore assessments
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
    
    this.logger.log(colors.blue(`      🔹 Grading Multiple Choice (Single)`));
    this.logger.log(colors.blue(`         Selected: ${selectedOption}`));
    this.logger.log(colors.blue(`         Correct:  ${correctOptionId}`));
    
    const isCorrect = selectedOption === correctOptionId;
    
    this.logger.log(colors.blue(`         Match: ${isCorrect} (${selectedOption} === ${correctOptionId})`));

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

    this.logger.log(colors.blue(`      🔹 Grading Multiple Choice (Multiple)`));
    this.logger.log(colors.blue(`         Selected: [${selectedOptions.join(', ')}] (count: ${selectedOptions.length})`));
    this.logger.log(colors.blue(`         Correct:  [${correctOptions.join(', ')}] (count: ${correctOptions.length})`));

    const isCorrect =
      selectedOptions.length === correctOptions.length &&
      selectedOptions.every((opt: string) => correctOptions.includes(opt));

    this.logger.log(colors.blue(`         Length match: ${selectedOptions.length === correctOptions.length}`));
    this.logger.log(colors.blue(`         All options match: ${selectedOptions.every((opt: string) => correctOptions.includes(opt))}`));
    this.logger.log(colors.blue(`         Final result: ${isCorrect}`));

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

    this.logger.log(colors.blue(`      🔹 Grading Short Answer`));
    this.logger.log(colors.blue(`         User Answer (normalized):    "${userAnswer}"`));
    this.logger.log(colors.blue(`         Correct Answer (normalized): "${correctText}"`));

    // Simple exact match (can be enhanced with fuzzy matching)
    const isCorrect = userAnswer === correctText;
    
    this.logger.log(colors.blue(`         Match: ${isCorrect}`));

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

  async getAttemptResults(user: any, attemptId: string) {
    this.logger.log(
      colors.cyan(
        `📊 User ${user.sub} requesting attempt results: ${attemptId}`,
      ),
    );

    try {
      // Fetch the attempt with all details
      const attempt = await this.prisma.libraryAssessmentAttempt.findUnique({
        where: {
          id: attemptId,
        },
        select: {
          id: true,
          attemptNumber: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          timeSpent: true,
          totalScore: true,
          maxScore: true,
          percentage: true,
          passed: true,
          isGraded: true,
          gradedAt: true,
          userId: true,
          assessment: {
            select: {
              id: true,
              title: true,
              description: true,
              totalPoints: true,
              passingScore: true,
              showCorrectAnswers: true,
              showFeedback: true,
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
          responses: {
            select: {
              id: true,
              questionId: true,
              textAnswer: true,
              numericAnswer: true,
              dateAnswer: true,
              selectedOptions: true,
              fileUrls: true,
              isCorrect: true,
              pointsEarned: true,
              maxPoints: true,
              feedback: true,
              timeSpent: true,
              question: {
                select: {
                  id: true,
                  questionText: true,
                  questionType: true,
                  points: true,
                  explanation: true,
                  imageUrl: true,
                  audioUrl: true,
                  videoUrl: true,
                  order: true,
                  options: {
                    select: {
                      id: true,
                      optionText: true,
                      imageUrl: true,
                      order: true,
                    },
                    orderBy: {
                      order: 'asc',
                    },
                  },
                  correctAnswers: {
                    select: {
                      answerText: true,
                      answerNumber: true,
                      answerDate: true,
                      optionIds: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              question: {
                order: 'asc',
              },
            },
          },
        },
      });

      if (!attempt) {
        this.logger.error(
          colors.red(`❌ Attempt not found: ${attemptId}`),
        );
        throw new NotFoundException('Attempt not found');
      }

      // Verify that this attempt belongs to the requesting user
      if (attempt.userId !== user.sub) {
        this.logger.warn(
          colors.red(
            `⚠️ User ${user.sub} tried to access attempt ${attemptId} belonging to ${attempt.userId}`,
          ),
        );
        throw new ForbiddenException('You can only view your own attempts');
      }

      // Format responses with correct answers if allowed
      const formattedResponses = attempt.responses.map((response) => {
        const question = response.question;
        const correctAnswer = question.correctAnswers[0];

        // Base response object
        const responseData: any = {
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          points: question.points,
          imageUrl: question.imageUrl,
          audioUrl: question.audioUrl,
          videoUrl: question.videoUrl,
          order: question.order,
          options: question.options,
          userAnswer: {
            textAnswer: response.textAnswer,
            numericAnswer: response.numericAnswer,
            dateAnswer: response.dateAnswer,
            selectedOptions: response.selectedOptions,
            fileUrls: response.fileUrls,
          },
          isCorrect: response.isCorrect,
          pointsEarned: response.pointsEarned,
          maxPoints: response.maxPoints,
          feedback: response.feedback,
          timeSpent: response.timeSpent,
        };

        // Include correct answer if assessment allows it
        if (attempt.assessment.showCorrectAnswers && correctAnswer) {
          responseData.correctAnswer = {
            text: correctAnswer.answerText,
            number: correctAnswer.answerNumber,
            date: correctAnswer.answerDate,
            optionIds: correctAnswer.optionIds,
          };
        }

        // Include explanation if assessment allows it
        if (attempt.assessment.showFeedback) {
          responseData.explanation = question.explanation;
        }

        return responseData;
      });

      // Calculate summary statistics
      const correctCount = attempt.responses.filter((r) => r.isCorrect === true).length;
      const incorrectCount = attempt.responses.filter((r) => r.isCorrect === false).length;
      const ungradedCount = attempt.responses.filter((r) => r.isCorrect === null).length;

      const responseData = {
        attempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          status: attempt.status,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
          timeSpent: attempt.timeSpent,
          totalScore: attempt.totalScore,
          maxScore: attempt.maxScore,
          percentage: parseFloat(attempt.percentage.toFixed(2)),
          passed: attempt.passed,
          isGraded: attempt.isGraded,
          gradedAt: attempt.gradedAt,
          grade: this.calculateGrade(attempt.percentage),
        },
        assessment: {
          id: attempt.assessment.id,
          title: attempt.assessment.title,
          description: attempt.assessment.description,
          totalPoints: attempt.assessment.totalPoints,
          passingScore: attempt.assessment.passingScore,
          subject: attempt.assessment.subject,
          topic: attempt.assessment.topic,
        },
        summary: {
          totalQuestions: attempt.responses.length,
          correctAnswers: correctCount,
          incorrectAnswers: incorrectCount,
          ungradedQuestions: ungradedCount,
        },
        responses: formattedResponses,
      };

      this.logger.log(
        colors.green(
          `✅ Attempt results retrieved: ${attempt.totalScore}/${attempt.maxScore} (${attempt.percentage.toFixed(2)}%)`,
        ),
      );

      return ResponseHelper.success(
        'Attempt results retrieved successfully',
        responseData,
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        colors.red(`❌ Error retrieving attempt results: ${error.message}`),
      );
      throw error;
    }
  }

  /**
   * Get all attempts for the authenticated user (summary list)
   * Optionally filtered by assessmentId
   */
  async getUserAttempts(
    user: any,
    assessmentId?: string,
  ) {
    this.logger.log(
      colors.cyan(
        `📊 Fetching attempts for user: ${user.sub}${assessmentId ? ` (assessment: ${assessmentId})` : ''}`,
      ),
    );

    try {
      const where: any = {
        userId: user.sub,
      };

      if (assessmentId) {
        where.assessmentId = assessmentId;
      }

      const attempts = await this.prisma.libraryAssessmentAttempt.findMany({
        where,
        select: {
          id: true,
          attemptNumber: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          timeSpent: true,
          totalScore: true,
          maxScore: true,
          percentage: true,
          passed: true,
          isGraded: true,
          gradedAt: true,
          createdAt: true,
          assessment: {
            select: {
              id: true,
              title: true,
              description: true,
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
        orderBy: { submittedAt: 'desc' },
      });

      this.logger.log(
        colors.green(
          `✅ Retrieved ${attempts.length} attempts for user: ${user.sub}`,
        ),
      );

      return ResponseHelper.success('Attempts retrieved successfully', attempts);
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error retrieving attempts: ${error.message}`),
      );
      throw error;
    }
  }
}

