import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { LibraryDevService } from './librarydev.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateLibraryDevDocs,
  GetLibraryDevDocs,
  ListLibraryDevDocs,
  UpdateLibraryDevDocs,
  DeleteLibraryDevDocs,
  AddLibraryOwnerDocs,
} from './docs/librarydev.docs';
import { AddLibraryOwnerDto, CreateLibraryDevDto, UpdateLibraryDevDto } from './dto/librarydev.dto';

@ApiTags('Developer - Library')
@Controller('developer/librarydev')
export class LibraryDevController {
  constructor(private readonly libraryDevService: LibraryDevService) {}

  @Post('onboardnewlibrary')
  @HttpCode(HttpStatus.CREATED)
  @CreateLibraryDevDocs.operation
  @CreateLibraryDevDocs.response201
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async onboardNewLibrary(@Body() dto: CreateLibraryDevDto) {
    return this.libraryDevService.createLibrary(dto);
  }

  @Get('listalllibraries')
  @HttpCode(HttpStatus.OK)
  @ListLibraryDevDocs.operation
  @ListLibraryDevDocs.response200
  async listAllLibraries() {
    return this.libraryDevService.listAllLibraries();
  }

  @Get('getlibrary/:id')
  @HttpCode(HttpStatus.OK)
  @GetLibraryDevDocs.operation
  @GetLibraryDevDocs.response200
  async getLibrary(@Param('id') id: string) {
    return this.libraryDevService.getLibrary(id);
  }

  @Patch('updatelibrary/:id')
  @HttpCode(HttpStatus.OK)
  @UpdateLibraryDevDocs.operation
  @UpdateLibraryDevDocs.response200
  async updateLibrary(@Param('id') id: string, @Body() dto: UpdateLibraryDevDto) {
    return this.libraryDevService.updateLibrary(id, dto);
  }

  @Delete('deletelibrary/:id')
  @HttpCode(HttpStatus.OK)
  @DeleteLibraryDevDocs.operation
  @DeleteLibraryDevDocs.response200
  async deleteLibrary(@Param('id') id: string) {
    return this.libraryDevService.deleteLibrary(id);
  }

  @Post('add-library-owner')
  @HttpCode(HttpStatus.CREATED)
  @AddLibraryOwnerDocs.operation
  @AddLibraryOwnerDocs.response201
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async addLibraryOwner(@Body() dto: AddLibraryOwnerDto) {
    return this.libraryDevService.addLibraryOwner(dto);
  }
}


