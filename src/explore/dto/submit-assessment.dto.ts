import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuestionResponseDto {
  @ApiProperty({ description: 'Question ID', example: 'question_123' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Text answer for short/long answer questions', required: false })
  @IsString()
  @IsOptional()
  textAnswer?: string;

  @ApiProperty({ description: 'Numeric answer for numeric questions', required: false })
  @IsOptional()
  numericAnswer?: number;

  @ApiProperty({ description: 'Date answer for date questions', required: false })
  @IsOptional()
  dateAnswer?: string;

  @ApiProperty({ 
    description: 'Selected option IDs for multiple choice questions', 
    type: [String],
    required: false 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedOptions?: string[];

  @ApiProperty({ 
    description: 'File URLs for file upload questions', 
    type: [String],
    required: false 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileUrls?: string[];

  @ApiProperty({ description: 'Time spent on this question in seconds', required: false })
  @IsOptional()
  timeSpent?: number;
}

export class SubmitAssessmentDto {
  @ApiProperty({ 
    description: 'Array of responses for all questions',
    type: [QuestionResponseDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionResponseDto)
  responses: QuestionResponseDto[];

  @ApiProperty({ description: 'Total time spent on assessment in seconds', required: false })
  @IsOptional()
  timeSpent?: number;
}

