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
  feePaymentByExternalRef,
  walletTopUpByExternalRef,
} from '../common/reference-lookup';
import { PaymentRouterService } from 'src/payment/payment-router.service';
import {
  FeePaymentStatus,
  FeePaymentType,
  FeePaymentMethod,
  PaymentGateway,
  StudentFeeStatus,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletOwnerType,
  WalletTopUpStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import { resolvePaystackSecretKey } from 'src/payment/paystack/paystack-secret.util';

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
    private readonly paymentRouter: PaymentRouterService,
  ) {
    this.secretKey = resolvePaystackSecretKey(this.configService);
  }

  private activeGateway(): PaymentGateway {
    return this.paymentRouter.activeProvider() === 'flutterwave'
      ? PaymentGateway.FLUTTERWAVE
      : PaymentGateway.PAYSTACK;
  }

  private feePaymentMethodForGateway(): FeePaymentMethod {
    return this.activeGateway() === PaymentGateway.FLUTTERWAVE
      ? FeePaymentMethod.FLUTTERWAVE
      : FeePaymentMethod.PAYSTACK;
  }

  async initiateFeePayment(
    schoolId: string,
    dto: {
      student_id: string;
      fee_id: string;
      amount: number;
      installment_number?: number;
      callback_url?: string;
    },
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
    const pg = this.activeGateway();
    const isPaystack = pg === PaymentGateway.PAYSTACK;

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
        payment_method: this.feePaymentMethodForGateway(),
        payment_type: dto.amount >= record.balance ? FeePaymentType.FULL : FeePaymentType.PARTIAL,
        status: FeePaymentStatus.PENDING,
        gateway_reference: reference,
        payment_gateway: pg,
        paystack_reference: isPaystack ? reference : null,
        installment_number: dto.installment_number,
      },
    });

    try {
      const init = await this.paymentRouter.initializeWalletOrFeePayment({
        email: student.email!,
        amountNaira: dto.amount,
        reference,
        callbackUrl: dto.callback_url,
        metadata: {
          school_id: schoolId,
          student_id: dto.student_id,
          fee_id: dto.fee_id,
          fee_payment_id: payment.id,
          payment_purpose: 'FEE_PAYMENT',
        },
      });

      return ResponseHelper.success('Payment initialized', {
        authorization_url: init.authorization_url,
        reference: init.reference,
        payment_id: payment.id,
      });
    } catch (error) {
      await this.prisma.feePayment.update({
        where: { id: payment.id },
        data: { status: FeePaymentStatus.FAILED },
      });
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Payment gateway initialization failed', error);
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Payment gateway error',
      );
    }
  }

  /**
   * Provider-agnostic verify: checks Paystack/Flutterwave API, then DB; optionally settles pending rows.
   */
  async verifyUnified(reference: string) {
    const v = await this.paymentRouter.verifyTransaction(reference);

    const feePayment = await this.prisma.feePayment.findFirst({
      where: feePaymentByExternalRef(reference),
      include: { studentFeeRecord: { include: { fee: true } } },
    });
    const topUp = await this.prisma.walletTopUp.findFirst({
      where: walletTopUpByExternalRef(reference),
    });

    const successStatuses = ['success', 'successful'];
    const providerOk =
      v.ok && successStatuses.includes(String(v.providerStatus).toLowerCase());

    if (providerOk) {
      if (feePayment?.status === FeePaymentStatus.PENDING) {
        if (Math.abs(v.amountNaira - feePayment.amount) <= 1) {
          await this.confirmFeePayment(feePayment);
        }
      }
      if (topUp?.status === WalletTopUpStatus.PENDING) {
        if (Math.abs(v.amountNaira - topUp.amount) <= 1) {
          await this.settleWalletTopUp(topUp.id, v.amountNaira, v.providerStatus, v.raw);
        }
      }
    }

    const recordStatus = feePayment?.status ?? topUp?.status;
    const kind = feePayment ? 'fee_payment' : topUp ? 'wallet_topup' : 'unknown';

    return ResponseHelper.success('Payment verification result', {
      reference,
      provider_status: v.providerStatus,
      amount: v.amountNaira,
      verification_ok: v.ok,
      type: kind,
      record_status: recordStatus ?? 'NOT_FOUND',
    });
  }

  /** @deprecated Use verifyUnified — kept for backward compatibility. */
  async verifyPayment(reference: string) {
    return this.verifyUnified(reference);
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

  async handleFlutterwaveWebhook(body: any, verifHash: string | undefined) {
    const gw = this.paymentRouter.getFlutterwaveGateway();
    if (!gw.verifyWebhookHash(verifHash)) {
      this.logger.warn('Invalid Flutterwave webhook verif-hash');
      return { status: 'ignored' };
    }

    const event = String(body.event ?? body.type ?? '');
    const d = body.data;
    const statusOk =
      d &&
      ['successful', 'success'].includes(String(d.status ?? '').toLowerCase());
    const isChargeCompleted =
      event === 'charge.completed' || event.endsWith('charge.completed');
    if (isChargeCompleted && statusOk && d.tx_ref) {
      await this.processChargeSuccess({
        reference: d.tx_ref,
        amount: d.amount,
        status: d.status,
        flw_ref: d.flw_ref,
        currency: d.currency,
      });
    }

    return { status: 'ok' };
  }

  private async processChargeSuccess(data: any) {
    const reference = data.reference ?? data.tx_ref;
    if (!reference) return;

    const payment = await this.prisma.feePayment.findFirst({
      where: feePaymentByExternalRef(reference),
      include: { studentFeeRecord: { include: { fee: true } } },
    });

    if (payment && payment.status === FeePaymentStatus.CONFIRMED) {
      return;
    }

    if (payment) {
      const amountNaira = this.amountNairaFromGatewayPayload(data, payment.payment_gateway);
      if (Math.abs(amountNaira - payment.amount) > 0.01) {
        this.logger.warn(
          `Amount mismatch for ${reference}: expected ${payment.amount}, got ${amountNaira}`,
        );
        return;
      }

      await this.confirmFeePayment(payment);
      return;
    }

    const topUp = await this.prisma.walletTopUp.findFirst({
      where: walletTopUpByExternalRef(reference),
    });

    if (topUp && topUp.status !== WalletTopUpStatus.COMPLETED) {
      const amountNaira = this.amountNairaFromGatewayPayload(data, topUp.payment_gateway);
      await this.settleWalletTopUp(topUp.id, amountNaira, data.status, data);
    }
  }

  private amountNairaFromGatewayPayload(
    data: any,
    gateway: PaymentGateway | null | undefined,
  ): number {
    const g = gateway ?? PaymentGateway.PAYSTACK;
    if (g === PaymentGateway.FLUTTERWAVE) {
      return Number(data.amount ?? data.charged_amount ?? 0);
    }
    return koboToNaira(data.amount);
  }

  private async confirmFeePayment(payment: any) {
    const record = payment.studentFeeRecord;
    const receiptNumber = await this.receiptService.generateReceiptNumber(payment.school_id);
    const method =
      payment.payment_method === FeePaymentMethod.FLUTTERWAVE
        ? FeePaymentMethod.FLUTTERWAVE
        : FeePaymentMethod.PAYSTACK;

    await this.prisma.$transaction(async (tx) => {
      await tx.feePayment.update({
        where: { id: payment.id },
        data: {
          status: FeePaymentStatus.CONFIRMED,
          receipt_number: receiptNumber,
          processed_at: new Date(),
          metadata: { gateway_confirmed: true },
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
            description: `Online fee payment: ${record.fee.name}`,
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
            payment_method: method,
            fee_id: payment.fee_id,
            class_id: record.class_id,
            includes_penalty: false,
            penalty_amount: 0,
          },
          tx,
        );
      }
    });

    const ref = payment.gateway_reference ?? payment.paystack_reference;
    if (ref) {
      await this.prisma.paystackWebhookLog.updateMany({
        where: { reference: ref, processed: false },
        data: { processed: true, processed_at: new Date() },
      });
    }
  }

  private async settleWalletTopUp(
    topUpId: string,
    amountNaira: number,
    gatewayStatus: string,
    metadata: unknown,
  ) {
    const topUp = await this.prisma.walletTopUp.findUnique({ where: { id: topUpId } });
    if (!topUp || topUp.status === WalletTopUpStatus.COMPLETED) return;
    if (Math.abs(amountNaira - topUp.amount) > 0.05) {
      this.logger.warn(`Wallet top-up amount mismatch for ${topUpId}`);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.walletTopUp.update({
        where: { id: topUp.id },
        data: {
          status: WalletTopUpStatus.COMPLETED,
          paystack_status: gatewayStatus,
          processed_at: new Date(),
          metadata: metadata as object,
        },
      });

      const wallet = await tx.wallet.findUnique({ where: { id: topUp.wallet_id } });
      if (!wallet) return;

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amountNaira;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: balanceAfter,
          total_funded_all_time: wallet.total_funded_all_time + amountNaira,
          last_updated: new Date(),
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: wallet.id,
          transaction_type: WalletTransactionType.CREDIT,
          amount: amountNaira,
          description: 'Online wallet top-up',
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

  private verifySignature(body: string, signature: string): boolean {
    if (!this.secretKey) return false;
    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(body)
      .digest('hex');
    return hash === signature;
  }
}
