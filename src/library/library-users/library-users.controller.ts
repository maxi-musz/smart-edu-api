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
  Query,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LibraryUsersService } from './library-users.service';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { LibraryElevatedGuard } from '../library-auth/guard/library-elevated.guard';
import { LibraryOwnerGuard } from '../library-auth/guard/library-owner.guard';
import { CreateLibraryUserDto, UpdateLibraryUserDto, LibraryDashboardQueryDto, UpdatePermissionDto } from './dto';

@ApiTags('Library - Users (elevated)')
@Controller('library/users')
@UseGuards(LibraryJwtGuard)
@ApiBearerAuth()
export class LibraryUsersController {
  constructor(private readonly libraryUsersService: LibraryUsersService) {}

  /** Dashboard for the current user's library: library info, summary & content stats, schools with access, paginated users (search, sort, filter). Any logged-in library user. */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Library users dashboard' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboard(@Request() req: any, @Query() query: LibraryDashboardQueryDto) {
    const platformId = req.user?.platform_id;
    if (!platformId) throw new UnauthorizedException('Library authentication required');
    return this.libraryUsersService.getDashboard(platformId, query);
  }

  /** List library users who can manage/upload (elevated permission or manage_library_users required). */
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryElevatedGuard)
  @ApiResponse({ status: 200, description: 'List of library users' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async list(@Request() req: any) {
    const platformId = req.libraryUser.platformId;
    return this.libraryUsersService.list(platformId);
  }

  /** Upload analytics: who uploaded what, how many uploaders, counts by type. Library owner/manager only. (Must be before :id) */
  @Get('analytics/upload-analytics')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryOwnerGuard)
  @ApiResponse({ status: 200, description: 'Upload analytics' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin/manager only)' })
  async getUploadAnalytics(@Request() req: any) {
    const platformId = req.libraryUser.platformId;
    return this.libraryUsersService.getUploadAnalytics(platformId);
  }

  /** Fetch all available permissions (catalog) for assigning to library users. Library owner/manager only. (Must be before :id) */
  @Get('available-permissions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryOwnerGuard)
  @ApiResponse({ status: 200, description: 'List of available permission definitions' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin/manager only)' })
  async getAvailablePermissions() {
    return this.libraryUsersService.getAvailablePermissions();
  }

  /** Get one library user by id (elevated only). */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryElevatedGuard)
  @ApiResponse({ status: 200, description: 'Library user' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getOne(@Request() req: any, @Param('id') id: string) {
    const platformId = req.libraryUser.platformId;
    return this.libraryUsersService.getOne(platformId, id);
  }

  /** Create a library user (elevated only). */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryElevatedGuard)
  @ApiResponse({ status: 201, description: 'Library user created' })
  @ApiResponse({ status: 400, description: 'Bad Request (e.g. email already exists)' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async create(@Request() req: any, @Body() dto: CreateLibraryUserDto) {
    const platformId = req.libraryUser.platformId;
    const creatorId = req.libraryUser.id;
    return this.libraryUsersService.create(platformId, dto, creatorId);
  }

  /** Add or remove a permission for a library user (elevated only). Body: { action: "add" | "remove", permissionCode: "..." }. Must be before PATCH :id. */
  @Patch(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryElevatedGuard)
  @ApiResponse({ status: 200, description: 'Permission updated (added or removed)' })
  @ApiResponse({ status: 400, description: 'Bad Request (invalid action, permission not in catalog, already present, or not present)' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updatePermission(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    const platformId = req.libraryUser.platformId;
    return this.libraryUsersService.updatePermission(platformId, id, dto.action, dto.permissionCode);
  }

  /** Update a library user (elevated only). */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryElevatedGuard)
  @ApiResponse({ status: 200, description: 'Library user updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateLibraryUserDto) {
    const platformId = req.libraryUser.platformId;
    return this.libraryUsersService.update(platformId, id, dto);
  }

  /** Delete a library user (elevated only). */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryElevatedGuard)
  @ApiResponse({ status: 200, description: 'Library user deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async remove(@Request() req: any, @Param('id') id: string) {
    const platformId = req.libraryUser.platformId;
    return this.libraryUsersService.remove(platformId, id);
  }
}
