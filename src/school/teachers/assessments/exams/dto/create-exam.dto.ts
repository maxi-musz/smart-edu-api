import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min, Max, IsEnum } from 'class-validator';

export enum ExamType {
  MIDTERM = 'midterm',
  FINAL = 'final',
  QUIZ = 'quiz',
  PRACTICAL = 'practical',
  ORAL = 'oral',
  WRITTEN = 'written'
}

export enum ExamStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export class CreateExamDto {
  @ApiProperty({
    description: 'Title of the exam',
    example: 'Mathematics Midterm Exam'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the exam',
    example: 'This exam covers chapters 1-5 of the mathematics textbook'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Topic ID where the exam belongs',
    example: 'topic123'
  })
  @IsString()
  @IsNotEmpty()
  topic_id: string;

  @ApiProperty({
    description: 'Type of exam',
    enum: ExamType,
    example: ExamType.MIDTERM
  })
  @IsEnum(ExamType)
  @IsNotEmpty()
  type: ExamType;

  @ApiPropertyOptional({
    description: 'Duration of the exam in minutes',
    example: 120,
    minimum: 15,
    maximum: 300
  })
  @IsNumber()
  @IsOptional()
  @Min(15)
  @Max(300)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Total number of questions in the exam',
    example: 50,
    minimum: 1,
    maximum: 200
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(200)
  totalQuestions?: number;

  @ApiPropertyOptional({
    description: 'Maximum score for the exam',
    example: 100,
    minimum: 1,
    maximum: 1000
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  maxScore?: number;

  @ApiPropertyOptional({
    description: 'Passing score percentage',
    example: 50,
    minimum: 0,
    maximum: 100
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @ApiPropertyOptional({
    description: 'Scheduled date and time for the exam',
    example: '2025-02-15T10:00:00.000Z'
  })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({
    description: 'Instructions for the exam',
    example: 'Read all questions carefully. Show your work for partial credit.'
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Whether the exam allows multiple attempts',
    example: false
  })
  @IsOptional()
  allowMultipleAttempts?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the exam is proctored',
    example: true
  })
  @IsOptional()
  isProctored?: boolean;
}
