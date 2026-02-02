import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { LibraryPermissionsService } from './library-permissions.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePermissionDefinitionDto, UpdatePermissionDefinitionDto } from './dto';

@ApiTags('Developer - Library Permissions')
@Controller('developer/library-permissions')
export class LibraryPermissionsController {
  constructor(private readonly libraryPermissionsService: LibraryPermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 201, description: 'Permission definition created' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g. code already exists)' })
  async create(@Body() dto: CreatePermissionDefinitionDto) {
    return this.libraryPermissionsService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'List of permission definitions' })
  async findAll() {
    return this.libraryPermissionsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Permission definition by id' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(@Param('id') id: string) {
    return this.libraryPermissionsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Permission definition updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(@Param('id') id: string, @Body() dto: UpdatePermissionDefinitionDto) {
    return this.libraryPermissionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Permission definition deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id') id: string) {
    return this.libraryPermissionsService.remove(id);
  }
}
