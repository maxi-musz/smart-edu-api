import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import {
  normalizePagination,
  paginationMeta,
} from '../common/finance-helpers';

@Injectable()
export class AnalyticsReportService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(schoolId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: schoolId, owner_type: 'SCHOOL' },
      include: { walletAnalytics: true },
    });

    if (!wallet?.walletAnalytics) {
      return ResponseHelper.success('Dashboard retrieved', {
        current_balance: 0,
        total_collected_all_time: 0,
        total_expected_current_session: 0,
        total_collected_current_session: 0,
        total_outstanding_current_session: 0,
        collection_rate_current_session: 0,
        total_students_enrolled: 0,
        total_students_paid_full: 0,
        total_students_paid_partial: 0,
        total_students_unpaid: 0,
        total_students_overdue: 0,
        today_collection: 0,
        this_week_collection: 0,
        this_month_collection: 0,
        last_month_collection: 0,
        month_on_month_growth_percent: 0,
      });
    }

    return ResponseHelper.success('Dashboard retrieved', wallet.walletAnalytics);
  }

  async getSessionSummary(
    schoolId: string,
    query: { academic_session_id?: string },
  ) {
    const sessionId = query.academic_session_id ?? await this.resolveCurrentSessionId(schoolId);
    if (!sessionId) {
      return ResponseHelper.error('No active academic session found', null, 404);
    }

    const records = await this.prisma.studentFeeRecord.findMany({
      where: { school_id: schoolId, academic_session_id: sessionId },
      select: {
        amount_owed: true,
        amount_paid: true,
        balance: true,
        status: true,
        is_completed: true,
      },
    });

    const total_expected = records.reduce((s, r) => s + r.amount_owed, 0);
    const total_collected = records.reduce((s, r) => s + r.amount_paid, 0);
    const total_outstanding = records.reduce((s, r) => s + r.balance, 0);

    const statusCounts = { COMPLETED: 0, PARTIAL: 0, PENDING: 0, OVERDUE: 0, WAIVED: 0 };
    for (const r of records) {
      if (r.status in statusCounts) statusCounts[r.status]++;
    }

    return ResponseHelper.success('Session summary retrieved', {
      academic_session_id: sessionId,
      total_expected,
      total_collected,
      total_outstanding,
      collection_rate: total_expected > 0 ? (total_collected / total_expected) * 100 : 0,
      total_students: records.length,
      status_breakdown: statusCounts,
    });
  }

  async getClassBreakdown(
    schoolId: string,
    query: { academic_session_id?: string },
  ) {
    const sessionId = query.academic_session_id ?? await this.resolveCurrentSessionId(schoolId);
    if (!sessionId) {
      return ResponseHelper.error('No active academic session found', null, 404);
    }

    const records = await this.prisma.studentFeeRecord.findMany({
      where: { school_id: schoolId, academic_session_id: sessionId },
      select: {
        class_id: true,
        amount_owed: true,
        amount_paid: true,
        status: true,
      },
      orderBy: { class_id: 'asc' },
    });

    const classMap = new Map<string, {
      class_id: string;
      total_expected: number;
      total_collected: number;
      student_count: number;
      status_counts: Record<string, number>;
    }>();

    for (const r of records) {
      let entry = classMap.get(r.class_id);
      if (!entry) {
        entry = {
          class_id: r.class_id,
          total_expected: 0,
          total_collected: 0,
          student_count: 0,
          status_counts: { COMPLETED: 0, PARTIAL: 0, PENDING: 0, OVERDUE: 0, WAIVED: 0 },
        };
        classMap.set(r.class_id, entry);
      }
      entry.total_expected += r.amount_owed;
      entry.total_collected += r.amount_paid;
      entry.student_count++;
      if (r.status in entry.status_counts) entry.status_counts[r.status]++;
    }

    const breakdown = Array.from(classMap.values()).map((c) => ({
      ...c,
      collection_rate: c.total_expected > 0 ? (c.total_collected / c.total_expected) * 100 : 0,
    }));

    return ResponseHelper.success('Class breakdown retrieved', breakdown);
  }

  async getFeeBreakdown(
    schoolId: string,
    query: { academic_session_id?: string },
  ) {
    const sessionId = query.academic_session_id ?? await this.resolveCurrentSessionId(schoolId);
    if (!sessionId) {
      return ResponseHelper.error('No active academic session found', null, 404);
    }

    const records = await this.prisma.studentFeeRecord.findMany({
      where: { school_id: schoolId, academic_session_id: sessionId },
      select: {
        fee_id: true,
        amount_owed: true,
        amount_paid: true,
        status: true,
        fee: { select: { name: true } },
      },
    });

    const feeMap = new Map<string, {
      fee_id: string;
      fee_name: string;
      total_expected: number;
      total_collected: number;
      paid_count: number;
      unpaid_count: number;
      partial_count: number;
    }>();

    for (const r of records) {
      let entry = feeMap.get(r.fee_id);
      if (!entry) {
        entry = {
          fee_id: r.fee_id,
          fee_name: r.fee.name,
          total_expected: 0,
          total_collected: 0,
          paid_count: 0,
          unpaid_count: 0,
          partial_count: 0,
        };
        feeMap.set(r.fee_id, entry);
      }
      entry.total_expected += r.amount_owed;
      entry.total_collected += r.amount_paid;
      if (r.status === 'COMPLETED') entry.paid_count++;
      else if (r.status === 'PARTIAL') entry.partial_count++;
      else entry.unpaid_count++;
    }

    const breakdown = Array.from(feeMap.values()).map((f) => ({
      ...f,
      collection_rate: f.total_expected > 0 ? (f.total_collected / f.total_expected) * 100 : 0,
    }));

    return ResponseHelper.success('Fee breakdown retrieved', breakdown);
  }

  async getPaymentMethodBreakdown(
    schoolId: string,
    query: { academic_session_id?: string },
  ) {
    const sessionId = query.academic_session_id ?? await this.resolveCurrentSessionId(schoolId);
    if (!sessionId) {
      return ResponseHelper.error('No active academic session found', null, 404);
    }

    const result = await this.prisma.feePayment.groupBy({
      by: ['payment_method'],
      where: {
        school_id: schoolId,
        academic_session_id: sessionId,
        status: 'CONFIRMED',
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    const breakdown = result.map((r) => ({
      method: r.payment_method,
      count: r._count.id,
      total_amount: r._sum.amount ?? 0,
    }));

    return ResponseHelper.success('Payment method breakdown retrieved', breakdown);
  }

  async getOverdueReport(
    schoolId: string,
    query: { page?: number; limit?: number },
  ) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Prisma.StudentFeeRecordWhereInput = {
      school_id: schoolId,
      status: 'OVERDUE',
    };

    const [records, total] = await Promise.all([
      this.prisma.studentFeeRecord.findMany({
        where,
        include: {
          student: {
            include: { user: { select: { first_name: true, last_name: true } } },
          },
          fee: { select: { name: true, base_amount: true } },
          class: { select: { id: true, name: true } },
        },
        orderBy: { due_date: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.studentFeeRecord.count({ where }),
    ]);

    return ResponseHelper.success(
      'Overdue report retrieved',
      records,
      paginationMeta(total, page, limit),
    );
  }

  async getPenaltyReport(schoolId: string) {
    const penalties = await this.prisma.feeLatePenalty.findMany({
      where: { school_id: schoolId },
      select: {
        calculated_penalty_amount: true,
        status: true,
      },
    });

    let total_applied = 0;
    let total_paid = 0;
    let total_waived = 0;
    let total_active = 0;

    for (const p of penalties) {
      if (p.status === 'ACTIVE' || p.status === 'PAID') {
        total_applied += p.calculated_penalty_amount;
      }
      if (p.status === 'PAID') total_paid += p.calculated_penalty_amount;
      if (p.status === 'WAIVED') total_waived += p.calculated_penalty_amount;
      if (p.status === 'ACTIVE') total_active += p.calculated_penalty_amount;
    }

    return ResponseHelper.success('Penalty report retrieved', {
      total_penalties_applied: total_applied,
      total_paid,
      total_waived,
      total_active,
    });
  }

  async getRefundReport(schoolId: string) {
    const refunds = await this.prisma.refundRequest.findMany({
      where: { school_id: schoolId },
      select: {
        refund_amount: true,
        status: true,
        refund_destination: true,
      },
    });

    const byStatus: Record<string, number> = {};
    const byDestination: Record<string, number> = {};
    let totalRefunded = 0;

    for (const r of refunds) {
      byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      byDestination[r.refund_destination] = (byDestination[r.refund_destination] ?? 0) + 1;
      if (r.status === 'COMPLETED') totalRefunded += r.refund_amount;
    }

    return ResponseHelper.success('Refund report retrieved', {
      total_requests: refunds.length,
      by_status: byStatus,
      by_destination: byDestination,
      total_amount_refunded: totalRefunded,
    });
  }

  async getScholarshipReport(
    schoolId: string,
    query: { academic_session_id?: string },
  ) {
    const sessionId = query.academic_session_id ?? await this.resolveCurrentSessionId(schoolId);
    if (!sessionId) {
      return ResponseHelper.error('No active academic session found', null, 404);
    }

    const [scholarships, waivers] = await Promise.all([
      this.prisma.scholarship.findMany({
        where: { school_id: schoolId, academic_session_id: sessionId },
        select: {
          id: true,
          current_beneficiary_count: true,
        },
      }),
      this.prisma.feeWaiver.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: sessionId,
          status: 'APPROVED',
        },
        select: {
          discount_amount: true,
          student_id: true,
        },
      }),
    ]);

    const totalWaivedAmount = waivers.reduce((s, w) => s + w.discount_amount, 0);
    const uniqueBeneficiaries = new Set(waivers.map((w) => w.student_id)).size;

    return ResponseHelper.success('Scholarship report retrieved', {
      total_scholarships: scholarships.length,
      total_waivers_approved: waivers.length,
      total_waived_amount: totalWaivedAmount,
      total_beneficiary_count: uniqueBeneficiaries,
    });
  }

  private async resolveCurrentSessionId(schoolId: string): Promise<string | null> {
    const session = await this.prisma.academicSession.findFirst({
      where: { school_id: schoolId, is_current: true },
      select: { id: true },
    });
    return session?.id ?? null;
  }
}
