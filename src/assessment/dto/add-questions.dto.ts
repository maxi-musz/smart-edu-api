import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for a single option within a question
 */
export class QuestionOptionDto {
  @ApiProperty({
    description: 'The option text displayed to the user',
    example: 'Paris',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  option_text: string;

  @ApiPropertyOptional({
    description: 'Display order of this option (auto-assigned if not provided)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiProperty({
    description: 'Whether this option is a correct answer',
    example: true,
  })
  @IsBoolean()
  is_correct: boolean;

  @ApiPropertyOptional({
    description: 'Optional image URL for the option',
    example: 'https://example.com/option-image.png',
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({
    description:
      'S3 key for the option image (auto-populated by with-image endpoint)',
  })
  @IsOptional()
  @IsString()
  image_s3_key?: string;

  @ApiPropertyOptional({
    description:
      'Index into the optionImages array (used with POST /questions/with-image endpoint to match uploaded images to options)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  imageIndex?: number;

  @ApiPropertyOptional({
    description: 'Optional audio URL for the option',
    example: 'https://example.com/option-audio.mp3',
  })
  @IsOptional()
  @IsString()
  audio_url?: string;
}

/**
 * DTO for a correct answer entry (used for non-MCQ question types)
 */
export class CorrectAnswerDto {
  @ApiPropertyOptional({
    description: 'Text answer (for FILL_IN_BLANK, SHORT_ANSWER)',
    example: 'Photosynthesis',
  })
  @IsOptional()
  @IsString()
  answer_text?: string;

  @ApiPropertyOptional({
    description: 'Numeric answer (for NUMERIC questions)',
    example: 42.5,
  })
  @IsOptional()
  @IsNumber()
  answer_number?: number;

  @ApiPropertyOptional({
    description: 'Date answer (for DATE questions)',
    example: '2026-01-15T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  answer_date?: string;

  @ApiPropertyOptional({
    description: 'JSON answer for complex question types (MATCHING, ORDERING)',
    example: { pairs: [{ left: 'A', right: '1' }] },
  })
  @IsOptional()
  answer_json?: any;
}

/**
 * DTO for a single question to be added to an assessment
 */
export class QuestionDto {
  @ApiProperty({
    description: 'The question text',
    example: 'What is the capital of France?',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  question_text: string;

  @ApiProperty({
    description: 'The type of question',
    example: 'MULTIPLE_CHOICE_SINGLE',
    enum: [
      'MULTIPLE_CHOICE_SINGLE',
      'MULTIPLE_CHOICE_MULTIPLE',
      'SHORT_ANSWER',
      'LONG_ANSWER',
      'TRUE_FALSE',
      'FILL_IN_BLANK',
      'MATCHING',
      'ORDERING',
      'FILE_UPLOAD',
      'NUMERIC',
      'DATE',
      'RATING_SCALE',
    ],
  })
  @IsString()
  @IsNotEmpty()
  question_type: string;

  @ApiPropertyOptional({
    description:
      'Display order of the question (auto-assigned if not provided)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for a correct answer',
    example: 5.0,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({
    description: 'Whether this question is required',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({
    description: 'Time limit in seconds for this specific question',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  time_limit?: number;

  @ApiPropertyOptional({
    description: 'Image URL to display with the question',
    example: 'https://example.com/question-image.png',
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'S3 key for the question image',
  })
  @IsOptional()
  @IsString()
  image_s3_key?: string;

  @ApiPropertyOptional({
    description: 'Audio URL to play with the question',
  })
  @IsOptional()
  @IsString()
  audio_url?: string;

  @ApiPropertyOptional({
    description: 'Video URL to display with the question',
  })
  @IsOptional()
  @IsString()
  video_url?: string;

  @ApiPropertyOptional({
    description: 'Whether the student can retry this question',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allow_multiple_attempts?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show a hint for this question',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  show_hint?: boolean;

  @ApiPropertyOptional({
    description: 'Hint text to help the student',
    example: 'Think about European capitals',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  hint_text?: string;

  @ApiPropertyOptional({
    description: 'Minimum text length (for SHORT_ANSWER/LONG_ANSWER)',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  min_length?: number;

  @ApiPropertyOptional({
    description: 'Maximum text length (for SHORT_ANSWER/LONG_ANSWER)',
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_length?: number;

  @ApiPropertyOptional({
    description: 'Minimum numeric value (for NUMERIC)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  min_value?: number;

  @ApiPropertyOptional({
    description: 'Maximum numeric value (for NUMERIC)',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  max_value?: number;

  @ApiPropertyOptional({
    description: 'Explanation shown after answering (for learning)',
    example: 'Paris is the capital and largest city of France.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level of the question',
    example: 'MEDIUM',
    enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
    default: 'MEDIUM',
  })
  @IsOptional()
  @IsString()
  difficulty_level?: string;

  // ========================================
  // OPTIONS (for MCQ and TRUE_FALSE)
  // ========================================

  @ApiPropertyOptional({
    description: 'Options for multiple choice / true-false questions',
    type: [QuestionOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  // ========================================
  // CORRECT ANSWERS (for non-MCQ types)
  // ========================================

  @ApiPropertyOptional({
    description:
      'Correct answers for non-MCQ question types (fill-in-blank, numeric, date, etc.)',
    type: [CorrectAnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CorrectAnswerDto)
  correct_answers?: CorrectAnswerDto[];
}

/**
 * DTO for adding questions to an assessment
 *
 * Supports adding one or multiple questions at once.
 * Each question can include its options and correct answers.
 */
export class AddQuestionsDto {
  @ApiProperty({
    description: 'Array of questions to add to the assessment',
    type: [QuestionDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
