import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExamBodySubjectService } from './exam-body-subject.service';
import { CreateExamBodySubjectDto, UpdateExamBodySubjectDto } from './dto';

@ApiTags('Developer - Exam Body Subjects')
@ApiBearerAuth()
@Controller('developer/exam-bodies/:examBodyId/subjects')
export class ExamBodySubjectController {
  constructor(private readonly service: ExamBodySubjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  create(
    @Param('examBodyId') examBodyId: string,
    @Body() createDto: CreateExamBodySubjectDto,
    @UploadedFile() iconFile?: Express.Multer.File,
  ) {
    return this.service.create(examBodyId, createDto, iconFile);
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
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExamBodySubjectDto,
    @UploadedFile() iconFile?: Express.Multer.File,
  ) {
    return this.service.update(id, updateDto, iconFile);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

