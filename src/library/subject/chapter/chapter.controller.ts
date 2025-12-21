import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Patch, Param } from '@nestjs/common';
import { ChapterService } from './chapter.service';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';
import { LibraryJwtGuard } from '../../library-auth/guard/library-jwt.guard';
import { CreateChapterDocs, UpdateChapterDocs } from './docs/chapter.docs';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Library Chapter')
@Controller('library/subject/chapter')
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @Post('createchapter')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @CreateChapterDocs.operation
  @CreateChapterDocs.body
  @CreateChapterDocs.response201
  @CreateChapterDocs.response400
  @CreateChapterDocs.response401
  @CreateChapterDocs.response404
  @CreateChapterDocs.response500
  async createChapter(
    @Request() req: any,
    @Body() payload: CreateChapterDto,
  ) {
    return await this.chapterService.createChapter(req.user, payload);
  }

  @Patch('updatechapter/:chapterId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UpdateChapterDocs.operation
  @UpdateChapterDocs.body
  @UpdateChapterDocs.response200
  @UpdateChapterDocs.response400
  @UpdateChapterDocs.response401
  @UpdateChapterDocs.response404
  @UpdateChapterDocs.response500
  async updateChapter(
    @Request() req: any,
    @Param('chapterId') chapterId: string,
    @Body() payload: UpdateChapterDto,
  ) {
    return await this.chapterService.updateChapter(req.user, chapterId, payload);
  }
}

