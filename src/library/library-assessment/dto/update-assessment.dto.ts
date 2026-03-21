import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateLibraryAssessmentDto } from './create-assessment.dto';

export class UpdateLibraryAssessmentDto extends PartialType(
  CreateLibraryAssessmentDto,
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isResultReleased?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  studentCanViewGrading?: boolean;
}
