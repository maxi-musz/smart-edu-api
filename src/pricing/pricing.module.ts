import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance/finance.module';
import { AuthModule } from '../school/auth/auth.module';
import { PricingController } from './pricing.controller';
import { PricingAdminController } from './pricing-admin.controller';
import { PlatformSubscriptionAdminController } from './platform-subscription-admin.controller';
import { PricingService } from './pricing.service';
import { PlatformSubscriptionAnalyticsService } from './platform-subscription-analytics.service';
import { PricingAdminAuthGuard } from './guards/pricing-admin-auth.guard';
@Module({
  imports: [AuthModule, FinanceModule],
  controllers: [
    PricingController,
    PricingAdminController,
    PlatformSubscriptionAdminController,
  ],
  providers: [
    PricingService,
    PlatformSubscriptionAnalyticsService,
    PricingAdminAuthGuard,
  ],
})
export class PricingModule {}
