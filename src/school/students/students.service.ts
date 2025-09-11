import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { DayOfWeek } from '@prisma/client';
import * as colors from 'colors';

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
}
