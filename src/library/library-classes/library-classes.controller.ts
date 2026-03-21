import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LibraryClassesService } from './library-classes.service';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../library-auth/guard/library-owner.guard';
import { CreateLibraryClassDto, UpdateLibraryClassDto } from './dto';

@ApiTags('Library — Classes (curriculum)')
@Controller('library/library-classes')
@UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
@ApiBearerAuth()
export class LibraryClassesController {
  constructor(private readonly libraryClassesService: LibraryClassesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a library class',
    description:
      'Creates a global curriculum class (e.g. JSS 1, SS 2) used to group library subjects. Admin/manager only.',
  })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Duplicate name' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not admin/manager)' })
  create(@Body() dto: CreateLibraryClassDto) {
    return this.libraryClassesService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all library classes', description: 'Ordered by `order`. Admin/manager only.' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not admin/manager)' })
  list() {
    return this.libraryClassesService.list();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get one library class by id', description: 'Includes related subjects. Admin/manager only.' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not admin/manager)' })
  getOne(@Param('id') id: string) {
    return this.libraryClassesService.getOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a library class', description: 'Admin/manager only.' })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Duplicate name' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not admin/manager)' })
  update(@Param('id') id: string, @Body() dto: UpdateLibraryClassDto) {
    return this.libraryClassesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a library class',
    description:
      'Fails if any library subject still references this class. Admin/manager only.',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 400, description: 'Class still has subjects' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (not admin/manager)' })
  remove(@Param('id') id: string) {
    return this.libraryClassesService.remove(id);
  }
}
