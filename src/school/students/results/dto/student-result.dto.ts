import { ApiProperty } from '@nestjs/swagger';

export class CurrentSessionDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Current academic session ID' })
  id: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  academic_year: string;

  @ApiProperty({ example: 'first', description: 'Current term', enum: ['first', 'second', 'third'] })
  term: string;
}

export class SessionSummaryDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Academic session ID' })
  id: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  academic_year: string;

  @ApiProperty({ example: 'first', description: 'Term', enum: ['first', 'second', 'third'] })
  term: string;

  @ApiProperty({ example: true, description: 'Whether this is the current session' })
  is_current: boolean;
}

export class ClassInfoDto {
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

export class StudentSubjectResultDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Subject ID' })
  subject_id: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  subject_name: string;

  @ApiProperty({ example: 'MATH', description: 'Subject code' })
  subject_code: string;

  @ApiProperty({ example: 25, description: 'Continuous assessment score', nullable: true })
  ca_score: number | null;

  @ApiProperty({ example: 60, description: 'Exam score', nullable: true })
  exam_score: number | null;

  @ApiProperty({ example: 85, description: 'Total score for the subject' })
  total_score: number;

  @ApiProperty({ example: 100, description: 'Maximum obtainable score for the subject' })
  total_max_score: number;

  @ApiProperty({ example: 85.5, description: 'Percentage score' })
  percentage: number;

  @ApiProperty({ example: 'A', description: 'Subject grade' })
  grade: string;
}

export class StudentResultDataDto {
  @ApiProperty({ type: CurrentSessionDto, description: 'Current academic session and term' })
  current_session: CurrentSessionDto;

  @ApiProperty({ type: [SessionSummaryDto], description: 'Available sessions/terms to filter by' })
  sessions: SessionSummaryDto[];

  @ApiProperty({ type: ClassInfoDto, description: 'Current class information' })
  current_class: ClassInfoDto;

  @ApiProperty({ type: [ClassSubjectDto], description: 'Subjects offered in the current class' })
  subjects: ClassSubjectDto[];

  @ApiProperty({ example: 45, description: 'Total CA score across subjects', nullable: true })
  total_ca_score: number | null;

  @ApiProperty({ example: 60, description: 'Total exam score across subjects', nullable: true })
  total_exam_score: number | null;

  @ApiProperty({ example: 105, description: 'Overall total score', nullable: true })
  total_score: number | null;

  @ApiProperty({ example: 150, description: 'Overall maximum obtainable score', nullable: true })
  total_max_score: number | null;

  @ApiProperty({ example: 70, description: 'Overall percentage', nullable: true })
  overall_percentage: number | null;

  @ApiProperty({ example: 'B', description: 'Overall grade', nullable: true })
  overall_grade: string | null;

  @ApiProperty({ example: 5, description: 'Student position in class', nullable: true })
  class_position: number | null;

  @ApiProperty({ example: 25, description: 'Total students in class', nullable: true })
  total_students: number | null;

  @ApiProperty({ type: [StudentSubjectResultDto], description: 'Subject results for the student' })
  subject_results: StudentSubjectResultDto[];
}

export class StudentResultResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Student result retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: StudentResultDataDto, description: 'Student result data' })
  data: StudentResultDataDto;
}
