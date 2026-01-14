import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { ExamBodyStatus } from './exam-body-status.enum';

export class CreateExamBodyDto {
  @ApiProperty({
    description: 'Name of the examination body',
    example: 'WAEC',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Full name of the examination body',
    example: 'West African Examinations Council',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  // Code is auto-generated from name by the backend

  @ApiPropertyOptional({
    description: 'Description of the examination body',
    example: 'The West African Examinations Council conducts standardized examinations...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  // logoUrl will be set by the backend after icon upload
  // Icon file is required and uploaded via multipart/form-data

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
    default: ExamBodyStatus.active,
  })
  @IsEnum(ExamBodyStatus)
  @IsOptional()
  status?: ExamBodyStatus;
}

