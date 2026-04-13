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
import { RefundType, RefundDestination } from '@prisma/client';

export class CreateRefundDto {
  @ApiProperty()
  @IsString()
  student_id: string;

  @ApiProperty()
  @IsString()
  fee_payment_id: string;

  @ApiProperty()
  @IsString()
  student_fee_record_id: string;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty({ enum: RefundType })
  @IsEnum(RefundType)
  refund_type: RefundType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  refund_amount: number;

  @ApiProperty({ enum: RefundDestination })
  @IsEnum(RefundDestination)
  refund_destination: RefundDestination;

  @ApiPropertyOptional()
  @IsOptional()
  bank_account_details?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  refund_includes_penalty?: boolean;
}

export class ApproveRefundDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectRefundDto {
  @ApiProperty()
  @IsString()
  rejection_reason: string;
}

export class RefundQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

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
  @IsString()
  destination?: string;

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
