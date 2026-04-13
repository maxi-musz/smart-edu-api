import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  PlatformSubscriptionPaymentStatus,
  SubscriptionPlanType,
  WalletOwnerType,
} from '@prisma/client';
import { normalizePagination } from 'src/finance/common/finance-helpers';
import { resolvePlatformWalletOwnerId } from 'src/platform-subscription/resolve-platform-wallet-owner';

@Injectable()
export class PlatformSubscriptionAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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
    };
  }

  async listRecentPayments(page?: number, limit?: number) {
    const { skip, page: p, limit: l } = normalizePagination(page, limit);
    const where = { status: PlatformSubscriptionPaymentStatus.CONFIRMED };

    const [rows, total] = await Promise.all([
      this.prisma.platformSubscriptionPayment.findMany({
        where,
        orderBy: { processed_at: 'desc' },
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
        total_pages: Math.ceil(total / l),
      },
    };
  }
}
