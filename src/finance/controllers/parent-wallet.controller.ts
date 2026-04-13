import { Controller, Get, Post, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ParentWalletService } from '../services/parent-wallet.service';
import { WalletTransferDto } from '../dto/wallet.dto';
import * as colors from 'colors';

@ApiTags('Finance - Parent Wallet')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId/parents/:parentId/wallet')
export class ParentWalletController {
  private readonly logger = new Logger(ParentWalletController.name);

  constructor(private readonly parentWalletService: ParentWalletService) {}

  @Get()
  async getParentWallet(
    @Param('schoolId') schoolId: string,
    @Param('parentId') parentId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/parents/${parentId}/wallet — get parent wallet`));
    try {
      const result = await this.parentWalletService.getParentWallet(schoolId, parentId);
      this.logger.log(colors.green(`✅ HTTP Response: Parent ${parentId} wallet returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get wallet for parent ${parentId}`), error.stack);
      throw error;
    }
  }

  @Post('transfer')
  async transferToChild(
    @Param('schoolId') schoolId: string,
    @Param('parentId') parentId: string,
    @GetUser() user: User,
    @Body() body: WalletTransferDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/parents/${parentId}/wallet/transfer — transfer to child`));
    try {
      const result = await this.parentWalletService.transferToChild(schoolId, parentId, user.id, body);
      this.logger.log(colors.green(`✅ HTTP Response: Transfer from parent ${parentId} to child completed successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to transfer from parent ${parentId} to child`), error.stack);
      throw error;
    }
  }
}
