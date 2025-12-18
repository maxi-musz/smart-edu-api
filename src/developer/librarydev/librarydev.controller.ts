import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { LibraryDevService } from './librarydev.service';
import { ApiTags } from '@nestjs/swagger';

class CreateLibraryPlatformDevDto {
  name: string;
  slug: string;
  description?: string;
}

class UpdateLibraryPlatformDevDto {
  name?: string;
  slug?: string;
  description?: string;
}

@ApiTags('Developer - Library')
@Controller('developer/librarydev')
export class LibraryDevController {
  constructor(private readonly libraryDevService: LibraryDevService) {}

  @Post('platforms')
  @HttpCode(HttpStatus.CREATED)
  async createPlatform(@Body() dto: CreateLibraryPlatformDevDto) {
    const result = await this.libraryDevService.createPlatform(dto);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Get('platforms')
  @HttpCode(HttpStatus.OK)
  async listPlatforms() {
    const result = await this.libraryDevService.listPlatforms();
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Get('platforms/:id')
  @HttpCode(HttpStatus.OK)
  async getPlatform(@Param('id') id: string) {
    const result = await this.libraryDevService.getPlatform(id);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Patch('platforms/:id')
  @HttpCode(HttpStatus.OK)
  async updatePlatform(@Param('id') id: string, @Body() dto: UpdateLibraryPlatformDevDto) {
    const result = await this.libraryDevService.updatePlatform(id, dto);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Delete('platforms/:id')
  @HttpCode(HttpStatus.OK)
  async deletePlatform(@Param('id') id: string) {
    const result = await this.libraryDevService.deletePlatform(id);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }
}


