import { Controller, Get, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { GeneralMaterialsService } from './general-materials.service';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Library General Materials')
@Controller('library/general-materials')
export class GeneralMaterialsController {
  constructor(private readonly generalMaterialsService: GeneralMaterialsService) {}

  // Placeholder endpoints - will be implemented
  @Get('test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  async test(@Request() req: any) {
    return { message: 'General Materials module is ready' };
  }
}

