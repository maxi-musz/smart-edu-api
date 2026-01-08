import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLibraryCBTDto } from './create-cbt.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { QuizStatus } from '../dto/update-assessment.dto';

/**
 * DTO for updating an existing Library CBT Assessment
 * All fields are optional - only provide fields you want to update
 */
export class UpdateLibraryCBTDto extends PartialType(CreateLibraryCBTDto) {
  @ApiPropertyOptional({
    description: 'Status of the CBT Assessment',
    enum: QuizStatus,
    example: QuizStatus.PUBLISHED
  })
  @IsEnum(QuizStatus)
  @IsOptional()
  status?: QuizStatus;
}

