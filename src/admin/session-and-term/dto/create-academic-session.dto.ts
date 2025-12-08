import { IsString, IsInt, IsDateString, IsEnum, IsOptional, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicTerm, AcademicSessionStatus } from '@prisma/client';

export class CreateAcademicSessionDto {
  @ApiProperty({
    description: 'School ID',
    example: 'school-uuid'
  })
  @IsString()
  school_id: string;

  @ApiProperty({
    description: 'Academic year in format like "2024/2025" or "2024-2025"',
    example: '2024/2025'
  })
  @IsString()
  academic_year: string;

  @ApiProperty({
    description: 'Start year of the academic session',
    example: 2024
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  start_year: number;

  @ApiProperty({
    description: 'End year of the academic session',
    example: 2025
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  end_year: number;

  @ApiPropertyOptional({
    description: 'Start date of the first term (academic session start). If not provided, defaults to September 1st of start_year. Format: YYYY-MM-DD',
    example: '2024-09-01'
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of the last term (academic session end). If not provided, defaults to August 31st of end_year. Format: YYYY-MM-DD',
    example: '2025-08-31'
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Number of terms for this academic session. Defaults to 3 if not provided. Must be between 1 and 3',
    example: 3,
    default: 3,
    minimum: 1,
    maximum: 3
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  number_of_terms?: number;

  @ApiPropertyOptional({
    description: 'Status of the academic session',
    enum: AcademicSessionStatus,
    default: 'active'
  })
  @IsOptional()
  @IsEnum(AcademicSessionStatus)
  status?: AcademicSessionStatus;

  @ApiPropertyOptional({
    description: 'Whether this is the current academic session',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;
}

