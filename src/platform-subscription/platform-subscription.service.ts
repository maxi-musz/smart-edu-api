import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentRouterService } from 'src/payment/payment-router.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import {
  generatePaystackReference,
  normalizePagination,
} from 'src/finance/common/finance-helpers';
import {
  PaymentGateway,
  PlatformSubscriptionBillingMode,
  PlatformSubscriptionPaymentStatus,
  Roles,
  SubscriptionPlanType,
  SubscriptionStatus,
  WalletOwnerType,
  WalletTransactionStatus,
  WalletTransactionType,
  WalletType,
} from '@prisma/client';
import { InitiatePlatformSubscriptionDto } from './dto/initiate-platform-subscription.dto';
import { resolvePlatformWalletOwnerId } from './resolve-platform-wallet-owner';
import type { Prisma } from '@prisma/client';

const PLAN_TIER_ORDER: SubscriptionPlanType[] = [
  SubscriptionPlanType.FREE,
  SubscriptionPlanType.BASIC,
  SubscriptionPlanType.PREMIUM,
  SubscriptionPlanType.ENTERPRISE,
  SubscriptionPlanType.CUSTOM,
];

function addMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

function addYears(d: Date, years: number): Date {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + years);
  return x;
}

function planTierIndex(t: SubscriptionPlanType): number {
  const i = PLAN_TIER_ORDER.indexOf(t);
  return i >= 0 ? i : 0;
}

@Injectable()
export class PlatformSubscriptionService {
  private readonly logger = new Logger(PlatformSubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paymentRouter: PaymentRouterService,
  ) {}

  private activeGateway(): PaymentGateway {
    return this.paymentRouter.activeProvider() === 'flutterwave'
      ? PaymentGateway.FLUTTERWAVE
      : PaymentGateway.PAYSTACK;
  }

