import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExamBodyYearService } from './exam-body-year.service';
import { CreateExamBodyYearDto, UpdateExamBodyYearDto } from './dto';

@ApiTags('Developer - Exam Body Years')
@ApiBearerAuth()
@Controller('developer/exam-bodies/:examBodyId/years')
export class ExamBodyYearController {
  constructor(private readonly service: ExamBodyYearService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('examBodyId') examBodyId: string,
    @Body() createDto: CreateExamBodyYearDto,
  ) {
    return this.service.create(examBodyId, createDto);
  }

  @Get()
  findAll(@Param('examBodyId') examBodyId: string) {
    return this.service.findAll(examBodyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateExamBodyYearDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

