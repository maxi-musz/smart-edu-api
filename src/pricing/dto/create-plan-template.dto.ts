import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  BillingCycle,
  SubscriptionPlanType,
  SubscriptionStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreatePlanTemplateDto {
  @ApiProperty({ example: 'Professional', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ enum: SubscriptionPlanType, example: 'PREMIUM' })
  @IsOptional()
  @IsEnum(SubscriptionPlanType)
  plan_type?: SubscriptionPlanType;

  @ApiPropertyOptional({ example: 'For growing schools.', nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    example: 100000,
    description:
      'Monthly price. Checkout uses this when the school chooses monthly billing.',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({
    example: 1000000,
    nullable: true,
    description:
      'Total for one year when the school chooses yearly billing (e.g. less than 12×monthly). Omit or null for monthly-only.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsNumber()
  @Min(0)
  yearly_cost?: number | null;

  @ApiPropertyOptional({ example: 'NGN' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ enum: BillingCycle })
  @IsOptional()
  @IsEnum(BillingCycle)
  billing_cycle?: BillingCycle;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_allowed_teachers?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_allowed_students?: number;

  @ApiPropertyOptional({ example: 40, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_allowed_classes?: number | null;

  @ApiPropertyOptional({ example: 60, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_allowed_subjects?: number | null;

  @ApiPropertyOptional({ example: ['pdf', 'docx'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_document_types?: string[];

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_file_size_mb?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_document_uploads_per_student_per_day?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_document_uploads_per_teacher_per_day?: number;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_storage_mb?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_files_per_month?: number;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_daily_tokens_per_user?: number;

  @ApiPropertyOptional({ example: 500000, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_weekly_tokens_per_user?: number | null;

  @ApiPropertyOptional({ example: 2000000, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_monthly_tokens_per_user?: number | null;

  @ApiPropertyOptional({ example: 10000000, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_total_tokens_per_school?: number | null;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_messages_per_week?: number;

  @ApiPropertyOptional({ example: 10, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_conversations_per_user?: number | null;

  @ApiPropertyOptional({ example: 5, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  max_chat_sessions_per_user?: number | null;

  @ApiPropertyOptional({
    example: 15,
    nullable: true,
    description:
      'Max assessments with is_published=true at the same time per school. Omit or null for unlimited.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsInt()
  @Min(1)
  max_concurrent_published_assessments?: number | null;

  @ApiPropertyOptional({
    example: 20,
    nullable: true,
    description:
      'Max new assessments created per school per UTC day. Omit or null for unlimited.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsInt()
  @Min(1)
  max_assessments_created_per_school_day?: number | null;

  @ApiPropertyOptional({
    example: 500,
    nullable: true,
    description:
      'Max assessment questions added per school per UTC day (all assessments). Omit or null for unlimited.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsInt()
  @Min(1)
  max_assessment_questions_added_per_school_day?: number | null;

  @ApiPropertyOptional({
    example: 100,
    nullable: true,
    description:
      'Max questions on a single assessment. Omit or null for unlimited.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v != null)
  @IsInt()
  @Min(1)
  max_questions_per_assessment?: number | null;

  @ApiPropertyOptional({
    example: { ai_chat: true, library_hls: true },
    description: 'Admin-defined feature map (JSON object).',
  })
  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  auto_renew?: boolean;
}
