import { Controller, Get, HttpCode, HttpStatus, UseGuards, Request, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ResourcesService } from './resources.service';
import { GetResourcesDashboardDocs, GetResourcesByClassDocs } from './docs/resources.docs';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';

@ApiTags('Library Resources')
@Controller('library/resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('getresourcesdashboard')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @GetResourcesDashboardDocs.operation
  @GetResourcesDashboardDocs.response200
  @GetResourcesDashboardDocs.response401
  @GetResourcesDashboardDocs.response404
  @GetResourcesDashboardDocs.response500
  async getResourcesDashboard(@Request() req: any) {
    return this.resourcesService.getResourcesDashboard(req.user);
  }

  @Get('getresourcesbyclass/:classId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @GetResourcesByClassDocs.operation
  @GetResourcesByClassDocs.response200
  @GetResourcesByClassDocs.response401
  @GetResourcesByClassDocs.response404
  @GetResourcesByClassDocs.response500
  async getResourcesByClass(@Request() req: any, @Param('classId') classId: string) {
    return this.resourcesService.getResourcesByClass(req.user, classId);
  }
}

