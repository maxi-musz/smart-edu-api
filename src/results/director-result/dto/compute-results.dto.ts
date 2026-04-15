import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsOptional, ArrayMinSize } from 'class-validator';

export class ComputeResultsForStudentsDto {
  @ApiProperty({
    description: 'Student IDs (`Student.id`) to compute results for',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  studentIds: string[];

  @ApiProperty({
    required: false,
    description: 'Academic session ID (defaults to current active session)',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export class ReverseComputationBatchDto {
  @ApiProperty({ description: 'ID returned from a compute operation' })
  @IsString()
  batchId: string;
}
