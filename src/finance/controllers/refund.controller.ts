import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { RefundService } from '../services/refund.service';
import { CreateRefundDto, RefundQueryDto, RejectRefundDto } from '../dto/refund.dto';
import * as colors from 'colors';

@ApiTags('Finance - Refunds')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId')
export class RefundController {
  private readonly logger = new Logger(RefundController.name);

  constructor(private readonly refundService: RefundService) {}

  @Post('refunds')
  async create(
    @Param('schoolId') schoolId: string,
    @GetUser() user: User,
    @Body() body: CreateRefundDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/refunds — userId: ${user.id}`));
    try {
      const result = await this.refundService.create(schoolId, user.id, body);
      this.logger.log(colors.green('✅ HTTP Response: Refund created successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to create refund'), error.stack);
      throw error;
    }
  }

  @Get('refunds')
  async findAll(
    @Param('schoolId') schoolId: string,
    @Query() query: RefundQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/refunds — query: ${JSON.stringify(query)}`));
    try {
      const result = await this.refundService.findAll(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Refunds list returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch refunds'), error.stack);
      throw error;
    }
  }

  @Get('refunds/:refundId')
  async findOne(
    @Param('schoolId') schoolId: string,
    @Param('refundId') refundId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/refunds/${refundId}`));
    try {
      const result = await this.refundService.findOne(schoolId, refundId);
      this.logger.log(colors.green(`✅ HTTP Response: Refund ${refundId} details returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch refund ${refundId}`), error.stack);
      throw error;
    }
  }

  @Put('refunds/:refundId/approve')
  async approve(
    @Param('schoolId') schoolId: string,
    @Param('refundId') refundId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/refunds/${refundId}/approve — userId: ${user.id}`));
    try {
      const result = await this.refundService.approve(schoolId, refundId, user.id);
      this.logger.log(colors.green(`✅ HTTP Response: Refund ${refundId} approved successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to approve refund ${refundId}`), error.stack);
      throw error;
    }
  }

  @Put('refunds/:refundId/reject')
  async reject(
    @Param('schoolId') schoolId: string,
    @Param('refundId') refundId: string,
    @GetUser() user: User,
    @Body() body: RejectRefundDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/refunds/${refundId}/reject — userId: ${user.id}`));
    try {
      const result = await this.refundService.reject(schoolId, refundId, user.id, body.rejection_reason);
      this.logger.log(colors.green(`✅ HTTP Response: Refund ${refundId} rejected successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to reject refund ${refundId}`), error.stack);
      throw error;
    }
  }

  @Put('refunds/:refundId/mark-completed')
  async markCompleted(
    @Param('schoolId') schoolId: string,
    @Param('refundId') refundId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/refunds/${refundId}/mark-completed — userId: ${user.id}`));
    try {
      const result = await this.refundService.markCompleted(schoolId, refundId, user.id);
      this.logger.log(colors.green(`✅ HTTP Response: Refund ${refundId} marked as completed`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to mark refund ${refundId} as completed`), error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/refunds')
  async getStudentRefunds(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query() query: RefundQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/students/${studentId}/refunds`));
    try {
      const result = await this.refundService.getStudentRefunds(schoolId, studentId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Refunds for student ${studentId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch refunds for student ${studentId}`), error.stack);
      throw error;
    }
  }

  @Get('payments/:paymentId/refunds')
  async getPaymentRefunds(
    @Param('schoolId') schoolId: string,
    @Param('paymentId') paymentId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/payments/${paymentId}/refunds`));
    try {
      const result = await this.refundService.getPaymentRefunds(schoolId, paymentId);
      this.logger.log(colors.green(`✅ HTTP Response: Refunds for payment ${paymentId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch refunds for payment ${paymentId}`), error.stack);
      throw error;
    }
  }
}
