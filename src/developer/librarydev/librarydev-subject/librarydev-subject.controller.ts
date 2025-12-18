import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { LibraryDevSubjectService } from './librarydev-subject.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CreateLibrarySubjectDevDto, UpdateLibrarySubjectDevDto } from './dto';
import {
  CreateLibrarySubjectDevDocs,
  ListLibrarySubjectDevDocs,
  GetLibrarySubjectDevDocs,
  UpdateLibrarySubjectDevDocs,
  DeleteLibrarySubjectDevDocs,
} from './docs/librarydev-subject.docs';

@ApiTags('Developer - Library Subject')
@Controller('developer/librarydev/subjects')
export class LibraryDevSubjectController {
  constructor(private readonly libraryDevSubjectService: LibraryDevSubjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateLibrarySubjectDevDocs.operation
  @CreateLibrarySubjectDevDocs.response201
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createSubject(@Body() dto: CreateLibrarySubjectDevDto) {
    const result = await this.libraryDevSubjectService.createSubject(dto);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ListLibrarySubjectDevDocs.operation
  @ListLibrarySubjectDevDocs.response200
  async listSubjects(
    @Query('platformId') platformId: string,
    @Query('classId') classId?: string,
  ) {
    const result = await this.libraryDevSubjectService.listSubjects(platformId, classId);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @GetLibrarySubjectDevDocs.operation
  @GetLibrarySubjectDevDocs.response200
  async getSubject(@Param('id') id: string) {
    const result = await this.libraryDevSubjectService.getSubject(id);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UpdateLibrarySubjectDevDocs.operation
  @UpdateLibrarySubjectDevDocs.response200
  async updateSubject(@Param('id') id: string, @Body() dto: UpdateLibrarySubjectDevDto) {
    const result = await this.libraryDevSubjectService.updateSubject(id, dto);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @DeleteLibrarySubjectDevDocs.operation
  @DeleteLibrarySubjectDevDocs.response200
  async deleteSubject(@Param('id') id: string) {
    const result = await this.libraryDevSubjectService.deleteSubject(id);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }
}


