import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { User } from '@prisma/client';
import { ScholarshipService } from '../services/scholarship.service';
import { CreateScholarshipDto, UpdateScholarshipDto, ScholarshipQueryDto } from '../dto/scholarship.dto';
import * as colors from 'colors';

@ApiTags('Finance - Scholarships')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('finance/:schoolId/scholarships')
export class ScholarshipController {
  private readonly logger = new Logger(ScholarshipController.name);

  constructor(private readonly scholarshipService: ScholarshipService) {}

  @Post()
  async create(
    @Param('schoolId') schoolId: string,
    @GetUser() user: User,
    @Body() body: CreateScholarshipDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: POST /finance/${schoolId}/scholarships — userId: ${user.id}`));
    try {
      const result = await this.scholarshipService.create(schoolId, user.id, body);
      this.logger.log(colors.green('✅ HTTP Response: Scholarship created successfully'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to create scholarship'), error.stack);
      throw error;
    }
  }

  @Get()
  async findAll(
    @Param('schoolId') schoolId: string,
    @Query() query: ScholarshipQueryDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: GET /finance/${schoolId}/scholarships — query: ${JSON.stringify(query)}`));
    try {
      const result = await this.scholarshipService.findAll(schoolId, query);
      this.logger.log(colors.green('✅ HTTP Response: Scholarships list returned'));
      return result;
    } catch (error) {
      this.logger.error(colors.red('❌ HTTP Error: Failed to fetch scholarships'), error.stack);
      throw error;
    }
  }

  @Put(':scholarshipId')
  async update(
    @Param('schoolId') schoolId: string,
    @Param('scholarshipId') scholarshipId: string,
    @GetUser() user: User,
    @Body() body: UpdateScholarshipDto,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: PUT /finance/${schoolId}/scholarships/${scholarshipId} — userId: ${user.id}`));
    try {
      const result = await this.scholarshipService.update(schoolId, scholarshipId, user.id, body);
      this.logger.log(colors.green(`✅ HTTP Response: Scholarship ${scholarshipId} updated successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to update scholarship ${scholarshipId}`), error.stack);
      throw error;
    }
  }

  @Delete(':scholarshipId')
  async deactivate(
    @Param('schoolId') schoolId: string,
    @Param('scholarshipId') scholarshipId: string,
    @GetUser() user: User,
  ) {
    this.logger.log(colors.blue(`📥 HTTP Request: DELETE /finance/${schoolId}/scholarships/${scholarshipId} — userId: ${user.id}`));
    try {
      const result = await this.scholarshipService.deactivate(schoolId, scholarshipId, user.id);
      this.logger.log(colors.green(`✅ HTTP Response: Scholarship ${scholarshipId} deactivated successfully`));
      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ HTTP Error: Failed to deactivate scholarship ${scholarshipId}`), error.stack);
      throw error;
    }
  }
}
