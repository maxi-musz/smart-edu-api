import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { ReceiptService } from './receipt.service';
import { WalletAnalyticsService } from './wallet-analytics.service';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import {
  FeePaymentStatus,
  FeePaymentType,
  FeePaymentMethod,
  StudentFeeStatus,
  PaymentPlanType,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletOwnerType,
} from '@prisma/client';
import { RecordPaymentDto, PaymentQueryDto } from '../dto/payment.dto';

@Injectable()
export class FeePaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly receiptService: ReceiptService,
    private readonly walletAnalyticsService: WalletAnalyticsService,
  ) {}

  async recordPayment(schoolId: string, userId: string, dto: RecordPaymentDto) {
    const record = await this.prisma.studentFeeRecord.findFirst({
      where: { id: dto.student_fee_record_id, school_id: schoolId },
      include: { fee: { include: { paymentPlan: true } } },
    });
    if (!record) throw new NotFoundException('Student fee record not found');
    if (record.is_completed) throw new BadRequestException('Fee is already fully paid');

    const plan = record.fee.paymentPlan;
    if (plan?.plan_type === PaymentPlanType.ONE_TIME && dto.amount < record.balance) {
      throw new BadRequestException(
        `This fee requires full payment. Outstanding balance: ${record.balance}`,
      );
    }

    if (plan?.plan_type === PaymentPlanType.FIXED_INSTALLMENTS && plan.max_installments) {
      const paidInstallments = await this.prisma.studentInstallmentPayment.count({
        where: { student_fee_record_id: record.id },
      });
      if (paidInstallments >= plan.max_installments) {
        throw new BadRequestException('All installments have been paid');
      }
    }

    const effectiveAmount = Math.min(dto.amount, record.balance);
    const receiptNumber = await this.receiptService.generateReceiptNumber(schoolId);

    const paymentType =
      dto.payment_type ||
      (effectiveAmount >= record.balance
        ? FeePaymentType.FULL
        : dto.installment_number
          ? FeePaymentType.INSTALLMENT
          : FeePaymentType.PARTIAL);

    const result = await this.prisma.$transaction(async (tx) => {
      const currentSession = await tx.academicSession.findFirst({
        where: { school_id: schoolId, is_current: true },
      });

      const payment = await tx.feePayment.create({
        data: {
          student_id: dto.student_id,
          fee_id: dto.fee_id,
          school_id: schoolId,
          academic_session_id: currentSession?.id || record.academic_session_id,
          student_fee_record_id: record.id,
          amount: effectiveAmount,
          payment_method: dto.payment_method,
          payment_type: paymentType,
          status: FeePaymentStatus.CONFIRMED,
          receipt_number: receiptNumber,
          recorded_by: userId,
          installment_number: dto.installment_number,
          processed_at: new Date(),
        },
      });

      const newAmountPaid = record.amount_paid + effectiveAmount;
      const newBalance = record.amount_owed - newAmountPaid;
      const isCompleted = newBalance <= 0;
      const newStatus = isCompleted
        ? StudentFeeStatus.COMPLETED
        : newAmountPaid > 0
          ? StudentFeeStatus.PARTIAL
          : record.status;

      await tx.studentFeeRecord.update({
        where: { id: record.id },
        data: {
          amount_paid: newAmountPaid,
          balance: Math.max(0, newBalance),
          is_completed: isCompleted,
          status: newStatus,
          last_payment_at: new Date(),
        },
      });

      if (dto.installment_number && plan?.plan_type === PaymentPlanType.FIXED_INSTALLMENTS) {
        const schedule = await tx.feeInstallmentSchedule.findFirst({
          where: {
            paymentPlan: { fee_id: dto.fee_id },
            installment_number: dto.installment_number,
          },
        });
        if (schedule) {
          await tx.studentInstallmentPayment.create({
            data: {
              student_fee_record_id: record.id,
              installment_schedule_id: schedule.id,
              fee_payment_id: payment.id,
              student_id: dto.student_id,
              amount_paid: effectiveAmount,
              status: effectiveAmount >= schedule.amount ? 'PAID' : 'PARTIAL',
            },
          });
        }
      }

      const schoolWallet = await tx.wallet.findFirst({
        where: { owner_id: schoolId, owner_type: WalletOwnerType.SCHOOL },
      });

      if (schoolWallet) {
        const balanceBefore = schoolWallet.balance;
        const balanceAfter = balanceBefore + effectiveAmount;

        await tx.wallet.update({
          where: { id: schoolWallet.id },
          data: { balance: balanceAfter, last_updated: new Date() },
        });

        await tx.walletTransaction.create({
          data: {
            wallet_id: schoolWallet.id,
            transaction_type: WalletTransactionType.CREDIT,
            amount: effectiveAmount,
            description: `Fee payment: ${record.fee.name} from student`,
            status: WalletTransactionStatus.COMPLETED,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            payment_id: payment.id,
            recorded_by: userId,
            processed_at: new Date(),
          },
        });

        await this.walletAnalyticsService.updateOnPaymentConfirmed(
          schoolId,
          {
            amount: effectiveAmount,
            payment_method: dto.payment_method,
            fee_id: dto.fee_id,
            class_id: record.class_id,
            includes_penalty: false,
            penalty_amount: 0,
          },
          tx,
        );
      }

      return payment;
    });

    await this.auditService.log({
      auditForType: 'finance_payment_record',
      targetId: result.id,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { amount: effectiveAmount, method: dto.payment_method, fee_id: dto.fee_id },
    });

    return ResponseHelper.created('Payment recorded successfully', result);
  }

  async reversePayment(schoolId: string, paymentId: string, userId: string) {
    const payment = await this.prisma.feePayment.findFirst({
      where: { id: paymentId, school_id: schoolId },
      include: { studentFeeRecord: true },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== FeePaymentStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed payments can be reversed');
    }
    if (payment.payment_method === FeePaymentMethod.PAYSTACK) {
      throw new BadRequestException(
        'Paystack payments must be refunded through the refund workflow',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.feePayment.update({
        where: { id: paymentId },
        data: { status: FeePaymentStatus.REVERSED },
      });

      const record = payment.studentFeeRecord;
      const newAmountPaid = Math.max(0, record.amount_paid - payment.amount);
      const newBalance = record.amount_owed - newAmountPaid;

      let newStatus: StudentFeeStatus = StudentFeeStatus.PENDING;
      if (newAmountPaid > 0) newStatus = StudentFeeStatus.PARTIAL;

      await tx.studentFeeRecord.update({
        where: { id: record.id },
        data: {
          amount_paid: newAmountPaid,
          balance: newBalance,
          is_completed: false,
          status: newStatus,
        },
      });

      const schoolWallet = await tx.wallet.findFirst({
        where: { owner_id: schoolId, owner_type: WalletOwnerType.SCHOOL },
      });

      if (schoolWallet) {
        const balanceBefore = schoolWallet.balance;
        const balanceAfter = balanceBefore - payment.amount;

        await tx.wallet.update({
          where: { id: schoolWallet.id },
          data: { balance: Math.max(0, balanceAfter), last_updated: new Date() },
        });

        await tx.walletTransaction.create({
          data: {
            wallet_id: schoolWallet.id,
            transaction_type: WalletTransactionType.DEBIT,
            amount: payment.amount,
            description: `Payment reversal: ${paymentId}`,
            status: WalletTransactionStatus.COMPLETED,
            balance_before: balanceBefore,
            balance_after: Math.max(0, balanceAfter),
            payment_id: paymentId,
            recorded_by: userId,
            processed_at: new Date(),
          },
        });

        await this.walletAnalyticsService.updateOnRefund(schoolId, payment.amount, tx);
      }
    });

    await this.auditService.log({
      auditForType: 'finance_payment_reverse',
      targetId: paymentId,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { amount: payment.amount },
    });

    return ResponseHelper.success('Payment reversed successfully');
  }

  async getPayment(schoolId: string, paymentId: string) {
    const payment = await this.prisma.feePayment.findFirst({
      where: { id: paymentId, school_id: schoolId },
      include: {
        student: { select: { first_name: true, last_name: true, email: true } },
        fee: { select: { id: true, name: true, fee_type: true } },
        studentFeeRecord: { select: { amount_owed: true, amount_paid: true, balance: true, status: true } },
      },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return ResponseHelper.success('Payment fetched', payment);
  }

  async getPayments(schoolId: string, query: PaymentQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: any = { school_id: schoolId };
    if (query.status) where.status = query.status;
    if (query.payment_method) where.payment_method = query.payment_method;
    if (query.student_id) where.student_id = query.student_id;
    if (query.date_from || query.date_to) {
      where.createdAt = {};
      if (query.date_from) where.createdAt.gte = new Date(query.date_from);
      if (query.date_to) where.createdAt.lte = new Date(query.date_to);
    }

    const [payments, total] = await Promise.all([
      this.prisma.feePayment.findMany({
        where,
        include: {
          student: { select: { first_name: true, last_name: true } },
          fee: { select: { name: true, fee_type: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feePayment.count({ where }),
    ]);

    return ResponseHelper.success('Payments fetched', payments, paginationMeta(total, page, limit));
  }
}
