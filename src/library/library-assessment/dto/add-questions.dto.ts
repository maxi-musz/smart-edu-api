import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  Min,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LibraryQuestionOptionDto {
  @ApiProperty({ description: 'The option text', example: 'Paris' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  optionText: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiProperty({ description: 'Whether this option is correct', example: true })
  @IsBoolean()
  isCorrect: boolean;

  @ApiPropertyOptional({ description: 'Image URL for the option' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'S3 key for the option image' })
  @IsOptional()
  @IsString()
  imageS3Key?: string;

  @ApiPropertyOptional({
    description: 'Index into the optionImages array for with-image endpoint',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  imageIndex?: number;

  @ApiPropertyOptional({ description: 'Audio URL for the option' })
  @IsOptional()
  @IsString()
  audioUrl?: string;
}

export class LibraryCorrectAnswerDto {
  @ApiPropertyOptional({
    description: 'Text answer (for FILL_IN_BLANK, SHORT_ANSWER)',
  })
  @IsOptional()
  @IsString()
  answerText?: string;

  @ApiPropertyOptional({
    description: 'Numeric answer (for NUMERIC questions)',
    example: 42.5,
  })
  @IsOptional()
  @IsNumber()
  answerNumber?: number;

  @ApiPropertyOptional({ description: 'Date answer (for DATE questions)' })
  @IsOptional()
  @IsString()
  answerDate?: string;

  @ApiPropertyOptional({
    description: 'JSON answer for complex question types',
  })
  @IsOptional()
  answerJson?: any;
}

export class LibraryQuestionDto {
  @ApiProperty({
    description: 'The question text',
    example: 'What is the capital of France?',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  questionText: string;

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
  questionType: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Points for correct answer',
    example: 5.0,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ description: 'Whether required', default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Time limit in seconds',
    example: 30,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  timeLimit?: number;

  @ApiPropertyOptional({ description: 'Image URL for the question' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'S3 key for the question image' })
  @IsOptional()
  @IsString()
  imageS3Key?: string;

  @ApiPropertyOptional({ description: 'Audio URL for the question' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Video URL for the question' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether the student can retry this question',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  allowMultipleAttempts?: boolean;

  @ApiPropertyOptional({ description: 'Whether to show a hint', default: false })
  @IsOptional()
  @IsBoolean()
  showHint?: boolean;

  @ApiPropertyOptional({ description: 'Hint text' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  hintText?: string;

  @ApiPropertyOptional({ description: 'Minimum text length', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minLength?: number;

  @ApiPropertyOptional({ description: 'Maximum text length', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Minimum numeric value', example: 0 })
  @IsOptional()
  @IsNumber()
  minValue?: number;

  @ApiPropertyOptional({ description: 'Maximum numeric value', example: 100 })
  @IsOptional()
  @IsNumber()
  maxValue?: number;

  @ApiPropertyOptional({ description: 'Explanation shown after answering' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level',
    example: 'MEDIUM',
    enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
    default: 'MEDIUM',
  })
  @IsOptional()
  @IsString()
  difficultyLevel?: string;

  @ApiPropertyOptional({
    description: 'Options for MCQ / TRUE_FALSE',
    type: [LibraryQuestionOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LibraryQuestionOptionDto)
  options?: LibraryQuestionOptionDto[];

  @ApiPropertyOptional({
    description: 'Correct answers for non-MCQ types',
    type: [LibraryCorrectAnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LibraryCorrectAnswerDto)
  correctAnswers?: LibraryCorrectAnswerDto[];
}

export class AddLibraryQuestionsDto {
  @ApiProperty({
    description: 'Array of questions to add',
    type: [LibraryQuestionDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LibraryQuestionDto)
  questions: LibraryQuestionDto[];
}
