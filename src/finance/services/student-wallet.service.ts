import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { WalletAnalyticsService } from './wallet-analytics.service';
import { ReceiptService } from './receipt.service';
import { FINANCE_CONSTANTS } from '../common/finance.constants';
import { resolveFinanceStudentRowId, resolveFinanceStudentUserId } from '../common/resolve-student-id';
import { generatePaystackReference } from '../common/finance-helpers';
import { PaymentRouterService } from 'src/payment/payment-router.service';
import {
  WalletOwnerType,
  WalletType,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletTopUpSource,
  WalletTopUpStatus,
  FeePaymentMethod,
  FeePaymentStatus,
  FeePaymentType,
  StudentFeeStatus,
  PaymentGateway,
} from '@prisma/client';

@Injectable()
export class StudentWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly walletAnalyticsService: WalletAnalyticsService,
    private readonly receiptService: ReceiptService,
    private readonly paymentRouter: PaymentRouterService,
  ) {}

  async getOrCreateStudentWallet(studentUserId: string) {
    let wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: studentUserId, owner_type: WalletOwnerType.STUDENT },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          owner_id: studentUserId,
          owner_type: WalletOwnerType.STUDENT,
          wallet_type: WalletType.STUDENT_WALLET,
          balance: 0,
        },
      });
    }

    return wallet;
  }

  async getStudentWallet(schoolId: string, studentIdOrUserId: string) {
    const ownerUserId = await resolveFinanceStudentUserId(this.prisma, schoolId, studentIdOrUserId);
    if (!ownerUserId) throw new NotFoundException('Student not found');

    const wallet = await this.getOrCreateStudentWallet(ownerUserId);

    const recentTx = await this.prisma.walletTransaction.findMany({
      where: { wallet_id: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        transaction_type: true,
        amount: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    return ResponseHelper.success('Student wallet fetched', {
      ...wallet,
      recent_transactions: recentTx,
    });
  }

  async manualTopUp(schoolId: string, studentIdOrUserId: string, userId: string, dto: { amount: number; notes?: string }) {
    if (dto.amount < FINANCE_CONSTANTS.MIN_TOPUP_AMOUNT) {
      throw new BadRequestException(
        `Minimum top-up amount is ${FINANCE_CONSTANTS.MIN_TOPUP_AMOUNT}`,
      );
    }

    const ownerUserId = await resolveFinanceStudentUserId(this.prisma, schoolId, studentIdOrUserId);
    if (!ownerUserId) throw new NotFoundException('Student not found');

    const wallet = await this.getOrCreateStudentWallet(ownerUserId);

    if (wallet.balance + dto.amount > FINANCE_CONSTANTS.MAX_WALLET_BALANCE) {
      throw new BadRequestException(
        `Top-up would exceed maximum wallet balance of ${FINANCE_CONSTANTS.MAX_WALLET_BALANCE}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const topUp = await tx.walletTopUp.create({
        data: {
          wallet_id: wallet.id,
          owner_id: ownerUserId,
          owner_type: WalletOwnerType.STUDENT,
          amount: dto.amount,
          source: WalletTopUpSource.MANUAL_CASH,
          recorded_by: userId,
          status: WalletTopUpStatus.COMPLETED,
          processed_at: new Date(),
          metadata: dto.notes ? { notes: dto.notes } : undefined,
        },
      });

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + dto.amount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          total_funded_all_time: wallet.total_funded_all_time + dto.amount,
          last_updated: new Date(),
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: wallet.id,
          transaction_type: WalletTransactionType.CREDIT,
          amount: dto.amount,
          description: `Manual top-up by staff`,
          status: WalletTransactionStatus.COMPLETED,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          recorded_by: userId,
          processed_at: new Date(),
        },
      });

      return topUp;
    });

    await this.auditService.log({
      auditForType: 'finance_wallet_topup',
      targetId: result.id,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { student_user_id: ownerUserId, amount: dto.amount, source: 'MANUAL_CASH' },
    });

    return ResponseHelper.created('Wallet topped up successfully', result);
  }

  async payFeeFromWallet(
    schoolId: string,
    studentIdOrUserId: string,
    dto: { fee_id: string; student_fee_record_id: string; amount?: number; installment_number?: number },
  ) {
    const ownerUserId = await resolveFinanceStudentUserId(this.prisma, schoolId, studentIdOrUserId);
    if (!ownerUserId) throw new NotFoundException('Student not found');

    const wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: ownerUserId, owner_type: WalletOwnerType.STUDENT },
    });
    if (!wallet) throw new NotFoundException('Student wallet not found');

    const studentRowId = await resolveFinanceStudentRowId(this.prisma, schoolId, studentIdOrUserId);
    if (!studentRowId) throw new NotFoundException('Fee record not found');

    const record = await this.prisma.studentFeeRecord.findFirst({
      where: { id: dto.student_fee_record_id, student_id: studentRowId, school_id: schoolId },
      include: { fee: true },
    });
    if (!record) throw new NotFoundException('Fee record not found');
    if (record.is_completed) throw new BadRequestException('Fee already fully paid');

    const paymentAmount = dto.amount ?? record.balance;
    if (wallet.balance < paymentAmount) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ${wallet.balance}, Required: ${paymentAmount}`,
      );
    }

    const receiptNumber = await this.receiptService.generateReceiptNumber(schoolId);
    const effectiveAmount = Math.min(paymentAmount, record.balance);

    const currentSession = await this.prisma.academicSession.findFirst({
      where: { school_id: schoolId, is_current: true },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // Debit student wallet
      const studentBalanceBefore = wallet.balance;
      const studentBalanceAfter = studentBalanceBefore - effectiveAmount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: studentBalanceAfter,
          total_spent_all_time: wallet.total_spent_all_time + effectiveAmount,
          last_updated: new Date(),
        },
      });

      const payment = await tx.feePayment.create({
        data: {
          student_id: ownerUserId,
          fee_id: dto.fee_id,
          school_id: schoolId,
          academic_session_id: currentSession?.id || record.academic_session_id,
          student_fee_record_id: record.id,
          amount: effectiveAmount,
          payment_method: FeePaymentMethod.WALLET,
          payment_type: effectiveAmount >= record.balance ? FeePaymentType.FULL : FeePaymentType.PARTIAL,
          status: FeePaymentStatus.CONFIRMED,
          receipt_number: receiptNumber,
          processed_at: new Date(),
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: wallet.id,
          transaction_type: WalletTransactionType.DEBIT,
          amount: effectiveAmount,
          description: `Fee payment: ${record.fee.name}`,
          status: WalletTransactionStatus.COMPLETED,
          balance_before: studentBalanceBefore,
          balance_after: studentBalanceAfter,
          payment_id: payment.id,
          processed_at: new Date(),
        },
      });

      // Update student fee record
      const newAmountPaid = record.amount_paid + effectiveAmount;
      const newBalance = record.amount_owed - newAmountPaid;
      const isCompleted = newBalance <= 0;

      await tx.studentFeeRecord.update({
        where: { id: record.id },
        data: {
          amount_paid: newAmountPaid,
          balance: Math.max(0, newBalance),
          is_completed: isCompleted,
          status: isCompleted
            ? StudentFeeStatus.COMPLETED
            : newAmountPaid > 0
              ? StudentFeeStatus.PARTIAL
              : record.status,
          last_payment_at: new Date(),
        },
      });

      // Credit school wallet
      const schoolWallet = await tx.wallet.findFirst({
        where: { owner_id: schoolId, owner_type: WalletOwnerType.SCHOOL },
      });

      if (schoolWallet) {
        const schoolBalanceBefore = schoolWallet.balance;
        const schoolBalanceAfter = schoolBalanceBefore + effectiveAmount;

        await tx.wallet.update({
          where: { id: schoolWallet.id },
          data: { balance: schoolBalanceAfter, last_updated: new Date() },
        });

        await tx.walletTransaction.create({
          data: {
            wallet_id: schoolWallet.id,
            transaction_type: WalletTransactionType.CREDIT,
            amount: effectiveAmount,
            description: `Wallet fee payment: ${record.fee.name}`,
            status: WalletTransactionStatus.COMPLETED,
            balance_before: schoolBalanceBefore,
            balance_after: schoolBalanceAfter,
            payment_id: payment.id,
            processed_at: new Date(),
          },
        });

        await this.walletAnalyticsService.updateOnPaymentConfirmed(
          schoolId,
          {
            amount: effectiveAmount,
            payment_method: FeePaymentMethod.WALLET,
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

    return ResponseHelper.success('Fee paid from wallet successfully', result);
  }

  /**
   * Initialize online wallet funding (Paystack or Flutterwave per PAYMENT_PROVIDER).
   */
  async initiateWalletTopUp(
    schoolId: string,
    studentIdOrUserId: string,
    dto: { amount: number; callback_url?: string },
  ) {
    if (dto.amount < FINANCE_CONSTANTS.MIN_TOPUP_AMOUNT) {
      throw new BadRequestException(
        `Minimum top-up amount is ${FINANCE_CONSTANTS.MIN_TOPUP_AMOUNT}`,
      );
    }

    const ownerUserId = await resolveFinanceStudentUserId(this.prisma, schoolId, studentIdOrUserId);
    if (!ownerUserId) throw new NotFoundException('Student not found');

    const student = await this.prisma.user.findFirst({
      where: { id: ownerUserId },
      select: { email: true },
    });
    if (!student?.email) throw new NotFoundException('Student not found');

    const wallet = await this.getOrCreateStudentWallet(ownerUserId);

    if (wallet.balance + dto.amount > FINANCE_CONSTANTS.MAX_WALLET_BALANCE) {
      throw new BadRequestException(
        `Top-up would exceed maximum wallet balance of ${FINANCE_CONSTANTS.MAX_WALLET_BALANCE}`,
      );
    }

    const provider = this.paymentRouter.activeProvider();
    const reference = generatePaystackReference('TOP');
    const pg: PaymentGateway =
      provider === 'flutterwave'
        ? PaymentGateway.FLUTTERWAVE
        : PaymentGateway.PAYSTACK;

    await this.prisma.walletTopUp.create({
      data: {
        wallet_id: wallet.id,
        owner_id: ownerUserId,
        owner_type: WalletOwnerType.STUDENT,
        amount: dto.amount,
        source:
          provider === 'flutterwave'
            ? WalletTopUpSource.FLUTTERWAVE
            : WalletTopUpSource.PAYSTACK,
        gateway_reference: reference,
        payment_gateway: pg,
        paystack_reference: provider === 'paystack' ? reference : null,
        status: WalletTopUpStatus.PENDING,
      },
    });

    try {
      const init = await this.paymentRouter.initializeWalletOrFeePayment({
        email: student.email,
        amountNaira: dto.amount,
        reference,
        callbackUrl: dto.callback_url,
        metadata: {
          school_id: schoolId,
          student_id: ownerUserId,
          wallet_id: wallet.id,
          payment_purpose: 'STUDENT_WALLET_FUNDING',
        },
      });

      return ResponseHelper.success('Wallet top-up initialized', {
        authorization_url: init.authorization_url,
        reference: init.reference,
      });
    } catch (e) {
      await this.prisma.walletTopUp.updateMany({
        where: { gateway_reference: reference },
        data: { status: WalletTopUpStatus.FAILED },
      });
      throw new BadRequestException(
        e instanceof Error ? e.message : 'Failed to initialize top-up',
      );
    }
  }
}
