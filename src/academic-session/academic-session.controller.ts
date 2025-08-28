import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus
} from '@nestjs/common';
import { AcademicSessionService } from './academic-session.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';
import { AcademicSessionDocs } from './api-docs/academic-session.docs';
import { JwtGuard } from '../school/auth/guard/jwt.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Academic Sessions')
@Controller('academic-sessions')
@UseGuards(JwtGuard)
export class AcademicSessionController {
  constructor(private readonly academicSessionService: AcademicSessionService) {}

  @Post()
  @AcademicSessionDocs.bearerAuth
  @AcademicSessionDocs.createOperation
  @AcademicSessionDocs.createResponse201
  @AcademicSessionDocs.response400
  @AcademicSessionDocs.response401
  @AcademicSessionDocs.response500
  async create(@Body() createDto: CreateAcademicSessionDto) {
    return await this.academicSessionService.create(createDto);
  }

  @Get()
  @AcademicSessionDocs.bearerAuth
  @AcademicSessionDocs.findAllOperation
  @AcademicSessionDocs.findAllQueries
  @AcademicSessionDocs.findAllResponse200
  @AcademicSessionDocs.response400
  @AcademicSessionDocs.response401
  @AcademicSessionDocs.response500
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('school_id') school_id?: string,
    @Query('term') term?: string,
    @Query('status') status?: string,
    @Query('is_current') is_current?: string,
    @Query('sort_by') sort_by?: string,
    @Query('sort_order') sort_order?: 'asc' | 'desc'
  ) {
    const filters = {
      school_id,
      term: term as any,
      status: status as any,
      is_current: is_current === 'true' ? true : is_current === 'false' ? false : undefined
    };

    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      sort_by: sort_by || 'createdAt',
      sort_order: sort_order || 'desc'
    };

    return await this.academicSessionService.findAll(filters, options);
  }

  @Get('current')
  @AcademicSessionDocs.bearerAuth
  @AcademicSessionDocs.getCurrentSessionOperation
  @AcademicSessionDocs.getCurrentSessionResponse200
  @AcademicSessionDocs.response401
  @AcademicSessionDocs.response404
  @AcademicSessionDocs.response500
  async getCurrentSession(@Query('school_id') school_id: string) {
    return await this.academicSessionService.getCurrentSession(school_id);
  }

  @Get('year-range')
  @AcademicSessionDocs.bearerAuth
  async getSessionsByYearRange(
    @Query('school_id') school_id: string,
    @Query('start_year') start_year: string,
    @Query('end_year') end_year: string
  ) {
    return await this.academicSessionService.getSessionsByYearRange(
      school_id,
      parseInt(start_year),
      parseInt(end_year)
    );
  }

  @Get(':id')
  @AcademicSessionDocs.bearerAuth
  @AcademicSessionDocs.findOneOperation
  @AcademicSessionDocs.findOneParam
  @AcademicSessionDocs.findOneResponse200
  @AcademicSessionDocs.response401
  @AcademicSessionDocs.response404
  @AcademicSessionDocs.response500
  async findOne(@Param('id') id: string) {
    return await this.academicSessionService.findOne(id);
  }

  @Patch(':id')
  @AcademicSessionDocs.bearerAuth
  @AcademicSessionDocs.updateOperation
  @AcademicSessionDocs.updateResponse200
  @AcademicSessionDocs.response400
  @AcademicSessionDocs.response401
  @AcademicSessionDocs.response404
  @AcademicSessionDocs.response500
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAcademicSessionDto
  ) {
    return await this.academicSessionService.update(id, updateDto);
  }

  @Delete(':id')
  @AcademicSessionDocs.bearerAuth
  @AcademicSessionDocs.deleteOperation
  @AcademicSessionDocs.deleteResponse200
  @AcademicSessionDocs.response401
  @AcademicSessionDocs.response404
  @AcademicSessionDocs.response500
  async remove(@Param('id') id: string) {
    return await this.academicSessionService.remove(id);
  }

  @Post('transition')
  @AcademicSessionDocs.bearerAuth
  async transitionToNewAcademicYear(
    @Query('school_id') school_id: string,
    @Body() newSessionData: {
      academic_year: string;
      start_year: number;
      end_year: number;
      term: 'first' | 'second' | 'third';
      start_date: string;
      end_date: string;
    }
  ) {
    return await this.academicSessionService.transitionToNewAcademicYear(
      school_id,
      newSessionData
    );
  }
}
