import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import {
  FeeType,
  FeeAssignmentScope,
  StudentFeeStatus,
  PaymentPlanType,
} from '@prisma/client';
import { CreateFeeDto, UpdateFeeDto, FeeQueryDto } from '../dto/fee.dto';

@Injectable()
export class FeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(schoolId: string, userId: string, dto: CreateFeeDto) {
    const session = await this.prisma.academicSession.findFirst({
      where: { id: dto.academic_session_id, school_id: schoolId },
    });
    if (!session) throw new NotFoundException('Academic session not found');

    const fee = await this.prisma.$transaction(async (tx) => {
      const newFee = await tx.fee.create({
        data: {
          school_id: schoolId,
          academic_session_id: dto.academic_session_id,
          name: dto.name,
          description: dto.description,
          fee_type: dto.fee_type,
          base_amount: dto.base_amount,
          assignment_scope: dto.assignment_scope || FeeAssignmentScope.SELECTED_CLASSES,
          is_active: dto.is_active ?? true,
          auto_deduct_enabled: dto.auto_deduct_enabled ?? false,
          auto_deduct_date: dto.auto_deduct_date ? new Date(dto.auto_deduct_date) : null,
          created_by: userId,
        },
      });

      if (dto.payment_plan) {
        const plan = await tx.feePaymentPlan.create({
          data: {
            fee_id: newFee.id,
            plan_type: dto.payment_plan.plan_type,
            max_installments: dto.payment_plan.max_installments,
            allow_partial:
              dto.payment_plan.allow_partial ??
              (dto.payment_plan.plan_type !== PaymentPlanType.ONE_TIME),
          },
        });

        if (
          dto.payment_plan.plan_type === PaymentPlanType.FIXED_INSTALLMENTS &&
          dto.payment_plan.installments?.length
        ) {
          await tx.feeInstallmentSchedule.createMany({
            data: dto.payment_plan.installments.map((inst) => ({
              payment_plan_id: plan.id,
              installment_number: inst.installment_number,
              amount: inst.amount,
              due_date: inst.due_date ? new Date(inst.due_date) : null,
              label: inst.label,
            })),
          });
        }
      } else {
        await tx.feePaymentPlan.create({
          data: {
            fee_id: newFee.id,
            plan_type: PaymentPlanType.ONE_TIME,
            allow_partial: false,
          },
        });
      }

      if (dto.class_assignments?.length) {
        await tx.feeClassAssignment.createMany({
          data: dto.class_assignments.map((ca) => ({
            fee_id: newFee.id,
            class_id: ca.class_id,
            amount_override: ca.amount_override,
          })),
        });

        await this.generateStudentFeeRecords(
          tx,
          newFee.id,
          schoolId,
          dto.academic_session_id,
          dto.class_assignments.map((ca) => ({
            classId: ca.class_id,
            amountOverride: ca.amount_override,
          })),
          newFee.base_amount,
          dto.due_date ? new Date(dto.due_date) : null,
        );
      } else if (dto.assignment_scope === FeeAssignmentScope.ALL_CLASSES) {
        const classes = await tx.class.findMany({
          where: {
            schoolId,
            is_graduates: false,
          },
          select: { id: true },
        });

        if (classes.length) {
          await tx.feeClassAssignment.createMany({
            data: classes.map((c) => ({ fee_id: newFee.id, class_id: c.id })),
          });

          await this.generateStudentFeeRecords(
            tx,
            newFee.id,
            schoolId,
            dto.academic_session_id,
            classes.map((c) => ({ classId: c.id, amountOverride: undefined })),
            newFee.base_amount,
            dto.due_date ? new Date(dto.due_date) : null,
          );
        }
      }

      if (dto.auto_deduct_enabled) {
        await tx.feeAutoDeductionSetting.create({
          data: {
            fee_id: newFee.id,
            enabled: true,
            deduction_date: dto.auto_deduct_date ? new Date(dto.auto_deduct_date) : null,
            created_by: userId,
          },
        });
      }

      return newFee;
    });

    await this.auditService.log({
      auditForType: 'finance_fee_create',
      targetId: fee.id,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { fee_name: dto.name, fee_type: dto.fee_type, base_amount: dto.base_amount },
    });

    const result = await this.prisma.fee.findUnique({
      where: { id: fee.id },
      include: {
        classAssignments: { include: { class: { select: { id: true, name: true } } } },
        paymentPlan: { include: { installmentSchedules: true } },
        _count: { select: { studentFeeRecords: true } },
      },
    });

