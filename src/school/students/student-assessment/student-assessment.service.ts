import { Injectable, Logger } from '@nestjs/common';
import * as colors from 'colors';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import { GetStudentAssessmentsQueryDto } from './dto/get-assessments-query.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

interface StudentContext {
  fullUser: { id: string; school_id: string; role: string };
  student: any;
  currentSession: any;
  studentClass: any;
  subjectIds: string[];
}

@Injectable()
export class StudentAssessmentService {
  private readonly logger = new Logger(StudentAssessmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  private async resolveStudentContext(
    user: any,
  ): Promise<StudentContext | ApiResponse<null>> {
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true, role: true },
    });

    if (!fullUser) return new ApiResponse(false, 'User not found', null);
    if (fullUser.role !== 'student')
      return new ApiResponse(false, 'Access denied. Student role required.', null);

    const student = await this.prisma.student.findFirst({
      where: { user_id: user.sub, school_id: fullUser.school_id },
    });
    if (!student) return new ApiResponse(false, 'Student not found', null);

    const currentSession = await this.prisma.academicSession.findFirst({
      where: { school_id: student.school_id, is_current: true },
    });
    if (!currentSession)
      return new ApiResponse(false, 'No current academic session found', null);

    const studentClass = await this.prisma.class.findUnique({
      where: { id: student.current_class_id || undefined },
      include: {
        subjects: {
          where: { academic_session_id: currentSession.id },
          select: { id: true },
        },
      },
    });
    if (!studentClass) return new ApiResponse(false, 'Student class not found', null);

    const subjectIds = studentClass.subjects.map((s) => s.id);

    return { fullUser, student, currentSession, studentClass, subjectIds };
  }

  private isApiResponse(value: any): value is ApiResponse<null> {
    return value instanceof ApiResponse;
  }

  private checkAnswerByType(answer: any, question: any): boolean {
    const correctAnswers = question.correct_answers;
    this.logger.log(
      colors.cyan(`🔍 Checking answer for question ${answer.question_id}:`),
    );
    this.logger.log(colors.cyan(`   - Question type: ${answer.question_type}`));
    this.logger.log(
      colors.cyan(`   - Correct answers: ${JSON.stringify(correctAnswers)}`),
    );
    this.logger.log(
      colors.cyan(`   - Student answer: ${JSON.stringify(answer)}`),
    );

    if (!correctAnswers || correctAnswers.length === 0) {
      this.logger.warn(
        colors.yellow(
          `⚠️ No correct answers found for question ${answer.question_id}, will use fallback method`,
        ),
      );
      return false;
    }

    const correctAnswer = correctAnswers[0];
    this.logger.log(
      colors.cyan(
        `   - Using correct answer: ${JSON.stringify(correctAnswer)}`,
      ),
    );

    const selectedOptions =
      answer.selected_options ?? (answer.answer != null ? [answer.answer] : []);

    switch (answer.question_type || question.question_type) {
      case 'MULTIPLE_CHOICE':
      case 'MULTIPLE_CHOICE_SINGLE':
        if (selectedOptions.length > 0 && correctAnswer.option_ids) {
          const studentOptions = [...selectedOptions].sort();
          const correctOptions = [...(correctAnswer.option_ids || [])].sort();
          const isCorrect =
            JSON.stringify(studentOptions) === JSON.stringify(correctOptions);
          this.logger.log(
            colors.cyan(
              `   - Student options: ${JSON.stringify(studentOptions)}`,
            ),
          );
          this.logger.log(
            colors.cyan(
              `   - Correct options: ${JSON.stringify(correctOptions)}`,
            ),
          );
          this.logger.log(colors.cyan(`   - Match: ${isCorrect}`));
          return isCorrect;
        }
        break;

      case 'TRUE_FALSE':
        if (selectedOptions.length > 0 && correctAnswer.option_ids) {
          const studentAnswer = selectedOptions[0];
          const correctOption = correctAnswer.option_ids[0];
          const isCorrect = studentAnswer === correctOption;
          this.logger.log(colors.cyan(`   - Student answer: ${studentAnswer}`));
          this.logger.log(colors.cyan(`   - Correct option: ${correctOption}`));
          this.logger.log(colors.cyan(`   - Match: ${isCorrect}`));
          return isCorrect;
        }
        break;

      case 'FILL_IN_BLANK':
      case 'ESSAY':
        if (answer.text_answer && correctAnswer.answer_text) {
          if (answer.question_type === 'FILL_IN_BLANK') {
            const isCorrect =
              answer.text_answer.toLowerCase().trim() ===
              correctAnswer.answer_text.toLowerCase().trim();
            this.logger.log(
              colors.cyan(`   - Student text: "${answer.text_answer}"`),
            );
            this.logger.log(
              colors.cyan(`   - Correct text: "${correctAnswer.answer_text}"`),
            );
            this.logger.log(colors.cyan(`   - Match: ${isCorrect}`));
            return isCorrect;
          }
          const isCorrect =
            answer.text_answer.toLowerCase().trim() ===
            correctAnswer.answer_text.toLowerCase().trim();
          this.logger.log(
            colors.cyan(`   - Student text: "${answer.text_answer}"`),
          );
          this.logger.log(
            colors.cyan(`   - Correct text: "${correctAnswer.answer_text}"`),
          );
          this.logger.log(colors.cyan(`   - Match: ${isCorrect}`));
          return isCorrect;
        }
        break;

      case 'NUMERIC':
        if (answer.text_answer && correctAnswer.answer_number !== undefined) {
          const studentNumber = parseFloat(answer.text_answer);
          const isCorrect =
            !isNaN(studentNumber) &&
            Math.abs(studentNumber - correctAnswer.answer_number) < 0.01;
          this.logger.log(colors.cyan(`   - Student number: ${studentNumber}`));
          this.logger.log(
            colors.cyan(`   - Correct number: ${correctAnswer.answer_number}`),
          );
          this.logger.log(colors.cyan(`   - Match: ${isCorrect}`));
          return isCorrect;
        }
        break;

      case 'DATE':
        if (answer.text_answer && correctAnswer.answer_date) {
          const studentDate = new Date(answer.text_answer);
          const correctDate = new Date(correctAnswer.answer_date);
          const isCorrect =
            !isNaN(studentDate.getTime()) &&
            studentDate.getTime() === correctDate.getTime();
          this.logger.log(
            colors.cyan(`   - Student date: ${studentDate.toISOString()}`),
          );
          this.logger.log(
            colors.cyan(`   - Correct date: ${correctDate.toISOString()}`),
          );
          this.logger.log(colors.cyan(`   - Match: ${isCorrect}`));
          return isCorrect;
        }
        break;

      default:
        this.logger.log(
          colors.cyan(
            `   - Using fallback method for type: ${answer.question_type}`,
          ),
        );
        return this.checkAnswer(answer, correctAnswers);
    }

    this.logger.warn(
      colors.yellow(
        `⚠️ No matching condition for question type: ${answer.question_type}`,
      ),
    );
    return false;
  }

  private checkAnswer(answer: any, correctAnswers: any[]): boolean {
    if (!correctAnswers || correctAnswers.length === 0) return false;

    const correctAnswer = correctAnswers[0];

    const optionIds =
      answer.selected_option_ids ??
      answer.selected_options ??
      (answer.answer != null ? [answer.answer] : []);
    if (optionIds.length > 0 && correctAnswer.option_ids) {
      const studentOptions = [...optionIds].sort();
      const correctOptions = [...(correctAnswer.option_ids || [])].sort();
      return JSON.stringify(studentOptions) === JSON.stringify(correctOptions);
    }

    if (answer.answer_text && correctAnswer.answer_text) {
      return (
        answer.answer_text.toLowerCase().trim() ===
        correctAnswer.answer_text.toLowerCase().trim()
      );
    }

    if (
      answer.answer_number !== undefined &&
      correctAnswer.answer_number !== undefined
    ) {
      return (
        Math.abs(answer.answer_number - correctAnswer.answer_number) < 0.01
      );
    }

    if (answer.answer_date && correctAnswer.answer_date) {
      const studentDate = new Date(answer.answer_date);
      const correctDate = new Date(correctAnswer.answer_date);
      return studentDate.getTime() === correctDate.getTime();
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

  private async updateQuizSubmissionsInTransaction(
    tx: any,
    quizId: string,
    userId: string,
    email: string,
    firstName: string,
    lastName: string,
  ) {
    try {
      const quiz = await tx.assessment.findUnique({
        where: { id: quizId },
        select: { submissions: true },
      });

      if (!quiz) return;

      const currentSubmissions = quiz.submissions || {
        total_submissions: 0,
        recent_submissions: [],
        student_counts: {},
      };

      const existingSubmission = currentSubmissions.recent_submissions.find(
        (sub: any) => sub.user_id === userId,
      );
      const userAlreadySubmitted = !!existingSubmission;
      const currentUserCount = currentSubmissions.student_counts[userId] || 0;

      const updatedSubmissions = {
        total_submissions: userAlreadySubmitted
          ? currentSubmissions.total_submissions
          : currentSubmissions.total_submissions + 1,
        student_counts: {
          ...currentSubmissions.student_counts,
          [userId]: currentUserCount + 1,
        },
        recent_submissions: [
          {
            user_id: userId,
            name: `${firstName} ${lastName}`,
            email: email,
            submitted_at: new Date().toISOString(),
            count: currentUserCount + 1,
          },
          ...currentSubmissions.recent_submissions.filter(
            (sub: any) => sub.user_id !== userId,
          ),
        ].slice(0, 10),
      };

      await tx.assessment.update({
        where: { id: quizId },
        data: { submissions: updatedSubmissions },
      });

      this.logger.log(
        colors.green(
          `✅ Quiz submissions updated: ${updatedSubmissions.total_submissions} total submissions, ${updatedSubmissions.student_counts[userId]} submissions by ${firstName} ${lastName}`,
        ),
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error updating quiz submissions: ${error.message}`),
      );
    }
  }

  // ──────────────────────────────────────────────
  // Public methods
  // ──────────────────────────────────────────────

  async fetchAssessments(query: GetStudentAssessmentsQueryDto, user: any) {
    const {
      page = 1,
      limit = 10,
      search,
      assessmentType,
      status,
      subject_id,
    } = query;

    this.logger.log(
      colors.cyan(`Fetching assessments for student: ${user.email}`),
    );

    try {
      const ctx = await this.resolveStudentContext(user);
      if (this.isApiResponse(ctx)) return ctx;

      const { student, currentSession, studentClass, subjectIds } = ctx;

      // Auto-close assessments whose end_date has passed
      const now = new Date();
      const expiredResult = await this.prisma.assessment.updateMany({
        where: {
          academic_session_id: currentSession.id,
          subject_id: { in: subjectIds },
          is_published: true,
          status: { in: ['PUBLISHED', 'ACTIVE'] },
          end_date: { lt: now },
        },
        data: { status: 'CLOSED' },
      });
      if (expiredResult.count > 0) {
        this.logger.log(
          colors.yellow(
            `Auto-closed ${expiredResult.count} expired assessment(s)`,
          ),
        );
      }

      this.logger.log(colors.green(`✅ Student found: ${user.email}`));
      this.logger.log(colors.green(`✅ Student class: ${studentClass.name}`));
      this.logger.log(
        colors.green(`✅ Subjects in class: ${subjectIds.length}`),
      );

      // Build where clause
      const where: any = {
        academic_session_id: currentSession.id,
        subject_id: subject_id ? subject_id : { in: subjectIds },
        is_published: true,
        status: { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] },
      };

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (assessmentType && assessmentType !== 'all') {
        where.assessment_type = assessmentType;
      }

      if (status && status !== 'all') {
        where.status = status;
      }

      const skip = (page - 1) * limit;

      const totalAssessments = await this.prisma.assessment.count({ where });

      const assessments = await this.prisma.assessment.findMany({
        where,
        include: {
          subject: {
            select: { id: true, name: true, code: true, color: true },
          },
          createdBy: {
            select: { id: true, first_name: true, last_name: true },
          },
          questions: {
            select: {
              id: true,
              question_type: true,
              points: true,
              options: { select: { id: true, is_correct: true } },
            },
          },
          attempts: {
            where: { student_id: user.sub },
            select: {
              id: true,
              attempt_number: true,
              status: true,
              total_score: true,
              percentage: true,
              passed: true,
              submitted_at: true,
              max_score: true,
            },
            orderBy: { submitted_at: 'desc' },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      });

      // Auto-close if result is released but status is not CLOSED
      const toClose = assessments.filter(
        (a) => a.is_result_released === true && a.status !== 'CLOSED',
      );
      if (toClose.length > 0) {
        await this.prisma.assessment.updateMany({
          where: { id: { in: toClose.map((a) => a.id) } },
          data: { status: 'CLOSED' },
        });
      }

      const formattedAssessments = assessments.map((assessment) => {
        const studentAttempts = assessment.attempts || [];
        const attemptCount = studentAttempts.length;
        const hasReachedMaxAttempts = attemptCount >= assessment.max_attempts;
        const latestAttempt = studentAttempts[0];
        const canViewGrading = assessment.student_can_view_grading ?? false;

        const highestScore =
          studentAttempts.length > 0
            ? Math.max(
                ...studentAttempts.map((attempt) => attempt.total_score || 0),
              )
            : 0;
        const highestPercentage =
          studentAttempts.length > 0
            ? Math.max(
                ...studentAttempts.map((attempt) => attempt.percentage || 0),
              )
            : 0;
        const overallAchievableMark = assessment.total_points;

        const displayStatus = assessment.is_result_released
          ? 'CLOSED'
          : assessment.status;

        return {
          id: assessment.id,
          title: assessment.title,
          description: assessment.description,
          assessment_type: assessment.assessment_type,
          status: displayStatus,
          duration: assessment.duration,
          total_points: assessment.total_points,
          can_edit_assessment: assessment.can_edit_assessment,
          is_result_released: assessment.is_result_released,
          max_attempts: assessment.max_attempts,
          passing_score: canViewGrading ? assessment.passing_score : null,
          questions_count: assessment.questions.length,
          subject: {
            id: assessment.subject.id,
            name: assessment.subject.name,
            code: assessment.subject.code,
            color: assessment.subject.color,
          },
          teacher: {
            id: assessment.createdBy.id,
            name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`,
          },
          due_date: assessment.end_date
            ? assessment.end_date.toISOString()
            : null,
          created_at: assessment.createdAt.toISOString(),
          is_published: assessment.is_published,
          shuffle_questions: assessment.shuffle_questions ?? false,
          shuffle_options: assessment.shuffle_options ?? false,
          submissions: assessment.submissions || {
            total_submissions: 0,
            recent_submissions: [],
            student_counts: {},
          },
          student_attempts: {
            total_attempts: attemptCount,
            remaining_attempts: Math.max(
              0,
              assessment.max_attempts - attemptCount,
            ),
            has_reached_max: hasReachedMaxAttempts,
            latest_attempt: latestAttempt
              ? {
                  id: latestAttempt.id,
                  attempt_number: latestAttempt.attempt_number,
                  status: latestAttempt.status,
                  ...(canViewGrading
                    ? {
                        total_score: latestAttempt.total_score,
                        percentage: latestAttempt.percentage,
                        passed: latestAttempt.passed,
                      }
                    : {
                        total_score: null,
                        percentage: null,
                        passed: null,
                      }),
                  submitted_at: latestAttempt.submitted_at?.toISOString(),
                }
              : null,
          },
          student_can_view_grading: canViewGrading,
          performance_summary: canViewGrading
            ? {
                highest_score: highestScore,
                highest_percentage: highestPercentage,
                overall_achievable_mark: overallAchievableMark,
                best_attempt:
                  studentAttempts.length > 0
                    ? studentAttempts.find(
                        (attempt) => attempt.total_score === highestScore,
                      ) || null
                    : null,
              }
            : null,
          _count: { questions: assessment.questions.length },
        };
      });

      // Group assessments by assessment_type and status
      const groupedAssessments = formattedAssessments.reduce(
        (groups, assessment) => {
          const key = `${assessment.assessment_type}_${assessment.status}`;
          if (!groups[key]) {
            groups[key] = {
              assessment_type: assessment.assessment_type,
              status: assessment.status,
              count: 0,
              assessments: [],
            };
          }
          groups[key].count++;
          groups[key].assessments.push(assessment);
          return groups;
        },
        {} as any,
      );

      const groupedArray = Object.values(groupedAssessments);

      const totalPages = Math.ceil(totalAssessments / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      // Subject statistics
      const subjectsWithStats = await Promise.all(
        studentClass.subjects.map(async (subject) => {
          const fullSubject = await this.prisma.subject.findUnique({
            where: { id: subject.id },
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              description: true,
            },
          });

          const totalSubjectAssessments = await this.prisma.assessment.count({
            where: {
              subject_id: subject.id,
              academic_session_id: currentSession.id,
              is_published: true,
              status: { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] },
            },
          });

          const subjectAssessments = await this.prisma.assessment.findMany({
            where: {
              subject_id: subject.id,
              academic_session_id: currentSession.id,
              is_published: true,
              status: { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] },
            },
            select: { id: true },
          });

          const assessmentIds = subjectAssessments.map((a) => a.id);

          const attemptedAssessments =
            await this.prisma.assessmentAttempt.groupBy({
              by: ['assessment_id'],
              where: {
                student_id: user.sub,
                assessment_id: { in: assessmentIds },
              },
              _count: { assessment_id: true },
            });

          const totalAttempted = attemptedAssessments.length;
          const totalNotAttempted = totalSubjectAssessments - totalAttempted;

          const completedCount = await this.prisma.assessmentAttempt.groupBy({
            by: ['assessment_id'],
            where: {
              student_id: user.sub,
              assessment_id: { in: assessmentIds },
              status: 'SUBMITTED',
            },
            _count: { assessment_id: true },
          });

          return {
            id: fullSubject?.id,
            name: fullSubject?.name,
            code: fullSubject?.code,
            color: fullSubject?.color,
            description: fullSubject?.description,
            assessment_stats: {
              total_assessments: totalSubjectAssessments,
              attempted: totalAttempted,
              completed: completedCount.length,
              not_attempted: totalNotAttempted,
            },
          };
        }),
      );

      const responseData = {
        pagination: {
          page,
          limit,
          total: totalAssessments,
          totalPages,
          hasNext,
          hasPrev,
        },
        filters: {
          search: search || '',
          assessment_type: assessmentType || 'all',
          status: status || 'all',
          subject_id: subject_id || 'all',
        },
        general_info: {
          current_session: {
            academic_year: currentSession.academic_year,
            term: currentSession.term,
          },
        },
        subjects: subjectsWithStats,
        assessments: formattedAssessments,
        grouped_assessments: groupedArray,
      };

      this.logger.log(
        colors.green(
          `✅ Successfully retrieved ${formattedAssessments.length} assessments for student`,
        ),
      );
      this.logger.log(
        colors.green(`✅ Grouped into ${groupedArray.length} groups`),
      );
      this.logger.log(
        colors.green(
          `✅ Subject stats generated for ${subjectsWithStats.length} subjects`,
        ),
      );
      if (subject_id) {
        this.logger.log(
          colors.yellow(`🔍 Filtered by subject: ${subject_id}`),
        );
      }

      return new ApiResponse(
        true,
        'Assessments fetched successfully',
        responseData,
      );
    } catch (error) {
      this.logger.error(
        colors.red(
          `❌ Error fetching assessments for student: ${error.message}`,
        ),
      );
      return new ApiResponse(false, 'Failed to fetch assessments', null);
    }
  }

  async getAssessmentDetails(assessmentId: string, user: any) {
    this.logger.log(
      colors.cyan(
        `Fetching assessment details for student: ${user.email}, assessment: ${assessmentId}`,
      ),
    );

    try {
      const ctx = await this.resolveStudentContext(user);
      if (this.isApiResponse(ctx)) return ctx;

      const { student, currentSession, subjectIds } = ctx;

      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          subject_id: { in: subjectIds },
          is_published: true,
          status: { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] },
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true, color: true },
          },
          createdBy: {
            select: { id: true, first_name: true, last_name: true },
          },
          questions: {
            select: { id: true, question_type: true, points: true },
          },
          attempts: {
            where: { student_id: user.sub },
            select: {
              id: true,
              attempt_number: true,
              status: true,
              total_score: true,
              percentage: true,
              passed: true,
              submitted_at: true,
              max_score: true,
            },
            orderBy: { submitted_at: 'desc' },
          },
        },
      });

      if (!assessment) {
        this.logger.error(
          colors.red(
            `❌ Assessment not found or access denied: ${assessmentId}`,
          ),
        );
        return new ApiResponse(
          false,
          'Assessment not found or access denied',
          null,
        );
      }

      const studentAttempts = assessment.attempts || [];
      const attemptCount = studentAttempts.length;
      const hasReachedMaxAttempts = attemptCount >= assessment.max_attempts;
      const latestAttempt = studentAttempts[0];
      const canViewGrading = assessment.student_can_view_grading ?? false;

      const highestScore =
        studentAttempts.length > 0
          ? Math.max(...studentAttempts.map((a) => a.total_score || 0))
          : 0;
      const highestPercentage =
        studentAttempts.length > 0
          ? Math.max(...studentAttempts.map((a) => a.percentage || 0))
          : 0;

      const displayStatus = assessment.is_result_released
        ? 'CLOSED'
        : assessment.status;

      const responseData = {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        assessment_type: assessment.assessment_type,
        status: displayStatus,
        duration: assessment.duration,
        total_points: assessment.total_points,
        max_attempts: assessment.max_attempts,
        passing_score: canViewGrading ? assessment.passing_score : null,
        instructions: (assessment as any).instructions ?? null,
        can_edit_assessment: assessment.can_edit_assessment,
        is_result_released: assessment.is_result_released,
        is_published: assessment.is_published,
        shuffle_questions: assessment.shuffle_questions ?? false,
        shuffle_options: assessment.shuffle_options ?? false,
        questions_count: assessment.questions.length,
        subject: {
          id: assessment.subject.id,
          name: assessment.subject.name,
          code: assessment.subject.code,
          color: assessment.subject.color,
        },
        teacher: {
          id: assessment.createdBy.id,
          name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`,
        },
        start_date: assessment.start_date
          ? assessment.start_date.toISOString()
          : null,
        end_date: assessment.end_date
          ? assessment.end_date.toISOString()
          : null,
        created_at: assessment.createdAt.toISOString(),
        student_attempts: {
          total_attempts: attemptCount,
          remaining_attempts: Math.max(
            0,
            assessment.max_attempts - attemptCount,
          ),
          has_reached_max: hasReachedMaxAttempts,
          latest_attempt: latestAttempt
            ? {
                id: latestAttempt.id,
                attempt_number: latestAttempt.attempt_number,
                status: latestAttempt.status,
                ...(canViewGrading
                  ? {
                      total_score: latestAttempt.total_score,
                      percentage: latestAttempt.percentage,
                      passed: latestAttempt.passed,
                    }
                  : {
                      total_score: null,
                      percentage: null,
                      passed: null,
                    }),
                submitted_at: latestAttempt.submitted_at?.toISOString(),
              }
            : null,
        },
        student_can_view_grading: canViewGrading,
        performance_summary: canViewGrading
          ? {
              highest_score: highestScore,
              highest_percentage: highestPercentage,
              overall_achievable_mark: assessment.total_points,
              best_attempt:
                studentAttempts.length > 0
                  ? studentAttempts.find(
                      (a) => a.total_score === highestScore,
                    ) || null
                  : null,
            }
          : null,
      };

      this.logger.log(
        colors.green(
          `✅ Successfully retrieved assessment details: ${assessment.title}`,
        ),
      );

      return new ApiResponse(
        true,
        'Assessment details retrieved successfully',
        responseData,
      );
    } catch (error) {
      this.logger.error(
        colors.red(
          `❌ Error fetching assessment details: ${error.message}`,
        ),
      );
      return new ApiResponse(
        false,
        'Failed to fetch assessment details',
        null,
      );
    }
  }

  async getAssessmentQuestions(assessmentId: string, user: any) {
    this.logger.log(
      colors.cyan(
        `Fetching assessment questions for student: ${user.email}, assessment: ${assessmentId}`,
      ),
    );

    try {
      const ctx = await this.resolveStudentContext(user);
      if (this.isApiResponse(ctx)) return ctx;

      const { student, currentSession, subjectIds } = ctx;

      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          subject_id: { in: subjectIds },
          status: { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] },
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true, color: true },
          },
          createdBy: {
            select: { id: true, first_name: true, last_name: true },
          },
          questions: {
            include: {
              options: {
                select: {
                  id: true,
                  option_text: true,
                  is_correct: true,
                  order: true,
                },
                orderBy: { order: 'asc' },
              },
              correct_answers: {
                select: { id: true, option_ids: true },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!assessment) {
        this.logger.error(
          colors.red(
            `❌ Assessment not found or access denied: ${assessmentId}`,
          ),
        );
        return new ApiResponse(
          false,
          'Assessment not found or access denied',
          null,
        );
      }

      // Check if assessment has started
      const now = new Date();
      if (assessment.start_date && assessment.start_date > now) {
        this.logger.error(
          colors.red(`❌ Assessment has not started yet: ${assessmentId}`),
        );
        return new ApiResponse(false, 'Assessment has not started yet', null);
      }

      // If end_date has passed, mark as CLOSED
      if (assessment.end_date && new Date(assessment.end_date) < now) {
        this.logger.log(
          colors.yellow(
            `Assessment ${assessmentId} has expired (end_date passed), updating status to CLOSED`,
          ),
        );
        await this.prisma.assessment
          .update({
            where: { id: assessmentId },
            data: { status: 'CLOSED' },
          })
          .catch(() => {});
        return new ApiResponse(false, 'Assessment has closed', {
          assessment_closed: true,
          end_date: assessment.end_date?.toISOString() ?? null,
        });
      }

      if (assessment.status && assessment.status === 'CLOSED') {
        this.logger.error(
          colors.red(
            `❌ Assessment status: ${assessment.status}, Assessment has closed`,
          ),
        );
        return new ApiResponse(false, 'Assessment has closed', {
          assessment_closed: true,
        });
      }

      // Check student attempt count
      const attemptCount = await this.prisma.assessmentAttempt.count({
        where: {
          assessment_id: assessmentId,
          student_id: student.id,
        },
      });

      if (attemptCount >= assessment.max_attempts) {
        return new ApiResponse(
          false,
          'Maximum attempts reached for this assessment',
          null,
        );
      }

      const formattedAssessment = {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        assessment_type: assessment.assessment_type,
        status: assessment.status,
        duration: assessment.duration,
        total_points: assessment.total_points,
        max_attempts: assessment.max_attempts,
        passing_score: assessment.passing_score,
        instructions: (assessment as any).instructions,
        subject: {
          id: assessment.subject.id,
          name: assessment.subject.name,
          code: assessment.subject.code,
          color: assessment.subject.color,
        },
        teacher: {
          id: assessment.createdBy.id,
          name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`,
        },
        start_date: assessment.start_date
          ? assessment.start_date.toISOString()
          : null,
        end_date: assessment.end_date
          ? assessment.end_date.toISOString()
          : null,
        created_at: assessment.createdAt.toISOString(),
        is_published: assessment.is_published,
        shuffle_questions: assessment.shuffle_questions ?? false,
        shuffle_options: assessment.shuffle_options ?? false,
        student_attempts: attemptCount,
        remaining_attempts: assessment.max_attempts - attemptCount,
      };

      const formattedQuestions = assessment.questions.map((question) => ({
        id: question.id,
        question_text: question.question_text,
        question_image: question.image_url,
        question_type: question.question_type,
        points: question.points,
        order: question.order,
        explanation: question.explanation,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.option_text,
          is_correct: option.is_correct,
          order: option.order,
        })),
        correct_answers: question.correct_answers.map((answer) => ({
          id: answer.id,
          option_ids: answer.option_ids,
        })),
      }));

      const responseData = {
        assessment: formattedAssessment,
        questions: formattedQuestions,
        total_questions: formattedQuestions.length,
        total_points: assessment.total_points,
        estimated_duration: assessment.duration,
      };

      this.logger.log(
        colors.green(
          `✅ Successfully retrieved assessment questions: ${formattedQuestions.length} questions`,
        ),
      );

      return new ApiResponse(
        true,
        'Assessment questions retrieved successfully',
        responseData,
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error fetching assessment questions: ${error.message}`),
      );
      return new ApiResponse(
        false,
        'Failed to fetch assessment questions',
        null,
      );
    }
  }

  async submitAssessment(
    assessmentId: string,
    submissionData: SubmitAssessmentDto,
    user: any,
  ) {
    this.logger.log(
      colors.cyan(
        `Submitting assessment for student: ${user.email}, assessment: ${assessmentId}`,
      ),
    );

    try {
      const ctx = await this.resolveStudentContext(user);
      if (this.isApiResponse(ctx)) return ctx;

      const { student, currentSession } = ctx;

      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          is_published: true,
          status: { in: ['PUBLISHED', 'ACTIVE'] },
        },
        include: {
          questions: {
            include: {
              correct_answers: true,
              options: { select: { id: true, is_correct: true } },
            },
          },
        },
      });

      if (!assessment) {
        this.logger.error(
          colors.red(
            `❌ Assessment not found or access denied: ${assessmentId}`,
          ),
        );
        return new ApiResponse(
          false,
          'Assessment not found or access denied',
          null,
        );
      }

      const attemptCount = await this.prisma.assessmentAttempt.count({
        where: {
          assessment_id: assessmentId,
          student_id: user.sub,
        },
      });

      if (attemptCount >= assessment.max_attempts) {
        this.logger.error(
          colors.red(
            `❌ Maximum attempts reached for this assessment: ${assessmentId}`,
          ),
        );
        return new ApiResponse(
          false,
          'Maximum attempts reached for this assessment',
          null,
        );
      }

      const {
        answers,
        submission_time,
        time_taken,
        total_questions,
        questions_answered,
        questions_skipped,
        total_points_possible,
        total_points_earned,
        submission_status,
        device_info,
      } = submissionData;

      this.logger.log(colors.blue(`📝 Submission data received:`));
      this.logger.log(colors.blue(`   - Assessment ID: ${assessmentId}`));
      this.logger.log(colors.blue(`   - Student ID: ${user.sub}`));
      this.logger.log(colors.blue(`   - Total answers: ${answers.length}`));
      this.logger.log(
        colors.blue(`   - Answers: ${JSON.stringify(answers, null, 2)}`),
      );

      // Normalize answers
      const normalizedAnswers = (answers || []).map((a: any) => {
        const normalized = { ...a };
        if (normalized.selected_options == null && normalized.answer != null) {
          normalized.selected_options = Array.isArray(normalized.answer)
            ? normalized.answer
            : [normalized.answer];
        }
        return normalized;
      });

      let totalScore = 0;
      let totalPoints = 0;
      const gradedAnswers: any[] = [];
      const studentAnswersToCreate: any[] = [];

      for (const answer of normalizedAnswers) {
        const question = assessment.questions.find(
          (q) => q.id === answer.question_id,
        );
        if (!question) {
          this.logger.warn(
            colors.yellow(`⚠️ Question not found: ${answer.question_id}`),
          );
          continue;
        }

        this.logger.log(
          colors.blue(
            `🔍 Processing answer for question ${answer.question_id}:`,
          ),
        );
        this.logger.log(
          colors.blue(
            `   - Question type: ${answer.question_type ?? question.question_type}`,
          ),
        );
        this.logger.log(
          colors.blue(`   - Student answer: ${JSON.stringify(answer)}`),
        );
        this.logger.log(
          colors.blue(`   - Question points: ${question.points}`),
        );

        let isCorrect = this.checkAnswerByType(answer, question);

        // Fallback for single choice
        const selectedForFallback =
          answer.selected_options ??
          (answer.answer != null ? [answer.answer] : []);
        if (
          !isCorrect &&
          question.question_type === 'MULTIPLE_CHOICE_SINGLE' &&
          selectedForFallback.length > 0
        ) {
          const selectedOptionId = selectedForFallback[0];
          const selectedOption = question.options.find(
            (opt) => opt.id === selectedOptionId,
          );
          isCorrect = selectedOption?.is_correct || false;
        }

        const pointsEarned = isCorrect ? question.points : 0;

        this.logger.log(colors.blue(`   - Is correct: ${isCorrect}`));
        this.logger.log(colors.blue(`   - Points earned: ${pointsEarned}`));

        studentAnswersToCreate.push({
          question_id: answer.question_id,
          student_id: user.sub,
          text_answer: answer.text_answer || null,
          numeric_answer:
            answer.question_type === 'NUMERIC' && answer.text_answer
              ? parseFloat(answer.text_answer)
              : null,
          date_answer:
            answer.question_type === 'DATE' && answer.text_answer
              ? new Date(answer.text_answer)
              : null,
          selected_options: answer.selected_options || [],
          max_points: question.points,
          is_correct: isCorrect,
          points_earned: pointsEarned,
        });

        gradedAnswers.push({
          question_id: answer.question_id,
          question_type: answer.question_type,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          max_points: question.points,
          selected_options: answer.selected_options,
          text_answer: answer.text_answer,
        });

        totalScore += pointsEarned;
        totalPoints += question.points;
      }

      const percentage =
        totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
      const passed = percentage >= assessment.passing_score;
      const grade = this.calculateGrade(percentage);
      const timeSpent = time_taken || 0;

      const result = await this.prisma.$transaction(async (tx) => {
        const attempt = await tx.assessmentAttempt.create({
          data: {
            assessment_id: assessmentId,
            student_id: user.sub,
            school_id: student.school_id,
            academic_session_id: currentSession.id,
            attempt_number: attemptCount + 1,
            status: 'IN_PROGRESS',
            started_at: new Date(),
            max_score: assessment.total_points,
          },
        });

        const studentAnswers = await Promise.all(
          studentAnswersToCreate.map((answerData) =>
            tx.assessmentResponse.create({
              data: { ...answerData, attempt_id: attempt.id },
            }),
          ),
        );

        this.logger.log(
          colors.green(
            `✅ All student answers saved: ${studentAnswers.length} answers`,
          ),
        );

        const updatedAttempt = await tx.assessmentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'GRADED',
            submitted_at: submission_time
              ? new Date(submission_time)
              : new Date(),
            time_spent: timeSpent,
            total_score: totalScore,
            percentage: percentage,
            passed: passed,
            is_graded: true,
            graded_at: new Date(),
          },
        });

        await this.updateQuizSubmissionsInTransaction(
          tx,
          assessmentId,
          user.sub,
          user.email,
          user.first_name,
          user.last_name,
        );

        return { attempt: updatedAttempt, studentAnswers };
      });

      const responseData = {
        attempt_id: result.attempt.id,
        assessment_id: assessmentId,
        student_id: user.sub,
        total_score: totalScore,
        total_points: totalPoints,
        percentage_score: percentage,
        passed: passed,
        grade: grade,
        answers: gradedAnswers,
        submission_metadata: {
          total_questions,
          questions_answered,
          questions_skipped,
          total_points_possible,
          submission_status,
          device_info,
        },
        submitted_at: submission_time || new Date().toISOString(),
        time_spent: timeSpent,
      };

      this.logger.log(
        colors.green(
          `✅ Assessment submitted successfully: ${totalScore}/${totalPoints} (${percentage.toFixed(1)}%)`,
        ),
      );

      return new ApiResponse(
        true,
        'Assessment submitted successfully',
        responseData,
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error submitting assessment: ${error.message}`),
      );
      return new ApiResponse(false, 'Failed to submit assessment', null);
    }
  }

  async getAssessmentWithAnswers(assessmentId: string, user: any) {
    this.logger.log(
      colors.cyan(
        `Fetching assessment with answers for student: ${user.email}, assessment: ${assessmentId}`,
      ),
    );

    try {
      const ctx = await this.resolveStudentContext(user);
      if (this.isApiResponse(ctx)) return ctx;

      const { student, currentSession, subjectIds } = ctx;

      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          subject_id: { in: subjectIds },
          is_published: true,
          status: { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] },
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true, color: true },
          },
          createdBy: {
            select: { id: true, first_name: true, last_name: true },
          },
          questions: {
            include: {
              options: {
                select: {
                  id: true,
                  option_text: true,
                  is_correct: true,
                  order: true,
                },
                orderBy: { order: 'asc' },
              },
              correct_answers: {
                select: { id: true, option_ids: true },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!assessment) {
        this.logger.error(
          colors.red(
            `❌ Assessment not found or access denied: ${assessmentId}`,
          ),
        );
        return new ApiResponse(
          false,
          'Assessment not found or access denied',
          null,
        );
      }

      if (assessment.student_can_view_grading === false) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Assessment grading is not available for viewing: ${assessmentId}`,
          ),
        );
        return new ApiResponse(
          false,
          'Assessment grading is not available for viewing',
          null,
        );
      }

      const attempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          assessment_id: assessmentId,
          student_id: user.sub,
        },
        include: {
          responses: {
            include: {
              selectedOptions: {
                select: {
                  id: true,
                  option_text: true,
                  is_correct: true,
                  order: true,
                },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
        orderBy: { submitted_at: 'desc' },
      });

      this.logger.log(
        colors.blue(
          `📊 Found ${attempts.length} attempts for assessment ${assessmentId}`,
        ),
      );
      attempts.forEach((attempt, index) => {
        this.logger.log(
          colors.blue(
            `   Attempt ${index + 1}: ${attempt.id} - ${attempt.status} - ${attempt.responses.length} answers`,
          ),
        );
      });

      const formattedAssessment = {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        assessment_type: assessment.assessment_type,
        status: assessment.status,
        duration: assessment.duration,
        total_points: assessment.total_points,
        max_attempts: assessment.max_attempts,
        passing_score: assessment.passing_score,
        instructions: (assessment as any).instructions,
        subject: {
          id: assessment.subject.id,
          name: assessment.subject.name,
          code: assessment.subject.code,
          color: assessment.subject.color,
        },
        teacher: {
          id: assessment.createdBy.id,
          name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`,
        },
        start_date: assessment.start_date
          ? assessment.start_date.toISOString()
          : null,
        end_date: assessment.end_date
          ? assessment.end_date.toISOString()
          : null,
        created_at: assessment.createdAt.toISOString(),
        is_published: assessment.is_published,
        total_attempts: attempts.length,
        remaining_attempts: Math.max(
          0,
          assessment.max_attempts - attempts.length,
        ),
      };

      const formattedSubmissions = attempts.map((attempt, attemptIndex) => {
        this.logger.log(
          colors.blue(
            `📝 Processing submission ${attemptIndex + 1}: ${attempt.id}`,
          ),
        );

        const formattedQuestions = assessment.questions.map((question) => {
          const userAnswer = attempt.responses.find(
            (response) => response.question_id === question.id,
          );

          this.logger.log(
            colors.blue(
              `🔍 Processing question ${question.id} for attempt ${attemptIndex + 1}:`,
            ),
          );
          this.logger.log(
            colors.blue(`   - Question text: ${question.question_text}`),
          );
          this.logger.log(
            colors.blue(`   - User answer found: ${!!userAnswer}`),
          );
          if (userAnswer) {
            this.logger.log(
              colors.blue(
                `   - User answer data: ${JSON.stringify({
                  selected_options: userAnswer.selected_options,
                  text_answer: userAnswer.text_answer,
                  numeric_answer: userAnswer.numeric_answer,
                  date_answer: userAnswer.date_answer,
                  is_correct: userAnswer.is_correct,
                  points_earned: userAnswer.points_earned,
                })}`,
              ),
            );
          }

          return {
            id: question.id,
            question_text: question.question_text,
            question_image: question.image_url,
            question_type: question.question_type,
            points: question.points,
            order: question.order,
            explanation: question.explanation,
            options: question.options.map((option) => ({
              id: option.id,
              text: option.option_text,
              is_correct: option.is_correct,
              order: option.order,
              is_selected:
                userAnswer?.selected_options.includes(option.id) || false,
            })),
            user_answer: userAnswer
              ? {
                  text_answer: userAnswer.text_answer,
                  numeric_answer: userAnswer.numeric_answer,
                  date_answer: userAnswer.date_answer?.toISOString(),
                  selected_options: userAnswer.selected_options
                    .map((optionId) => {
                      const option = question.options.find(
                        (opt) => opt.id === optionId,
                      );
                      return option
                        ? {
                            id: option.id,
                            text: option.option_text,
                            is_correct: option.is_correct,
                          }
                        : null;
                    })
                    .filter(Boolean),
                  is_correct: userAnswer.is_correct,
                  points_earned: userAnswer.points_earned,
                  answered_at: userAnswer.createdAt,
                }
              : null,
            correct_answers: question.correct_answers.map((answer) => ({
              id: answer.id,
              option_ids: answer.option_ids,
            })),
          };
        });

        return {
          submission_id: attempt.id,
          attempt_number: attempt.attempt_number,
          status: attempt.status,
          total_score: attempt.total_score,
          percentage: attempt.percentage,
          passed: attempt.passed,
          grade_letter: attempt.grade_letter,
          time_spent: attempt.time_spent,
          started_at: attempt.started_at?.toISOString(),
          submitted_at: attempt.submitted_at?.toISOString(),
          graded_at: attempt.graded_at?.toISOString(),
          is_graded: attempt.is_graded,
          overall_feedback: attempt.overall_feedback,
          questions: formattedQuestions,
          total_questions: formattedQuestions.length,
          questions_answered: formattedQuestions.filter((q) => q.user_answer)
            .length,
          questions_correct: formattedQuestions.filter(
            (q) => q.user_answer?.is_correct,
          ).length,
        };
      });

      const responseData = {
        assessment: formattedAssessment,
        submissions: formattedSubmissions,
        total_questions: assessment.questions.length,
        total_points: assessment.total_points,
        estimated_duration: assessment.duration,
        submission_summary: {
          total_submissions: formattedSubmissions.length,
          latest_submission: formattedSubmissions[0] || null,
          best_score: Math.max(
            ...formattedSubmissions.map((s) => s.total_score || 0),
          ),
          best_percentage: Math.max(
            ...formattedSubmissions.map((s) => s.percentage || 0),
          ),
          passed_attempts: formattedSubmissions.filter((s) => s.passed).length,
        },
      };

      this.logger.log(
        colors.green(
          `✅ Successfully retrieved assessment with answers: ${assessment.questions.length} questions, ${formattedSubmissions.length} submissions`,
        ),
      );

      return new ApiResponse(
        true,
        'Assessment with answers retrieved successfully',
        responseData,
      );
    } catch (error) {
      this.logger.error(
        colors.red(
          `❌ Error fetching assessment with answers: ${error.message}`,
        ),
      );
      return new ApiResponse(
        false,
        'Failed to fetch assessment with answers',
        null,
      );
    }
  }
}
