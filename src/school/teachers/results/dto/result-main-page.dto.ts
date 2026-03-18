import { ApiProperty } from '@nestjs/swagger';

export class CurrentSessionDto {
  @ApiProperty({
    example: 'cmft0keqn00avsbkyybjn0ra0',
    description: 'Current academic session ID',
  })
  id: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  academic_year: string;

  @ApiProperty({
    example: 'first',
    description: 'Current term',
    enum: ['first', 'second', 'third'],
  })
  term: string;
}

export class SessionSummaryDto {
  @ApiProperty({
    example: 'cmft0keqn00avsbkyybjn0ra0',
    description: 'Academic session ID',
  })
  id: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  academic_year: string;

  @ApiProperty({
    example: 'first',
    description: 'Term',
    enum: ['first', 'second', 'third'],
  })
  term: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is the current session',
  })
  is_current: boolean;
}

export class TeacherClassDto {
  @ApiProperty({
    example: 'cmft0keqn00avsbkyybjn0ra0',
    description: 'Class ID',
  })
  id: string;

  @ApiProperty({ example: 'Grade 10A', description: 'Class name' })
  name: string;

  @ApiProperty({ example: '10A', description: 'Class ID (short identifier)' })
  classId: string;
}

export class ClassSubjectDto {
  @ApiProperty({
    example: 'cmft0keqn00avsbkyybjn0ra0',
    description: 'Subject ID',
  })
  id: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  name: string;

  @ApiProperty({ example: 'MATH', description: 'Subject code' })
  code: string;

  @ApiProperty({ example: '#FF5733', description: 'Subject color' })
  color: string;
}

export class StudentSubjectResultDto {
  @ApiProperty({
    example: 'cmft0keqn00avsbkyybjn0ra0',
    description: 'Subject ID',
  })
  subject_id: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  subject_name: string;

  @ApiProperty({ example: 'MATH', description: 'Subject code' })
  subject_code: string;

  @ApiProperty({
    example: 25,
    description: 'Continuous assessment score',
    nullable: true,
  })
  ca_score: number | null;

  @ApiProperty({ example: 60, description: 'Exam score', nullable: true })
  exam_score: number | null;

  @ApiProperty({ example: 85, description: 'Total score for the subject' })
  total_score: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum obtainable score for the subject',
  })
  total_max_score: number;

  @ApiProperty({ example: 85.5, description: 'Percentage score' })
  percentage: number;

  @ApiProperty({ example: 'A', description: 'Subject grade' })
  grade: string;
}

export class ClassStudentResultDto {
  @ApiProperty({
    example: 'cmft0keqn00avsbkyybjn0ra0',
    description: 'Student ID',
  })
  student_id: string;

  @ApiProperty({ example: 'John Doe', description: 'Student full name' })
  student_name: string;

  @ApiProperty({ example: 'STU001', description: 'Student roll number' })
  roll_number: string;

  @ApiProperty({
    example: 'https://api.school.com/images/students/student_1.jpg',
    description: 'Student display picture',
  })
  display_picture: string;

  @ApiProperty({
    example: 45,
    description: 'Total CA score across subjects',
    nullable: true,
  })
  total_ca_score: number | null;

  @ApiProperty({
    example: 60,
    description: 'Total exam score across subjects',
    nullable: true,
  })
  total_exam_score: number | null;

  @ApiProperty({ example: 105, description: 'Overall total score' })
  total_score: number | null;

  @ApiProperty({
    example: 150,
    description: 'Overall maximum obtainable score',
  })
  total_max_score: number | null;

  @ApiProperty({ example: 70, description: 'Overall percentage' })
  overall_percentage: number | null;

  @ApiProperty({ example: 'B', description: 'Overall grade' })
  overall_grade: string | null;

  @ApiProperty({
    example: 5,
    description: 'Student position in class',
    nullable: true,
  })
  class_position: number | null;

  @ApiProperty({
    example: 25,
    description: 'Total students in class',
    nullable: true,
  })
  total_students: number | null;

  @ApiProperty({
    type: [StudentSubjectResultDto],
    description: 'Subject results for the student',
  })
  subjects: StudentSubjectResultDto[];
}

export class TeacherClassWithResultsDto {
  @ApiProperty({
    example: 'cmft0keqn00avsbkyybjn0ra0',
    description: 'Class ID',
  })
  id: string;

  @ApiProperty({ example: 'Grade 10A', description: 'Class name' })
  name: string;

  @ApiProperty({ example: '10A', description: 'Class ID (short identifier)' })
  classId: string;

  @ApiProperty({
    type: [ClassSubjectDto],
    description: 'Subjects offered in the class',
  })
  subjects: ClassSubjectDto[];

  @ApiProperty({
    type: [ClassStudentResultDto],
    description: 'Students and their released results',
  })
  students: ClassStudentResultDto[];

  @ApiProperty({ example: 1, description: 'Current page for this class' })
  page: number;

  @ApiProperty({ example: 30, description: 'Page size for this class' })
  limit: number;

  @ApiProperty({
    example: 120,
    description: 'Total students in class (unpaginated)',
  })
  total_students: number;
}

export class ResultMainPageDataDto {
  @ApiProperty({
    type: CurrentSessionDto,
    description: 'Current academic session and term',
  })
  current_session: CurrentSessionDto;

  @ApiProperty({
    type: [SessionSummaryDto],
    description: 'Available sessions/terms to filter by',
  })
  sessions: SessionSummaryDto[];

  @ApiProperty({
    type: [TeacherClassWithResultsDto],
    description: 'Classes managed by the teacher with released results',
  })
  classes: TeacherClassWithResultsDto[];

  @ApiProperty({
    example: 1,
    description: 'Requested page (applied per class list)',
  })
  page: number;

  @ApiProperty({
    example: 30,
    description: 'Requested limit (applied per class list)',
  })
  limit: number;
}

export class ResultMainPageResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({
    example: 'Result main page data retrieved successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    type: ResultMainPageDataDto,
    description: 'Result main page data',
  })
  data: ResultMainPageDataDto;
}
