import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class BaseAssessmentDto {
  @ApiProperty({
    description: 'Title of the assessment',
    example: 'Mathematics Assessment'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the assessment',
    example: 'This assessment covers basic mathematical concepts'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Topic ID where the assessment belongs',
    example: 'topic123'
  })
  @IsString()
  @IsNotEmpty()
  topic_id: string;
}

export class AssessmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  topic_id: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
