import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AcademicSessionService } from '../../academic-session/academic-session.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { User, DayOfWeek } from '@prisma/client';
import * as colors from 'colors';
import { DateHelpers } from './utils/date-helpers';
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
        return new ApiResponse(false, 'No class assigned to manage', null);
      }

      this.logger.log(colors.green(`✅ Managed class found: ${managedClass.name}`));

      // Calculate student statistics
      const totalStudents = managedClass.students.length;
      const maleStudents = managedClass.students.filter(student => student.gender === 'male').length;
      const femaleStudents = managedClass.students.filter(student => student.gender === 'female').length;

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
          id: managedClass.id,
          name: managedClass.name,
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
}
