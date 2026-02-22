import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import { Logger } from '@nestjs/common';
import * as colors from 'colors';
import { CreateNewAssessmentDto, GetAssessmentsQueryDto, UpdateAssessmentDto } from './dto';
import { StorageService } from '../shared/services/providers/storage.service';
import { AssessmentNotificationsService } from '../push-notifications/assessment/assessment-notifications.service';
import { AssessmentType, Prisma } from '@prisma/client';

/** When set, the assessment operation is performed by a library owner on behalf of a school. */
export interface LibraryAssessmentContext {
  schoolId: string;
  /** User id (school's User) to attribute created assessments to. If not provided, school director is used. */
  createdByUserId?: string;
}

/** Result type for user context detection */
interface UserContext {
  type: 'library_owner' | 'school_director' | 'school_admin' | 'teacher' | 'student';
  userId: string;
  platformId?: string; // For library owners
  schoolId?: string; // For school users
}

@Injectable()
export class AssessmentService {
  private readonly logger = new Logger(AssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly assessmentNotificationsService: AssessmentNotificationsService,
  ) {}

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Detect user context - determines if user is a library owner or school user
   * Single query approach: checks LibraryResourceUser first, then falls back to User
   */
  private async detectUserContext(userId: string): Promise<UserContext | null> {
    // First, check if user is a library owner
    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: userId },
      select: { id: true, platformId: true },
    });

    if (libraryUser) {
      return {
        type: 'library_owner',
        userId: libraryUser.id,
        platformId: libraryUser.platformId,
      };
    }

    // If not a library user, check school user
    const schoolUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, school_id: true },
    });

    if (schoolUser) {
      const role = schoolUser.role as string;
      let userType: 'school_director' | 'school_admin' | 'teacher' | 'student';
      
      if (role === 'school_director') {
        userType = 'school_director';
      } else if (role === 'school_admin') {
        userType = 'school_admin';
      } else if (role === 'student') {
        userType = 'student';
      } else {
        userType = 'teacher';
      }

      return {
        type: userType,
        userId: schoolUser.id,
        schoolId: schoolUser.school_id,
      };
    }

    return null;
  }

  /**
   * Create a library assessment (for library owners)
   */
  private async createLibraryAssessment(
    createAssessmentDto: CreateNewAssessmentDto,
    platformId: string,
    userId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Creating Library Assessment: ${createAssessmentDto.title}`));

    // Single query to validate platform, subject, and optionally topic
    const librarySubject = await this.prisma.librarySubject.findFirst({
      where: {
        id: createAssessmentDto.subject_id,
        platformId: platformId,
      },
      include: {
        topics: createAssessmentDto.topic_id
          ? { where: { id: createAssessmentDto.topic_id }, take: 1 }
          : false,
      },
    });

    if (!librarySubject) {
      this.logger.error(colors.red(`Library subject not found: ${createAssessmentDto.subject_id} for platform: ${platformId}`));
      throw new NotFoundException('Library subject not found or does not belong to your platform');
    }

    if (createAssessmentDto.topic_id && librarySubject.topics?.length === 0) {
      this.logger.error(colors.red(`Library topic not found: ${createAssessmentDto.topic_id} for subject: ${createAssessmentDto.subject_id}`));
      throw new NotFoundException('Library topic not found or does not belong to this subject');
    }

    // Create the library assessment
    const assessment = await this.prisma.libraryAssessment.create({
      data: {
        platformId: platformId,
        subjectId: createAssessmentDto.subject_id,
        topicId: createAssessmentDto.topic_id || null,
        createdById: userId,
        title: createAssessmentDto.title,
        description: createAssessmentDto.description,
        instructions: createAssessmentDto.instructions,
        assessmentType: (createAssessmentDto.assessment_type as AssessmentType) || AssessmentType.CBT,
        gradingType: createAssessmentDto.grading_type || 'AUTOMATIC',
        duration: createAssessmentDto.duration,
        maxAttempts: createAssessmentDto.max_attempts || 1,
        passingScore: createAssessmentDto.passing_score || 50.0,
        totalPoints: createAssessmentDto.total_points || 100.0,
        shuffleQuestions: createAssessmentDto.shuffle_questions || false,
        shuffleOptions: createAssessmentDto.shuffle_options || false,
        showCorrectAnswers: createAssessmentDto.show_correct_answers || false,
        showFeedback: createAssessmentDto.show_feedback !== false,
        allowReview: createAssessmentDto.allow_review !== false,
        startDate: createAssessmentDto.start_date ? new Date(createAssessmentDto.start_date) : null,
        endDate: createAssessmentDto.end_date ? new Date(createAssessmentDto.end_date) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        timeLimit: createAssessmentDto.time_limit,
        autoSubmit: createAssessmentDto.auto_submit || false,
        tags: createAssessmentDto.tags || [],
        status: 'DRAFT',
        isPublished: false,
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

    this.logger.log(colors.green(`[LIBRARY] Assessment created successfully: ${assessment.id}`));
    return ResponseHelper.success('Library assessment created successfully', {
      ...assessment,
      assessmentContext: 'library',
    });
  }

  /**
   * Create a school assessment (for teachers/directors/admins)
   */
  private async createSchoolAssessment(
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
  // PUBLIC ASSESSMENT MANAGEMENT METHODS
  // ========================================

  /**
   * Create a new assessment (unified endpoint)
   * 
   * This endpoint intelligently routes to the appropriate assessment type:
   * - If user is a LibraryResourceUser → creates LibraryAssessment
   * - If user is a school user (teacher/director/admin) → creates school Assessment
   * - If libraryContext is provided → creates school Assessment on behalf of school
   * 
   * @param createAssessmentDto - Assessment creation data
   * @param user - User object (from JWT)
   * @param libraryContext - Optional context for library owners creating school assessments
   */
  async createNewAssessment(
    createAssessmentDto: CreateNewAssessmentDto,
    user: any,
    libraryContext?: LibraryAssessmentContext
  ) {
    try {
      this.logger.log(colors.cyan(`Creating New Assessment: ${createAssessmentDto.title}`));

      // Detect user context
      const userContext = await this.detectUserContext(user.sub);

      if (!userContext) {
        this.logger.error(colors.red(`User not found in any context: ${user.sub}`));
        throw new NotFoundException('User not found');
      }

      this.logger.log(colors.cyan(`User context detected: ${userContext.type}`));

      // Route based on user context
      if (userContext.type === 'library_owner') {
        // Library owner: Check if they're creating for their own library or for a school
        if (libraryContext) {
          // Library owner creating assessment FOR a school (on behalf of)
          this.logger.log(colors.cyan(`Library owner creating school assessment for school: ${libraryContext.schoolId}`));
          return await this.createSchoolAssessment(createAssessmentDto, userContext, libraryContext);
        } else {
          // Library owner creating assessment FOR their library
          this.logger.log(colors.cyan(`Library owner creating library assessment for platform: ${userContext.platformId}`));
          return await this.createLibraryAssessment(
            createAssessmentDto,
            userContext.platformId!,
            userContext.userId
          );
        }
      } else {
        // School user (teacher/director/admin)
        return await this.createSchoolAssessment(createAssessmentDto, userContext);
      }
    } catch (error) {
      this.logger.error(colors.red(`Error creating Assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get all assessments (paginated, filtered, role-based)
   * 
   * Role-based access:
   * - School Director/Admin: All assessments in the school
   * - Teacher: Only assessments for subjects/topics they teach
   * - Student: Only published/closed assessments for subjects in their class
   * 
   * @param query - Query parameters for pagination, filtering, and search
   * @param user - User object (from JWT)
   */
  async getAllAssessments(query: GetAssessmentsQueryDto, user: any) {
    try {
      this.logger.log(colors.cyan(`Fetching assessments with filters: ${JSON.stringify(query)}`));

      // Detect user context
      const userContext = await this.detectUserContext(user.sub);

      if (!userContext) {
        this.logger.error(colors.red(`User not found in any context: ${user.sub}`));
        throw new NotFoundException('User not found');
      }

      this.logger.log(colors.cyan(`User context detected: ${userContext.type}`));

      // Route to library implementation for library owners
      if (userContext.type === 'library_owner') {
        return await this.getAllLibraryAssessments(query, userContext.platformId!);
      }

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
        // No additional filtering needed
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
          // Teacher has no subjects assigned - return empty result
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

        // Filter by teacher's subjects
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

        // Students can only see published or closed assessments
        whereClause.subject_id = { in: classSubjectIds };
        whereClause.OR = [
          { status: 'PUBLISHED' },
          { status: 'CLOSED' },
        ];
        whereClause.is_published = true;
      }

      // Build base where clause for status analytics (without status filter)
      const analyticsWhere: Prisma.AssessmentWhereInput = { ...whereClause };
      delete analyticsWhere.status; // Remove status filter for analytics
      delete analyticsWhere.is_published; // Remove is_published for analytics

      // Execute count, find, and status analytics in parallel
      const [total, assessments, statusCounts] = await Promise.all([
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
      ]);

      // Build status analytics object
      const statusAnalytics = {
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
        statusAnalytics[item.status.toLowerCase() as keyof typeof statusAnalytics] = count;
      });

      const totalPages = Math.ceil(total / query.limit!);

      this.logger.log(colors.green(`Fetched ${assessments.length} assessments (page ${query.page}/${totalPages})`));

      return ResponseHelper.success('Assessments fetched successfully', {
          analytics: statusAnalytics,
          pagination: {
              page: query.page,
              limit: query.limit,
              total,
              totalPages,
            },
            assessments,
      });
    } catch (error) {
      this.logger.error(colors.red(`Error fetching assessments: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get assessment details by ID with full information
   * Returns: assessment info, questions, and attempts/submissions
   * 
   * Role-based access:
   * - School Director/Admin: Any assessment in the school
   * - Teacher: Only assessments for subjects they teach
   * - Student: Only published assessments for subjects in their class (no questions/attempts)
   * 
   * @param assessmentId - Assessment ID
   * @param user - User object (from JWT)
   */
  async getAssessmentDetails(assessmentId: string, user: any) {
    try {
      this.logger.log(colors.cyan(`Getting assessment details: ${assessmentId}`));

      // Detect user context
      const userContext = await this.detectUserContext(user.sub);

      if (!userContext) {
        this.logger.error(colors.red(`User not found in any context: ${user.sub}`));
        throw new NotFoundException('User not found');
      }

      this.logger.log(colors.cyan(`User context detected: ${userContext.type}`));

      // Route to library implementation for library owners
      if (userContext.type === 'library_owner') {
        return await this.getLibraryAssessmentDetails(assessmentId, userContext.platformId!);
      }

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
        // Teacher must have access to the subject
        const teacher = await this.prisma.teacher.findFirst({
          where: { user_id: userContext.userId },
          include: {
            subjectsTeaching: {
              where: { subjectId: assessment.subject_id },
            },
          },
        });

        if (!teacher) {
          this.logger.error(colors.red(`Teacher not found: ${userContext.userId}`));
          throw new NotFoundException('Teacher not found');
        }

        if (teacher.subjectsTeaching.length === 0) {
          this.logger.error(colors.red(`Teacher ${userContext.userId} does not have access to assessment subject: ${assessment.subject_id}`));
          throw new ForbiddenException('You do not have access to this assessment');
        }
      } else if (userContext.type === 'student') {
        // Student can only view published assessments for their class subjects
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
          this.logger.error(colors.red(`Student not found: ${userContext.userId}`));
          throw new NotFoundException('Student not found');
        }

        if (!student.current_class || student.current_class.subjects.length === 0) {
          this.logger.error(colors.red(`Student ${userContext.userId} does not have access to assessment subject`));
          throw new ForbiddenException('You do not have access to this assessment');
        }

        // Student can only see published assessments
        if (!assessment.is_published) {
          this.logger.error(colors.red(`Student attempted to view unpublished assessment: ${assessmentId}`));
          throw new ForbiddenException('This assessment is not available');
        }

        // For students, return limited info (no questions with answers, no other students' attempts)
        return this.getStudentAssessmentView(assessment, student, userContext);
      }

      // For Director/Admin/Teacher: Get full details
      return this.getFullAssessmentDetails(assessment, userContext);
    } catch (error) {
      this.logger.error(colors.red(`Error getting assessment details: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get full assessment details for teachers/directors/admins
   */
  private async getFullAssessmentDetails(assessment: any, userContext: UserContext) {
    this.logger.log(colors.cyan(`Fetching full assessment details for: ${assessment.id}`));

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

    // Fetch questions and attempts in parallel
    const [questions, attempts, classesWithSubject] = await Promise.all([
      // Get all questions with options and correct answers
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

      // Get all attempts for this assessment
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

      // Get classes that have this subject
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

    // Get all students in these classes
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

    // Create attempt map by student
    const attemptsByStudent = new Map<string, any[]>();
    attempts.forEach(attempt => {
      const studentId = attempt.student?.id || 'unknown';
      if (!attemptsByStudent.has(studentId)) {
        attemptsByStudent.set(studentId, []);
      }
      attemptsByStudent.get(studentId)!.push(attempt);
    });

    // Build student submission report
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

    // Get student's own attempts
    const myAttempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        assessment_id: assessment.id,
        student_id: userContext.userId,
        school_id: userContext.schoolId,
        academic_session_id: currentSession.id,
      },
      orderBy: { submitted_at: 'desc' },
    });

    // Get questions (without correct answers for students unless show_correct_answers is true)
    const questions = await this.prisma.assessmentQuestion.findMany({
      where: { assessment_id: assessment.id },
      include: {
        options: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            option_text: true,
            order: true,
            // Only include is_correct if assessment allows showing correct answers and student has submitted
            ...(assessment.show_correct_answers && myAttempts.some(a => a.status === 'SUBMITTED' || a.status === 'GRADED')
              ? { is_correct: true }
              : {}),
          },
        },
        // Only include correct_answers if allowed
        ...(assessment.show_correct_answers && myAttempts.some(a => a.status === 'SUBMITTED' || a.status === 'GRADED')
          ? { correct_answers: true }
          : {}),
      },
      orderBy: { order: 'asc' },
    });

    // Calculate student's best score
    const bestAttempt = myAttempts.length > 0
      ? myAttempts.reduce((best, current) => 
          (current.percentage || 0) > (best.percentage || 0) ? current : best
        )
      : null;

    // Check if student can still attempt
    const canAttempt = assessment.status === 'PUBLISHED' 
      && assessment.is_published 
      && myAttempts.length < assessment.max_attempts
      && (!assessment.end_date || new Date(assessment.end_date) > new Date());

    this.logger.log(colors.green(`Student assessment view retrieved: ${questions.length} questions, ${myAttempts.length} attempts`));

    return ResponseHelper.success('Assessment details retrieved successfully', {
      assessment: {
        ...assessment,
        // Remove sensitive fields for students
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
  // LIBRARY OWNER ASSESSMENT METHODS
  // ========================================

  /**
   * Get all library assessments for library owners
   * Library owners can see all assessments in their platform
   */
  private async getAllLibraryAssessments(
    query: GetAssessmentsQueryDto,
    platformId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Fetching library assessments for platform: ${platformId}`));

    // Build base where clause for LibraryAssessment
    const baseWhere: Prisma.LibraryAssessmentWhereInput = {
      platformId: platformId,
    };

    // Apply optional filters (using camelCase for library models)
    if (query.subject_id) baseWhere.subjectId = query.subject_id;
    if (query.topic_id) baseWhere.topicId = query.topic_id;
    if (query.status) baseWhere.status = query.status;
    if (query.assessment_type) baseWhere.assessmentType = query.assessment_type;
    if (query.is_published !== undefined) baseWhere.isPublished = query.is_published;
    if (query.created_by) baseWhere.createdById = query.created_by;

    // Apply search filter
    if (query.search) {
      baseWhere.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build analytics where clause (without status filter)
    const analyticsWhere: Prisma.LibraryAssessmentWhereInput = { ...baseWhere };
    delete analyticsWhere.status;
    delete analyticsWhere.isPublished;

    // Execute count, find, and status analytics in parallel
    const [total, assessments, statusCounts] = await Promise.all([
      this.prisma.libraryAssessment.count({ where: baseWhere }),
      this.prisma.libraryAssessment.findMany({
        where: baseWhere,
        skip: (query.page! - 1) * query.limit!,
        take: query.limit,
        orderBy: { [query.sort_by === 'start_date' ? 'startDate' : query.sort_by === 'end_date' ? 'endDate' : query.sort_by!]: query.sort_order },
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
      this.prisma.libraryAssessment.groupBy({
        by: ['status'],
        where: analyticsWhere,
        _count: { id: true },
      }),
    ]);

    // Build status analytics object
    const statusAnalytics = {
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
      statusAnalytics[item.status.toLowerCase() as keyof typeof statusAnalytics] = count;
    });

    const totalPages = Math.ceil(total / query.limit!);

    this.logger.log(colors.green(`[LIBRARY] Fetched ${assessments.length} library assessments (page ${query.page}/${totalPages})`));

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

  /**
   * Get library assessment details by ID
   * Returns: assessment info, questions, and attempts
   */
  private async getLibraryAssessmentDetails(
    assessmentId: string,
    platformId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Getting library assessment details: ${assessmentId}`));

    // Fetch the library assessment
    const assessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
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
        platform: {
          select: { id: true, name: true },
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
      this.logger.error(colors.red(`[LIBRARY] Assessment not found: ${assessmentId}`));
      throw new NotFoundException('Library assessment not found');
    }

    // Fetch questions and attempts in parallel
    const [questions, attempts] = await Promise.all([
      // Get all questions with options and correct answers
      this.prisma.libraryAssessmentQuestion.findMany({
        where: { assessmentId: assessment.id },
        include: {
          options: {
            orderBy: { order: 'asc' },
          },
          correctAnswers: true,
          _count: {
            select: { responses: true },
          },
        },
        orderBy: { order: 'asc' },
      }),

      // Get all attempts for this assessment
      this.prisma.libraryAssessmentAttempt.findMany({
        where: {
          assessmentId: assessment.id,
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
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    // Group attempts by user
    const attemptsByUser = new Map<string, any[]>();
    attempts.forEach(attempt => {
      const userId = attempt.user?.id || 'unknown';
      if (!attemptsByUser.has(userId)) {
        attemptsByUser.set(userId, []);
      }
      attemptsByUser.get(userId)!.push(attempt);
    });

    // Build user submission report
    const usersWithAttempts = Array.from(attemptsByUser.entries()).map(([userId, userAttempts]) => {
      const firstAttempt = userAttempts[0];
      const bestAttempt = userAttempts.reduce((best, current) =>
        (current.percentage || 0) > (best.percentage || 0) ? current : best
      );

      return {
        user: {
          id: firstAttempt.user?.id,
          first_name: firstAttempt.user?.first_name,
          last_name: firstAttempt.user?.last_name,
          email: firstAttempt.user?.email,
          display_picture: firstAttempt.user?.display_picture,
        },
        attempts: userAttempts.map(a => ({
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
    });

    const totalUsers = usersWithAttempts.length;
    const usersPassed = usersWithAttempts.filter(u => u.passed).length;

    this.logger.log(colors.green(`[LIBRARY] Assessment details retrieved: ${questions.length} questions, ${attempts.length} attempts`));

    return ResponseHelper.success('Library assessment details retrieved successfully', {
      assessment,
      questions: {
        total: questions.length,
        items: questions,
      },
      submissions: {
        summary: {
          totalUsers,
          totalAttempts: attempts.length,
          usersPassed,
          passRate: totalUsers > 0 ? Math.round((usersPassed / totalUsers) * 100) : 0,
        },
        users: usersWithAttempts,
      },
      assessmentContext: 'library',
    });
  }

  // ========================================
  // UPDATE ASSESSMENT METHODS
  // ========================================

  /**
   * Update an assessment (unified endpoint)
   * 
   * Routes to appropriate handler based on user context:
   * - Library owners: Update LibraryAssessment
   * - School users: Update school Assessment
   * 
   * **Important Restrictions:**
   * - Cannot update assessments with status PUBLISHED or ACTIVE
   * - Students cannot update assessments
   * 
   * @param assessmentId - Assessment ID to update
   * @param updateDto - Partial update data
   * @param user - User object (from JWT)
   */
  async updateAssessment(
    assessmentId: string,
    updateDto: UpdateAssessmentDto,
    user: any
  ) {
    try {
      this.logger.log(colors.cyan(`Updating assessment: ${assessmentId}`));
      this.logger.log(colors.yellow(`Update payload: ${JSON.stringify(updateDto, null, 2)}`));

      // Detect user context
      const userContext = await this.detectUserContext(user.sub);

      if (!userContext) {
        this.logger.error(colors.red(`User not found in any context: ${user.sub}`));
        throw new NotFoundException('User not found');
      }

      this.logger.log(colors.cyan(`User context detected: ${userContext.type}`));

      // Students cannot update assessments
      if (userContext.type === 'student') {
        this.logger.warn(colors.yellow(`Student attempted to update assessment: ${user.sub}`));
        throw new ForbiddenException('Students cannot update assessments');
      }

      // Route based on user context
      if (userContext.type === 'library_owner') {
        return await this.updateLibraryAssessment(assessmentId, updateDto, userContext.platformId!, userContext.userId);
      } else {
        return await this.updateSchoolAssessment(assessmentId, updateDto, userContext);
      }
    } catch (error) {
      this.logger.error(colors.red(`Error updating assessment: ${error.message}`));
      throw error;
    }
  }

  /**
   * Update a school assessment
   */
  private async updateSchoolAssessment(
    assessmentId: string,
    updateDto: UpdateAssessmentDto,
    userContext: UserContext
  ) {
    this.logger.log(colors.cyan(`[SCHOOL] Updating assessment: ${assessmentId}`));

    // Build where clause based on user role
    const whereClause: Prisma.AssessmentWhereInput = {
      id: assessmentId,
      school_id: userContext.schoolId,
    };

    // Teachers can only update their own assessments
    if (userContext.type === 'teacher') {
      whereClause.created_by = userContext.userId;
    }

    // Fetch existing assessment
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

    // Check if assessment is published - cannot update published assessments
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
        this.logger.error(colors.red(`Subject not found: ${updateDto.subject_id}`));
        throw new NotFoundException('Subject not found in this school');
      }

      // For teachers, verify they teach this subject
      if (userContext.type === 'teacher') {
        const teacherSubject = await this.prisma.teacherSubject.findFirst({
          where: {
            teacher: { user_id: userContext.userId },
            subjectId: updateDto.subject_id,
          },
        });

        if (!teacherSubject) {
          this.logger.error(colors.red(`Teacher does not teach subject: ${updateDto.subject_id}`));
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
        this.logger.error(colors.red(`Topic not found or does not belong to subject: ${updateDto.topic_id}`));
        throw new NotFoundException('Topic not found or does not belong to the specified subject');
      }
    }

    // Build update data
    const updateData: any = {};

    // Copy only provided fields (PATCH behavior)
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

    // Convert date strings to Date objects
    if (updateDto.start_date) {
      updateData.start_date = new Date(updateDto.start_date);
    }
    if (updateDto.end_date) {
      updateData.end_date = new Date(updateDto.end_date);
    }

    // Handle status changes
    if (updateDto.status) {
      const isBeingPublished = ['PUBLISHED', 'ACTIVE'].includes(updateDto.status) && !existingAssessment.is_published;

      if (isBeingPublished) {
        // Validate end_date is not in the past
        const effectiveEndDate = updateData.end_date ?? existingAssessment.end_date;
        if (effectiveEndDate && new Date(effectiveEndDate) < new Date()) {
          this.logger.error(colors.red(`Cannot publish assessment with past end_date: ${effectiveEndDate}`));
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

    // Don't pass empty/undefined assessment_type to Prisma
    if (updateData.assessment_type === '' || updateData.assessment_type === undefined) {
      delete updateData.assessment_type;
    }

    // Perform the update
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

  /**
   * Update a library assessment
   */
  private async updateLibraryAssessment(
    assessmentId: string,
    updateDto: UpdateAssessmentDto,
    platformId: string,
    userId: string
  ) {
    this.logger.log(colors.cyan(`[LIBRARY] Updating assessment: ${assessmentId}`));

    // Fetch existing assessment
    const existingAssessment = await this.prisma.libraryAssessment.findFirst({
      where: {
        id: assessmentId,
        platformId: platformId,
      },
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
      this.logger.error(colors.red(`Library assessment not found: ${assessmentId}`));
      throw new NotFoundException('Assessment not found or you do not have permission to update it');
    }

    // Check if assessment is published - cannot update published assessments
    const publishedStatuses = ['PUBLISHED', 'ACTIVE'];
    if (publishedStatuses.includes(existingAssessment.status)) {
      this.logger.warn(colors.yellow(`Cannot update published library assessment: ${assessmentId} (status: ${existingAssessment.status})`));
      throw new BadRequestException(
        `Cannot update assessment with status "${existingAssessment.status}". Change status to DRAFT first to make modifications.`
      );
    }

    // Validate subject_id if being changed (maps to subjectId in library)
    if (updateDto.subject_id && updateDto.subject_id !== existingAssessment.subjectId) {
      const subject = await this.prisma.librarySubject.findFirst({
        where: {
          id: updateDto.subject_id,
          platformId: platformId,
        },
      });

      if (!subject) {
        this.logger.error(colors.red(`Library subject not found: ${updateDto.subject_id}`));
        throw new NotFoundException('Subject not found in this platform');
      }
    }

    // Validate topic_id if being changed (maps to topicId in library)
    if (updateDto.topic_id && updateDto.topic_id !== existingAssessment.topicId) {
      const effectiveSubjectId = updateDto.subject_id || existingAssessment.subjectId;
      const topic = await this.prisma.libraryTopic.findFirst({
        where: {
          id: updateDto.topic_id,
          subjectId: effectiveSubjectId,
        },
      });

      if (!topic) {
        this.logger.error(colors.red(`Library topic not found: ${updateDto.topic_id}`));
        throw new NotFoundException('Topic not found or does not belong to the specified subject');
      }
    }

    // Build update data with camelCase field mapping
    const updateData: any = {};

    // Map snake_case DTO fields to camelCase library fields
    const fieldMapping: Record<string, string> = {
      'subject_id': 'subjectId',
      'topic_id': 'topicId',
      'max_attempts': 'maxAttempts',
      'passing_score': 'passingScore',
      'total_points': 'totalPoints',
      'shuffle_questions': 'shuffleQuestions',
      'shuffle_options': 'shuffleOptions',
      'show_correct_answers': 'showCorrectAnswers',
      'show_feedback': 'showFeedback',
      'allow_review': 'allowReview',
      'time_limit': 'timeLimit',
      'grading_type': 'gradingType',
      'auto_submit': 'autoSubmit',
      'assessment_type': 'assessmentType',
      'is_result_released': 'isResultReleased',
      'student_can_view_grading': 'studentCanViewGrading',
      'start_date': 'startDate',
      'end_date': 'endDate',
    };

    // Copy fields with mapping
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
        const mappedField = fieldMapping[field] || field;
        updateData[mappedField] = updateDto[field];
      }
    }

    // Convert date strings to Date objects
    if (updateDto.start_date) {
      updateData.startDate = new Date(updateDto.start_date);
    }
    if (updateDto.end_date) {
      updateData.endDate = new Date(updateDto.end_date);
    }

    // Handle status changes
    if (updateDto.status) {
      const isBeingPublished = ['PUBLISHED', 'ACTIVE'].includes(updateDto.status) && !existingAssessment.isPublished;

      if (isBeingPublished) {
        // Validate endDate is not in the past
        const effectiveEndDate = updateData.endDate ?? existingAssessment.endDate;
        if (effectiveEndDate && new Date(effectiveEndDate) < new Date()) {
          this.logger.error(colors.red(`Cannot publish library assessment with past endDate: ${effectiveEndDate}`));
          throw new BadRequestException(
            'Cannot publish an assessment that has already expired. Please set an end date in the future first.'
          );
        }
        updateData.isPublished = true;
        updateData.publishedAt = new Date();
      }

      const isBeingUnpublished = updateDto.status === 'DRAFT' && existingAssessment.isPublished;
      if (isBeingUnpublished) {
        updateData.isPublished = false;
      }
    }

    // Don't pass empty/undefined assessmentType to Prisma
    if (updateData.assessmentType === '' || updateData.assessmentType === undefined) {
      delete updateData.assessmentType;
    }

    // Perform the update
    const updatedAssessment = await this.prisma.libraryAssessment.update({
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

    this.logger.log(colors.green(`[LIBRARY] Assessment updated successfully: ${assessmentId}`));

    return ResponseHelper.success('Assessment updated successfully', {
      assessment: updatedAssessment,
      assessmentContext: 'library',
    });
  }
}