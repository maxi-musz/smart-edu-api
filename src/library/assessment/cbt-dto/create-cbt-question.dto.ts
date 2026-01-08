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
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QuestionType {
  MULTIPLE_CHOICE_SINGLE = 'MULTIPLE_CHOICE_SINGLE',
  MULTIPLE_CHOICE_MULTIPLE = 'MULTIPLE_CHOICE_MULTIPLE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  LONG_ANSWER = 'LONG_ANSWER',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  MATCHING = 'MATCHING',
  ORDERING = 'ORDERING',
  FILE_UPLOAD = 'FILE_UPLOAD',
  NUMERIC = 'NUMERIC',
  DATE = 'DATE',
  RATING_SCALE = 'RATING_SCALE'
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT'
}

/**
 * DTO for creating an option in a multiple choice question
 */
export class CreateLibraryCBTOptionDto {
  @ApiProperty({
    description: 'Option text',
    example: 'Paris'
  })
  @IsString()
  @IsNotEmpty()
  optionText: string;

  @ApiProperty({
    description: 'Order/position of the option',
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
    example: 'https://s3.amazonaws.com/bucket/option-image.jpg'
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the option',
    example: 'https://s3.amazonaws.com/bucket/option-audio.mp3'
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;
}

/**
 * DTO for defining correct answers for a question
 */
export class CreateLibraryCBTCorrectAnswerDto {
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
    description: 'Array of correct option IDs (for multiple choice questions)',
    example: ['option_1', 'option_3'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  optionIds?: string[];

  @ApiPropertyOptional({
    description: 'Complex answer data in JSON format (for matching, ordering, etc.)',
    example: { pairs: [['A', '1'], ['B', '2']] }
  })
  @IsObject()
  @IsOptional()
  answerJson?: any;
}

/**
 * DTO for creating a new question in a Library CBT Assessment
 */
export class CreateLibraryCBTQuestionDto {
  @ApiProperty({
    description: 'Question text/prompt',
    example: 'What is the capital of France?'
  })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE_SINGLE
  })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiPropertyOptional({
    description: 'Order/position of the question in the CBT (auto-assigned if not provided)',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for correct answer',
    example: 2.0,
    minimum: 0.1,
    default: 1.0
  })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  points?: number;

  @ApiPropertyOptional({
    description: 'Whether this question is required (must be answered)',
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
    description: 'Image URL for the question (upload image first using upload-image endpoint)',
    example: 'https://s3.amazonaws.com/bucket/question-image.jpg'
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'S3 key for the question image (returned from upload-image endpoint)',
    example: 'library-assessment-images/platforms/123/assessments/456/question_1234567890_image.jpg'
  })
  @IsString()
  @IsOptional()
  imageS3Key?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the question',
    example: 'https://s3.amazonaws.com/bucket/question-audio.mp3'
  })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Video URL for the question',
    example: 'https://s3.amazonaws.com/bucket/question-video.mp4'
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
    description: 'Hint text to help users answer the question',
    example: 'Think about European capitals'
  })
  @IsString()
  @IsOptional()
  hintText?: string;

  @ApiPropertyOptional({
    description: 'Minimum length for text answers (in characters)',
    example: 10,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  minLength?: number;

  @ApiPropertyOptional({
    description: 'Maximum length for text answers (in characters)',
    example: 500,
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
    description: 'Explanation for the correct answer (shown after submission if enabled)',
    example: 'Paris is the capital and largest city of France, located on the Seine River.'
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level of the question',
    enum: DifficultyLevel,
    example: DifficultyLevel.MEDIUM,
    default: DifficultyLevel.MEDIUM
  })
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficultyLevel?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Options for multiple choice questions (required for MULTIPLE_CHOICE_* and TRUE_FALSE)',
    type: [CreateLibraryCBTOptionDto],
    example: [
      { optionText: 'Paris', order: 1, isCorrect: true },
      { optionText: 'London', order: 2, isCorrect: false },
      { optionText: 'Berlin', order: 3, isCorrect: false },
      { optionText: 'Madrid', order: 4, isCorrect: false }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLibraryCBTOptionDto)
  @IsOptional()
  options?: CreateLibraryCBTOptionDto[];

  @ApiPropertyOptional({
    description: 'Correct answers for the question (alternative to marking options as isCorrect)',
    type: [CreateLibraryCBTCorrectAnswerDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLibraryCBTCorrectAnswerDto)
  @IsOptional()
  correctAnswers?: CreateLibraryCBTCorrectAnswerDto[];
}

