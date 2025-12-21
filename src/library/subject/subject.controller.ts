import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, UseInterceptors, UploadedFile, Patch, Param, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SubjectService } from './subject.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { CreateSubjectDocs, UpdateSubjectDocs, UpdateSubjectThumbnailDocs } from './docs/subject.docs';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Library Subject')
@Controller('library/subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post('createsubject')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  @CreateSubjectDocs.operation
  @CreateSubjectDocs.consumes
  @CreateSubjectDocs.body
  @CreateSubjectDocs.response201
  @CreateSubjectDocs.response400
  @CreateSubjectDocs.response401
  @CreateSubjectDocs.response404
  @CreateSubjectDocs.response500
  async createSubject(
    @Request() req: any,
    @Body() payload: CreateSubjectDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return await this.subjectService.createSubject(req.user, payload, thumbnail);
  }

  @Patch('updatesubject/:subjectId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UpdateSubjectDocs.operation
  @UpdateSubjectDocs.body
  @UpdateSubjectDocs.response200
  @UpdateSubjectDocs.response400
  @UpdateSubjectDocs.response401
  @UpdateSubjectDocs.response404
  @UpdateSubjectDocs.response500
  async updateSubject(
    @Request() req: any,
    @Param('subjectId') subjectId: string,
    @Body() payload: UpdateSubjectDto,
  ) {
    return await this.subjectService.updateSubject(req.user, subjectId, payload);
  }

  @Patch('updatesubjectthumbnail/:subjectId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  @UpdateSubjectThumbnailDocs.operation
  @UpdateSubjectThumbnailDocs.consumes
  @UpdateSubjectThumbnailDocs.body
  @UpdateSubjectThumbnailDocs.response200
  @UpdateSubjectThumbnailDocs.response400
  @UpdateSubjectThumbnailDocs.response401
  @UpdateSubjectThumbnailDocs.response404
  @UpdateSubjectThumbnailDocs.response500
  async updateSubjectThumbnail(
    @Request() req: any,
    @Param('subjectId') subjectId: string,
    @UploadedFile() thumbnail: Express.Multer.File,
  ) {
    if (!thumbnail) {
      throw new BadRequestException('Thumbnail file is required');
    }
    return await this.subjectService.updateSubjectThumbnail(req.user, subjectId, thumbnail);
  }
}

