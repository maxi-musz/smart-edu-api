import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateNewAssessmentDto } from './create-new-assessment.dto';
import { IsEnum, IsOptional, IsBoolean } from 'class-validator';

/**
 * Assessment status enumeration (teacher module).
 */
export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * DTO for updating an assessment.
 * Uses PartialType to make all CreateNewAssessmentDto fields optional (PATCH behavior).
 */
export class UpdateAssessmentDto extends PartialType(
  CreateNewAssessmentDto,
) {
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

