import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateCBTQuizDto {
  @ApiProperty({
    description: 'Title of the CBT quiz',
    example: 'Mathematics Quiz - Chapter 1'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the CBT quiz',
    example: 'Test your understanding of basic algebra concepts'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Topic ID where the quiz belongs',
    example: 'topic123'
  })
  @IsString()
  @IsNotEmpty()
  topic_id: string;

  @ApiPropertyOptional({
    description: 'Duration of the quiz in minutes',
    example: 30,
    minimum: 1,
    maximum: 180
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(180)
  duration?: number;

  @ApiPropertyOptional({
    description: 'Total number of questions in the quiz',
    example: 20,
    minimum: 1,
    maximum: 100
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  totalQuestions?: number;

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
}
