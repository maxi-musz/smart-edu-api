import { Controller, Get, Post, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { StudentWalletService } from '../services/student-wallet.service';
import { PaystackService } from '../services/paystack.service';
import { ManualTopUpDto, PaystackTopUpDto, WalletPayFeeDto } from '../dto/wallet.dto';
import * as colors from 'colors';

@ApiTags('Finance - Student Wallet')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId/students/:studentId/wallet')
export class StudentWalletController {
  private readonly logger = new Logger(StudentWalletController.name);

  constructor(
    private readonly studentWalletService: StudentWalletService,
    private readonly paystackService: PaystackService,
  ) {}

  @Get()
  async getStudentWallet(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/students/${studentId}/wallet — get student wallet`));
    try {
      const result = await this.studentWalletService.getStudentWallet(schoolId, studentId);
      this.logger.log(colors.green(`✅ HTTP Response: Student ${studentId} wallet returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get wallet for student ${studentId}`), error.stack);
      throw error;
    }
  }

  @Post('topup/manual')
  async manualTopUp(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @GetUser() user: User,
    @Body() body: ManualTopUpDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/students/${studentId}/wallet/topup/manual — manual top-up`));
    try {
      const result = await this.studentWalletService.manualTopUp(schoolId, studentId, user.id, body);
      this.logger.log(colors.green(`✅ HTTP Response: Manual top-up for student ${studentId} completed successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed manual top-up for student ${studentId}`), error.stack);
      throw error;
    }
  }

  @Post('topup/paystack/initiate')
  async initiatePaystackTopUp(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Body() body: PaystackTopUpDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/students/${studentId}/wallet/topup/paystack/initiate — Paystack top-up`));
    try {
      const result = await this.paystackService.initiateWalletTopUp(schoolId, studentId, body);
      this.logger.log(colors.green(`✅ HTTP Response: Paystack top-up for student ${studentId} initiated successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to initiate Paystack top-up for student ${studentId}`), error.stack);
      throw error;
    }
  }

  @Post('pay-fee')
  async payFeeFromWallet(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Body() body: WalletPayFeeDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/students/${studentId}/wallet/pay-fee — pay fee from wallet`));
    try {
      const result = await this.studentWalletService.payFeeFromWallet(schoolId, studentId, body);
      this.logger.log(colors.green(`✅ HTTP Response: Fee paid from wallet for student ${studentId} successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to pay fee from wallet for student ${studentId}`), error.stack);
      throw error;
    }
  }
}
