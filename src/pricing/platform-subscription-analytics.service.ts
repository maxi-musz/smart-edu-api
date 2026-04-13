import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FeePaymentStatus,
  PlatformSubscriptionPaymentStatus,
  Prisma,
  SubscriptionPlanType,
  SubscriptionStatus,
  WalletOwnerType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizePagination } from 'src/finance/common/finance-helpers';
import { resolvePlatformWalletOwnerId } from 'src/platform-subscription/resolve-platform-wallet-owner';
import { PaystackService } from 'src/finance/services/paystack.service';

export type PlatformSubscriptionPaymentStatusFilter =
  | 'all'
  | PlatformSubscriptionPaymentStatus;

/** Active SMEH plan row attached to a school (aligned with subscribers overview + cohort analysis). */
const activeSchoolSubscriptionPlanWhere = {
  school_id: { not: null },
  is_template: false,
  is_active: true,
  status: SubscriptionStatus.ACTIVE,
} satisfies Prisma.PlatformSubscriptionPlanWhereInput;

@Injectable()
export class PlatformSubscriptionAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly paystackService: PaystackService,
  ) {}

  parsePlanTypeParam(raw: string): SubscriptionPlanType {
    const u = raw.trim().toUpperCase();
    const values = Object.values(SubscriptionPlanType) as string[];
    if (!values.includes(u)) {
      throw new BadRequestException(
        `Invalid plan type "${raw}". Expected one of: ${values.join(', ')}`,
      );
    }
    return u as SubscriptionPlanType;
  }

  /** All catalog tiers for plan switcher UIs. */
  availablePlanTypes(): SubscriptionPlanType[] {
    return Object.values(SubscriptionPlanType) as SubscriptionPlanType[];
  }

  private async assertSchoolInActivePlanCohort(
    planType: SubscriptionPlanType,
    schoolId: string,
  ): Promise<void> {
    const row = await this.prisma.platformSubscriptionPlan.findFirst({
      where: {
        school_id: schoolId,
        plan_type: planType,
        is_template: false,
        is_active: true,
        status: SubscriptionStatus.ACTIVE,
      },
      select: { id: true },
    });
    if (!row) {
      throw new NotFoundException(
        'School not found in this active plan cohort',
      );
    }
  }

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
      where: activeSchoolSubscriptionPlanWhere,
      _count: { _all: true },
    });

    const schoolsByPlanType: Partial<Record<SubscriptionPlanType, number>> = {};
    let sumPlanRows = 0;
    for (const row of schoolsByPlan) {
      schoolsByPlanType[row.plan_type] = row._count._all;
      sumPlanRows += row._count._all;
    }

    /** Explicit array so clients always receive a serializable breakdown (some UIs mishandle sparse enum-key objects). */
    const schools_by_plan_breakdown = schoolsByPlan.map((row) => ({
      plan_type: row.plan_type,
      count: row._count._all,
    }));

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
      schools_by_plan_breakdown,
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
   * Per-tier snapshot for plan switcher UIs: cohort size, lifetime confirmed SMEH checkout total,
   * and count of confirmed payment rows (for schools currently on that active plan).
   */
  async getPlanSwitcherSummary() {
    const rows = await this.prisma.platformSubscriptionPlan.findMany({
      where: activeSchoolSubscriptionPlanWhere,
      select: { school_id: true, plan_type: true },
    });

    const schoolIdsByPlan = new Map<SubscriptionPlanType, string[]>();
    for (const pt of this.availablePlanTypes()) {
      schoolIdsByPlan.set(pt, []);
    }
    for (const r of rows) {
      if (!r.school_id) continue;
      const list = schoolIdsByPlan.get(r.plan_type) ?? [];
      list.push(r.school_id);
      schoolIdsByPlan.set(r.plan_type, list);
    }

    const planTypes = this.availablePlanTypes();
    const plans = await Promise.all(
      planTypes.map(async (pt) => {
        const ids = schoolIdsByPlan.get(pt) ?? [];
        if (ids.length === 0) {
          return {
            plan_type: pt,
            school_count: 0,
            confirmed_subscription_total: 0,
            confirmed_payment_count: 0,
          };
        }
        const [sumAgg, paymentCount] = await Promise.all([
          this.prisma.platformSubscriptionPayment.aggregate({
            where: {
              school_id: { in: ids },
              status: PlatformSubscriptionPaymentStatus.CONFIRMED,
            },
            _sum: { total_amount: true },
          }),
          this.prisma.platformSubscriptionPayment.count({
            where: {
              school_id: { in: ids },
              status: PlatformSubscriptionPaymentStatus.CONFIRMED,
            },
          }),
        ]);
        return {
          plan_type: pt,
          school_count: ids.length,
          confirmed_subscription_total: sumAgg._sum.total_amount ?? 0,
          confirmed_payment_count: paymentCount,
        };
      }),
    );

    return { plans };
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

    const schoolIds = [...new Set(rows.map((r) => r.school_id))];
    const subscribedTotals =
      schoolIds.length === 0
        ? []
        : await this.prisma.platformSubscriptionPayment.groupBy({
            by: ['school_id'],
            where: {
              school_id: { in: schoolIds },
              status: PlatformSubscriptionPaymentStatus.CONFIRMED,
            },
            _sum: { total_amount: true },
          });
    const totalBySchool = new Map(
      subscribedTotals.map((s) => [s.school_id, s._sum.total_amount ?? 0]),
    );

    const data = rows.map((row) => ({
      ...row,
      school_total_subscribed_confirmed: totalBySchool.get(row.school_id) ?? 0,
    }));

    return {
      data,
      meta: {
        total,
        page: p,
        limit: l,
        total_pages: Math.ceil(total / l) || 0,
      },
    };
  }

  /**
   * Full cohort analysis for schools on an active SMEH plan tier (library / super-admin).
   */
  async getPlanCohortAnalysis(planTypeParam: string) {
    const planType = this.parsePlanTypeParam(planTypeParam);

    const planRows = await this.prisma.platformSubscriptionPlan.findMany({
      where: {
        plan_type: planType,
        ...activeSchoolSubscriptionPlanWhere,
      },
      include: {
        school: {
          select: {
            id: true,
            school_name: true,
            school_code: true,
            school_email: true,
            school_phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    planRows.sort((a, b) =>
      (a.school?.school_name ?? '').localeCompare(b.school?.school_name ?? ''),
    );

    const schoolIds = planRows
      .map((r) => r.school_id)
      .filter((id): id is string => id != null);

    if (schoolIds.length === 0) {
      return {
        available_plans: this.availablePlanTypes(),
        selected_plan_type: planType,
        school_count: 0,
        cohort_aggregate: {
          total_wallet_balance: 0,
          total_wallet_funded_all_time: 0,
          total_wallet_spent_all_time: 0,
          currency_breakdown: {} as Record<string, number>,
          primary_currency: null as string | null,
          wallet_analytics_rollups: {
            total_collected_all_time: 0,
            total_collected_current_session: 0,
            total_outstanding_current_session: 0,
            total_students_enrolled: 0,
          },
          confirmed_platform_subscription_total: 0,
          confirmed_fee_payment_total: 0,
        },
        schools: [] as unknown[],
      };
    }

    const [
      wallets,
      teacherCounts,
      studentCounts,
      platformTotals,
      feeTotals,
    ] = await Promise.all([
      this.prisma.wallet.findMany({
        where: {
          owner_id: { in: schoolIds },
          owner_type: WalletOwnerType.SCHOOL,
        },
        include: {
          walletAnalytics: {
            select: {
              current_balance: true,
              total_collected_all_time: true,
              total_collected_current_session: true,
              total_outstanding_current_session: true,
              collection_rate_current_session: true,
              total_students_enrolled: true,
              today_collection: true,
              this_month_collection: true,
            },
          },
        },
      }),
      this.prisma.teacher.groupBy({
        by: ['school_id'],
        where: { school_id: { in: schoolIds } },
        _count: { _all: true },
      }),
      this.prisma.student.groupBy({
        by: ['school_id'],
        where: { school_id: { in: schoolIds } },
        _count: { _all: true },
      }),
      this.prisma.platformSubscriptionPayment.groupBy({
        by: ['school_id'],
        where: {
          school_id: { in: schoolIds },
          status: PlatformSubscriptionPaymentStatus.CONFIRMED,
        },
        _sum: { total_amount: true },
      }),
      this.prisma.feePayment.groupBy({
        by: ['school_id'],
        where: {
          school_id: { in: schoolIds },
          status: FeePaymentStatus.CONFIRMED,
        },
        _sum: { amount: true },
      }),
    ]);

    const teachersBySchool = new Map(
      teacherCounts.map((r) => [r.school_id, r._count._all]),
    );
    const studentsBySchool = new Map(
      studentCounts.map((r) => [r.school_id, r._count._all]),
    );
    const platformBySchool = new Map(
      platformTotals.map((r) => [
        r.school_id,
        r._sum.total_amount ?? 0,
      ]),
    );
    const feeBySchool = new Map(
      feeTotals.map((r) => [r.school_id, r._sum.amount ?? 0]),
    );
    const walletBySchoolId = new Map(wallets.map((w) => [w.owner_id, w]));

    const currencyTally: Record<string, number> = {};
    let totalBal = 0;
    let totalFunded = 0;
    let totalSpent = 0;
    let analyticsCollectedAll = 0;
    let analyticsCollectedSession = 0;
    let analyticsOutstanding = 0;
    let analyticsStudentsEnrolled = 0;
    let platformSum = 0;
    let feeSum = 0;

    for (const w of wallets) {
      totalBal += w.balance;
      totalFunded += w.total_funded_all_time;
      totalSpent += w.total_spent_all_time;
      const c = w.currency ?? 'NGN';
      currencyTally[c] = (currencyTally[c] ?? 0) + w.balance;
      const wa = w.walletAnalytics;
      if (wa) {
        analyticsCollectedAll += wa.total_collected_all_time;
        analyticsCollectedSession += wa.total_collected_current_session;
        analyticsOutstanding += wa.total_outstanding_current_session;
        analyticsStudentsEnrolled += wa.total_students_enrolled;
      }
    }

    for (const [, v] of platformBySchool) platformSum += v;
    for (const [, v] of feeBySchool) feeSum += v;

    let primary_currency: string | null = null;
    let best = -1;
    for (const [cur, amt] of Object.entries(currencyTally)) {
      if (amt > best) {
        best = amt;
        primary_currency = cur;
      }
    }

    const schools = planRows.map((row) => {
      const sid = row.school_id!;
      const school = row.school!;
      const wallet = walletBySchoolId.get(sid);
      return {
        school: {
          id: school.id,
          school_name: school.school_name,
          school_code: school.school_code,
          school_email: school.school_email,
          school_phone: school.school_phone,
          status: school.status,
          createdAt: school.createdAt,
        },
        subscription: {
          id: row.id,
          name: row.name,
          plan_type: row.plan_type,
          cost: row.cost,
          currency: row.currency,
          billing_cycle: row.billing_cycle,
          is_active: row.is_active,
          status: row.status,
          start_date: row.start_date,
          end_date: row.end_date,
          max_allowed_teachers: row.max_allowed_teachers,
          max_allowed_students: row.max_allowed_students,
        },
        counts: {
          teachers: teachersBySchool.get(sid) ?? 0,
          students: studentsBySchool.get(sid) ?? 0,
        },
        wallet: wallet
          ? {
              id: wallet.id,
              balance: wallet.balance,
              currency: wallet.currency,
              total_funded_all_time: wallet.total_funded_all_time,
              total_spent_all_time: wallet.total_spent_all_time,
              walletAnalytics: wallet.walletAnalytics,
            }
          : null,
        totals: {
          confirmed_platform_subscription:
            platformBySchool.get(sid) ?? 0,
          confirmed_fee_payments: feeBySchool.get(sid) ?? 0,
        },
      };
    });

    return {
      available_plans: this.availablePlanTypes(),
      selected_plan_type: planType,
      school_count: schools.length,
      cohort_aggregate: {
        total_wallet_balance: totalBal,
        total_wallet_funded_all_time: totalFunded,
        total_wallet_spent_all_time: totalSpent,
        currency_breakdown: currencyTally,
        primary_currency,
        wallet_analytics_rollups: {
          total_collected_all_time: analyticsCollectedAll,
          total_collected_current_session: analyticsCollectedSession,
          total_outstanding_current_session: analyticsOutstanding,
          total_students_enrolled: analyticsStudentsEnrolled,
        },
        confirmed_platform_subscription_total: platformSum,
        confirmed_fee_payment_total: feeSum,
      },
      schools,
    };
  }

  async listCohortSchoolTeachers(
    planTypeParam: string,
    schoolId: string,
    page?: number,
    limit?: number,
    search?: string,
  ) {
    const planType = this.parsePlanTypeParam(planTypeParam);
    await this.assertSchoolInActivePlanCohort(planType, schoolId);
    const { skip, page: p, limit: l } = normalizePagination(page, limit);
    const q = (search ?? '').trim();

    const where: Prisma.TeacherWhereInput = {
      school_id: schoolId,
      ...(q
        ? {
            OR: [
              { first_name: { contains: q, mode: 'insensitive' } },
              { last_name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { teacher_id: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          teacher_id: true,
          status: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.teacher.count({ where }),
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

  async listCohortSchoolStudents(
    planTypeParam: string,
    schoolId: string,
    page?: number,
    limit?: number,
    search?: string,
  ) {
    const planType = this.parsePlanTypeParam(planTypeParam);
    await this.assertSchoolInActivePlanCohort(planType, schoolId);
    const { skip, page: p, limit: l } = normalizePagination(page, limit);
    const q = (search ?? '').trim();

    const where: Prisma.StudentWhereInput = {
      school_id: schoolId,
      ...(q
        ? {
            OR: [
              { student_id: { contains: q, mode: 'insensitive' } },
              { admission_number: { contains: q, mode: 'insensitive' } },
              {
                user: {
                  OR: [
                    { first_name: { contains: q, mode: 'insensitive' } },
                    { last_name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        select: {
          id: true,
          student_id: true,
          admission_number: true,
          current_class_id: true,
          status: true,
          admission_date: true,
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { admission_date: 'desc' },
        skip,
        take: l,
      }),
      this.prisma.student.count({ where }),
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

  async listCohortSchoolPlatformPayments(
    planTypeParam: string,
    schoolId: string,
    page?: number,
    limit?: number,
  ) {
    const planType = this.parsePlanTypeParam(planTypeParam);
    await this.assertSchoolInActivePlanCohort(planType, schoolId);
    const { skip, page: p, limit: l } = normalizePagination(page, limit);

    const [rows, total] = await Promise.all([
      this.prisma.platformSubscriptionPayment.findMany({
        where: { school_id: schoolId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
        include: {
          planTemplate: {
            select: { id: true, name: true, plan_type: true },
          },
        },
      }),
      this.prisma.platformSubscriptionPayment.count({
        where: { school_id: schoolId },
      }),
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

  async listCohortSchoolFeePayments(
    planTypeParam: string,
    schoolId: string,
    page?: number,
    limit?: number,
  ) {
    const planType = this.parsePlanTypeParam(planTypeParam);
    await this.assertSchoolInActivePlanCohort(planType, schoolId);
    const { skip, page: p, limit: l } = normalizePagination(page, limit);

    const [rows, total] = await Promise.all([
      this.prisma.feePayment.findMany({
        where: { school_id: schoolId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: l,
        include: {
          fee: { select: { id: true, name: true } },
          student: {
            select: { first_name: true, last_name: true, email: true },
          },
        },
      }),
      this.prisma.feePayment.count({ where: { school_id: schoolId } }),
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
