import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { PricingAdminAuthGuard } from './guards/pricing-admin-auth.guard';
import { PlatformSubscriptionPaymentStatus } from '@prisma/client';
import {
  PlatformSubscriptionAnalyticsService,
  type PlatformSubscriptionPaymentStatusFilter,
} from './platform-subscription-analytics.service';

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
    summary: 'Paginated SMEH subscription payments (all statuses)',
    description:
      'Filter with `status`: all (default), CONFIRMED, PENDING, FAILED, CANCELLED. Ordered by createdAt desc.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'all | CONFIRMED | PENDING | FAILED | CANCELLED',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({ description: 'Not school super_admin or library admin' })
  listPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const p = page ? parseInt(page, 10) : undefined;
    const l = limit ? parseInt(limit, 10) : undefined;
    const raw = (status ?? 'all').trim().toLowerCase();
    let filter: PlatformSubscriptionPaymentStatusFilter = 'all';
    if (raw && raw !== 'all') {
      const u = raw.toUpperCase();
      if (
        u === PlatformSubscriptionPaymentStatus.CONFIRMED ||
        u === PlatformSubscriptionPaymentStatus.PENDING ||
        u === PlatformSubscriptionPaymentStatus.FAILED ||
        u === PlatformSubscriptionPaymentStatus.CANCELLED
      ) {
        filter = u as PlatformSubscriptionPaymentStatus;
      }
    }
    return this.analytics.listRecentPayments(p, l, filter);
  }

  @Post('payments/:paymentId/reverify')
  @ApiOperation({
    summary: 'Re-verify a platform subscription payment with Paystack / Flutterwave',
    description:
      'Calls the active provider for the reference on file. Idempotent: already CONFIRMED payments are not settled twice.',
  })
  reverifyPayment(@Param('paymentId') paymentId: string) {
    return this.analytics.reverifyPlatformSubscriptionPayment(paymentId);
  }
}
