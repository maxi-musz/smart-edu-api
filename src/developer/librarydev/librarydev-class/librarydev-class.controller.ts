import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { LibraryDevClassService } from './librarydev-class.service';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { CreateLibraryClassDevDto, UpdateLibraryClassDevDto } from './dto';
import {
  CreateLibraryClassDevDocs,
  ListLibraryClassDevDocs,
  GetLibraryClassDevDocs,
  UpdateLibraryClassDevDocs,
  DeleteLibraryClassDevDocs,
} from './docs/librarydev-class.docs';

@ApiTags('Developer - Library Class')
@Controller('developer/librarydev/classes')
export class LibraryDevClassController {
  constructor(private readonly libraryDevClassService: LibraryDevClassService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateLibraryClassDevDocs.operation
  @CreateLibraryClassDevDocs.response201
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createClass(@Body() dto: CreateLibraryClassDevDto) {
    return this.libraryDevClassService.createClass(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ListLibraryClassDevDocs.operation
  @ListLibraryClassDevDocs.response200
  async listClasses(@Query('platformId') platformId: string) {
    return this.libraryDevClassService.listClasses(platformId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @GetLibraryClassDevDocs.operation
  @GetLibraryClassDevDocs.response200
  async getClass(@Param('id') id: string) {
    return this.libraryDevClassService.getClass(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UpdateLibraryClassDevDocs.operation
  @UpdateLibraryClassDevDocs.response200
  async updateClass(@Param('id') id: string, @Body() dto: UpdateLibraryClassDevDto) {
    return this.libraryDevClassService.updateClass(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @DeleteLibraryClassDevDocs.operation
  @DeleteLibraryClassDevDocs.response200
  async deleteClass(@Param('id') id: string) {
    return this.libraryDevClassService.deleteClass(id);
  }
}


