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

  @ApiProperty({
    description: 'Academic term',
    enum: AcademicTerm,
    example: 'first'
  })
  @IsEnum(AcademicTerm)
  term: AcademicTerm;

  @ApiProperty({
    description: 'Start date of the academic session',
    example: '2024-09-01T00:00:00.000Z'
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({
    description: 'End date of the academic session',
    example: '2024-12-20T00:00:00.000Z'
  })
  @IsDateString()
  end_date: string;

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
