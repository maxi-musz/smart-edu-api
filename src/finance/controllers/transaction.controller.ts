import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { TransactionService } from '../services/transaction.service';
import { TransactionQueryDto } from '../dto/transaction.dto';
import * as colors from 'colors';

@ApiTags('Finance - Transactions')
@Controller('finance/:schoolId')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

  @Get('transactions')
  async getSchoolTransactions(
    @Param('schoolId') schoolId: string,
    @Query() query: TransactionQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/transactions — query: ${JSON.stringify(query)}`));
    try {
      const result = await this.transactionService.getSchoolTransactions(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: School transactions returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch school transactions'), error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/transactions')
  async getStudentTransactions(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query() query: TransactionQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/students/${studentId}/transactions`));
    try {
      const result = await this.transactionService.getStudentTransactions(schoolId, studentId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Transactions for student ${studentId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch transactions for student ${studentId}`), error.stack);
      throw error;
    }
  }

  @Get('fees/:feeId/payments')
  async getPerFeePayments(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
    @Query() query: TransactionQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/fees/${feeId}/payments`));
    try {
      const result = await this.transactionService.getPerFeePayments(schoolId, feeId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Payments for fee ${feeId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch payments for fee ${feeId}`), error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/wallet/topups')
  async getStudentTopUps(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query() query: TransactionQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/students/${studentId}/wallet/topups`));
    try {
      const result = await this.transactionService.getStudentTopUps(schoolId, studentId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Wallet top-ups for student ${studentId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch wallet top-ups for student ${studentId}`), error.stack);
      throw error;
    }
  }
}
