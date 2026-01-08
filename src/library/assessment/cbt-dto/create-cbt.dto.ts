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

/**
 * DTO for creating a new Library CBT Assessment
 * Only CBT type assessments can be created through this endpoint
 */
export class CreateLibraryCBTDto {
  @ApiProperty({
    description: 'Title of the CBT Assessment',
    example: 'Mathematics CBT - Algebra Basics'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the CBT Assessment',
    example: 'Test your understanding of basic algebra concepts'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Instructions for users taking the CBT',
    example: 'Answer all questions carefully. You have 30 minutes to complete this assessment.'
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({
    description: 'Library Subject ID where the CBT belongs',
    example: 'cmjb9ghi789'
  })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiPropertyOptional({
    description: 'Library Chapter ID for chapter-level CBT (optional)',
    example: 'cmjb9def456'
  })
  @IsString()
  @IsOptional()
  chapterId?: string;

  @ApiPropertyOptional({
    description: 'Library Topic ID for topic-specific CBT (optional)',
    example: 'cmjb9abc123'
  })
  @IsString()
  @IsOptional()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Duration of the CBT in minutes',
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
    description: 'Time limit in seconds (more precise than duration)',
    example: 1800,
    minimum: 60,
    maximum: 18000
  })
  @IsNumber()
  @IsOptional()
  @Min(60)
  @Max(18000)
  timeLimit?: number;

  @ApiPropertyOptional({
    description: 'CBT start date and time',
    example: '2025-01-15T09:00:00Z'
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'CBT end date and time',
    example: '2025-12-31T23:59:59Z'
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of attempts allowed per user',
    example: 3,
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
    example: 50,
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
    description: 'Total possible points for the CBT',
    example: 100,
    minimum: 1,
    default: 100
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  totalPoints?: number;

  @ApiPropertyOptional({
    description: 'Whether to shuffle questions order for each attempt',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to shuffle options order for multiple choice questions',
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
    description: 'Whether to show feedback/explanation after submission',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  showFeedback?: boolean;

  @ApiPropertyOptional({
    description: 'Whether students can view their grading',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  studentCanViewGrading?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to allow users to review their answers after submission',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  allowReview?: boolean;

  @ApiPropertyOptional({
    description: 'Grading type for the CBT',
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
    description: 'Tags for categorizing the CBT',
    example: ['algebra', 'mathematics', 'chapter1'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Display order for the CBT',
    example: 1,
    minimum: 0
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  order?: number;
}

