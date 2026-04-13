import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class WalletAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private db(tx?: TxClient) {
    return tx ?? this.prisma;
  }

  async ensureAnalytics(walletId: string, tx?: TxClient) {
    return this.db(tx).walletAnalytics.upsert({
      where: { wallet_id: walletId },
      create: { wallet_id: walletId },
      update: {},
    });
  }

  async updateOnPaymentConfirmed(
    schoolId: string,
    payment: {
      amount: number;
      payment_method: string;
      fee_id: string;
      class_id: string;
      includes_penalty: boolean;
      penalty_amount: number;
    },
    tx?: TxClient,
  ) {
    const client = this.db(tx);
    const wallet = await client.wallet.findFirstOrThrow({
      where: { owner_id: schoolId, owner_type: 'SCHOOL' },
      select: { id: true },
    });

    const analytics = await this.ensureAnalytics(wallet.id, tx);

    const methodBreakdown = (analytics.payment_method_breakdown as Record<string, number>) ?? {};
    methodBreakdown[payment.payment_method] =
      (methodBreakdown[payment.payment_method] ?? 0) + payment.amount;

    const totalExpected = analytics.total_expected_current_session;
    const newCollectedSession = analytics.total_collected_current_session + payment.amount;
    const newOutstanding = Math.max(0, totalExpected - newCollectedSession);
    const collectionRate = totalExpected > 0 ? (newCollectedSession / totalExpected) * 100 : 0;

    const penaltyUpdate: Prisma.WalletAnalyticsUpdateInput = {};
    if (payment.includes_penalty && payment.penalty_amount > 0) {
      penaltyUpdate.total_penalty_collected_current_session = {
        increment: payment.penalty_amount,
      };
      penaltyUpdate.total_penalty_collected_all_time = {
        increment: payment.penalty_amount,
      };
    }

    await client.walletAnalytics.update({
      where: { wallet_id: wallet.id },
      data: {
        total_collected_all_time: { increment: payment.amount },
        total_collected_current_session: { increment: payment.amount },
        today_collection: { increment: payment.amount },
        this_week_collection: { increment: payment.amount },
        this_month_collection: { increment: payment.amount },
        total_outstanding_current_session: newOutstanding,
        collection_rate_current_session: collectionRate,
        payment_method_breakdown: methodBreakdown,
        last_payment_at: new Date(),
        last_updated_at: new Date(),
        ...penaltyUpdate,
      },
    });
  }

  async updateOnRefund(schoolId: string, amount: number, tx?: TxClient) {
    const client = this.db(tx);
    const wallet = await client.wallet.findFirstOrThrow({
      where: { owner_id: schoolId, owner_type: 'SCHOOL' },
      select: { id: true },
    });

    const analytics = await this.ensureAnalytics(wallet.id, tx);

    const newCollectedSession = Math.max(0, analytics.total_collected_current_session - amount);
    const totalExpected = analytics.total_expected_current_session;
    const collectionRate = totalExpected > 0 ? (newCollectedSession / totalExpected) * 100 : 0;

    await client.walletAnalytics.update({
      where: { wallet_id: wallet.id },
      data: {
        total_refunded_all_time: { increment: amount },
        total_collected_current_session: newCollectedSession,
        total_outstanding_current_session: Math.max(0, totalExpected - newCollectedSession),
        collection_rate_current_session: collectionRate,
        last_updated_at: new Date(),
      },
    });
  }

  async updateOnWaiverApproved(schoolId: string, waivedAmount: number, tx?: TxClient) {
    const client = this.db(tx);
    const wallet = await client.wallet.findFirstOrThrow({
      where: { owner_id: schoolId, owner_type: 'SCHOOL' },
      select: { id: true },
    });

    await this.ensureAnalytics(wallet.id, tx);

    await client.walletAnalytics.update({
      where: { wallet_id: wallet.id },
      data: {
        total_waived_all_time: { increment: waivedAmount },
        total_scholarship_value_current_session: { increment: waivedAmount },
        total_scholarship_beneficiaries_current_session: { increment: 1 },
        last_updated_at: new Date(),
      },
    });
  }

  async updateStudentCounts(schoolId: string, tx?: TxClient) {
    const client = this.db(tx);

    const wallet = await client.wallet.findFirstOrThrow({
      where: { owner_id: schoolId, owner_type: 'SCHOOL' },
      select: { id: true },
    });

    const currentSession = await client.academicSession.findFirst({
      where: { school_id: schoolId, is_current: true },
      select: { id: true },
    });
    if (!currentSession) return;

    const records = await client.studentFeeRecord.groupBy({
      by: ['status'],
      where: {
        school_id: schoolId,
        academic_session_id: currentSession.id,
      },
      _count: { id: true },
    });

    const counts: Record<string, number> = {};
    let total = 0;
    for (const r of records) {
      counts[r.status] = r._count.id;
      total += r._count.id;
    }

    await this.ensureAnalytics(wallet.id, tx);

    await client.walletAnalytics.update({
      where: { wallet_id: wallet.id },
      data: {
        total_students_enrolled: total,
        total_students_paid_full: counts['COMPLETED'] ?? 0,
        total_students_paid_partial: counts['PARTIAL'] ?? 0,
        total_students_unpaid: counts['PENDING'] ?? 0,
        total_students_overdue: counts['OVERDUE'] ?? 0,
        total_students_waived: counts['WAIVED'] ?? 0,
        last_updated_at: new Date(),
      },
    });
  }

  async recalculateFullAnalytics(schoolId: string) {
    const wallet = await this.prisma.wallet.findFirstOrThrow({
      where: { owner_id: schoolId, owner_type: 'SCHOOL' },
      select: { id: true, balance: true },
    });

    const currentSession = await this.prisma.academicSession.findFirst({
      where: { school_id: schoolId, is_current: true },
      select: { id: true },
    });

    const sessionId = currentSession?.id;

    const allTimePayments = await this.prisma.feePayment.aggregate({
      where: { school_id: schoolId, status: 'CONFIRMED' },
      _sum: { amount: true },
    });

    const allTimeRefunds = await this.prisma.refundRequest.aggregate({
      where: { school_id: schoolId, status: 'COMPLETED' },
      _sum: { refund_amount: true },
    });

    const allTimeWaivers = await this.prisma.feeWaiver.aggregate({
      where: { school_id: schoolId, status: 'APPROVED' },
      _sum: { discount_amount: true },
    });

    const allTimePenalties = await this.prisma.feeLatePenalty.aggregate({
      where: { school_id: schoolId, status: { in: ['ACTIVE', 'PAID'] } },
      _sum: { calculated_penalty_amount: true },
    });

    const allTimePenaltiesPaid = await this.prisma.feeLatePenalty.aggregate({
      where: { school_id: schoolId, status: 'PAID' },
      _sum: { calculated_penalty_amount: true },
    });

    let sessionExpected = 0;
    let sessionCollected = 0;
    let sessionOutstanding = 0;
    let studentCounts = {
      total: 0,
      completed: 0,
      partial: 0,
      pending: 0,
      overdue: 0,
      waived: 0,
    };
    let sessionPenaltyCollected = 0;
    let sessionScholarshipValue = 0;
    let sessionScholarshipBeneficiaries = 0;

    if (sessionId) {
      const sessionRecords = await this.prisma.studentFeeRecord.findMany({
        where: { school_id: schoolId, academic_session_id: sessionId },
        select: { amount_owed: true, amount_paid: true, balance: true, status: true },
      });

      for (const r of sessionRecords) {
        sessionExpected += r.amount_owed;
        sessionCollected += r.amount_paid;
        sessionOutstanding += r.balance;
        studentCounts.total++;
        if (r.status === 'COMPLETED') studentCounts.completed++;
        else if (r.status === 'PARTIAL') studentCounts.partial++;
        else if (r.status === 'PENDING') studentCounts.pending++;
        else if (r.status === 'OVERDUE') studentCounts.overdue++;
        else if (r.status === 'WAIVED') studentCounts.waived++;
      }

      const sessionPenalties = await this.prisma.feeLatePenalty.aggregate({
        where: {
          school_id: schoolId,
          status: 'PAID',
          studentFeeRecord: { academic_session_id: sessionId },
        },
        _sum: { calculated_penalty_amount: true },
      });
      sessionPenaltyCollected = sessionPenalties._sum.calculated_penalty_amount ?? 0;

      const sessionWaivers = await this.prisma.feeWaiver.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: sessionId,
          status: 'APPROVED',
        },
        select: { discount_amount: true, student_id: true },
      });
      sessionScholarshipValue = sessionWaivers.reduce((s, w) => s + w.discount_amount, 0);
      sessionScholarshipBeneficiaries = new Set(sessionWaivers.map((w) => w.student_id)).size;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [todayAgg, weekAgg, monthAgg, lastMonthAgg] = await Promise.all([
      this.prisma.feePayment.aggregate({
        where: { school_id: schoolId, status: 'CONFIRMED', createdAt: { gte: startOfToday } },
        _sum: { amount: true },
      }),
      this.prisma.feePayment.aggregate({
        where: { school_id: schoolId, status: 'CONFIRMED', createdAt: { gte: startOfWeek } },
        _sum: { amount: true },
      }),
      this.prisma.feePayment.aggregate({
        where: { school_id: schoolId, status: 'CONFIRMED', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      this.prisma.feePayment.aggregate({
        where: {
          school_id: schoolId,
          status: 'CONFIRMED',
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    const thisMonthVal = monthAgg._sum.amount ?? 0;
    const lastMonthVal = lastMonthAgg._sum.amount ?? 0;
    const momChange = thisMonthVal - lastMonthVal;
    const momGrowth = lastMonthVal > 0 ? (momChange / lastMonthVal) * 100 : 0;

    const methodGroups = await this.prisma.feePayment.groupBy({
      by: ['payment_method'],
      where: { school_id: schoolId, status: 'CONFIRMED' },
      _sum: { amount: true },
    });
    const methodBreakdown: Record<string, number> = {};
    for (const g of methodGroups) {
      methodBreakdown[g.payment_method] = g._sum.amount ?? 0;
    }

    const lastPayment = await this.prisma.feePayment.findFirst({
      where: { school_id: schoolId, status: 'CONFIRMED' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const collectionRate = sessionExpected > 0 ? (sessionCollected / sessionExpected) * 100 : 0;

    await this.prisma.walletAnalytics.upsert({
      where: { wallet_id: wallet.id },
      create: {
        wallet_id: wallet.id,
        current_balance: wallet.balance,
        total_collected_all_time: allTimePayments._sum.amount ?? 0,
        total_refunded_all_time: allTimeRefunds._sum.refund_amount ?? 0,
        total_waived_all_time: allTimeWaivers._sum.discount_amount ?? 0,
        total_expected_current_session: sessionExpected,
        total_collected_current_session: sessionCollected,
        total_outstanding_current_session: sessionOutstanding,
        collection_rate_current_session: collectionRate,
        total_students_enrolled: studentCounts.total,
        total_students_paid_full: studentCounts.completed,
        total_students_paid_partial: studentCounts.partial,
        total_students_unpaid: studentCounts.pending,
        total_students_overdue: studentCounts.overdue,
        total_students_waived: studentCounts.waived,
        today_collection: todayAgg._sum.amount ?? 0,
        this_week_collection: weekAgg._sum.amount ?? 0,
        this_month_collection: thisMonthVal,
        last_month_collection: lastMonthVal,
        month_on_month_change: momChange,
        month_on_month_growth_percent: momGrowth,
        payment_method_breakdown: methodBreakdown,
        total_penalty_collected_current_session: sessionPenaltyCollected,
        total_penalty_collected_all_time: allTimePenalties._sum.calculated_penalty_amount ?? 0,
        total_scholarship_value_current_session: sessionScholarshipValue,
        total_scholarship_beneficiaries_current_session: sessionScholarshipBeneficiaries,
        last_payment_at: lastPayment?.createdAt ?? null,
        last_updated_at: new Date(),
      },
      update: {
        current_balance: wallet.balance,
        total_collected_all_time: allTimePayments._sum.amount ?? 0,
        total_refunded_all_time: allTimeRefunds._sum.refund_amount ?? 0,
        total_waived_all_time: allTimeWaivers._sum.discount_amount ?? 0,
        total_expected_current_session: sessionExpected,
        total_collected_current_session: sessionCollected,
        total_outstanding_current_session: sessionOutstanding,
        collection_rate_current_session: collectionRate,
        total_students_enrolled: studentCounts.total,
        total_students_paid_full: studentCounts.completed,
        total_students_paid_partial: studentCounts.partial,
        total_students_unpaid: studentCounts.pending,
        total_students_overdue: studentCounts.overdue,
        total_students_waived: studentCounts.waived,
        today_collection: todayAgg._sum.amount ?? 0,
        this_week_collection: weekAgg._sum.amount ?? 0,
        this_month_collection: thisMonthVal,
        last_month_collection: lastMonthVal,
        month_on_month_change: momChange,
        month_on_month_growth_percent: momGrowth,
        payment_method_breakdown: methodBreakdown,
        total_penalty_collected_current_session: sessionPenaltyCollected,
        total_penalty_collected_all_time: allTimePenalties._sum.calculated_penalty_amount ?? 0,
        total_scholarship_value_current_session: sessionScholarshipValue,
        total_scholarship_beneficiaries_current_session: sessionScholarshipBeneficiaries,
        last_payment_at: lastPayment?.createdAt ?? null,
        last_updated_at: new Date(),
      },
    });
  }
}
