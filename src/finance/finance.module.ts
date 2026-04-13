import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuditModule } from 'src/audit/audit.module';
import { PaymentModule } from 'src/payment/payment.module';
import { PlatformSubscriptionModule } from 'src/platform-subscription/platform-subscription.module';

// Services
import { FeeService } from './services/fee.service';
import { StudentFeeService } from './services/student-fee.service';
import { FeePaymentService } from './services/fee-payment.service';
import { PaystackService } from './services/paystack.service';
import { SchoolWalletService } from './services/school-wallet.service';
import { StudentWalletService } from './services/student-wallet.service';
import { ParentWalletService } from './services/parent-wallet.service';
import { WalletAnalyticsService } from './services/wallet-analytics.service';
import { ScholarshipService } from './services/scholarship.service';
import { WaiverService } from './services/waiver.service';
import { PenaltyService } from './services/penalty.service';
import { PenaltyJobService } from './services/penalty-job.service';
import { OverdueJobService } from './services/overdue-job.service';
import { AutoDeductionJobService } from './services/auto-deduction-job.service';
import { RefundService } from './services/refund.service';
import { ExpenseService } from './services/expense.service';
import { ReceiptService } from './services/receipt.service';
import { TransactionService } from './services/transaction.service';
import { AnalyticsReportService } from './services/analytics-report.service';
import { EligibilityService } from './services/eligibility.service';

// Controllers
import { FeeController } from './controllers/fee.controller';
import { StudentFeeController } from './controllers/student-fee.controller';
import { PaymentController } from './controllers/payment.controller';
import { PaystackController, PaystackWebhookController } from './controllers/paystack.controller';
import { SchoolWalletController } from './controllers/school-wallet.controller';
import { StudentWalletController } from './controllers/student-wallet.controller';
import { ParentWalletController } from './controllers/parent-wallet.controller';
import { ScholarshipController } from './controllers/scholarship.controller';
import { WaiverController } from './controllers/waiver.controller';
import { PenaltyController } from './controllers/penalty.controller';
import { RefundController } from './controllers/refund.controller';
import { ExpenseController } from './controllers/expense.controller';
import { TransactionController } from './controllers/transaction.controller';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    PaymentModule,
    PlatformSubscriptionModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    FeeController,
    StudentFeeController,
    PaymentController,
    PaystackController,
    PaystackWebhookController,
    SchoolWalletController,
    StudentWalletController,
    ParentWalletController,
    ScholarshipController,
    WaiverController,
    PenaltyController,
    RefundController,
    ExpenseController,
    TransactionController,
    AnalyticsController,
  ],
  providers: [
    FeeService,
    StudentFeeService,
    FeePaymentService,
    PaystackService,
    SchoolWalletService,
    StudentWalletService,
    ParentWalletService,
    WalletAnalyticsService,
    ScholarshipService,
    WaiverService,
    PenaltyService,
    PenaltyJobService,
    OverdueJobService,
    AutoDeductionJobService,
    RefundService,
    ExpenseService,
    ReceiptService,
    TransactionService,
    AnalyticsReportService,
    EligibilityService,
  ],
  exports: [
    FeeService,
    StudentWalletService,
    SchoolWalletService,
    WalletAnalyticsService,
    PaystackService,
  ],
})
export class FinanceModule {}
