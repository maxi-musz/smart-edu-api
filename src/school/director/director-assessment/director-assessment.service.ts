import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GetAssessmentsQueryDto } from './dto/get-assessments-query.dto';
import { DuplicateAssessmentDto } from './dto/duplicate-assessment.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { StorageService } from '../../../shared/services/providers/storage.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import * as colors from 'colors';
import {
  AssessmentType,
  DifficultyLevel,
  QuestionType,
} from '@prisma/client';

type StatusAnalytics = {
  all: number;
  draft: number;
  published: number;
  active: number;
  closed: number;
  archived: number;
};

@Injectable()
export class DirectorAssessmentService {
  private readonly logger = new Logger(DirectorAssessmentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Log full error server-side; never forward Prisma paths, SQL, or DB hostnames to the client.
   */
  private clientSafeFetchErrorMessage(error: unknown, logLabel: string): string {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    this.logger.error(`${logLabel}: ${msg}`, stack);

    const lower = msg.toLowerCase();
    if (
      msg.includes("Can't reach database") ||
      msg.includes('P1001') ||
      lower.includes('econnrefused') ||
      lower.includes('etimedout') ||
      lower.includes('enotfound') ||
      lower.includes('server has closed the connection')
    ) {
      return 'We could not reach the database. Check your internet connection, confirm the database is running, and try again.';
    }

    return 'Something went wrong while loading this data. Please try again.';
  }

  // ================================================================
  // HELPER: verify director role and return user record
  // ================================================================

  private async verifyDirector(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, school_id: true, role: true },
    });

    if (!user || user.role !== 'school_director') {
      throw new ForbiddenException('Access denied. Director role required.');
    }

    return user;
  }

  // ================================================================
  // DASHBOARD (from existing director assessments service)
  // ================================================================

  async getAssessmentDashboard(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      assessmentType?: string;
      subjectId?: string;
      classId?: string;
    } = {},
  ) {
    try {
      this.logger.log(
        colors.cyan(`Getting assessment dashboard for director: ${userId}`),
      );

      const user = await this.verifyDirector(userId);

      const {
        page = 1,
        limit = 10,
        status,
        assessmentType,
        subjectId,
        classId,
      } = filters;

      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
      const skip = (pageNum - 1) * limitNum;

      const academicSessions = await this.prisma.academicSession.findMany({
        where: {
          school_id: user.school_id,
        },
        select: {
          id: true,
          academic_year: true,
          term: true,
          start_date: true,
          end_date: true,
          status: true,
          is_current: true,
          _count: {
            select: {
              assessments: true,
            },
          },
        },
        orderBy: [{ start_year: 'desc' }, { term: 'desc' }],
      });

      const subjects = await this.prisma.subject.findMany({
        where: {
          schoolId: user.school_id,
          ...(subjectId ? { id: subjectId } : {}),
        },
        include: {
          teacherSubjects: {
            include: {
              teacher: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                  display_picture: true,
                },
              },
            },
          },
          Class: {
            select: {
              id: true,
              name: true,
            },
          },
          academicSession: {
            select: {
              id: true,
              academic_year: true,
              term: true,
              is_current: true,
            },
          },
          _count: {
            select: {
              assessments: true,
              topics: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: user.school_id,
          is_current: true,
        },
      });

      const enrichedSubjects = await Promise.all(
        subjects.map(async (subject) => {
          const assessmentCounts = await this.prisma.assessment.groupBy({
            by: ['assessment_type'],
            where: {
              subject_id: subject.id,
              ...(currentSession
                ? { academic_session_id: currentSession.id }
                : {}),
            },
            _count: {
              assessment_type: true,
            },
          });

          const countsByType = assessmentCounts.reduce(
            (acc, item) => {
              acc[item.assessment_type] = item._count.assessment_type;
              return acc;
            },
            {} as Record<string, number>,
          );

          const studentCount = await this.prisma.student.count({
            where: {
              school_id: user.school_id,
              current_class_id: subject.classId || undefined,
              status: 'active',
              ...(currentSession
                ? { academic_session_id: currentSession.id }
                : {}),
            },
          });

          return {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            color: subject.color,
            description: subject.description,
            class: subject.Class
              ? {
                  id: subject.Class.id,
                  name: subject.Class.name,
                }
              : null,
            academic_session: subject.academicSession,
            teachers_in_charge: subject.teacherSubjects.map((ts) => ({
              id: ts.teacher.id,
              first_name: ts.teacher.first_name,
              last_name: ts.teacher.last_name,
              email: ts.teacher.email,
              display_picture: ts.teacher.display_picture,
            })),
            student_count: studentCount,
            total_assessments: subject._count.assessments,
            total_topics: subject._count.topics,
            assessment_counts: {
              CBT: countsByType['CBT'] || 0,
              EXAM: countsByType['EXAM'] || 0,
              ASSIGNMENT: countsByType['ASSIGNMENT'] || 0,
              QUIZ: countsByType['QUIZ'] || 0,
              TEST: countsByType['TEST'] || 0,
              FORMATIVE: countsByType['FORMATIVE'] || 0,
              SUMMATIVE: countsByType['SUMMATIVE'] || 0,
              OTHER: countsByType['OTHER'] || 0,
            },
            status:
              currentSession &&
              subject.academicSession?.id === currentSession.id
                ? 'active'
                : 'inactive',
          };
        }),
      );

      const classes = await this.prisma.class.findMany({
        where: {
          schoolId: user.school_id,
          ...(classId ? { id: classId } : {}),
        },
        include: {
          classTeacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true,
            },
          },
          _count: {
            select: {
              students: true,
              subjects: true,
              schedules: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      const enrichedClasses = classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        classTeacher: cls.classTeacher
          ? {
              id: cls.classTeacher.id,
              first_name: cls.classTeacher.first_name,
              last_name: cls.classTeacher.last_name,
              email: cls.classTeacher.email,
              display_picture: cls.classTeacher.display_picture,
            }
          : null,
        academic_session: currentSession
          ? {
              id: currentSession.id,
              academic_year: currentSession.academic_year,
              term: currentSession.term,
              is_current: currentSession.is_current,
            }
          : null,
        student_count: cls._count.students,
        subject_count: cls._count.subjects,
        schedule_count: cls._count.schedules,
      }));

      const assessmentWhere: any = {
        school_id: user.school_id,
        ...(currentSession ? { academic_session_id: currentSession.id } : {}),
        ...(status ? { status } : {}),
        ...(assessmentType ? { assessment_type: assessmentType } : {}),
        ...(subjectId ? { subject_id: subjectId } : {}),
      };

      if (classId) {
        const classSubjects = await this.prisma.subject.findMany({
          where: {
            classId: classId,
            schoolId: user.school_id,
          },
          select: { id: true },
        });
        assessmentWhere.subject_id = {
          in: classSubjects.map((s) => s.id),
        };
      }

      const [allAssessments, totalAssessments, assessmentTypeCounts] =
        await Promise.all([
          this.prisma.assessment.findMany({
            where: assessmentWhere,
            include: {
              subject: {
                select: { id: true, name: true, code: true },
              },
              topic: {
                select: { id: true, title: true },
              },
              createdBy: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  email: true,
                },
              },
              _count: {
                select: { questions: true, attempts: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
          }),
          this.prisma.assessment.count({ where: assessmentWhere }),
          this.prisma.assessment.groupBy({
            by: ['assessment_type'],
            where: assessmentWhere,
            _count: { assessment_type: true },
          }),
        ]);

      const groupedAssessments = allAssessments.reduce(
        (acc, assessment) => {
          const type = assessment.assessment_type;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push({
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            assessment_type: assessment.assessment_type,
            status: assessment.status,
            is_published: assessment.is_published,
            is_result_released: assessment.is_result_released,
            total_points: assessment.total_points,
            passing_score: assessment.passing_score,
            created_at: assessment.createdAt,
            updated_at: assessment.updatedAt,
            subject: assessment.subject,
            topic: assessment.topic,
            created_by: assessment.createdBy,
            question_count: assessment._count.questions,
            attempt_count: assessment._count.attempts,
          });
          return acc;
        },
        {} as Record<string, any[]>,
      );

      const counts = assessmentTypeCounts.reduce(
        (acc, item) => {
          acc[item.assessment_type] = item._count.assessment_type;
          return acc;
        },
        {} as Record<string, number>,
      );

      const totalPages = Math.ceil(totalAssessments / limitNum);

      this.logger.log(colors.green(`Dashboard data retrieved successfully`));

      return ResponseHelper.success(
        'Assessment dashboard retrieved successfully',
        {
          academic_sessions: academicSessions,
          subjects: enrichedSubjects,
          classes: enrichedClasses,
          assessments: groupedAssessments,
          assessment_counts: counts,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalAssessments,
            totalPages,
            hasNext: pageNum < totalPages,
            hasPrev: pageNum > 1,
          },
        },
      );
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      return ResponseHelper.error(
        this.clientSafeFetchErrorMessage(
          error,
          'Director assessment dashboard',
        ),
        null,
        500,
      );
    }
  }

  // ================================================================
  // LIST ALL ASSESSMENTS (teacher-style with analytics)
  // ================================================================

  async getAllAssessmentsForDirector(query: GetAssessmentsQueryDto, user: any) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sort_by = query.sort_by ?? 'createdAt';
    const sort_order = query.sort_order ?? 'desc';

    let academicSessionId = query.academic_session_id;
    if (!academicSessionId) {
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true,
          ...(query.term ? { term: query.term } : {}),
        },
      });

      if (!currentSession) {
        throw new BadRequestException('No current academic session found');
      }
      academicSessionId = currentSession.id;
    }

    const baseWhere: any = {
      school_id: schoolId,
      academic_session_id: academicSessionId,
    };

    if (query.subject_id) baseWhere.subject_id = query.subject_id;
    if (query.topic_id) baseWhere.topic_id = query.topic_id;
    if (query.status) baseWhere.status = query.status;
    if (query.assessment_type)
      baseWhere.assessment_type = query.assessment_type;
    if (query.is_published !== undefined)
      baseWhere.is_published = query.is_published;
    if (query.created_by) baseWhere.created_by = query.created_by;

    if (query.search) {
      baseWhere.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const analyticsWhere: any = { ...baseWhere };
    delete analyticsWhere.status;
    delete analyticsWhere.is_published;

    const [total, assessments, statusCounts, recentSessions] =
      await Promise.all([
        this.prisma.assessment.count({ where: baseWhere }),
        this.prisma.assessment.findMany({
          where: baseWhere,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sort_by]: sort_order },
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
        this.prisma.assessment.groupBy({
          by: ['status'],
          where: analyticsWhere,
          _count: { id: true },
        }),
        this.prisma.academicSession.findMany({
          where: { school_id: schoolId },
          orderBy: [
            { start_year: 'desc' },
            { end_year: 'desc' },
            { start_date: 'desc' },
          ],
          take: 5,
          select: {
            id: true,
            academic_year: true,
            term: true,
            start_year: true,
            end_year: true,
            start_date: true,
            end_date: true,
            is_current: true,
            status: true,
          },
        }),
      ]);

    const statusAnalytics: StatusAnalytics = {
      all: 0,
      draft: 0,
      published: 0,
      active: 0,
      closed: 0,
      archived: 0,
    };

    statusCounts.forEach((item: any) => {
      const count = item._count.id;
      statusAnalytics.all += count;
      const key = String(item.status).toLowerCase();
      if (key in statusAnalytics) {
        (statusAnalytics as any)[key] = count;
      }
    });

    const now = new Date();
    const expiredAssessmentIds = assessments
      .filter(
        (assessment: any) =>
          assessment?.end_date &&
          new Date(assessment.end_date) < now &&
          ['ACTIVE', 'PUBLISHED'].includes(assessment.status),
      )
      .map((assessment: any) => assessment.id);

    if (expiredAssessmentIds.length > 0) {
      await this.prisma.assessment.updateMany({
        where: { id: { in: expiredAssessmentIds } },
        data: { status: 'CLOSED' },
      });

      assessments.forEach((assessment: any) => {
        if (expiredAssessmentIds.includes(assessment.id)) {
          assessment.status = 'CLOSED';
        }
      });
    }

    const totalPages = Math.ceil(total / limit);

    const responseData = {
      analytics: statusAnalytics,
      sessions: recentSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      assessments,
    };

    return ResponseHelper.success(
      'Assessments fetched successfully',
      responseData,
    );
  }

  // ================================================================
  // GET ASSESSMENT BY ID (with submission summary)
  // ================================================================

  async getDirectorAssessmentById(assessmentId: string, user: any) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: schoolId,
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
        academicSession: {
          select: { id: true, academic_year: true, term: true },
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
      throw new NotFoundException('Assessment not found');
    }

    const currentSession = await this.prisma.academicSession.findFirst({
      where: {
        school_id: schoolId,
        is_current: true,
      },
    });

    if (!currentSession) {
      throw new BadRequestException('No current academic session found');
    }

    const [questions, attempts, classesWithSubject] = await Promise.all([
      this.prisma.assessmentQuestion.findMany({
        where: { assessment_id: assessment.id },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
          correct_answers: true,
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { order: 'asc' },
      }),
      this.prisma.assessmentAttempt.findMany({
        where: {
          assessment_id: assessment.id,
          school_id: schoolId,
          academic_session_id: currentSession.id,
        },
        include: {
          student: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true,
            },
          },
        },
        orderBy: { submitted_at: 'desc' },
      }),
      this.prisma.class.findMany({
        where: {
          schoolId,
          subjects: {
            some: {
              id: assessment.subject_id,
              academic_session_id: currentSession.id,
            },
          },
        },
        select: { id: true, name: true },
      }),
    ]);

    const classIds = classesWithSubject.map((cls) => cls.id);

    const allStudents =
      classIds.length > 0
        ? await this.prisma.student.findMany({
            where: {
              school_id: schoolId,
              academic_session_id: currentSession.id,
              current_class_id: { in: classIds },
              status: 'active',
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
              current_class: {
                select: { id: true, name: true },
              },
            },
            orderBy: {
              user: { last_name: 'asc' },
            },
          })
        : [];

    const attemptsByStudent = new Map<string, any[]>();
    attempts.forEach((attempt) => {
      const studentId = attempt.student?.id || 'unknown';
      if (!attemptsByStudent.has(studentId)) {
        attemptsByStudent.set(studentId, []);
      }
      attemptsByStudent.get(studentId)!.push(attempt);
    });

    const studentsWithAttempts = allStudents.map((student) => {
      const studentAttempts = attemptsByStudent.get(student.user.id) || [];

      const bestAttempt =
        studentAttempts.length > 0
          ? studentAttempts.reduce((best: any, current: any) =>
              (current.percentage || 0) > (best.percentage || 0)
                ? current
                : best,
            )
          : null;

      return {
        student: {
          id: student.id,
          user_id: student.user_id,
          first_name: student.user.first_name,
          last_name: student.user.last_name,
          email: student.user.email,
          display_picture: student.user.display_picture,
          class: student.current_class,
        },
        attempts: studentAttempts.map((a: any) => ({
          id: a.id,
          attempt_number: a.attempt_number,
          status: a.status,
          started_at: a.started_at,
          submitted_at: a.submitted_at,
          time_spent: a.time_spent,
          total_score: a.total_score,
          max_score: a.max_score,
          percentage: a.percentage,
          passed: a.passed,
          is_graded: a.is_graded,
          graded_at: a.graded_at,
          grade_letter: a.grade_letter,
        })),
        totalAttempts: studentAttempts.length,
        bestScore: bestAttempt?.percentage || null,
        passed: bestAttempt?.passed || false,
        hasAttempted: studentAttempts.length > 0,
      };
    });

    const studentsAttempted = studentsWithAttempts.filter(
      (s) => s.hasAttempted,
    ).length;
    const studentsNotAttempted = studentsWithAttempts.filter(
      (s) => !s.hasAttempted,
    ).length;

    const responseData = {
      assessment,
      questions: {
        total: questions.length,
        items: questions,
      },
      submissions: {
        summary: {
          totalStudents: allStudents.length,
          studentsAttempted,
          studentsNotAttempted,
          completionRate:
            allStudents.length > 0
              ? Math.round((studentsAttempted / allStudents.length) * 100)
              : 0,
          classes: classesWithSubject,
        },
        students: studentsWithAttempts,
      },
    };

    return ResponseHelper.success(
      'Assessment details retrieved successfully',
      responseData,
    );
  }

  // ================================================================
  // QUESTIONS PREVIEW
  // ================================================================

  async getDirectorAssessmentQuestionsForPreview(
    assessmentId: string,
    user: any,
  ) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: schoolId,
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
              select: { id: true, answer_text: true, option_ids: true },
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
      throw new NotFoundException(
        'Assessment not found or you do not have access',
      );
    }

    const questions = assessment.questions.map((q) => ({
      id: q.id,
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      order: q.order,
      image_url: q.image_url,
      audio_url: q.audio_url,
      video_url: q.video_url,
      is_required: q.is_required,
      explanation: q.explanation,
      difficulty_level: q.difficulty_level,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.option_text,
        is_correct: o.is_correct,
        order: o.order,
      })),
      correct_answers: q.correct_answers.map((ca) => ({
        id: ca.id,
        answer_text: ca.answer_text,
        option_ids: ca.option_ids,
      })),
    }));

    return ResponseHelper.success(
      'Assessment questions retrieved successfully (preview mode)',
      {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          description: assessment.description,
          instructions: assessment.instructions,
          duration: assessment.duration,
          time_limit: assessment.time_limit,
          total_points: assessment.total_points,
          max_attempts: assessment.max_attempts,
          passing_score: assessment.passing_score,
          status: assessment.status,
          is_published: assessment.is_published,
          start_date: assessment.start_date,
          end_date: assessment.end_date,
          subject: assessment.subject,
          teacher: {
            id: assessment.createdBy.id,
            name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`,
          },
          total_attempts: assessment._count.attempts,
        },
        questions,
        total_questions: questions.length,
        isPreview: true,
        assessmentContext: 'school',
      },
    );
  }

  // ================================================================
  // DUPLICATE ASSESSMENT
  // ================================================================

  async duplicateDirectorAssessmentById(
    assessmentId: string,
    duplicateDto: DuplicateAssessmentDto,
    user: any,
  ) {
    this.logger.log(colors.cyan(`[DIRECTOR] duplicating current assessment`));
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      this.logger.error(colors.red('Invalid director authentication data'));
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    const sourceAssessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: schoolId,
      },
      include: {
        questions: {
          include: {
            options: true,
            correct_answers: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!sourceAssessment) {
      this.logger.error(colors.red('Assessment not found'));
      throw new NotFoundException('Assessment not found');
    }

    const currentSession = await this.prisma.academicSession.findFirst({
      where: {
        school_id: schoolId,
        is_current: true,
      },
    });

    if (!currentSession) {
      this.logger.error(colors.red('No current academic session found'));
      throw new BadRequestException('No current academic session found');
    }

    let questions = [...sourceAssessment.questions];
    if (duplicateDto.shuffle_questions) {
      this.logger.log(colors.green('[DIRECTOR] shuffling questions'));
      questions = this.shuffleArray(questions);
    }

    const newAssessment = await this.prisma.$transaction(async (tx) => {
      this.logger.log(colors.yellow('[DIRECTOR] creating new assessment'));
      const assessment = await tx.assessment.create({
        data: {
          school_id: schoolId!,
          academic_session_id: currentSession.id,
          subject_id: sourceAssessment.subject_id,
          topic_id: sourceAssessment.topic_id,
          created_by: userId,
          title: duplicateDto.new_title,
          description:
            duplicateDto.new_description || sourceAssessment.description,
          instructions: sourceAssessment.instructions,
          assessment_type: sourceAssessment.assessment_type,
          grading_type: sourceAssessment.grading_type,
          duration: sourceAssessment.duration,
          max_attempts: sourceAssessment.max_attempts,
          passing_score: sourceAssessment.passing_score,
          total_points: sourceAssessment.total_points,
          shuffle_questions:
            duplicateDto.shuffle_questions ||
            sourceAssessment.shuffle_questions,
          shuffle_options:
            duplicateDto.shuffle_options || sourceAssessment.shuffle_options,
          show_correct_answers: sourceAssessment.show_correct_answers,
          show_feedback: sourceAssessment.show_feedback,
          allow_review: sourceAssessment.allow_review,
          time_limit: sourceAssessment.time_limit,
          auto_submit: sourceAssessment.auto_submit,
          tags: sourceAssessment.tags,
          status: 'DRAFT',
          is_published: false,
          start_date: null,
          end_date: null,
        },
      });

      this.logger.log(colors.blue('[DIRECTOR] creating questions'));
      for (let i = 0; i < questions.length; i++) {
        const sourceQuestion = questions[i];

        let options = [...sourceQuestion.options];
        if (duplicateDto.shuffle_options) {
          options = this.shuffleArray(options);
        }

        const newQuestion = await tx.assessmentQuestion.create({
          data: {
            assessment_id: assessment.id,
            question_text: sourceQuestion.question_text,
            question_type: sourceQuestion.question_type,
            order: i + 1,
            points: sourceQuestion.points,
            is_required: sourceQuestion.is_required,
            time_limit: sourceQuestion.time_limit,
            image_url: sourceQuestion.image_url,
            image_s3_key: sourceQuestion.image_s3_key,
            audio_url: sourceQuestion.audio_url,
            video_url: sourceQuestion.video_url,
            allow_multiple_attempts: sourceQuestion.allow_multiple_attempts,
            show_hint: sourceQuestion.show_hint,
            hint_text: sourceQuestion.hint_text,
            min_length: sourceQuestion.min_length,
            max_length: sourceQuestion.max_length,
            min_value: sourceQuestion.min_value,
            max_value: sourceQuestion.max_value,
            explanation: sourceQuestion.explanation,
            difficulty_level: sourceQuestion.difficulty_level,
          },
        });

        const optionIdMap = new Map<string, string>();

        const createdOptions = await Promise.all(
          options.map((sourceOption, index) =>
            tx.assessmentOption.create({
              data: {
                question_id: newQuestion.id,
                option_text: sourceOption.option_text,
                order: index + 1,
                is_correct: sourceOption.is_correct,
                image_url: sourceOption.image_url,
                image_s3_key: sourceOption.image_s3_key,
                audio_url: sourceOption.audio_url,
              },
            }),
          ),
        );

        createdOptions.forEach((createdOption, index) => {
          optionIdMap.set(options[index].id, createdOption.id);
        });

        await Promise.all(
          sourceQuestion.correct_answers.map((sourceAnswer) => {
            const newOptionIds = (sourceAnswer.option_ids || []).map(
              (oldId) => optionIdMap.get(oldId) || oldId,
            );

            return tx.assessmentCorrectAnswer.create({
              data: {
                question_id: newQuestion.id,
                answer_text: sourceAnswer.answer_text,
                answer_number: sourceAnswer.answer_number,
                answer_date: sourceAnswer.answer_date,
                option_ids: newOptionIds,
                answer_json: sourceAnswer.answer_json ?? undefined,
              },
            });
          }),
        );
      }

      return tx.assessment.findUnique({
        where: { id: assessment.id },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          topic: { select: { id: true, title: true } },
          createdBy: {
            select: { id: true, first_name: true, last_name: true },
          },
          _count: { select: { questions: true } },
        },
      });
    }, { maxWait: 10000, timeout: 120000 });

    this.logger.log(
      colors.magenta(`[DIRECTOR] Assessment duplicated successfully`),
    );

    return ResponseHelper.success('Assessment duplicated successfully', {
      assessment: newAssessment,
      source_assessment_id: assessmentId,
      shuffle_applied: {
        questions: duplicateDto.shuffle_questions || false,
        options: duplicateDto.shuffle_options || false,
      },
    });
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // ================================================================
  // UPDATE ASSESSMENT
  // ================================================================

  async updateDirectorAssessmentById(
    assessmentId: string,
    updateDto: any,
    user: any,
  ) {
    this.logger.log(
      colors.cyan(`[DIRECTOR] Updating assessment: ${assessmentId}`),
    );
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      this.logger.error(colors.red('Invalid director authentication data'));
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    const existingAssessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: schoolId,
      },
      select: {
        id: true,
        status: true,
        is_published: true,
        subject_id: true,
        topic_id: true,
        end_date: true,
      },
    });

    if (!existingAssessment) {
      this.logger.error(
        colors.red(
          'Assessment not found or you do not have access to update it',
        ),
      );
      throw new NotFoundException(
        'Assessment not found or you do not have access to update it',
      );
    }

    const publishedStatuses = ['PUBLISHED', 'ACTIVE'];
    const updateFieldsCount = Object.keys(updateDto || {}).filter(
      (k) => updateDto?.[k] !== undefined,
    ).length;
    const isStatusChangeOnly = updateDto?.status && updateFieldsCount === 1;
    const isDemotingToDraft =
      updateDto?.status === 'DRAFT' ||
      updateDto?.status === 'CLOSED' ||
      updateDto?.status === 'ARCHIVED';

    if (
      publishedStatuses.includes(existingAssessment.status) &&
      !(isStatusChangeOnly && isDemotingToDraft)
    ) {
      this.logger.warn(
        colors.yellow(
          `Cannot update published assessment: ${assessmentId} (status: ${existingAssessment.status})`,
        ),
      );
      throw new BadRequestException(
        `Cannot update assessment with status "${existingAssessment.status}". Change status to DRAFT first to make modifications.`,
      );
    }

    if (
      updateDto?.subject_id &&
      updateDto.subject_id !== existingAssessment.subject_id
    ) {
      const subject = await this.prisma.subject.findFirst({
        where: {
          id: updateDto.subject_id,
          schoolId: schoolId,
        },
      });

      if (!subject) {
        this.logger.error(colors.red('Subject not found in this school'));
        throw new NotFoundException('Subject not found in this school');
      }
    }

    if (
      updateDto?.topic_id &&
      updateDto.topic_id !== existingAssessment.topic_id
    ) {
      const effectiveSubjectId =
        updateDto.subject_id || existingAssessment.subject_id;
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: updateDto.topic_id,
          subject_id: effectiveSubjectId,
        },
      });

      if (!topic) {
        this.logger.error(
          colors.red(
            'Topic not found or does not belong to the specified subject',
          ),
        );
        throw new NotFoundException(
          'Topic not found or does not belong to the specified subject',
        );
      }
    }

    const updateData: any = {};
    const allowedFields = [
      'title',
      'description',
      'instructions',
      'subject_id',
      'topic_id',
      'duration',
      'max_attempts',
      'passing_score',
      'total_points',
      'shuffle_questions',
      'shuffle_options',
      'show_correct_answers',
      'show_feedback',
      'allow_review',
      'time_limit',
      'grading_type',
      'auto_submit',
      'tags',
      'assessment_type',
      'is_result_released',
      'student_can_view_grading',
      'status',
    ];

    for (const field of allowedFields) {
      if (updateDto?.[field] !== undefined) {
        updateData[field] = updateDto[field];
      }
    }

    if (updateDto?.start_date) {
      updateData.start_date = new Date(updateDto.start_date);
    }
    if (updateDto?.end_date) {
      updateData.end_date = new Date(updateDto.end_date);
    }

    if (updateDto?.status) {
      const isBeingPublished = ['PUBLISHED', 'ACTIVE'].includes(
        updateDto.status,
      );

      if (isBeingPublished) {
        const questionCount = await this.prisma.assessmentQuestion.count({
          where: { assessment_id: assessmentId },
        });

        if (questionCount === 0) {
          throw new BadRequestException(
            'Cannot publish or activate an assessment with no questions. Add at least one question first.',
          );
        }

        const effectiveEndDate =
          updateData.end_date ?? existingAssessment.end_date;
        if (effectiveEndDate && new Date(effectiveEndDate) < new Date()) {
          this.logger.error(colors.red('Cannot publish an assessment that has already expired. Please set an end date in the future first.'));
          throw new BadRequestException(
            'Cannot publish an assessment that has already expired. Please set an end date in the future first.',
          );
        }

        updateData.is_published = true;
        updateData.published_at = new Date();
      }

      const isBeingUnpublished =
        updateDto.status === 'DRAFT' && existingAssessment.is_published;
      if (isBeingUnpublished) {
        updateData.is_published = false;
      }
    }

    if (
      updateData.assessment_type === '' ||
      updateData.assessment_type === undefined
    ) {
      delete updateData.assessment_type;
    }

    const updatedAssessment = await this.prisma.assessment.update({
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

    return ResponseHelper.success('Assessment updated successfully', {
      assessment: updatedAssessment,
      assessmentContext: 'school',
    });
  }

  // ================================================================
  // ADD QUESTIONS
  // ================================================================

  async addDirectorAssessmentQuestions(
    assessmentId: string,
    addQuestionsDto: AddQuestionsDto,
    user: any,
  ) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    this.logger.log(
      colors.cyan(
        `[DIRECTOR] Adding ${addQuestionsDto.questions.length} question(s) to assessment: ${assessmentId}`,
      ),
    );

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: schoolId,
      },
      include: {
        _count: { select: { questions: true } },
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot add questions to a ${assessment.status} assessment. Change the status to DRAFT or CLOSED first.`,
      );
    }

    const lastQuestion = await this.prisma.assessmentQuestion.findFirst({
      where: { assessment_id: assessmentId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let nextOrder = (lastQuestion?.order ?? 0) + 1;

    const createdQuestions = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const questionDto of addQuestionsDto.questions) {
        const questionOrder = questionDto.order ?? nextOrder++;

        const newQuestion = await tx.assessmentQuestion.create({
          data: {
            assessment_id: assessmentId,
            question_text: questionDto.question_text,
            question_type: questionDto.question_type as QuestionType,
            order: questionOrder,
            points: questionDto.points ?? 1.0,
            is_required: questionDto.is_required ?? true,
            time_limit: questionDto.time_limit ?? null,
            image_url: questionDto.image_url ?? null,
            image_s3_key: questionDto.image_s3_key ?? null,
            audio_url: questionDto.audio_url ?? null,
            video_url: questionDto.video_url ?? null,
            allow_multiple_attempts: questionDto.allow_multiple_attempts ?? false,
            show_hint: questionDto.show_hint ?? false,
            hint_text: questionDto.hint_text ?? null,
            min_length: questionDto.min_length ?? null,
            max_length: questionDto.max_length ?? null,
            min_value: questionDto.min_value ?? null,
            max_value: questionDto.max_value ?? null,
            explanation: questionDto.explanation ?? null,
            difficulty_level: (questionDto.difficulty_level ?? 'MEDIUM') as DifficultyLevel,
          },
        });

        const createdOptionIds: string[] = [];

        if (questionDto.options?.length) {
          for (let j = 0; j < questionDto.options.length; j++) {
            const optDto = questionDto.options[j];
            const newOption = await tx.assessmentOption.create({
              data: {
                question_id: newQuestion.id,
                option_text: optDto.option_text,
                order: optDto.order ?? j + 1,
                is_correct: optDto.is_correct,
                image_url: optDto.image_url ?? null,
                image_s3_key: optDto.image_s3_key ?? null,
                audio_url: optDto.audio_url ?? null,
              },
            });

            if (optDto.is_correct) {
              createdOptionIds.push(newOption.id);
            }
          }

          if (createdOptionIds.length > 0) {
            await tx.assessmentCorrectAnswer.create({
              data: {
                question_id: newQuestion.id,
                option_ids: createdOptionIds,
              },
            });
          }
        }

        if (questionDto.correct_answers?.length) {
          for (const answerDto of questionDto.correct_answers) {
            await tx.assessmentCorrectAnswer.create({
              data: {
                question_id: newQuestion.id,
                answer_text: answerDto.answer_text ?? null,
                answer_number: answerDto.answer_number ?? null,
                answer_date: answerDto.answer_date
                  ? new Date(answerDto.answer_date)
                  : null,
                answer_json: answerDto.answer_json ?? undefined,
              },
            });
          }
        }

        const fullQuestion = await tx.assessmentQuestion.findUnique({
          where: { id: newQuestion.id },
          include: {
            options: { orderBy: { order: 'asc' } },
            correct_answers: true,
          },
        });

        results.push(fullQuestion);
      }

      const totalPoints = await tx.assessmentQuestion.aggregate({
        where: { assessment_id: assessmentId },
        _sum: { points: true },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: { total_points: totalPoints._sum.points ?? 0 },
      });

      return results;
    });

    return ResponseHelper.success('Questions added successfully', {
      assessment_id: assessmentId,
      questions_added: createdQuestions.length,
      total_questions: assessment._count.questions + createdQuestions.length,
      questions: createdQuestions,
    });
  }

  // ================================================================
  // ADD QUESTION WITH IMAGE
  // ================================================================

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

  async addDirectorQuestionWithImage(
    assessmentId: string,
    questionDataString: string,
    questionImage: Express.Multer.File | undefined,
    optionImages: Express.Multer.File[],
    user: any,
  ) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    const uploadedKeys: string[] = [];

    try {
      this.logger.log(
        colors.cyan(
          `[DIRECTOR] Creating question with images for assessment: ${assessmentId}`,
        ),
      );

      let questionData: any;
      try {
        questionData = JSON.parse(questionDataString);
      } catch {
        throw new BadRequestException('Invalid JSON in questionData field');
      }

      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: schoolId,
        },
        include: {
          _count: { select: { questions: true } },
        },
      });

      if (!assessment) {
        throw new NotFoundException(
          'Assessment not found or you do not have access to it',
        );
      }

      if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
        throw new BadRequestException(
          'Cannot add questions to a published, active, closed, or archived assessment',
        );
      }

      const s3Folder = `assessment-images/schools/${schoolId}/assessments/${assessmentId}`;

      if (questionImage) {
        this.logger.log(
          colors.blue(
            `[DIRECTOR] Uploading question image: ${questionImage.originalname}`,
          ),
        );
        this.validateImageFile(questionImage);

        const fileName = `question_${Date.now()}_${questionImage.originalname.replace(
          /[^a-zA-Z0-9.-]/g,
          '_',
        )}`;

        const uploadResult = await this.storageService.uploadFile(
          questionImage,
          s3Folder,
          fileName,
        );

        uploadedKeys.push(uploadResult.key);
        questionData.image_url = uploadResult.url;
        questionData.image_s3_key = uploadResult.key;
      }

      if (optionImages.length > 0 && questionData.options?.length) {
        for (let i = 0; i < optionImages.length; i++) {
          const optFile = optionImages[i];
          this.logger.log(
            colors.blue(
              `[DIRECTOR] Uploading option image [${i}]: ${optFile.originalname}`,
            ),
          );

          this.validateImageFile(optFile);

          const fileName = `option_${Date.now()}_${i}_${optFile.originalname.replace(
            /[^a-zA-Z0-9.-]/g,
            '_',
          )}`;

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
            matchingOption.image_url = uploadResult.url;
            matchingOption.image_s3_key = uploadResult.key;
          }
        }
      }

      const addQuestionsDto: AddQuestionsDto = { questions: [questionData] };
      return this.addDirectorAssessmentQuestions(
        assessmentId,
        addQuestionsDto,
        user,
      );
    } catch (err: any) {
      if (uploadedKeys.length > 0) {
        for (const key of uploadedKeys) {
          try {
            await this.storageService.deleteFile(key);
          } catch {
            // Best-effort rollback
          }
        }
      }
      throw err;
    }
  }

  // ================================================================
  // UPDATE QUESTION (smart merge)
  // ================================================================

  async updateDirectorQuestion(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: any,
    user: any,
  ) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, school_id: schoolId },
      select: { id: true, status: true, subject_id: true },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot update questions in a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    const question = await this.prisma.assessmentQuestion.findFirst({
      where: { id: questionId, assessment_id: assessmentId },
      include: {
        options: { orderBy: { order: 'asc' } },
        correct_answers: true,
      },
    });

    if (!question) {
      this.logger.error(colors.red(`Question not found: ${questionId}`));
      throw new NotFoundException('Question not found');
    }

    const updatedQuestion = await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};

      if (updateQuestionDto.question_text !== undefined) {
        updateData.question_text = updateQuestionDto.question_text;
      }
      if (updateQuestionDto.question_type !== undefined) {
        updateData.question_type =
          updateQuestionDto.question_type as QuestionType;
      }
      if (updateQuestionDto.order !== undefined) {
        updateData.order = updateQuestionDto.order;
      }
      if (updateQuestionDto.points !== undefined) {
        updateData.points = updateQuestionDto.points;
      }
      if (updateQuestionDto.is_required !== undefined) {
        updateData.is_required = updateQuestionDto.is_required;
      }
      if (updateQuestionDto.time_limit !== undefined) {
        updateData.time_limit = updateQuestionDto.time_limit;
      }

      const questionImageUpdateRequested =
        updateQuestionDto.image_url !== undefined ||
        updateQuestionDto.image_s3_key !== undefined;

      if (
        questionImageUpdateRequested &&
        question.image_s3_key
      ) {
        try {
          await this.storageService.deleteFile(question.image_s3_key);
          this.logger.log(
            colors.green(
              `[DIRECTOR] Deleted old question image: ${question.image_s3_key}`,
            ),
          );
        } catch (error) {
          this.logger.warn(
            colors.yellow(
              `[DIRECTOR] Failed to delete old question image: ${question.image_s3_key}`,
            ),
          );
        }
      }

      if (updateQuestionDto.image_url !== undefined) {
        updateData.image_url = updateQuestionDto.image_url;
      }
      if (updateQuestionDto.image_s3_key !== undefined) {
        updateData.image_s3_key = updateQuestionDto.image_s3_key;
      }
      if (updateQuestionDto.audio_url !== undefined) {
        updateData.audio_url = updateQuestionDto.audio_url;
      }
      if (updateQuestionDto.video_url !== undefined) {
        updateData.video_url = updateQuestionDto.video_url;
      }
      if (updateQuestionDto.allow_multiple_attempts !== undefined) {
        updateData.allow_multiple_attempts =
          updateQuestionDto.allow_multiple_attempts;
      }
      if (updateQuestionDto.show_hint !== undefined) {
        updateData.show_hint = updateQuestionDto.show_hint;
      }
      if (updateQuestionDto.hint_text !== undefined) {
        updateData.hint_text = updateQuestionDto.hint_text;
      }
      if (updateQuestionDto.min_length !== undefined) {
        updateData.min_length = updateQuestionDto.min_length;
      }
      if (updateQuestionDto.max_length !== undefined) {
        updateData.max_length = updateQuestionDto.max_length;
      }
      if (updateQuestionDto.min_value !== undefined) {
        updateData.min_value = updateQuestionDto.min_value;
      }
      if (updateQuestionDto.max_value !== undefined) {
        updateData.max_value = updateQuestionDto.max_value;
      }
      if (updateQuestionDto.explanation !== undefined) {
        updateData.explanation = updateQuestionDto.explanation;
      }
      if (updateQuestionDto.difficulty_level !== undefined) {
        updateData.difficulty_level =
          updateQuestionDto.difficulty_level as DifficultyLevel;
      }

      await tx.assessmentQuestion.update({
        where: { id: questionId },
        data: updateData,
      });

      // Smart merge/update options if provided
      if (updateQuestionDto.options !== undefined) {
        if (updateQuestionDto.options.length === 0) {
          throw new BadRequestException(
            'options cannot be empty when provided',
          );
        }

        const correctOptionIds: string[] = [];

        for (let j = 0; j < updateQuestionDto.options.length; j++) {
          const optDto = updateQuestionDto.options[j];

          if (optDto.id) {
            const existingOption = question.options.find(
              (opt: any) => opt.id === optDto.id,
            );

            if (!existingOption) {
              throw new BadRequestException(
                `Option with id ${optDto.id} not found in this question`,
              );
            }

            const updateOptionData: any = {};

            if (optDto.option_text !== undefined) {
              if (optDto.option_text === '') {
                throw new BadRequestException('option_text cannot be empty');
              }
              updateOptionData.option_text = optDto.option_text;
            }

            if (optDto.order !== undefined) {
              updateOptionData.order = optDto.order;
            }
            if (optDto.is_correct !== undefined) {
              updateOptionData.is_correct = optDto.is_correct;
            }
            if (optDto.audio_url !== undefined) {
              updateOptionData.audio_url = optDto.audio_url;
            }

            if (optDto.image_url !== undefined) {
              if (
                existingOption.image_s3_key &&
                optDto.image_s3_key !== existingOption.image_s3_key
              ) {
                try {
                  await this.storageService.deleteFile(
                    existingOption.image_s3_key,
                  );
                  this.logger.log(
                    colors.green(
                      `[DIRECTOR] Deleted old option image: ${existingOption.image_s3_key}`,
                    ),
                  );
                } catch (error) {
                  this.logger.warn(
                    colors.yellow(
                      `[DIRECTOR] Failed to delete old option image: ${existingOption.image_s3_key}`,
                    ),
                  );
                }
              }

              updateOptionData.image_url = optDto.image_url;
              updateOptionData.image_s3_key = optDto.image_s3_key ?? null;
            }

            const updatedOption = await tx.assessmentOption.update({
              where: { id: optDto.id },
              data: updateOptionData,
            });

            const isCorrect =
              optDto.is_correct !== undefined
                ? optDto.is_correct
                : existingOption.is_correct;

            if (isCorrect) {
              correctOptionIds.push(updatedOption.id);
            }
          } else {
            const optionText = optDto.option_text ?? '';
            if (optionText === '') {
              throw new BadRequestException(
                'option_text is required when creating new options',
              );
            }
            if (optDto.is_correct === undefined) {
              throw new BadRequestException(
                'is_correct is required when creating new options',
              );
            }

            const newOption = await tx.assessmentOption.create({
              data: {
                question_id: questionId,
                option_text: optionText,
                order: optDto.order ?? j + 1,
                is_correct: optDto.is_correct,
                image_url: optDto.image_url ?? null,
                image_s3_key: optDto.image_s3_key ?? null,
                audio_url: optDto.audio_url ?? null,
              },
            });

            if (optDto.is_correct) {
              correctOptionIds.push(newOption.id);
            }
          }
        }

        if (correctOptionIds.length > 0) {
          await tx.assessmentCorrectAnswer.deleteMany({
            where: { question_id: questionId },
          });

          await tx.assessmentCorrectAnswer.create({
            data: {
              question_id: questionId,
              option_ids: correctOptionIds,
            },
          });
        }
      }

      // Update correct answers if provided (for non-MCQ types)
      if (updateQuestionDto.correct_answers !== undefined) {
        if (!updateQuestionDto.options) {
          await tx.assessmentCorrectAnswer.deleteMany({
            where: { question_id: questionId },
          });

          for (const answerDto of updateQuestionDto.correct_answers) {
            await tx.assessmentCorrectAnswer.create({
              data: {
                question_id: questionId,
                answer_text: answerDto.answer_text ?? null,
                answer_number: answerDto.answer_number ?? null,
                answer_date: answerDto.answer_date
                  ? new Date(answerDto.answer_date)
                  : null,
                answer_json: answerDto.answer_json ?? undefined,
              },
            });
          }
        }
      }

      const fullQuestion = await tx.assessmentQuestion.findUnique({
        where: { id: questionId },
        include: {
          options: { orderBy: { order: 'asc' } },
          correct_answers: true,
        },
      });

      const totalPoints = await tx.assessmentQuestion.aggregate({
        where: { assessment_id: assessmentId },
        _sum: { points: true },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: { total_points: totalPoints._sum.points ?? 0 },
      });

      return fullQuestion;
    });

    this.logger.log(
      colors.green(`[DIRECTOR] Successfully updated question: ${questionId}`),
    );

    return ResponseHelper.success('Question updated successfully', {
      assessment_id: assessmentId,
      question: updatedQuestion,
    });
  }

  // ================================================================
  // UPDATE QUESTION WITH IMAGE
  // ================================================================

  async updateDirectorQuestionWithImage(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: any,
    user: any,
    newQuestionImage?: Express.Multer.File,
    optionImageUpdates?: Array<{ optionId: string; oldS3Key?: string }>,
    newOptionImages?: Express.Multer.File[],
  ) {
    const schoolId = user?.school_id;

    if (!schoolId) {
      throw new BadRequestException('Invalid director authentication data');
    }

    const uploadedFiles: string[] = [];

    try {
      if (newQuestionImage) {
        const timestamp = Date.now();
        const sanitizedFilename = newQuestionImage.originalname.replace(
          /[^a-zA-Z0-9._-]/g,
          '_',
        );

        const s3Folder = `assessment-images/schools/${schoolId}/assessments/${assessmentId}`;
        const fileName = `question_${timestamp}_${sanitizedFilename}`;

        const uploadResult = await this.storageService.uploadFile(
          newQuestionImage,
          s3Folder,
          fileName,
        );

        uploadedFiles.push(uploadResult.key);

        if (updateQuestionDto.image_s3_key) {
          try {
            await this.storageService.deleteFile(updateQuestionDto.image_s3_key);
          } catch (error) {
            this.logger.warn(
              colors.yellow(
                `[DIRECTOR] Failed to delete old question image: ${updateQuestionDto.image_s3_key}`,
              ),
            );
          }
        }

        updateQuestionDto.image_url = uploadResult.url;
        updateQuestionDto.image_s3_key = uploadResult.key;
      }

      if (
        optionImageUpdates &&
        newOptionImages &&
        newOptionImages.length > 0
      ) {
        if (optionImageUpdates.length !== newOptionImages.length) {
          throw new BadRequestException(
            'Mismatch between optionImageUpdates and newOptionImages count',
          );
        }

        if (!updateQuestionDto.options) {
          updateQuestionDto.options = [];
        }

        for (let i = 0; i < optionImageUpdates.length; i++) {
          const { optionId, oldS3Key } = optionImageUpdates[i];
          const imageFile = newOptionImages[i];

          const timestamp = Date.now();
          const sanitizedFilename = imageFile.originalname.replace(
            /[^a-zA-Z0-9._-]/g,
            '_',
          );

          const s3Folder = `assessment-images/schools/${schoolId}/assessments/${assessmentId}`;
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
            } catch (error) {
              this.logger.warn(
                colors.yellow(
                  `[DIRECTOR] Failed to delete old option image: ${oldS3Key}`,
                ),
              );
            }
          }

          let optionUpdate = updateQuestionDto.options.find(
            (opt: any) => opt.id === optionId,
          );

          if (!optionUpdate) {
            optionUpdate = { id: optionId };
            updateQuestionDto.options.push(optionUpdate);
          }

          optionUpdate.image_url = uploadResult.url;
          optionUpdate.image_s3_key = uploadResult.key;
        }
      }

      const result = await this.updateDirectorQuestion(
        assessmentId,
        questionId,
        updateQuestionDto,
        user,
      );

      return result;
    } catch (error) {
      for (const s3Key of uploadedFiles) {
        try {
          await this.storageService.deleteFile(s3Key);
        } catch (rollbackError) {
          this.logger.warn(
            colors.yellow(
              `[DIRECTOR] Failed to rollback file: ${s3Key}`,
            ),
          );
        }
      }

      throw error;
    }
  }

  // ================================================================
  // DELETE QUESTION
  // ================================================================

  async deleteDirectorAssessmentQuestion(
    assessmentId: string,
    questionId: string,
    user: any,
  ) {
    this.logger.log(
      colors.cyan(
        `[DIRECTOR] Deleting question: ${questionId} from assessment: ${assessmentId}`,
      ),
    );

    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid director authentication data');
    }

    await this.verifyDirector(userId);

    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, school_id: schoolId },
      select: { id: true, status: true, subject_id: true },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot delete questions from a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    const question = await this.prisma.assessmentQuestion.findFirst({
      where: { id: questionId, assessment_id: assessmentId },
      include: { options: true },
    });

    if (!question) {
      this.logger.error(colors.red(`Question not found: ${questionId}`));
      throw new NotFoundException('Question not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.assessmentQuestion.delete({
        where: { id: questionId },
      });

      const mediaToDelete: string[] = [];

      if (question.image_s3_key) {
        mediaToDelete.push(question.image_s3_key);
      }

      if (question.audio_url) {
        const urlMatch = question.audio_url.match(/\/([^\/]+)$/);
        if (urlMatch) mediaToDelete.push(urlMatch[1]);
      }

      if (question.video_url) {
        const urlMatch = question.video_url.match(/\/([^\/]+)$/);
        if (urlMatch) mediaToDelete.push(urlMatch[1]);
      }

      for (const option of question.options) {
        if (option.image_s3_key) {
          mediaToDelete.push(option.image_s3_key);
        }

        if (option.audio_url) {
          const urlMatch = option.audio_url.match(/\/([^\/]+)$/);
          if (urlMatch) mediaToDelete.push(urlMatch[1]);
        }
      }

      for (const key of mediaToDelete) {
        try {
          await this.storageService.deleteFile(key);
          this.logger.log(colors.green(`[DIRECTOR] Deleted media file: ${key}`));
        } catch (error: any) {
          const errMsg = error?.message ?? String(error);
          this.logger.warn(
            colors.yellow(
              `[DIRECTOR] Failed to delete media file: ${key} - ${errMsg}`,
            ),
          );
        }
      }

      const totalPoints = await tx.assessmentQuestion.aggregate({
        where: { assessment_id: assessmentId },
        _sum: { points: true },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: { total_points: totalPoints._sum.points ?? 0 },
      });
    });

    this.logger.log(
      colors.green(`[DIRECTOR] Successfully deleted question: ${questionId}`),
    );

    return ResponseHelper.success('Question deleted successfully', {
      assessment_id: assessmentId,
      deleted_question_id: questionId,
      message: 'Question and all associated media have been removed',
    });
  }

  // ================================================================
  // ASSESSMENT ATTEMPTS (from existing director assessments service)
  // ================================================================

  async getAssessmentAttempts(assessmentId: string, userId: string) {
    try {
      this.logger.log(
        colors.cyan(
          `Getting assessment attempts for director: ${assessmentId}`,
        ),
      );

      const user = await this.verifyDirector(userId);

      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: user.school_id,
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true },
          },
          topic: {
            select: { id: true, title: true },
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      if (!assessment) {
        this.logger.error(
          colors.red(`Assessment not found or access denied: ${assessmentId}`),
        );
        return ResponseHelper.error(
          'Assessment not found or access denied',
          null,
          404,
        );
      }

      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: user.school_id,
          is_current: true,
        },
      });

      if (!currentSession) {
        return ResponseHelper.error(
          'Current academic session not found',
          null,
          404,
        );
      }

      const classesWithSubject = await this.prisma.class.findMany({
        where: {
          schoolId: user.school_id,
          subjects: {
            some: {
              id: assessment.subject_id,
              academic_session_id: currentSession.id,
            },
          },
        },
        select: { id: true, name: true },
      });

      if (classesWithSubject.length === 0) {
        return ResponseHelper.success(
          'Assessment attempts retrieved successfully',
          {
            assessment: {
              id: assessment.id,
              title: assessment.title,
              subject: assessment.subject,
              topic: assessment.topic,
              createdBy: assessment.createdBy,
            },
            totalStudents: 0,
            studentsAttempted: 0,
            studentsNotAttempted: 0,
            classes: [],
            students: [],
          },
        );
      }

      const classIds = classesWithSubject.map((cls) => cls.id);

      const allStudents = await this.prisma.student.findMany({
        where: {
          school_id: user.school_id,
          academic_session_id: currentSession.id,
          current_class_id: { in: classIds },
          status: 'active',
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
          current_class: {
            select: { id: true, name: true },
          },
        },
        orderBy: {
          user: { last_name: 'asc' },
        },
      });

      const attempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          assessment_id: assessmentId,
          school_id: user.school_id,
          academic_session_id: currentSession.id,
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
          createdAt: true,
        },
        orderBy: { submitted_at: 'desc' },
      });

      const attemptsByStudent = new Map<string, typeof attempts>();
      attempts.forEach((attempt) => {
        if (!attemptsByStudent.has(attempt.student_id)) {
          attemptsByStudent.set(attempt.student_id, []);
        }
        attemptsByStudent.get(attempt.student_id)!.push(attempt);
      });

      const studentsWithAttempts = allStudents.map((student) => {
        const studentAttempts = attemptsByStudent.get(student.user_id) || [];
        const latestAttempt =
          studentAttempts.length > 0 ? studentAttempts[0] : null;

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
          latestAttempt: latestAttempt
            ? {
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
                createdAt: latestAttempt.createdAt,
              }
            : null,
          allAttempts: studentAttempts.map((attempt) => ({
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
            createdAt: attempt.createdAt,
          })),
        };
      });

      const studentsAttempted = studentsWithAttempts.filter(
        (s) => s.hasAttempted,
      ).length;
      const studentsNotAttempted = allStudents.length - studentsAttempted;
      const totalAttempts = attempts.length;

      const completedAttempts = attempts.filter(
        (a) => a.submitted_at && a.status === 'SUBMITTED',
      );
      const averageScore =
        completedAttempts.length > 0
          ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
            completedAttempts.length
          : 0;

      const studentsByClass = studentsWithAttempts.reduce(
        (acc, student) => {
          const className = student.className;
          if (!acc[className]) {
            acc[className] = [];
          }
          acc[className].push(student);
          return acc;
        },
        {} as Record<string, typeof studentsWithAttempts>,
      );

      const classesData = Object.entries(studentsByClass).map(
        ([className, students]) => ({
          className,
          totalStudents: students.length,
          studentsAttempted: students.filter((s) => s.hasAttempted).length,
          studentsNotAttempted: students.filter((s) => !s.hasAttempted).length,
        }),
      );

      this.logger.log(
        colors.green(
          `Retrieved attempts for ${allStudents.length} students, ${studentsAttempted} have attempted`,
        ),
      );

      return ResponseHelper.success(
        'Assessment attempts retrieved successfully',
        {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            subject: assessment.subject,
            topic: assessment.topic,
            totalPoints: assessment.total_points,
            passingScore: assessment.passing_score,
            createdBy: assessment.createdBy,
          },
          statistics: {
            totalStudents: allStudents.length,
            studentsAttempted,
            studentsNotAttempted,
            totalAttempts,
            averageScore: Math.round(averageScore * 100) / 100,
            completionRate:
              allStudents.length > 0
                ? Math.round(
                    (studentsAttempted / allStudents.length) * 100 * 100,
                  ) / 100
                : 0,
          },
          classes: classesData,
          students: studentsWithAttempts,
        },
      );
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      return ResponseHelper.error(
        this.clientSafeFetchErrorMessage(
          error,
          'Director assessment attempts',
        ),
        null,
        500,
      );
    }
  }

  // ================================================================
  // STUDENT SUBMISSION (from existing director assessments service)
  // ================================================================

  async getStudentSubmission(
    assessmentId: string,
    studentId: string,
    userId: string,
  ) {
    try {
      this.logger.log(
        colors.cyan(
          `Getting student submission for assessment: ${assessmentId}, student: ${studentId}`,
        ),
      );

      const user = await this.verifyDirector(userId);

      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: user.school_id,
        },
        include: {
          subject: {
            select: { id: true, name: true, code: true },
          },
          topic: {
            select: { id: true, title: true },
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      });

      if (!assessment) {
        this.logger.error(
          colors.red(`Assessment not found or access denied: ${assessmentId}`),
        );
        return ResponseHelper.error(
          'Assessment not found or access denied',
          null,
          404,
        );
      }

      this.logger.log(colors.green(`Assessment found`));

      this.logger.log(colors.cyan(`Looking for student with id: ${studentId}`));
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          school_id: user.school_id,
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
          current_class: {
            select: { id: true, name: true },
          },
        },
      });

      if (!student) {
        this.logger.error(
          colors.red(`Student not found with id: ${studentId}`),
        );
        return ResponseHelper.error('Student not found', null, 404);
      }

      this.logger.log(
        colors.green(
          `Student found: ${student.user.first_name} ${student.user.last_name} (user_id: ${student.user_id})`,
        ),
      );

      this.logger.log(
        colors.cyan(
          `Getting current academic session for school: ${user.school_id}`,
        ),
      );
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: user.school_id,
          is_current: true,
        },
      });

      if (!currentSession) {
        return ResponseHelper.error(
          'Current academic session not found',
          null,
          404,
        );
      }

      this.logger.log(
        colors.green(`Current session found: ${currentSession.id}`),
      );

      this.logger.log(
        colors.cyan(
          `Fetching attempts for assessment: ${assessmentId}, user_id: ${student.user_id}`,
        ),
      );
      const attempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          assessment_id: assessmentId,
          student_id: student.user_id,
          school_id: user.school_id,
          academic_session_id: currentSession.id,
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
                      order: true,
                    },
                    orderBy: { order: 'asc' },
                  },
                },
              },
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
            orderBy: {
              question: { order: 'asc' },
            },
          },
        },
        orderBy: { submitted_at: 'desc' },
      });

      if (attempts.length === 0) {
        return ResponseHelper.success(
          'Student submission retrieved successfully',
          {
            assessment: {
              id: assessment.id,
              title: assessment.title,
              subject: assessment.subject,
              topic: assessment.topic,
              totalPoints: assessment.total_points,
              passingScore: assessment.passing_score,
              createdBy: assessment.createdBy,
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
              classId: student.current_class_id,
            },
            attempts: [],
            hasAttempted: false,
          },
        );
      }

      const formattedAttempts = attempts.map((attempt) => ({
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
        responses: attempt.responses.map((response) => ({
          id: response.id,
          question: {
            id: response.question.id,
            questionText: response.question.question_text,
            questionType: response.question.question_type,
            points: response.question.points,
            order: response.question.order,
            imageUrl: response.question.image_url,
            options: response.question.options,
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
          createdAt: response.createdAt,
        })),
      }));

      this.logger.log(
        colors.green(
          `Retrieved ${attempts.length} attempt(s) for student ${student.user.first_name} ${student.user.last_name}`,
        ),
      );

      return ResponseHelper.success(
        'Student submission retrieved successfully',
        {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            subject: assessment.subject,
            topic: assessment.topic,
            totalPoints: assessment.total_points,
            passingScore: assessment.passing_score,
            createdBy: assessment.createdBy,
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
            classId: student.current_class_id,
          },
          attempts: formattedAttempts,
          hasAttempted: true,
          attemptCount: attempts.length,
          latestAttempt: formattedAttempts[0] || null,
        },
      );
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      return ResponseHelper.error(
        this.clientSafeFetchErrorMessage(
          error,
          'Director student submission',
        ),
        null,
        500,
      );
    }
  }

  // ================================================================
  // CREATE ASSESSMENT
  // ================================================================

  async createDirectorAssessment(createDto: CreateAssessmentDto, user: any) {
    
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      this.logger.error(colors.red('Invalid director authentication data'));
      throw new BadRequestException('Invalid director authentication data');
    }

    this.logger.log(colors.cyan(`Director creating a new assessment`));

    // await this.verifyDirector(userId);

    const subject = await this.prisma.subject.findFirst({
      where: {
        id: createDto.subject_id,
        schoolId,
      },
    });

    if (!subject) {
      this.logger.error(colors.red(`Subject not found in this school`));
      throw new NotFoundException('Subject not found in this school');
    }

    let academicSessionId: string;
    if (createDto.academic_session_id) {
      const session = await this.prisma.academicSession.findFirst({
        where: { id: createDto.academic_session_id, school_id: schoolId },
      });
      if (!session) {
        this.logger.error(colors.red(`Academic session not found or does not belong to this school`));
        throw new BadRequestException(
          'Academic session not found or does not belong to this school',
        );
      }
      academicSessionId = session.id;
    } else {
      const currentSession = await this.prisma.academicSession.findFirst({
        where: { school_id: schoolId, is_current: true },
      });
      if (!currentSession) {
        this.logger.error(colors.red(`No current academic session found`));
        throw new BadRequestException('No current academic session found');
      }
      academicSessionId = currentSession.id;
    }

    if (createDto.topic_id) {
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: createDto.topic_id,
          subject_id: createDto.subject_id,
          school_id: schoolId,
          academic_session_id: academicSessionId,
        },
      });

      if (!topic) {
        this.logger.error(colors.red(`Topic not found for this subject, school, and academic session`));
        throw new NotFoundException(
          'Topic not found for this subject, school, and academic session',
        );
      }
    }

    let assessmentType: AssessmentType = AssessmentType.CBT;
    if (createDto.assessment_type) {
      if (
        !Object.values(AssessmentType).includes(
          createDto.assessment_type as AssessmentType,
        )
      ) {
        this.logger.error(colors.red(`Invalid assessment_type`));
        throw new BadRequestException('Invalid assessment_type');
      }
      assessmentType = createDto.assessment_type as AssessmentType;
    }

    const typeLimits: Partial<Record<AssessmentType, number>> = {
      [AssessmentType.CBT]: 2,
      [AssessmentType.EXAM]: 1,
    };
    const maxAllowed = typeLimits[assessmentType];
    if (maxAllowed !== undefined) {
      const existingCount = await this.prisma.assessment.count({
        where: {
          subject_id: createDto.subject_id,
          academic_session_id: academicSessionId,
          assessment_type: assessmentType,
        },
      });
      if (existingCount >= maxAllowed) {
        const typeLabel =
          assessmentType === AssessmentType.EXAM ? 'exam' : 'CBT';
        this.logger.error(colors.red(`Maximum of ${maxAllowed} ${typeLabel} assessment(s) allowed per subject per term for this session.`));
        throw new BadRequestException(
          `Maximum of ${maxAllowed} ${typeLabel} assessment(s) allowed per subject per term for this session.`,
        );
      }
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        school_id: schoolId,
        academic_session_id: academicSessionId,
        subject_id: createDto.subject_id,
        topic_id: createDto.topic_id ?? null,
        created_by: userId,
        title: createDto.title,
        description: createDto.description ?? null,
        instructions: createDto.instructions ?? null,
        assessment_type: assessmentType,
        grading_type: createDto.grading_type ?? 'AUTOMATIC',
        duration: createDto.duration ?? null,
        max_attempts: createDto.max_attempts ?? 1,
        passing_score: createDto.passing_score ?? 50,
        total_points: createDto.total_points ?? 100,
        shuffle_questions: createDto.shuffle_questions ?? false,
        shuffle_options: createDto.shuffle_options ?? false,
        show_correct_answers: createDto.show_correct_answers ?? false,
        show_feedback: createDto.show_feedback !== false,
        allow_review: createDto.allow_review !== false,
        time_limit: createDto.time_limit ?? null,
        auto_submit: createDto.auto_submit ?? false,
        tags: createDto.tags ?? [],
        start_date: createDto.start_date
          ? new Date(createDto.start_date)
          : null,
        end_date: createDto.end_date
          ? new Date(createDto.end_date)
          : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        is_published: false,
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

    this.logger.log(
      colors.green(
        `[DIRECTOR-ASSESSMENT] Director successfully new assessment`,
      ),
    );

    return ResponseHelper.success('Assessment created successfully', {
      assessment,
    });
  }
}
