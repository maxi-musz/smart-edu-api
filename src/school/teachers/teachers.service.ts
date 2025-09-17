import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AcademicSessionService } from '../../academic-session/academic-session.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { User, DayOfWeek } from '@prisma/client';
import * as colors from 'colors';
import { DateHelpers } from './utils/date-helpers';
import { formatDate } from '../../shared/helper-functions/formatter';
import { AddStudentToClassDto } from '../director/students/dto/auth.dto';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService
  ) {}

  ////////////////////////////////////////////////////////////////////////// GET TEACHER PROFILE
  // GET - /api/v1/teachers/profile
  async getTeacherProfile(user: User) {
    this.logger.log(colors.cyan(`Fetching teacher profile for: ${user.email}`));

    try {
      // Get teacher with all related data
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          user_id: user.id,
          school_id: user.school_id
        },
        include: {
          subjectsTeaching: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  color: true,
                  description: true,
                  classId: true,
                  Class: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          classesManaging: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  students: true,
                  subjects: true
                }
              }
            }
          }
        }
      });

      if (!teacher) {
        return new ApiResponse(false, 'Teacher profile not found', null);
      }

      // Format the response
      const formattedProfile = {
        id: teacher.id,
        name: `${teacher.first_name} ${teacher.last_name}`,
        email: teacher.email,
        phone_number: teacher.phone_number,
        display_picture: teacher.display_picture,
        status: teacher.status,

        assigned_subjects: teacher.subjectsTeaching.map(ts => ({
          id: ts.subject.id,
          name: ts.subject.name,
          code: ts.subject.code,
          color: ts.subject.color,
          description: ts.subject.description,
          assigned_class: ts.subject.Class ? {
            id: ts.subject.Class.id,
            name: ts.subject.Class.name
          } : null
        })),
        managed_classes: teacher.classesManaging.map(cls => ({
          id: cls.id,
          name: cls.name,
          student_count: cls._count.students,
          subject_count: cls._count.subjects
        })),
        summary: {
          total_subjects: teacher.subjectsTeaching.length,
          total_classes: teacher.classesManaging.length
        }
      };

      this.logger.log(colors.green(`Teacher profile fetched successfully for: ${teacher.email}`));

      return new ApiResponse(
        true,
        'Teacher profile fetched successfully',
        formattedProfile
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching teacher profile: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch teacher profile', null);
    }
  }

  ////////////////////////////////////////////////////////////////////////// GET TEACHER TIMETABLE
  // GET - /api/v1/teachers/timetable
  async getTeacherTimetable(user: User) {
    this.logger.log(colors.cyan(`Fetching timetable for teacher: ${user.email}`));

    try {
      // Get all time slots for the school
      const timeSlots = await this.prisma.timeSlot.findMany({
        where: {
          schoolId: user.school_id,
          isActive: true
        },
        orderBy: {
          order: 'asc'
        }
      });

      // Get teacher's timetable entries
      const timetableEntries = await this.prisma.timetableEntry.findMany({
        where: {
          teacher_id: user.id,
          isActive: true
        },
        include: {
          class: {
            select: {
              id: true,
              name: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
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

      // Format timetable by day
      const formattedTimetable = {
        timeSlots: timeSlots.map(slot => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          label: slot.label,
          order: slot.order
        })),
        schedule: {
          MONDAY: this.formatDaySchedule(timetableEntries, 'MONDAY', timeSlots),
          TUESDAY: this.formatDaySchedule(timetableEntries, 'TUESDAY', timeSlots),
          WEDNESDAY: this.formatDaySchedule(timetableEntries, 'WEDNESDAY', timeSlots),
          THURSDAY: this.formatDaySchedule(timetableEntries, 'THURSDAY', timeSlots),
          FRIDAY: this.formatDaySchedule(timetableEntries, 'FRIDAY', timeSlots)
        }
      };

      this.logger.log(colors.green(`Teacher timetable fetched successfully`));

      return new ApiResponse(
        true,
        'Teacher timetable fetched successfully',
        formattedTimetable
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching teacher timetable: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch teacher timetable', null);
    }
  }

  // Helper method to format day schedule
  private formatDaySchedule(timetableEntries: any[], day: string, timeSlots: any[]) {
    // Initialize the day's schedule with empty slots
    const daySchedule = timeSlots.map(slot => ({
      timeSlotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label,
      class: null as any,
      subject: null as any,
      room: null as string | null
    }));

    // Fill in the actual schedule entries
    const dayEntries = timetableEntries.filter(entry => entry.day_of_week === day);
    
    dayEntries.forEach(entry => {
      const slotIndex = daySchedule.findIndex(slot => slot.timeSlotId === entry.timeSlotId);
      if (slotIndex !== -1) {
        daySchedule[slotIndex] = {
          timeSlotId: entry.timeSlotId,
          startTime: entry.timeSlot.startTime,
          endTime: entry.timeSlot.endTime,
          label: entry.timeSlot.label,
          class: {
            id: entry.class.id,
            name: entry.class.name
          },
          subject: {
            id: entry.subject.id,
            name: entry.subject.name,
            code: entry.subject.code,
            color: entry.subject.color
          },
          room: entry.room
        };
      }
    });

    return daySchedule;
  }

  // Deduplicate an array of objects by id while keeping last occurrence
  private uniqueById<T extends { id: string }>(items: T[]): T[] {
    return Array.from(new Map(items.map(item => [item.id, item])).values());
  }



  ////////////////////////////////////////////////////////////////////////// GET TEACHER DASHBOARD
  // GET - /api/v1/teachers/dashboard
  async getTeacherDashboard(user: User) {
    this.logger.log(colors.cyan(`Fetching teacher dashboard for: ${user.email}`));

    try {
      // First get the teacher record to get the correct teacher ID
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: user.school_id
        },
        include: {
          subjectsTeaching: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  color: true,
                  description: true
                }
              }
            }
          }
        }
      });

      if (!teacher) {
        this.logger.error(colors.red(`Teacher not found for user: ${user.email}`));
        return new ApiResponse(false, 'Teacher not found', null);
      }

      this.logger.log(colors.green(`✅ Teacher found: ${teacher.first_name} ${teacher.last_name}`));
      this.logger.log(colors.green(`✅ Subjects teaching: ${teacher.subjectsTeaching.length}`));

      // Get the class the teacher is managing using the correct teacher ID
      const managedClass = await this.prisma.class.findFirst({
        where: {
          classTeacherId: teacher.id,
          schoolId: teacher.school_id
        },
        include: {
          students: {
            select: {
              id: true,
              gender: true
            }
          }
        }
      });

      if (!managedClass) {
        this.logger.error(colors.red(`No class assigned to manage for teacher: ${teacher.first_name} ${teacher.last_name}`));
        // return new ApiResponse(false, 'No class assigned to manage', null);
      }

      this.logger.log(colors.green(`✅ Managed class found: ${managedClass?.name}`));

      // Calculate student statistics
      const totalStudents = managedClass?.students.length;
      const maleStudents = managedClass?.students.filter(student => student.gender === 'male').length;
      const femaleStudents = managedClass?.students.filter(student => student.gender === 'female').length;

      // Get current day and next two days
      const currentDay = DateHelpers.getCurrentDayOfWeek();
      const nextDay = DateHelpers.getNextDay(currentDay);
      const dayAfterNext = DateHelpers.getDayAfterNext(currentDay);

      // Get teacher's schedule for the next 3 days
      const threeDaySchedule = await this.prisma.timetableEntry.findMany({
        where: {
          teacher_id: teacher.id,
          day_of_week: {
            in: [currentDay, nextDay, dayAfterNext]
          },
          isActive: true
        },
        include: {
          class: {
            select: {
              id: true,
              name: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true
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

      this.logger.log(colors.green(`✅ Schedule entries found: ${threeDaySchedule.length}`));

      // Format schedule by day
      const formatDaySchedule = (day: DayOfWeek) => {
        const dayEntries = threeDaySchedule.filter(entry => entry.day_of_week === day);
        return dayEntries.map(entry => ({
          subject: {
            id: entry.subject.id,
            name: entry.subject.name,
            code: entry.subject.code,
            color: entry.subject.color
          },
          class: {
            id: entry.class.id,
            name: entry.class.name
          },
          time: {
            from: entry.timeSlot.startTime,
            to: entry.timeSlot.endTime,
            label: entry.timeSlot.label
          },
          room: entry.room
        }));
      };

      // Format subjects data
      const subjects = teacher.subjectsTeaching.map(ts => ({
        id: ts.subject.id,
        name: ts.subject.name,
        code: ts.subject.code,
        color: ts.subject.color,
        description: ts.subject.description
      }));

      // Get latest three notifications for the school
      const recentNotifications = await this.prisma.notification.findMany({
        where: {
          school_id: teacher.school_id
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
        take: 3
      });

      this.logger.log(colors.green(`✅ Recent notifications found: ${recentNotifications.length}`));

      // Get current academic session
      const currentSessionResponse = await this.academicSessionService.getCurrentSession(teacher.school_id);
      
      if (!currentSessionResponse.success) {
        return new ApiResponse(false, 'No current academic session found', null);
      }

      const currentSession = currentSessionResponse.data;

      this.logger.log(colors.green(`✅ Current session found: ${currentSession.academic_year} - ${currentSession.term} term`));

      const dashboardData = {
        current_session: {
          academic_year: currentSession.academic_year,
          start_year: currentSession.start_year,
          end_year: currentSession.end_year,
          term: currentSession.term,
          term_start_date: currentSession.start_date,
          term_end_date: currentSession.end_date
        },
        managed_class: {
          id: managedClass?.id,
          name: managedClass?.name,
          students: {
            total: totalStudents,
            males: maleStudents,
            females: femaleStudents
          }
        },
        subjects_teaching: subjects,
        recent_notifications: recentNotifications,
        class_schedules: {
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
        }
      };

      this.logger.log(colors.green(`Teacher dashboard fetched successfully for: ${user.email}`));

      return new ApiResponse(
        true,
        'Teacher dashboard fetched successfully',
        dashboardData
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching teacher dashboard: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch teacher dashboard', null);
    }
  }

  async fetchStudentTabForTeacher(
    user: User,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      class_id?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }
  ) {
    this.logger.log(colors.cyan(`Fetching student tab for teacher: ${user.email}`));

    try {
      const {
        page = 1,
        limit = 10,
        search,
        class_id,
        sort_by = 'createdAt',
        sort_order = 'desc'
      } = options;

      const skip = (page - 1) * limit;

      // Get teacher's managed classes
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: user.school_id
        },
        include: {
          classesManaging: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  students: true,
                  subjects: true
                }
              }
            }
          },
          subjectsTeaching: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  color: true,
                  description: true,
                  classId: true,
                  Class: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!teacher) {
        this.logger.error(colors.red(`Teacher not found for user: ${user.email}`));
        return new ApiResponse(false, 'Teacher not found', null);
      }

      // Add logging like schedules tab
      this.logger.log(colors.green(`✅ Teacher found: ${teacher.first_name} ${teacher.last_name}`));
      this.logger.log(colors.green(`✅ Subjects teaching: ${teacher.subjectsTeaching.length}`));
      this.logger.log(colors.green(`✅ Classes managing: ${teacher.classesManaging.length}`));

      // Get managed class IDs
      const managedClassIds = teacher.classesManaging.map(cls => cls.id);

      // Build where clause for students
      const whereClause: any = {
        school_id: user.school_id
      };

      // Add class filter if specified
      if (class_id && managedClassIds.includes(class_id)) {
        whereClause.user = {
          classesEnrolled: {
            some: { id: class_id }
          }
        };
      } else {
        // Filter by managed classes
        whereClause.user = {
          classesEnrolled: {
            some: {
              id: {
                in: managedClassIds
              }
            }
          }
        };
      }

      // Add search filter
      if (search) {
        whereClause.user = {
          ...whereClause.user,
          OR: [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        };
      }

      // Get total count for pagination
      const totalStudents = await this.prisma.student.count({
        where: whereClause
      });

      // Get students with pagination
      const students = await this.prisma.student.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              display_picture: true,
              status: true,
              gender: true
            }
          }
        },
        orderBy: {
          user: {
            [sort_by === 'name' ? 'first_name' : sort_by]: sort_order
          }
        },
        skip,
        take: limit
      });

      // Get class information for each student
      const studentsWithClasses = await Promise.all(
        students.map(async (student) => {
          const classInfo = await this.prisma.class.findFirst({
            where: {
              students: {
                some: {
                  id: student.user_id
                }
              }
            },
            select: {
              id: true,
              name: true
            }
          });

          return {
            ...student,
            class: classInfo
          };
        })
      );

      // Format students data
      const formattedStudents = studentsWithClasses.map(student => ({
        id: student.id,
        student_id: student.student_id,
        name: `${student.user.first_name} ${student.user.last_name}`,
        email: student.user.email,
        display_picture: student.user.display_picture,
        status: student.user.status,
        gender: student.user.gender,
        class: student.class ? {
          id: student.class.id,
          name: student.class.name
        } : null,
        user_id: student.user_id
      }));

      // Format classes data
      const formattedClasses = teacher.classesManaging.map(cls => ({
        id: cls.id,
        name: cls.name,
        student_count: cls._count.students,
        subject_count: cls._count.subjects
      }));

      // Format subjects data
      const formattedSubjects = teacher.subjectsTeaching.map(ts => ({
        id: ts.subject.id,
        name: ts.subject.name,
        code: ts.subject.code,
        color: ts.subject.color,
        description: ts.subject.description,
        assigned_class: ts.subject.Class ? {
          id: ts.subject.Class.id,
          name: ts.subject.Class.name
        } : null
      }));

      const responseData = {
        students: {
          data: formattedStudents,
          pagination: {
            current_page: page,
            total_items: totalStudents,
            total_pages: Math.ceil(totalStudents / limit),
            has_next: page < Math.ceil(totalStudents / limit),
            has_previous: page > 1,
            results_per_page: limit
          }
        },
        classes: formattedClasses,
        subjects: formattedSubjects,
        summary: {
          total_students: totalStudents,
          total_classes: teacher.classesManaging.length,
          total_subjects: teacher.subjectsTeaching.length
        }
      };

      this.logger.log(colors.green(`Student tab fetched successfully for teacher: ${user.email}`));

      return new ApiResponse(
        true,
        'Student tab fetched successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching student tab for teacher: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch student tab', null);
    }
  }

  // schedules tab
  async fetchSchedulesTabForTeacher(user: User) {
    this.logger.log(colors.blue(`Fetching schedules tab for teacher: ${user.email}`));

    try {
      // Get teacher with subjects and classes
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: user.school_id
        },
        include: {
          subjectsTeaching: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  color: true
                }
              }
            }
          },
          classesManaging: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!teacher) {
        return new ApiResponse(false, 'Teacher not found', null);
      }

      this.logger.log(colors.green(`✅ Teacher found: ${teacher.first_name} ${teacher.last_name}`));
      this.logger.log(colors.green(`✅ Subjects teaching: ${teacher.subjectsTeaching.length}`));
      this.logger.log(colors.green(`✅ Classes managing: ${teacher.classesManaging.length}`));

      // Get unique subjects the teacher is teaching
      const subjects = teacher.subjectsTeaching.map(ts => ({
        id: ts.subject.id,
        name: ts.subject.name,
        code: ts.subject.code,
        color: ts.subject.color
      }));

      // Get classes taking these subjects
      const subjectIds = subjects.map(subject => subject.id);
      const classes = await this.prisma.class.findMany({
        where: {
          schoolId: user.school_id,
          subjects: {
            some: {
              id: {
                in: subjectIds
              }
            }
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      // Get all active timeslots for the school
      const timeSlots = await this.prisma.timeSlot.findMany({
        where: {
          schoolId: user.school_id,
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

      // Get timetable entries for the teacher's subjects
      const timetableEntries = await this.prisma.timetableEntry.findMany({
        where: {
          school_id: user.school_id,
          subject_id: {
            in: subjectIds
          },
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
        subjects: subjects,
        classes: classes,
        timetable_data: timetableData
      };

      this.logger.log(colors.green(`Schedules tab fetched successfully for teacher: ${user.email}`));

      return new ApiResponse(
        true,
        'Schedules tab fetched successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching schedules tab for teacher: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch schedules tab', null);
    }
  }

  // fetch subjects dashboard tab with pagination, search, and filtering
  async fetchSubjectsTabForTeacher(
    user: User, 
    query: {
      page?: number;
      limit?: number;
      search?: string;
      academic_session_id?: string;
      class_id?: string;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }
  ) {
    this.logger.log(colors.cyan(`Fetching subjects dashboard tab for teacher: ${user.email} with filters: ${JSON.stringify(query)}`));

    try {
      // 1. Get full user data with school_id
      const fullUser = await this.prisma.user.findFirst({
        where: { id: user.id },
        select: { id: true, school_id: true }
      });

      if (!fullUser || !fullUser.school_id) {
        this.logger.error(colors.red("User not found or missing school_id"));
        return new ApiResponse(false, 'User not found or invalid school data', null);
      }

      // 2. Get current academic session for the school
      const currentSessionResponse = await this.academicSessionService.getCurrentSession(fullUser.school_id);
      if (!currentSessionResponse.success) {
        return new ApiResponse(false, 'No current academic session found for the school', null);
      }
      const currentSession = currentSessionResponse.data;

      // 3. Get teacher data
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: fullUser.school_id,
          academic_session_id: currentSession.id
        },
        include: {
          subjectsTeaching: {
            include: {
              subject: {
                include: {
                  timetableEntries: {
                    include: {
                      class: true,
                      timeSlot: true
                    }
                  }
                }
              }
            }
          },
          classesManaging: true
        }
      });

      if (!teacher) {
        return new ApiResponse(false, 'Teacher not found', null);
      }

      // 4. Get stats (always get total counts regardless of pagination)
      const totalSubjects = teacher.subjectsTeaching.length;
      const totalClasses = teacher.classesManaging.length;
      
      // Count videos uploaded by teacher
      const totalVideos = await this.prisma.videoContent.count({
        where: {
          uploadedById: user.id,
          schoolId: fullUser.school_id
        }
      });

      // Count materials uploaded by teacher
      const totalMaterials = await this.prisma.pDFMaterial.count({
        where: {
          uploadedById: user.id,
          schoolId: fullUser.school_id
        }
      });

      const stats = {
        totalSubjects,
        totalVideos,
        totalMaterials,
        totalClasses
      };

      // 5. Format academic session
      const academicSession = {
        id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term
      };

      // 6. Filter and format subjects with content counts
      let filteredSubjects = await Promise.all(teacher.subjectsTeaching.map(async (teacherSubject) => {
        const subject = teacherSubject.subject;
        
        // Get classes taking this subject (deduplicated by class id)
        const classesTakingSubject = this.uniqueById(
          subject.timetableEntries.map(entry => ({
            id: entry.class.id,
            name: entry.class.name
          }))
        );

        // Get timetable entries for this subject
        const timetableEntries = subject.timetableEntries.map(entry => ({
          id: entry.id,
          day_of_week: entry.day_of_week,
          startTime: entry.timeSlot.startTime,
          endTime: entry.timeSlot.endTime,
          room: entry.room || null,
          class: {
            id: entry.class.id,
            name: entry.class.name
          }
        }));

        // Get content counts for this subject in current academic session
        const [totalVideos, totalMaterials, totalAssignments] = await Promise.all([
          // Count videos for this subject
          this.prisma.videoContent.count({
            where: {
              topic_id: subject.id,
              schoolId: fullUser.school_id,
              platform: {
                schools: {
                  some: {
                    id: fullUser.school_id
                  }
                }
              }
            }
          }),
          // Count PDF materials for this subject
          this.prisma.pDFMaterial.count({
            where: {
              topic_id: subject.id,
              schoolId: fullUser.school_id,
              platform: {
                schools: {
                  some: {
                    id: fullUser.school_id
                  }
                }
              }
            }
          }),
          // Count assignments for this subject
          this.prisma.assignment.count({
            where: {
              topic_id: subject.id,
              school_id: fullUser.school_id
            }
          })
        ]);

        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          color: subject.color,
          description: subject.description,
          thumbnail: subject.thumbnail || null,
          timetableEntries,
          classesTakingSubject,
          contentCounts: {
            totalVideos,
            totalMaterials,
            totalAssignments
          },
          createdAt: formatDate(subject.createdAt),
          updatedAt: formatDate(subject.updatedAt)
        };
      }));

      // 7. Apply search filter
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredSubjects = filteredSubjects.filter(subject => 
          subject.name.toLowerCase().includes(searchTerm) ||
          (subject.code && subject.code.toLowerCase().includes(searchTerm))
        );
      }

      // 7b. Ensure unique subjects by id to avoid frontend duplicate keys
      filteredSubjects = this.uniqueById(filteredSubjects);

      // 8. Apply academic session filter
      if (query.academic_session_id) {
        // Filter subjects that have timetable entries in the specified academic session
        filteredSubjects = filteredSubjects.filter(subject => 
          subject.timetableEntries.some(entry => 
            entry.class && entry.class.id // This would need to be enhanced if we store academic_session_id in timetable entries
          )
        );
      }

      // 9. Apply class filter
      if (query.class_id) {
        filteredSubjects = filteredSubjects.filter(subject => 
          subject.classesTakingSubject.some(cls => cls.id === query.class_id)
        );
      }

      // 10. Apply sorting
      const sortBy = query.sort_by || 'name';
      const sortOrder = query.sort_order || 'asc';
      
      filteredSubjects.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'code':
            aValue = (a.code || '').toLowerCase();
            bValue = (b.code || '').toLowerCase();
            break;
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          default:
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
        }
        
        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });

      // 11. Apply pagination
      const page = query.page || 1;
      const limit = Math.min(query.limit || 5, 10); // Max 10 subjects per page
      const skip = (page - 1) * limit;
      
      const totalCount = filteredSubjects.length;
      const paginatedSubjects = filteredSubjects.slice(skip, skip + limit);

      // 12. Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const pagination = {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      };

      // 13. Get teacher's managed classes and teaching subjects
      const managedClasses = teacher.classesManaging.map(cls => ({
        id: cls.id,
        name: cls.name,
        classId: cls.classId
      }));

      const teachingSubjects = this.uniqueById(teacher.subjectsTeaching.map(ts => ({
        id: ts.subject.id,
        name: ts.subject.name,
        code: ts.subject.code,
        color: ts.subject.color,
        description: ts.subject.description
      })));

      const responseData = {
        pagination,
        managedClasses,
        teachingSubjects,
        stats,
        academicSession,
        subjects: paginatedSubjects,
      };

      this.logger.log(colors.green(`Subjects dashboard tab fetched successfully for teacher: ${user.email} - ${paginatedSubjects.length} subjects returned`));

      return new ApiResponse(true, 'Subjects dashboard tab fetched successfully', responseData);

    } catch (error) {
      this.logger.error(colors.red(`Error fetching subjects dashboard tab for teacher: ${error.message}`), error);
      return new ApiResponse(false, `Failed to fetch subjects dashboard tab: ${error.message}`, null);
    }
  }
}
