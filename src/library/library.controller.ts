import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Logger, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { LibraryService } from './library.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import * as colors from 'colors';
import { LibraryJwtGuard } from './library-auth/guard/library-jwt.guard';
import { GetLibraryDashboardDocs } from './docs/library.docs';

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

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @GetLibraryDashboardDocs.operation
  @GetLibraryDashboardDocs.response200
  @GetLibraryDashboardDocs.response401
  @GetLibraryDashboardDocs.response404
  async getLibraryDashboard(@Request() req: any) {
    return this.libraryService.getLibraryDashboard(req.user);
  }
}


