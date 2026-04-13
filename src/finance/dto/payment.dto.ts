import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeePaymentMethod, FeePaymentType } from '@prisma/client';

export class RecordPaymentDto {
  @ApiProperty()
  @IsString()
  student_id: string;

  @ApiProperty()
  @IsString()
  fee_id: string;

  @ApiProperty()
  @IsString()
  student_fee_record_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ enum: FeePaymentMethod })
  @IsEnum(FeePaymentMethod)
  payment_method: FeePaymentMethod;

  @ApiPropertyOptional({ enum: FeePaymentType })
  @IsOptional()
  @IsEnum(FeePaymentType)
  payment_type?: FeePaymentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  installment_number?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class InitiatePaystackPaymentDto {
  @ApiProperty()
  @IsString()
  student_id: string;

  @ApiProperty()
  @IsString()
  fee_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  installment_number?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  callback_url?: string;
}

export class PaymentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payment_method?: string;

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
