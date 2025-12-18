import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Logger, BadRequestException } from '@nestjs/common';
import { LibraryService } from './library.service';
import { ApiTags } from '@nestjs/swagger';
import * as colors from 'colors';

class CreateLibraryPlatformDto {
  name: string;
  slug: string;
  description?: string;
}

@ApiTags('Public Library')
@Controller('library')
export class LibraryController {
  private readonly logger = new Logger(LibraryController.name);

  constructor(private readonly libraryService: LibraryService) {}

  @Post('platforms')
  @HttpCode(HttpStatus.CREATED)
  async createPlatform(@Body() dto: CreateLibraryPlatformDto) {
    try {
      const result = await this.libraryService.createPlatform(dto);
      return {
        success: result.success,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      this.logger.error(colors.red(`Failed to create library platform: ${error.message}`));
      throw new BadRequestException(error.message);
    }
  }

  @Get('platforms')
  @HttpCode(HttpStatus.OK)
  async getPlatforms() {
    const result = await this.libraryService.getPlatforms();
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }

  @Get('platforms/:slug/explorer')
  @HttpCode(HttpStatus.OK)
  async getPlatformExplorer(@Param('slug') slug: string) {
    const result = await this.libraryService.getPlatformExplorer(slug);
    return {
      success: result.success,
      message: result.message,
      data: result.data,
    };
  }
}


