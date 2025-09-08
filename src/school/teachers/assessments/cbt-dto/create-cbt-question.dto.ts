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

export class CreateCBTOptionDto {
  @ApiProperty({
    description: 'Option text',
    example: 'Paris'
  })
  @IsString()
  @IsNotEmpty()
  option_text: string;

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
  is_correct: boolean;

  @ApiPropertyOptional({
    description: 'Image URL for the option',
    example: 'https://example.com/paris-image.jpg'
  })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the option',
    example: 'https://example.com/paris-audio.mp3'
  })
  @IsString()
  @IsOptional()
  audio_url?: string;
}

export class CreateCBTCorrectAnswerDto {
  @ApiPropertyOptional({
    description: 'Correct text answer (for text-based questions)',
    example: 'Photosynthesis is the process by which plants convert sunlight into energy.'
  })
  @IsString()
  @IsOptional()
  answer_text?: string;

  @ApiPropertyOptional({
    description: 'Correct numeric answer (for numeric questions)',
    example: 42.5
  })
  @IsNumber()
  @IsOptional()
  answer_number?: number;

  @ApiPropertyOptional({
    description: 'Correct date answer (for date questions)',
    example: '1945-05-08T00:00:00Z'
  })
  @IsString()
  @IsOptional()
  answer_date?: string;

  @ApiPropertyOptional({
    description: 'Array of correct option IDs (for multiple choice)',
    example: ['option_1', 'option_3'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  option_ids?: string[];

  @ApiPropertyOptional({
    description: 'Complex answer data (for matching, ordering, etc.)',
    example: { pairs: [['A', '1'], ['B', '2']] }
  })
  @IsObject()
  @IsOptional()
  answer_json?: any;
}

export class CreateCBTQuestionDto {
  @ApiProperty({
    description: 'Question text',
    example: 'What is the capital of France?'
  })
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @ApiProperty({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE_SINGLE
  })
  @IsEnum(QuestionType)
  question_type: QuestionType;

  @ApiProperty({
    description: 'Order of the question in the quiz',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  order: number;

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
  is_required?: boolean;

  @ApiPropertyOptional({
    description: 'Time limit for this specific question in seconds',
    example: 60,
    minimum: 10
  })
  @IsNumber()
  @IsOptional()
  @Min(10)
  time_limit?: number;

  @ApiPropertyOptional({
    description: 'Image URL for the question',
    example: 'https://example.com/france-map.jpg'
  })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'Audio URL for the question',
    example: 'https://example.com/question-audio.mp3'
  })
  @IsString()
  @IsOptional()
  audio_url?: string;

  @ApiPropertyOptional({
    description: 'Video URL for the question',
    example: 'https://example.com/question-video.mp4'
  })
  @IsString()
  @IsOptional()
  video_url?: string;

  @ApiPropertyOptional({
    description: 'Whether to allow multiple attempts for this question',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  allow_multiple_attempts?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show hint for this question',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  show_hint?: boolean;

  @ApiPropertyOptional({
    description: 'Hint text for the question',
    example: 'Think about European capitals'
  })
  @IsString()
  @IsOptional()
  hint_text?: string;

  @ApiPropertyOptional({
    description: 'Minimum length for text answers',
    example: 10,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  min_length?: number;

  @ApiPropertyOptional({
    description: 'Maximum length for text answers',
    example: 200,
    minimum: 1
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  max_length?: number;

  @ApiPropertyOptional({
    description: 'Minimum value for numeric answers',
    example: 0
  })
  @IsNumber()
  @IsOptional()
  min_value?: number;

  @ApiPropertyOptional({
    description: 'Maximum value for numeric answers',
    example: 100
  })
  @IsNumber()
  @IsOptional()
  max_value?: number;

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
  difficulty_level?: DifficultyLevel;

  @ApiPropertyOptional({
    description: 'Options for multiple choice questions',
    type: [CreateCBTOptionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCBTOptionDto)
  @IsOptional()
  options?: CreateCBTOptionDto[];

  @ApiPropertyOptional({
    description: 'Correct answers for the question',
    type: [CreateCBTCorrectAnswerDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCBTCorrectAnswerDto)
  @IsOptional()
  correct_answers?: CreateCBTCorrectAnswerDto[];
}
