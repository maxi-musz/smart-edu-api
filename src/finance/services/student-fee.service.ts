import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import { resolveFinanceStudentRowId } from '../common/resolve-student-id';

@Injectable()
export class StudentFeeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fee rows may use any session row for the school year; include all term rows for that year.
   */
  private async resolveSessionIdsForFeeScope(
    schoolId: string,
    querySessionId?: string,
  ): Promise<string[] | undefined> {
    let sessionId = querySessionId;
    if (!sessionId) {
      const current = await this.prisma.academicSession.findFirst({
        where: { school_id: schoolId, is_current: true },
      });
      sessionId = current?.id;
    }
    if (!sessionId) return undefined;

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
      return ids.length ? ids : [sessionId];
    }
    return [sessionId];
  }

  /**
   * Creates missing StudentFeeRecord rows for active fees that apply to the student's current class.
   * Fee creation only materializes students who were active in that class at creation time; this backfills
   * when students are assigned later or were missed.
   */
  private async ensureStudentFeeRecordsForClass(
    studentId: string,
    classId: string,
    schoolId: string,
    academicSessionIds: string[],
  ): Promise<void> {
    const activeFees = await this.prisma.fee.findMany({
      where: {
        school_id: schoolId,
        academic_session_id: { in: academicSessionIds },
        is_active: true,
        classAssignments: { some: { class_id: classId } },
      },
      include: {
        classAssignments: { where: { class_id: classId } },
      },
    });

    if (!activeFees.length) return;

    const existingRecords = await this.prisma.studentFeeRecord.findMany({
      where: {
        student_id: studentId,
        fee_id: { in: activeFees.map((f) => f.id) },
      },
      select: { fee_id: true, academic_session_id: true },
    });
    const existingKeys = new Set(
      existingRecords.map((r) => `${r.fee_id}\0${r.academic_session_id}`),
    );

    const newRecords = activeFees
      .filter((f) => !existingKeys.has(`${f.id}\0${f.academic_session_id}`))
      .map((f) => {
        const override = f.classAssignments[0]?.amount_override;
        const amount = override ?? f.base_amount;
        return {
          student_id: studentId,
          fee_id: f.id,
          school_id: schoolId,
          academic_session_id: f.academic_session_id,
          class_id: classId,
          amount_owed: amount,
          balance: amount,
        };
      });

    if (newRecords.length) {
      await this.prisma.studentFeeRecord.createMany({
        data: newRecords,
        skipDuplicates: true,
      });
    }
  }

  async getStudentFees(schoolId: string, studentId: string, query: { academic_session_id?: string; status?: string; page?: number; limit?: number }) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const studentRowId = await resolveFinanceStudentRowId(this.prisma, schoolId, studentId);
    if (!studentRowId) {
      return ResponseHelper.success('Student fees fetched', [], paginationMeta(0, page, limit));
    }

    const sessionIds = await this.resolveSessionIdsForFeeScope(schoolId, query.academic_session_id);

    const student = await this.prisma.student.findFirst({
      where: { id: studentRowId, school_id: schoolId },
      select: { current_class_id: true },
    });

    if (student?.current_class_id && sessionIds?.length) {
      await this.ensureStudentFeeRecordsForClass(
        studentRowId,
        student.current_class_id,
        schoolId,
        sessionIds,
      );
    }

    const where: any = { school_id: schoolId, student_id: studentRowId };
    if (sessionIds?.length) {
      where.academic_session_id = { in: sessionIds };
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

    const sessionIds = await this.resolveSessionIdsForFeeScope(schoolId, undefined);
    const student = await this.prisma.student.findFirst({
      where: { id: studentRowId, school_id: schoolId },
      select: { current_class_id: true },
    });
    if (student?.current_class_id && sessionIds?.length) {
      await this.ensureStudentFeeRecordsForClass(
        studentRowId,
        student.current_class_id,
        schoolId,
        sessionIds,
      );
    }

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
