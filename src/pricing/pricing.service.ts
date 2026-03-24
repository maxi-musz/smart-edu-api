import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PricingPlanCatalogItemDto,
  PricingStructureResponseDto,
} from './dto/pricing-structure-response.dto';
import { CreatePlanTemplateDto } from './dto/create-plan-template.dto';
import { UpdatePlanTemplateDto } from './dto/update-plan-template.dto';
import { PlatformSubscriptionPlan, Prisma } from '@prisma/client';
import * as colors from 'colors';

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getPricingStructure(): Promise<PricingStructureResponseDto> {
    this.logger.log(colors.blue('🔍 Getting pricing structure'));
    const templates = await this.prisma.platformSubscriptionPlan.findMany({
      where: {
        school_id: null,
        is_template: true,
        is_active: true,
      },
      orderBy: [{ cost: 'asc' }, { name: 'asc' }],
    });

    const plans = templates.map((row) => this.toCatalogItem(row));

    let catalog_updated_at: string | undefined;
    if (templates.length > 0) {
      const latest = templates.reduce((acc, row) =>
        row.updated_at > acc.updated_at ? row : acc,
      );
      catalog_updated_at = latest.updated_at.toISOString();
    }

    
    return { plans, catalog_updated_at };
  }

  async createPlanTemplate(
    dto: CreatePlanTemplateDto,
  ): Promise<PricingPlanCatalogItemDto> {
    const data = this.mergeTemplateCreateFields(dto);
    const row = await this.prisma.platformSubscriptionPlan.create({
      data: {
        school_id: null,
        is_template: true,
        name: dto.name,
        ...data,
      },
    });
    return this.toCatalogItem(row);
  }

  async updatePlanTemplate(
    id: string,
    dto: UpdatePlanTemplateDto,
  ): Promise<PricingPlanCatalogItemDto> {
    const existing = await this.prisma.platformSubscriptionPlan.findFirst({
      where: { id, school_id: null, is_template: true },
    });
    if (!existing) {
      throw new NotFoundException('Plan template not found');
    }

    const data = this.mergeTemplateUpdateFields(dto);
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const row = await this.prisma.platformSubscriptionPlan.update({
      where: { id },
      data,
    });
    return this.toCatalogItem(row);
  }

  /**
   * Optional fields only; omitted keys keep Prisma schema defaults on create.
   */
  private mergeTemplateCreateFields(
    dto: CreatePlanTemplateDto,
  ): Prisma.PlatformSubscriptionPlanUncheckedCreateInput {
    const data: Prisma.PlatformSubscriptionPlanUncheckedCreateInput = {};
    this.applyTemplateScalarFields(data, dto);
    return data;
  }

  private mergeTemplateUpdateFields(
    dto: UpdatePlanTemplateDto,
  ): Prisma.PlatformSubscriptionPlanUncheckedUpdateInput {
    const data: Prisma.PlatformSubscriptionPlanUncheckedUpdateInput = {};
    this.applyTemplateScalarFields(data, dto);
    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    return data;
  }

  private applyTemplateScalarFields(
    target:
      | Prisma.PlatformSubscriptionPlanUncheckedCreateInput
      | Prisma.PlatformSubscriptionPlanUncheckedUpdateInput,
    dto: CreatePlanTemplateDto | UpdatePlanTemplateDto,
  ): void {
    const set = <K extends keyof Prisma.PlatformSubscriptionPlanUncheckedUpdateInput>(
      key: K,
      value: Prisma.PlatformSubscriptionPlanUncheckedUpdateInput[K] | undefined,
    ) => {
      if (value !== undefined) {
        (target as Record<string, unknown>)[key as string] = value;
      }
    };

    set('plan_type', dto.plan_type);
    set('description', dto.description as string | null | undefined);
    set('cost', dto.cost);
    set('yearly_cost', dto.yearly_cost as number | null | undefined);
    set('currency', dto.currency);
    set('billing_cycle', dto.billing_cycle);
    set('is_active', dto.is_active);
    set('max_allowed_teachers', dto.max_allowed_teachers);
    set('max_allowed_students', dto.max_allowed_students);
    set('max_allowed_classes', dto.max_allowed_classes as number | null | undefined);
    set('max_allowed_subjects', dto.max_allowed_subjects as number | null | undefined);
    set('allowed_document_types', dto.allowed_document_types);
    set('max_file_size_mb', dto.max_file_size_mb);
    set(
      'max_document_uploads_per_student_per_day',
      dto.max_document_uploads_per_student_per_day,
    );
    set(
      'max_document_uploads_per_teacher_per_day',
      dto.max_document_uploads_per_teacher_per_day,
    );
    set('max_storage_mb', dto.max_storage_mb);
    set('max_files_per_month', dto.max_files_per_month);
    set('max_daily_tokens_per_user', dto.max_daily_tokens_per_user);
    set(
      'max_weekly_tokens_per_user',
      dto.max_weekly_tokens_per_user as number | null | undefined,
    );
    set(
      'max_monthly_tokens_per_user',
      dto.max_monthly_tokens_per_user as number | null | undefined,
    );
    set(
      'max_total_tokens_per_school',
      dto.max_total_tokens_per_school as number | null | undefined,
    );
    set('max_messages_per_week', dto.max_messages_per_week);
    set(
      'max_conversations_per_user',
      dto.max_conversations_per_user as number | null | undefined,
    );
    set(
      'max_chat_sessions_per_user',
      dto.max_chat_sessions_per_user as number | null | undefined,
    );
    set(
      'max_concurrent_published_assessments',
      dto.max_concurrent_published_assessments as number | null | undefined,
    );
    set(
      'max_assessments_created_per_school_day',
      dto.max_assessments_created_per_school_day as number | null | undefined,
    );
    set(
      'max_assessment_questions_added_per_school_day',
      dto.max_assessment_questions_added_per_school_day as
        | number
        | null
        | undefined,
    );
    set(
      'max_questions_per_assessment',
      dto.max_questions_per_assessment as number | null | undefined,
    );

    if (dto.features !== undefined) {
      (target as { features?: Prisma.InputJsonValue }).features =
        dto.features as Prisma.InputJsonValue;
    }

    if (dto.start_date !== undefined) {
      set('start_date', new Date(dto.start_date));
    }
    if (dto.end_date !== undefined) {
      set('end_date', new Date(dto.end_date));
    }

    set('status', dto.status);
    set('auto_renew', dto.auto_renew);
  }

  private toCatalogItem(row: PlatformSubscriptionPlan): PricingPlanCatalogItemDto {
    return {
      id: row.id,
      name: row.name,
      plan_type: row.plan_type,
      description: row.description,
      cost: row.cost,
      yearly_cost: row.yearly_cost ?? null,
      currency: row.currency,
      billing_cycle: row.billing_cycle,
      is_active: row.is_active,
      max_allowed_teachers: row.max_allowed_teachers,
      max_allowed_students: row.max_allowed_students,
      max_allowed_classes: row.max_allowed_classes,
      max_allowed_subjects: row.max_allowed_subjects,
      allowed_document_types: row.allowed_document_types,
      max_file_size_mb: row.max_file_size_mb,
      max_document_uploads_per_student_per_day:
        row.max_document_uploads_per_student_per_day,
      max_document_uploads_per_teacher_per_day:
        row.max_document_uploads_per_teacher_per_day,
      max_storage_mb: row.max_storage_mb,
      max_files_per_month: row.max_files_per_month,
      max_daily_tokens_per_user: row.max_daily_tokens_per_user,
      max_weekly_tokens_per_user: row.max_weekly_tokens_per_user,
      max_monthly_tokens_per_user: row.max_monthly_tokens_per_user,
      max_total_tokens_per_school: row.max_total_tokens_per_school,
      max_messages_per_week: row.max_messages_per_week,
      max_conversations_per_user: row.max_conversations_per_user,
      max_chat_sessions_per_user: row.max_chat_sessions_per_user,
      max_concurrent_published_assessments:
        row.max_concurrent_published_assessments,
      max_assessments_created_per_school_day:
        row.max_assessments_created_per_school_day,
      max_assessment_questions_added_per_school_day:
        row.max_assessment_questions_added_per_school_day,
      max_questions_per_assessment: row.max_questions_per_assessment,
      features: this.normalizeFeatures(row.features),
    };
  }

  private normalizeFeatures(
    value: Prisma.JsonValue | null,
  ): Record<string, unknown> | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return null;
  }
}
