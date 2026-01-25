import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../library-auth/guard/library-owner.guard';
import { LibraryExamBodyYearService } from './exam-body-year.service';
import { CreateLibraryExamBodyYearDto, UpdateLibraryExamBodyYearDto } from './dto';
import { LibraryExamBodyYearDocs } from './docs/exam-body-year.docs';

@ApiTags('Exam Body Years')
@ApiBearerAuth()
@Controller('exam-bodies/:examBodyId/years')
export class LibraryExamBodyYearController {
  constructor(private readonly service: LibraryExamBodyYearService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodyYearDocs.create.operation
  @LibraryExamBodyYearDocs.create.body
  @LibraryExamBodyYearDocs.create.response201
  @LibraryExamBodyYearDocs.create.response400
  create(@Param('examBodyId') examBodyId: string, @Body() createDto: CreateLibraryExamBodyYearDto) {
    return this.service.create(examBodyId, createDto);
  }

  @Get()
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodyYearDocs.findAll.operation
  @LibraryExamBodyYearDocs.findAll.response200
  findAll(@Param('examBodyId') examBodyId: string) {
    return this.service.findAll(examBodyId);
  }

  @Get(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodyYearDocs.findOne.operation
  @LibraryExamBodyYearDocs.findOne.param
  @LibraryExamBodyYearDocs.findOne.response200
  @LibraryExamBodyYearDocs.findOne.response404
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodyYearDocs.update.operation
  @LibraryExamBodyYearDocs.update.body
  @LibraryExamBodyYearDocs.update.response200
  @LibraryExamBodyYearDocs.update.response404
  update(@Param('id') id: string, @Body() updateDto: UpdateLibraryExamBodyYearDto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodyYearDocs.remove.operation
  @LibraryExamBodyYearDocs.remove.response200
  @LibraryExamBodyYearDocs.remove.response404
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
