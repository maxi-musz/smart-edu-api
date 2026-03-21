import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  AcademicTerm,
  QuizStatus,
  AssessmentType,
} from '@prisma/client';

export class GetAssessmentsQueryDto {
  // ========================================
  // PAGINATION
  // ========================================

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // ========================================
  // SEARCH
  // ========================================

  @ApiPropertyOptional({
    description: 'Search term for assessment title or description',
    example: 'algebra',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // ========================================
  // FILTERS - SESSION & TERM
  // ========================================

  @ApiPropertyOptional({
    description:
      'Filter by academic session ID. Defaults to current active session if not provided.',
    example: 'session_abc123',
  })
  @IsOptional()
  @IsString()
  academic_session_id?: string;

  @ApiPropertyOptional({
    description:
      'Filter by academic term (first, second, third). Used in combination with academic_session_id filter.',
    example: 'first',
    enum: AcademicTerm,
  })
  @IsOptional()
  @IsEnum(AcademicTerm)
  term?: AcademicTerm;

  // ========================================
  // FILTERS - SUBJECT & TOPIC
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by subject ID',
    example: 'subject_abc123',
  })
  @IsOptional()
  @IsString()
  subject_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by topic ID',
    example: 'topic_abc123',
  })
  @IsOptional()
  @IsString()
  topic_id?: string;

  // ========================================
  // FILTERS - ASSESSMENT STATUS & TYPE
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by assessment status',
    example: 'PUBLISHED',
    enum: QuizStatus,
  })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;

  @ApiPropertyOptional({
    description: 'Filter by assessment type (CBT, MANUAL, etc.)',
    example: 'CBT',
    enum: AssessmentType,
  })
  @IsOptional()
  @IsEnum(AssessmentType)
  assessment_type?: AssessmentType;

  @ApiPropertyOptional({
    description: 'Filter by published state',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  is_published?: boolean;

  // ========================================
  // FILTERS - CREATOR
  // ========================================

  @ApiPropertyOptional({
    description:
      'Filter by creator user ID (for directors/admins to filter by specific teacher)',
    example: 'user_abc123',
  })
  @IsOptional()
  @IsString()
  created_by?: string;

  // ========================================
  // SORTING
  // ========================================

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'title', 'start_date', 'end_date', 'status'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sort_by?: 'createdAt' | 'title' | 'start_date' | 'end_date' | 'status' =
    'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}
