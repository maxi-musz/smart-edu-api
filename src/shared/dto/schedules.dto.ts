import { IsNotEmpty, IsString, IsOptional, IsEnum, IsNumber, Min, Matches, IsBoolean } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class getTimeTableDTO {
    @ApiProperty({
        description: 'Class level for timetable',
        enum: ['jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3'],
        example: 'jss1'
    })
    @IsString()
    @IsNotEmpty()
    class: ClassLevel
}

enum ClassLevel {
    "jss1",
    "jss2",
    "jss3",
    "ss1",
    "ss2",
    "ss3"
}

export enum DayOfWeek {
    MONDAY = 'MONDAY',
    TUESDAY = 'TUESDAY',
    WEDNESDAY = 'WEDNESDAY',
    THURSDAY = 'THURSDAY',
    FRIDAY = 'FRIDAY',
    SATURDAY = 'SATURDAY',
    SUNDAY = 'SUNDAY'
}

export class CreateTimetableDTO {
    @ApiProperty({
        description: 'Class ID for the timetable entry',
        example: 'class-uuid'
    })
    @IsString()
    @IsNotEmpty()
    class_id: string;

    @ApiProperty({
        description: 'Subject ID for the timetable entry',
        example: 'subject-uuid'
    })
    @IsString()
    @IsNotEmpty()
    subject_id: string;

    @ApiProperty({
        description: 'Teacher ID for the timetable entry',
        example: 'teacher-uuid'
    })
    @IsString()
    @IsNotEmpty()
    teacher_id: string;

    @ApiProperty({
        description: 'Time slot ID for the timetable entry',
        example: 'timeslot-uuid'
    })
    @IsString()
    @IsNotEmpty()
    timeSlotId: string;

    @ApiProperty({
        description: 'Day of the week for the timetable entry',
        enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        example: 'MONDAY'
    })
    @IsEnum(DayOfWeek)
    @IsNotEmpty()
    day_of_week: DayOfWeek;

    @ApiProperty({
        description: 'Room for the class (optional)',
        example: 'Room 101',
        required: false
    })
    @IsString()
    @IsOptional()
    room?: string;

    @ApiProperty({
        description: 'Additional notes for the timetable entry (optional)',
        example: 'Bring textbooks',
        required: false
    })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class TimeSlotDTO {
  @ApiProperty({
      description: 'Start time in HH:mm format',
      example: '08:30'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g., 08:30)'
  })
  startTime: string;

  @ApiProperty({
      description: 'End time in HH:mm format',
      example: '10:30'
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g., 10:30)'
  })
  endTime: string;

  @ApiProperty({
      description: 'Label for the time slot',
      example: 'First Period'
  })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
      description: 'Order of the time slot (minimum 1)',
      example: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  order: number;
}

export class UpdateTimeSlotDTO {
  @ApiProperty({
      description: 'Start time in HH:mm format (optional)',
      example: '08:30',
      required: false
  })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format (e.g., 08:30)'
  })
  startTime?: string;

  @ApiProperty({
      description: 'End time in HH:mm format (optional)',
      example: '10:30',
      required: false
  })
  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format (e.g., 10:30)'
  })
  endTime?: string;

  @ApiProperty({
      description: 'Label for the time slot (optional)',
      example: 'First Period',
      required: false
  })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({
      description: 'Order of the time slot (minimum 1, optional)',
      example: 1,
      required: false
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  order?: number;

  @ApiProperty({
      description: 'Whether the time slot is active (optional)',
      example: true,
      required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}