import { IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAcademicSessionDto {
  @ApiPropertyOptional({
    description: 'Start date of the term. Must be at least 30 days before end_date. Format: YYYY-MM-DD',
    example: '2024-09-01'
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of the term. Must be at least 30 days after start_date. Format: YYYY-MM-DD',
    example: '2024-12-20'
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Whether this session should be marked as the current active session. If set to true, all other sessions for the school will be set to inactive',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;
}

export class UpdateTermDto {
  @ApiPropertyOptional({
    description: 'Start date of the term. Must be at least 30 days before end_date. Format: YYYY-MM-DD',
    example: '2024-09-01'
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of the term. Must be at least 30 days after start_date. Format: YYYY-MM-DD',
    example: '2024-12-20'
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Whether this term should be marked as the current active term. If set to true, all other terms for the session will be set to inactive',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;
}

