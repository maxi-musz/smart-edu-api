import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  FeeType,
  FeeAssignmentScope,
  PaymentPlanType,
} from '@prisma/client';

export class CreateInstallmentDto {
  @ApiProperty()
  @IsNumber()
  installment_number: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  label?: string;
}

export class CreatePaymentPlanDto {
  @ApiProperty({ enum: PaymentPlanType })
  @IsEnum(PaymentPlanType)
  plan_type: PaymentPlanType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  max_installments?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allow_partial?: boolean;

  @ApiPropertyOptional({ type: [CreateInstallmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInstallmentDto)
  installments?: CreateInstallmentDto[];
}

export class ClassAssignmentDto {
  @ApiProperty()
  @IsString()
  class_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount_override?: number;
}

export class CreateFeeDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: FeeType })
  @IsEnum(FeeType)
  fee_type: FeeType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  base_amount: number;

  @ApiProperty()
  @IsString()
  academic_session_id: string;

  @ApiPropertyOptional({ enum: FeeAssignmentScope })
  @IsOptional()
  @IsEnum(FeeAssignmentScope)
  assignment_scope?: FeeAssignmentScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  auto_deduct_enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  auto_deduct_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({ type: [ClassAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassAssignmentDto)
  class_assignments?: ClassAssignmentDto[];

  @ApiPropertyOptional({ type: CreatePaymentPlanDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePaymentPlanDto)
  payment_plan?: CreatePaymentPlanDto;
}

export class UpdateFeeDto {
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
  @IsNumber()
  @Min(0)
  base_amount?: number;

  @ApiPropertyOptional({ enum: FeeAssignmentScope })
  @IsOptional()
  @IsEnum(FeeAssignmentScope)
  assignment_scope?: FeeAssignmentScope;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  auto_deduct_enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  auto_deduct_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  due_date?: string;

  @ApiPropertyOptional({ type: [ClassAssignmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassAssignmentDto)
  class_assignments?: ClassAssignmentDto[];

  @ApiPropertyOptional({ type: CreatePaymentPlanDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePaymentPlanDto)
  payment_plan?: CreatePaymentPlanDto;
}

export class FeeQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  academic_session_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  class_id?: string;

  @ApiPropertyOptional({ enum: FeeType })
  @IsOptional()
  @IsEnum(FeeType)
  fee_type?: FeeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

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
