import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { AssessmentType } from '@prisma/client';

export class CreateExamBodyAssessmentDto {
  @ApiProperty({ example: 'WAEC Mathematics 2024/2025' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Past questions for WAEC Mathematics' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Read all questions carefully' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ example: 120, description: 'Duration in minutes' })
  @IsInt()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ example: 50, description: 'Passing score percentage' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  passingScore?: number;

  @ApiPropertyOptional({ example: 999 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxAttempts?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  shuffleOptions?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  showCorrectAnswers?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  showFeedback?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  showExplanation?: boolean;

  @ApiPropertyOptional({ enum: AssessmentType, example: AssessmentType.CBT })
  @IsEnum(AssessmentType)
  @IsOptional()
  assessmentType?: AssessmentType;
}

