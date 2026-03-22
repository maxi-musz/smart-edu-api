import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAssessmentDto } from './create-assessment.dto';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

export class UpdateAssessmentDto extends PartialType(CreateAssessmentDto) {
  @ApiPropertyOptional({
    description: `Status of the assessment. 
    
    Restrictions:
    - Cannot update assessment while status is PUBLISHED or ACTIVE
    - Changing to PUBLISHED/ACTIVE will set is_published=true and published_at timestamp
    - Changing from PUBLISHED/ACTIVE to DRAFT will set is_published=false
    `,
    enum: AssessmentStatus,
    example: AssessmentStatus.DRAFT,
  })
  @IsEnum(AssessmentStatus)
  @IsOptional()
  status?: AssessmentStatus;

  @ApiPropertyOptional({
    description: 'Whether the assessment results have been released to students',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_result_released?: boolean;

  @ApiPropertyOptional({
    description: 'Whether students can view their grading details',
    example: true,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  student_can_view_grading?: boolean;
}
