import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { PlatformSubscriptionService } from './platform-subscription.service';
import { InitiatePlatformSubscriptionDto } from './dto/initiate-platform-subscription.dto';

@ApiTags('Director — SMEH subscription')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('director/platform-subscription')
export class PlatformSubscriptionController {
  constructor(private readonly platformSubscriptionService: PlatformSubscriptionService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Current plan, spend summary, recent payments, catalog hints' })
  async dashboard(
    @GetUser() user: { sub: string; school_id: string },
  ) {
    return this.platformSubscriptionService.getDashboard(user.school_id, user.sub);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Paginated platform subscription payment history' })
  async payments(
    @GetUser() user: { sub: string; school_id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : undefined;
    const l = limit ? parseInt(limit, 10) : undefined;
    return this.platformSubscriptionService.listPayments(user.school_id, user.sub, p, l);
  }

  @Post('initiate')
  @ApiOperation({ summary: 'Start Paystack / Flutterwave checkout for SMEH plan' })
  async initiate(
    @GetUser() user: { sub: string; school_id: string },
    @Body() body: InitiatePlatformSubscriptionDto,
  ) {
    return this.platformSubscriptionService.initiate(user.school_id, user.sub, body);
  }
}
