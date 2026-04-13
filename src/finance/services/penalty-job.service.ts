import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PenaltyType,
  PenaltyRecurrence,
  PenaltyStatus,
  StudentFeeStatus,
} from '@prisma/client';

@Injectable()
export class PenaltyJobService {
  private readonly logger = new Logger(PenaltyJobService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async applyDailyPenalties() {
    this.logger.log('Running daily penalty job...');

    const schools = await this.prisma.school.findMany({
      where: { status: 'approved' },
      select: { id: true },
    });

    for (const school of schools) {
      try {
        await this.processSchoolPenalties(school.id);
      } catch (error) {
        this.logger.error(`Penalty job failed for school ${school.id}`, error);
      }
    }

    this.logger.log('Daily penalty job completed');
  }

  private async processSchoolPenalties(schoolId: string) {
    const rulesWithFees = await this.prisma.feePenaltyRule.findMany({
      where: { school_id: schoolId, is_active: true },
      include: { fee: { select: { id: true, name: true } } },
    });

    const now = new Date();

    for (const rule of rulesWithFees) {
      const graceDate = new Date(now);
      graceDate.setDate(graceDate.getDate() - rule.grace_period_days);

      const statusFilter: StudentFeeStatus[] = rule.apply_to_partial_payers
        ? [StudentFeeStatus.PENDING, StudentFeeStatus.PARTIAL, StudentFeeStatus.OVERDUE]
        : [StudentFeeStatus.PENDING, StudentFeeStatus.OVERDUE];

      const overdueRecords = await this.prisma.studentFeeRecord.findMany({
        where: {
          fee_id: rule.fee_id,
          school_id: schoolId,
          is_completed: false,
          due_date: { lt: graceDate },
          status: { in: statusFilter },
        },
        select: { id: true, student_id: true, amount_owed: true, balance: true },
      });

      for (const record of overdueRecords) {
        try {
          await this.applyPenaltyToRecord(rule, record, now);
        } catch (error) {
          this.logger.error(
            `Failed to apply penalty to record ${record.id}`,
            error,
          );
        }
      }
    }
  }

  private async applyPenaltyToRecord(rule: any, record: any, now: Date) {
    const existingPenalties = await this.prisma.feeLatePenalty.findMany({
      where: { student_fee_record_id: record.id, penalty_rule_id: rule.id },
      orderBy: { applied_at: 'desc' },
    });

    if (rule.max_penalty_occurrences && existingPenalties.length >= rule.max_penalty_occurrences) {
      return;
    }

    const totalExistingAmount = existingPenalties.reduce(
      (sum, p) => sum + p.calculated_penalty_amount,
      0,
    );

    if (rule.max_penalty_amount && totalExistingAmount >= rule.max_penalty_amount) {
      return;
    }

    if (existingPenalties.length > 0) {
      const lastPenalty = existingPenalties[0];
      const lastDate = new Date(lastPenalty.applied_at);
      const daysSinceLast = Math.floor(
        (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (rule.recurrence === PenaltyRecurrence.ONE_TIME) return;
      if (rule.recurrence === PenaltyRecurrence.DAILY && daysSinceLast < 1) return;
      if (rule.recurrence === PenaltyRecurrence.WEEKLY && daysSinceLast < 7) return;
      if (rule.recurrence === PenaltyRecurrence.MONTHLY && daysSinceLast < 30) return;
    }

    let penaltyAmount: number;
    switch (rule.penalty_type) {
      case PenaltyType.FLAT_AMOUNT:
        penaltyAmount = rule.penalty_value;
        break;
      case PenaltyType.PERCENTAGE_OF_OUTSTANDING:
        penaltyAmount = (record.balance * rule.penalty_value) / 100;
        break;
      case PenaltyType.PERCENTAGE_OF_TOTAL:
        penaltyAmount = (record.amount_owed * rule.penalty_value) / 100;
        break;
      default:
        return;
    }

    if (rule.max_penalty_amount) {
      const remaining = rule.max_penalty_amount - totalExistingAmount;
      penaltyAmount = Math.min(penaltyAmount, remaining);
    }

    if (penaltyAmount <= 0) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.feeLatePenalty.create({
        data: {
          student_fee_record_id: record.id,
          student_id: record.student_id,
          fee_id: rule.fee_id,
          school_id: rule.school_id,
          penalty_rule_id: rule.id,
          occurrence_number: existingPenalties.length + 1,
          penalty_type: rule.penalty_type,
          penalty_value: rule.penalty_value,
          calculated_penalty_amount: penaltyAmount,
          status: PenaltyStatus.ACTIVE,
        },
      });

      await tx.studentFeeRecord.update({
        where: { id: record.id },
        data: {
          amount_owed: { increment: penaltyAmount },
          balance: { increment: penaltyAmount },
        },
      });
    });
  }
}
