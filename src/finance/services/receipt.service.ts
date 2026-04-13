import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { generateReceiptNumber } from '../common/finance-helpers';

@Injectable()
export class ReceiptService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReceiptNumber(schoolId: string): Promise<string> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { school_code: true },
    });

    if (!school?.school_code) {
      throw new NotFoundException('School or school code not found');
    }

    const count = await this.prisma.feePayment.count({
      where: {
        school_id: schoolId,
        receipt_number: { not: null },
      },
    });

    return generateReceiptNumber(school.school_code, count + 1);
  }

  async getReceiptData(schoolId: string, paymentId: string) {
    try {
      const payment = await this.prisma.feePayment.findFirst({
        where: { id: paymentId, school_id: schoolId },
        include: {
          student: {
            select: { id: true, first_name: true, last_name: true },
          },
          fee: {
            select: { id: true, name: true },
          },
          school: {
            select: { id: true, school_name: true, school_code: true },
          },
          studentFeeRecord: {
            select: { balance: true, amount_owed: true, amount_paid: true },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      const receiptData = {
        receipt_number: payment.receipt_number,
        school_name: payment.school.school_name,
        school_code: payment.school.school_code,
        student_name: `${payment.student.first_name} ${payment.student.last_name}`,
        fee_name: payment.fee.name,
        amount_paid: payment.amount,
        payment_method: payment.payment_method,
        payment_date: payment.processed_at ?? payment.createdAt,
        recorded_by: payment.recorded_by,
        balance_remaining: payment.studentFeeRecord.balance,
        status: payment.status,
      };

      return ResponseHelper.success('Receipt data retrieved successfully', receiptData);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      return ResponseHelper.error('Failed to retrieve receipt data', error?.message);
    }
  }
}
