import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import { resolveFinanceStudentRowId } from '../common/resolve-student-id';

@Injectable()
export class StudentFeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentFees(schoolId: string, studentId: string, query: { academic_session_id?: string; status?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const studentRowId = await resolveFinanceStudentRowId(this.prisma, schoolId, studentId);
    if (!studentRowId) {
      return ResponseHelper.success('Student fees fetched', [], paginationMeta(0, page, limit));
    }

    let sessionId = query.academic_session_id;
    if (!sessionId) {
      const current = await this.prisma.academicSession.findFirst({
        where: { school_id: schoolId, is_current: true },
      });
      sessionId = current?.id;
    }

    const where: any = { school_id: schoolId, student_id: studentRowId };
    // Fee rows may use any session row for the school year; include all term rows for that year.
    if (sessionId) {
      const sess = await this.prisma.academicSession.findFirst({
        where: { id: sessionId, school_id: schoolId },
        select: { academic_year: true },
      });
      if (sess?.academic_year) {
        const sameYearSessions = await this.prisma.academicSession.findMany({
          where: { school_id: schoolId, academic_year: sess.academic_year },
          select: { id: true },
        });
        const ids = sameYearSessions.map((s) => s.id);
        if (ids.length) where.academic_session_id = { in: ids };
        else where.academic_session_id = sessionId;
      } else {
        where.academic_session_id = sessionId;
      }
    }
    if (query.status) where.status = query.status;

    const [records, total] = await Promise.all([
      this.prisma.studentFeeRecord.findMany({
        where,
        include: {
          fee: { select: { id: true, name: true, fee_type: true, base_amount: true } },
          class: { select: { id: true, name: true } },
          waivers: { where: { status: 'APPROVED' }, select: { id: true, waiver_type: true, discount_amount: true } },
          _count: { select: { feePayments: true, penalties: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.studentFeeRecord.count({ where }),
    ]);

    return ResponseHelper.success('Student fees fetched', records, paginationMeta(total, page, limit));
  }

  async getStudentFeeDetail(schoolId: string, studentId: string, feeId: string) {
    const studentRowId = await resolveFinanceStudentRowId(this.prisma, schoolId, studentId);
    if (!studentRowId) throw new NotFoundException('Student fee record not found');

    const record = await this.prisma.studentFeeRecord.findFirst({
      where: { school_id: schoolId, student_id: studentRowId, fee_id: feeId },
      include: {
        fee: {
          include: {
            paymentPlan: { include: { installmentSchedules: true } },
          },
        },
        class: { select: { id: true, name: true } },
        feePayments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            amount: true,
            payment_method: true,
            payment_type: true,
            status: true,
            receipt_number: true,
            installment_number: true,
            createdAt: true,
          },
        },
        installmentPayments: {
          include: { installmentSchedule: true },
          orderBy: { paid_at: 'desc' },
        },
        waivers: { orderBy: { createdAt: 'desc' } },
        penalties: { orderBy: { applied_at: 'desc' } },
      },
    });

    if (!record) throw new NotFoundException('Student fee record not found');

    return ResponseHelper.success('Student fee detail fetched', record);
  }

  async getClassFees(schoolId: string, classId: string, query: { academic_session_id?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    let sessionId = query.academic_session_id;
    if (!sessionId) {
      const current = await this.prisma.academicSession.findFirst({
        where: { school_id: schoolId, is_current: true },
      });
      sessionId = current?.id;
    }

    const where: any = { school_id: schoolId, class_id: classId };
    if (sessionId) where.academic_session_id = sessionId;

    const [records, total] = await Promise.all([
      this.prisma.studentFeeRecord.findMany({
        where,
        include: {
          student: {
            include: { user: { select: { first_name: true, last_name: true } } },
          },
          fee: { select: { id: true, name: true, fee_type: true } },
        },
        orderBy: [{ fee_id: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.studentFeeRecord.count({ where }),
    ]);

    return ResponseHelper.success('Class fees fetched', records, paginationMeta(total, page, limit));
  }
}