    return ResponseHelper.created('Fee created successfully', result);
  }

  async findAll(schoolId: string, query: FeeQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: any = { school_id: schoolId };
    if (query.academic_session_id) where.academic_session_id = query.academic_session_id;
    if (query.fee_type) where.fee_type = query.fee_type;
    if (query.status === 'active') where.is_active = true;
    if (query.status === 'inactive') where.is_active = false;
    if (query.class_id) {
      where.classAssignments = { some: { class_id: query.class_id } };
    }

    const [fees, total] = await Promise.all([
      this.prisma.fee.findMany({
        where,
        include: {
          classAssignments: { include: { class: { select: { id: true, name: true } } } },
          paymentPlan: true,
          _count: { select: { studentFeeRecords: true, feePayments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.fee.count({ where }),
    ]);

    return ResponseHelper.success('Fees fetched successfully', fees, paginationMeta(total, page, limit));
  }

  async findOne(schoolId: string, feeId: string) {
    const fee = await this.prisma.fee.findFirst({
      where: { id: feeId, school_id: schoolId },
      include: {
        classAssignments: { include: { class: { select: { id: true, name: true } } } },
        paymentPlan: { include: { installmentSchedules: true } },
        penaltyRule: true,
        autoDeductionSetting: true,
        _count: { select: { studentFeeRecords: true, feePayments: true } },
      },
    });
    if (!fee) throw new NotFoundException('Fee not found');

    const statusCounts = await this.prisma.studentFeeRecord.groupBy({
      by: ['status'],
      where: { fee_id: feeId, school_id: schoolId },
      _count: true,
    });

    return ResponseHelper.success('Fee fetched successfully', { ...fee, statusCounts });
  }

  async update(schoolId: string, feeId: string, userId: string, dto: UpdateFeeDto) {
    const existing = await this.prisma.fee.findFirst({
      where: { id: feeId, school_id: schoolId },
    });
    if (!existing) throw new NotFoundException('Fee not found');

    if (dto.is_active === false && existing.fee_type === FeeType.SCHOOL_FEE) {
      throw new ForbiddenException('School fee cannot be deactivated');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const fee = await tx.fee.update({
        where: { id: feeId },
        data: {
          name: dto.name,
          description: dto.description,
          base_amount: dto.base_amount,
          assignment_scope: dto.assignment_scope,
          is_active: dto.is_active,
          auto_deduct_enabled: dto.auto_deduct_enabled,
          auto_deduct_date: dto.auto_deduct_date ? new Date(dto.auto_deduct_date) : undefined,
        },
      });

      if (dto.payment_plan) {
        await tx.feeInstallmentSchedule.deleteMany({
          where: { paymentPlan: { fee_id: feeId } },
        });
        await tx.feePaymentPlan.deleteMany({ where: { fee_id: feeId } });

        const plan = await tx.feePaymentPlan.create({
          data: {
            fee_id: feeId,
            plan_type: dto.payment_plan.plan_type,
            max_installments: dto.payment_plan.max_installments,
            allow_partial:
              dto.payment_plan.allow_partial ??
              (dto.payment_plan.plan_type !== PaymentPlanType.ONE_TIME),
          },
        });

        if (
          dto.payment_plan.plan_type === PaymentPlanType.FIXED_INSTALLMENTS &&
          dto.payment_plan.installments?.length
        ) {
          await tx.feeInstallmentSchedule.createMany({
            data: dto.payment_plan.installments.map((inst) => ({
              payment_plan_id: plan.id,
              installment_number: inst.installment_number,
              amount: inst.amount,
              due_date: inst.due_date ? new Date(inst.due_date) : null,
              label: inst.label,
            })),
          });
        }
      }

      if (dto.class_assignments) {
        const existingAssignments = await tx.feeClassAssignment.findMany({
          where: { fee_id: feeId },
        });
        const existingClassIds = existingAssignments.map((a) => a.class_id);
        const newClassIds = dto.class_assignments.map((a) => a.class_id);

        const toRemove = existingClassIds.filter((id) => !newClassIds.includes(id));
        if (toRemove.length) {
          await tx.studentFeeRecord.updateMany({
            where: { fee_id: feeId, class_id: { in: toRemove }, is_completed: false },
            data: { status: StudentFeeStatus.WAIVED },
          });
          await tx.feeClassAssignment.deleteMany({
            where: { fee_id: feeId, class_id: { in: toRemove } },
          });
        }

        const toAdd = dto.class_assignments.filter((a) => !existingClassIds.includes(a.class_id));
        if (toAdd.length) {
          await tx.feeClassAssignment.createMany({
            data: toAdd.map((a) => ({
              fee_id: feeId,
              class_id: a.class_id,
              amount_override: a.amount_override,
            })),
          });
          await this.generateStudentFeeRecords(
            tx,
            feeId,
            schoolId,
            fee.academic_session_id,
            toAdd.map((a) => ({ classId: a.class_id, amountOverride: a.amount_override })),
            fee.base_amount,
            dto.due_date ? new Date(dto.due_date) : null,
          );
        }

        const toUpdate = dto.class_assignments.filter((a) => existingClassIds.includes(a.class_id));
        for (const assignment of toUpdate) {
          await tx.feeClassAssignment.updateMany({
            where: { fee_id: feeId, class_id: assignment.class_id },
            data: { amount_override: assignment.amount_override },
          });
        }
      }

      return fee;
    });

    await this.auditService.log({
      auditForType: 'finance_fee_update',
      targetId: feeId,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { changes: JSON.parse(JSON.stringify(dto)) },
    });

    return ResponseHelper.success('Fee updated successfully', updated);
  }

  async delete(schoolId: string, feeId: string, userId: string) {
    const fee = await this.prisma.fee.findFirst({
      where: { id: feeId, school_id: schoolId },
      include: { _count: { select: { feePayments: true } } },
    });
    if (!fee) throw new NotFoundException('Fee not found');

    if (fee.fee_type === FeeType.SCHOOL_FEE) {
      throw new ForbiddenException('School fee cannot be deleted');
    }

    const confirmedPayments = await this.prisma.feePayment.count({
      where: { fee_id: feeId, status: 'CONFIRMED' },
    });

    if (confirmedPayments > 0) {
      await this.prisma.fee.update({ where: { id: feeId }, data: { is_active: false } });

      await this.auditService.log({
        auditForType: 'finance_fee_delete',
        targetId: feeId,
        schoolId,
        performedById: userId,
        performedByType: 'school_user',
        metadata: { action: 'deactivated', reason: 'has confirmed payments' },
      });

      return ResponseHelper.success(
        'Fee has confirmed payments and cannot be deleted. It has been deactivated instead.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.studentFeeRecord.deleteMany({ where: { fee_id: feeId } });
      await tx.feeInstallmentSchedule.deleteMany({ where: { paymentPlan: { fee_id: feeId } } });
      await tx.feePaymentPlan.deleteMany({ where: { fee_id: feeId } });
      await tx.feeClassAssignment.deleteMany({ where: { fee_id: feeId } });
      await tx.feeAutoDeductionSetting.deleteMany({ where: { fee_id: feeId } });
      await tx.fee.delete({ where: { id: feeId } });
    });

    await this.auditService.log({
      auditForType: 'finance_fee_delete',
      targetId: feeId,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { action: 'deleted' },
    });

    return ResponseHelper.success('Fee deleted successfully');
  }

  async getFeeStudents(schoolId: string, feeId: string, query: FeeQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const [records, total] = await Promise.all([
      this.prisma.studentFeeRecord.findMany({
        where: { fee_id: feeId, school_id: schoolId },
        include: {
          student: {
            include: { user: { select: { first_name: true, last_name: true, email: true } } },
          },
          class: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.studentFeeRecord.count({ where: { fee_id: feeId, school_id: schoolId } }),
    ]);

    return ResponseHelper.success('Fee students fetched', records, paginationMeta(total, page, limit));
  }

  async generateStudentFeeRecordsForStudent(
    studentId: string,
    classId: string,
    schoolId: string,
    sessionId: string,
  ) {
    const activeFees = await this.prisma.fee.findMany({
      where: {
        school_id: schoolId,
        academic_session_id: sessionId,
        is_active: true,
        classAssignments: { some: { class_id: classId } },
      },
      include: {
        classAssignments: { where: { class_id: classId } },
      },
    });

    if (!activeFees.length) return;

    const existingRecords = await this.prisma.studentFeeRecord.findMany({
      where: { student_id: studentId, academic_session_id: sessionId },
      select: { fee_id: true },
    });
    const existingFeeIds = new Set(existingRecords.map((r) => r.fee_id));

    const newRecords = activeFees
      .filter((f) => !existingFeeIds.has(f.id))
      .map((f) => {
        const override = f.classAssignments[0]?.amount_override;
        const amount = override ?? f.base_amount;
        return {
          student_id: studentId,
          fee_id: f.id,
          school_id: schoolId,
          academic_session_id: sessionId,
          class_id: classId,
          amount_owed: amount,
          balance: amount,
        };
      });

    if (newRecords.length) {
      await this.prisma.studentFeeRecord.createMany({ data: newRecords });
    }
  }

  private async generateStudentFeeRecords(
    tx: any,
    feeId: string,
    schoolId: string,
    /** Used only if a class row cannot be resolved */
    fallbackSessionId: string,
    classAssignments: { classId: string; amountOverride?: number }[],
    baseAmount: number,
    dueDate: Date | null,
  ) {
    for (const ca of classAssignments) {
      const recordSessionId = fallbackSessionId;

      const students = await tx.student.findMany({
        where: {
          school_id: schoolId,
          current_class_id: ca.classId,
          status: 'active',
        },
        select: { id: true },
      });

      if (!students.length) continue;

      const amount = ca.amountOverride ?? baseAmount;

      const existingRecords = await tx.studentFeeRecord.findMany({
        where: {
          fee_id: feeId,
          student_id: { in: students.map((s) => s.id) },
        },
        select: { student_id: true },
      });
      const existingStudentIds = new Set(existingRecords.map((r) => r.student_id));

      const newRecords = students
        .filter((s) => !existingStudentIds.has(s.id))
        .map((s) => ({
          student_id: s.id,
          fee_id: feeId,
          school_id: schoolId,
          academic_session_id: recordSessionId,
          class_id: ca.classId,
          amount_owed: amount,
          balance: amount,
          due_date: dueDate,
        }));

      if (newRecords.length) {
        await tx.studentFeeRecord.createMany({ data: newRecords });
      }
    }
  }
}
