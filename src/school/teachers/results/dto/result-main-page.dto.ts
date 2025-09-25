import { ApiProperty } from '@nestjs/swagger';

export class CurrentSessionDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Current academic session ID' })
  id: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  academic_year: string;

  @ApiProperty({ example: 'first', description: 'Current term', enum: ['first', 'second', 'third'] })
  term: string;
}

export class TeacherClassDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Class ID' })
  id: string;

  @ApiProperty({ example: 'Grade 10A', description: 'Class name' })
  name: string;

  @ApiProperty({ example: '10A', description: 'Class ID (short identifier)' })
  classId: string;
}

export class ClassSubjectDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Subject ID' })
  id: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  name: string;

  @ApiProperty({ example: 'MATH', description: 'Subject code' })
  code: string;

  @ApiProperty({ example: '#FF5733', description: 'Subject color' })
  color: string;
}

export class StudentResultDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Student ID' })
  student_id: string;

  @ApiProperty({ example: 'John Doe', description: 'Student full name' })
  student_name: string;

  @ApiProperty({ example: 'STU001', description: 'Student roll number' })
  roll_number: string;

  @ApiProperty({ example: 'https://api.school.com/images/students/student_1.jpg', description: 'Student display picture' })
  display_picture: string;

  @ApiProperty({ example: 85.5, description: 'Total score achieved' })
  total_score: number;

  @ApiProperty({ example: 100, description: 'Maximum possible score' })
  max_score: number;

  @ApiProperty({ example: 85.5, description: 'Percentage score' })
  percentage: number;

  @ApiProperty({ example: 'B', description: 'Grade letter' })
  grade: string;

  @ApiProperty({ example: 3, description: 'Number of assessments attempted' })
  assessments_attempted: number;

  @ApiProperty({ example: 5, description: 'Total number of assessments' })
  total_assessments: number;

  @ApiProperty({ example: 'submitted', description: 'Submission status', enum: ['submitted', 'not_submitted', 'partial'] })
  submission_status: string;

  @ApiProperty({ example: '2025-01-15T10:30:00Z', description: 'Last submission date', nullable: true })
  last_submission_date: string | null;
}

export class PaginationDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ example: 25, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  total_pages: number;

  @ApiProperty({ example: true, description: 'Whether there are more pages' })
  has_more: boolean;

  @ApiProperty({ example: false, description: 'Whether there are previous pages' })
  has_prev: boolean;
}

export class ResultMainPageDataDto {
  @ApiProperty({ type: CurrentSessionDto, description: 'Current academic session and term' })
  current_session: CurrentSessionDto;

  @ApiProperty({ type: [TeacherClassDto], description: 'Classes managed by the teacher' })
  teacher_classes: TeacherClassDto[];

  @ApiProperty({ type: ClassSubjectDto, description: 'Default selected subject (first subject of first class)' })
  default_subject: ClassSubjectDto;

  @ApiProperty({ type: [StudentResultDto], description: 'Student results for the default subject' })
  student_results: StudentResultDto[];

  @ApiProperty({ type: PaginationDto, description: 'Pagination information' })
  pagination: PaginationDto;
}

export class ResultMainPageResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Result main page data retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: ResultMainPageDataDto, description: 'Result main page data' })
  data: ResultMainPageDataDto;
}
