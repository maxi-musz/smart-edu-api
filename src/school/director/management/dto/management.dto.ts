import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicTerm, AcademicSessionStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST } from '../management-bulk.constants';

export class DirectorCreateAcademicSessionDto {
  @ApiProperty({ example: '2024/2025' })
  @IsString()
  @IsNotEmpty()
  academic_year: string;

  @ApiProperty({ example: 2024 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  start_year: number;

  @ApiProperty({ example: 2025 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  end_year: number;

  @ApiProperty({ enum: AcademicTerm })
  @IsEnum(AcademicTerm)
  term: AcademicTerm;

  @ApiProperty()
  @IsDateString()
  start_date: string;

  @ApiProperty()
  @IsDateString()
  end_date: string;

  @ApiPropertyOptional({ enum: AcademicSessionStatus })
  @IsOptional()
  @IsEnum(AcademicSessionStatus)
  status?: AcademicSessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;
}

export class DirectorUpdateAcademicSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academic_year?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  start_year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  end_year?: number;

  @ApiPropertyOptional({ enum: AcademicTerm })
  @IsOptional()
  @IsEnum(AcademicTerm)
  term?: AcademicTerm;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ enum: AcademicSessionStatus })
  @IsOptional()
  @IsEnum(AcademicSessionStatus)
  status?: AcademicSessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_current?: boolean;
}

export class AssignStudentsClassDto {
  @ApiProperty({ type: [String], maxItems: MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST, {
    message: `At most ${MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST} students per request`,
  })
  @IsString({ each: true })
  student_ids: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  target_class_id: string;
}

export class StudentIdsBodyDto {
  @ApiProperty({ type: [String], maxItems: MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST, {
    message: `At most ${MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST} students per request`,
  })
  @IsString({ each: true })
  student_ids: string[];
}

export class PreviewProgressionDto {
  @ApiProperty({ type: [String], maxItems: MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST, {
    message: `At most ${MANAGEMENT_BULK_MAX_STUDENTS_PER_REQUEST} students per request`,
  })
  @IsString({ each: true })
  student_ids: string[];

  @ApiProperty({ enum: ['promote', 'demote'] })
  @IsIn(['promote', 'demote'])
  action: 'promote' | 'demote';
}

export class ManagementDashboardQueryDto {
  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  session_limit?: number;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  audit_limit?: number;

  @ApiPropertyOptional({
    description: 'Filter recent sessions by academic year (contains)',
  })
  @IsOptional()
  @IsString()
  academic_year?: string;

  @ApiPropertyOptional({ enum: AcademicTerm })
  @IsOptional()
  @IsEnum(AcademicTerm)
  term?: AcademicTerm;

  @ApiPropertyOptional({ enum: AcademicSessionStatus })
  @IsOptional()
  @IsEnum(AcademicSessionStatus)
  status?: AcademicSessionStatus;
}
