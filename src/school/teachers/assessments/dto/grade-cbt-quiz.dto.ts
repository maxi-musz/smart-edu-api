import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';

export class GradeCBTQuizDto {
  @ApiProperty({
    description: 'Score achieved by the student',
    example: 18,
    minimum: 0
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  score: number;

  @ApiProperty({
    description: 'Total number of questions in the quiz',
    example: 20,
    minimum: 1
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  totalQuestions: number;

  @ApiProperty({
    description: 'Number of correct answers',
    example: 18,
    minimum: 0
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  correctAnswers: number;

  @ApiPropertyOptional({
    description: 'Time taken to complete the quiz in minutes',
    example: 25
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  timeTaken?: number;

  @ApiPropertyOptional({
    description: 'Additional feedback for the student',
    example: 'Excellent performance! You completed the quiz with time to spare.'
  })
  @IsString()
  @IsOptional()
  feedback?: string;
}
