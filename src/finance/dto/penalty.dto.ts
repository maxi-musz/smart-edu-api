import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PenaltyType, PenaltyRecurrence } from '@prisma/client';

export class CreatePenaltyRuleDto {
  @ApiProperty({ enum: PenaltyType })
  @IsEnum(PenaltyType)
  penalty_type: PenaltyType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  penalty_value: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  grace_period_days?: number;

  @ApiProperty({ enum: PenaltyRecurrence })
  @IsEnum(PenaltyRecurrence)
  recurrence: PenaltyRecurrence;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_penalty_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_penalty_occurrences?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  apply_to_partial_payers?: boolean;
}

export class UpdatePenaltyRuleDto {
  @ApiPropertyOptional({ enum: PenaltyType })
  @IsOptional()
  @IsEnum(PenaltyType)
  penalty_type?: PenaltyType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  penalty_value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  grace_period_days?: number;

  @ApiPropertyOptional({ enum: PenaltyRecurrence })
  @IsOptional()
  @IsEnum(PenaltyRecurrence)
  recurrence?: PenaltyRecurrence;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_penalty_amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  max_penalty_occurrences?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  apply_to_partial_payers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class WaivePenaltyDto {
  @ApiProperty()
  @IsString()
  waiver_reason: string;
}

export class PenaltyQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fee_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  class_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  student_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  date_to?: string;

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
