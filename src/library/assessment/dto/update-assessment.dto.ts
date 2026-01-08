import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLibraryAssessmentDto } from './create-assessment.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum QuizStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

export class UpdateLibraryAssessmentDto extends PartialType(CreateLibraryAssessmentDto) {
  @ApiPropertyOptional({
    description: 'Status of the assessment',
    enum: QuizStatus,
    example: QuizStatus.PUBLISHED
  })
  @IsEnum(QuizStatus)
  @IsOptional()
  status?: QuizStatus;
}

