import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, ArrayMinSize } from 'class-validator';

export class ReleaseResultsForStudentsDto {
  @ApiProperty({
    description: 'Array of student IDs to release results for',
    example: ['student123', 'student456', 'student789'],
    type: [String]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one student ID is required' })
  @IsString({ each: true })
  studentIds: string[];

  @ApiProperty({
    description: 'Academic session ID (defaults to current active session)',
    required: false,
    example: 'session123'
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

