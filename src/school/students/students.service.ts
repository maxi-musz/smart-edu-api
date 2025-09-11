import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { DayOfWeek } from '@prisma/client';
import * as colors from 'colors';
import { formatDate } from 'src/shared/helper-functions/formatter';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get current DayOfWeek enum string
   */
  private getCurrentDayOfWeek(): DayOfWeek {
    const dayIndex = new Date().getDay();
    const days: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
    return days[dayIndex];
  }

  /**
   * Get next day
   */
  private getNextDay(currentDay: DayOfWeek): DayOfWeek {
    const days: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
    const currentIndex = days.indexOf(currentDay);
    const nextIndex = (currentIndex + 1) % 7;
    return days[nextIndex];
  }

  /**
   * Get day after next
   */
  private getDayAfterNext(currentDay: DayOfWeek): DayOfWeek {
    const days: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
    const currentIndex = days.indexOf(currentDay);
    const dayAfterNextIndex = (currentIndex + 2) % 7;
    return days[dayAfterNextIndex];
  }

  /**
   * Get student dashboard
   * @param user - User object with sub and email
   */
  async getStudentDashboard(user: any) {
    this.logger.log(colors.cyan(`Fetching student dashboard for:js ${JSON.stringify(user)}`));

    const full_user = await this.prisma.user.findUnique({
      where: {
        id: user.sub
      }
    });

    if (!full_user) {
      this.logger.error(colors.red(`User not found for ID: ${user.sub}`));
      return new ApiResponse(false, 'User not found', null);
    }

    this.logger.log(colors.green(`Full user: ${JSON.stringify(full_user)}`));

    // Check if user has student role
    if (full_user.role !== 'student') {
      this.logger.error(colors.red(`User ${full_user.email} has role '${full_user.role}', expected 'student'`));
      return new ApiResponse(false, 'Access denied. Student role required.', null);
    }

    try {
      // Get student record using user.sub (which is the user ID)
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.sub,
          school_id: full_user.school_id
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
          school: {
            select: {
              id: true,
              school_name: true
            }
          },
          academicSession: {
            select: {
              id: true,
              academic_year: true,
              term: true,
              start_date: true,
              end_date: true
            }
          }
        }
      });

      if (!student) {
        this.logger.error(colors.red(`Student not found for user: ${user.email}`));
        return new ApiResponse(false, 'Student not found', null);
      }

      this.logger.log(colors.green(`✅ Student found: ${student.user.first_name} ${student.user.last_name}`));

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        return new ApiResponse(false, 'No current academic session found', null);
      }

      // Get student's class information
      const studentClass = await this.prisma.class.findUnique({
        where: { id: student.current_class_id || undefined },
        include: {
          classTeacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              display_picture: true
            }
          },
          subjects: {
            where: {
              academic_session_id: currentSession.id
            },
            include: {
              teacherSubjects: {
                include: {
                  teacher: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      display_picture: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!studentClass) {
        return new ApiResponse(false, 'Student class not found', null);
      }

      this.logger.log(colors.green(`✅ Class found: ${studentClass.name}`));

      // Get subjects enrolled with teacher info
      const subjectsEnrolled = studentClass.subjects.map(subject => {
        const teacherSubject = subject.teacherSubjects[0];
        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          color: subject.color,
          teacher: teacherSubject ? {
            id: teacherSubject.teacher.id,
            name: `${teacherSubject.teacher.first_name} ${teacherSubject.teacher.last_name}`,
            display_picture: teacherSubject.teacher.display_picture
          } : null
        };
      });

      // Get pending assessments (published assessments with attempts remaining)
      const pendingAssessments = await this.prisma.cBTQuiz.findMany({
        where: {
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          status: 'PUBLISHED',
          is_published: true,
          AND: [
            {
              OR: [
                { start_date: null },
                { start_date: { lte: new Date() } }
              ]
            },
            {
              OR: [
                { end_date: null },
                { end_date: { gte: new Date() } }
              ]
            }
          ]
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          _count: {
            select: {
              attempts: {
                where: {
                  student_id: user.sub
                }
              }
            }
          }
        }
      });

      // Filter assessments where student hasn't reached max attempts
      const availableAssessments = pendingAssessments.filter(assessment => 
        assessment._count.attempts < assessment.max_attempts
      );

      // Get current day and next two days for schedule
      const currentDay = this.getCurrentDayOfWeek();
      const nextDay = this.getNextDay(currentDay);
      const dayAfterNext = this.getDayAfterNext(currentDay);

      // Get class schedule for next 3 days
      const classSchedule = await this.prisma.timetableEntry.findMany({
        where: {
          class_id: student.current_class_id || undefined,
          day_of_week: {
            in: [currentDay, nextDay, dayAfterNext]
          },
          isActive: true,
          academic_session_id: currentSession.id
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          },
          teacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          timeSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              label: true,
              order: true
            }
          }
        },
        orderBy: [
          { day_of_week: 'asc' },
          { timeSlot: { order: 'asc' } }
        ]
      });

      // Format schedule by day
      const formatDaySchedule = (day: DayOfWeek) => {
        const dayEntries = classSchedule.filter(entry => entry.day_of_week === day);
        return dayEntries.map(entry => ({
          subject: {
            id: entry.subject.id,
            name: entry.subject.name,
            code: entry.subject.code,
            color: entry.subject.color
          },
          teacher: {
            id: entry.teacher.id,
            name: `${entry.teacher.first_name} ${entry.teacher.last_name}`
          },
          time: {
            from: entry.timeSlot.startTime,
            to: entry.timeSlot.endTime,
            label: entry.timeSlot.label
          },
          room: entry.room
        }));
      };

      // Get recent notifications for the school
      const notifications = await this.prisma.notification.findMany({
        where: {
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          OR: [
            { type: 'all' },
            { type: 'students' }
          ]
        },
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          comingUpOn: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      // Get current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

      const dashboardData = {
        general_info: {
          current_session: {
            academic_year: currentSession.academic_year,
            term: currentSession.term,
            start_date: currentSession.start_date,
            end_date: currentSession.end_date
          },
          student_class: {
            id: studentClass.id,
            name: studentClass.name
          },
          class_teacher: {
            id: studentClass.classTeacher?.id,
            name: studentClass.classTeacher ? 
              `${studentClass.classTeacher.first_name} ${studentClass.classTeacher.last_name}` : null,
            display_picture: studentClass.classTeacher?.display_picture
          },
          student: {
            id: student.user.id,
            name: `${student.user.first_name} ${student.user.last_name}`,
            email: student.user.email,
            display_picture: student.user.display_picture
          },
          current_date: currentDate,
          current_time: currentTime
        },
        stats: {
          total_subjects: subjectsEnrolled.length,
          pending_assessments: availableAssessments.length
        },
        subjects_enrolled: subjectsEnrolled,
        class_schedule: {
          today: {
            day: currentDay,
            schedule: formatDaySchedule(currentDay)
          },
          tomorrow: {
            day: nextDay,
            schedule: formatDaySchedule(nextDay)
          },
          day_after_tomorrow: {
            day: dayAfterNext,
            schedule: formatDaySchedule(dayAfterNext)
          }
        },
        notifications: notifications
      };

      this.logger.log(colors.green(`Student dashboard fetched successfully for: ${user.email}`));

      return new ApiResponse(
        true,
        'Student dashboard fetched successfully',
        dashboardData
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching student dashboard: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch student dashboard', null);
    }
  }

  /**
   * Get student subjects
   * @param user - User object with sub and email
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   */
  async getStudentSubjects(user: any, page: number = 1, limit: number = 10) {
    this.logger.log(colors.cyan(`Fetching subjects for student: ${user.email}`));

    const full_user = await this.prisma.user.findUnique({
      where: {
        id: user.sub
      }
    });

    if (!full_user) {
      this.logger.error(colors.red(`User not found for ID: ${user.sub}`));
      return new ApiResponse(false, 'User not found', null);
    }

    // Check if user has student role
    if (full_user.role !== 'student') {
      this.logger.error(colors.red(`User ${full_user.email} has role '${full_user.role}', expected 'student'`));
      return new ApiResponse(false, 'Access denied. Student role required.', null);
    }

    try {
      // Get student record
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.sub,
          school_id: full_user.school_id
        }
      });

      if (!student) {
        this.logger.error(colors.red(`Student not found for user: ${user.email}`));
        return new ApiResponse(false, 'Student not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        return new ApiResponse(false, 'No current academic session found', null);
      }

      // Get student's class
      const studentClass = await this.prisma.class.findUnique({
        where: { id: student.current_class_id || undefined }
      });

      if (!studentClass) {
        return new ApiResponse(false, 'Student class not found', null);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get subjects for the student's class in current academic session
      const subjects = await this.prisma.subject.findMany({
        where: {
          schoolId: student.school_id,
          academic_session_id: currentSession.id,
          classId: studentClass.id
        },
        include: {
          timetableEntries: {
            where: {
              class_id: studentClass.id,
              academic_session_id: currentSession.id,
              isActive: true
            },
            include: {
              timeSlot: {
                select: {
                  startTime: true,
                  endTime: true
                }
              },
              class: {
                select: {
                  id: true,
                  name: true,
                  classId: true
                }
              }
            }
          },
          Class: {
            where: {
              id: studentClass.id
            },
            select: {
              id: true,
              name: true,
              classId: true
            }
          },
          topics: {
            include: {
              _count: {
                select: {
                  videoContent: true,
                  pdfMaterial: true,
                  assignments: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          name: 'asc'
        }
      });

      // Get total count for pagination
      const totalSubjects = await this.prisma.subject.count({
        where: {
          schoolId: student.school_id,
          academic_session_id: currentSession.id,
          classId: studentClass.id
        }
      });

      // Format subjects data
      const formattedSubjects = subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        color: subject.color,
        description: subject.description || `Learn ${subject.name}`,
        thumbnail: subject.thumbnail,
        timetableEntries: subject.timetableEntries.map(entry => ({
          id: entry.id,
          day_of_week: entry.day_of_week,
          startTime: entry.timeSlot.startTime,
          endTime: entry.timeSlot.endTime,
          room: entry.room,
          class: {
            id: entry.class.id,
            name: entry.class.name,
            classId: entry.class.classId
          }
        })),
        classesTakingSubject: subject.Class ? [{
          id: subject.Class.id,
          name: subject.Class.name,
          classId: subject.Class.classId
        }] : [],
        contentCounts: {
          totalVideos: subject.topics.reduce((sum, topic) => sum + topic._count.videoContent, 0),
          totalMaterials: subject.topics.reduce((sum, topic) => sum + topic._count.pdfMaterial, 0),
          totalAssignments: subject.topics.reduce((sum, topic) => sum + topic._count.assignments, 0)
        },
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt
      }));

      // Calculate total stats
      const totalVideos = formattedSubjects.reduce((sum, subject) => sum + subject.contentCounts.totalVideos, 0);
      const totalMaterials = formattedSubjects.reduce((sum, subject) => sum + subject.contentCounts.totalMaterials, 0);
      const totalAssignments = formattedSubjects.reduce((sum, subject) => sum + subject.contentCounts.totalAssignments, 0);

      // Calculate pagination info
      const totalPages = Math.ceil(totalSubjects / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const responseData = {
        subjects: formattedSubjects,
        stats: {
          totalSubjects,
          totalVideos,
          totalMaterials,
          totalAssignments
        },
        academicSession: {
          id: currentSession.id,
          academic_year: currentSession.academic_year,
          term: currentSession.term
        },
        pagination: {
          page,
          limit,
          total: totalSubjects,
          totalPages,
          hasNext,
          hasPrev
        }
      };

      this.logger.log(colors.green(`Student subjects fetched successfully: ${formattedSubjects.length} subjects`));

      return new ApiResponse(
        true,
        'Student subjects fetched successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching student subjects: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch student subjects', null);
    }
  }

  /**
   * Get student subject details with topics
   * @param user - User object with sub and email
   * @param subjectId - Subject ID
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   */
  async getStudentSubjectDetails(user: any, subjectId: string, page: number = 1, limit: number = 10) {
    this.logger.log(colors.cyan(`Fetching subject details for student: ${user.email}, subject: ${subjectId}`));

    const full_user = await this.prisma.user.findUnique({
      where: {
        id: user.sub
      }
    });

    if (!full_user) {
      this.logger.error(colors.red(`User not found for ID: ${user.sub}`));
      return new ApiResponse(false, 'User not found', null);
    }

    // Check if user has student role
    if (full_user.role !== 'student') {
      this.logger.error(colors.red(`User ${full_user.email} has role '${full_user.role}', expected 'student'`));
      return new ApiResponse(false, 'Access denied. Student role required.', null);
    }

    try {
      // Get student record
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.sub,
          school_id: full_user.school_id
        }
      });

      if (!student) {
        this.logger.error(colors.red(`Student not found for user: ${user.email}`));
        return new ApiResponse(false, 'Student not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        return new ApiResponse(false, 'No current academic session found', null);
      }

      // Get student's class
      const studentClass = await this.prisma.class.findUnique({
        where: { id: student.current_class_id || undefined }
      });

      if (!studentClass) {
        return new ApiResponse(false, 'Student class not found', null);
      }

      // Get subject details
      const subject = await this.prisma.subject.findFirst({
        where: {
          id: subjectId,
          schoolId: student.school_id,
          academic_session_id: currentSession.id,
          classId: studentClass.id
        },
        include: {
          school: {
            select: {
              id: true,
              school_name: true
            }
          },
          academicSession: {
            select: {
              id: true,
              academic_year: true,
              term: true
            }
          }
        }
      });

      if (!subject) {
        this.logger.error(colors.red(`Subject not found: ${subjectId}`));
        return new ApiResponse(false, 'Subject not found or access denied', null);
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get topics for the subject
      const topics = await this.prisma.topic.findMany({
        where: {
          subject_id: subjectId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          is_active: true
        },
        include: {
          videoContent: {
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              duration: true,
              thumbnail: true,
              size: true,
              views: true,
              status: true,
              createdAt: true,
              updatedAt: true
            }
          },
          pdfMaterial: {
            select: {
              id: true,
              title: true,
              description: true,
              url: true,
              size: true,
              fileType: true,
              downloads: true,
              status: true,
              createdAt: true,
              updatedAt: true
            }
          },
          assignments: {
            where: {
              is_published: true
            },
            select: {
              id: true,
              title: true,
              description: true,
              due_date: true,
              max_score: true,
              status: true,
              createdAt: true
            }
          },
          cbtQuizzes: {
            where: {
              status: 'PUBLISHED',
              is_published: true
            },
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              max_attempts: true,
              passing_score: true,
              status: true,
              createdAt: true
            }
          }
        },
        orderBy: {
          order: 'asc'
        },
        skip,
        take: limit
      });

      // Get total topics count
      const totalTopics = await this.prisma.topic.count({
        where: {
          subject_id: subjectId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          is_active: true
        }
      });

      // Calculate content stats
      const totalVideos = await this.prisma.videoContent.count({
        where: {
          topic: {
            subject_id: subjectId,
            school_id: student.school_id,
            academic_session_id: currentSession.id,
            is_active: true
          }
        }
      });

      const totalMaterials = await this.prisma.pDFMaterial.count({
        where: {
          topic: {
            subject_id: subjectId,
            school_id: student.school_id,
            academic_session_id: currentSession.id,
            is_active: true
          }
        }
      });

      const totalAssignments = await this.prisma.assignment.count({
        where: {
          topic: {
            subject_id: subjectId,
            school_id: student.school_id,
            academic_session_id: currentSession.id,
            is_active: true
          },
          is_published: true
        }
      });

      const totalQuizzes = await this.prisma.cBTQuiz.count({
        where: {
          subject_id: subjectId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          status: 'PUBLISHED',
          is_published: true
        }
      });

      // Format topics data
      const formattedTopics = topics.map(topic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description || '',
        instructions: topic.instructions || '',
        order: topic.order,
        status: topic.is_active ? 'active' : 'inactive',
        videos: topic.videoContent.map(video => ({
          id: video.id,
          title: video.title,
          description: video.description,
          url: video.url,
          duration: video.duration || '00:00',
          thumbnail: video.thumbnail,
          size: video.size || '0 MB',
          views: video.views || 0,
          status: video.status || 'published',
          uploadedAt: video.createdAt
        })),
        materials: topic.pdfMaterial.map(material => ({
          id: material.id,
          title: material.title,
          description: material.description,
          url: material.url,
          type: material.fileType || 'pdf',
          size: material.size || '0 MB',
          downloads: material.downloads || 0,
          status: material.status || 'published',
          uploadedAt: material.createdAt
        })),
        assignments: topic.assignments.map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.due_date,
          maxScore: assignment.max_score,
          status: assignment.status,
          createdAt: assignment.createdAt
        })),
        quizzes: topic.cbtQuizzes.map(quiz => ({
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          duration: quiz.duration,
          maxAttempts: quiz.max_attempts,
          passingScore: quiz.passing_score,
          status: quiz.status,
          createdAt: quiz.createdAt
        })),
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt
      }));

      // Calculate pagination info
      const totalPages = Math.ceil(totalTopics / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const responseData = {
        subject: {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          color: subject.color,
          description: subject.description,
          thumbnail: subject.thumbnail,
          school: subject.school,
          academicSession: subject.academicSession,
          createdAt: subject.createdAt,
          updatedAt: subject.updatedAt
        },
        topics: formattedTopics,
        stats: {
          totalTopics,
          totalVideos,
          totalMaterials,
          totalAssignments,
          totalQuizzes
        },
        pagination: {
          page,
          limit,
          total: totalTopics,
          totalPages,
          hasNext,
          hasPrev
        }
      };

      this.logger.log(colors.green(`Subject details fetched successfully: ${formattedTopics.length} topics`));

      return new ApiResponse(
        true,
        'Subject details fetched successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching subject details: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch subject details', null);
    }
  }

  /**
   * Get all content for a specific topic (similar to teacher's endpoint)
   * @param user - User object with sub and email
   * @param topicId - Topic ID
   */
  async getTopicContent(user: any, topicId: string) {
    this.logger.log(colors.cyan(`🔄 Starting to fetch content for topic: ${topicId}`));
    
    try {
      // Fetch user from database to get school_id
      this.logger.log(colors.blue(`📋 Fetching user details for topic content...`));
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true, role: true }
      });

      if (!dbUser) {
        this.logger.error(colors.red(`❌ User not found for topic content fetch`));
        return new ApiResponse(false, 'User not found', null);
      }

      // Check if user has student role
      if (dbUser.role !== 'student') {
        this.logger.error(colors.red(`❌ User ${user.email} has role '${dbUser.role}', expected 'student'`));
        return new ApiResponse(false, 'Access denied. Student role required.', null);
      }

      const schoolId = dbUser.school_id;

      // Get the topic first to validate it exists and belongs to the school
      this.logger.log(colors.blue(`📚 Validating topic exists and belongs to school...`));
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: topicId,
          school_id: schoolId,
          is_active: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!topic) {
        this.logger.error(colors.red(`❌ Topic not found: ${topicId}`));
        return new ApiResponse(false, 'Topic not found', null);
      }

      const [
        videos,
        materials,
        assignments,
        quizzes,
        liveClasses,
        libraryResources
      ] = await Promise.all([
        // Videos - only published ones for students
        this.prisma.videoContent.findMany({
          where: {
            topic_id: topicId,
            schoolId: schoolId,
            status: 'published'
          },
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            thumbnail: true,
            duration: true,
            order: true,
            size: true,
            views: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // PDF Materials - only published ones for students
        this.prisma.pDFMaterial.findMany({
          where: {
            topic_id: topicId,
            schoolId: schoolId,
            status: 'published'
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // Assignments - only published ones for students
        this.prisma.assignment.findMany({
          where: {
            topic_id: topicId,
            school_id: schoolId,
            is_published: true
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            due_date: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // CBT Quizzes - only published ones for students
        this.prisma.cBTQuiz.findMany({
          where: {
            topic_id: topicId,
            school_id: schoolId,
            status: 'PUBLISHED',
            is_published: true
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // Live Classes - only active ones for students
        this.prisma.liveClass.findMany({
          where: {
            topic_id: topicId,
            schoolId: schoolId,
            status: 'scheduled'
          },
          orderBy: { startTime: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            meetingUrl: true,
            startTime: true,
            endTime: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // Library Resources - only available ones for students
        this.prisma.libraryResource.findMany({
          where: {
            topic_id: topicId,
            schoolId: schoolId,
            status: 'available'
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            resourceType: true,
            url: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      this.logger.log(colors.blue(`📊 Content fetched successfully:`));
      this.logger.log(colors.blue(`   - Videos: ${videos.length}`));
      this.logger.log(colors.blue(`   - Materials: ${materials.length}`));
      this.logger.log(colors.blue(`   - Assignments: ${assignments.length}`));
      this.logger.log(colors.blue(`   - Quizzes: ${quizzes.length}`));
      this.logger.log(colors.blue(`   - Live Classes: ${liveClasses.length}`));
      this.logger.log(colors.blue(`   - Library Resources: ${libraryResources.length}`));

      // Calculate content summary
      const contentSummary = {
        totalVideos: videos.length,
        totalMaterials: materials.length,
        totalAssignments: assignments.length,
        totalQuizzes: quizzes.length,
        totalLiveClasses: liveClasses.length,
        totalLibraryResources: libraryResources.length,
        totalContent: videos.length + materials.length + assignments.length + 
                     quizzes.length + liveClasses.length + libraryResources.length,
      };

      // Build response (same structure as teacher's endpoint)
      const response = {
        topicId: topic.id,
        topicTitle: topic.title,
        topicDescription: topic.description,
        topicOrder: topic.order,
        contentSummary,
        videos,
        materials,
        assignments,
        quizzes,
        liveClasses,
        libraryResources,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      };

      this.logger.log(colors.green(`🎉 Successfully retrieved content for topic "${topic.title}": ${contentSummary.totalContent} total items`));
      
      return new ApiResponse(
        true,
        'Topic content retrieved successfully',
        response
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching topic content for ${topicId}: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch topic content', null);
    }
  }

  /**
   * Get all topics for a subject (similar to teacher's endpoint)
   * @param user - User object with sub and email
   * @param subjectId - Subject ID (optional)
   * @param academicSessionId - Academic Session ID (optional)
   */
  async getAllTopics(user: any, subjectId?: string, academicSessionId?: string) {
    this.logger.log(colors.cyan(`Fetching topics for student: ${user.email}`));

    try {
      // Fetch user from database to get school_id
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true, role: true }
      });

      if (!dbUser) {
        this.logger.error(colors.red(`❌ User not found for topics fetch`));
        return new ApiResponse(false, 'User not found', null);
      }

      // Check if user has student role
      if (dbUser.role !== 'student') {
        this.logger.error(colors.red(`❌ User ${user.email} has role '${dbUser.role}', expected 'student'`));
        return new ApiResponse(false, 'Access denied. Student role required.', null);
      }

      const schoolId = dbUser.school_id;

      this.logger.log(colors.cyan(`Fetching topics for school: ${schoolId}`));

      // Build where clause
      const where: any = { 
        school_id: schoolId,
        is_active: true // Only active topics for students
      };
      
      if (subjectId) {
        where.subject_id = subjectId;
      }
      if (academicSessionId) {
        where.academic_session_id = academicSessionId;
      }

      const topics = await this.prisma.topic.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
            },
          },
          school: {
            select: {
              id: true,
              school_name: true,
            },
          },
          academicSession: {
            select: {
              id: true,
              academic_year: true,
              term: true,
            },
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
        orderBy: [
          { subject_id: 'asc' },
          { order: 'asc' },
        ],
      });

      // Format topics data (same structure as teacher's endpoint)
      const formattedTopics = topics.map(topic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        instructions: topic.instructions,
        order: topic.order,
        isActive: topic.is_active,
        subject: topic.subject,
        school: topic.school,
        academicSession: topic.academicSession,
        createdBy: topic.createdBy,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
      }));

      this.logger.log(colors.green(`✅ Successfully retrieved ${formattedTopics.length} topics for student`));

      return new ApiResponse(
        true,
        'Topics retrieved successfully',
        formattedTopics
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching topics: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch topics', null);
    }
  }

  /**
   * Fetch timetable schedules for currently signed in student based on class
   * @param user - User object with sub and email
   */
  async fetchSchedulesTabForStudent(user: any) {
    this.logger.log(colors.blue(`Fetching schedules tab for student: ${user.email}`));

    try {
      // Get full user data with school_id
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true, role: true }
      });

      if (!fullUser) {
        this.logger.error(colors.red(`❌ User not found for schedules fetch`));
        return new ApiResponse(false, 'User not found', null);
      }

      // Check if user has student role
      if (fullUser.role !== 'student') {
        this.logger.error(colors.red(`❌ User ${user.email} has role '${fullUser.role}', expected 'student'`));
        return new ApiResponse(false, 'Access denied. Student role required.', null);
      }

      // Get student record
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.sub,
          school_id: fullUser.school_id
        }
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found for user: ${user.email}`));
        return new ApiResponse(false, 'Student not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        return new ApiResponse(false, 'No current academic session found', null);
      }

      // Get student's class
      const studentClass = await this.prisma.class.findUnique({
        where: { id: student.current_class_id || undefined },
        include: {
          subjects: {
            where: {
              academic_session_id: currentSession.id
            },
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          }
        }
      });

      if (!studentClass) {
        return new ApiResponse(false, 'Student class not found', null);
      }

      this.logger.log(colors.green(`✅ Student found: ${user.email}`));
      this.logger.log(colors.green(`✅ Student class: ${studentClass.name}`));
      this.logger.log(colors.green(`✅ Subjects in class: ${studentClass.subjects.length}`));

      // Get all active timeslots for the school
      const timeSlots = await this.prisma.timeSlot.findMany({
        where: {
          schoolId: student.school_id,
          isActive: true
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          order: true,
          label: true
        },
        orderBy: {
          order: 'asc'
        }
      });

      // Get timetable entries for the student's class
      const subjectIds = studentClass.subjects.map(subject => subject.id);
      const timetableEntries = await this.prisma.timetableEntry.findMany({
        where: {
          school_id: student.school_id,
          class_id: studentClass.id,
          academic_session_id: currentSession.id,
          isActive: true
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          },
          class: {
            select: {
              id: true,
              name: true
            }
          },
          teacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          timeSlot: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              order: true,
              label: true
            }
          }
        },
        orderBy: [
          { day_of_week: 'asc' },
          { timeSlot: { order: 'asc' } }
        ]
      });

      // Format timetable data with schedule grouped by day
      const schedule: any = {};
      
      // Initialize schedule for all days with all timeslots
      const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
      
      daysOfWeek.forEach(day => {
        schedule[day] = timeSlots.map(timeSlot => ({
          timeSlotId: timeSlot.id,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          label: timeSlot.label,
          subject: null,
          teacher: null,
          room: null
        }));
      });

      // Fill in the actual timetable entries
      timetableEntries.forEach(entry => {
        const daySchedule = schedule[entry.day_of_week];
        if (daySchedule) {
          const timeSlotIndex = daySchedule.findIndex(slot => slot.timeSlotId === entry.timeSlot.id);
          if (timeSlotIndex !== -1) {
            daySchedule[timeSlotIndex] = {
              timeSlotId: entry.timeSlot.id,
              startTime: entry.timeSlot.startTime,
              endTime: entry.timeSlot.endTime,
              label: entry.timeSlot.label,
              subject: entry.subject,
              teacher: {
                id: entry.teacher.id,
                name: `${entry.teacher.first_name} ${entry.teacher.last_name}`
              },
              room: entry.room || ""
            };
          }
        }
      });

      const timetableData = {
        timeSlots: timeSlots,
        schedule: schedule
      };

      const responseData = {
        studentClass: {
          id: studentClass.id,
          name: studentClass.name
        },
        subjects: studentClass.subjects,
        timetable_data: timetableData
      };

      this.logger.log(colors.green(`Schedules tab fetched successfully for student: ${user.email}`));

      return new ApiResponse(
        true,
        'Schedules tab fetched successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching schedules tab for student: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch schedules tab', null);
    }
  }

  /**
   * Fetch all assessments for currently signed in student
   * @param user - User object with sub and email
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   * @param search - Search term for assessment title/description
   * @param assessmentType - Filter by assessment type
   * @param status - Filter by assessment status
   */
  async fetchAssessmentsForStudent(
    user: any,
    page: number = 1,
    limit: number = 10,
    search?: string,
    assessmentType?: string,
    status?: string
  ) {
    this.logger.log(colors.cyan(`Fetching assessments for student: ${user.email}`));

    try {
      // Get full user data with school_id
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true, role: true }
      });

      if (!fullUser) {
        this.logger.error(colors.red(`❌ User not found for assessments fetch`));
        return new ApiResponse(false, 'User not found', null);
      }

      // Check if user has student role
      if (fullUser.role !== 'student') {
        this.logger.error(colors.red(`❌ User ${user.email} has role '${fullUser.role}', expected 'student'`));
        return new ApiResponse(false, 'Access denied. Student role required.', null);
      }

      // Get student record
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.sub,
          school_id: fullUser.school_id
        }
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found for user: ${user.email}`));
        return new ApiResponse(false, 'Student not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(colors.red(`No current academic session found for student: ${user.email}`));
        return new ApiResponse(false, 'No current academic session found', null);
      }

      // Get student's class
      const studentClass = await this.prisma.class.findUnique({
        where: { id: student.current_class_id || undefined },
        include: {
          subjects: {
            where: {
              academic_session_id: currentSession.id
            },
            select: {
              id: true
            }
          }
        }
      });

      if (!studentClass) {
        this.logger.error(colors.red(`Student class not found for student: ${user.email}`));
        return new ApiResponse(false, 'Student class not found', null);
      }

      const subjectIds = studentClass.subjects.map(subject => subject.id);

      this.logger.log(colors.green(`✅ Student found: ${user.email}`));
      this.logger.log(colors.green(`✅ Student class: ${studentClass.name}`));
      this.logger.log(colors.green(`✅ Subjects in class: ${subjectIds.length}`));

      // Build where clause for assessments
      const where: any = {
        // school_id: student.school_id,
        academic_session_id: currentSession.id,
        subject_id: {
          in: subjectIds
        },
        is_published: true, // Only published assessments for students
        status: {
          in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] // Include closed assessments for review
        }
      };

      // Add search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Add assessment type filter
      if (assessmentType && assessmentType !== 'all') {
        where.assessment_type = assessmentType;
      }

      // Add status filter
      if (status && status !== 'all') {
        where.status = status;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const totalAssessments = await this.prisma.cBTQuiz.count({ where });

      // Get assessments with pagination
      const assessments = await this.prisma.cBTQuiz.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          questions: {
            select: {
              id: true
            }
          }
        },
        orderBy: [
          { assessment_type: 'asc' },
          { status: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      });

      // Format assessments data
      const formattedAssessments = assessments.map(assessment => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        assessment_type: assessment.assessment_type,
        status: assessment.status,
        duration: assessment.duration,
        total_points: assessment.total_points,
        questions_count: assessment.questions.length,
        subject: {
          id: assessment.subject.id,
          name: assessment.subject.name,
          code: assessment.subject.code,
          color: assessment.subject.color
        },
        teacher: {
          id: assessment.createdBy.id,
          name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`
        },
        due_date: assessment.end_date ? (assessment.end_date.toISOString()) : null,
        created_at: (assessment.createdAt.toISOString()),
        is_published: assessment.is_published,
        _count: {
          questions: assessment.questions.length
        }
      }));

      // Group assessments by assessment_type and status
      const groupedAssessments = formattedAssessments.reduce((groups, assessment) => {
        const key = `${assessment.assessment_type}_${assessment.status}`;
        if (!groups[key]) {
          groups[key] = {
            assessment_type: assessment.assessment_type,
            status: assessment.status,
            count: 0,
            assessments: []
          };
        }
        groups[key].count++;
        groups[key].assessments.push(assessment);
        return groups;
      }, {} as any);

      // Convert grouped object to array
      const groupedArray = Object.values(groupedAssessments);

      // Calculate pagination info
      const totalPages = Math.ceil(totalAssessments / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const responseData = {
        pagination: {
            page,
            limit,
            total: totalAssessments,
            totalPages,
            hasNext,
            hasPrev
          },
          filters: {
            search: search || '',
            assessment_type: assessmentType || 'all',
            status: status || 'all'
          },
        general_info: {
          current_session: {
            academic_year: currentSession.academic_year,
            term: currentSession.term
          }
        },
        assessments: formattedAssessments,
        grouped_assessments: groupedArray,
        
      };

      this.logger.log(colors.green(`✅ Successfully retrieved ${formattedAssessments.length} assessments for student`));
      this.logger.log(colors.green(`✅ Grouped into ${groupedArray.length} groups`));

      return new ApiResponse(
        true,
        'Assessments fetched successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching assessments for student: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch assessments', null);
    }
  }

  /**
   * Get assessment questions for student to work on
   * @param user - User object with sub and email
   * @param assessmentId - Assessment ID
   */
  async getAssessmentQuestions(user: any, assessmentId: string) {
    this.logger.log(colors.cyan(`Fetching assessment questions for student: ${user.email}, assessment: ${assessmentId}`));

    try {
      // Get full user data with school_id
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true, role: true }
      });

      if (!fullUser) {
        this.logger.error(colors.red(`❌ User not found for assessment questions fetch`));
        return new ApiResponse(false, 'User not found', null);
      }

      // Check if user has student role
      if (fullUser.role !== 'student') {
        this.logger.error(colors.red(`❌ User ${user.email} has role '${fullUser.role}', expected 'student'`));
        return new ApiResponse(false, 'Access denied. Student role required.', null);
      }

      // Get student record
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.sub,
          school_id: fullUser.school_id
        }
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found for user: ${user.email}`));
        return new ApiResponse(false, 'Student not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(colors.red(`No current academic session found for student: ${user.email}`));
        return new ApiResponse(false, 'No current academic session found', null);
      }

      // Get student's class
      const studentClass = await this.prisma.class.findUnique({
        where: { id: student.current_class_id || undefined },
        include: {
          subjects: {
            where: {
              academic_session_id: currentSession.id
            },
            select: {
              id: true
            }
          }
        }
      });

      if (!studentClass) {
        this.logger.error(colors.red(`Student class not found for student: ${user.email}`));
        return new ApiResponse(false, 'Student class not found', null);
      }

      const subjectIds = studentClass.subjects.map(subject => subject.id);

      // Get the assessment with all questions and options
      const assessment = await this.prisma.cBTQuiz.findFirst({
        where: {
          id: assessmentId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          subject_id: {
            in: subjectIds
          },
        //   is_published: true,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED']
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          questions: {
            include: {
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
              },
              correct_answers: {
                select: {
                  id: true,
                  option_ids: true
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      if (!assessment) {
        this.logger.error(colors.red(`❌ Assessment not found or access denied: ${assessmentId}`));
        return new ApiResponse(false, 'Assessment not found or access denied', null);
      }

      // Check if assessment is still active (within date range)
      const now = new Date();
      if (assessment.start_date && assessment.start_date > now) {
        this.logger.error(colors.red(`❌ Assessment has not started yet: ${assessmentId}`));
        return new ApiResponse(false, 'Assessment has not started yet', null);
      }
      if (assessment.status && assessment.status === 'CLOSED') {
        this.logger.error(colors.red(`❌ Assessment has expired: ${assessmentId}`));
        return new ApiResponse(false, 'Assessment has expired', null);
      }

      // Check student's attempt count
      const attemptCount = await this.prisma.cBTQuizAttempt.count({
        where: {
          quiz_id: assessmentId,
          student_id: student.id
        }
      });

      if (attemptCount >= assessment.max_attempts) {
        return new ApiResponse(false, 'Maximum attempts reached for this assessment', null);
      }

      // Format assessment data
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
        instructions: assessment.instructions,
        subject: {
          id: assessment.subject.id,
          name: assessment.subject.name,
          code: assessment.subject.code,
          color: assessment.subject.color
        },
        teacher: {
          id: assessment.createdBy.id,
          name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`
        },
        start_date: assessment.start_date ? assessment.start_date.toISOString() : null,
        end_date: assessment.end_date ? assessment.end_date.toISOString() : null,
        created_at: assessment.createdAt.toISOString(),
        is_published: assessment.is_published,
        student_attempts: attemptCount,
        remaining_attempts: assessment.max_attempts - attemptCount
      };

      // Format questions data
      const formattedQuestions = assessment.questions.map(question => ({
        id: question.id,
        question_text: question.question_text,
        question_image: question.image_url,
        question_type: question.question_type,
        points: question.points,
        order: question.order,
        explanation: question.explanation,
        options: question.options.map(option => ({
          id: option.id,
          text: option.option_text,
          is_correct: option.is_correct,
          order: option.order
        })),
        correct_answers: question.correct_answers.map(answer => ({
          id: answer.id,
          option_ids: answer.option_ids
        }))
      }));

      const responseData = {
        assessment: formattedAssessment,
        questions: formattedQuestions,
        total_questions: formattedQuestions.length,
        total_points: assessment.total_points,
        estimated_duration: assessment.duration
      };

      this.logger.log(colors.green(`✅ Successfully retrieved assessment questions: ${formattedQuestions.length} questions`));

      return new ApiResponse(
        true,
        'Assessment questions retrieved successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching assessment questions: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch assessment questions', null);
    }
  }

  /**
   * Submit assessment answers and auto-grade
   * @param user - User object with sub and email
   * @param assessmentId - Assessment ID
   * @param submissionData - Complete submission data from app
   */
  async submitAssessment(user: any, assessmentId: string, submissionData: any) {
    this.logger.log(colors.cyan(`Submitting assessment for student: ${user.email}, assessment: ${assessmentId}`));
    this.logger.log(colors.blue(`Submission data: ${JSON.stringify(submissionData)}`));

    try {
      // Get full user data with school_id
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true, role: true }
      });

      if (!fullUser) {
        this.logger.error(colors.red(`❌ User not found for assessment submission`));
        return new ApiResponse(false, 'User not found', null);
      }

      // Check if user has student role
      if (fullUser.role !== 'student') {
        this.logger.error(colors.red(`❌ User ${user.email} has role '${fullUser.role}', expected 'student'`));
        return new ApiResponse(false, 'Access denied. Student role required.', null);
      }

      // Get student record
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.sub,
          school_id: fullUser.school_id
        }
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found for user: ${user.email}`));
        return new ApiResponse(false, 'Student not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(colors.red(`No current academic session found for student: ${user.email}`));
        return new ApiResponse(false, 'No current academic session found', null);
      }

      // Get the assessment
      const assessment = await this.prisma.cBTQuiz.findFirst({
        where: {
          id: assessmentId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          is_published: true,
          status: {
            in: ['PUBLISHED', 'ACTIVE']
          }
        },
        include: {
          questions: {
            include: {
              correct_answers: true
            }
          }
        }
      });

      if (!assessment) {
        this.logger.error(colors.red(`❌ Assessment not found or access denied: ${assessmentId}`));
        return new ApiResponse(false, 'Assessment not found or access denied', null);
      }

      // Check if assessment is still active
      const now = new Date();
      if (assessment.start_date && assessment.start_date > now) {
        return new ApiResponse(false, 'Assessment has not started yet', null);
      }
      if (assessment.end_date && assessment.end_date < now) {
        return new ApiResponse(false, 'Assessment has expired', null);
      }

      // Check student's attempt count
      const attemptCount = await this.prisma.cBTQuizAttempt.count({
        where: {
          quiz_id: assessmentId,
          student_id: user.sub // Use user.sub (User.id) not student.id
        }
      });

      if (attemptCount >= assessment.max_attempts) {
        return new ApiResponse(false, 'Maximum attempts reached for this assessment', null);
      }

      // Create attempt
      const attempt = await this.prisma.cBTQuizAttempt.create({
        data: {
          quiz_id: assessmentId,
          student_id: user.sub, // Use user.sub (User.id) not student.id
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          attempt_number: attemptCount + 1,
          status: 'IN_PROGRESS',
          started_at: new Date(),
          max_score: assessment.total_points
        }
      });

      // Extract data from submission
      const { answers, submission_time, time_taken, total_questions, questions_answered, questions_skipped, total_points_possible, total_points_earned, submission_status, device_info } = submissionData;

      // Save student answers and auto-grade
      let totalScore = 0;
      let totalPoints = 0;
      const gradedAnswers: any[] = [];

      for (const answer of answers) {
        const question = assessment.questions.find(q => q.id === answer.question_id);
        if (!question) continue;

        // Check if answer is correct based on question type
        const isCorrect = this.checkAnswerByType(answer, question);
        const pointsEarned = isCorrect ? question.points : 0;

        // Save student answer (using a generic approach since CBTStudentAnswer might not exist)
        // For now, we'll store the answers in the attempt or create a simple storage
        // This would need the CBTStudentAnswer model to be added to the schema

        gradedAnswers.push({
          question_id: answer.question_id,
          question_type: answer.question_type,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          max_points: question.points,
          selected_options: answer.selected_options,
          text_answer: answer.text_answer
        });

        totalScore += pointsEarned;
        totalPoints += question.points;
      }

      // Calculate final scores
      const percentage = totalPoints > 0 ? (totalScore / totalPoints) * 100 : 0;
      const passed = percentage >= assessment.passing_score;
      const grade = this.calculateGrade(percentage);

      // Update attempt with final scores
      const timeSpent = time_taken || (attempt.started_at ? Math.floor((new Date().getTime() - attempt.started_at.getTime()) / 1000) : 0);
      
      await this.prisma.cBTQuizAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'GRADED',
          submitted_at: submission_time ? new Date(submission_time) : new Date(),
          time_spent: timeSpent,
          total_score: totalScore,
          percentage: percentage,
          passed: passed,
          is_graded: true,
          graded_at: new Date()
        }
      });

      const responseData = {
        attempt_id: attempt.id,
        assessment_id: assessmentId,
        student_id: user.sub, // Use user.sub (User.id) not student.id
        total_score: totalScore,
        total_points: totalPoints,
        percentage_score: percentage,
        passed: passed,
        grade: grade,
        answers: gradedAnswers,
        submission_metadata: {
          total_questions: total_questions,
          questions_answered: questions_answered,
          questions_skipped: questions_skipped,
          total_points_possible: total_points_possible,
          submission_status: submission_status,
          device_info: device_info
        },
        submitted_at: submission_time || new Date().toISOString(),
        time_spent: timeSpent
      };

      this.logger.log(colors.green(`✅ Assessment submitted successfully: ${totalScore}/${totalPoints} (${percentage.toFixed(1)}%)`));

      return new ApiResponse(
        true,
        'Assessment submitted successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error submitting assessment: ${error.message}`));
      return new ApiResponse(false, 'Failed to submit assessment', null);
    }
  }

  /**
   * Check if student answer is correct based on question type
   * @param answer - Student's answer from app
   * @param question - Question from database
   */
  private checkAnswerByType(answer: any, question: any): boolean {
    const correctAnswers = question.correct_answers;
    if (!correctAnswers || correctAnswers.length === 0) return false;

    const correctAnswer = correctAnswers[0]; // Assuming one correct answer per question

    // Handle different question types
    switch (answer.question_type) {
      case 'MULTIPLE_CHOICE':
        if (answer.selected_options && correctAnswer.option_ids) {
          const studentOptions = answer.selected_options.sort();
          const correctOptions = correctAnswer.option_ids.sort();
          return JSON.stringify(studentOptions) === JSON.stringify(correctOptions);
        }
        break;

      case 'TRUE_FALSE':
        if (answer.selected_options && correctAnswer.option_ids) {
          const studentAnswer = answer.selected_options[0]; // Should be "true" or "false"
          const correctOption = correctAnswer.option_ids[0];
          return studentAnswer === correctOption;
        }
        break;

      case 'FILL_IN_BLANK':
      case 'ESSAY':
        if (answer.text_answer && correctAnswer.answer_text) {
          // For fill-in-blank, do exact match (case-insensitive)
          if (answer.question_type === 'FILL_IN_BLANK') {
            return answer.text_answer.toLowerCase().trim() === correctAnswer.answer_text.toLowerCase().trim();
          }
          // For essay, you might want more sophisticated checking or manual grading
          // For now, do basic text comparison
          return answer.text_answer.toLowerCase().trim() === correctAnswer.answer_text.toLowerCase().trim();
        }
        break;

      case 'NUMERIC':
        if (answer.text_answer && correctAnswer.answer_number !== undefined) {
          const studentNumber = parseFloat(answer.text_answer);
          return !isNaN(studentNumber) && Math.abs(studentNumber - correctAnswer.answer_number) < 0.01;
        }
        break;

      case 'DATE':
        if (answer.text_answer && correctAnswer.answer_date) {
          const studentDate = new Date(answer.text_answer);
          const correctDate = new Date(correctAnswer.answer_date);
          return !isNaN(studentDate.getTime()) && studentDate.getTime() === correctDate.getTime();
        }
        break;

      default:
        // Fallback to old method for other types
        return this.checkAnswer(answer, correctAnswers);
    }

    return false;
  }

  /**
   * Check if student answer is correct (legacy method)
   * @param answer - Student's answer
   * @param correctAnswers - Correct answers from database
   */
  private checkAnswer(answer: any, correctAnswers: any[]): boolean {
    if (!correctAnswers || correctAnswers.length === 0) return false;

    const correctAnswer = correctAnswers[0]; // Assuming one correct answer per question

    // Check multiple choice answers
    if (answer.selected_option_ids && correctAnswer.option_ids) {
      const studentOptions = answer.selected_option_ids.sort();
      const correctOptions = correctAnswer.option_ids.sort();
      return JSON.stringify(studentOptions) === JSON.stringify(correctOptions);
    }

    // Check text answers
    if (answer.answer_text && correctAnswer.answer_text) {
      return answer.answer_text.toLowerCase().trim() === correctAnswer.answer_text.toLowerCase().trim();
    }

    // Check numeric answers
    if (answer.answer_number !== undefined && correctAnswer.answer_number !== undefined) {
      return Math.abs(answer.answer_number - correctAnswer.answer_number) < 0.01;
    }

    // Check date answers
    if (answer.answer_date && correctAnswer.answer_date) {
      const studentDate = new Date(answer.answer_date);
      const correctDate = new Date(correctAnswer.answer_date);
      return studentDate.getTime() === correctDate.getTime();
    }

    return false;
  }

  /**
   * Calculate grade based on percentage
   * @param percentage - Percentage score
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  /**
   * Get assessment questions with user's previous answers
   * @param user - User object with sub and email
   * @param assessmentId - Assessment ID
   */
  async getAssessmentWithAnswers(user: any, assessmentId: string) {
    this.logger.log(colors.cyan(`Fetching assessment with answers for student: ${user.email}, assessment: ${assessmentId}`));

    try {
      // Get full user data with school_id
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true, role: true }
      });

      if (!fullUser) {
        this.logger.error(colors.red(`❌ User not found for assessment with answers fetch`));
        return new ApiResponse(false, 'User not found', null);
      }

      // Check if user has student role
      if (fullUser.role !== 'student') {
        this.logger.error(colors.red(`❌ User ${user.email} has role '${fullUser.role}', expected 'student'`));
        return new ApiResponse(false, 'Access denied. Student role required.', null);
      }

      // Get student record
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.sub,
          school_id: fullUser.school_id
        }
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found for user: ${user.email}`));
        return new ApiResponse(false, 'Student not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          is_current: true
        }
      });

      if (!currentSession) {
        this.logger.error(colors.red(`No current academic session found for student: ${user.email}`));
        return new ApiResponse(false, 'No current academic session found', null);
      }

      // Get student's class
      const studentClass = await this.prisma.class.findUnique({
        where: { id: student.current_class_id || undefined },
        include: {
          subjects: {
            where: {
              academic_session_id: currentSession.id
            },
            select: {
              id: true
            }
          }
        }
      });

      if (!studentClass) {
        this.logger.error(colors.red(`Student class not found for student: ${user.email}`));
        return new ApiResponse(false, 'Student class not found', null);
      }

      const subjectIds = studentClass.subjects.map(subject => subject.id);

      // Get the assessment with all questions and options
      const assessment = await this.prisma.cBTQuiz.findFirst({
        where: {
          id: assessmentId,
          school_id: student.school_id,
          academic_session_id: currentSession.id,
          subject_id: {
            in: subjectIds
          },
          is_published: true,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED']
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
            }
          },
          createdBy: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          },
          questions: {
            include: {
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
              },
              correct_answers: {
                select: {
                  id: true,
                  option_ids: true
                }
              }
            },
            orderBy: {
              order: 'asc'
            }
          }
        }
      });

      if (!assessment) {
        this.logger.error(colors.red(`❌ Assessment not found or access denied: ${assessmentId}`));
        return new ApiResponse(false, 'Assessment not found or access denied', null);
      }

      // Get all attempts for this assessment by this student
      const attempts = await this.prisma.cBTQuizAttempt.findMany({
        where: {
          quiz_id: assessmentId,
          student_id: user.sub
        },
        include: {
          responses: {
            include: {
              selectedOptions: {
                select: {
                  id: true,
                  option_text: true,
                  is_correct: true,
                  order: true
                }
              }
            }
          }
        },
        orderBy: {
          submitted_at: 'desc'
        }
      });

      // Format assessment data
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
        instructions: assessment.instructions,
        subject: {
          id: assessment.subject.id,
          name: assessment.subject.name,
          code: assessment.subject.code,
          color: assessment.subject.color
        },
        teacher: {
          id: assessment.createdBy.id,
          name: `${assessment.createdBy.first_name} ${assessment.createdBy.last_name}`
        },
        start_date: assessment.start_date ? assessment.start_date.toISOString() : null,
        end_date: assessment.end_date ? assessment.end_date.toISOString() : null,
        created_at: assessment.createdAt.toISOString(),
        is_published: assessment.is_published,
        total_attempts: attempts.length,
        remaining_attempts: Math.max(0, assessment.max_attempts - attempts.length)
      };

      // Format questions with user answers
      const formattedQuestions = assessment.questions.map(question => {
        // Find user's answer for this question from the latest attempt
        const latestAttempt = attempts[0];
        const userAnswer = latestAttempt?.responses.find(response => response.question_id === question.id);

        return {
          id: question.id,
          question_text: question.question_text,
          question_image: question.image_url,
          question_type: question.question_type,
          points: question.points,
          order: question.order,
          explanation: question.explanation,
          options: question.options.map(option => ({
            id: option.id,
            text: option.option_text,
            is_correct: option.is_correct,
            order: option.order,
            is_selected: userAnswer?.selectedOptions.some(selected => selected.id === option.id) || false
          })),
          user_answer: userAnswer ? {
            text_answer: userAnswer.text_answer,
            selected_options: userAnswer.selectedOptions.map(opt => ({
              id: opt.id,
              text: opt.option_text,
              is_correct: opt.is_correct
            })),
            is_correct: userAnswer.is_correct,
            points_earned: userAnswer.points_earned,
            answered_at: userAnswer.createdAt
          } : null,
          correct_answers: question.correct_answers.map(answer => ({
            id: answer.id,
            option_ids: answer.option_ids
          }))
        };
      });

      // Format attempts history
      const formattedAttempts = attempts.map(attempt => ({
        id: attempt.id,
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
        overall_feedback: attempt.overall_feedback
      }));

      const responseData = {
        assessment: formattedAssessment,
        questions: formattedQuestions,
        attempts: formattedAttempts,
        total_questions: formattedQuestions.length,
        total_points: assessment.total_points,
        estimated_duration: assessment.duration
      };

      this.logger.log(colors.green(`✅ Successfully retrieved assessment with answers: ${formattedQuestions.length} questions, ${attempts.length} attempts`));

      return new ApiResponse(
        true,
        'Assessment with answers retrieved successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching assessment with answers: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch assessment with answers', null);
    }
  }
}