  async assertDirectorOrAdmin(userId: string): Promise<{
    school_id: string;
    email: string;
    role: Roles;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { school_id: true, email: true, role: true },
    });
    if (!user) throw new ForbiddenException('User not found');
    if (user.role !== Roles.school_director && user.role !== Roles.school_admin) {
      throw new ForbiddenException('Only school directors or admins can manage SMEH subscription');
    }
    return user;
  }

  async getOrCreatePlatformWallet() {
    const configured = (this.configService.get<string>('PLATFORM_WALLET_OWNER_ID') || '').trim();
    const ownerId = await resolvePlatformWalletOwnerId(this.prisma, this.configService);
    if (!configured) {
      this.logger.log(
        `Platform wallet owner resolved from library (PLATFORM_WALLET_OWNER_ID unset), owner_id prefix=${ownerId.slice(0, 8)}…`,
      );
    }
    let wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: ownerId, owner_type: WalletOwnerType.PLATFORM },
    });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          owner_id: ownerId,
          owner_type: WalletOwnerType.PLATFORM,
          wallet_type: WalletType.PLATFORM_WALLET,
          balance: 0,
          currency: 'NGN',
        },
      });
    }
    return wallet;
  }

  /**
   * Apply template limits to the school’s single `PlatformSubscriptionPlan` row.
   * Yearly purchases: `period_end` is one calendar year from `period_start` (same as +12 months for billing window).
   */
  private templateScalarsForSchoolRow(
    template: Prisma.PlatformSubscriptionPlanGetPayload<object>,
    periodStart: Date,
    periodEnd: Date,
  ): Prisma.PlatformSubscriptionPlanUpdateInput {
    return {
      name: template.name,
      plan_type: template.plan_type,
      description: template.description,
      cost: template.cost,
      yearly_cost: template.yearly_cost,
      currency: template.currency,
      billing_cycle: template.billing_cycle,
      is_active: true,
      max_allowed_teachers: template.max_allowed_teachers,
      max_allowed_students: template.max_allowed_students,
      max_allowed_classes: template.max_allowed_classes,
      max_allowed_subjects: template.max_allowed_subjects,
      allowed_document_types: template.allowed_document_types,
      max_file_size_mb: template.max_file_size_mb,
      max_document_uploads_per_student_per_day:
        template.max_document_uploads_per_student_per_day,
      max_document_uploads_per_teacher_per_day:
        template.max_document_uploads_per_teacher_per_day,
      max_storage_mb: template.max_storage_mb,
      max_files_per_month: template.max_files_per_month,
      max_daily_tokens_per_user: template.max_daily_tokens_per_user,
      max_weekly_tokens_per_user: template.max_weekly_tokens_per_user,
      max_monthly_tokens_per_user: template.max_monthly_tokens_per_user,
      max_total_tokens_per_school: template.max_total_tokens_per_school,
      max_messages_per_week: template.max_messages_per_week,
      max_conversations_per_user: template.max_conversations_per_user,
      max_chat_sessions_per_user: template.max_chat_sessions_per_user,
      max_concurrent_published_assessments: template.max_concurrent_published_assessments,
      max_assessments_created_per_school_day: template.max_assessments_created_per_school_day,
      max_assessment_questions_added_per_school_day:
        template.max_assessment_questions_added_per_school_day,
      max_questions_per_assessment: template.max_questions_per_assessment,
      features: template.features === null ? undefined : (template.features as object),
      start_date: periodStart,
      end_date: periodEnd,
      status: SubscriptionStatus.ACTIVE,
      auto_renew: false,
      is_template: false,
    };
  }

  /**
   * Idempotent: if already CONFIRMED, no-op. Used from verify + webhooks.
   */
  async settlePendingByGatewayReference(
    reference: string,
    amountNairaFromProvider: number,
    gatewayRaw?: unknown,
  ): Promise<void> {
    const payment = await this.prisma.platformSubscriptionPayment.findFirst({
      where: {
        OR: [
          { gateway_reference: reference },
          { paystack_reference: reference },
        ],
      },
      include: { planTemplate: true },
    });
    if (!payment) return;
    if (payment.status === PlatformSubscriptionPaymentStatus.CONFIRMED) return;
    if (payment.status !== PlatformSubscriptionPaymentStatus.PENDING) return;

    if (Math.abs(amountNairaFromProvider - payment.total_amount) > 1) {
      this.logger.warn(
        `Platform subscription amount mismatch for ${reference}: expected ${payment.total_amount}, got ${amountNairaFromProvider}`,
      );
      return;
    }

    await this.applyPurchaseInTransaction(payment.id, gatewayRaw);
  }

  private async applyPurchaseInTransaction(
    paymentId: string,
    gatewayRaw?: unknown,
  ): Promise<void> {
    const payment = await this.prisma.platformSubscriptionPayment.findUnique({
      where: { id: paymentId },
      include: { planTemplate: true },
    });
    if (!payment || payment.status === PlatformSubscriptionPaymentStatus.CONFIRMED) return;
    if (payment.status !== PlatformSubscriptionPaymentStatus.PENDING) return;

    const template = payment.planTemplate;
    if (!template.is_template || template.school_id !== null) {
      throw new BadRequestException('Invalid plan template');
    }

    const platformWalletOuter = await this.getOrCreatePlatformWallet();

    await this.prisma.$transaction(async (tx) => {
      const locked = await tx.platformSubscriptionPayment.findUnique({
        where: { id: paymentId },
      });
      if (!locked || locked.status === PlatformSubscriptionPaymentStatus.CONFIRMED) return;

      await tx.platformSubscriptionPayment.update({
        where: { id: paymentId },
        data: {
          status: PlatformSubscriptionPaymentStatus.CONFIRMED,
          processed_at: new Date(),
          metadata: gatewayRaw !== undefined ? { gateway_raw: gatewayRaw } : undefined,
          paystack_status: 'success',
        },
      });

      const scalars = this.templateScalarsForSchoolRow(
        template,
        payment.period_start,
        payment.period_end,
      );

      await tx.platformSubscriptionPlan.upsert({
        where: { school_id: payment.school_id },
        create: {
          school_id: payment.school_id,
          name: template.name,
          plan_type: template.plan_type,
          description: template.description,
          cost: template.cost,
          yearly_cost: template.yearly_cost,
          currency: template.currency,
          billing_cycle: template.billing_cycle,
          is_active: true,
          max_allowed_teachers: template.max_allowed_teachers,
          max_allowed_students: template.max_allowed_students,
          max_allowed_classes: template.max_allowed_classes,
          max_allowed_subjects: template.max_allowed_subjects,
          allowed_document_types: template.allowed_document_types,
          max_file_size_mb: template.max_file_size_mb,
          max_document_uploads_per_student_per_day:
            template.max_document_uploads_per_student_per_day,
          max_document_uploads_per_teacher_per_day:
            template.max_document_uploads_per_teacher_per_day,
          max_storage_mb: template.max_storage_mb,
          max_files_per_month: template.max_files_per_month,
          max_daily_tokens_per_user: template.max_daily_tokens_per_user,
          max_weekly_tokens_per_user: template.max_weekly_tokens_per_user,
          max_monthly_tokens_per_user: template.max_monthly_tokens_per_user,
          max_total_tokens_per_school: template.max_total_tokens_per_school,
          max_messages_per_week: template.max_messages_per_week,
          max_conversations_per_user: template.max_conversations_per_user,
          max_chat_sessions_per_user: template.max_chat_sessions_per_user,
          max_concurrent_published_assessments:
            template.max_concurrent_published_assessments,
          max_assessments_created_per_school_day:
            template.max_assessments_created_per_school_day,
          max_assessment_questions_added_per_school_day:
            template.max_assessment_questions_added_per_school_day,
          max_questions_per_assessment: template.max_questions_per_assessment,
          features: template.features as object | undefined,
          start_date: payment.period_start,
          end_date: payment.period_end,
          status: SubscriptionStatus.ACTIVE,
          auto_renew: false,
          is_template: false,
        },
        update: scalars,
      });

      const platformWallet = await tx.wallet.findUnique({
        where: { id: platformWalletOuter.id },
      });
      if (!platformWallet) return;

      const balanceBefore = platformWallet.balance;
      const balanceAfter = balanceBefore + payment.total_amount;

      await tx.wallet.update({
        where: { id: platformWallet.id },
        data: {
          balance: balanceAfter,
          total_funded_all_time: platformWallet.total_funded_all_time + payment.total_amount,
          last_updated: new Date(),
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: platformWallet.id,
          transaction_type: WalletTransactionType.CREDIT,
          amount: payment.total_amount,
          description: `SMEH platform subscription — ${template.name}`,
          status: WalletTransactionStatus.COMPLETED,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          processed_at: new Date(),
          platform_subscription_payment_id: payment.id,
          reference: payment.gateway_reference ?? payment.paystack_reference ?? undefined,
        },
      });

      const now = new Date();
      await tx.platformSubscriptionGlobalStats.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          total_confirmed_revenue: payment.total_amount,
          confirmed_payment_count: 1,
          last_confirmed_payment_at: now,
        },
        update: {
          total_confirmed_revenue: { increment: payment.total_amount },
          confirmed_payment_count: { increment: 1 },
          last_confirmed_payment_at: now,
        },
      });
    });
  }

  private computeQuote(
    template: Prisma.PlatformSubscriptionPlanGetPayload<object>,
    billingMode: PlatformSubscriptionBillingMode,
    monthsInput?: number,
  ): {
    months: number;
    unit_amount: number;
    total_amount: number;
    period_start: Date;
    period_end: Date;
  } {
    const period_start = new Date();
    if (billingMode === PlatformSubscriptionBillingMode.YEARLY) {
      if (template.yearly_cost == null) {
        throw new BadRequestException('This plan has no yearly price configured');
      }
      const period_end = addYears(period_start, 1);
      return {
        months: 12,
        unit_amount: template.yearly_cost,
        total_amount: template.yearly_cost,
        period_start,
        period_end,
      };
    }
    const months = monthsInput ?? 0;
    if (months < 3) {
      throw new BadRequestException('Monthly billing requires at least 3 months');
    }
    const unit_amount = template.cost;
    const total_amount = unit_amount * months;
    const period_end = addMonths(period_start, months);
    return {
      months,
      unit_amount,
      total_amount,
      period_start,
      period_end,
    };
  }

  async initiate(schoolId: string, userId: string, dto: InitiatePlatformSubscriptionDto) {
    const user = await this.assertDirectorOrAdmin(userId);
    if (user.school_id !== schoolId) {
      throw new ForbiddenException('School mismatch');
    }

    const template = await this.prisma.platformSubscriptionPlan.findFirst({
      where: {
        id: dto.template_id,
        school_id: null,
        is_template: true,
        is_active: true,
      },
    });
    if (!template) {
      throw new NotFoundException('Plan template not found or inactive');
    }

    const quote = this.computeQuote(template, dto.billing_mode, dto.months);

    await this.getOrCreatePlatformWallet();

    const reference = generatePaystackReference('PLT');
    const pg = this.activeGateway();
    const isPaystack = pg === PaymentGateway.PAYSTACK;

    const frontend =
      this.configService.get<string>('FRONTEND_URL')?.replace(/\/$/, '') || '';
    const defaultCallback = `${frontend}/admin/subscription`;
    const callbackUrl = dto.callback_url?.trim() || defaultCallback;

    const payment = await this.prisma.platformSubscriptionPayment.create({
      data: {
        school_id: schoolId,
        initiated_by_user_id: userId,
        plan_template_id: template.id,
        billing_mode: dto.billing_mode,
        months: quote.months,
        unit_amount: quote.unit_amount,
        total_amount: quote.total_amount,
        currency: template.currency || 'NGN',
        period_start: quote.period_start,
        period_end: quote.period_end,
        status: PlatformSubscriptionPaymentStatus.PENDING,
        gateway_reference: reference,
        paystack_reference: isPaystack ? reference : null,
        payment_gateway: pg,
      },
    });

    try {
      const init = await this.paymentRouter.initializeWalletOrFeePayment({
        email: user.email,
        amountNaira: quote.total_amount,
        reference,
        callbackUrl,
        metadata: {
          school_id: schoolId,
          payment_purpose: 'PLATFORM_SUBSCRIPTION',
          platform_subscription_payment_id: payment.id,
          template_id: template.id,
        },
      });

      return ResponseHelper.success('Payment initialized', {
        authorization_url: init.authorization_url,
        reference: init.reference,
        payment_id: payment.id,
      });
    } catch (error) {
      await this.prisma.platformSubscriptionPayment.update({
        where: { id: payment.id },
        data: { status: PlatformSubscriptionPaymentStatus.FAILED },
      });
      this.logger.error('Platform subscription gateway init failed', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Payment gateway error',
      );
    }
  }

  async getDashboard(schoolId: string, userId: string) {
    await this.assertDirectorOrAdmin(userId);
    if ((await this.prisma.user.findUnique({ where: { id: userId }, select: { school_id: true } }))
      ?.school_id !== schoolId) {
      throw new ForbiddenException('School mismatch');
    }

    const plan = await this.prisma.platformSubscriptionPlan.findUnique({
      where: { school_id: schoolId },
    });

    const [agg, recent] = await Promise.all([
      this.prisma.platformSubscriptionPayment.aggregate({
        where: {
          school_id: schoolId,
          status: PlatformSubscriptionPaymentStatus.CONFIRMED,
        },
        _sum: { total_amount: true },
        _count: { id: true },
      }),
      this.prisma.platformSubscriptionPayment.findMany({
        where: { school_id: schoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          total_amount: true,
          currency: true,
          status: true,
          billing_mode: true,
          months: true,
          period_start: true,
          period_end: true,
          createdAt: true,
          gateway_reference: true,
        },
      }),
    ]);

    const lastPayment = await this.prisma.platformSubscriptionPayment.findFirst({
      where: {
        school_id: schoolId,
        status: PlatformSubscriptionPaymentStatus.CONFIRMED,
      },
      orderBy: { processed_at: 'desc' },
      select: { processed_at: true, total_amount: true },
    });

    const templates = await this.prisma.platformSubscriptionPlan.findMany({
      where: { school_id: null, is_template: true, is_active: true },
      orderBy: [{ cost: 'asc' }, { name: 'asc' }],
    });

    const currentTier = plan?.plan_type ?? SubscriptionPlanType.FREE;
    const catalog = templates.map((t) => ({
      id: t.id,
      name: t.name,
      plan_type: t.plan_type,
      cost: t.cost,
      yearly_cost: t.yearly_cost,
      currency: t.currency,
      billing_cycle: t.billing_cycle,
      tier_index: planTierIndex(t.plan_type),
      is_upgrade: planTierIndex(t.plan_type) > planTierIndex(currentTier),
      is_current_tier: t.plan_type === currentTier,
    }));

    return ResponseHelper.success('Dashboard', {
      current_plan: plan,
      spend_total_ngn: agg._sum.total_amount ?? 0,
      payment_count: agg._count.id,
      last_payment_at: lastPayment?.processed_at ?? null,
      last_payment_amount: lastPayment?.total_amount ?? null,
      recent_payments: recent,
      catalog_hints: catalog,
    });
  }

  async listPayments(
    schoolId: string,
    userId: string,
    page?: number,
    limit?: number,
  ) {
    await this.assertDirectorOrAdmin(userId);
    if ((await this.prisma.user.findUnique({ where: { id: userId }, select: { school_id: true } }))
      ?.school_id !== schoolId) {
      throw new ForbiddenException('School mismatch');
    }

    const { skip, page: p, limit: l } = normalizePagination(page, limit);
    const where = { school_id: schoolId };

    const [rows, total] = await Promise.all([
      this.prisma.platformSubscriptionPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
        include: {
          planTemplate: { select: { name: true, plan_type: true } },
        },
      }),
      this.prisma.platformSubscriptionPayment.count({ where }),
    ]);

    return ResponseHelper.success('Payments', {
      data: rows,
      meta: {
        total,
        page: p,
        limit: l,
        total_pages: Math.ceil(total / l),
      },
    });
  }
}
