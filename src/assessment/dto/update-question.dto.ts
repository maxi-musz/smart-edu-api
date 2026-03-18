import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating an option within a question
 * Allows partial updates of option properties
 */
export class UpdateQuestionOptionDto {
  @ApiPropertyOptional({
    description:
      'Option ID for updating existing options. If provided, updates that option. If omitted, creates a new option.',
    example: 'clx123abc...',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'The option text',
    example: 'Paris',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  option_text?: string;

  @ApiPropertyOptional({
    description: 'Display order of this option',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Whether this option is a correct answer',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_correct?: boolean;

  @ApiPropertyOptional({
    description: 'Optional image URL for the option',
    example: 'https://example.com/option-image.png',
  })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({
    description: 'S3 key for the option image (for cleanup)',
  })
  @IsOptional()
  @IsString()
  image_s3_key?: string;

  @ApiPropertyOptional({
    description: 'Optional audio URL for the option',
  })
  @IsOptional()
  @IsString()
  audio_url?: string;
}

/**
 * DTO for updating correct answer entries
 */
export class UpdateCorrectAnswerDto {
  @ApiPropertyOptional({
    description: 'ID of the correct answer record to update',
  })
  @IsOptional()
  @IsString()
  id?: string;

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
 * DTO for updating a question in an assessment
 *
 * Supports partial updates - only include fields you want to modify.
 *
 * **Important Notes:**
 * 1. Cannot update questions in PUBLISHED or ACTIVE assessments
 * 2. Changing question_type may require re-specifying options or correct_answers
 * 3. When updating options:
 *    - Provide full option list to replace all options
 *    - New options don't need IDs
 *    - Keep existing option IDs to update those options
 * 4. When updating correct_answers:
 *    - For MCQ types, correct_answers are auto-generated from is_correct flags on options
 *    - For non-MCQ types (text, numeric, date), provide explicit correct_answers
 * 5. S3 keys for old images are tracked - old files will be deleted from storage
 */
export class UpdateQuestionDto {
  @ApiPropertyOptional({
    description: 'The question text',
    example: 'What is the capital of France?',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  question_text?: string;

  @ApiPropertyOptional({
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
  @IsOptional()
  @IsString()
  question_type?: string;

  @ApiPropertyOptional({
    description: 'Display order of the question',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Points awarded for a correct answer',
    example: 5.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({
    description: 'Whether this question is required',
    example: true,
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
    description: 'S3 key for the question image (used for cleanup)',
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
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  allow_multiple_attempts?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to show a hint for this question',
    example: false,
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
    description: 'Minimum numeric value (for NUMERIC questions)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  min_value?: number;

  @ApiPropertyOptional({
    description: 'Maximum numeric value (for NUMERIC questions)',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  max_value?: number;

  @ApiPropertyOptional({
    description: 'Explanation shown after answering',
    example:
      'Paris is the capital of France, known for its landmarks like the Eiffel Tower.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level of the question',
    example: 'MEDIUM',
    enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
  })
  @IsOptional()
  @IsString()
  difficulty_level?: string;

  @ApiPropertyOptional({
    description:
      'Updated options for MCQ/TRUE_FALSE questions. Provide full list to replace all options.',
    type: [UpdateQuestionOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionOptionDto)
  options?: UpdateQuestionOptionDto[];

  @ApiPropertyOptional({
    description:
      'Updated correct answers for non-MCQ question types. For MCQ, correct_answers are auto-generated from is_correct flags.',
    type: [UpdateCorrectAnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCorrectAnswerDto)
  correct_answers?: UpdateCorrectAnswerDto[];
}
