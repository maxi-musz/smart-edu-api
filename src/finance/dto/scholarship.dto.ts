import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScholarshipCoverageType } from '@prisma/client';

export class CreateScholarshipDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sponsor?: string;

  @ApiProperty()
  @IsString()
  academic_session_id: string;

  @ApiProperty({ enum: ScholarshipCoverageType })
  @IsEnum(ScholarshipCoverageType)
  coverage_type: ScholarshipCoverageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  coverage_value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicable_fee_ids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max_beneficiaries?: number;
}

export class UpdateScholarshipDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sponsor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(ScholarshipCoverageType)
  coverage_type?: ScholarshipCoverageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  coverage_value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  applicable_fee_ids?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max_beneficiaries?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class ScholarshipQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academic_session_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  is_active?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
