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

export class AcademicSessionDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Academic session ID' })
  id: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  academic_year: string;

  @ApiProperty({ example: 'first', description: 'Academic term', enum: ['first', 'second', 'third'] })
  term: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z', description: 'Session start date' })
  start_date: string;

  @ApiProperty({ example: '2024-12-15T00:00:00Z', description: 'Session end date' })
  end_date: string;

  @ApiProperty({ example: true, description: 'Whether this is the current session' })
  is_current: boolean;

  @ApiProperty({ example: 'active', description: 'Session status', enum: ['active', 'inactive', 'completed'] })
  status: string;
}

export class StudentAttendanceExtendedDto extends StudentAttendanceDto {
  @ApiProperty({ type: [AcademicSessionDto], description: 'All available academic sessions' })
  academic_sessions: AcademicSessionDto[];

  @ApiProperty({ 
    example: [
      { id: 'cmft0keqn00avsbkyybjn0ra0', term: 'first', academic_year: '2024-2025' },
      { id: 'cmft0keqn00avsbkyybjn0ra1', term: 'second', academic_year: '2024-2025' },
      { id: 'cmft0keqn00avsbkyybjn0ra2', term: 'third', academic_year: '2024-2025' }
    ], 
    description: 'Available academic terms with IDs'
  })
  available_terms: Array<{
    id: string;
    term: string;
    academic_year: string;
  }>;
}

export class StudentAttendanceResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Student attendance retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: StudentAttendanceDto, description: 'Student attendance data' })
  data: StudentAttendanceDto;
}

export class StudentAttendanceExtendedResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Student attendance retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: StudentAttendanceExtendedDto, description: 'Student attendance data with sessions and terms' })
  data: StudentAttendanceExtendedDto;
}
