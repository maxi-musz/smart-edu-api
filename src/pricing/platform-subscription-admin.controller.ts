import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { PricingAdminAuthGuard } from './guards/pricing-admin-auth.guard';
import { PlatformSubscriptionAnalyticsService } from './platform-subscription-analytics.service';

/**
 * SMEH platform subscription analytics for operators (library admin JWT or school super_admin JWT).
 */
@ApiTags('Smart Edu - Platform subscription (Admin)')
@ApiBearerAuth('JWT-auth')
@UseGuards(PricingAdminAuthGuard)
@Controller('pricing/admin/platform-subscription')
export class PlatformSubscriptionAdminController {
  constructor(private readonly analytics: PlatformSubscriptionAnalyticsService) {}

  @Get('analytics')
  @ApiOperation({
    summary: 'Platform-wide subscription KPIs',
    description:
      'School counts by plan type, template count, confirmed revenue (rollup + aggregates), platform wallet snapshot.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Not school super_admin or library admin' })
  getOverview() {
    return this.analytics.getOverview();
  }

  @Get('payments')
  @ApiOperation({
    summary: 'Paginated confirmed SMEH subscription payments',
    description: 'Most recent confirmed payments with school and template names.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Not school super_admin or library admin' })
  listPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : undefined;
    const l = limit ? parseInt(limit, 10) : undefined;
    return this.analytics.listRecentPayments(p, l);
  }
}
