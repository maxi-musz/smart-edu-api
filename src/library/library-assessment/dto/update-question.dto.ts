import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLibraryQuestionOptionDto {
  @ApiPropertyOptional({
    description: 'Option ID for updating existing options. Omit to create new.',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'The option text' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  optionText?: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({ description: 'Whether this option is correct' })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiPropertyOptional({ description: 'Image URL for the option' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'S3 key for the option image' })
  @IsOptional()
  @IsString()
  imageS3Key?: string;

  @ApiPropertyOptional({ description: 'Audio URL for the option' })
  @IsOptional()
  @IsString()
  audioUrl?: string;
}

export class UpdateLibraryCorrectAnswerDto {
  @ApiPropertyOptional({ description: 'Correct answer record ID' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Text answer' })
  @IsOptional()
  @IsString()
  answerText?: string;

  @ApiPropertyOptional({ description: 'Numeric answer', example: 42.5 })
  @IsOptional()
  @IsNumber()
  answerNumber?: number;

  @ApiPropertyOptional({ description: 'Date answer' })
  @IsOptional()
  @IsString()
  answerDate?: string;

  @ApiPropertyOptional({ description: 'JSON answer for complex types' })
  @IsOptional()
  answerJson?: any;
}

export class UpdateLibraryQuestionDto {
  @ApiPropertyOptional({ description: 'The question text' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  questionText?: string;

  @ApiPropertyOptional({
    description: 'The type of question',
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
  questionType?: string;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({ description: 'Points for correct answer', example: 5.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional({ description: 'Whether required' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Time limit in seconds', example: 30 })
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

  @ApiPropertyOptional({ description: 'Audio URL' })
  @IsOptional()
  @IsString()
  audioUrl?: string;

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Allow multiple attempts' })
  @IsOptional()
  @IsBoolean()
  allowMultipleAttempts?: boolean;

  @ApiPropertyOptional({ description: 'Show hint' })
  @IsOptional()
  @IsBoolean()
  showHint?: boolean;

  @ApiPropertyOptional({ description: 'Hint text' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  hintText?: string;

  @ApiPropertyOptional({ description: 'Minimum text length' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minLength?: number;

  @ApiPropertyOptional({ description: 'Maximum text length' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxLength?: number;

  @ApiPropertyOptional({ description: 'Minimum numeric value' })
  @IsOptional()
  @IsNumber()
  minValue?: number;

  @ApiPropertyOptional({ description: 'Maximum numeric value' })
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
    enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'],
  })
  @IsOptional()
  @IsString()
  difficultyLevel?: string;

  @ApiPropertyOptional({
    description: 'Updated options for MCQ/TRUE_FALSE',
    type: [UpdateLibraryQuestionOptionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLibraryQuestionOptionDto)
  options?: UpdateLibraryQuestionOptionDto[];

  @ApiPropertyOptional({
    description: 'Updated correct answers for non-MCQ types',
    type: [UpdateLibraryCorrectAnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateLibraryCorrectAnswerDto)
  correctAnswers?: UpdateLibraryCorrectAnswerDto[];
}
