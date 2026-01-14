import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExamBodyService } from './exam-body.service';
import { CreateExamBodyDto, UpdateExamBodyDto } from './dto';
import { ExamBodyDocs } from './docs/exam-body.docs';

@ApiTags('Developer - Exam Bodies')
@ApiBearerAuth()
@Controller('developer/exam-bodies')
export class ExamBodyController {
  constructor(private readonly examBodyService: ExamBodyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  @ExamBodyDocs.create()
  create(
    @Body() createDto: CreateExamBodyDto,
    @UploadedFile() iconFile: Express.Multer.File,
  ) {
    return this.examBodyService.create(createDto, iconFile);
  }

  @Get()
  @ExamBodyDocs.findAll()
  findAll() {
    return this.examBodyService.findAll();
  }

  @Get(':id')
  @ExamBodyDocs.findOne()
  findOne(@Param('id') id: string) {
    return this.examBodyService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('icon'))
  @ApiConsumes('multipart/form-data')
  @ExamBodyDocs.update()
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateExamBodyDto,
    @UploadedFile() iconFile?: Express.Multer.File,
  ) {
    return this.examBodyService.update(id, updateDto, iconFile);
  }

  @Delete(':id')
  @ExamBodyDocs.remove()
  remove(@Param('id') id: string) {
    return this.examBodyService.remove(id);
  }
}

