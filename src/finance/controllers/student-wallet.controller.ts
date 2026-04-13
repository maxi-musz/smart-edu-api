import { Controller, Get, Post, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { StudentWalletService } from '../services/student-wallet.service';
import { ManualTopUpDto, WalletTopUpInitiateDto, WalletPayFeeDto } from '../dto/wallet.dto';
import { assertStudentFinanceAccess } from '../common/finance-access.util';
import * as colors from 'colors';

@ApiTags('Finance - Student Wallet')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId/students/:studentId/wallet')
export class StudentWalletController {
  private readonly logger = new Logger(StudentWalletController.name);

  constructor(
    private readonly studentWalletService: StudentWalletService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getStudentWallet(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @GetUser() user: User,
  ) {
    await assertStudentFinanceAccess(this.prisma, user, schoolId, studentId);
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
    await assertStudentFinanceAccess(this.prisma, user, schoolId, studentId);
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

  @Post('topup/initiate')
  async initiateWalletTopUp(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @GetUser() user: User,
    @Body() body: WalletTopUpInitiateDto,
  ) {
    await assertStudentFinanceAccess(this.prisma, user, schoolId, studentId);
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/students/${studentId}/wallet/topup/initiate — wallet top-up`));
    try {
      const result = await this.studentWalletService.initiateWalletTopUp(schoolId, studentId, body);
      this.logger.log(colors.green(`✅ HTTP Response: Wallet top-up for student ${studentId} initiated successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to initiate wallet top-up for student ${studentId}`), error.stack);
      throw error;
    }
  }

  /** @deprecated Use POST .../topup/initiate (provider from PAYMENT_PROVIDER). */
  @Post('topup/paystack/initiate')
  async initiatePaystackTopUpLegacy(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @GetUser() user: User,
    @Body() body: WalletTopUpInitiateDto,
  ) {
    return this.initiateWalletTopUp(schoolId, studentId, user, body);
  }

  @Post('pay-fee')
  async payFeeFromWallet(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @GetUser() user: User,
    @Body() body: WalletPayFeeDto,
  ) {
    await assertStudentFinanceAccess(this.prisma, user, schoolId, studentId);
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
