import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WaiverType, DiscountType } from '@prisma/client';

export class CreateWaiverDto {
  @ApiProperty()
  @IsString()
  student_id: string;

  @ApiProperty()
  @IsString()
  fee_id: string;

  @ApiProperty()
  @IsString()
  student_fee_record_id: string;

  @ApiProperty({ enum: WaiverType })
  @IsEnum(WaiverType)
  waiver_type: WaiverType;

  @ApiPropertyOptional({ enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discount_type?: DiscountType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scholarship_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveWaiverDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectWaiverDto {
  @ApiProperty()
  @IsString()
  rejection_reason: string;
}

export class RevokeWaiverDto {
  @ApiProperty()
  @IsString()
  revocation_reason: string;
}

export class WaiverQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  waiver_type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academic_session_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  student_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fee_id?: string;

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
