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

  
}


