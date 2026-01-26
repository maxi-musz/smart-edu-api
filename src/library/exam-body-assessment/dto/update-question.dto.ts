import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';
import { CreateLibraryExamBodyQuestionOptionDto } from './create-question.dto';

export class UpdateLibraryExamBodyQuestionDto {
  @ApiPropertyOptional({ example: 'What is 2 + 2?' })
  @IsString()
  @IsOptional()
  questionText?: string;

  @ApiPropertyOptional({ enum: QuestionType, example: QuestionType.MULTIPLE_CHOICE_SINGLE })
  @IsEnum(QuestionType)
  @IsOptional()
  questionType?: QuestionType;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ example: 'Addition is a basic arithmetic operation' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ type: [CreateLibraryExamBodyQuestionOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLibraryExamBodyQuestionOptionDto)
  @IsOptional()
  options?: CreateLibraryExamBodyQuestionOptionDto[];
}
