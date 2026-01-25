import { Controller, Get, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../library-auth/guard/library-owner.guard';
import { LibraryExamBodyService } from './exam-body.service';
import { LibraryExamBodyDocs } from './docs/exam-body.docs';

@ApiTags('Exam Bodies')
@ApiBearerAuth()
@Controller('exam-bodies')
export class LibraryExamBodyController {
  constructor(private readonly service: LibraryExamBodyService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodyDocs.findAll.operation
  @LibraryExamBodyDocs.findAll.response200
  @LibraryExamBodyDocs.findAll.response401
  @LibraryExamBodyDocs.findAll.response403
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodyDocs.findOne.operation
  @LibraryExamBodyDocs.findOne.param
  @LibraryExamBodyDocs.findOne.response200
  @LibraryExamBodyDocs.findOne.response404
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
