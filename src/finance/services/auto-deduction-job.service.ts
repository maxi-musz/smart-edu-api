import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentWalletService } from './student-wallet.service';
import { StudentFeeStatus, WalletOwnerType } from '@prisma/client';

@Injectable()
export class AutoDeductionJobService {
  private readonly logger = new Logger(AutoDeductionJobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly studentWalletService: StudentWalletService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async processAutoDeductions() {
    this.logger.log('Running auto-deduction job...');

    const now = new Date();

    const settings = await this.prisma.feeAutoDeductionSetting.findMany({
      where: {
        enabled: true,
        deduction_date: { lte: now },
        OR: [
          { last_run_at: null },
          { last_run_at: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
        ],
      },
      include: {
        fee: {
          select: { id: true, school_id: true, is_active: true },
        },
      },
    });

    for (const setting of settings) {
      if (!setting.fee.is_active) continue;

      try {
        await this.processFeDeduction(setting);

        await this.prisma.feeAutoDeductionSetting.update({
          where: { id: setting.id },
          data: { last_run_at: now },
        });
      } catch (error) {
        this.logger.error(`Auto-deduction failed for fee ${setting.fee_id}`, error);
      }
    }

    this.logger.log('Auto-deduction job completed');
  }

  private async processFeDeduction(setting: any) {
    const unpaidRecords = await this.prisma.studentFeeRecord.findMany({
      where: {
        fee_id: setting.fee_id,
        is_completed: false,
        status: { in: [StudentFeeStatus.PENDING, StudentFeeStatus.PARTIAL] },
      },
      include: {
        student: { select: { user_id: true } },
      },
    });

    for (const record of unpaidRecords) {
      try {
        const wallet = await this.prisma.wallet.findFirst({
          where: {
            owner_id: record.student.user_id,
            owner_type: WalletOwnerType.STUDENT,
          },
        });

        if (!wallet || wallet.balance < record.balance) continue;

        await this.studentWalletService.payFeeFromWallet(
          setting.fee.school_id,
          record.student.user_id,
          {
            fee_id: record.fee_id,
            student_fee_record_id: record.id,
            amount: record.balance,
          },
        );

        this.logger.log(
          `Auto-deducted ${record.balance} for student ${record.student_id} on fee ${record.fee_id}`,
        );
      } catch (error) {
        this.logger.warn(
          `Auto-deduction skipped for student ${record.student_id}: ${error.message}`,
        );
      }
    }
  }
}
