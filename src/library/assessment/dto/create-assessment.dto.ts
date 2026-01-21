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
  Max
} from 'class-validator';

export enum GradingType {
  AUTOMATIC = 'AUTOMATIC',
  MANUAL = 'MANUAL',
  MIXED = 'MIXED'
}

export class CreateLibraryAssessmentDto {
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
    description: 'Instructions for users taking the assessment',
    example: 'Answer all questions carefully. You have 30 minutes to complete this assessment.'
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({
    description: 'Library Subject ID where the assessment belongs',
    example: 'subject_123'
  })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({
    description: 'Library Topic ID for topic-specific assessment (optional)',
    example: 'topic_123'
  })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Duration of the assessment in minutes',
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
  maxAttempts?: number;

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
  passingScore?: number;

  @ApiPropertyOptional({
    description: 'Total possible points for the assessment',
    example: 100,
    minimum: 1,
    default: 100
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  totalPoints?: number;

  @ApiPropertyOptional({
    description: 'Whether to shuffle questions order',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to shuffle options order',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show correct answers after submission',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  showCorrectAnswers?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show feedback after submission',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  showFeedback?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to allow users to review their answers',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  allowReview?: boolean;

  @ApiPropertyOptional({
    description: 'Assessment start date and time',
    example: '2024-01-15T09:00:00Z'
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Assessment end date and time',
    example: '2024-01-20T23:59:59Z'
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Time limit in seconds (overrides duration)',
    example: 2700,
    minimum: 60,
    maximum: 18000
  })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(18000)
  timeLimit?: number;

  @ApiPropertyOptional({
    description: 'Grading type for the assessment',
    enum: GradingType,
    example: GradingType.AUTOMATIC,
    default: GradingType.AUTOMATIC
  })
  @IsEnum(GradingType)
  @IsOptional()
  gradingType?: GradingType;

  @ApiPropertyOptional({
    description: 'Whether to auto-submit when time expires',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  autoSubmit?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for categorizing the assessment',
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
  assessmentType?: string;
}

