import { Controller, Get, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { AnalyticsReportService } from '../services/analytics-report.service';
import { AnalyticsQueryDto } from '../dto/transaction.dto';
import * as colors from 'colors';

@ApiTags('Finance - Analytics')
@Controller('finance/:schoolId')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsReportService: AnalyticsReportService) {}

  @Get('dashboard')
  async getDashboard(@Param('schoolId') schoolId: string) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/dashboard`));
    try {
      const result = await this.analyticsReportService.getDashboard(schoolId);
      this.logger.log(colors.green('✅ HTTP Response: Dashboard data returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch dashboard'), error.stack);
      throw error;
    }
  }

  @Get('reports/session-summary')
  async getSessionSummary(
    @Param('schoolId') schoolId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/reports/session-summary`));
    try {
      const result = await this.analyticsReportService.getSessionSummary(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Session summary report returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch session summary report'), error.stack);
      throw error;
    }
  }

  @Get('reports/class-breakdown')
  async getClassBreakdown(
    @Param('schoolId') schoolId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/reports/class-breakdown`));
    try {
      const result = await this.analyticsReportService.getClassBreakdown(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Class breakdown report returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch class breakdown report'), error.stack);
      throw error;
    }
  }

  @Get('reports/fee-breakdown')
  async getFeeBreakdown(
    @Param('schoolId') schoolId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/reports/fee-breakdown`));
    try {
      const result = await this.analyticsReportService.getFeeBreakdown(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Fee breakdown report returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch fee breakdown report'), error.stack);
      throw error;
    }
  }

  @Get('reports/payment-methods')
  async getPaymentMethodBreakdown(
    @Param('schoolId') schoolId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/reports/payment-methods`));
    try {
      const result = await this.analyticsReportService.getPaymentMethodBreakdown(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Payment methods breakdown returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch payment methods breakdown'), error.stack);
      throw error;
    }
  }

  @Get('reports/overdue')
  async getOverdueReport(
    @Param('schoolId') schoolId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/reports/overdue`));
    try {
      const result = await this.analyticsReportService.getOverdueReport(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Overdue report returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch overdue report'), error.stack);
      throw error;
    }
  }

  @Get('reports/penalties')
  async getPenaltyReport(@Param('schoolId') schoolId: string) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/reports/penalties`));
    try {
      const result = await this.analyticsReportService.getPenaltyReport(schoolId);
      this.logger.log(colors.green('✅ HTTP Response: Penalty report returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch penalty report'), error.stack);
      throw error;
    }
  }

  @Get('reports/refunds')
  async getRefundReport(@Param('schoolId') schoolId: string) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/reports/refunds`));
    try {
      const result = await this.analyticsReportService.getRefundReport(schoolId);
      this.logger.log(colors.green('✅ HTTP Response: Refund report returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch refund report'), error.stack);
      throw error;
    }
  }

  @Get('reports/scholarships')
  async getScholarshipReport(
    @Param('schoolId') schoolId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/reports/scholarships`));
    try {
      const result = await this.analyticsReportService.getScholarshipReport(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Scholarship report returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch scholarship report'), error.stack);
      throw error;
    }
  }
}
