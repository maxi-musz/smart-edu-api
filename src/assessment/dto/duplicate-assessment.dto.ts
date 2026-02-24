import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for duplicating an existing assessment
 * 
 * This allows users to create a copy of an existing assessment with optional
 * shuffling of questions and/or options.
 */
export class DuplicateAssessmentDto {
  @ApiProperty({
    description: 'Title for the new duplicated assessment',
    example: 'Mathematics Test - Week 2',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  new_title: string;

  @ApiPropertyOptional({
    description: 'If true, shuffles the order of questions in the new assessment',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  shuffle_questions?: boolean;

  @ApiPropertyOptional({
    description: 'If true, shuffles the order of options for each question in the new assessment',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  shuffle_options?: boolean;

  @ApiPropertyOptional({
    description: 'Optional description for the new assessment. If not provided, copies from original.',
    example: 'Updated version of the mathematics assessment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  new_description?: string;
}
