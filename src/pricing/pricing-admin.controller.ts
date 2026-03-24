import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PricingAdminAuthGuard } from './guards/pricing-admin-auth.guard';
import { PricingService } from './pricing.service';
import { CreatePlanTemplateDto } from './dto/create-plan-template.dto';
import { UpdatePlanTemplateDto } from './dto/update-plan-template.dto';
import { PricingPlanCatalogItemDto } from './dto/pricing-structure-response.dto';

/**
 * Manage catalog plan templates (`school_id: null`, `is_template: true`).
 * Auth: school `super_admin` JWT **or** library platform `admin` JWT (see `PricingAdminAuthGuard`).
 */
@ApiTags('Smart Edu - Pricing (Admin)')
@ApiBearerAuth('JWT-auth')
@UseGuards(PricingAdminAuthGuard)
@Controller('pricing/admin/plan-templates')
export class PricingAdminController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a subscription plan template',
    description:
      'Creates a catalog row only (`school_id` null, `is_template` true). Omitted fields use database defaults.',
  })
  @ApiBody({ type: CreatePlanTemplateDto })
  @ApiCreatedResponse({
    description: 'Created template (same shape as public catalog items)',
    type: PricingPlanCatalogItemDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({
    description: 'Not school super_admin or library admin',
  })
  @ApiBadRequestResponse({ description: 'Validation error' })
  createTemplate(
    @Body() dto: CreatePlanTemplateDto,
  ): Promise<PricingPlanCatalogItemDto> {
    return this.pricingService.createPlanTemplate(dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a subscription plan template',
    description:
      'School `super_admin` or library `admin`. Target must be a template row (not a school copy).',
  })
  @ApiBody({ type: UpdatePlanTemplateDto })
  @ApiOkResponse({
    description: 'Updated template',
    type: PricingPlanCatalogItemDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @ApiForbiddenResponse({
    description: 'Not school super_admin or library admin',
  })
  @ApiNotFoundResponse({ description: 'Template id not found or not a template' })
  @ApiBadRequestResponse({
    description: 'Validation error or empty PATCH body',
  })
  updateTemplate(
    @Param('id') id: string,
    @Body() dto: UpdatePlanTemplateDto,
  ): Promise<PricingPlanCatalogItemDto> {
    return this.pricingService.updatePlanTemplate(id, dto);
  }
}
