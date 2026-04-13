import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  Param,
  Logger,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { PaystackService } from '../services/paystack.service';
import { InitiatePaystackPaymentDto } from '../dto/payment.dto';
import { Request } from 'express';
import * as colors from 'colors';

@ApiTags('Finance - Paystack')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId/payments/paystack')
export class PaystackController {
  private readonly logger = new Logger(PaystackController.name);

  constructor(private readonly paystackService: PaystackService) {}

  @Post('initiate')
  async initiateFeePayment(
    @Param('schoolId') schoolId: string,
    @Body() body: InitiatePaystackPaymentDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/payments/paystack/initiate — initiate Paystack payment`));
    try {
      const result = await this.paystackService.initiateFeePayment(schoolId, body);
      this.logger.log(colors.green('✅ HTTP Response: Paystack payment initiated successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to initiate Paystack payment for school ${schoolId}`), error.stack);
      throw error;
    }
  }
}

@ApiTags('Finance - Paystack')
@Controller('finance')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(private readonly paystackService: PaystackService) {}

  @Get('payments/verify')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async verifyPaymentUnified(@Query('reference') reference: string) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/payments/verify — reference: ${reference}`));
    try {
      const result = await this.paystackService.verifyUnified(reference);
      this.logger.log(colors.green(`✅ HTTP Response: Payment verification for reference ${reference} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to verify payment reference ${reference}`), error.stack);
      throw error;
    }
  }

  @Get('payments/paystack/verify')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async verifyPaymentLegacy(@Query('reference') reference: string) {
    return this.verifyPaymentUnified(reference);
  }

  @Post('webhooks/paystack')
  async handleWebhook(
    @Body() body: any,
    @Req() req: Request,
  ) {
    this.logger.log(colors.blue('📥 HTTP Request: POST /finance/webhooks/paystack — handle Paystack webhook'));
    try {
      const result = await this.paystackService.handleWebhook(body, req.headers['x-paystack-signature'] as string);
      this.logger.log(colors.green('✅ HTTP Response: Paystack webhook processed successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to process Paystack webhook'), error.stack);
      throw error;
    }
  }

  @Post('webhooks/flutterwave')
  async handleFlutterwaveWebhook(
    @Body() body: any,
    @Headers('verif-hash') verifHash: string,
  ) {
    this.logger.log(colors.blue('📥 HTTP Request: POST /finance/webhooks/flutterwave'));
    try {
      const result = await this.paystackService.handleFlutterwaveWebhook(body, verifHash);
      this.logger.log(colors.green('✅ HTTP Response: Flutterwave webhook processed'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Flutterwave webhook failed'), error.stack);
      throw error;
    }
  }
}
