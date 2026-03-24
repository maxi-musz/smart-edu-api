import { Module } from '@nestjs/common';
import { AuthModule } from '../school/auth/auth.module';
import { PricingController } from './pricing.controller';
import { PricingAdminController } from './pricing-admin.controller';
import { PricingService } from './pricing.service';
import { PricingAdminAuthGuard } from './guards/pricing-admin-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [PricingController, PricingAdminController],
  providers: [PricingService, PricingAdminAuthGuard],
})
export class PricingModule {}
