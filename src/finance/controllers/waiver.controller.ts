import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { WaiverService } from '../services/waiver.service';
import { EligibilityService } from '../services/eligibility.service';
import { CreateWaiverDto, WaiverQueryDto, RejectWaiverDto, RevokeWaiverDto } from '../dto/waiver.dto';
import * as colors from 'colors';

@ApiTags('Finance - Waivers')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId')
export class WaiverController {
  private readonly logger = new Logger(WaiverController.name);

  constructor(
    private readonly waiverService: WaiverService,
    private readonly eligibilityService: EligibilityService,
  ) {}

  @Post('waivers')
  async create(
    @Param('schoolId') schoolId: string,
    @GetUser() user: User,
    @Body() body: CreateWaiverDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/waivers — userId: ${user.id}`));
    try {
      const result = await this.waiverService.create(schoolId, user.id, body);
      this.logger.log(colors.green('✅ HTTP Response: Waiver created successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to create waiver'), error.stack);
      throw error;
    }
  }

  @Get('waivers')
  async findAll(
    @Param('schoolId') schoolId: string,
    @Query() query: WaiverQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/waivers — query: ${JSON.stringify(query)}`));
    try {
      const result = await this.waiverService.findAll(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Waivers list returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch waivers'), error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/waivers')
  async getStudentWaivers(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query() query: WaiverQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/students/${studentId}/waivers`));
    try {
      const result = await this.waiverService.getStudentWaivers(schoolId, studentId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Waivers for student ${studentId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch waivers for student ${studentId}`), error.stack);
      throw error;
    }
  }

  @Put('waivers/:waiverId/approve')
  async approve(
    @Param('schoolId') schoolId: string,
    @Param('waiverId') waiverId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/waivers/${waiverId}/approve — userId: ${user.id}`));
    try {
      const result = await this.waiverService.approve(schoolId, waiverId, user.id);
      this.logger.log(colors.green(`✅ HTTP Response: Waiver ${waiverId} approved successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to approve waiver ${waiverId}`), error.stack);
      throw error;
    }
  }

  @Put('waivers/:waiverId/reject')
  async reject(
    @Param('schoolId') schoolId: string,
    @Param('waiverId') waiverId: string,
    @GetUser() user: User,
    @Body() body: RejectWaiverDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/waivers/${waiverId}/reject — userId: ${user.id}`));
    try {
      const result = await this.waiverService.reject(schoolId, waiverId, user.id, body.rejection_reason);
      this.logger.log(colors.green(`✅ HTTP Response: Waiver ${waiverId} rejected successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to reject waiver ${waiverId}`), error.stack);
      throw error;
    }
  }

  @Put('waivers/:waiverId/revoke')
  async revoke(
    @Param('schoolId') schoolId: string,
    @Param('waiverId') waiverId: string,
    @GetUser() user: User,
    @Body() body: RevokeWaiverDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/waivers/${waiverId}/revoke — userId: ${user.id}`));
    try {
      const result = await this.waiverService.revoke(schoolId, waiverId, user.id, body.revocation_reason);
      this.logger.log(colors.green(`✅ HTTP Response: Waiver ${waiverId} revoked successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to revoke waiver ${waiverId}`), error.stack);
      throw error;
    }
  }

  @Get('fees/:feeId/eligibility-check')
  async checkEligibility(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/fees/${feeId}/eligibility-check`));
    try {
      const result = await this.eligibilityService.checkEligibility(schoolId, feeId);
      this.logger.log(colors.green(`✅ HTTP Response: Eligibility check for fee ${feeId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to check eligibility for fee ${feeId}`), error.stack);
      throw error;
    }
  }
}
