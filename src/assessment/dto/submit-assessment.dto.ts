import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Individual answer for a question
 */
export class AnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'question_abc123'
  })
  @IsString()
  @IsNotEmpty()
  question_id: string;

  @ApiPropertyOptional({
    description: 'Question type',
    example: 'MULTIPLE_CHOICE',
    enum: ['MULTIPLE_CHOICE', 'MULTIPLE_CHOICE_SINGLE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY', 'NUMERIC', 'DATE', 'SHORT_ANSWER']
  })
  @IsString()
  @IsOptional()
  question_type?: string;

  @ApiPropertyOptional({
    description: 'Selected option IDs for multiple choice questions',
    example: ['option_1', 'option_2'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selected_options?: string[];

  @ApiPropertyOptional({
    description: 'Single answer (alternative to selected_options for single choice)',
    example: 'option_1'
  })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiPropertyOptional({
    description: 'Text answer for essay, fill-in-blank, short answer questions',
    example: 'The answer is 42'
  })
  @IsString()
  @IsOptional()
  text_answer?: string;
}

/**
 * Device information for tracking
 */
export class DeviceInfoDto {
  @ApiPropertyOptional({
    description: 'Device type',
    example: 'mobile'
  })
  @IsString()
  @IsOptional()
  device_type?: string;

  @ApiPropertyOptional({
    description: 'Operating system',
    example: 'iOS 17.2'
  })
  @IsString()
  @IsOptional()
  os?: string;

  @ApiPropertyOptional({
    description: 'App version',
    example: '2.5.0'
  })
  @IsString()
  @IsOptional()
  app_version?: string;

  @ApiPropertyOptional({
    description: 'Browser (for web)',
    example: 'Chrome 121'
  })
  @IsString()
  @IsOptional()
  browser?: string;
}

/**
 * DTO for submitting assessment answers
 */
export class SubmitAssessmentDto {
  @ApiProperty({
    description: 'Array of answers for each question',
    type: [AnswerDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({
    description: 'Submission timestamp (ISO string)',
    example: '2026-02-23T14:30:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  submission_time?: string;

  @ApiPropertyOptional({
    description: 'Time taken to complete in seconds',
    example: 1800
  })
  @IsNumber()
  @IsOptional()
  time_taken?: number;

  @ApiPropertyOptional({
    description: 'Total number of questions',
    example: 20
  })
  @IsNumber()
  @IsOptional()
  total_questions?: number;

  @ApiPropertyOptional({
    description: 'Number of questions answered',
    example: 18
  })
  @IsNumber()
  @IsOptional()
  questions_answered?: number;

  @ApiPropertyOptional({
    description: 'Number of questions skipped',
    example: 2
  })
  @IsNumber()
  @IsOptional()
  questions_skipped?: number;

  @ApiPropertyOptional({
    description: 'Total points possible (from frontend tracking)',
    example: 100
  })
  @IsNumber()
  @IsOptional()
  total_points_possible?: number;

  @ApiPropertyOptional({
    description: 'Total points earned (frontend calculation, will be re-calculated on backend)',
    example: 85
  })
  @IsNumber()
  @IsOptional()
  total_points_earned?: number;

  @ApiPropertyOptional({
    description: 'Submission status',
    example: 'COMPLETED',
    enum: ['COMPLETED', 'TIMED_OUT', 'AUTO_SUBMITTED']
  })
  @IsString()
  @IsOptional()
  submission_status?: string;

  @ApiPropertyOptional({
    description: 'Device information for tracking',
    type: DeviceInfoDto
  })
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  @IsOptional()
  device_info?: DeviceInfoDto;
}
