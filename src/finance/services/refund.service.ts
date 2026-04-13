import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { PaystackService } from './paystack.service';
import { WalletAnalyticsService } from './wallet-analytics.service';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import { resolveFinanceStudentRowId } from '../common/resolve-student-id';
import {
  RefundStatus,
  RefundDestination,
  FeePaymentStatus,
  StudentFeeStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletOwnerType,
  FeePaymentMethod,
} from '@prisma/client';
import { CreateRefundDto, RefundQueryDto } from '../dto/refund.dto';

@Injectable()
export class RefundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly paystackService: PaystackService,
    private readonly walletAnalyticsService: WalletAnalyticsService,
  ) {}

  async create(schoolId: string, userId: string, dto: CreateRefundDto) {
    const payment = await this.prisma.feePayment.findFirst({
      where: { id: dto.fee_payment_id, school_id: schoolId },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== FeePaymentStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed payments can be refunded');
    }

    if (dto.refund_destination === RefundDestination.PAYSTACK_REVERSAL &&
      payment.payment_method !== FeePaymentMethod.PAYSTACK) {
      throw new BadRequestException('Paystack reversal is only available for Paystack payments');
    }

    const existingRefunds = await this.prisma.refundRequest.aggregate({
      where: { fee_payment_id: dto.fee_payment_id, status: { in: ['APPROVED', 'PROCESSING', 'COMPLETED'] } },
      _sum: { refund_amount: true },
    });
    const totalRefunded = existingRefunds._sum.refund_amount || 0;

    if (totalRefunded + dto.refund_amount > payment.amount) {
      throw new BadRequestException(
        `Refund amount exceeds available refundable amount. Already refunded: ${totalRefunded}, Payment amount: ${payment.amount}`,
      );
    }

    const refund = await this.prisma.refundRequest.create({
      data: {
        school_id: schoolId,
        student_id: dto.student_id,
        fee_payment_id: dto.fee_payment_id,
        student_fee_record_id: dto.student_fee_record_id,
        requested_by: userId,
        reason: dto.reason,
        refund_type: dto.refund_type,
        original_payment_amount: payment.amount,
        refund_amount: dto.refund_amount,
        refund_destination: dto.refund_destination,
        bank_account_details: dto.bank_account_details,
        refund_includes_penalty: dto.refund_includes_penalty ?? false,
        status: RefundStatus.PENDING_APPROVAL,
      },
    });

    await this.auditService.log({
      auditForType: 'finance_refund_request',
      targetId: refund.id,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { amount: dto.refund_amount, destination: dto.refund_destination },
    });

    return ResponseHelper.created('Refund request created', refund);
  }

  async findAll(schoolId: string, query: RefundQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: any = { school_id: schoolId };
    if (query.status) where.status = query.status;
    if (query.student_id) where.student_id = query.student_id;
    if (query.destination) where.refund_destination = query.destination;
    if (query.date_from || query.date_to) {
      where.createdAt = {};
      if (query.date_from) where.createdAt.gte = new Date(query.date_from);
      if (query.date_to) where.createdAt.lte = new Date(query.date_to);
    }

    const [refunds, total] = await Promise.all([
      this.prisma.refundRequest.findMany({
        where,
        include: {
          student: { include: { user: { select: { first_name: true, last_name: true } } } },
          feePayment: { select: { fee: { select: { name: true } }, amount: true, payment_method: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.refundRequest.count({ where }),
    ]);

    return ResponseHelper.success('Refunds fetched', refunds, paginationMeta(total, page, limit));
  }

  async findOne(schoolId: string, refundId: string) {
    const refund = await this.prisma.refundRequest.findFirst({
      where: { id: refundId, school_id: schoolId },
      include: {
        student: { include: { user: { select: { first_name: true, last_name: true, email: true } } } },
        feePayment: { include: { fee: true } },
        studentFeeRecord: true,
      },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    return ResponseHelper.success('Refund fetched', refund);
  }

  async approve(schoolId: string, refundId: string, userId: string) {
    const refund = await this.prisma.refundRequest.findFirst({
      where: { id: refundId, school_id: schoolId },
      include: { feePayment: true },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== RefundStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending refunds can be approved');
    }

    await this.prisma.refundRequest.update({
      where: { id: refundId },
      data: { status: RefundStatus.APPROVED, approved_by: userId, approved_at: new Date() },
    });

    if (refund.refund_destination === RefundDestination.STUDENT_WALLET) {
      await this.processStudentWalletRefund(refund, schoolId, userId);
    } else if (refund.refund_destination === RefundDestination.PAYSTACK_REVERSAL) {
      await this.processPaystackRefund(refund);
    } else {
      await this.prisma.refundRequest.update({
        where: { id: refundId },
        data: { status: RefundStatus.PROCESSING },
      });
    }

    await this.auditService.log({
      auditForType: 'finance_refund_approved',
      targetId: refundId,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
    });

    return ResponseHelper.success('Refund approved');
  }

  async reject(schoolId: string, refundId: string, userId: string, reason: string) {
    const refund = await this.prisma.refundRequest.findFirst({
      where: { id: refundId, school_id: schoolId },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== RefundStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending refunds can be rejected');
    }

    await this.prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: RefundStatus.REJECTED,
        rejected_by: userId,
        rejected_at: new Date(),
        rejection_reason: reason,
      },
    });

    return ResponseHelper.success('Refund rejected');
  }

  async markCompleted(schoolId: string, refundId: string, userId: string) {
    const refund = await this.prisma.refundRequest.findFirst({
      where: { id: refundId, school_id: schoolId },
    });
    if (!refund) throw new NotFoundException('Refund not found');
    if (![RefundDestination.BANK_TRANSFER, RefundDestination.CASH].includes(refund.refund_destination as any)) {
      throw new BadRequestException('Only bank transfer or cash refunds can be manually completed');
    }
    if (refund.status !== RefundStatus.PROCESSING && refund.status !== RefundStatus.APPROVED) {
      throw new BadRequestException('Refund must be in APPROVED or PROCESSING status');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.refundRequest.update({
        where: { id: refundId },
        data: { status: RefundStatus.COMPLETED, processed_at: new Date() },
      });

      await this.applyRefundToRecords(tx, refund, schoolId);
    });

    await this.auditService.log({
      auditForType: 'finance_refund_completed',
      targetId: refundId,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
    });

    return ResponseHelper.success('Refund marked as completed');
  }

  async getStudentRefunds(schoolId: string, studentId: string, query: RefundQueryDto) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const studentRowId = await resolveFinanceStudentRowId(this.prisma, schoolId, studentId);
    if (!studentRowId) {
      return ResponseHelper.success('Student refunds fetched', [], paginationMeta(0, page, limit));
    }

    const [refunds, total] = await Promise.all([
      this.prisma.refundRequest.findMany({
        where: { school_id: schoolId, student_id: studentRowId },
        include: { feePayment: { select: { fee: { select: { name: true } }, amount: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.refundRequest.count({ where: { school_id: schoolId, student_id: studentRowId } }),
    ]);

    return ResponseHelper.success('Student refunds fetched', refunds, paginationMeta(total, page, limit));
  }

  async getPaymentRefunds(schoolId: string, paymentId: string) {
    const refunds = await this.prisma.refundRequest.findMany({
      where: { school_id: schoolId, fee_payment_id: paymentId },
      orderBy: { createdAt: 'desc' },
    });
    return ResponseHelper.success('Payment refunds fetched', refunds);
  }

  private async processStudentWalletRefund(refund: any, schoolId: string, userId: string) {
    await this.prisma.$transaction(async (tx) => {
      await tx.refundRequest.update({
        where: { id: refund.id },
        data: { status: RefundStatus.COMPLETED, processed_at: new Date() },
      });

      const studentWallet = await tx.wallet.findFirst({
        where: { owner_id: refund.student_id, owner_type: WalletOwnerType.STUDENT },
      });

      if (studentWallet) {
        const balanceBefore = studentWallet.balance;
        const balanceAfter = balanceBefore + refund.refund_amount;

        await tx.wallet.update({
          where: { id: studentWallet.id },
          data: { balance: balanceAfter, last_updated: new Date() },
        });

        await tx.walletTransaction.create({
          data: {
            wallet_id: studentWallet.id,
            transaction_type: WalletTransactionType.CREDIT,
            amount: refund.refund_amount,
            description: `Refund credited to wallet`,
            status: WalletTransactionStatus.COMPLETED,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            processed_at: new Date(),
          },
        });
      }

      await this.applyRefundToRecords(tx, refund, schoolId);
    });
  }

  private async processPaystackRefund(refund: any) {
    await this.prisma.refundRequest.update({
      where: { id: refund.id },
      data: { status: RefundStatus.PROCESSING },
    });

    const gatewayRef =
      refund.feePayment?.gateway_reference ?? refund.feePayment?.paystack_reference;
    if (gatewayRef && refund.feePayment?.payment_method === FeePaymentMethod.PAYSTACK) {
      await this.paystackService.initiatePaystackRefund(gatewayRef, refund.refund_amount);
    }
  }

  private async applyRefundToRecords(tx: any, refund: any, schoolId: string) {
    const record = await tx.studentFeeRecord.findUnique({
      where: { id: refund.student_fee_record_id },
    });
    if (record) {
      const newAmountPaid = Math.max(0, record.amount_paid - refund.refund_amount);
      const newBalance = record.amount_owed - newAmountPaid;
      let newStatus: StudentFeeStatus = StudentFeeStatus.PENDING;
      if (newAmountPaid > 0 && newAmountPaid < record.amount_owed) newStatus = StudentFeeStatus.PARTIAL;
      if (newAmountPaid >= record.amount_owed) newStatus = StudentFeeStatus.COMPLETED;

      await tx.studentFeeRecord.update({
        where: { id: record.id },
        data: {
          amount_paid: newAmountPaid,
          balance: newBalance,
          is_completed: newAmountPaid >= record.amount_owed,
          status: newStatus,
        },
      });
    }

    const payment = await tx.feePayment.findUnique({ where: { id: refund.fee_payment_id } });
    if (payment) {
      const isFullRefund = refund.refund_amount >= payment.amount;
      await tx.feePayment.update({
        where: { id: payment.id },
        data: {
          status: isFullRefund ? FeePaymentStatus.REVERSED : payment.status,
          partially_refunded: !isFullRefund,
          total_refunded_amount: { increment: refund.refund_amount },
        },
      });
    }

    const schoolWallet = await tx.wallet.findFirst({
      where: { owner_id: schoolId, owner_type: WalletOwnerType.SCHOOL },
    });
    if (schoolWallet) {
      const balanceBefore = schoolWallet.balance;
      const balanceAfter = Math.max(0, balanceBefore - refund.refund_amount);

      await tx.wallet.update({
        where: { id: schoolWallet.id },
        data: { balance: balanceAfter, last_updated: new Date() },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: schoolWallet.id,
          transaction_type: WalletTransactionType.DEBIT,
          amount: refund.refund_amount,
          description: `Refund processed: ${refund.id}`,
          status: WalletTransactionStatus.COMPLETED,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          processed_at: new Date(),
        },
      });

      await this.walletAnalyticsService.updateOnRefund(schoolId, refund.refund_amount, tx);
    }
  }
}
