import { Controller, Get, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PricingService } from './pricing.service';
import { PricingStructureResponseDto } from './dto/pricing-structure-response.dto';

/**
 * Smart Edu platform SaaS catalog (subscription plan templates).
 * Public read — no student fee or school-internal payment flows.
 */
@ApiTags('Smart Edu - Pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get(['structure', 'get-pricing-structure'])
  @ApiOperation({
    summary: 'Get platform subscription pricing structure',
    description:
      'Returns active plan templates (`PlatformSubscriptionPlan` with `is_template: true`, `school_id: null`). ' +
      'Intended for marketing and school-owner signup / upgrade flows. Empty `plans` if no templates are configured.',
  })
  @ApiOkResponse({
    description: 'Catalog of subscription plan templates',
    type: PricingStructureResponseDto,
  })
  async getPricingStructure(@Res() res: Response): Promise<void> {
    const result = await this.pricingService.getPricingStructure();
    const body = JSON.stringify(result);

    // Avoid 304 + empty body (browser conditional GET / Express ETag); frontend must receive JSON.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).contentType('application/json; charset=utf-8').send(body);
  }
}
