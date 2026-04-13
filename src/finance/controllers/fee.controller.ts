import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { FeeService } from '../services/fee.service';
import { CreateFeeDto, UpdateFeeDto, FeeQueryDto } from '../dto/fee.dto';
import * as colors from 'colors';

@ApiTags('Finance - Fees')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId/fees')
export class FeeController {
  private readonly logger = new Logger(FeeController.name);

  constructor(private readonly feeService: FeeService) {}

  @Post()
  async create(
    @Param('schoolId') schoolId: string,
    @GetUser() user: User,
    @Body() body: CreateFeeDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/fees — create fee`));
    try {
      const result = await this.feeService.create(schoolId, user.id, body);
      this.logger.log(colors.green('✅ HTTP Response: Fee created successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to create fee for school ${schoolId}`), error.stack);
      throw error;
    }
  }

  @Get()
  async findAll(
    @Param('schoolId') schoolId: string,
    @Query() query: FeeQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/fees — list all fees`));
    try {
      const result = await this.feeService.findAll(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Fees list returned successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to list fees for school ${schoolId}`), error.stack);
      throw error;
    }
  }

  @Get(':feeId')
  async findOne(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/fees/${feeId} — get fee details`));
    try {
      const result = await this.feeService.findOne(schoolId, feeId);
      this.logger.log(colors.green(`✅ HTTP Response: Fee ${feeId} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get fee ${feeId} for school ${schoolId}`), error.stack);
      throw error;
    }
  }

  @Put(':feeId')
  async update(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
    @GetUser() user: User,
    @Body() body: UpdateFeeDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/fees/${feeId} — update fee`));
    try {
      const result = await this.feeService.update(schoolId, feeId, user.id, body);
      this.logger.log(colors.green(`✅ HTTP Response: Fee ${feeId} updated successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to update fee ${feeId} for school ${schoolId}`), error.stack);
      throw error;
    }
  }

  @Delete(':feeId')
  async delete(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: DELETE /finance/${schoolId}/fees/${feeId} — delete fee`));
    try {
      const result = await this.feeService.delete(schoolId, feeId, user.id);
      this.logger.log(colors.green(`✅ HTTP Response: Fee ${feeId} deleted successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to delete fee ${feeId} for school ${schoolId}`), error.stack);
      throw error;
    }
  }

  @Get(':feeId/students')
  async getFeeStudents(
    @Param('schoolId') schoolId: string,
    @Param('feeId') feeId: string,
    @Query() query: FeeQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/fees/${feeId}/students — get fee students`));
    try {
      const result = await this.feeService.getFeeStudents(schoolId, feeId, query);
      this.logger.log(colors.green(`✅ HTTP Response: Students for fee ${feeId} returned successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to get students for fee ${feeId}`), error.stack);
      throw error;
    }
  }
}
