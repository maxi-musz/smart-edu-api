import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsBoolean, 
  IsArray, 
  IsEnum, 
  Min, 
  Max,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType, DifficultyLevel } from './create-question.dto';

export class UpdateLibraryAssessmentOptionDto {
  @ApiPropertyOptional({
    description: 'Option ID (required for updates, not for new options)',
    example: 'option_123'
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Option text',
    example: 'Paris'
  })
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @ApiProperty({
    description: 'Order of the option',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiProperty({
    description: 'Whether this option is correct',
    example: true
  })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({
    description: 'Image URL for the option',
    example: 'https://example.com/paris-image.jpg'
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the option',
    example: 'https://example.com/paris-audio.mp3'
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;
}

export class UpdateLibraryAssessmentCorrectAnswerDto {
  @ApiPropertyOptional({
    description: 'Answer ID (required for updates, not for new answers)',
    example: 'answer_123'
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: 'Correct text answer (for text-based questions)',
    example: 'Photosynthesis is the process by which plants convert sunlight into energy.'
  })
  @IsString()
  @IsOptional()
  answerText?: string;

  @ApiPropertyOptional({
    description: 'Correct numeric answer (for numeric questions)',
    example: 42.5
  })
  @IsNumber()
  @IsOptional()
  answerNumber?: number;

  @ApiPropertyOptional({
    description: 'Correct date answer (for date questions)',
    example: '1945-05-08T00:00:00Z'
  })
  @IsString()
  @IsOptional()
  answerDate?: string;

  @ApiPropertyOptional({
    description: 'Array of correct option IDs (for multiple choice)',
    example: ['option_1', 'option_3'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  optionIds?: string[];

  @ApiPropertyOptional({
    description: 'Complex answer data (for matching, ordering, etc.)',
    example: { pairs: [['A', '1'], ['B', '2']] }
  })
  @IsOptional()
  answerJson?: any;
}

export class UpdateLibraryAssessmentQuestionDto {
  @ApiPropertyOptional({
    description: 'Question text',
    example: 'What is the capital of France?'
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  questionText?: string;

  @ApiPropertyOptional({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE_SINGLE
  })
  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @ApiPropertyOptional({
    description: 'Order of the question in the assessment (auto-assigned if not provided)',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Points for this question',
    example: 2.0,
    minimum: 0.1,
    default: 1.0
  })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  points?: number;

  @ApiPropertyOptional({
    description: 'Whether this question is required',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Time limit for this specific question in seconds',
    example: 60,
    minimum: 10
  })
  @IsNumber()
  @IsOptional()
  @Min(10)
  timeLimit?: number;

  @ApiPropertyOptional({
    description: 'Image URL for the question',
    example: 'https://example.com/france-map.jpg'
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the question',
    example: 'https://example.com/question-audio.mp3'
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Video URL for the question',
    example: 'https://example.com/question-video.mp4'
  })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether to allow multiple attempts for this question',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  allowMultipleAttempts?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show hint for this question',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  showHint?: boolean;

  @ApiPropertyOptional({
    description: 'Hint text for the question',
    example: 'Think about European capitals'
  })
  @IsString()
  @IsOptional()
  hintText?: string;

  @ApiPropertyOptional({
    description: 'Minimum length for text answers',
    example: 10,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  minLength?: number;

  @ApiPropertyOptional({
    description: 'Maximum length for text answers',
    example: 200,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  maxLength?: number;

  @ApiPropertyOptional({
    description: 'Minimum value for numeric answers',
    example: 0
  })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiPropertyOptional({
    description: 'Maximum value for numeric answers',
    example: 100
  })
  @IsNumber()
  @IsOptional()
  maxValue?: number;

  @ApiPropertyOptional({
    description: 'Explanation for the correct answer',
    example: 'Paris is the capital and largest city of France.'
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level of the question',
    enum: DifficultyLevel,
    example: DifficultyLevel.EASY,
    default: DifficultyLevel.MEDIUM
  })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficultyLevel?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Options for multiple choice questions (completely replaces existing options)',
    type: [UpdateLibraryAssessmentOptionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLibraryAssessmentOptionDto)
  @IsOptional()
  options?: UpdateLibraryAssessmentOptionDto[];

  @ApiPropertyOptional({
    description: 'Correct answers for the question (completely replaces existing answers)',
    type: [UpdateLibraryAssessmentCorrectAnswerDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLibraryAssessmentCorrectAnswerDto)
  @IsOptional()
  correctAnswers?: UpdateLibraryAssessmentCorrectAnswerDto[];
}

