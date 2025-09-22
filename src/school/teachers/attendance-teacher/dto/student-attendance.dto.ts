import { ApiProperty } from '@nestjs/swagger';

export class StudentAttendanceSummaryDto {
  @ApiProperty({ example: 22, description: 'Total school days this month' })
  totalSchoolDaysThisMonth: number;

  @ApiProperty({ example: 20, description: 'Total days present this month' })
  totalPresentThisMonth: number;

  @ApiProperty({ example: 65, description: 'Total school days this term' })
  totalSchoolDaysThisTerm: number;

  @ApiProperty({ example: 58, description: 'Total days present this term' })
  totalPresentThisTerm: number;

  @ApiProperty({ 
    example: '2025-09-15', 
    description: 'Last absent date',
    nullable: true
  })
  lastAbsentDate: string | null;
}

export class StudentAttendanceRecordDto {
  @ApiProperty({ example: '2025-09-01', description: 'Attendance date' })
  date: string;

  @ApiProperty({ 
    example: 'PRESENT', 
    description: 'Attendance status',
    enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'PARTIAL', 'HOLIDAY', 'WEEKEND']
  })
  status: string;

  @ApiProperty({ example: false, description: 'Whether absence is excused' })
  isExcused: boolean;

  @ApiProperty({ 
    example: 'Traffic jam', 
    description: 'Reason for absence/lateness',
    nullable: true
  })
  reason: string | null;

  @ApiProperty({ 
    example: '2025-09-01T08:30:00Z', 
    description: 'When attendance was marked',
    nullable: true
  })
  markedAt: string | null;

  @ApiProperty({ 
    example: 'teacher_id_123', 
    description: 'Teacher who marked the attendance',
    nullable: true
  })
  markedBy: string | null;
}

export class StudentAttendanceDto {
  @ApiProperty({ type: StudentAttendanceSummaryDto, description: 'Attendance summary' })
  summary: StudentAttendanceSummaryDto;

  @ApiProperty({ type: [StudentAttendanceRecordDto], description: 'Daily attendance records' })
  records: StudentAttendanceRecordDto[];
}

export class StudentAttendanceResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Student attendance retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: StudentAttendanceDto, description: 'Student attendance data' })
  data: StudentAttendanceDto;
}
