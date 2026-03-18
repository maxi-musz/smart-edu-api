import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetAssessmentsQueryDto } from 'src/assessment/dto/get-assessments-query.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import * as colors from 'colors';
import { Logger } from '@nestjs/common';

type StatusAnalytics = {
  all: number;
  draft: number;
  published: number;
  active: number;
  closed: number;
  archived: number;
};

@Injectable()
export class TeachersAssessmentsService {
  private readonly logger = new Logger(TeachersAssessmentsService.name);
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all assessments for the authenticated teacher.
   *
   * Filtering logic matches the general assessment module:
   * - Fetch current academic session if `academic_session_id` is not provided
   * - Teacher sees only assessments where `subject_id` is in `teacher.subjectsTeaching`
   * - Supports all optional filters (status, subject_id, topic_id, etc.)
   * - Returns analytics counts by status and last academic sessions
   */
  async getAllAssessmentsForTeacher(query: GetAssessmentsQueryDto, user: any) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid teacher authentication data');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const sort_by = query.sort_by ?? 'createdAt';
    const sort_order = query.sort_order ?? 'desc';

    // Get current academic session if not specified
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

    // Optional filters
    if (query.subject_id) baseWhere.subject_id = query.subject_id;
    if (query.topic_id) baseWhere.topic_id = query.topic_id;
    if (query.status) baseWhere.status = query.status;
    if (query.assessment_type)
      baseWhere.assessment_type = query.assessment_type;
    if (query.is_published !== undefined)
      baseWhere.is_published = query.is_published;
    if (query.created_by) baseWhere.created_by = query.created_by;

    // Search filter
    if (query.search) {
      baseWhere.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Teacher-specific filtering: only subjects they teach
    const teacher = await this.prisma.teacher.findFirst({
      where: { user_id: userId },
      include: {
        subjectsTeaching: {
          select: { subjectId: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherSubjectIds = teacher.subjectsTeaching.map(
      (st: any) => st.subjectId,
    );

    if (teacherSubjectIds.length === 0) {
      return ResponseHelper.success('Assessments fetched successfully', {
        assessments: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    const whereClause: any = { ...baseWhere };
    whereClause.subject_id = { in: teacherSubjectIds };

    // Analytics counts by status should ignore status/is_published filters
    const analyticsWhere: any = { ...whereClause };
    delete analyticsWhere.status;
    delete analyticsWhere.is_published;

    const [total, assessments, statusCounts, recentSessions] =
      await Promise.all([
        this.prisma.assessment.count({ where: whereClause }),
        this.prisma.assessment.findMany({
          where: whereClause,
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

  /**
   * Get a specific assessment by ID (teacher view).
   * Response shape matches `SchoolAssessmentService.getFullAssessmentDetails(...)`.
   */
  async getTeacherAssessmentById(assessmentId: string, user: any) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid teacher authentication data');
    }

    // Fetch the assessment first to verify it's in the same school
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

    // Teacher access control:
    // teacher must be assigned to the assessment.subject_id
    const teacher = await this.prisma.teacher.findFirst({
      where: { user_id: userId },
      include: {
        subjectsTeaching: {
          where: { subjectId: assessment.subject_id },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.subjectsTeaching.length === 0) {
      throw new ForbiddenException('You do not have access to this assessment');
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
          academic_session_id: currentSession.id,
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

  /**
   * Fetch assessment questions in teacher preview mode.
   * Mirrors `SchoolAssessmentService.getSchoolAssessmentQuestionsForPreview(...)`,
   * but strictly scopes access to the assessment's subject assigned to the teacher.
   */
  async getTeacherAssessmentQuestionsForPreview(
    assessmentId: string,
    user: any,
  ) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid teacher authentication data');
    }

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

    // Teacher access control:
    // teacher must be assigned to this assessment's subject
    const teacher = await this.prisma.teacher.findFirst({
      where: { user_id: userId },
      include: {
        subjectsTeaching: {
          where: { subjectId: assessment.subject_id },
          select: { subjectId: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (teacher.subjectsTeaching.length === 0) {
      throw new ForbiddenException(
        'You do not have access to this assessment',
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

  /**
   * Update a specific assessment by id (teacher-only).
   *
   * Logic mirrors `SchoolAssessmentService.updateSchoolAssessment(...)` for school users,
   * but teacher separation is ensured by:
   * - Scoping the lookup to assessments created by the authenticated teacher
   * - Enforcing subject/topic access when those IDs are changed
   */
  async updateTeacherAssessmentById(
    assessmentId: string,
    updateDto: any,
    user: any,
  ) {
    this.logger.log(
      colors.cyan(`[TEACHER] Updating assessment: ${assessmentId}`),
    );
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      this.logger.error(colors.red('Invalid teacher authentication data'));
      throw new BadRequestException('Invalid teacher authentication data');
    }

    const whereClause: any = {
      id: assessmentId,
      school_id: schoolId,
      created_by: userId,
    };

    const existingAssessment = await this.prisma.assessment.findFirst({
      where: whereClause,
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
          'Assessment not found or you do not have permission to update it',
        ),
      );
      throw new NotFoundException(
        'Assessment not found or you do not have permission to update it',
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

    // Validate subject_id if being changed
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

      // Teacher must teach the subject
      const teacherSubject = await this.prisma.teacherSubject.findFirst({
        where: {
          teacher: { user_id: userId },
          subjectId: updateDto.subject_id,
        },
      });

      if (!teacherSubject) {
        this.logger.error(colors.red('You do not teach this subject'));
        throw new ForbiddenException('You do not teach this subject');
      }
    }

    // Validate topic_id if being changed
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

    // Build update data (PATCH behavior)
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

    // Status side effects (publish/unpublish)
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

    // Mirror general module behavior: remove empty assessment_type
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
}
