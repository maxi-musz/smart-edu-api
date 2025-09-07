import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';

export class GradeExamDto {
  @ApiProperty({
    description: 'Score achieved by the student',
    example: 85,
    minimum: 0
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  score: number;

  @ApiProperty({
    description: 'Total possible score for the exam',
    example: 100,
    minimum: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  totalScore: number;

  @ApiProperty({
    description: 'Number of correct answers',
    example: 42,
    minimum: 0
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  correctAnswers: number;

  @ApiProperty({
    description: 'Total number of questions',
    example: 50,
    minimum: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  totalQuestions: number;

  @ApiPropertyOptional({
    description: 'Time taken to complete the exam in minutes',
    example: 95
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  timeTaken?: number;

  @ApiPropertyOptional({
    description: 'Additional feedback for the student',
    example: 'Excellent performance! You demonstrated strong understanding of the concepts.'
  })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({
    description: 'Comments from the examiner',
    example: 'Student showed good problem-solving skills'
  })
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional({
    description: 'Whether the student passed the exam',
    example: true
  })
  @IsOptional()
  passed?: boolean;
}
