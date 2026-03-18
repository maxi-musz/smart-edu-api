import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetAssessmentsQueryDto } from './dto/get-assessments-query.dto';
import { DuplicateAssessmentDto } from './dto/duplicate-assessment.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { StorageService } from '../../../shared/services/providers/storage.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import * as colors from 'colors';
import { Logger } from '@nestjs/common';
import { DifficultyLevel, QuestionType } from '@prisma/client';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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
   * Duplicate an assessment (teacher-only).
   *
   * Mirrors `SchoolAssessmentService.duplicateSchoolAssessment(...)`,
   * but keeps the logic self-contained inside this teacher module.
   */
  async duplicateTeacherAssessmentById(
    assessmentId: string,
    duplicateDto: DuplicateAssessmentDto,
    user: any,
  ) {

    this.logger.log(colors.cyan(`[TEACHER] duplicating current assessment`));
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      this.logger.error(colors.red('Invalid teacher authentication data'));
      throw new BadRequestException('Invalid teacher authentication data');
    }

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

    // Teacher access control: teacher must teach the subject of the source assessment
    const teacher = await this.prisma.teacher.findFirst({
      where: { user_id: userId },
      include: {
        subjectsTeaching: {
          select: { subjectId: true },
        },
      },
    });

    if (!teacher) {
      this.logger.error(colors.red('Teacher not found'));
      throw new NotFoundException('Teacher not found');
    }

    const teacherSubjectIds = teacher.subjectsTeaching.map((st) => st.subjectId);
    if (!teacherSubjectIds.includes(sourceAssessment.subject_id)) {
      this.logger.error(colors.red('You do not have access to duplicate this assessment'));
      throw new ForbiddenException(
        'You do not have access to duplicate this assessment',
      );
    }

    // Get current academic session
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

    // Prepare questions with optional shuffling
    let questions = [...sourceAssessment.questions];
    if (duplicateDto.shuffle_questions) {
      this.logger.log(colors.green('[TEACHER] shuffling questions'));
      questions = this.shuffleArray(questions);
    }

    const newAssessment = await this.prisma.$transaction(async (tx) => {
      this.logger.log(colors.yellow('[TEACHER] creating new assessment'));
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
          // Reset dates - user must set new dates
          start_date: null,
          end_date: null,
        },
      });

      this.logger.log(colors.blue('[TEACHER] creating questions'));
      // Create questions with options + correct answers
      for (let i = 0; i < questions.length; i++) {
        const sourceQuestion = questions[i];

        // Prepare options with optional shuffling
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

        // Create option ID mapping (old -> new) for correct_answers
        const optionIdMap = new Map<string, string>();

        // Create options
        for (let j = 0; j < options.length; j++) {
          const sourceOption = options[j];
          const newOption = await tx.assessmentOption.create({
            data: {
              question_id: newQuestion.id,
              option_text: sourceOption.option_text,
              order: j + 1,
              is_correct: sourceOption.is_correct,
              image_url: sourceOption.image_url,
              image_s3_key: sourceOption.image_s3_key,
              audio_url: sourceOption.audio_url,
            },
          });

          optionIdMap.set(sourceOption.id, newOption.id);
        }

        // Create correct answers with updated option IDs
        for (const sourceAnswer of sourceQuestion.correct_answers) {
          const newOptionIds = (sourceAnswer.option_ids || []).map(
            (oldId) => optionIdMap.get(oldId) || oldId,
          );

          await tx.assessmentCorrectAnswer.create({
            data: {
              question_id: newQuestion.id,
              answer_text: sourceAnswer.answer_text,
              answer_number: sourceAnswer.answer_number,
              answer_date: sourceAnswer.answer_date,
              option_ids: newOptionIds,
              answer_json: sourceAnswer.answer_json ?? undefined,
            },
          });
        }
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
    });

    this.logger.log(
      colors.magenta(
        `[TEACHER] Assessment duplicated successfully`,
      ),
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

  // ========================================
  // ADD QUESTIONS TO ASSESSMENT
  // ========================================

  /**
   * Add questions to an existing assessment (teacher module).
   * Mirrors `SchoolAssessmentService.addSchoolAssessmentQuestions(...)`.
   */
  async addTeacherAssessmentQuestions(
    assessmentId: string,
    addQuestionsDto: AddQuestionsDto,
    user: any,
  ) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid teacher authentication data');
    }

    this.logger.log(
      colors.cyan(
        `[TEACHER] Adding ${addQuestionsDto.questions.length} question(s) to assessment: ${assessmentId}`,
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

    // Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot add questions to a ${assessment.status} assessment. Change the status to DRAFT or CLOSED first.`,
      );
    }

    // Teacher subject access control
    const teacher = await this.prisma.teacher.findFirst({
      where: { user_id: userId },
      include: {
        subjectsTeaching: { select: { subjectId: true } },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherSubjectIds = teacher.subjectsTeaching.map(
      (st: any) => st.subjectId,
    );
    if (!teacherSubjectIds.includes(assessment.subject_id)) {
      throw new ForbiddenException(
        'You do not have access to modify this assessment',
      );
    }

    // Get current max order to continue numbering
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

        // Create options (MCQ / TRUE_FALSE)
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

        // Create explicit correct answers (non-MCQ types)
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

  /**
   * Validates an image file (type and size).
   */
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

  // ========================================
  // ATOMIC: ADD QUESTION WITH IMAGES
  // ========================================

  /**
   * Create a single question with image uploads atomically.
   * Supports question image + option images (matched by `imageIndex`).
   */
  async addTeacherQuestionWithImage(
    assessmentId: string,
    questionDataString: string,
    questionImage: Express.Multer.File | undefined,
    optionImages: Express.Multer.File[],
    user: any,
  ) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid teacher authentication data');
    }

    const uploadedKeys: string[] = [];

    try {
      this.logger.log(
        colors.cyan(
          `[TEACHER] Creating question with images for assessment: ${assessmentId}`,
        ),
      );

      // Parse JSON question data
      let questionData: any;
      try {
        questionData = JSON.parse(questionDataString);
      } catch {
        throw new BadRequestException('Invalid JSON in questionData field');
      }

      // Verify assessment exists and belongs to the school
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

      // Check assessment status
      if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
        throw new BadRequestException(
          'Cannot add questions to a published, active, closed, or archived assessment',
        );
      }

      // Mirror general atomic endpoint: teachers can only add to their own assessments
      if (assessment.created_by !== userId) {
        throw new ForbiddenException('You do not have access to this assessment');
      }

      const s3Folder = `assessment-images/schools/${schoolId}/assessments/${assessmentId}`;

      // Upload question image (optional)
      if (questionImage) {
        this.logger.log(
          colors.blue(
            `[TEACHER] Uploading question image: ${questionImage.originalname}`,
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

      // Upload option images (optional) and match by option.imageIndex
      if (optionImages.length > 0 && questionData.options?.length) {
        for (let i = 0; i < optionImages.length; i++) {
          const optFile = optionImages[i];
          this.logger.log(
            colors.blue(
              `[TEACHER] Uploading option image [${i}]: ${optFile.originalname}`,
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

      // Delegate creation to the non-image add method
      const addQuestionsDto: AddQuestionsDto = { questions: [questionData] };
      return this.addTeacherAssessmentQuestions(
        assessmentId,
        addQuestionsDto,
        user,
      );
    } catch (err: any) {
      // Rollback: delete ALL uploaded images if question creation failed
      if (uploadedKeys.length > 0) {
        for (const key of uploadedKeys) {
          try {
            await this.storageService.deleteFile(key);
          } catch {
            // Best-effort rollback; don't mask the original error
          }
        }
      }
      throw err;
    }
  }

  // ========================================
  // UPDATE QUESTION (SMART MERGE)
  // ========================================

  /**
   * Update a question in an assessment (teacher-only, subject-scoped).
   * Mirrors `SchoolAssessmentService.updateSchoolQuestion(...)` including smart merge logic.
   */
  async updateTeacherQuestion(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: any,
    user: any,
  ) {
    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid teacher authentication data');
    }

    // 1. Fetch assessment and verify access
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, school_id: schoolId },
      select: { id: true, status: true, subject_id: true },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    // 2. Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot update questions in a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    // 3. Teacher subject access check
    const teacher = await this.prisma.teacher.findFirst({
      where: { user_id: userId },
      include: {
        subjectsTeaching: { select: { subjectId: true } },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherSubjectIds = teacher.subjectsTeaching.map(
      (st: any) => st.subjectId,
    );

    if (!teacherSubjectIds.includes(assessment.subject_id)) {
      throw new ForbiddenException(
        'You do not have access to modify this assessment',
      );
    }

    // 4. Fetch question with all relations
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

    // 5. Update question in a transaction
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
              `[TEACHER] Deleted old question image: ${question.image_s3_key}`,
            ),
          );
        } catch (error) {
          this.logger.warn(
            colors.yellow(
              `[TEACHER] Failed to delete old question image: ${question.image_s3_key}`,
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

      // 5a. Smart merge/update options if provided
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
                      `[TEACHER] Deleted old option image: ${existingOption.image_s3_key}`,
                    ),
                  );
                } catch (error) {
                  this.logger.warn(
                    colors.yellow(
                      `[TEACHER] Failed to delete old option image: ${existingOption.image_s3_key}`,
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

      // 5b. Update correct answers if provided (for non-MCQ types)
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

      // 5c. Fetch and return the updated question
      const fullQuestion = await tx.assessmentQuestion.findUnique({
        where: { id: questionId },
        include: {
          options: { orderBy: { order: 'asc' } },
          correct_answers: true,
        },
      });

      // 5d. Recalculate assessment total_points
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
      colors.green(`[TEACHER] Successfully updated question: ${questionId}`),
    );

    return ResponseHelper.success('Question updated successfully', {
      assessment_id: assessmentId,
      question: updatedQuestion,
    });
  }

  // ========================================
  // UPDATE QUESTION WITH IMAGE UPLOADS
  // ========================================

  /**
   * Update a question with image uploads (multipart).
   * Mirrors `SchoolAssessmentService.updateSchoolQuestionWithImage(...)`,
   * but keeps the access control inside this teacher module via
   * `updateTeacherQuestion(...)`.
   */
  async updateTeacherQuestionWithImage(
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
      throw new BadRequestException('Invalid teacher authentication data');
    }

    const uploadedFiles: string[] = [];

    try {
      // 1) Upload question image (optional)
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

        // Delete old question image if it exists
        if (updateQuestionDto.image_s3_key) {
          try {
            await this.storageService.deleteFile(updateQuestionDto.image_s3_key);
          } catch (error) {
            this.logger.warn(
              colors.yellow(
                `[TEACHER] Failed to delete old question image: ${updateQuestionDto.image_s3_key}`,
              ),
            );
          }
        }

        updateQuestionDto.image_url = uploadResult.url;
        updateQuestionDto.image_s3_key = uploadResult.key;
      }

      // 2) Upload option images (optional)
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

          // Delete old option image if it exists
          if (oldS3Key) {
            try {
              await this.storageService.deleteFile(oldS3Key);
            } catch (error) {
              this.logger.warn(
                colors.yellow(
                  `[TEACHER] Failed to delete old option image: ${oldS3Key}`,
                ),
              );
            }
          }

          // Find or create option update in DTO
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

      // 3) Call smart merge update
      const result = await this.updateTeacherQuestion(
        assessmentId,
        questionId,
        updateQuestionDto,
        user,
      );

      return result;
    } catch (error) {
      // Rollback: delete all newly uploaded files
      for (const s3Key of uploadedFiles) {
        try {
          await this.storageService.deleteFile(s3Key);
        } catch (rollbackError) {
          this.logger.warn(
            colors.yellow(
              `[TEACHER] Failed to rollback file: ${s3Key}`,
            ),
          );
        }
      }

      throw error;
    }
  }

  // ========================================
  // DELETE QUESTION FROM ASSESSMENT
  // ========================================

  /**
   * Delete a question from a teacher assessment.
   * Mirrors `SchoolAssessmentService.deleteSchoolQuestion(...)` logic,
   * but enforces teacher subject access using this module's teacher model.
   */
  async deleteTeacherAssessmentQuestion(
    assessmentId: string,
    questionId: string,
    user: any,
  ) {
    this.logger.log(
      colors.cyan(
        `[TEACHER] Deleting question: ${questionId} from assessment: ${assessmentId}`,
      ),
    );

    const userId = user?.sub || user?.id;
    const schoolId = user?.school_id;

    if (!userId || !schoolId) {
      throw new BadRequestException('Invalid teacher authentication data');
    }

    // 1) Fetch assessment and verify it belongs to the teacher's school
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, school_id: schoolId },
      select: { id: true, status: true, subject_id: true },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // 2) Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot delete questions from a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    // 3) Teacher subject access check (teacher must teach assessment.subject_id)
    const teacher = await this.prisma.teacher.findFirst({
      where: { user_id: userId },
      include: {
        subjectsTeaching: { select: { subjectId: true } },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherSubjectIds = teacher.subjectsTeaching.map(
      (st: any) => st.subjectId,
    );

    if (!teacherSubjectIds.includes(assessment.subject_id)) {
      throw new ForbiddenException(
        'You do not have access to delete from this assessment',
      );
    }

    // 4) Fetch question with options to clean up media (best-effort)
    const question = await this.prisma.assessmentQuestion.findFirst({
      where: { id: questionId, assessment_id: assessmentId },
      include: { options: true },
    });

    if (!question) {
      this.logger.error(colors.red(`Question not found: ${questionId}`));
      throw new NotFoundException('Question not found');
    }

    // 5) Delete question and then clean up media + recalculate total_points
    await this.prisma.$transaction(async (tx) => {
      // DB deletion (cascade delete should remove options/correct_answers/responses)
      await tx.assessmentQuestion.delete({
        where: { id: questionId },
      });

      const mediaToDelete: string[] = [];

      // Question media
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

      // Option media
      for (const option of question.options) {
        if (option.image_s3_key) {
          mediaToDelete.push(option.image_s3_key);
        }

        if (option.audio_url) {
          const urlMatch = option.audio_url.match(/\/([^\/]+)$/);
          if (urlMatch) mediaToDelete.push(urlMatch[1]);
        }
      }

      // Best-effort delete media from S3
      for (const key of mediaToDelete) {
        try {
          await this.storageService.deleteFile(key);
          this.logger.log(colors.green(`[TEACHER] ✅ Deleted media file: ${key}`));
        } catch (error: any) {
          const errMsg = error?.message ?? String(error);
          this.logger.warn(
            colors.yellow(
              `[TEACHER] ⚠️ Failed to delete media file: ${key} - ${errMsg}`,
            ),
          );
        }
      }

      // Recalculate assessment total_points
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
      colors.green(`[TEACHER] ✅ Successfully deleted question: ${questionId}`),
    );

    return ResponseHelper.success('Question deleted successfully', {
      assessment_id: assessmentId,
      deleted_question_id: questionId,
      message: 'Question and all associated media have been removed',
    });
  }
}
