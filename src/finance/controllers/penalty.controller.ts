import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { PenaltyService } from '../services/penalty.service';
import { CreatePenaltyRuleDto, UpdatePenaltyRuleDto, PenaltyQueryDto, WaivePenaltyDto } from '../dto/penalty.dto';
import * as colors from 'colors';

@ApiTags('Finance - Penalties')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId')
export class PenaltyController {
  private readonly logger = new Logger(PenaltyController.name);

  constructor(private readonly penaltyService: PenaltyService) {}

  @Post('fees/:feeId/penalty-rule')
  async createRule(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
    @GetUser() user: User,
    @Body() body: CreatePenaltyRuleDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/fees/${feeId}/penalty-rule — userId: ${user.id}`));
    try {
      const result = await this.penaltyService.createRule(schoolId, feeId, user.id, body);
      this.logger.log(colors.green(`✅ HTTP Response: Penalty rule created for fee ${feeId}`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to create penalty rule for fee ${feeId}`), error.stack);
      throw error;
    }
  }

  @Get('fees/:feeId/penalty-rule')
  async getRule(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/fees/${feeId}/penalty-rule`));
    try {
      const result = await this.penaltyService.getRule(schoolId, feeId);
      this.logger.log(colors.green(`✅ HTTP Response: Penalty rule for fee ${feeId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch penalty rule for fee ${feeId}`), error.stack);
      throw error;
    }
  }

  @Put('fees/:feeId/penalty-rule')
  async updateRule(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
    @Body() body: UpdatePenaltyRuleDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/fees/${feeId}/penalty-rule`));
    try {
      const result = await this.penaltyService.updateRule(schoolId, feeId, body);
      this.logger.log(colors.green(`✅ HTTP Response: Penalty rule for fee ${feeId} updated`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to update penalty rule for fee ${feeId}`), error.stack);
      throw error;
    }
  }

  @Delete('fees/:feeId/penalty-rule')
  async deactivateRule(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: DELETE /finance/${schoolId}/fees/${feeId}/penalty-rule`));
    try {
      const result = await this.penaltyService.deactivateRule(schoolId, feeId);
      this.logger.log(colors.green(`✅ HTTP Response: Penalty rule for fee ${feeId} deactivated`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to deactivate penalty rule for fee ${feeId}`), error.stack);
      throw error;
    }
  }

  @Get('penalties')
  async getPenalties(
    @Param('schoolId') schoolId: string,
    @Query() query: PenaltyQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/penalties — query: ${JSON.stringify(query)}`));
    try {
      const result = await this.penaltyService.getPenalties(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Penalties list returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch penalties'), error.stack);
      throw error;
    }
  }

  @Get('students/:studentId/penalties')
  async getStudentPenalties(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query() query: PenaltyQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/students/${studentId}/penalties`));
    try {
      const result = await this.penaltyService.getStudentPenalties(schoolId, studentId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Penalties for student ${studentId} returned`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to fetch penalties for student ${studentId}`), error.stack);
      throw error;
    }
  }

  @Put('penalties/:penaltyId/waive')
  async waivePenalty(
    @Param('schoolId') schoolId: string,
    @Param('penaltyId') penaltyId: string,
    @GetUser() user: User,
    @Body() body: WaivePenaltyDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/penalties/${penaltyId}/waive — userId: ${user.id}`));
    try {
      const result = await this.penaltyService.waivePenalty(schoolId, penaltyId, user.id, body.waiver_reason);
      this.logger.log(colors.green(`✅ HTTP Response: Penalty ${penaltyId} waived successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to waive penalty ${penaltyId}`), error.stack);
      throw error;
    }
  }
}
