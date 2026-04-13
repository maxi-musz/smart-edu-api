import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import {
  normalizePagination,
  paginationMeta,
} from '../common/finance-helpers';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchoolTransactions(
    schoolId: string,
    query: {
      date_from?: string;
      date_to?: string;
      transaction_type?: string;
      status?: string;
      payment_method?: string;
      fee_id?: string;
      class_id?: string;
      student_id?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: schoolId, owner_type: 'SCHOOL' },
      select: { id: true },
    });
    if (!wallet) {
      return ResponseHelper.success('No wallet found', [], paginationMeta(0, 1, query.limit ?? 20));
    }

    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Prisma.WalletTransactionWhereInput = { wallet_id: wallet.id };

    if (query.date_from || query.date_to) {
      where.createdAt = {};
      if (query.date_from) where.createdAt.gte = new Date(query.date_from);
      if (query.date_to) where.createdAt.lte = new Date(query.date_to);
    }
    if (query.transaction_type) {
      where.transaction_type = query.transaction_type as any;
    }
    if (query.status) {
      where.status = query.status as any;
    }
    if (query.payment_method) {
      where.feePayment = { payment_method: query.payment_method as any };
    }
    if (query.fee_id) {
      where.feePayment = { ...where.feePayment as any, fee_id: query.fee_id };
    }
    if (query.student_id) {
      where.feePayment = { ...where.feePayment as any, student_id: query.student_id };
    }
    if (query.class_id) {
      where.feePayment = {
        ...where.feePayment as any,
        studentFeeRecord: { class_id: query.class_id },
      };
    }

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: {
          feePayment: {
            include: {
              student: { select: { first_name: true, last_name: true } },
              fee: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return ResponseHelper.success(
      'School transactions retrieved',
      transactions,
      paginationMeta(total, page, limit),
    );
  }

  async getStudentTransactions(
    schoolId: string,
    studentId: string,
    query: {
      date_from?: string;
      date_to?: string;
      fee_id?: string;
      status?: string;
      record_type?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (query.date_from) dateFilter.gte = new Date(query.date_from);
    if (query.date_to) dateFilter.lte = new Date(query.date_to);
    const hasDateFilter = Object.keys(dateFilter).length > 0;

    let walletTxs: any[] = [];
    let feePayments: any[] = [];

    if (!query.record_type || query.record_type === 'WALLET_TRANSACTION') {
      const wallet = await this.prisma.wallet.findFirst({
        where: { owner_id: studentId, owner_type: 'STUDENT' },
        select: { id: true },
      });

      if (wallet) {
        const txWhere: Prisma.WalletTransactionWhereInput = {
          wallet_id: wallet.id,
        };
        if (hasDateFilter) txWhere.createdAt = dateFilter;
        if (query.status) txWhere.status = query.status as any;
        if (query.fee_id) txWhere.feePayment = { fee_id: query.fee_id };

        const rows = await this.prisma.walletTransaction.findMany({
          where: txWhere,
          include: {
            feePayment: {
              include: { fee: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

        walletTxs = rows.map((r) => ({ ...r, record_type: 'WALLET_TRANSACTION' as const }));
      }
    }

    if (!query.record_type || query.record_type === 'FEE_PAYMENT') {
      const fpWhere: Prisma.FeePaymentWhereInput = {
        student_id: studentId,
        school_id: schoolId,
      };
      if (hasDateFilter) fpWhere.createdAt = dateFilter;
      if (query.status) fpWhere.status = query.status as any;
      if (query.fee_id) fpWhere.fee_id = query.fee_id;

      const rows = await this.prisma.feePayment.findMany({
        where: fpWhere,
        include: {
          fee: { select: { name: true } },
          studentFeeRecord: {
            select: { amount_owed: true, balance: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      feePayments = rows.map((r) => ({ ...r, record_type: 'FEE_PAYMENT' as const }));
    }

    const merged = [...walletTxs, ...feePayments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = merged.length;
    const paginated = merged.slice(skip, skip + limit);

    return ResponseHelper.success(
      'Student transactions retrieved',
      paginated,
      paginationMeta(total, page, limit),
    );
  }

  async getPerFeePayments(
    schoolId: string,
    feeId: string,
    query: {
      class_id?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
      student_id?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Prisma.FeePaymentWhereInput = {
      fee_id: feeId,
      school_id: schoolId,
    };

    if (query.class_id) {
      where.studentFeeRecord = { class_id: query.class_id };
    }
    if (query.status) {
      where.status = query.status as any;
    }
    if (query.student_id) {
      where.student_id = query.student_id;
    }
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
          studentFeeRecord: {
            select: { amount_owed: true, balance: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feePayment.count({ where }),
    ]);

    return ResponseHelper.success(
      'Fee payments retrieved',
      payments,
      paginationMeta(total, page, limit),
    );
  }

  async getStudentTopUps(
    schoolId: string,
    studentId: string,
    query: {
      source?: string;
      status?: string;
      date_from?: string;
      date_to?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: studentId, owner_type: 'STUDENT' },
      select: { id: true },
    });
    if (!wallet) {
      return ResponseHelper.success('No wallet found', [], paginationMeta(0, 1, query.limit ?? 20));
    }

    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Prisma.WalletTopUpWhereInput = { wallet_id: wallet.id };
    if (query.source) where.source = query.source as any;
    if (query.status) where.status = query.status as any;
    if (query.date_from || query.date_to) {
      where.createdAt = {};
      if (query.date_from) where.createdAt.gte = new Date(query.date_from);
      if (query.date_to) where.createdAt.lte = new Date(query.date_to);
    }

    const [topUps, total] = await Promise.all([
      this.prisma.walletTopUp.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTopUp.count({ where }),
    ]);

    return ResponseHelper.success(
      'Student top-ups retrieved',
      topUps,
      paginationMeta(total, page, limit),
    );
  }

  async getSchoolWalletLedger(
    schoolId: string,
    query: { page?: number; limit?: number },
  ) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: schoolId, owner_type: 'SCHOOL' },
      select: { id: true },
    });
    if (!wallet) {
      return ResponseHelper.success('No wallet found', [], paginationMeta(0, 1, query.limit ?? 20));
    }

    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const where: Prisma.WalletTransactionWhereInput = { wallet_id: wallet.id };

    const [entries, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        select: {
          id: true,
          balance_before: true,
          balance_after: true,
          amount: true,
          description: true,
          transaction_type: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);

    return ResponseHelper.success(
      'School wallet ledger retrieved',
      entries,
      paginationMeta(total, page, limit),
    );
  }
}
