import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { WalletAnalyticsService } from './wallet-analytics.service';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import { resolveFinanceStudentRowId } from '../common/resolve-student-id';
import {
  WaiverStatus,
  WaiverType,
  DiscountType,
  StudentFeeStatus,
} from '@prisma/client';
import { CreateWaiverDto, WaiverQueryDto } from '../dto/waiver.dto';

@Injectable()
export class WaiverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly walletAnalyticsService: WalletAnalyticsService,
  ) {}

  async create(schoolId: string, userId: string, dto: CreateWaiverDto) {
    const record = await this.prisma.studentFeeRecord.findFirst({
      where: { id: dto.student_fee_record_id, school_id: schoolId },
    });
    if (!record) throw new NotFoundException('Student fee record not found');

    const existingApproved = await this.prisma.feeWaiver.findFirst({
      where: {
        student_fee_record_id: dto.student_fee_record_id,
        status: WaiverStatus.APPROVED,
      },
    });
    if (existingApproved) {
      throw new BadRequestException('An active approved waiver already exists for this fee record');
    }

    let discountAmount: number;
    let effectiveAmountAfterWaiver: number;

    if (dto.waiver_type === WaiverType.FULL_WAIVER) {
      discountAmount = record.amount_owed;
      effectiveAmountAfterWaiver = 0;
    } else if (dto.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = (record.amount_owed * (dto.discount_value || 0)) / 100;
      effectiveAmountAfterWaiver = record.amount_owed - discountAmount;
    } else {
      discountAmount = dto.discount_value || 0;
      effectiveAmountAfterWaiver = record.amount_owed - discountAmount;
    }

    const currentSession = await this.prisma.academicSession.findFirst({
      where: { school_id: schoolId, is_current: true },
    });

    const waiver = await this.prisma.feeWaiver.create({
      data: {
        student_fee_record_id: dto.student_fee_record_id,
        student_id: dto.student_id,
        fee_id: dto.fee_id,
        school_id: schoolId,
        academic_session_id: currentSession?.id || record.academic_session_id,
        scholarship_id: dto.scholarship_id,
        waiver_type: dto.waiver_type,
        discount_type: dto.waiver_type === WaiverType.FULL_WAIVER ? null : dto.discount_type,
        discount_value: dto.discount_value,
        original_amount_owed: record.amount_owed,
        discount_amount: discountAmount,
        effective_amount_after_waiver: Math.max(0, effectiveAmountAfterWaiver),
        reason: dto.reason,
        requested_by: userId,
        status: WaiverStatus.PENDING_APPROVAL,
      },
    });

    return ResponseHelper.created('Waiver request created', waiver);
  }

  async findAll(schoolId: string, query: WaiverQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: any = { school_id: schoolId };
    if (query.status) where.status = query.status;
    if (query.waiver_type) where.waiver_type = query.waiver_type;
    if (query.academic_session_id) where.academic_session_id = query.academic_session_id;
    if (query.student_id) where.student_id = query.student_id;
    if (query.fee_id) where.fee_id = query.fee_id;

    const [waivers, total] = await Promise.all([
      this.prisma.feeWaiver.findMany({
        where,
        include: {
          student: { include: { user: { select: { first_name: true, last_name: true } } } },
          fee: { select: { name: true, fee_type: true } },
          scholarship: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feeWaiver.count({ where }),
    ]);

    return ResponseHelper.success('Waivers fetched', waivers, paginationMeta(total, page, limit));
  }

  async getStudentWaivers(schoolId: string, studentId: string, query: WaiverQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const studentRowId = await resolveFinanceStudentRowId(this.prisma, schoolId, studentId);
    if (!studentRowId) {
      return ResponseHelper.success('Student waivers fetched', [], paginationMeta(0, page, limit));
    }

    const where: any = { school_id: schoolId, student_id: studentRowId };
    if (query.status) where.status = query.status;

    const [waivers, total] = await Promise.all([
      this.prisma.feeWaiver.findMany({
        where,
        include: { fee: { select: { name: true, fee_type: true } }, scholarship: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feeWaiver.count({ where }),
    ]);

    return ResponseHelper.success('Student waivers fetched', waivers, paginationMeta(total, page, limit));
  }

  async approve(schoolId: string, waiverId: string, userId: string) {
    const waiver = await this.prisma.feeWaiver.findFirst({
      where: { id: waiverId, school_id: schoolId },
    });
    if (!waiver) throw new NotFoundException('Waiver not found');
    if (waiver.status !== WaiverStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending waivers can be approved');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.feeWaiver.update({
        where: { id: waiverId },
        data: { status: WaiverStatus.APPROVED, approved_by: userId, approved_at: new Date() },
      });

      const updateData: any = {
        amount_owed: waiver.effective_amount_after_waiver,
        balance: waiver.effective_amount_after_waiver - (await tx.studentFeeRecord.findUnique({
          where: { id: waiver.student_fee_record_id },
          select: { amount_paid: true },
        }).then((r) => r?.amount_paid || 0)),
        waiver_id: waiverId,
      };

      if (waiver.waiver_type === WaiverType.FULL_WAIVER) {
        updateData.status = StudentFeeStatus.WAIVED;
        updateData.is_completed = true;
        updateData.balance = 0;
      } else {
        const rec = await tx.studentFeeRecord.findUnique({
          where: { id: waiver.student_fee_record_id },
        });
        if (rec && rec.amount_paid >= waiver.effective_amount_after_waiver) {
          updateData.status = StudentFeeStatus.COMPLETED;
          updateData.is_completed = true;
          updateData.balance = 0;
        }
      }

      await tx.studentFeeRecord.update({
        where: { id: waiver.student_fee_record_id },
        data: updateData,
      });

      if (waiver.scholarship_id) {
        await tx.scholarship.update({
          where: { id: waiver.scholarship_id },
          data: { current_beneficiary_count: { increment: 1 } },
        });
      }

      await this.walletAnalyticsService.updateOnWaiverApproved(
        schoolId,
        waiver.discount_amount,
        tx,
      );
    });

    await this.auditService.log({
      auditForType: 'finance_waiver_apply',
      targetId: waiverId,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { waiver_type: waiver.waiver_type, discount_amount: waiver.discount_amount },
    });

    return ResponseHelper.success('Waiver approved successfully');
  }

  async reject(schoolId: string, waiverId: string, userId: string, reason: string) {
    const waiver = await this.prisma.feeWaiver.findFirst({
      where: { id: waiverId, school_id: schoolId },
    });
    if (!waiver) throw new NotFoundException('Waiver not found');
    if (waiver.status !== WaiverStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending waivers can be rejected');
    }

    await this.prisma.feeWaiver.update({
      where: { id: waiverId },
      data: {
        status: WaiverStatus.REJECTED,
        rejected_by: userId,
        rejected_at: new Date(),
        rejection_reason: reason,
      },
    });

    return ResponseHelper.success('Waiver rejected');
  }

  async revoke(schoolId: string, waiverId: string, userId: string, reason: string) {
    const waiver = await this.prisma.feeWaiver.findFirst({
      where: { id: waiverId, school_id: schoolId },
      include: { studentFeeRecord: true },
    });
    if (!waiver) throw new NotFoundException('Waiver not found');
    if (waiver.status !== WaiverStatus.APPROVED) {
      throw new BadRequestException('Only approved waivers can be revoked');
    }

    const record = waiver.studentFeeRecord;
    if (record.last_payment_at && waiver.approved_at && record.last_payment_at > waiver.approved_at) {
      throw new ForbiddenException(
        'Cannot revoke waiver: student has made payments after waiver approval. Process a refund first.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.feeWaiver.update({
        where: { id: waiverId },
        data: {
          status: WaiverStatus.REVOKED,
          revoked_by: userId,
          revoked_at: new Date(),
          revocation_reason: reason,
        },
      });

      const newBalance = waiver.original_amount_owed - record.amount_paid;

      await tx.studentFeeRecord.update({
        where: { id: record.id },
        data: {
          amount_owed: waiver.original_amount_owed,
          balance: newBalance,
          is_completed: false,
          status: record.amount_paid > 0 ? StudentFeeStatus.PARTIAL : StudentFeeStatus.PENDING,
          waiver_id: null,
        },
      });

      if (waiver.scholarship_id) {
        await tx.scholarship.update({
          where: { id: waiver.scholarship_id },
          data: { current_beneficiary_count: { decrement: 1 } },
        });
      }
    });

    await this.auditService.log({
      auditForType: 'finance_waiver_revoke',
      targetId: waiverId,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { reason },
    });

    return ResponseHelper.success('Waiver revoked successfully');
  }
}
