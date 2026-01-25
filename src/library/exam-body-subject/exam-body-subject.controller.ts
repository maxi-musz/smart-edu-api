import { Controller, Get, Post, Patch, Delete, Param, Body, UploadedFile, UseGuards, UseInterceptors, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../library-auth/guard/library-owner.guard';
import { LibraryExamBodySubjectService } from './exam-body-subject.service';
import { CreateLibraryExamBodySubjectDto, UpdateLibraryExamBodySubjectDto } from './dto';
import { LibraryExamBodySubjectDocs } from './docs/exam-body-subject.docs';

@ApiTags('Exam Body Subjects')
@ApiBearerAuth()
@Controller('exam-bodies/:examBodyId/subjects')
export class LibraryExamBodySubjectController {
  constructor(private readonly service: LibraryExamBodySubjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  @LibraryExamBodySubjectDocs.create.operation
  @LibraryExamBodySubjectDocs.create.body
  @LibraryExamBodySubjectDocs.create.response201
  @LibraryExamBodySubjectDocs.create.response400
  @LibraryExamBodySubjectDocs.create.response401
  @LibraryExamBodySubjectDocs.create.response403
  create(
    @Param('examBodyId') examBodyId: string,
    @Body() createDto: CreateLibraryExamBodySubjectDto,
    @UploadedFile() iconFile?: Express.Multer.File,
  ) {
    return this.service.create(examBodyId, createDto, iconFile);
  }

  @Get()
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodySubjectDocs.findAll.operation
  @LibraryExamBodySubjectDocs.findAll.response200
  findAll(@Param('examBodyId') examBodyId: string) {
    return this.service.findAll(examBodyId);
  }

  @Get(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodySubjectDocs.findOne.operation
  @LibraryExamBodySubjectDocs.findOne.param
  @LibraryExamBodySubjectDocs.findOne.response200
  @LibraryExamBodySubjectDocs.findOne.response404
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  @LibraryExamBodySubjectDocs.update.operation
  @LibraryExamBodySubjectDocs.update.body
  @LibraryExamBodySubjectDocs.update.response200
  @LibraryExamBodySubjectDocs.update.response404
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLibraryExamBodySubjectDto,
    @UploadedFile() iconFile?: Express.Multer.File,
  ) {
    return this.service.update(id, updateDto, iconFile);
  }

  @Delete(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @LibraryExamBodySubjectDocs.remove.operation
  @LibraryExamBodySubjectDocs.remove.response200
  @LibraryExamBodySubjectDocs.remove.response404
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
