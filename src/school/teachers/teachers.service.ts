import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { User, DayOfWeek } from '@prisma/client';
import * as colors from 'colors';
import { DateHelpers } from './utils/date-helpers';
import { AddStudentToClassDto } from '../director/students/dto/auth.dto';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(private readonly prisma: PrismaService) {}

  ////////////////////////////////////////////////////////////////////////// GET TEACHER PROFILE
  // GET - /api/v1/teachers/profile
  async getTeacherProfile(user: User) {
    this.logger.log(colors.cyan(`Fetching teacher profile for: ${user.email}`));

    try {
      // Get teacher with all related data
      const teacher = await this.prisma.user.findFirst({
        where: {
          id: user.id,
          role: 'teacher',
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
        gender: teacher.gender,
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
      // Get the class the teacher is managing
      const managedClass = await this.prisma.class.findFirst({
        where: {
          classTeacherId: user.id,
          schoolId: user.school_id
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
          teacher_id: user.id,
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

      const dashboardData = {
        managed_class: {
          id: managedClass.id,
          name: managedClass.name,
          students: {
            total: totalStudents,
            males: maleStudents,
            females: femaleStudents
          }
        },
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

  ////////////////////////////////////////////////////////////////////////// ADD STUDENT TO CLASS
  // POST - /api/v1/teachers/add-student-to-class

}
