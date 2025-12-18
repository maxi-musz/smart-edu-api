import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { LibraryDevClassService } from './librarydev-class.service';
import { ApiTags } from '@nestjs/swagger';

class CreateLibraryClassDevDto {
  platformId: string;
  name: string;
  order?: number;
}

class UpdateLibraryClassDevDto {
  name?: string;
  order?: number;
}

@ApiTags('Developer - Library Class')
@Controller('developer/librarydev/classes')
export class LibraryDevClassController {
  constructor(private readonly libraryDevClassService: LibraryDevClassService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClass(@Body() dto: CreateLibraryClassDevDto) {
    const result = await this.libraryDevClassService.createClass(dto);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async listClasses(@Query('platformId') platformId: string) {
    const result = await this.libraryDevClassService.listClasses(platformId);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getClass(@Param('id') id: string) {
    const result = await this.libraryDevClassService.getClass(id);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async updateClass(@Param('id') id: string, @Body() dto: UpdateLibraryClassDevDto) {
    const result = await this.libraryDevClassService.updateClass(id, dto);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteClass(@Param('id') id: string) {
    const result = await this.libraryDevClassService.deleteClass(id);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }
}


