import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ExamBodyQuestionResponseDto {
  @ApiProperty({ description: 'Question ID', example: 'question_123' })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({ description: 'Text answer for short/long answer questions', required: false })
  @IsString()
  @IsOptional()
  textAnswer?: string;

  @ApiProperty({ description: 'Numeric answer for numeric questions', required: false })
  @IsNumber()
  @IsOptional()
  numericAnswer?: number;

  @ApiProperty({ description: 'Date answer for date questions (ISO string)', required: false })
  @IsString()
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
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}

export class SubmitExamBodyAssessmentDto {
  @ApiProperty({ 
    description: 'Array of responses for all questions',
    type: [ExamBodyQuestionResponseDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamBodyQuestionResponseDto)
  responses: ExamBodyQuestionResponseDto[];

  @ApiProperty({ description: 'Total time spent on assessment in seconds', required: false })
  @IsNumber()
  @IsOptional()
  timeSpent?: number;
}
