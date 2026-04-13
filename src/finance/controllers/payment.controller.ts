import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { FeePaymentService } from '../services/fee-payment.service';
import { ReceiptService } from '../services/receipt.service';
import { RecordPaymentDto, PaymentQueryDto } from '../dto/payment.dto';
import * as colors from 'colors';

@ApiTags('Finance - Payments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId/payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly feePaymentService: FeePaymentService,
    private readonly receiptService: ReceiptService,
  ) {}

  @Post()
  async recordPayment(
    @Param('schoolId') schoolId: string,
    @GetUser() user: User,
    @Body() body: RecordPaymentDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/payments — record payment`));
    try {
      const result = await this.feePaymentService.recordPayment(schoolId, user.id, body);
      this.logger.log(colors.green('✅ HTTP Response: Payment recorded successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to record payment for school ${schoolId}`), error.stack);
      throw error;
    }
  }

  @Put(':paymentId/reverse')
  async reversePayment(
    @Param('schoolId') schoolId: string,
    @Param('paymentId') paymentId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/payments/${paymentId}/reverse — reverse payment`));
    try {
      const result = await this.feePaymentService.reversePayment(schoolId, paymentId, user.id);
      this.logger.log(colors.green(`✅ HTTP Response: Payment ${paymentId} reversed successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to reverse payment ${paymentId}`), error.stack);
      throw error;
    }
  }

  @Get(':paymentId')
  async getPayment(
    @Param('schoolId') schoolId: string,
    @Param('paymentId') paymentId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/payments/${paymentId} — get payment details`));
    try {
      const result = await this.feePaymentService.getPayment(schoolId, paymentId);
      this.logger.log(colors.green(`✅ HTTP Response: Payment ${paymentId} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get payment ${paymentId}`), error.stack);
      throw error;
    }
  }

  @Get(':paymentId/receipt')
  async getReceipt(
    @Param('schoolId') schoolId: string,
    @Param('paymentId') paymentId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/payments/${paymentId}/receipt — get receipt`));
    try {
      const result = await this.receiptService.getReceiptData(schoolId, paymentId);
      this.logger.log(colors.green(`✅ HTTP Response: Receipt for payment ${paymentId} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get receipt for payment ${paymentId}`), error.stack);
      throw error;
    }
  }
}
