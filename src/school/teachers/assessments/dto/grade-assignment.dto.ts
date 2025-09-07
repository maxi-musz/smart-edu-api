import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, IsString, Min, Max } from 'class-validator';

export class GradeAssignmentDto {
  @ApiProperty({
    description: 'Grade/Score for the assignment',
    example: 85,
    minimum: 0
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  grade: number;

  @ApiPropertyOptional({
    description: 'Feedback for the student',
    example: 'Good work! You showed clear understanding of the concepts. Consider showing more steps in your solutions.'
  })
  @IsString()
  @IsOptional()
  feedback?: string;

  @ApiPropertyOptional({
    description: 'Additional comments from the teacher',
    example: 'Student demonstrated strong problem-solving skills'
  })
  @IsString()
  @IsOptional()
  comments?: string;
}
