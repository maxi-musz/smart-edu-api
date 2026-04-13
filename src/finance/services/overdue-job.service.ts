import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentFeeStatus } from '@prisma/client';

@Injectable()
export class OverdueJobService {
  private readonly logger = new Logger(OverdueJobService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markOverdueFees() {
    this.logger.log('Running overdue fee check...');

    const now = new Date();

    const result = await this.prisma.studentFeeRecord.updateMany({
      where: {
        due_date: { lt: now },
        status: { in: [StudentFeeStatus.PENDING, StudentFeeStatus.PARTIAL] },
        is_completed: false,
      },
      data: { status: StudentFeeStatus.OVERDUE },
    });

    this.logger.log(`Marked ${result.count} fee records as overdue`);
  }
}
