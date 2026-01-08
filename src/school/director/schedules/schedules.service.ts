import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from "colors"
import { ApiResponse } from 'src/shared/helper-functions/response';
import { getTimeTableDTO, CreateTimetableDTO, TimeSlotDTO, UpdateTimeSlotDTO } from 'src/shared/dto/schedules.dto';
import { User } from '@prisma/client';
import { sendTimetableScheduleEmail } from 'src/common/mailer/send-assignment-notifications';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService
  ) {}

  async getTimetable(dto: getTimeTableDTO, user: User): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Fetching timetable for class: ${dto.class}`));
    
    // Get user's school_id
    const userData = await this.prisma.user.findUnique({
      where: { email: user.email },
      select: { school_id: true }
    });

    if (!userData || !userData.school_id) {
      this.logger.log(colors.red(`User not found or missing school_id`));
      return new ApiResponse(false, 'User not found or invalid school data', null);
    }

    this.logger.log(colors.cyan(`Fetching timetable for school: ${userData.school_id}`));
    
    // Get all available classes for the school first (filtered by school)
    const availableClasses = await this.prisma.class.findMany({
      where: {
        name: {
          equals: String(dto.class),
          mode: 'insensitive'
        },
        // schoolId: userData.school_id, // Filter by school
      },
      select: { 
        id: true,
        name: true
      }
    });

    if (availableClasses.length === 0) {
      this.logger.log(colors.red(`Class ${dto.class} not found for school ${userData.school_id}`));
      return new ApiResponse(false, `Class ${dto.class} not found`, null);
    }

    const classData = availableClasses[0]; // Get the first matching class

    // Get all time slots for the school (filtered by school)
    const timeSlots = await this.prisma.timeSlot.findMany({
      where: {
        schoolId: userData.school_id, // Filter by school
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    this.logger.log(colors.yellow(`Found ${timeSlots.length} time slots for school ${userData.school_id}`));

    // Get all timetable entries for the class
    const timetable = await this.prisma.timetableEntry.findMany({
      where: {
        class_id: classData.id,
        isActive: true,
      },
      include: {
        class: true,
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          }
        },
        teacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        timeSlot: true,
      },
      orderBy: [
        { day_of_week: 'asc' },
        { timeSlot: { order: 'asc' } },
      ],
    });

    // Log timetable entries details
    this.logger.log(colors.yellow(`Found ${timetable.length} entries for classId: ${classData.id}`));
    if (timetable.length > 0) {
      timetable.forEach((entry, index) => {
        this.logger.log(colors.cyan(`Entry ${index + 1}:`));
        this.logger.log(colors.green(`  ID: ${entry.id}`));
        this.logger.log(colors.green(`  Day: ${entry.day_of_week}`));
        this.logger.log(colors.green(`  Class: ${entry.class?.name || 'N/A'} (${entry.class_id})`));
        this.logger.log(colors.green(`  Subject: ${entry.subject?.name || 'N/A'} (${entry.subject_id})`));
        this.logger.log(colors.green(`  Teacher: ${entry.teacher?.first_name || ''} ${entry.teacher?.last_name || ''} (${entry.teacher_id})`));
        this.logger.log(colors.green(`  Time Slot: ${entry.timeSlot?.label || 'N/A'} (${entry.timeSlotId}) - ${entry.timeSlot?.startTime || 'N/A'} to ${entry.timeSlot?.endTime || 'N/A'}`));
        this.logger.log(colors.green(`  Room: ${entry.room || 'N/A'}`));
        this.logger.log(colors.green(`  Notes: ${entry.notes || 'N/A'}`));
      });
    }

    // Create a structured timetable
    const formattedTimetable = {
      class: availableClasses.map(cls => ({
        classId: cls.id,
        name: cls.name
      })),
      timeSlots: timeSlots.map(slot => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
        order: slot.order
      })),
      schedule: {
        MONDAY: this.formatDaySchedule(timetable, 'MONDAY', timeSlots),
        TUESDAY: this.formatDaySchedule(timetable, 'TUESDAY', timeSlots),
        WEDNESDAY: this.formatDaySchedule(timetable, 'WEDNESDAY', timeSlots),
        THURSDAY: this.formatDaySchedule(timetable, 'THURSDAY', timeSlots),
        FRIDAY: this.formatDaySchedule(timetable, 'FRIDAY', timeSlots),
      }
    };
    return new ApiResponse(
      true,
      `Timetable for ${dto.class} retrieved successfully`,
      formattedTimetable
    );
  }

  // Get the data needed to create a new schedule entry
  // GET /api/v1/schedules/timetable-options
  async getTimetableOptions(schoolId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Fetching timetable options for school: ${schoolId}`));
    
    try {
      // Fetch all options in parallel for better performance
      const [classes, teachers, subjects, timeSlots] = await Promise.all([
        // Get classes
        this.prisma.class.findMany({
          where: { schoolId },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        }),
        
        // Get teachers
        this.prisma.user.findMany({
          where: { 
            school_id: schoolId,
            role: 'teacher',
            status: 'active'
          },
          select: { 
            id: true, 
            first_name: true, 
            last_name: true 
          },
          orderBy: { first_name: 'asc' }
        }),
        
        // Get subjects
        this.prisma.subject.findMany({
          where: { schoolId },
          select: { 
            id: true, 
            name: true, 
            code: true,
            color: true
          },
          orderBy: { name: 'asc' }
        }),
        
        // Get time slots
        this.prisma.timeSlot.findMany({
          where: { isActive: true },
          select: { 
            id: true, 
            startTime: true, 
            endTime: true, 
            label: true 
          },
          orderBy: { order: 'asc' }
        })
      ]);

      this.logger.log(colors.green(`Found ${classes.length} classes, ${teachers.length} teachers, ${subjects.length} subjects, ${timeSlots.length} time slots`));
      // i want to log the classes found (name)
      this.logger.log(colors.yellow(`Classes found: ${classes.map(cls => cls.name).join(', ')}`));
      
      return new ApiResponse(
        true,
        'Timetable options retrieved successfully',
        {
          classes: classes.map(cls => ({
            id: cls.id,
            name: cls.name
          })),
          teachers: teachers.map(teacher => ({
            id: teacher.id,
            name: `${teacher.first_name} ${teacher.last_name}`
          })),
          subjects: subjects.map(subject => ({
            id: subject.id,
            name: subject.name,
            code: subject.code,
            color: subject.color
          })),
          timeSlots: timeSlots.map(slot => ({
            id: slot.id,
            name: `${slot.startTime} - ${slot.endTime}`,
            label: slot.label,
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
        }
      );
    } catch (error) {
      this.logger.error(colors.red(`Error fetching timetable options: ${error.message}`));
      return new ApiResponse(false, 'Error fetching timetable options', null);
    }
  }

  private formatDaySchedule(timetable: any[], day: string, timeSlots: any[]) {
    // Initialize the day's schedule with empty slots
    const daySchedule = timeSlots.map(slot => ({
      timeSlotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      label: slot.label,
      subject: null as any,
      teacher: null as any,
      room: null as string | null
    }));

    // Fill in the actual schedule entries
    const dayEntries = timetable.filter(entry => entry.day_of_week === day);
    
    dayEntries.forEach(entry => {
      const slotIndex = daySchedule.findIndex(slot => slot.timeSlotId === entry.timeSlotId);
      if (slotIndex !== -1) {
        daySchedule[slotIndex] = {
          timeSlotId: entry.timeSlotId,
          startTime: entry.timeSlot.startTime,
          endTime: entry.timeSlot.endTime,
          label: entry.timeSlot.label,
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
          room: entry.room
        };
      }
    });

    return daySchedule;
  }

  /////////////////////////////////////////////////////////////////////
  ///////////////
  async addScheduleToTimetable(dto: CreateTimetableDTO, user: User) {
    this.logger.log(colors.cyan(`Creating new schedule entry`));

    // get the school id 
    const existingSchool = await this.prisma.school.findFirst({
      where: {
        school_email: user.email
      }
    });

    if(!existingSchool) {
      console.log(colors.red("School not found"));
      return new ApiResponse(
        false,
        "School does not exist",
        null
      );
    }

    // Check if there's already a schedule for this class, time slot and day
    const existingSchedule = await this.prisma.timetableEntry.findFirst({
      where: {
        class_id: dto.class_id,
        timeSlotId: dto.timeSlotId,
        day_of_week: dto.day_of_week,
        isActive: true,
      },
    });

    if (existingSchedule) {
      return new ApiResponse(
        false,
        'A schedule already exists for this class, time slot and day',
        null
      );
    }

    // Check if teacher is already scheduled for this time slot and day
    const teacherSchedule = await this.prisma.timetableEntry.findFirst({
      where: {
        teacher_id: dto.teacher_id,
        timeSlotId: dto.timeSlotId,
        day_of_week: dto.day_of_week,
        isActive: true,
      },
    });

    if (teacherSchedule) {
      this.logger.log(colors.red(`Teacher is already scheduled for this time slot and day`));
      return new ApiResponse(
        false,
        'Teacher is already scheduled for this time slot and day',
        null
      );
    }

    // Verify class exists and belongs to school
    const classExists = await this.prisma.class.findFirst({
      where: {
        id: dto.class_id,
        schoolId: existingSchool.id,
      },
    });

    if (!classExists) {
      this.logger.log(colors.red(`Specified class not found`));
      return new ApiResponse(
        false,
        'Specified class not found',
        null
      );
    }

    // Verify subject exists and belongs to school
    const subjectExists = await this.prisma.subject.findFirst({
      where: {
        id: dto.subject_id,
        schoolId: existingSchool.id,
      },
    });

    if (!subjectExists) {
      this.logger.log(colors.red(`Specified subject not found`));
      return new ApiResponse(
        false,
        'Specified subject not found',
        null
      );
    }

    // Verify teacher exists and belongs to school
    const teacherExists = await this.prisma.teacher.findFirst({
      where: {
        id: dto.teacher_id,
        school_id: existingSchool.id,
      },
    });

    if (!teacherExists) {
      this.logger.log(colors.red(`Specified teacher not found or is not a teacher`));
      return new ApiResponse(
        false,
        'Specified teacher not found or is not a teacher',
        null
      );
    }

    // Verify time slot exists and belongs to school
    const timeSlotExists = await this.prisma.timeSlot.findFirst({
      where: {
        id: dto.timeSlotId,
        schoolId: existingSchool.id,
      },
    });

    if (!timeSlotExists) {
      return new ApiResponse(
        false,
        'Specified time slot not found',
        null
      );
    }

    // Get current academic session for the school
    const currentSessionResponse = await this.academicSessionService.getCurrentSession(existingSchool.id);
    if (!currentSessionResponse.success) {
      return new ApiResponse(
        false,
        'No current academic session found for the school',
        null
      );
    }

    const schedule = await this.prisma.timetableEntry.create({
      data: {
        class_id: dto.class_id,
        subject_id: dto.subject_id,
        teacher_id: dto.teacher_id,
        school_id: existingSchool.id,
        timeSlotId: dto.timeSlotId,
        day_of_week: dto.day_of_week,
        room: dto.room,
        notes: dto.notes,
        isActive: true,
        academic_session_id: currentSessionResponse.data.id,
      },
    });

    // Fetch related data separately since include is not working properly
    const scheduleWithRelations = await this.prisma.timetableEntry.findUnique({
      where: { id: schedule.id },
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        timeSlot: true,
      },
    });

    // Send email notification to the teacher
    try {
      if (scheduleWithRelations?.teacher) {
        await sendTimetableScheduleEmail({
          teacherName: `${scheduleWithRelations.teacher.first_name} ${scheduleWithRelations.teacher.last_name}`,
          teacherEmail: scheduleWithRelations.teacher.email,
          schoolName: existingSchool.school_name,
          subjectName: scheduleWithRelations.subject?.name || 'Unknown Subject',
          className: scheduleWithRelations.class?.name || 'Unknown Class',
          dayOfWeek: scheduleWithRelations.day_of_week,
          startTime: scheduleWithRelations.timeSlot?.startTime || 'Unknown',
          endTime: scheduleWithRelations.timeSlot?.endTime || 'Unknown',
          room: scheduleWithRelations.room || undefined,
          notes: scheduleWithRelations.notes || undefined,
          assignedBy: 'School Administrator'
        });

        this.logger.log(colors.green(`✅ Timetable schedule email sent to teacher: ${scheduleWithRelations.teacher.email}`));
      }
    } catch (emailError) {
      this.logger.error(colors.red(`❌ Failed to send timetable schedule email: ${emailError.message}`));
      // Don't fail the entire operation if email fails
    }

    this.logger.log(colors.green(`Schedule created successfully`));
    return new ApiResponse(
      true,
      'Schedule created successfully',
      scheduleWithRelations || schedule
    );
  }

  async updateSchedule(
    id: string,
    data: {
      subject_id?: string;
      teacher_id?: string;
      timeSlotId?: string;
      day_of_week?: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
      room?: string;
      notes?: string;
      isActive?: boolean;
    },
  ) {
    this.logger.log(colors.cyan(`Updating schedule entry with ID: ${id}`));

    // Get the existing schedule first
    const existingSchedule = await this.prisma.timetableEntry.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      throw new BadRequestException('Schedule not found');
    }

    // If updating time slot or day, check for conflicts
    if (data.timeSlotId || data.day_of_week) {
      const conflictingSchedule = await this.prisma.timetableEntry.findFirst({
        where: {
          id: { not: id },
          class_id: existingSchedule.class_id,
          timeSlotId: data.timeSlotId || existingSchedule.timeSlotId,
          day_of_week: data.day_of_week || existingSchedule.day_of_week,
          isActive: true,
        },
      });

      if (conflictingSchedule) {
        throw new BadRequestException('A schedule already exists for this class, time slot and day');
      }
    }

    // If updating teacher, check for teacher's schedule conflicts
    if (data.teacher_id) {
      const teacherSchedule = await this.prisma.timetableEntry.findFirst({
        where: {
          id: { not: id },
          teacher_id: data.teacher_id,
          timeSlotId: data.timeSlotId || existingSchedule.timeSlotId,
          day_of_week: data.day_of_week || existingSchedule.day_of_week,
          isActive: true,
        },
      });

      if (teacherSchedule) {
        throw new BadRequestException('Teacher is already scheduled for this time slot and day');
      }
    }

    const updatedSchedule = await this.prisma.timetableEntry.update({
      where: { id },
      data,
      include: {
        class: true,
        subject: true,
        teacher: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        timeSlot: true,
      },
    });

    this.logger.log(`Updated schedule entry with ID: ${id}`);
    return updatedSchedule;
  }
  
  // Time Slot Management Methods
  async createTimeSlot(user: User, dto: TimeSlotDTO) {
    this.logger.log(colors.cyan(`Creating new time slot`));

    // Get the school id
    const school = await this.prisma.school.findFirst({
      where: { school_email: user.email }
    });

    if (!school) {
      return new ApiResponse(false, "School not found", null);
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(dto.startTime) || !timeRegex.test(dto.endTime)) {
      return new ApiResponse(false, "Invalid time format. Use HH:mm format", null);
    }

    // Convert times to minutes for easier comparison
    const [startHours, startMinutes] = dto.startTime.split(':').map(Number);
    const [endHours, endMinutes] = dto.endTime.split(':').map(Number);
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;

    // Validate that end time is after start time
    if (endTimeInMinutes <= startTimeInMinutes) {
      return new ApiResponse(false, "End time must be after start time", null);
    }

    // Get all existing time slots for the school
    const existingTimeSlots = await this.prisma.timeSlot.findMany({
      where: {
        schoolId: school.id,
        isActive: true,
      },
    });

    // Check for overlapping time slots
    for (const existingSlot of existingTimeSlots) {
      const [existingStartHours, existingStartMinutes] = existingSlot.startTime.split(':').map(Number);
      const [existingEndHours, existingEndMinutes] = existingSlot.endTime.split(':').map(Number);
      const existingStartInMinutes = existingStartHours * 60 + existingStartMinutes;
      const existingEndInMinutes = existingEndHours * 60 + existingEndMinutes;

      // Check if the new time slot overlaps with any existing time slot
      if (
        (startTimeInMinutes >= existingStartInMinutes && startTimeInMinutes < existingEndInMinutes) || // New start time falls within existing slot
        (endTimeInMinutes > existingStartInMinutes && endTimeInMinutes <= existingEndInMinutes) || // New end time falls within existing slot
        (startTimeInMinutes <= existingStartInMinutes && endTimeInMinutes >= existingEndInMinutes) // New slot completely encompasses existing slot
      ) {
        return new ApiResponse(
          false,
          `Time slot overlaps with existing period (${existingSlot.startTime} - ${existingSlot.endTime})`,
          null
        );
      }
    }

    // Get the next available order number for this school
    const lastTimeSlot = await this.prisma.timeSlot.findFirst({
      where: {
        schoolId: school.id,
        isActive: true,
      },
      orderBy: {
        order: 'desc',
      },
      select: {
        order: true,
      },
    });

    const nextOrder = (lastTimeSlot?.order || 0) + 1;

    const timeSlot = await this.prisma.timeSlot.create({
      data: {
        ...dto,
        order: nextOrder,
        schoolId: school.id,
        isActive: true,
      },
    });

    return new ApiResponse(true, "Time slot created successfully", timeSlot);
  }

  async getTimeSlots(user: User) {
    this.logger.log(colors.cyan(`Fetching time slots`));

    const school = await this.prisma.school.findFirst({
      where: { school_email: user.email }
    });

    if (!school) {
      this.logger.log(colors.red(`School not found for user: ${user.email}`));
      return new ApiResponse(false, "School not found", null);
    }

    const timeSlots = await this.prisma.timeSlot.findMany({
      where: {
        schoolId: school.id,
        // isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    this.logger.log(colors.green(`Total of ${timeSlots.length} time slots fetched successfully`));
    return new ApiResponse(true, "Total of " + timeSlots.length + " time slots fetched successfully", timeSlots);
  }

  async updateTimeSlot(user: User, id: string, dto: UpdateTimeSlotDTO) {
    this.logger.log(colors.cyan(`Updating time slot: ${id}`));

    const school = await this.prisma.school.findFirst({
      where: { school_email: user.email }
    });

    if (!school) {
      return new ApiResponse(false, "School not found", null);
    }

    // Check if time slot exists and belongs to school
    const existingTimeSlot = await this.prisma.timeSlot.findFirst({
      where: {
        id,
        schoolId: school.id,
      },
    });

    if (!existingTimeSlot) {
      return new ApiResponse(false, "Time slot not found", null);
    }

    // If updating times, validate format and check for overlaps
    if (dto.startTime || dto.endTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if ((dto.startTime && !timeRegex.test(dto.startTime)) || 
          (dto.endTime && !timeRegex.test(dto.endTime))) {
        return new ApiResponse(false, "Invalid time format. Use HH:mm format", null);
      }

      // Convert times to minutes for comparison
      const startTime = dto.startTime || existingTimeSlot.startTime;
      const endTime = dto.endTime || existingTimeSlot.endTime;
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      const startTimeInMinutes = startHours * 60 + startMinutes;
      const endTimeInMinutes = endHours * 60 + endMinutes;

      // Validate that end time is after start time
      if (endTimeInMinutes <= startTimeInMinutes) {
        return new ApiResponse(false, "End time must be after start time", null);
      }

      // Get all other time slots for the school
      const otherTimeSlots = await this.prisma.timeSlot.findMany({
        where: {
          schoolId: school.id,
          id: { not: id }, // Exclude current time slot
          isActive: true,
        },
      });

      // Check for overlapping time slots
      for (const otherSlot of otherTimeSlots) {
        const [otherStartHours, otherStartMinutes] = otherSlot.startTime.split(':').map(Number);
        const [otherEndHours, otherEndMinutes] = otherSlot.endTime.split(':').map(Number);
        const otherStartInMinutes = otherStartHours * 60 + otherStartMinutes;
        const otherEndInMinutes = otherEndHours * 60 + otherEndMinutes;

        // Check if the updated time slot overlaps with any other time slot
        if (
          (startTimeInMinutes >= otherStartInMinutes && startTimeInMinutes < otherEndInMinutes) ||
          (endTimeInMinutes > otherStartInMinutes && endTimeInMinutes <= otherEndInMinutes) ||
          (startTimeInMinutes <= otherStartInMinutes && endTimeInMinutes >= otherEndInMinutes)
        ) {
          return new ApiResponse(
            false,
            `Time slot overlaps with existing period (${otherSlot.startTime} - ${otherSlot.endTime})`,
            null
          );
        }
      }
    }

    // Build update data object with only provided fields
    const updateData: any = {};
    
    if (dto.startTime !== undefined) {
      updateData.startTime = dto.startTime;
    }
    if (dto.endTime !== undefined) {
      updateData.endTime = dto.endTime;
    }
    if (dto.label !== undefined) {
      updateData.label = dto.label;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    const updatedTimeSlot = await this.prisma.timeSlot.update({
      where: { id },
      data: updateData,
    });

    return new ApiResponse(true, "Time slot updated successfully", updatedTimeSlot);
  }

  async deleteTimeSlot(user: User, id: string) {
    this.logger.log(colors.cyan(`Deleting time slot: ${id}`));

    const school = await this.prisma.school.findFirst({
      where: { school_email: user.email }
    });

    if (!school) {
      return new ApiResponse(false, "School not found", null);
    }

    // Check if time slot exists and belongs to school
    const existingTimeSlot = await this.prisma.timeSlot.findFirst({
      where: {
        id,
        schoolId: school.id,
      },
    });

    if (!existingTimeSlot) {
      return new ApiResponse(false, "Time slot not found", null);
    }

    // Check if time slot is being used in any timetable entries
    const timetableEntries = await this.prisma.timetableEntry.findFirst({
      where: {
        timeSlotId: id,
        isActive: true,
      },
    });

    if (timetableEntries) {
      return new ApiResponse(false, "Cannot delete time slot as it is being used in timetable entries", null);
    }

    // Soft delete by setting isActive to false
    const deletedTimeSlot = await this.prisma.timeSlot.update({
      where: { id },
      data: { isActive: false },
    });

    return new ApiResponse(true, "Time slot deleted successfully", deletedTimeSlot);
  }

  ////////////////////////////////////////////////////////////////////////// FETCH SUBJECTS WITH TEACHERS
  // GET - /api/v1/director/schedules/subjects-with-teachers
  async getSubjectsWithTeachers(user: User): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Fetching subjects with teachers for school`));

    try {
      // Get the school id
      const school = await this.prisma.school.findFirst({
        where: { school_email: user.email }
      });

      if (!school) {
        return new ApiResponse(false, "School not found", null);
      }

      // Fetch all subjects with their assigned teachers
      const subjectsWithTeachers = await this.prisma.subject.findMany({
        where: {
          schoolId: school.id
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
        },
        orderBy: { name: 'asc' }
      });

      // Format the response
      const formattedSubjects = subjectsWithTeachers.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        color: subject.color,
        teachers: subject.teacherSubjects.map(ts => ({
          id: ts.teacher.id,
          name: `${ts.teacher.first_name} ${ts.teacher.last_name}`,
          display_picture: ts.teacher.display_picture
        }))
      }));

      this.logger.log(colors.green(`Found ${formattedSubjects.length} subjects with teachers`));

      return new ApiResponse(
        true,
        'Subjects with teachers fetched successfully',
        {
          subjects: formattedSubjects,
          summary: {
            total_subjects: formattedSubjects.length,
            subjects_with_teachers: formattedSubjects.filter(s => s.teachers.length > 0).length,
            subjects_without_teachers: formattedSubjects.filter(s => s.teachers.length === 0).length
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`Error fetching subjects with teachers: ${error.message}`));
      return new ApiResponse(false, 'Error fetching subjects with teachers', null);
    }
  }
} 