import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { PaymentController } from './payment.controller';
import { PaymentProcessorService } from 'src/shared/services/payment-processor.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AcademicSessionModule } from '../../../academic-session/academic-session.module';

@Module({
  imports: [PrismaModule, AcademicSessionModule],
  controllers: [FinanceController, PaymentController],
  providers: [FinanceService, PaymentProcessorService],
  exports: [FinanceService, PaymentProcessorService]
})
export class FinanceModule {}
