import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlatformSubscriptionBillingMode } from '@prisma/client';

export class InitiatePlatformSubscriptionDto {
  @ApiProperty({ description: 'Catalog template id (`PlatformSubscriptionPlan` with `is_template: true`)' })
  @IsString()
  template_id: string;

  @ApiProperty({ enum: PlatformSubscriptionBillingMode })
  @IsEnum(PlatformSubscriptionBillingMode)
  billing_mode: PlatformSubscriptionBillingMode;

  @ApiPropertyOptional({
    description: 'Required for MONTHLY_BLOCK; must be ≥ 3. Ignored for YEARLY (stored as 12).',
    minimum: 3,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(120)
  months?: number;

  @ApiPropertyOptional({ description: 'Return URL after Paystack / Flutterwave (defaults to FRONTEND_URL/admin/subscription)' })
  @IsOptional()
  @IsString()
  callback_url?: string;
}
