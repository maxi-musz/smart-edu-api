import { ApiProperty } from '@nestjs/swagger';

export class ClassInfoDto {
  @ApiProperty({ example: 'class_1', description: 'Class ID' })
  id: string;

  @ApiProperty({ example: 'Grade 10A', description: 'Class name' })
  name: string;

  @ApiProperty({ example: 'G10A', description: 'Class code' })
  code: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  subject: string;

  @ApiProperty({ example: 'John Smith', description: 'Teacher name' })
  teacher_name: string;

  @ApiProperty({ example: 'Room 101', description: 'Room number' })
  room: string;

  @ApiProperty({ example: 25, description: 'Total number of students' })
  total_students: number;
}

export class AcademicSessionInfoDto {
  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  academic_year: string;

  @ApiProperty({ example: 'first', description: 'Term' })
  term: string;

  @ApiProperty({ example: '2024-09-01', description: 'Term start date' })
  term_start_date: string;

  @ApiProperty({ example: '2024-12-15', description: 'Term end date' })
  term_end_date: string;

  @ApiProperty({ example: '2024-01-15', description: 'Current date' })
  current_date: string;

  @ApiProperty({ example: true, description: 'Whether this is the current active session' })
  is_current: boolean;
}

export class AttendanceOverviewDto {
  @ApiProperty({ type: [ClassInfoDto], description: 'Classes managed by teacher' })
  classes_managing: ClassInfoDto[];

  @ApiProperty({ type: [AcademicSessionInfoDto], description: 'Available academic sessions' })
  academic_sessions: AcademicSessionInfoDto[];
}

export class AttendanceOverviewResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Attendance overview retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: AttendanceOverviewDto, description: 'Attendance overview data' })
  data: AttendanceOverviewDto;
}
