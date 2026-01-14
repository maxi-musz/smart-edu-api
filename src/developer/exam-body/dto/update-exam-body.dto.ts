import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { ExamBodyStatus } from './exam-body-status.enum';

export class UpdateExamBodyDto {
  @ApiPropertyOptional({
    description: 'Name of the examination body',
    example: 'WAEC',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Full name of the examination body',
    example: 'West African Examinations Council',
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Unique code for the examination body',
    example: 'WAEC',
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({
    description: 'Description of the examination body',
    example: 'The West African Examinations Council conducts standardized examinations...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL to the examination body logo',
    example: 'https://example.com/waec-logo.png',
  })
  @IsUrl()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({
    description: 'Official website URL',
    example: 'https://www.waecgh.org',
  })
  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'Status of the examination body',
    enum: ExamBodyStatus,
    example: ExamBodyStatus.active,
  })
  @IsEnum(ExamBodyStatus)
  @IsOptional()
  status?: ExamBodyStatus;
}

