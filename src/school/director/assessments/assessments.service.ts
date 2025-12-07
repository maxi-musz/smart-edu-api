import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import * as colors from 'colors';

@Injectable()
export class DirectorAssessmentsService {
  private readonly logger = new Logger(DirectorAssessmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get assessment dashboard data for director
   * Returns: sessions, subjects, classes, and assessments grouped by category
   */
  async getAssessmentDashboard(
    userId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      assessmentType?: string;
      subjectId?: string;
      classId?: string;
    } = {}
  ) {
    try {
      this.logger.log(colors.cyan(`Getting assessment dashboard for director: ${userId}`));

      // Get director/school info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, school_id: true, role: true }
      });

      if (!user || user.role !== 'school_director') {
        return ResponseHelper.error('Access denied. Director role required.', null, 403);
      }

      const {
        page = 1,
        limit = 10,
        status,
        assessmentType,
        subjectId,
        classId
      } = filters;

      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
      const skip = (pageNum - 1) * limitNum;

      // 1. Get all academic sessions and terms with their status
      const academicSessions = await this.prisma.academicSession.findMany({
        where: {
          school_id: user.school_id
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
              assessments: true
            }
          }
        },
        orderBy: [
          { start_year: 'desc' },
          { term: 'desc' }
        ]
      });

      // 2. Get all subjects in the school with teacher info, student count, and assessment counts
      const subjects = await this.prisma.subject.findMany({
        where: {
          schoolId: user.school_id,
          ...(subjectId ? { id: subjectId } : {})
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
                  display_picture: true
                }
              }
            }
          },
          Class: {
            select: {
              id: true,
              name: true
            }
          },
          academicSession: {
            select: {
              id: true,
              academic_year: true,
              term: true,
              is_current: true
            }
          },
          _count: {
            select: {
              assessments: true,
              topics: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Get current session for filtering
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: user.school_id,
          is_current: true
        }
      });

      // Enrich subjects with assessment counts by type and student counts
      const enrichedSubjects = await Promise.all(
        subjects.map(async (subject) => {
          // Get assessment counts by type for this subject
          const assessmentCounts = await this.prisma.assessment.groupBy({
            by: ['assessment_type'],
            where: {
              subject_id: subject.id,
              ...(currentSession ? { academic_session_id: currentSession.id } : {})
            },
            _count: {
              assessment_type: true
            }
          });

          const countsByType = assessmentCounts.reduce((acc, item) => {
            acc[item.assessment_type] = item._count.assessment_type;
            return acc;
          }, {} as Record<string, number>);

          // Get student count for this subject (students enrolled in classes that have this subject)
          const studentCount = await this.prisma.student.count({
            where: {
              school_id: user.school_id,
              current_class_id: subject.classId || undefined,
              status: 'active',
              ...(currentSession ? { academic_session_id: currentSession.id } : {})
            }
          });

          return {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            color: subject.color,
            description: subject.description,
            class: subject.Class ? {
              id: subject.Class.id,
              name: subject.Class.name
            } : null,
            academic_session: subject.academicSession,
            teachers_in_charge: subject.teacherSubjects.map(ts => ({
              id: ts.teacher.id,
              first_name: ts.teacher.first_name,
              last_name: ts.teacher.last_name,
              email: ts.teacher.email,
              display_picture: ts.teacher.display_picture
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
              OTHER: countsByType['OTHER'] || 0
            },
            status: currentSession && subject.academicSession?.id === currentSession.id ? 'active' : 'inactive'
          };
        })
      );

      // 3. Get all classes with their important properties
      const classes = await this.prisma.class.findMany({
        where: {
          schoolId: user.school_id,
          ...(classId ? { id: classId } : {}),
          ...(currentSession ? { academic_session_id: currentSession.id } : {})
        },
        include: {
          classTeacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true
            }
          },
          academicSession: {
            select: {
              id: true,
              academic_year: true,
              term: true,
              is_current: true
            }
          },
          _count: {
            select: {
              students: true,
              subjects: true,
              schedules: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      const enrichedClasses = classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        classTeacher: cls.classTeacher ? {
          id: cls.classTeacher.id,
          first_name: cls.classTeacher.first_name,
          last_name: cls.classTeacher.last_name,
          email: cls.classTeacher.email,
          display_picture: cls.classTeacher.display_picture
        } : null,
        academic_session: cls.academicSession,
        student_count: cls._count.students,
        subject_count: cls._count.subjects,
        schedule_count: cls._count.schedules
      }));

      // 4. Get all assessments grouped by category (paginated)
      const assessmentWhere: any = {
        school_id: user.school_id,
        ...(currentSession ? { academic_session_id: currentSession.id } : {}),
        ...(status ? { status } : {}),
        ...(assessmentType ? { assessment_type: assessmentType } : {}),
        ...(subjectId ? { subject_id: subjectId } : {})
      };

      // If classId is provided, filter by subjects in that class
      if (classId) {
        const classSubjects = await this.prisma.subject.findMany({
          where: {
            classId: classId,
            schoolId: user.school_id
          },
          select: { id: true }
        });
        assessmentWhere.subject_id = {
          in: classSubjects.map(s => s.id)
        };
      }

      const [allAssessments, totalAssessments, assessmentTypeCounts] = await Promise.all([
        this.prisma.assessment.findMany({
          where: assessmentWhere,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            topic: {
              select: {
                id: true,
                title: true
              }
            },
            createdBy: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            },
            _count: {
              select: {
                questions: true,
                attempts: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limitNum
        }),
        this.prisma.assessment.count({
          where: assessmentWhere
        }),
        this.prisma.assessment.groupBy({
          by: ['assessment_type'],
          where: assessmentWhere,
          _count: {
            assessment_type: true
          }
        })
      ]);

      // Group assessments by type
      const groupedAssessments = allAssessments.reduce((acc, assessment) => {
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
          attempt_count: assessment._count.attempts
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Create counts object
      const counts = assessmentTypeCounts.reduce((acc, item) => {
        acc[item.assessment_type] = item._count.assessment_type;
        return acc;
      }, {} as Record<string, number>);

      const totalPages = Math.ceil(totalAssessments / limitNum);

      this.logger.log(colors.green(`✅ Dashboard data retrieved successfully`));

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
            hasPrev: pageNum > 1
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting assessment dashboard: ${error.message}`));
      return ResponseHelper.error(`Failed to retrieve dashboard: ${error.message}`, null, 500);
    }
  }

  /**
   * Get all assessments for director (similar to teacher endpoint but for all teachers)
   */
  async getAllAssessments(
    userId: string,
    filters: {
      status?: string;
      subjectId?: string;
      topicId?: string;
      assessmentType?: string;
      page?: number;
      limit?: number;
    }
  ) {
    try {
      this.logger.log(colors.cyan(`Getting all assessments for director: ${userId}`));

      // Get director/school info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, school_id: true, role: true }
      });

      if (!user || user.role !== 'school_director') {
        return ResponseHelper.error('Access denied. Director role required.', null, 403);
      }

      const {
        status,
        subjectId,
        topicId,
        assessmentType,
        page = 1,
        limit = 10
      } = filters;

      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: user.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        return ResponseHelper.error('Current academic session not found', null, 404);
      }

      // Build base where clause - all assessments in school, not just one teacher
      const baseWhere: any = {
        school_id: user.school_id,
        academic_session_id: currentSession.id
      };

      // Add optional filters
      if (status) {
        baseWhere.status = status;
      }
      if (subjectId) {
        baseWhere.subject_id = subjectId;
      }
      if (topicId) {
        baseWhere.topic_id = topicId;
      }
      if (assessmentType) {
        baseWhere.assessment_type = assessmentType;
      }

      // Calculate pagination
      const skip = (pageNum - 1) * limitNum;

      // Get all assessments grouped by type
      const [allAssessments, assessmentTypeCounts] = await Promise.all([
        this.prisma.assessment.findMany({
          where: baseWhere,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            topic: {
              select: {
                id: true,
                title: true
              }
            },
            createdBy: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true
              }
            },
            _count: {
              select: {
                questions: true,
                attempts: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        this.prisma.assessment.groupBy({
          by: ['assessment_type'],
          where: baseWhere,
          _count: {
            assessment_type: true
          }
        })
      ]);

      // Group assessments by type
      const groupedAssessments = allAssessments.reduce((acc, assessment) => {
        const type = assessment.assessment_type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(assessment);
        return acc;
      }, {} as Record<string, any[]>);

      // Create counts object
      const counts = assessmentTypeCounts.reduce((acc, item) => {
        acc[item.assessment_type] = item._count.assessment_type;
        return acc;
      }, {} as Record<string, number>);

      // If specific assessment type is requested, return only that type with pagination
      if (assessmentType) {
        const typeAssessments = groupedAssessments[assessmentType] || [];
        const total = typeAssessments.length;
        const paginatedAssessments = typeAssessments.slice(skip, skip + limitNum);
        const totalPages = Math.ceil(total / limitNum);

        return ResponseHelper.success(
          'Assessments retrieved successfully',
          {
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages
            },
            assessments: paginatedAssessments,
            counts
          }
        );
      }

      // Return all assessments grouped by type
      this.logger.log(colors.green(`Found ${allAssessments.length} assessments for school`));
      return ResponseHelper.success(
        'Assessments retrieved successfully',
        {
          assessments: groupedAssessments,
          counts,
          total: allAssessments.length
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`Error getting all assessments: ${error.message}`));
      return ResponseHelper.error(`Failed to retrieve assessments: ${error.message}`, null, 500);
    }
  }

  /**
   * Get assessment attempts/details for director
   * Returns students who have taken it and those who haven't
   */
  async getAssessmentAttempts(assessmentId: string, userId: string) {
    try {
      this.logger.log(colors.cyan(`Getting assessment attempts for director: ${assessmentId}`));

      // Get director/school info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, school_id: true, role: true }
      });

      if (!user || user.role !== 'school_director') {
        return ResponseHelper.error('Access denied. Director role required.', null, 403);
      }

      // Verify assessment exists (directors can view all assessments in their school)
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: user.school_id
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      if (!assessment) {
        this.logger.error(colors.red(`Assessment not found or access denied: ${assessmentId}`));
        return ResponseHelper.error('Assessment not found or access denied', null, 404);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: user.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        return ResponseHelper.error('Current academic session not found', null, 404);
      }

      // Find all classes that have this subject
      const classesWithSubject = await this.prisma.class.findMany({
        where: {
          schoolId: user.school_id,
          academic_session_id: currentSession.id,
          subjects: {
            some: {
              id: assessment.subject_id,
              academic_session_id: currentSession.id
            }
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (classesWithSubject.length === 0) {
        return ResponseHelper.success('Assessment attempts retrieved successfully', {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            subject: assessment.subject,
            topic: assessment.topic,
            createdBy: assessment.createdBy
          },
          totalStudents: 0,
          studentsAttempted: 0,
          studentsNotAttempted: 0,
          classes: [],
          students: []
        });
      }

      const classIds = classesWithSubject.map(cls => cls.id);

      // Get all active students in these classes
      const allStudents = await this.prisma.student.findMany({
        where: {
          school_id: user.school_id,
          academic_session_id: currentSession.id,
          current_class_id: { in: classIds },
          status: 'active'
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true
            }
          },
          current_class: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          user: {
            last_name: 'asc'
          }
        }
      });

      // Get all attempts for this assessment
      const attempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          assessment_id: assessmentId,
          school_id: user.school_id,
          academic_session_id: currentSession.id
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
          createdAt: true
        },
        orderBy: {
          submitted_at: 'desc'
        }
      });

      // Create a map of student_id to attempts
      const attemptsByStudent = new Map<string, typeof attempts>();
      attempts.forEach(attempt => {
        if (!attemptsByStudent.has(attempt.student_id)) {
          attemptsByStudent.set(attempt.student_id, []);
        }
        attemptsByStudent.get(attempt.student_id)!.push(attempt);
      });

      // Combine students with their attempts
      const studentsWithAttempts = allStudents.map(student => {
        const studentAttempts = attemptsByStudent.get(student.user_id) || [];
        const latestAttempt = studentAttempts.length > 0 
          ? studentAttempts[0] // Most recent attempt (already sorted by submitted_at desc)
          : null;

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
          latestAttempt: latestAttempt ? {
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
            createdAt: latestAttempt.createdAt
          } : null,
          allAttempts: studentAttempts.map(attempt => ({
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
            createdAt: attempt.createdAt
          }))
        };
      });

      // Calculate statistics
      const studentsAttempted = studentsWithAttempts.filter(s => s.hasAttempted).length;
      const studentsNotAttempted = allStudents.length - studentsAttempted;
      const totalAttempts = attempts.length;

      // Calculate average score
      const completedAttempts = attempts.filter(a => a.submitted_at && a.status === 'SUBMITTED');
      const averageScore = completedAttempts.length > 0
        ? completedAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / completedAttempts.length
        : 0;

      // Group by class
      const studentsByClass = studentsWithAttempts.reduce((acc, student) => {
        const className = student.className;
        if (!acc[className]) {
          acc[className] = [];
        }
        acc[className].push(student);
        return acc;
      }, {} as Record<string, typeof studentsWithAttempts>);

      const classesData = Object.entries(studentsByClass).map(([className, students]) => ({
        className,
        totalStudents: students.length,
        studentsAttempted: students.filter(s => s.hasAttempted).length,
        studentsNotAttempted: students.filter(s => !s.hasAttempted).length
      }));

      this.logger.log(colors.green(`✅ Retrieved attempts for ${allStudents.length} students, ${studentsAttempted} have attempted`));

      return ResponseHelper.success('Assessment attempts retrieved successfully', {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          subject: assessment.subject,
          topic: assessment.topic,
          totalPoints: assessment.total_points,
          passingScore: assessment.passing_score,
          createdBy: assessment.createdBy
        },
        statistics: {
          totalStudents: allStudents.length,
          studentsAttempted,
          studentsNotAttempted,
          totalAttempts,
          averageScore: Math.round(averageScore * 100) / 100,
          completionRate: allStudents.length > 0 
            ? Math.round((studentsAttempted / allStudents.length) * 100 * 100) / 100 
            : 0
        },
        classes: classesData,
        students: studentsWithAttempts
      });
    } catch (error) {
      this.logger.error(colors.red(`Error getting assessment attempts: ${error.message}`));
      return ResponseHelper.error(`Failed to retrieve assessment attempts: ${error.message}`, null, 500);
    }
  }

  /**
   * Get a specific student's submission for an assessment
   * @param assessmentId - ID of the assessment
   * @param studentId - ID of the student (Student record id)
   * @param userId - ID of the director
   */
  async getStudentSubmission(assessmentId: string, studentId: string, userId: string) {
    try {
      this.logger.log(colors.cyan(`Getting student submission for assessment: ${assessmentId}, student: ${studentId}`));

      // Get director/school info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, school_id: true, role: true }
      });

      if (!user || user.role !== 'school_director') {
        return ResponseHelper.error('Access denied. Director role required.', null, 403);
      }

      // Verify assessment exists (directors can view all assessments in their school)
      const assessment = await this.prisma.assessment.findFirst({
        where: {
          id: assessmentId,
          school_id: user.school_id
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          topic: {
            select: {
              id: true,
              title: true
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          }
        }
      });

      if (!assessment) {
        this.logger.error(colors.red(`Assessment not found or access denied: ${assessmentId}`));
        return ResponseHelper.error('Assessment not found or access denied', null, 404);
      }

      this.logger.log(colors.green(`Assessment found`));

      // Verify student exists and belongs to the school
      // studentId is the Student record id, not the user_id
      this.logger.log(colors.cyan(`Looking for student with id: ${studentId}`));
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          school_id: user.school_id
        },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true
            }
          },
          current_class: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!student) {
        this.logger.error(colors.red(`Student not found with id: ${studentId}`));
        return ResponseHelper.error('Student not found', null, 404);
      }

      this.logger.log(colors.green(`Student found: ${student.user.first_name} ${student.user.last_name} (user_id: ${student.user_id})`));

      // Get current academic session
      this.logger.log(colors.cyan(`Getting current academic session for school: ${user.school_id}`));
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: user.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        return ResponseHelper.error('Current academic session not found', null, 404);
      }

      this.logger.log(colors.green(`Current session found: ${currentSession.id}`));

      // Get all attempts for this student and assessment
      // Note: AssessmentAttempt.student_id is the User.id (user_id), not the Student record id
      this.logger.log(colors.cyan(`Fetching attempts for assessment: ${assessmentId}, user_id: ${student.user_id}`));
      const attempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          assessment_id: assessmentId,
          student_id: student.user_id,
          school_id: user.school_id,
          academic_session_id: currentSession.id
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
                      order: true
                    },
                    orderBy: {
                      order: 'asc'
                    }
                  }
                }
              },
              selectedOptions: {
                select: {
                  id: true,
                  option_text: true,
                  is_correct: true,
                  order: true
                },
                orderBy: {
                  order: 'asc'
                }
              }
            },
            orderBy: {
              question: {
                order: 'asc'
              }
            }
          }
        },
        orderBy: {
          submitted_at: 'desc'
        }
      });

      if (attempts.length === 0) {
        return ResponseHelper.success('Student submission retrieved successfully', {
          assessment: {
            id: assessment.id,
            title: assessment.title,
            subject: assessment.subject,
            topic: assessment.topic,
            totalPoints: assessment.total_points,
            passingScore: assessment.passing_score,
            createdBy: assessment.createdBy
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
            classId: student.current_class_id
          },
          attempts: [],
          hasAttempted: false
        });
      }

      // Format attempts with responses
      const formattedAttempts = attempts.map(attempt => ({
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
        responses: attempt.responses.map(response => ({
          id: response.id,
          question: {
            id: response.question.id,
            questionText: response.question.question_text,
            questionType: response.question.question_type,
            points: response.question.points,
            order: response.question.order,
            imageUrl: response.question.image_url,
            options: response.question.options
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
          createdAt: response.createdAt
        }))
      }));

      this.logger.log(colors.green(`✅ Retrieved ${attempts.length} attempt(s) for student ${student.user.first_name} ${student.user.last_name}`));

      return ResponseHelper.success('Student submission retrieved successfully', {
        assessment: {
          id: assessment.id,
          title: assessment.title,
          subject: assessment.subject,
          topic: assessment.topic,
          totalPoints: assessment.total_points,
          passingScore: assessment.passing_score,
          createdBy: assessment.createdBy
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
          classId: student.current_class_id
        },
        attempts: formattedAttempts,
        hasAttempted: true,
        attemptCount: attempts.length,
        latestAttempt: formattedAttempts[0] || null
      });
    } catch (error) {
      this.logger.error(colors.red(`Error getting student submission: ${error.message}`));
      return ResponseHelper.error(`Failed to retrieve student submission: ${error.message}`, null, 500);
    }
  }
}

