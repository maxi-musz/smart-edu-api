import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';

export class CreateLiveClassDto {
  @ApiProperty({
    description: 'Title of the live class',
    example: 'Live Algebra Session - Problem Solving'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the live class',
    example: 'Interactive session on solving complex algebraic equations'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Topic ID where the live class belongs',
    example: 'topic123'
  })
  @IsString()
  @IsNotEmpty()
  topic_id: string;

  @ApiProperty({
    description: 'Meeting URL for the live class',
    example: 'https://meet.google.com/abc-defg-hij'
  })
  @IsString()
  @IsNotEmpty()
  meetingUrl: string;

  @ApiProperty({
    description: 'Start time of the live class',
    example: '2025-02-15T10:00:00.000Z'
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time of the live class',
    example: '2025-02-15T11:00:00.000Z'
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Maximum number of participants',
    example: 50,
    minimum: 1,
    maximum: 1000
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  maxParticipants?: number;
}
