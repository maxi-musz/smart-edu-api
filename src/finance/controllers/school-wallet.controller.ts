import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { SchoolWalletService } from '../services/school-wallet.service';
import * as colors from 'colors';

@ApiTags('Finance - School Wallet')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId/wallet')
export class SchoolWalletController {
  private readonly logger = new Logger(SchoolWalletController.name);

  constructor(private readonly schoolWalletService: SchoolWalletService) {}

  @Get()
  async getWalletWithAnalytics(@Param('schoolId') schoolId: string) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/wallet — get wallet with analytics`));
    try {
      const result = await this.schoolWalletService.getWalletWithAnalytics(schoolId);
      this.logger.log(colors.green(`✅ HTTP Response: School wallet analytics for ${schoolId} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get wallet analytics for school ${schoolId}`), error.stack);
      throw error;
    }
  }

  @Get('ledger')
  async getWalletLedger(
    @Param('schoolId') schoolId: string,
    @Query() query: any,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/wallet/ledger — get wallet ledger`));
    try {
      const result = await this.schoolWalletService.getWalletLedger(schoolId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Wallet ledger for school ${schoolId} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get wallet ledger for school ${schoolId}`), error.stack);
      throw error;
    }
  }
}
