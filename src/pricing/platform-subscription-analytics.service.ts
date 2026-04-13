import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  PlatformSubscriptionPaymentStatus,
  SubscriptionPlanType,
  WalletOwnerType,
} from '@prisma/client';
import { normalizePagination } from 'src/finance/common/finance-helpers';
import { resolvePlatformWalletOwnerId } from 'src/platform-subscription/resolve-platform-wallet-owner';
import { PaystackService } from 'src/finance/services/paystack.service';

export type PlatformSubscriptionPaymentStatusFilter =
  | 'all'
  | PlatformSubscriptionPaymentStatus;

@Injectable()
export class PlatformSubscriptionAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly paystackService: PaystackService,
  ) {}

  private async platformWalletSnapshot() {
    let ownerId: string;
    try {
      ownerId = await resolvePlatformWalletOwnerId(this.prisma, this.config);
    } catch {
      return null;
    }
    const w = await this.prisma.wallet.findFirst({
      where: { owner_id: ownerId, owner_type: WalletOwnerType.PLATFORM },
      select: {
        id: true,
        balance: true,
        total_funded_all_time: true,
        currency: true,
      },
    });
    return w;
  }

  /**
   * Library / super-admin dashboard: platform-wide subscription KPIs.
   * Rollup row is O(1); aggregates cross-check against `PlatformSubscriptionPayment` and platform `Wallet`.
   */
  async getOverview() {
    const totalSchools = await this.prisma.school.count();

    const schoolsByPlan = await this.prisma.platformSubscriptionPlan.groupBy({
      by: ['plan_type'],
      where: {
        school_id: { not: null },
        is_template: false,
      },
      _count: { _all: true },
    });

    const schoolsByPlanType: Partial<Record<SubscriptionPlanType, number>> = {};
    let sumPlanRows = 0;
    for (const row of schoolsByPlan) {
      schoolsByPlanType[row.plan_type] = row._count._all;
      sumPlanRows += row._count._all;
    }

    const activeTemplatesCount = await this.prisma.platformSubscriptionPlan.count({
      where: {
        school_id: null,
        is_template: true,
        is_active: true,
      },
    });

    const confirmedAgg = await this.prisma.platformSubscriptionPayment.aggregate({
      where: { status: PlatformSubscriptionPaymentStatus.CONFIRMED },
      _sum: { total_amount: true },
      _count: { id: true },
    });

    const rollup = await this.prisma.platformSubscriptionGlobalStats.findUnique({
      where: { id: 'default' },
    });

    const wallet = await this.platformWalletSnapshot();

    const paymentStatusGroup = await this.prisma.platformSubscriptionPayment.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    const payment_status_counts: Record<string, number> = {
      ALL: 0,
      CONFIRMED: 0,
      PENDING: 0,
      FAILED: 0,
      CANCELLED: 0,
    };
    for (const row of paymentStatusGroup) {
      payment_status_counts[row.status] = row._count._all;
      payment_status_counts.ALL += row._count._all;
    }

    return {
      total_schools: totalSchools,
      schools_with_plan_row: sumPlanRows,
      schools_by_plan_type: schoolsByPlanType,
      active_templates_count: activeTemplatesCount,
      rollup: rollup
        ? {
            total_confirmed_revenue: rollup.total_confirmed_revenue,
            confirmed_payment_count: rollup.confirmed_payment_count,
            last_confirmed_payment_at: rollup.last_confirmed_payment_at,
            updated_at: rollup.updated_at,
          }
        : null,
      confirmed_payments_aggregate: {
        total_amount: confirmedAgg._sum.total_amount ?? 0,
        count: confirmedAgg._count.id,
      },
      platform_wallet: wallet,
      payment_status_counts,
    };
  }

  /**
   * Paginated SMEH subscription payments for library-owner dashboard.
   * @param statusFilter `all` or a specific `PlatformSubscriptionPaymentStatus`.
   */
  async listRecentPayments(
    page?: number,
    limit?: number,
    statusFilter: PlatformSubscriptionPaymentStatusFilter = 'all',
  ) {
    const { skip, page: p, limit: l } = normalizePagination(page, limit);
    const where =
      statusFilter === 'all' || !statusFilter
        ? {}
        : { status: statusFilter as PlatformSubscriptionPaymentStatus };

    const [rows, total] = await Promise.all([
      this.prisma.platformSubscriptionPayment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
        include: {
          school: { select: { id: true, school_name: true, school_code: true } },
          planTemplate: { select: { id: true, name: true, plan_type: true } },
        },
      }),
      this.prisma.platformSubscriptionPayment.count({ where }),
    ]);

    return {
      data: rows,
      meta: {
        total,
        page: p,
        limit: l,
        total_pages: Math.ceil(total / l) || 0,
      },
    };
  }

  /**
   * Re-run provider verification for a pending (or stuck) checkout.
   * Idempotent: if already CONFIRMED, `verifyUnified` does not double-credit (settle only runs for PENDING).
   */
  async reverifyPlatformSubscriptionPayment(paymentId: string) {
    const payment = await this.prisma.platformSubscriptionPayment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status === PlatformSubscriptionPaymentStatus.CONFIRMED) {
      return {
        ok: true,
        skipped: true,
        reason: 'already_confirmed',
        payment_id: payment.id,
      };
    }
    if (payment.status !== PlatformSubscriptionPaymentStatus.PENDING) {
      throw new BadRequestException(
        `Cannot re-verify payment in status ${payment.status}. Only PENDING can be settled via provider.`,
      );
    }
    const reference = payment.gateway_reference ?? payment.paystack_reference;
    if (!reference?.trim()) {
      throw new BadRequestException('Payment has no gateway reference to verify');
    }
    return this.paystackService.verifyUnified(reference.trim());
  }
}
