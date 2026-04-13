import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ExpenseService } from '../services/expense.service';
import { CreateExpenseDto, ExpenseQueryDto } from '../dto/expense.dto';
import * as colors from 'colors';

@ApiTags('Finance - Expenses')
@Controller('finance/:schoolId/expenses')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ExpenseController {
  private readonly logger = new Logger(ExpenseController.name);

  constructor(private readonly expenseService: ExpenseService) {}

  @Post()
  async create(
    @Param('schoolId') schoolId: string,
    @GetUser() user: User,
    @Body() body: CreateExpenseDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/expenses — userId: ${user.id}`));
    try {
      const result = await this.expenseService.create(schoolId, user.id, body);
      this.logger.log(colors.green('✅ HTTP Response: Expense created successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to create expense'), error.stack);
      throw error;
    }
  }

  @Get()
  async findAll(
    @Param('schoolId') schoolId: string,
    @Query() query: ExpenseQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/expenses — query: ${JSON.stringify(query)}`));
    try {
      const result = await this.expenseService.findAll(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Expenses list returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch expenses'), error.stack);
      throw error;
    }
  }

  @Put(':expenseId/approve')
  async approve(
    @Param('schoolId') schoolId: string,
    @Param('expenseId') expenseId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/expenses/${expenseId}/approve — userId: ${user.id}`));
    try {
      const result = await this.expenseService.approve(schoolId, expenseId, user.id);
      this.logger.log(colors.green(`✅ HTTP Response: Expense ${expenseId} approved successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to approve expense ${expenseId}`), error.stack);
      throw error;
    }
  }

  @Put(':expenseId/reject')
  async reject(
    @Param('schoolId') schoolId: string,
    @Param('expenseId') expenseId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/expenses/${expenseId}/reject — userId: ${user.id}`));
    try {
      const result = await this.expenseService.reject(schoolId, expenseId, user.id);
      this.logger.log(colors.green(`✅ HTTP Response: Expense ${expenseId} rejected successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to reject expense ${expenseId}`), error.stack);
      throw error;
    }
  }
}
