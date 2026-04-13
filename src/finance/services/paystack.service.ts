import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { WalletAnalyticsService } from './wallet-analytics.service';
import { ReceiptService } from './receipt.service';
import {
  nairaToKobo,
  koboToNaira,
  generatePaystackReference,
} from '../common/finance-helpers';
import { FINANCE_CONSTANTS } from '../common/finance.constants';
import {
  FeePaymentStatus,
  FeePaymentType,
  FeePaymentMethod,
  StudentFeeStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletOwnerType,
  WalletTopUpStatus,
  WalletTopUpSource,
} from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly baseUrl = FINANCE_CONSTANTS.PAYSTACK_BASE_URL;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly walletAnalyticsService: WalletAnalyticsService,
    private readonly receiptService: ReceiptService,
  ) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
  }

  async initiateFeePayment(
    schoolId: string,
    dto: { student_id: string; fee_id: string; amount: number; installment_number?: number; callback_url?: string },
  ) {
    const record = await this.prisma.studentFeeRecord.findFirst({
      where: { student_id: dto.student_id, fee_id: dto.fee_id, school_id: schoolId },
      include: { fee: true },
    });
    if (!record) throw new NotFoundException('Student fee record not found');
    if (record.is_completed) throw new BadRequestException('Fee already fully paid');
    if (dto.amount > record.balance) {
      throw new BadRequestException(`Amount exceeds outstanding balance of ${record.balance}`);
    }

    const student = await this.prisma.user.findFirst({
      where: { id: dto.student_id },
      select: { email: true, first_name: true, last_name: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const reference = generatePaystackReference('FEE');
    const amountInKobo = nairaToKobo(dto.amount);

    const currentSession = await this.prisma.academicSession.findFirst({
      where: { school_id: schoolId, is_current: true },
    });

    const payment = await this.prisma.feePayment.create({
      data: {
        student_id: dto.student_id,
        fee_id: dto.fee_id,
        school_id: schoolId,
        academic_session_id: currentSession?.id || record.academic_session_id,
        student_fee_record_id: record.id,
        amount: dto.amount,
        payment_method: FeePaymentMethod.PAYSTACK,
        payment_type: dto.amount >= record.balance ? FeePaymentType.FULL : FeePaymentType.PARTIAL,
        status: FeePaymentStatus.PENDING,
        paystack_reference: reference,
        installment_number: dto.installment_number,
      },
    });

    try {
      const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: student.email,
          amount: amountInKobo,
          reference,
          callback_url: dto.callback_url,
          metadata: {
            school_id: schoolId,
            student_id: dto.student_id,
            fee_id: dto.fee_id,
            fee_payment_id: payment.id,
            payment_purpose: 'FEE_PAYMENT',
          },
        }),
      });

      const data = await response.json();

      if (!data.status) {
        await this.prisma.feePayment.update({
          where: { id: payment.id },
          data: { status: FeePaymentStatus.FAILED },
        });
        throw new BadRequestException(data.message || 'Failed to initialize payment');
      }

      return ResponseHelper.success('Payment initialized', {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference,
        payment_id: payment.id,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Paystack initialization failed', error);
      throw new BadRequestException('Payment gateway error');
    }
  }

  async verifyPayment(reference: string) {
    try {
      const response = await fetch(`${this.baseUrl}/transaction/verify/${reference}`, {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      });
      const data = await response.json();

      if (!data.status) {
        return ResponseHelper.error('Verification failed', data.message);
      }

      const payment = await this.prisma.feePayment.findFirst({
        where: { paystack_reference: reference },
        select: { id: true, status: true, amount: true },
      });

      return ResponseHelper.success('Payment verification result', {
        reference,
        paystack_status: data.data.status,
        amount: koboToNaira(data.data.amount),
        payment_status: payment?.status || 'NOT_FOUND',
      });
    } catch (error) {
      this.logger.error('Paystack verification failed', error);
      return ResponseHelper.error('Verification error');
    }
  }

  async handleWebhook(body: any, signature: string) {
    const isValid = this.verifySignature(JSON.stringify(body), signature);

    await this.prisma.paystackWebhookLog.create({
      data: {
        event_type: body.event || 'unknown',
        reference: body.data?.reference,
        payload: body,
        signature,
        signature_valid: isValid,
      },
    });

    if (!isValid) {
      this.logger.warn('Invalid Paystack webhook signature');
      return { status: 'ok' };
    }

    const eventType = body.event;

    if (eventType === 'charge.success') {
      await this.processChargeSuccess(body.data);
    } else if (eventType === 'refund.processed') {
      await this.processRefundWebhook(body.data);
    }

    return { status: 'ok' };
  }

  private async processChargeSuccess(data: any) {
    const reference = data.reference;
    if (!reference) return;

    const payment = await this.prisma.feePayment.findFirst({
      where: { paystack_reference: reference },
      include: { studentFeeRecord: { include: { fee: true } } },
    });

    if (payment && payment.status === FeePaymentStatus.CONFIRMED) {
      return; // Idempotency: already processed
    }

    if (payment) {
      const paystackAmount = koboToNaira(data.amount);
      if (Math.abs(paystackAmount - payment.amount) > 0.01) {
        this.logger.warn(`Amount mismatch for ${reference}: expected ${payment.amount}, got ${paystackAmount}`);
        return;
      }

      await this.confirmFeePayment(payment);
      return;
    }

    // Could be a wallet top-up
    const topUp = await this.prisma.walletTopUp.findFirst({
      where: { paystack_reference: reference },
    });

    if (topUp && topUp.status !== WalletTopUpStatus.COMPLETED) {
      await this.processWalletTopUp(topUp, data);
    }
  }

  private async confirmFeePayment(payment: any) {
    const record = payment.studentFeeRecord;
    const receiptNumber = await this.receiptService.generateReceiptNumber(payment.school_id);

    await this.prisma.$transaction(async (tx) => {
      await tx.feePayment.update({
        where: { id: payment.id },
        data: {
          status: FeePaymentStatus.CONFIRMED,
          receipt_number: receiptNumber,
          processed_at: new Date(),
          metadata: { paystack_confirmed: true },
        },
      });

      const newAmountPaid = record.amount_paid + payment.amount;
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

      const schoolWallet = await tx.wallet.findFirst({
        where: { owner_id: payment.school_id, owner_type: WalletOwnerType.SCHOOL },
      });

      if (schoolWallet) {
        const balanceBefore = schoolWallet.balance;
        const balanceAfter = balanceBefore + payment.amount;

        await tx.wallet.update({
          where: { id: schoolWallet.id },
          data: { balance: balanceAfter, last_updated: new Date() },
        });

        await tx.walletTransaction.create({
          data: {
            wallet_id: schoolWallet.id,
            transaction_type: WalletTransactionType.CREDIT,
            amount: payment.amount,
            description: `Paystack fee payment: ${record.fee.name}`,
            status: WalletTransactionStatus.COMPLETED,
            balance_before: balanceBefore,
            balance_after: balanceAfter,
            payment_id: payment.id,
            processed_at: new Date(),
          },
        });

        await this.walletAnalyticsService.updateOnPaymentConfirmed(
          payment.school_id,
          {
            amount: payment.amount,
            payment_method: FeePaymentMethod.PAYSTACK,
            fee_id: payment.fee_id,
            class_id: record.class_id,
            includes_penalty: false,
            penalty_amount: 0,
          },
          tx,
        );
      }
    });

    await this.prisma.paystackWebhookLog.updateMany({
      where: { reference: payment.paystack_reference, processed: false },
      data: { processed: true, processed_at: new Date() },
    });
  }

  private async processWalletTopUp(topUp: any, paystackData: any) {
    const paystackAmount = koboToNaira(paystackData.amount);

    await this.prisma.$transaction(async (tx) => {
      await tx.walletTopUp.update({
        where: { id: topUp.id },
        data: {
          status: WalletTopUpStatus.COMPLETED,
          paystack_status: paystackData.status,
          processed_at: new Date(),
          metadata: paystackData,
        },
      });

      const wallet = await tx.wallet.findUnique({ where: { id: topUp.wallet_id } });
      if (!wallet) return;

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + paystackAmount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          total_funded_all_time: wallet.total_funded_all_time + paystackAmount,
          last_updated: new Date(),
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: wallet.id,
          transaction_type: WalletTransactionType.CREDIT,
          amount: paystackAmount,
          description: 'Paystack wallet top-up',
          status: WalletTransactionStatus.COMPLETED,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          processed_at: new Date(),
        },
      });
    });
  }

  private async processRefundWebhook(data: any) {
    const reference = data.transaction?.reference;
    if (!reference) return;

    const refund = await this.prisma.refundRequest.findFirst({
      where: { paystack_refund_reference: reference, status: 'PROCESSING' },
    });

    if (refund) {
      await this.prisma.refundRequest.update({
        where: { id: refund.id },
        data: { status: 'COMPLETED', processed_at: new Date() },
      });
    }
  }

  async initiatePaystackRefund(paystackReference: string, amountInNaira: number) {
    try {
      const response = await fetch(`${this.baseUrl}/refund`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: paystackReference,
          amount: nairaToKobo(amountInNaira),
        }),
      });
      return await response.json();
    } catch (error) {
      this.logger.error('Paystack refund failed', error);
      throw new BadRequestException('Refund request to Paystack failed');
    }
  }

  async initiateWalletTopUp(
    schoolId: string,
    studentId: string,
    dto: { amount: number; callback_url?: string },
  ) {
    const student = await this.prisma.user.findFirst({
      where: { id: studentId },
      select: { email: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: studentId, owner_type: WalletOwnerType.STUDENT },
    });
    if (!wallet) throw new NotFoundException('Student wallet not found');

    const reference = generatePaystackReference('TOP');
    const amountInKobo = nairaToKobo(dto.amount);

    await this.prisma.walletTopUp.create({
      data: {
        wallet_id: wallet.id,
        owner_id: studentId,
        owner_type: WalletOwnerType.STUDENT,
        amount: dto.amount,
        source: WalletTopUpSource.PAYSTACK,
        paystack_reference: reference,
        status: WalletTopUpStatus.PENDING,
      },
    });

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: student.email,
        amount: amountInKobo,
        reference,
        callback_url: dto.callback_url,
        metadata: {
          school_id: schoolId,
          student_id: studentId,
          wallet_id: wallet.id,
          payment_purpose: 'STUDENT_WALLET_FUNDING',
        },
      }),
    });

    const data = await response.json();
    if (!data.status) throw new BadRequestException(data.message || 'Failed to initialize top-up');

    return ResponseHelper.success('Wallet top-up initialized', {
      authorization_url: data.data.authorization_url,
      reference,
    });
  }

  private verifySignature(body: string, signature: string): boolean {
    if (!this.secretKey) return false;
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(body)
      .digest('hex');
    return hash === signature;
  }
}
