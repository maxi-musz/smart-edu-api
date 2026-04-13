import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from 'src/audit/audit.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import {
  WalletOwnerType,
  WalletType,
  WalletTransactionType,
  WalletTransactionStatus,
  WalletTransferStatus,
  WalletTopUpSource,
  WalletTopUpStatus,
} from '@prisma/client';

@Injectable()
export class ParentWalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getOrCreateParentWallet(parentUserId: string) {
    let wallet = await this.prisma.wallet.findFirst({
      where: { owner_id: parentUserId, owner_type: WalletOwnerType.PARENT },
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          owner_id: parentUserId,
          owner_type: WalletOwnerType.PARENT,
          wallet_type: WalletType.STUDENT_WALLET,
          balance: 0,
        },
      });
    }

    return wallet;
  }

  async getParentWallet(schoolId: string, parentId: string) {
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, school_id: schoolId },
    });
    if (!parent) throw new NotFoundException('Parent not found');

    const wallet = await this.getOrCreateParentWallet(parent.user_id);

    return ResponseHelper.success('Parent wallet fetched', wallet);
  }

  async transferToChild(
    schoolId: string,
    parentId: string,
    userId: string,
    dto: { to_student_id: string; amount: number },
  ) {
    const parent = await this.prisma.parent.findFirst({
      where: { id: parentId, school_id: schoolId },
      include: { children: { select: { user_id: true } } },
    });
    if (!parent) throw new NotFoundException('Parent not found');

    const childUserIds = parent.children.map((c) => c.user_id);
    if (!childUserIds.includes(dto.to_student_id)) {
      throw new BadRequestException('Student is not a child of this parent');
    }

    const parentWallet = await this.prisma.wallet.findFirst({
      where: { owner_id: parent.user_id, owner_type: WalletOwnerType.PARENT },
    });
    if (!parentWallet) throw new NotFoundException('Parent wallet not found');

    if (parentWallet.balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${parentWallet.balance}, Required: ${dto.amount}`,
      );
    }

    let studentWallet = await this.prisma.wallet.findFirst({
      where: { owner_id: dto.to_student_id, owner_type: WalletOwnerType.STUDENT },
    });

    if (!studentWallet) {
      studentWallet = await this.prisma.wallet.create({
        data: {
          owner_id: dto.to_student_id,
          owner_type: WalletOwnerType.STUDENT,
          wallet_type: WalletType.STUDENT_WALLET,
          balance: 0,
        },
      });
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const parentBefore = parentWallet.balance;
      const parentAfter = parentBefore - dto.amount;
      const studentBefore = studentWallet!.balance;
      const studentAfter = studentBefore + dto.amount;

      await tx.wallet.update({
        where: { id: parentWallet.id },
        data: {
          balance: parentAfter,
          total_spent_all_time: parentWallet.total_spent_all_time + dto.amount,
          last_updated: new Date(),
        },
      });

      await tx.wallet.update({
        where: { id: studentWallet!.id },
        data: {
          balance: studentAfter,
          total_funded_all_time: studentWallet!.total_funded_all_time + dto.amount,
          last_updated: new Date(),
        },
      });

      const transfer = await tx.walletTransfer.create({
        data: {
          from_wallet_id: parentWallet.id,
          to_wallet_id: studentWallet!.id,
          amount: dto.amount,
          status: WalletTransferStatus.COMPLETED,
          initiated_by: userId,
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: parentWallet.id,
          transaction_type: WalletTransactionType.TRANSFER,
          amount: dto.amount,
          description: `Transfer to child wallet`,
          status: WalletTransactionStatus.COMPLETED,
          balance_before: parentBefore,
          balance_after: parentAfter,
          processed_at: new Date(),
        },
      });

      await tx.walletTransaction.create({
        data: {
          wallet_id: studentWallet!.id,
          transaction_type: WalletTransactionType.CREDIT,
          amount: dto.amount,
          description: `Transfer from parent wallet`,
          status: WalletTransactionStatus.COMPLETED,
          balance_before: studentBefore,
          balance_after: studentAfter,
          processed_at: new Date(),
        },
      });

      await tx.walletTopUp.create({
        data: {
          wallet_id: studentWallet!.id,
          owner_id: dto.to_student_id,
          owner_type: WalletOwnerType.STUDENT,
          amount: dto.amount,
          source: WalletTopUpSource.TRANSFER_FROM_PARENT_WALLET,
          status: WalletTopUpStatus.COMPLETED,
          processed_at: new Date(),
        },
      });

      return transfer;
    });

    await this.auditService.log({
      auditForType: 'finance_wallet_transfer',
      targetId: result.id,
      schoolId,
      performedById: userId,
      performedByType: 'school_user',
      metadata: { parent_id: parentId, student_id: dto.to_student_id, amount: dto.amount },
    });

    return ResponseHelper.success('Transfer completed successfully', result);
  }
}
