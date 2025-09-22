import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum AttendanceRecordStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
  PARTIAL = 'PARTIAL'
}

export class SubmitAttendanceRecordDto {
  @ApiProperty({ 
    example: 'student_1', 
    description: 'Student ID' 
  })
  @IsNotEmpty()
  @IsString()
  student_id: string;

  @ApiProperty({ 
    example: 'PRESENT', 
    description: 'Attendance status',
    enum: AttendanceRecordStatus
  })
  @IsNotEmpty()
  @IsEnum(AttendanceRecordStatus)
  status: AttendanceRecordStatus;

  @ApiProperty({ 
    example: 'Sick leave', 
    description: 'Reason for absence or late arrival',
    required: false
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Whether the absence is excused',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_excused?: boolean;

  @ApiProperty({ 
    example: 'Doctor\'s note provided', 
    description: 'Excuse note or additional details',
    required: false
  })
  @IsOptional()
  @IsString()
  excuse_note?: string;
}

export class SubmitAttendanceDto {
  @ApiProperty({ 
    example: 'class_1', 
    description: 'Class ID' 
  })
  @IsNotEmpty()
  @IsString()
  class_id: string;

  @ApiProperty({ 
    example: '2024-01-15', 
    description: 'Date in YYYY-MM-DD format' 
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ 
    example: 'DAILY', 
    description: 'Type of attendance session',
    enum: ['DAILY', 'MORNING', 'AFTERNOON', 'EVENING', 'SPECIAL'],
    required: false
  })
  @IsOptional()
  @IsString()
  session_type?: string = 'DAILY';

  @ApiProperty({ 
    type: [SubmitAttendanceRecordDto], 
    description: 'Array of attendance records for students' 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAttendanceRecordDto)
  attendance_records: SubmitAttendanceRecordDto[];

  @ApiProperty({ 
    example: 'All students present today', 
    description: 'Optional notes about the attendance session',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAttendanceDto {
  @ApiProperty({ 
    example: 'class_1', 
    description: 'Class ID' 
  })
  @IsNotEmpty()
  @IsString()
  class_id: string;

  @ApiProperty({ 
    example: '2024-01-15', 
    description: 'Date in YYYY-MM-DD format' 
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({ 
    type: [SubmitAttendanceRecordDto], 
    description: 'Array of attendance records to update (only students to be updated)' 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmitAttendanceRecordDto)
  attendance_records: SubmitAttendanceRecordDto[];

  @ApiProperty({ 
    example: 'Updated attendance for sick students', 
    description: 'Optional notes about the update',
    required: false
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitAttendanceResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Attendance submitted successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ 
    example: {
      session_id: 'attendance_session_1',
      class_id: 'class_1',
      date: '2024-01-15',
      status: 'SUBMITTED',
      total_students: 25,
      present_count: 23,
      absent_count: 2,
      attendance_rate: 92.0
    }, 
    description: 'Attendance session data' 
  })
  data: {
    session_id: string;
    class_id: string;
    date: string;
    status: string;
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_rate: number;
  };
}
