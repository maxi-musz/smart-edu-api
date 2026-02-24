import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../shared/services/providers/storage.service';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';
import * as colors from 'colors';
import { CreateNewAssessmentDto, GetAssessmentsQueryDto, UpdateAssessmentDto, SubmitAssessmentDto, DuplicateAssessmentDto, AddQuestionsDto, UpdateQuestionDto } from '../dto';
import { AssessmentType, Prisma, QuestionType, DifficultyLevel } from '@prisma/client';
import { UserContext, LibraryAssessmentContext, StatusAnalytics } from './assessment.types';
import { AssessmentGradingService } from './assessment-grading.service';

/**
 * School Assessment Service
 * 
 * Handles all school-specific assessment operations:
 * - Create school assessments
 * - Get school assessments (list and details)
 * - Update school assessments
 * - Get questions for students/teachers
 * - Submit assessments
 * - Upload question images
 */
@Injectable()
export class SchoolAssessmentService {
  private readonly logger = new Logger(SchoolAssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly gradingService: AssessmentGradingService,
  ) {}

  // ========================================
  // CREATE ASSESSMENT
  // ========================================

  /**
   * Create a school assessment (for teachers/directors/admins)
   */
  async createSchoolAssessment(
    createAssessmentDto: CreateNewAssessmentDto,
    userContext: UserContext,
    libraryContext?: LibraryAssessmentContext
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Creating School Assessment: ${createAssessmentDto.title}`));

    let schoolId: string;
    let academicSessionId: string;
    let createdByUserId: string;

    if (libraryContext) {
      // Library owner creating on behalf of a school
      const school = await this.prisma.school.findUnique({
        where: { id: libraryContext.schoolId },
        include: {
          academicSessions: {
            where: { is_current: true },
            take: 1,
          },
          subjects: {
            where: { id: createAssessmentDto.subject_id },
            include: {
              topics: createAssessmentDto.topic_id
                ? { where: { id: createAssessmentDto.topic_id }, take: 1 }
                : false,
            },
          },
        },
      });

      if (!school) {
        this.logger.error(colors.red(`School not found: ${libraryContext.schoolId}`));
        throw new NotFoundException('School not found');
      }
      if (school.academicSessions.length === 0) {
        this.logger.error(colors.red(`No current academic session found for school: ${libraryContext.schoolId}`));
        throw new BadRequestException('No current academic session found for the school');
      }
      if (school.subjects.length === 0) {
        this.logger.error(colors.red(`Subject not found: ${createAssessmentDto.subject_id} for school: ${libraryContext.schoolId}`));
        throw new NotFoundException('Subject not found or does not belong to the school');
      }
      if (createAssessmentDto.topic_id && school.subjects[0].topics?.length === 0) {
        this.logger.error(colors.red(`Topic not found: ${createAssessmentDto.topic_id} for subject: ${createAssessmentDto.subject_id}`));
        throw new NotFoundException('Topic not found or does not belong to the subject');
      }

      schoolId = school.id;
      academicSessionId = school.academicSessions[0].id;

      // Resolve createdByUserId
      if (libraryContext.createdByUserId) {
        const u = await this.prisma.user.findFirst({
          where: { id: libraryContext.createdByUserId, school_id: schoolId },
        });
        if (!u) {
          this.logger.error(colors.red(`created_by_user_id ${libraryContext.createdByUserId} does not belong to school: ${schoolId}`));
          throw new BadRequestException('created_by_user_id does not belong to this school');
        }
        createdByUserId = u.id;
      } else {
        const director = await this.prisma.user.findFirst({
          where: { school_id: schoolId, role: 'school_director' },
        });
        if (!director) {
          this.logger.error(colors.red(`School ${schoolId} has no director`));
          throw new BadRequestException('School has no director; provide created_by_user_id');
        }
        createdByUserId = director.id;
      }
    } else if (userContext.type === 'school_director' || userContext.type === 'school_admin') {
      // Director/Admin: Unrestricted access to all subjects in their school
      this.logger.log(colors.cyan(`User is ${userContext.type} - unrestricted subject access`));

      const school = await this.prisma.school.findUnique({
        where: { id: userContext.schoolId },
        include: {
          academicSessions: {
            where: { is_current: true },
            take: 1,
          },
          subjects: {
            where: { id: createAssessmentDto.subject_id },
            include: {
              topics: createAssessmentDto.topic_id
                ? { where: { id: createAssessmentDto.topic_id }, take: 1 }
                : false,
            },
          },
        },
      });

      if (!school) {
        this.logger.error(colors.red(`School not found: ${userContext.schoolId}`));
        throw new NotFoundException('School not found');
      }
      if (school.academicSessions.length === 0) {
        this.logger.error(colors.red(`No current academic session found for school: ${userContext.schoolId}`));
        throw new BadRequestException('No current academic session found for the school');
      }
      if (school.subjects.length === 0) {
        this.logger.error(colors.red(`Subject not found: ${createAssessmentDto.subject_id} for school: ${userContext.schoolId}`));
        throw new NotFoundException('Subject not found or does not belong to the school');
      }
      if (createAssessmentDto.topic_id && school.subjects[0].topics?.length === 0) {
        this.logger.error(colors.red(`Topic not found: ${createAssessmentDto.topic_id} for subject: ${createAssessmentDto.subject_id}`));
        throw new NotFoundException('Topic not found or does not belong to the subject');
      }

      schoolId = school.id;
      academicSessionId = school.academicSessions[0].id;
      createdByUserId = userContext.userId;
    } else {
      // Teacher: Must have access to the subject
      const teacher = await this.prisma.teacher.findFirst({
        where: { user_id: userContext.userId },
        include: {
          subjectsTeaching: {
            where: { subjectId: createAssessmentDto.subject_id },
            include: {
              subject: {
                include: {
                  topics: createAssessmentDto.topic_id
                    ? { where: { id: createAssessmentDto.topic_id }, take: 1 }
                    : false,
                },
              },
            },
          },
        },
      });

      if (!teacher) {
        this.logger.error(colors.red(`Teacher not found: ${userContext.userId}`));
        throw new NotFoundException('Teacher not found');
      }
      if (teacher.subjectsTeaching.length === 0) {
        this.logger.error(colors.red(`Teacher ${userContext.userId} does not have access to subject: ${createAssessmentDto.subject_id}`));
        throw new ForbiddenException('Teacher does not have access to this subject');
      }
      if (createAssessmentDto.topic_id && teacher.subjectsTeaching[0].subject.topics?.length === 0) {
        this.logger.error(colors.red(`Teacher ${userContext.userId} does not have access to topic: ${createAssessmentDto.topic_id}`));
        throw new ForbiddenException('Teacher does not have access to this topic or topic does not exist');
      }

      schoolId = teacher.school_id;
      academicSessionId = teacher.academic_session_id;
      createdByUserId = userContext.userId;
    }

    // Create the school assessment
    const assessment = await this.prisma.assessment.create({
      data: {
        title: createAssessmentDto.title,
        description: createAssessmentDto.description,
        instructions: createAssessmentDto.instructions,
        subject_id: createAssessmentDto.subject_id,
        topic_id: createAssessmentDto.topic_id || null,
        school_id: schoolId,
        academic_session_id: academicSessionId,
        created_by: createdByUserId,
        duration: createAssessmentDto.duration,
        max_attempts: createAssessmentDto.max_attempts || 1,
        passing_score: createAssessmentDto.passing_score || 50.0,
        total_points: createAssessmentDto.total_points || 100.0,
        shuffle_questions: createAssessmentDto.shuffle_questions || false,
        shuffle_options: createAssessmentDto.shuffle_options || false,
        show_correct_answers: createAssessmentDto.show_correct_answers || false,
        show_feedback: createAssessmentDto.show_feedback !== false,
        allow_review: createAssessmentDto.allow_review !== false,
        start_date: createAssessmentDto.start_date ? new Date(createAssessmentDto.start_date) : null,
        end_date: createAssessmentDto.end_date ? new Date(createAssessmentDto.end_date) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        time_limit: createAssessmentDto.time_limit,
        grading_type: createAssessmentDto.grading_type || 'AUTOMATIC',
        auto_submit: createAssessmentDto.auto_submit || false,
        assessment_type: (createAssessmentDto.assessment_type as AssessmentType) || AssessmentType.CBT,
        tags: createAssessmentDto.tags || [],
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

    this.logger.log(colors.green(`[SCHOOL] Assessment created successfully: ${assessment.id}`));
    return ResponseHelper.success('School assessment created successfully', {
      ...assessment,
      assessmentContext: 'school',
    });
  }

  // ========================================
  // GET ALL ASSESSMENTS
  // ========================================

  /**
   * Get all school assessments with role-based filtering
   */
  async getAllSchoolAssessments(
    query: GetAssessmentsQueryDto,
    userContext: UserContext
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Fetching school assessments for user: ${userContext.userId}`));

    // Get current academic session if not specified
    let academicSessionId = query.academic_session_id;
    if (!academicSessionId) {
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: userContext.schoolId,
          is_current: true,
          ...(query.term ? { term: query.term } : {}),
        },
      });

      if (!currentSession) {
        this.logger.error(colors.red(`No current academic session found for school: ${userContext.schoolId}`));
        throw new BadRequestException('No current academic session found');
      }
      academicSessionId = currentSession.id;
    }

    // Build base where clause
    const baseWhere: Prisma.AssessmentWhereInput = {
      school_id: userContext.schoolId,
      academic_session_id: academicSessionId,
    };

    // Apply optional filters
    if (query.subject_id) baseWhere.subject_id = query.subject_id;
    if (query.topic_id) baseWhere.topic_id = query.topic_id;
    if (query.status) baseWhere.status = query.status;
    if (query.assessment_type) baseWhere.assessment_type = query.assessment_type;
    if (query.is_published !== undefined) baseWhere.is_published = query.is_published;
    if (query.created_by) baseWhere.created_by = query.created_by;

    // Apply search filter
    if (query.search) {
      baseWhere.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Role-specific filtering
    let whereClause: Prisma.AssessmentWhereInput = { ...baseWhere };

    if (userContext.type === 'school_director' || userContext.type === 'school_admin') {
      // Directors/Admins: See all assessments in the school
      this.logger.log(colors.cyan(`${userContext.type} - returning all school assessments`));
    } else if (userContext.type === 'teacher') {
      // Teacher: Only assessments for subjects/topics they teach
      this.logger.log(colors.cyan(`Teacher - filtering by assigned subjects`));
      
      const teacher = await this.prisma.teacher.findFirst({
        where: { user_id: userContext.userId },
        include: {
          subjectsTeaching: {
            select: { subjectId: true },
          },
        },
      });

      if (!teacher) {
        this.logger.error(colors.red(`Teacher record not found for user: ${userContext.userId}`));
        throw new NotFoundException('Teacher not found');
      }

      const teacherSubjectIds = teacher.subjectsTeaching.map(st => st.subjectId);
      
      if (teacherSubjectIds.length === 0) {
        return ResponseHelper.success('Assessments fetched successfully', {
          assessments: [],
          pagination: {
            page: query.page,
            limit: query.limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      whereClause.subject_id = { in: teacherSubjectIds };
    } else if (userContext.type === 'student') {
      // Student: Only published/closed assessments for subjects in their class
      this.logger.log(colors.cyan(`Student - filtering by class subjects, published/closed only`));

      const student = await this.prisma.student.findFirst({
        where: { user_id: userContext.userId },
        include: {
          current_class: {
            include: {
              subjects: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (!student) {
        this.logger.error(colors.red(`Student record not found for user: ${userContext.userId}`));
        throw new NotFoundException('Student not found');
      }

      if (!student.current_class) {
        this.logger.error(colors.red(`Student ${userContext.userId} is not assigned to a class`));
        throw new BadRequestException('Student is not assigned to any class');
      }

      const classSubjectIds = student.current_class.subjects.map(s => s.id);
      
      if (classSubjectIds.length === 0) {
        return ResponseHelper.success('Assessments fetched successfully', {
          assessments: [],
          pagination: {
            page: query.page,
            limit: query.limit,
            total: 0,
            totalPages: 0,
          },
        });
      }

      whereClause.subject_id = { in: classSubjectIds };
      whereClause.OR = [
        { status: 'PUBLISHED' },
        { status: 'CLOSED' },
      ];
      whereClause.is_published = true;
    }

    // Build analytics where clause (without status filter)
    const analyticsWhere: Prisma.AssessmentWhereInput = { ...whereClause };
    delete analyticsWhere.status;
    delete analyticsWhere.is_published;

    // Log the where clauses for debugging
    this.logger.log(colors.magenta(`[SCHOOL] Where clause for assessments: ${JSON.stringify(whereClause)}`));
    this.logger.log(colors.magenta(`[SCHOOL] Where clause for analytics: ${JSON.stringify(analyticsWhere)}`));

    // Execute count, find, status analytics, and recent sessions in parallel
    const [total, assessments, statusCounts, recentSessions] = await Promise.all([
      this.prisma.assessment.count({ where: whereClause }),
      this.prisma.assessment.findMany({
        where: whereClause,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit,
        orderBy: { [query.sort_by!]: query.sort_order },
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
      // Fetch last 5 academic sessions/terms for the school
      this.prisma.academicSession.findMany({
        where: { school_id: userContext.schoolId },
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

    // Detailed logging for debugging
    // this.logger.log(colors.yellow(`[SCHOOL] ========== ASSESSMENT QUERY DEBUG ==========`));
    // this.logger.log(colors.yellow(`[SCHOOL] Academic Session ID: ${academicSessionId}`));
    // this.logger.log(colors.yellow(`[SCHOOL] School ID: ${userContext.schoolId}`));
    // this.logger.log(colors.yellow(`[SCHOOL] User Role: ${userContext.type}`));
    // this.logger.log(colors.yellow(`[SCHOOL] Applied Filters: ${JSON.stringify({
    //   status: query.status || 'none',
    //   subject_id: query.subject_id || 'none',
    //   topic_id: query.topic_id || 'none',
    //   is_published: query.is_published,
    //   search: query.search || 'none',
    // })}`));
    // this.logger.log(colors.yellow(`[SCHOOL] ---------- ANALYTICS ----------`));
    // this.logger.log(colors.yellow(`[SCHOOL] All: ${statusAnalytics.all}`));
    // this.logger.log(colors.yellow(`[SCHOOL] Draft: ${statusAnalytics.draft}`));
    // this.logger.log(colors.yellow(`[SCHOOL] Published: ${statusAnalytics.published}`));
    // this.logger.log(colors.yellow(`[SCHOOL] Active: ${statusAnalytics.active}`));
    // this.logger.log(colors.yellow(`[SCHOOL] Closed: ${statusAnalytics.closed}`));
    // this.logger.log(colors.yellow(`[SCHOOL] Archived: ${statusAnalytics.archived}`));
    // this.logger.log(colors.yellow(`[SCHOOL] ---------- RESULTS ----------`));
    // this.logger.log(colors.yellow(`[SCHOOL] Total matching (with filters): ${total}`));
    // this.logger.log(colors.yellow(`[SCHOOL] Assessments returned: ${assessments.length}`));
    // this.logger.log(colors.yellow(`[SCHOOL] Page: ${query.page}/${totalPages}`));
    // if (assessments.length > 0) {
    //   this.logger.log(colors.yellow(`[SCHOOL] First assessment: ${assessments[0].title} (status: ${assessments[0].status})`));
    // }
    // this.logger.log(colors.yellow(`[SCHOOL] ==========================================`));

    this.logger.log(colors.green(`[SCHOOL] Fetched ${assessments.length} assessments (page ${query.page}/${totalPages})`));
    
    // Log full response data for debugging
    const responseData = {
      analytics: statusAnalytics,
      sessions: recentSessions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
      assessments,
    };
    // this.logger.log(colors.cyan(`[SCHOOL] ========== FULL RESPONSE DATA ==========`));
    // this.logger.log(colors.cyan(`[SCHOOL] Response: ${JSON.stringify(responseData, null, 2)}`));
    // this.logger.log(colors.cyan(`[SCHOOL] ==========================================`));

    return ResponseHelper.success('Assessments fetched successfully', responseData);
  }

  // ========================================
  // GET ASSESSMENT DETAILS
  // ========================================

  /**
   * Get school assessment details by ID
   */
  async getSchoolAssessmentDetails(
    assessmentId: string,
    userContext: UserContext
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Getting assessment details: ${assessmentId}`));

    // Fetch the assessment first to verify access
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: userContext.schoolId,
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
      this.logger.error(colors.red(`Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // Role-based access verification
    if (userContext.type === 'teacher') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { user_id: userContext.userId },
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
    } else if (userContext.type === 'student') {
      const student = await this.prisma.student.findFirst({
        where: { user_id: userContext.userId },
        include: {
          current_class: {
            include: {
              subjects: {
                where: { id: assessment.subject_id },
              },
            },
          },
        },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      if (!student.current_class || student.current_class.subjects.length === 0) {
        throw new ForbiddenException('You do not have access to this assessment');
      }

      if (!assessment.is_published) {
        throw new ForbiddenException('This assessment is not available');
      }

      // For students, return limited view
      return this.getStudentAssessmentView(assessment, student, userContext);
    }

    // For Director/Admin/Teacher: Get full details
    return this.getFullAssessmentDetails(assessment, userContext);
  }

  /**
   * Get full assessment details for teachers/directors/admins
   */
  private async getFullAssessmentDetails(assessment: any, userContext: UserContext) {
    this.logger.log(colors.cyan(`Fetching full assessment details for: ${assessment.id}`));

    const currentSession = await this.prisma.academicSession.findFirst({
      where: {
        school_id: userContext.schoolId,
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
          school_id: userContext.schoolId,
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
          schoolId: userContext.schoolId,
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

    const classIds = classesWithSubject.map(cls => cls.id);
    const allStudents = classIds.length > 0 ? await this.prisma.student.findMany({
      where: {
        school_id: userContext.schoolId,
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
    }) : [];

    const attemptsByStudent = new Map<string, any[]>();
    attempts.forEach(attempt => {
      const studentId = attempt.student?.id || 'unknown';
      if (!attemptsByStudent.has(studentId)) {
        attemptsByStudent.set(studentId, []);
      }
      attemptsByStudent.get(studentId)!.push(attempt);
    });

    const studentsWithAttempts = allStudents.map(student => {
      const studentAttempts = attemptsByStudent.get(student.user.id) || [];
      const bestAttempt = studentAttempts.length > 0
        ? studentAttempts.reduce((best, current) => 
            (current.percentage || 0) > (best.percentage || 0) ? current : best
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
        attempts: studentAttempts.map(a => ({
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

    const studentsAttempted = studentsWithAttempts.filter(s => s.hasAttempted).length;
    const studentsNotAttempted = studentsWithAttempts.filter(s => !s.hasAttempted).length;

    this.logger.log(colors.green(`Assessment details retrieved: ${questions.length} questions, ${attempts.length} attempts`));

    return ResponseHelper.success('Assessment details retrieved successfully', {
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
          completionRate: allStudents.length > 0 
            ? Math.round((studentsAttempted / allStudents.length) * 100) 
            : 0,
          classes: classesWithSubject,
        },
        students: studentsWithAttempts,
      },
    });
  }

  /**
   * Get limited assessment view for students
   */
  private async getStudentAssessmentView(assessment: any, student: any, userContext: UserContext) {
    this.logger.log(colors.cyan(`Fetching student assessment view for: ${assessment.id}`));

    const currentSession = await this.prisma.academicSession.findFirst({
      where: {
        school_id: userContext.schoolId,
        is_current: true,
      },
    });

    if (!currentSession) {
      throw new BadRequestException('No current academic session found');
    }

    const myAttempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        assessment_id: assessment.id,
        student_id: userContext.userId,
        school_id: userContext.schoolId,
        academic_session_id: currentSession.id,
      },
      orderBy: { submitted_at: 'desc' },
    });

    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { assessment_id: assessment.id },
      include: {
        options: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            option_text: true,
            order: true,
            ...(assessment.show_correct_answers && myAttempts.some(a => a.status === 'SUBMITTED' || a.status === 'GRADED')
              ? { is_correct: true }
              : {}),
          },
        },
        ...(assessment.show_correct_answers && myAttempts.some(a => a.status === 'SUBMITTED' || a.status === 'GRADED')
          ? { correct_answers: true }
          : {}),
      },
      orderBy: { order: 'asc' },
    });

    const bestAttempt = myAttempts.length > 0
      ? myAttempts.reduce((best, current) => 
          (current.percentage || 0) > (best.percentage || 0) ? current : best
        )
      : null;

    const canAttempt = assessment.status === 'PUBLISHED' 
      && assessment.is_published 
      && myAttempts.length < assessment.max_attempts
      && (!assessment.end_date || new Date(assessment.end_date) > new Date());

    this.logger.log(colors.green(`Student assessment view retrieved: ${questions.length} questions, ${myAttempts.length} attempts`));

    return ResponseHelper.success('Assessment details retrieved successfully', {
      assessment: {
        ...assessment,
        submissions: undefined,
      },
      questions: {
        total: questions.length,
        items: questions,
      },
      myProgress: {
        totalAttempts: myAttempts.length,
        maxAttempts: assessment.max_attempts,
        remainingAttempts: Math.max(0, assessment.max_attempts - myAttempts.length),
        canAttempt,
        bestScore: bestAttempt?.percentage || null,
        passed: bestAttempt?.passed || false,
        attempts: myAttempts.map(a => ({
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
          grade_letter: a.grade_letter,
        })),
      },
    });
  }

  // ========================================
  // UPDATE ASSESSMENT
  // ========================================

  /**
   * Update a school assessment
   */
  async updateSchoolAssessment(
    assessmentId: string,
    updateDto: UpdateAssessmentDto,
    userContext: UserContext
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Updating assessment: ${assessmentId}`));

    const whereClause: Prisma.AssessmentWhereInput = {
      id: assessmentId,
      school_id: userContext.schoolId,
    };

    if (userContext.type === 'teacher') {
      whereClause.created_by = userContext.userId;
    }

    const existingAssessment = await this.prisma.assessment.findFirst({
      where: whereClause,
      select: {
        id: true,
        status: true,
        is_published: true,
        subject_id: true,
        topic_id: true,
        end_date: true,
        school_id: true,
        title: true,
      },
    });

    if (!existingAssessment) {
      this.logger.error(colors.red(`Assessment not found or access denied: ${assessmentId}`));
      throw new NotFoundException('Assessment not found or you do not have permission to update it');
    }

    const publishedStatuses = ['PUBLISHED', 'ACTIVE'];
    if (publishedStatuses.includes(existingAssessment.status)) {
      this.logger.warn(colors.yellow(`Cannot update published assessment: ${assessmentId} (status: ${existingAssessment.status})`));
      throw new BadRequestException(
        `Cannot update assessment with status "${existingAssessment.status}". Change status to DRAFT first to make modifications.`
      );
    }

    // Validate subject_id if being changed
    if (updateDto.subject_id && updateDto.subject_id !== existingAssessment.subject_id) {
      const subject = await this.prisma.subject.findFirst({
        where: {
          id: updateDto.subject_id,
          schoolId: userContext.schoolId,
        },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found in this school');
      }

      if (userContext.type === 'teacher') {
        const teacherSubject = await this.prisma.teacherSubject.findFirst({
          where: {
            teacher: { user_id: userContext.userId },
            subjectId: updateDto.subject_id,
          },
        });

        if (!teacherSubject) {
          throw new ForbiddenException('You do not teach this subject');
        }
      }
    }

    // Validate topic_id if being changed
    if (updateDto.topic_id && updateDto.topic_id !== existingAssessment.topic_id) {
      const effectiveSubjectId = updateDto.subject_id || existingAssessment.subject_id;
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: updateDto.topic_id,
          subject_id: effectiveSubjectId,
        },
      });

      if (!topic) {
        throw new NotFoundException('Topic not found or does not belong to the specified subject');
      }
    }

    // Build update data
    const updateData: any = {};

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
        updateData[field] = updateDto[field];
      }
    }

    if (updateDto.start_date) {
      updateData.start_date = new Date(updateDto.start_date);
    }
    if (updateDto.end_date) {
      updateData.end_date = new Date(updateDto.end_date);
    }

    if (updateDto.status) {
      const isBeingPublished = ['PUBLISHED', 'ACTIVE'].includes(updateDto.status) && !existingAssessment.is_published;

      if (isBeingPublished) {
        const effectiveEndDate = updateData.end_date ?? existingAssessment.end_date;
        if (effectiveEndDate && new Date(effectiveEndDate) < new Date()) {
          throw new BadRequestException(
            'Cannot publish an assessment that has already expired. Please set an end date in the future first.'
          );
        }
        updateData.is_published = true;
        updateData.published_at = new Date();
      }

      const isBeingUnpublished = updateDto.status === 'DRAFT' && existingAssessment.is_published;
      if (isBeingUnpublished) {
        updateData.is_published = false;
      }
    }

    if (updateData.assessment_type === '' || updateData.assessment_type === undefined) {
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

    this.logger.log(colors.green(`[SCHOOL] Assessment updated successfully: ${assessmentId}`));

    return ResponseHelper.success('Assessment updated successfully', {
      assessment: updatedAssessment,
      assessmentContext: 'school',
    });
  }

  // ========================================
  // GET QUESTIONS (FOR TAKING)
  // ========================================

  /**
   * Get school assessment questions for a student
   */
  async getSchoolAssessmentQuestions(assessmentId: string, userContext: UserContext) {
    this.logger.log(colors.cyan(`[SCHOOL STUDENT] Fetching assessment questions: ${assessmentId}`));

    const student = await this.prisma.student.findFirst({
      where: {
        user_id: userContext.userId,
        school_id: userContext.schoolId,
      },
      select: {
        id: true,
        current_class_id: true,
        school_id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (!student.current_class_id) {
      throw new BadRequestException('Student is not assigned to any class');
    }

    const currentSession = await this.prisma.academicSession.findFirst({
      where: {
        school_id: student.school_id,
        is_current: true,
      },
    });

    if (!currentSession) {
      throw new BadRequestException('No current academic session found');
    }

    const studentClass = await this.prisma.class.findUnique({
      where: { id: student.current_class_id },
      include: {
        subjects: {
          where: { academic_session_id: currentSession.id },
          select: { id: true },
        },
      },
    });

    if (!studentClass) {
      throw new NotFoundException('Student class not found');
    }

    const subjectIds = studentClass.subjects.map(s => s.id);

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: student.school_id,
        academic_session_id: currentSession.id,
        subject_id: { in: subjectIds },
        status: { in: ['PUBLISHED', 'ACTIVE'] },
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
              select: { id: true, option_text: true, order: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found or not available');
    }

    // Validate date range
    const now = new Date();
    if (assessment.start_date && assessment.start_date > now) {
      throw new BadRequestException('Assessment has not started yet');
    }

    if (assessment.end_date && assessment.end_date < now) {
      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: { status: 'CLOSED' },
      }).catch(() => {});
      throw new BadRequestException('Assessment has expired');
    }

    const attemptCount = await this.prisma.assessmentAttempt.count({
      where: {
        assessment_id: assessmentId,
        student_id: student.id,
      },
    });

    if (attemptCount >= assessment.max_attempts) {
      throw new ForbiddenException('Maximum attempts reached for this assessment');
    }

    const questions = assessment.questions.map(q => {
      let options = q.options.map(o => ({
        id: o.id,
        text: o.option_text,
        order: o.order,
      }));

      if (assessment.shuffle_options) {
        options = this.gradingService.shuffleArray(options);
      }

      return {
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        points: q.points,
        order: q.order,
        image_url: q.image_url,
        audio_url: q.audio_url,
        video_url: q.video_url,
        is_required: q.is_required,
        options,
      };
    });

    const finalQuestions = assessment.shuffle_questions 
      ? this.gradingService.shuffleArray(questions) 
      : questions;

    this.logger.log(colors.green(`[SCHOOL STUDENT] Questions retrieved: ${finalQuestions.length}`));

    return ResponseHelper.success('Assessment questions retrieved successfully', {
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
        auto_submit: assessment.auto_submit,
        start_date: assessment.start_date,
        end_date: assessment.end_date,
        subject: assessment.subject,
        teacher: {
          id: assessment.createdBy.id,
          name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`,
        },
      },
      questions: finalQuestions,
      total_questions: finalQuestions.length,
      student_attempts: attemptCount,
      remaining_attempts: assessment.max_attempts - attemptCount,
      assessmentContext: 'school',
    });
  }

  /**
   * Get school assessment questions for preview (teachers/directors/admins)
   */
  async getSchoolAssessmentQuestionsForPreview(assessmentId: string, userContext: UserContext) {
    this.logger.log(colors.cyan(`[SCHOOL PREVIEW] Fetching assessment questions: ${assessmentId}`));

    const whereClause: Prisma.AssessmentWhereInput = {
      id: assessmentId,
      school_id: userContext.schoolId,
    };

    if (userContext.type === 'teacher') {
      const teacherSubjects = await this.prisma.teacherSubject.findMany({
        where: { teacher: { user_id: userContext.userId } },
        select: { subjectId: true },
      });
      const subjectIds = teacherSubjects.map(ts => ts.subjectId);
      whereClause.OR = [
        { created_by: userContext.userId },
        { subject_id: { in: subjectIds } },
      ];
    }

    const assessment = await this.prisma.assessment.findFirst({
      where: whereClause,
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
              select: { id: true, option_text: true, is_correct: true, order: true },
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
      throw new NotFoundException('Assessment not found or you do not have access');
    }

    const questions = assessment.questions.map(q => ({
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
      options: q.options.map(o => ({
        id: o.id,
        text: o.option_text,
        is_correct: o.is_correct,
        order: o.order,
      })),
      correct_answers: q.correct_answers.map(ca => ({
        id: ca.id,
        answer_text: ca.answer_text,
        option_ids: ca.option_ids,
      })),
    }));

    this.logger.log(colors.green(`[SCHOOL PREVIEW] Questions retrieved: ${questions.length}`));

    return ResponseHelper.success('Assessment questions retrieved successfully (preview mode)', {
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
    });
  }

  // ========================================
  // SUBMIT ASSESSMENT
  // ========================================

  /**
   * Submit school assessment
   */
  async submitSchoolAssessment(
    assessmentId: string,
    submitDto: SubmitAssessmentDto,
    userContext: UserContext
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Submitting assessment: ${assessmentId}`));

    const student = await this.prisma.student.findFirst({
      where: {
        user_id: userContext.userId,
        school_id: userContext.schoolId,
      },
      select: {
        id: true,
        current_class_id: true,
        school_id: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const currentSession = await this.prisma.academicSession.findFirst({
      where: {
        school_id: student.school_id,
        is_current: true,
      },
    });

    if (!currentSession) {
      throw new BadRequestException('No current academic session found');
    }

    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: student.school_id,
        academic_session_id: currentSession.id,
        status: { in: ['PUBLISHED', 'ACTIVE'] },
      },
      include: {
        questions: {
          include: {
            correct_answers: true,
            options: {
              select: { id: true, is_correct: true },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found or not available');
    }

    const attemptCount = await this.prisma.assessmentAttempt.count({
      where: {
        assessment_id: assessmentId,
        student_id: userContext.userId,
      },
    });

    if (attemptCount >= assessment.max_attempts) {
      throw new ForbiddenException('Maximum attempts reached for this assessment');
    }

    const normalizedAnswers = this.gradingService.normalizeAnswers(submitDto.answers);

    const { gradedAnswers, totalScore, totalPoints } = this.gradingService.gradeSchoolAnswers(
      normalizedAnswers,
      assessment.questions
    );

    const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
    const passed = percentage >= assessment.passing_score;
    const grade = this.gradingService.calculateGrade(percentage);
    const timeSpent = submitDto.time_taken || 0;

    const result = await this.prisma.$transaction(async (tx) => {
      const attempt = await tx.assessmentAttempt.create({
        data: {
          assessment_id: assessmentId,
          student_id: userContext.userId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          attempt_number: attemptCount + 1,
          status: 'GRADED',
          started_at: new Date(),
          submitted_at: submitDto.submission_time ? new Date(submitDto.submission_time) : new Date(),
          time_spent: timeSpent,
          total_score: totalScore,
          max_score: assessment.total_points,
          percentage: percentage,
          passed: passed,
          is_graded: true,
          graded_at: new Date(),
          grade_letter: grade,
        },
      });

      const responses = await Promise.all(
        gradedAnswers.map((answer) =>
          tx.assessmentResponse.create({
            data: {
              attempt_id: attempt.id,
              question_id: answer.question_id,
              student_id: userContext.userId,
              text_answer: answer.text_answer || null,
              numeric_answer: answer.numeric_answer || null,
              date_answer: answer.date_answer || null,
              selected_options: answer.selected_options || [],
              is_correct: answer.is_correct,
              points_earned: answer.points_earned,
              max_points: answer.max_points,
            },
          })
        )
      );

      return { attempt, responses };
    });

    this.logger.log(colors.green(`[SCHOOL] Assessment submitted: ${totalScore}/${totalPoints} (${percentage.toFixed(1)}%)`));

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
      submitted_at: result.attempt.submitted_at,
      time_spent: timeSpent,
      attempt_number: result.attempt.attempt_number,
      remaining_attempts: assessment.max_attempts - (attemptCount + 1),
      assessmentContext: 'school',
    });
  }

  // ========================================
  // DUPLICATE ASSESSMENT
  // ========================================

  /**
   * Duplicate a school assessment
   * Creates a copy of an existing assessment with a new title.
   * Optionally shuffles questions and/or options.
   */
  async duplicateSchoolAssessment(
    assessmentId: string,
    duplicateDto: DuplicateAssessmentDto,
    userContext: UserContext
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Duplicating assessment: ${assessmentId}`));

    // Fetch source assessment with all questions and options
    const sourceAssessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: userContext.schoolId,
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
      this.logger.error(colors.red(`Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // Role-based access check for teachers
    if (userContext.type === 'teacher') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { user_id: userContext.userId },
        include: {
          subjectsTeaching: {
            select: { subjectId: true },
          },
        },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const teacherSubjectIds = teacher.subjectsTeaching.map(st => st.subjectId);
      if (!teacherSubjectIds.includes(sourceAssessment.subject_id)) {
        throw new ForbiddenException('You do not have access to duplicate this assessment');
      }
    }

    // Get current academic session
    const currentSession = await this.prisma.academicSession.findFirst({
      where: {
        school_id: userContext.schoolId,
        is_current: true,
      },
    });

    if (!currentSession) {
      throw new BadRequestException('No current academic session found');
    }

    // Prepare questions with optional shuffling
    let questions = [...sourceAssessment.questions];
    if (duplicateDto.shuffle_questions) {
      questions = this.gradingService.shuffleArray(questions);
    }

    // Create the new assessment with questions in a transaction
    const newAssessment = await this.prisma.$transaction(async (tx) => {
      // Create the assessment
      const assessment = await tx.assessment.create({
        data: {
          school_id: userContext.schoolId!,
          academic_session_id: currentSession.id,
          subject_id: sourceAssessment.subject_id,
          topic_id: sourceAssessment.topic_id,
          created_by: userContext.userId,
          title: duplicateDto.new_title,
          description: duplicateDto.new_description || sourceAssessment.description,
          instructions: sourceAssessment.instructions,
          assessment_type: sourceAssessment.assessment_type,
          grading_type: sourceAssessment.grading_type,
          duration: sourceAssessment.duration,
          max_attempts: sourceAssessment.max_attempts,
          passing_score: sourceAssessment.passing_score,
          total_points: sourceAssessment.total_points,
          shuffle_questions: duplicateDto.shuffle_questions || sourceAssessment.shuffle_questions,
          shuffle_options: duplicateDto.shuffle_options || sourceAssessment.shuffle_options,
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

      // Create questions with their options and correct answers
      for (let i = 0; i < questions.length; i++) {
        const sourceQuestion = questions[i];

        // Prepare options with optional shuffling
        let options = [...sourceQuestion.options];
        if (duplicateDto.shuffle_options) {
          options = this.gradingService.shuffleArray(options);
        }

        // Create the question
        const newQuestion = await tx.assessmentQuestion.create({
          data: {
            assessment_id: assessment.id,
            question_text: sourceQuestion.question_text,
            question_type: sourceQuestion.question_type,
            order: i + 1, // Use new order
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
              order: j + 1, // Use new order
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
          // Map old option IDs to new option IDs
          const newOptionIds = (sourceAnswer.option_ids || []).map(
            (oldId) => optionIdMap.get(oldId) || oldId
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

      // Fetch the complete new assessment
      return tx.assessment.findUnique({
        where: { id: assessment.id },
        include: {
          subject: { select: { id: true, name: true, code: true } },
          topic: { select: { id: true, title: true } },
          createdBy: { select: { id: true, first_name: true, last_name: true } },
          _count: { select: { questions: true } },
        },
      });
    });

    this.logger.log(colors.green(`[SCHOOL] Assessment duplicated successfully: ${newAssessment!.id}`));

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
   * Add questions to an existing school assessment
   *
   * - Validates assessment ownership and teacher subject access
   * - Prevents adding to PUBLISHED or ACTIVE assessments
   * - Auto-assigns order numbers starting after existing questions
   * - Creates questions, options, and correct answers in a single transaction
   * - Recalculates total_points on the assessment
   */
  async addSchoolAssessmentQuestions(
    assessmentId: string,
    addQuestionsDto: AddQuestionsDto,
    userContext: UserContext,
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Adding ${addQuestionsDto.questions.length} question(s) to assessment: ${assessmentId}`));

    // 1. Fetch the assessment and verify ownership
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: userContext.schoolId,
      },
      include: {
        _count: { select: { questions: true } },
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // 2. Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot add questions to a ${assessment.status} assessment. Change the status to DRAFT or CLOSED first.`,
      );
    }

    // 3. Role-based access check for teachers
    if (userContext.type === 'teacher') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { user_id: userContext.userId },
        include: {
          subjectsTeaching: { select: { subjectId: true } },
        },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const teacherSubjectIds = teacher.subjectsTeaching.map(st => st.subjectId);
      if (!teacherSubjectIds.includes(assessment.subject_id)) {
        throw new ForbiddenException('You do not have access to modify this assessment');
      }
    }

    // 4. Get current max order to continue numbering
    const lastQuestion = await this.prisma.assessmentQuestion.findFirst({
      where: { assessment_id: assessmentId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let nextOrder = (lastQuestion?.order ?? 0) + 1;

    // 5. Create all questions, options, and correct answers in a transaction
    const createdQuestions = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];

      for (const questionDto of addQuestionsDto.questions) {
        const questionOrder = questionDto.order ?? nextOrder++;

        // Create the question
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

        // Track option IDs for correct_answers referencing
        const createdOptionIds: string[] = [];

        // Create options (for MCQ / TRUE_FALSE)
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

          // Auto-create correct_answer record linking correct option IDs (for MCQ types)
          if (createdOptionIds.length > 0) {
            await tx.assessmentCorrectAnswer.create({
              data: {
                question_id: newQuestion.id,
                option_ids: createdOptionIds,
              },
            });
          }
        }

        // Create explicit correct answers (for non-MCQ types)
        if (questionDto.correct_answers?.length) {
          for (const answerDto of questionDto.correct_answers) {
            await tx.assessmentCorrectAnswer.create({
              data: {
                question_id: newQuestion.id,
                answer_text: answerDto.answer_text ?? null,
                answer_number: answerDto.answer_number ?? null,
                answer_date: answerDto.answer_date ? new Date(answerDto.answer_date) : null,
                answer_json: answerDto.answer_json ?? undefined,
              },
            });
          }
        }

        // Fetch the full question with relations
        const fullQuestion = await tx.assessmentQuestion.findUnique({
          where: { id: newQuestion.id },
          include: {
            options: { orderBy: { order: 'asc' } },
            correct_answers: true,
          },
        });

        results.push(fullQuestion);
      }

      // 6. Recalculate total_points on the assessment
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

    this.logger.log(colors.green(`[SCHOOL] Successfully added ${createdQuestions.length} question(s) to assessment: ${assessmentId}`));

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
    userContext: UserContext,
  ) {
    const uploadedKeys: string[] = [];

    try {
      this.logger.log(colors.cyan(`[SCHOOL] Creating question with images for assessment: ${assessmentId}`));

      // Parse the JSON question data
      let questionData: any;
      try {
        questionData = JSON.parse(questionDataString);
      } catch (parseError) {
        throw new BadRequestException('Invalid JSON in questionData field');
      }

      // Verify the assessment exists and user has access
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: userContext.schoolId,
        },
        include: {
          _count: { select: { questions: true } },
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found or you do not have access to it');
      }

      // Teachers can only add questions to their own assessments
      if (userContext.type === 'teacher' && assessment.created_by !== userContext.userId) {
        throw new ForbiddenException('You do not have access to this assessment');
      }

      // Check assessment status
      if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
        throw new BadRequestException('Cannot add questions to a published, active, closed, or archived assessment');
      }

      const s3Folder = `assessment-images/schools/${assessment.school_id}/assessments/${assessmentId}`;

      // Upload question image if provided
      if (questionImage) {
        this.logger.log(colors.blue(`[SCHOOL] 📤 Uploading question image: ${questionImage.originalname}`));
        this.validateImageFile(questionImage);

        const fileName = `question_${Date.now()}_${questionImage.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const uploadResult = await this.storageService.uploadFile(questionImage, s3Folder, fileName);
        uploadedKeys.push(uploadResult.key);

        questionData.image_url = uploadResult.url;
        questionData.image_s3_key = uploadResult.key;
        this.logger.log(colors.green(`[SCHOOL] ✅ Question image uploaded: ${uploadResult.key}`));
      }

      // Upload option images if provided
      if (optionImages.length > 0 && questionData.options?.length) {
        for (let i = 0; i < optionImages.length; i++) {
          const optFile = optionImages[i];
          this.logger.log(colors.blue(`[SCHOOL] 📤 Uploading option image [${i}]: ${optFile.originalname}`));
          this.validateImageFile(optFile);

          const fileName = `option_${Date.now()}_${i}_${optFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const uploadResult = await this.storageService.uploadFile(optFile, s3Folder, fileName);
          uploadedKeys.push(uploadResult.key);

          // Match option by imageIndex field
          const matchingOption = questionData.options.find((opt: any) => opt.imageIndex === i);
          if (matchingOption) {
            matchingOption.image_url = uploadResult.url;
            matchingOption.image_s3_key = uploadResult.key;
            this.logger.log(colors.green(`[SCHOOL] ✅ Option image [${i}] uploaded and matched`));
          } else {
            this.logger.warn(colors.yellow(`[SCHOOL] ⚠️ Option image [${i}] uploaded but no option has imageIndex: ${i}`));
          }
        }
      }

      // Wrap question data in AddQuestionsDto format and delegate to existing method
      try {
        const addQuestionsDto: AddQuestionsDto = { questions: [questionData] };
        const result = await this.addSchoolAssessmentQuestions(assessmentId, addQuestionsDto, userContext);

        this.logger.log(colors.green(`[SCHOOL] ✅ Question created successfully with ${uploadedKeys.length} image(s)`));
        return result;
      } catch (questionError) {
        // Rollback: delete ALL uploaded images if question creation failed
        if (uploadedKeys.length > 0) {
          this.logger.warn(colors.yellow(`[SCHOOL] ⚠️ Question creation failed. Rolling back ${uploadedKeys.length} image(s)`));
          for (const key of uploadedKeys) {
            try {
              await this.storageService.deleteFile(key);
              this.logger.log(colors.green(`[SCHOOL] ✅ Rolled back: ${key}`));
            } catch (deleteError) {
              this.logger.error(colors.red(`[SCHOOL] ❌ Failed to rollback: ${key} - ${deleteError.message}`));
            }
          }
        }
        throw questionError;
      }
    } catch (error) {
      this.logger.error(colors.red(`[SCHOOL] ❌ Error in addQuestionWithImage: ${error.message}`));
      throw error;
    }
  }

  // ========================================
  // UPDATE QUESTION IN ASSESSMENT
  // ========================================

  /**
   * Update a question in a school assessment (partial update)
   * 
   * Supports updating all question properties:
   * - Question text, type, points, difficulty level
   * - Media (images, audio, video) - old media is automatically deleted from storage
   * - Options (MCQ/TRUE_FALSE) - can replace all options or update existing ones
   * - Correct answers (non-MCQ types) - can update answer definitions
   * 
   * Important:
   * - Cannot update questions in PUBLISHED or ACTIVE assessments
   * - When updating options, provide the full list to replace all options
   * - Changing question type may require re-specifying options/correct answers
   * 
   * @param assessmentId - Assessment ID
   * @param questionId - Question ID to update
   * @param updateQuestionDto - Partial question data to update
   * @param userContext - User context for access control
   */
  async updateSchoolQuestion(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
    userContext: UserContext,
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Updating question: ${questionId} in assessment: ${assessmentId}`));

    // 1. Fetch the assessment and verify ownership
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: userContext.schoolId,
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // 2. Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot update questions in a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    // 3. Role-based access check for teachers
    if (userContext.type === 'teacher') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { user_id: userContext.userId },
        include: {
          subjectsTeaching: { select: { subjectId: true } },
        },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const teacherSubjectIds = teacher.subjectsTeaching.map(st => st.subjectId);
      if (!teacherSubjectIds.includes(assessment.subject_id)) {
        throw new ForbiddenException('You do not have access to modify this assessment');
      }
    }

    // 4. Fetch the question with all relations
    const question = await this.prisma.assessmentQuestion.findFirst({
      where: {
        id: questionId,
        assessment_id: assessmentId,
      },
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
      // Prepare update data (only include provided fields)
      const updateData: any = {};

      if (updateQuestionDto.question_text !== undefined) {
        updateData.question_text = updateQuestionDto.question_text;
      }
      if (updateQuestionDto.question_type !== undefined) {
        updateData.question_type = updateQuestionDto.question_type as QuestionType;
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

      if (questionImageUpdateRequested && question.image_s3_key) {
        try {
          await this.storageService.deleteFile(question.image_s3_key);
          this.logger.log(colors.green(`[SCHOOL] ✅ Deleted old question image: ${question.image_s3_key}`));
        } catch (error) {
          this.logger.warn(colors.yellow(`[SCHOOL] ⚠️ Failed to delete old question image: ${question.image_s3_key}`));
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
        updateData.allow_multiple_attempts = updateQuestionDto.allow_multiple_attempts;
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
        updateData.difficulty_level = updateQuestionDto.difficulty_level as DifficultyLevel;
      }

      // Update the question
      const updQ = await tx.assessmentQuestion.update({
        where: { id: questionId },
        data: updateData,
      });

      // 5a. Smart merge/update options if provided
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

            // Handle image updates (only if new image is provided)
            if (optDto.image_url !== undefined) {
              // Delete old image if it's being replaced with a different one
              if (existingOption.image_s3_key && optDto.image_s3_key !== existingOption.image_s3_key) {
                try {
                  await this.storageService.deleteFile(existingOption.image_s3_key);
                  this.logger.log(colors.green(`[SCHOOL] ✅ Deleted old option image: ${existingOption.image_s3_key}`));
                } catch (error) {
                  this.logger.warn(colors.yellow(`[SCHOOL] ⚠️ Failed to delete old option image: ${existingOption.image_s3_key}`));
                }
              }
              updateOptionData.image_url = optDto.image_url;
              updateOptionData.image_s3_key = optDto.image_s3_key ?? null;
            }

            const updatedOption = await tx.assessmentOption.update({
              where: { id: optDto.id },
              data: updateOptionData,
            });

            // Track correct options (use updated or existing is_correct value)
            const isCorrect = optDto.is_correct !== undefined ? optDto.is_correct : existingOption.is_correct;
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

        // Rebuild correct_answers if we have MCQ-type questions
        if (correctOptionIds.length > 0) {
          // Delete all existing correct_answers and recreate
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
        // Only update if explicitly provided - don't overwrite auto-generated ones
        if (!updateQuestionDto.options) {
          // Delete all existing correct_answers first
          await tx.assessmentCorrectAnswer.deleteMany({
            where: { question_id: questionId },
          });

          // Create new correct answers
          for (const answerDto of updateQuestionDto.correct_answers) {
            await tx.assessmentCorrectAnswer.create({
              data: {
                question_id: questionId,
                answer_text: answerDto.answer_text ?? null,
                answer_number: answerDto.answer_number ?? null,
                answer_date: answerDto.answer_date ? new Date(answerDto.answer_date) : null,
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

    this.logger.log(colors.green(`[SCHOOL] ✅ Successfully updated question: ${questionId}`));

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
   * @param userContext - User context
   * @param newQuestionImage - New question image file (optional)
   * @param optionImageUpdates - Array of { optionId, oldS3Key } for options to update
   * @param newOptionImages - Array of new option image files
   */
  async updateSchoolQuestionWithImage(
    assessmentId: string,
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
    userContext: UserContext,
    newQuestionImage?: Express.Multer.File,
    optionImageUpdates?: Array<{ optionId: string; oldS3Key?: string }>,
    newOptionImages?: Express.Multer.File[],
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Updating question with images: ${questionId}`));

    const uploadedFiles: string[] = []; // Track uploaded S3 keys for rollback

    try {
      // 1. Handle question image upload if provided
      if (newQuestionImage) {
        const timestamp = Date.now();
        const sanitizedFilename = newQuestionImage.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const s3Folder = `assessment-images/schools/${userContext.schoolId}/assessments/${assessmentId}`;
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
            this.logger.log(colors.green(`[SCHOOL] ✅ Deleted old question image: ${updateQuestionDto.image_s3_key}`));
          } catch (error) {
            this.logger.warn(colors.yellow(`[SCHOOL] ⚠️ Failed to delete old question image: ${updateQuestionDto.image_s3_key}`));
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
          const s3Folder = `assessment-images/schools/${userContext.schoolId}/assessments/${assessmentId}`;
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
              this.logger.log(colors.green(`[SCHOOL] ✅ Deleted old option image: ${oldS3Key}`));
            } catch (error) {
              this.logger.warn(colors.yellow(`[SCHOOL] ⚠️ Failed to delete old option image: ${oldS3Key}`));
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
      const result = await this.updateSchoolQuestion(
        assessmentId,
        questionId,
        updateQuestionDto,
        userContext,
      );

      this.logger.log(colors.green(`[SCHOOL] ✅ Successfully updated question with images: ${questionId}`));
      return result;

    } catch (error) {
      // Rollback: Delete all uploaded files
      this.logger.error(colors.red(`[SCHOOL] ❌ Error updating question with images, rolling back...`));
      
      for (const s3Key of uploadedFiles) {
        try {
          await this.storageService.deleteFile(s3Key);
          this.logger.log(colors.yellow(`[SCHOOL] 🔙 Rolled back uploaded file: ${s3Key}`));
        } catch (rollbackError) {
          this.logger.warn(colors.red(`[SCHOOL] ⚠️ Failed to rollback file: ${s3Key}`));
        }
      }

      throw error;
    }
  }

  // ========================================
  // DELETE QUESTION FROM ASSESSMENT
  // ========================================

  /**
   * Delete a question from a school assessment
   * 
   * Handles cleanup of:
   * - Question record and all related options
   * - All media (images, audio, video) from storage
   * - All correct answer records
   * - All student responses for this question
   * - Total points recalculation
   * 
   * Important:
   * - Cannot delete from PUBLISHED or ACTIVE assessments
   * - Cascade delete is enabled in the schema
   * 
   * @param assessmentId - Assessment ID
   * @param questionId - Question ID to delete
   * @param userContext - User context for access control
   */
  async deleteSchoolQuestion(
    assessmentId: string,
    questionId: string,
    userContext: UserContext,
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Deleting question: ${questionId} from assessment: ${assessmentId}`));

    // 1. Fetch the assessment and verify ownership
    const assessment = await this.prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        school_id: userContext.schoolId,
      },
    });

    if (!assessment) {
      this.logger.error(colors.red(`Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found');
    }

    // 2. Prevent modification of published/active assessments
    if (['PUBLISHED', 'ACTIVE'].includes(assessment.status)) {
      throw new BadRequestException(
        `Cannot delete questions from a ${assessment.status} assessment. Change the status to DRAFT first.`,
      );
    }

    // 3. Role-based access check for teachers
    if (userContext.type === 'teacher') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { user_id: userContext.userId },
        include: {
          subjectsTeaching: { select: { subjectId: true } },
        },
      });

      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      const teacherSubjectIds = teacher.subjectsTeaching.map(st => st.subjectId);
      if (!teacherSubjectIds.includes(assessment.subject_id)) {
        throw new ForbiddenException('You do not have access to delete from this assessment');
      }
    }

    // 4. Fetch the question with all relations to clean up media
    const question = await this.prisma.assessmentQuestion.findFirst({
      where: {
        id: questionId,
        assessment_id: assessmentId,
      },
      include: {
        options: true,
      },
    });

    if (!question) {
      this.logger.error(colors.red(`Question not found: ${questionId}`));
      throw new NotFoundException('Question not found');
    }

    // 5. Delete the question in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete question (cascade delete will handle options, correct_answers, responses)
      await tx.assessmentQuestion.delete({
        where: { id: questionId },
      });

      // 6. Clean up media from storage (best effort - continue even if some fail)
      const mediaToDelete: string[] = [];

      // Collect question media
      if (question.image_s3_key) {
        mediaToDelete.push(question.image_s3_key);
      }
      if (question.audio_url) {
        // Try to extract S3 key from URL if applicable
        const urlMatch = question.audio_url.match(/\/([^\/]+)$/);
        if (urlMatch) {
          mediaToDelete.push(urlMatch[1]);
        }
      }
      if (question.video_url) {
        // Try to extract S3 key from URL if applicable
        const urlMatch = question.video_url.match(/\/([^\/]+)$/);
        if (urlMatch) {
          mediaToDelete.push(urlMatch[1]);
        }
      }

      // Collect option media
      for (const option of question.options) {
        if (option.image_s3_key) {
          mediaToDelete.push(option.image_s3_key);
        }
        if (option.audio_url) {
          const urlMatch = option.audio_url.match(/\/([^\/]+)$/);
          if (urlMatch) {
            mediaToDelete.push(urlMatch[1]);
          }
        }
      }

      // Delete media files
      for (const key of mediaToDelete) {
        try {
          await this.storageService.deleteFile(key);
          this.logger.log(colors.green(`[SCHOOL] ✅ Deleted media file: ${key}`));
        } catch (error) {
          this.logger.warn(colors.yellow(`[SCHOOL] ⚠️ Failed to delete media file: ${key} - ${error.message}`));
        }
      }

      // 7. Recalculate assessment total_points
      const totalPoints = await tx.assessmentQuestion.aggregate({
        where: { assessment_id: assessmentId },
        _sum: { points: true },
      });

      await tx.assessment.update({
        where: { id: assessmentId },
        data: { total_points: totalPoints._sum.points ?? 0 },
      });
    });

    this.logger.log(colors.green(`[SCHOOL] ✅ Successfully deleted question: ${questionId}`));

    return ResponseHelper.success('Question deleted successfully', {
      assessment_id: assessmentId,
      deleted_question_id: questionId,
      message: 'Question and all associated media have been removed',
    });
  }
}
