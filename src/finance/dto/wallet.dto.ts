import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ManualTopUpDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class WalletTopUpInitiateDto {
  @ApiProperty()
  @IsNumber()
  @Min(500)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  callback_url?: string;
}

/** @deprecated Use WalletTopUpInitiateDto */
export type PaystackTopUpDto = WalletTopUpInitiateDto;

export class WalletPayFeeDto {
  @ApiProperty()
  @IsString()
  fee_id: string;

  @ApiProperty()
  @IsString()
  student_fee_record_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  installment_number?: number;
}

export class WalletTransferDto {
  @ApiProperty()
  @IsString()
  to_student_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number;
}

export class WalletQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

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
