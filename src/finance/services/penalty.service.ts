import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import { resolveFinanceStudentRowId } from '../common/resolve-student-id';
import { PenaltyStatus, PenaltyType, StudentFeeStatus } from '@prisma/client';
import { CreatePenaltyRuleDto, UpdatePenaltyRuleDto, PenaltyQueryDto } from '../dto/penalty.dto';

@Injectable()
export class PenaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async createRule(schoolId: string, feeId: string, userId: string, dto: CreatePenaltyRuleDto) {
    const fee = await this.prisma.fee.findFirst({ where: { id: feeId, school_id: schoolId } });
    if (!fee) throw new NotFoundException('Fee not found');

    const existing = await this.prisma.feePenaltyRule.findUnique({ where: { fee_id: feeId } });
    if (existing) {
      const updated = await this.prisma.feePenaltyRule.update({
        where: { fee_id: feeId },
        data: {
          penalty_type: dto.penalty_type,
          penalty_value: dto.penalty_value,
          grace_period_days: dto.grace_period_days ?? 0,
          recurrence: dto.recurrence,
          max_penalty_amount: dto.max_penalty_amount,
          max_penalty_occurrences: dto.max_penalty_occurrences,
          apply_to_partial_payers: dto.apply_to_partial_payers ?? true,
          is_active: true,
        },
      });
      return ResponseHelper.success('Penalty rule updated', updated);
    }

    const rule = await this.prisma.feePenaltyRule.create({
      data: {
        fee_id: feeId,
        school_id: schoolId,
        penalty_type: dto.penalty_type,
        penalty_value: dto.penalty_value,
        grace_period_days: dto.grace_period_days ?? 0,
        recurrence: dto.recurrence,
        max_penalty_amount: dto.max_penalty_amount,
        max_penalty_occurrences: dto.max_penalty_occurrences,
        apply_to_partial_payers: dto.apply_to_partial_payers ?? true,
        created_by: userId,
      },
    });

    return ResponseHelper.created('Penalty rule created', rule);
  }

  async getRule(schoolId: string, feeId: string) {
    const rule = await this.prisma.feePenaltyRule.findFirst({
      where: { fee_id: feeId, school_id: schoolId },
    });
    if (!rule) throw new NotFoundException('No penalty rule for this fee');
    return ResponseHelper.success('Penalty rule fetched', rule);
  }

  async updateRule(schoolId: string, feeId: string, dto: UpdatePenaltyRuleDto) {
    const rule = await this.prisma.feePenaltyRule.findFirst({
      where: { fee_id: feeId, school_id: schoolId },
    });
    if (!rule) throw new NotFoundException('Penalty rule not found');

    const updated = await this.prisma.feePenaltyRule.update({
      where: { id: rule.id },
      data: { ...dto },
    });

    return ResponseHelper.success('Penalty rule updated', updated);
  }

  async deactivateRule(schoolId: string, feeId: string) {
    const rule = await this.prisma.feePenaltyRule.findFirst({
      where: { fee_id: feeId, school_id: schoolId },
    });
    if (!rule) throw new NotFoundException('Penalty rule not found');

    await this.prisma.feePenaltyRule.update({
      where: { id: rule.id },
      data: { is_active: false },
    });

    return ResponseHelper.success('Penalty rule deactivated');
  }

  async getPenalties(schoolId: string, query: PenaltyQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: any = { school_id: schoolId };
    if (query.status) where.status = query.status;
    if (query.fee_id) where.fee_id = query.fee_id;
    if (query.student_id) where.student_id = query.student_id;
    if (query.date_from || query.date_to) {
      where.applied_at = {};
      if (query.date_from) where.applied_at.gte = new Date(query.date_from);
      if (query.date_to) where.applied_at.lte = new Date(query.date_to);
    }

    const [penalties, total] = await Promise.all([
      this.prisma.feeLatePenalty.findMany({
        where,
        include: {
          student: { include: { user: { select: { first_name: true, last_name: true } } } },
          fee: { select: { name: true } },
          studentFeeRecord: { select: { amount_owed: true, balance: true, status: true } },
        },
        orderBy: { applied_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feeLatePenalty.count({ where }),
    ]);

    return ResponseHelper.success('Penalties fetched', penalties, paginationMeta(total, page, limit));
  }

  async getStudentPenalties(schoolId: string, studentId: string, query: PenaltyQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const studentRowId = await resolveFinanceStudentRowId(this.prisma, schoolId, studentId);
    if (!studentRowId) {
      return ResponseHelper.success('Student penalties fetched', [], paginationMeta(0, page, limit));
    }

    const [penalties, total] = await Promise.all([
      this.prisma.feeLatePenalty.findMany({
        where: { school_id: schoolId, student_id: studentRowId },
        include: { fee: { select: { name: true } } },
        orderBy: { applied_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feeLatePenalty.count({
        where: { school_id: schoolId, student_id: studentRowId },
      }),
    ]);

    return ResponseHelper.success('Student penalties fetched', penalties, paginationMeta(total, page, limit));
  }

  async waivePenalty(schoolId: string, penaltyId: string, userId: string, reason: string) {
    const penalty = await this.prisma.feeLatePenalty.findFirst({
      where: { id: penaltyId, school_id: schoolId },
    });
    if (!penalty) throw new NotFoundException('Penalty not found');
    if (penalty.status !== PenaltyStatus.ACTIVE) {
      throw new BadRequestException('Only active penalties can be waived');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.feeLatePenalty.update({
        where: { id: penaltyId },
        data: {
          status: PenaltyStatus.WAIVED,
          waived_by: userId,
          waived_at: new Date(),
          waiver_reason: reason,
        },
      });

      await tx.studentFeeRecord.update({
        where: { id: penalty.student_fee_record_id },
        data: {
          amount_owed: { decrement: penalty.calculated_penalty_amount },
          balance: { decrement: penalty.calculated_penalty_amount },
        },
      });
    });

    await this.auditService.log({
      auditForType: 'finance_penalty_waived',
      targetId: penaltyId,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { amount: penalty.calculated_penalty_amount, reason },
    });

    return ResponseHelper.success('Penalty waived successfully');
  }
}
