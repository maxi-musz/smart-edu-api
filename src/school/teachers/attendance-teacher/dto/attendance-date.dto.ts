import { ApiProperty } from '@nestjs/swagger';

export class AttendanceRecordDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Student database ID' })
  id: string;

  @ApiProperty({ example: 'STU0001', description: 'Student ID (admission number)' })
  student_id: string;

  @ApiProperty({ example: true, description: 'Whether student is present' })
  is_present: boolean;

  @ApiProperty({ 
    example: '2024-01-15T08:30:00Z', 
    description: 'When attendance was marked',
    nullable: true
  })
  marked_at: string | null;

  @ApiProperty({ example: 'teacher_1', description: 'Teacher who marked the attendance' })
  marked_by: string;
}

export class AttendanceForDateDto {
  @ApiProperty({ example: '2024-01-15', description: 'Attendance date' })
  date: string;

  @ApiProperty({ example: 'class_1', description: 'Class ID' })
  class_id: string;

  @ApiProperty({ 
    example: 'pending', 
    description: 'Attendance status',
    enum: ['pending', 'submitted', 'approved']
  })
  attendance_status: 'pending' | 'submitted' | 'approved';

  @ApiProperty({ type: [AttendanceRecordDto], description: 'Attendance records for students' })
  attendance_records: AttendanceRecordDto[];

  // Status information for UI
  @ApiProperty({ example: true, description: 'Whether attendance has been marked' })
  is_marked: boolean;

  @ApiProperty({ 
    example: '2024-01-15T08:30:00.000Z', 
    description: 'When attendance was submitted',
    nullable: true
  })
  submitted_at: string | null;

  @ApiProperty({ example: 25, description: 'Total number of students' })
  total_students: number;

  @ApiProperty({ example: 23, description: 'Number of students present' })
  present_count: number;

  @ApiProperty({ example: 2, description: 'Number of students absent' })
  absent_count: number;

  @ApiProperty({ example: 1, description: 'Number of students late' })
  late_count: number;

  @ApiProperty({ example: 92.0, description: 'Attendance rate percentage' })
  attendance_rate: number;
}

export class AttendanceForDateResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Attendance retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: AttendanceForDateDto, description: 'Attendance data' })
  data: AttendanceForDateDto;
}
