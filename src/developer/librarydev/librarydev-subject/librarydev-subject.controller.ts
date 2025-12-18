import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { LibraryDevSubjectService } from './librarydev-subject.service';
import { ApiTags } from '@nestjs/swagger';

class CreateLibrarySubjectDevDto {
  platformId: string;
  name: string;
  code?: string;
  classId?: string;
  color?: string;
  description?: string;
}

class UpdateLibrarySubjectDevDto {
  name?: string;
  code?: string;
  classId?: string | null;
  color?: string;
  description?: string;
}

@ApiTags('Developer - Library Subject')
@Controller('developer/librarydev/subjects')
export class LibraryDevSubjectController {
  constructor(private readonly libraryDevSubjectService: LibraryDevSubjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
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
  async deleteSubject(@Param('id') id: string) {
    const result = await this.libraryDevSubjectService.deleteSubject(id);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }
}


