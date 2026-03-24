import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PricingPlanCatalogItemDto {
  @ApiProperty({ example: 'clxxx123' })
  id: string;

  @ApiProperty({ example: 'Professional' })
  name: string;

  @ApiProperty({ example: 'PREMIUM', enum: ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE', 'CUSTOM'] })
  plan_type: string;

  @ApiPropertyOptional({
    example: 'Full feature set for growing schools.',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    example: 100000,
    description: 'Monthly price for this tier (per month).',
  })
  cost: number;

  @ApiPropertyOptional({
    example: 1000000,
    nullable: true,
    description:
      'If set, annual billing total for this tier (charge once per year). Null means no yearly option on this row.',
  })
  yearly_cost: number | null;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({
    example: 'MONTHLY',
    enum: ['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME'],
  })
  billing_cycle: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 50 })
  max_allowed_teachers: number;

  @ApiProperty({ example: 500 })
  max_allowed_students: number;

  @ApiPropertyOptional({ example: 20, nullable: true })
  max_allowed_classes: number | null;

  @ApiPropertyOptional({ example: 30, nullable: true })
  max_allowed_subjects: number | null;

  @ApiProperty({ example: ['pdf'], type: [String] })
  allowed_document_types: string[];

  @ApiProperty({ example: 25 })
  max_file_size_mb: number;

  @ApiProperty({ example: 5 })
  max_document_uploads_per_student_per_day: number;

  @ApiProperty({ example: 20 })
  max_document_uploads_per_teacher_per_day: number;

  @ApiProperty({ example: 5000 })
  max_storage_mb: number;

  @ApiProperty({ example: 100 })
  max_files_per_month: number;

  @ApiProperty({ example: 100000 })
  max_daily_tokens_per_user: number;

  @ApiPropertyOptional({ example: 500000, nullable: true })
  max_weekly_tokens_per_user: number | null;

  @ApiPropertyOptional({ example: 2000000, nullable: true })
  max_monthly_tokens_per_user: number | null;

  @ApiPropertyOptional({ example: 10000000, nullable: true })
  max_total_tokens_per_school: number | null;

  @ApiProperty({ example: 200 })
  max_messages_per_week: number;

  @ApiPropertyOptional({ example: 10, nullable: true })
  max_conversations_per_user: number | null;

  @ApiPropertyOptional({ example: 5, nullable: true })
  max_chat_sessions_per_user: number | null;

  @ApiPropertyOptional({
    example: 15,
    nullable: true,
    description:
      'Max assessments with is_published=true at once per school. Null = unlimited.',
  })
  max_concurrent_published_assessments: number | null;

  @ApiPropertyOptional({
    example: 20,
    nullable: true,
    description: 'Max new assessments per school per UTC day. Null = unlimited.',
  })
  max_assessments_created_per_school_day: number | null;

  @ApiPropertyOptional({
    example: 500,
    nullable: true,
    description:
      'Max assessment questions added per school per UTC day. Null = unlimited.',
  })
  max_assessment_questions_added_per_school_day: number | null;

  @ApiPropertyOptional({
    example: 100,
    nullable: true,
    description: 'Max questions per single assessment. Null = unlimited.',
  })
  max_questions_per_assessment: number | null;

  @ApiPropertyOptional({
    example: { ai_chat: true, basic_analytics: true },
    description: 'Opaque feature map; keys are defined by platform admins.',
    nullable: true,
    type: 'object',
    additionalProperties: true,
  })
  features: Record<string, unknown> | null;
}

export class PricingStructureResponseDto {
  @ApiProperty({ type: [PricingPlanCatalogItemDto] })
  plans: PricingPlanCatalogItemDto[];

  @ApiPropertyOptional({
    description: 'Latest template update time (ISO 8601), useful for cache invalidation.',
    example: '2025-03-23T12:00:00.000Z',
  })
  catalog_updated_at?: string;
}
