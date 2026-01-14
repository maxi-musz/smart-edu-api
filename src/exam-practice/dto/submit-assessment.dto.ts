import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ExamQuestionResponseDto {
  @IsString()
  questionId: string;

  @IsOptional()
  @IsString()
  textAnswer?: string;

  @IsOptional()
  @IsNumber()
  numericAnswer?: number;

  @IsOptional()
  @IsDateString()
  dateAnswer?: Date;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedOptions?: string[];
}

export class SubmitExamAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamQuestionResponseDto)
  responses: ExamQuestionResponseDto[];

  @IsOptional()
  @IsDateString()
  startedAt?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;
}

