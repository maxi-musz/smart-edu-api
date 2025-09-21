import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  IsArray, 
  IsEnum, 
  IsDateString,
  Min, 
  Max,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

export enum GradingType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  MIXED = 'MIXED'
}

export class CreateAssessmentDto {
  @ApiProperty({
    description: 'Title of the Assessment',
    example: 'Mathematics Quiz - Chapter 1'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the Assessment',
    example: 'Test your understanding of basic algebra concepts'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Instructions for students taking the quiz',
    example: 'Answer all questions carefully. You have 30 minutes to complete this quiz.'
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({
    description: 'Subject ID where the quiz belongs',
    example: 'subject_123'
  })
  @IsString()
  @IsNotEmpty()
  subject_id: string;

  @ApiPropertyOptional({
    description: 'Topic ID for topic-specific quiz (optional for subject-wide quizzes)',
    example: 'topic_123'
  })
  @IsString()
  @IsOptional()
  topic_id?: string;

  @ApiPropertyOptional({
    description: 'Duration of the quiz in minutes',
    example: 30,
    minimum: 1,
    maximum: 300
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(300)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Maximum number of attempts allowed',
    example: 2,
    minimum: 1,
    maximum: 10,
    default: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  max_attempts?: number;

  @ApiPropertyOptional({
    description: 'Passing score percentage',
    example: 60,
    minimum: 0,
    maximum: 100,
    default: 50
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  passing_score?: number;

  @ApiPropertyOptional({
    description: 'Total possible points for the quiz',
    example: 100,
    minimum: 1,
    default: 100
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  total_points?: number;

  @ApiPropertyOptional({
    description: 'Whether to shuffle questions order',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  shuffle_questions?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to shuffle options order',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  shuffle_options?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show correct answers after submission',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  show_correct_answers?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show feedback after submission',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  show_feedback?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to allow students to review their answers',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  allow_review?: boolean;

  @ApiPropertyOptional({
    description: 'Quiz start date and time',
    example: '2024-01-15T09:00:00Z'
  })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Quiz end date and time',
    example: '2024-01-20T23:59:59Z'
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Time limit in minutes (overrides duration)',
    example: 45,
    minimum: 1,
    maximum: 300
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(300)
  time_limit?: number;

  @ApiPropertyOptional({
    description: 'Grading type for the quiz',
    enum: GradingType,
    example: GradingType.AUTOMATIC,
    default: GradingType.AUTOMATIC
  })
  @IsEnum(GradingType)
  @IsOptional()
  grading_type?: GradingType;

  @ApiPropertyOptional({
    description: 'Whether to auto-submit when time expires',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  auto_submit?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for categorizing the quiz',
    example: ['algebra', 'mathematics', 'chapter1'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Type of assessment',
    enum: ['CBT', 'ASSIGNMENT', 'EXAM', 'OTHER', 'FORMATIVE', 'SUMMATIVE', 'DIAGNOSTIC', 'BENCHMARK', 'PRACTICE', 'MOCK_EXAM', 'QUIZ', 'TEST'],
    example: 'CBT',
    default: 'CBT'
  })
  @IsString()
  @IsOptional()
  assessment_type?: string;
}
