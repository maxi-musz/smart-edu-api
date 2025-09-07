import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({
    description: 'Title of the assignment',
    example: 'Algebra Problem Set 1'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the assignment',
    example: 'Solve the following algebraic equations and show your work'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Topic ID where the assignment belongs',
    example: 'topic123'
  })
  @IsString()
  @IsNotEmpty()
  topic_id: string;

  @ApiPropertyOptional({
    description: 'Due date for the assignment',
    example: '2025-02-15T23:59:59.000Z'
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum score for the assignment',
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
    description: 'Time limit for the assignment in minutes',
    example: 60,
    minimum: 1,
    maximum: 1440
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1440)
  timeLimit?: number;
}
