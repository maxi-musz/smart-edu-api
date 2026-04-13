import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import { WalletOwnerType, WalletType } from '@prisma/client';

@Injectable()
export class SchoolWalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSchoolWallet(schoolId: string) {
    let wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: schoolId, owner_type: WalletOwnerType.SCHOOL },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          owner_id: schoolId,
          owner_type: WalletOwnerType.SCHOOL,
          school_id: schoolId,
          wallet_type: WalletType.SCHOOL_WALLET,
          balance: 0,
        },
      });

      await this.prisma.walletAnalytics.create({
        data: { wallet_id: wallet.id },
      });
    }

    return wallet;
  }

  async getWalletWithAnalytics(schoolId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: schoolId, owner_type: WalletOwnerType.SCHOOL },
      include: { walletAnalytics: true },
    });

    if (!wallet) {
      const created = await this.getOrCreateSchoolWallet(schoolId);
      const withAnalytics = await this.prisma.wallet.findUnique({
        where: { id: created.id },
        include: { walletAnalytics: true },
      });
      return ResponseHelper.success('School wallet fetched', withAnalytics);
    }

    return ResponseHelper.success('School wallet fetched', wallet);
  }

  async getWalletLedger(schoolId: string, query: { page?: number; limit?: number }) {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);

    const wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: schoolId, owner_type: WalletOwnerType.SCHOOL },
    });
    if (!wallet) throw new NotFoundException('School wallet not found');

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { wallet_id: wallet.id },
        select: {
          id: true,
          transaction_type: true,
          amount: true,
          description: true,
          reference: true,
          status: true,
          balance_before: true,
          balance_after: true,
          recorded_by: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.walletTransaction.count({ where: { wallet_id: wallet.id } }),
    ]);

    return ResponseHelper.success(
      'Wallet ledger fetched',
      transactions,
      paginationMeta(total, page, limit),
    );
  }
}
