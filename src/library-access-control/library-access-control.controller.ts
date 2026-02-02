import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { LibraryAccessControlService } from './library-access-control.service';
import {
  GrantAccessDto,
  GrantBulkAccessDto,
  UpdateAccessDto,
  RevokeAccessDto,
  ExcludeResourceDto,
  QuerySchoolsWithAccessDto,
  QuerySchoolAccessDetailsDto,
} from './dto';
import { GetUser } from '../library/library-auth/decorator/get-user.decorator';
import { LibraryJwtGuard } from '../library/library-auth/guard/library-jwt.guard';

@ApiTags('Library Access Control')
@ApiBearerAuth()
@UseGuards(LibraryJwtGuard)
@Controller('library-access-control')
export class LibraryAccessControlController {
  constructor(private readonly accessControlService: LibraryAccessControlService) {}

  @Post('grant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Grant a school access to library resources',
    description: 'Library owners can grant schools access to their resources (subjects, topics, videos, materials, assessments)',
  })
  @ApiResponse({ status: 201, description: 'Access granted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid resource IDs or school already has access' })
  @ApiResponse({ status: 404, description: 'School or resource not found' })
  async grantAccess(@GetUser() user: any, @Body() dto: GrantAccessDto) {
    return this.accessControlService.grantAccess(user, dto);
  }

  @Post('grant-bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Grant multiple schools access to the same resource',
    description: 'Bulk grant access to multiple schools at once',
  })
  @ApiResponse({ status: 201, description: 'Bulk access granted' })
  @ApiResponse({ status: 400, description: 'Bad request - some schools not found or invalid' })
  async grantBulkAccess(@GetUser() user: any, @Body() dto: GrantBulkAccessDto) {
    return this.accessControlService.grantBulkAccess(user, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing access grant',
    description: 'Update access level, expiration date, or activate/deactivate access',
  })
  @ApiParam({ name: 'id', description: 'Access grant ID' })
  @ApiResponse({ status: 200, description: 'Access updated successfully' })
  @ApiResponse({ status: 404, description: 'Access grant not found' })
  async updateAccess(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAccessDto,
  ) {
    return this.accessControlService.updateAccess(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke access',
    description: 'Revoke a school\'s access to a resource (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'Access grant ID' })
  @ApiResponse({ status: 200, description: 'Access revoked successfully' })
  @ApiResponse({ status: 404, description: 'Access grant not found' })
  async revokeAccess(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto?: RevokeAccessDto,
  ) {
    return this.accessControlService.revokeAccess(user, id, dto);
  }

  @Post('exclude')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Exclude (turn off) a resource under a subject grant',
    description: 'When library owner grants a subject, all topics/videos/materials/assessments are on by default. Use this to turn off individual items.',
  })
  @ApiResponse({ status: 201, description: 'Resource excluded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - missing resource ID' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async excludeResource(@GetUser() user: any, @Body() dto: ExcludeResourceDto) {
    return this.accessControlService.excludeResource(user, dto);
  }

  @Post('include')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Include (turn on) a previously excluded resource',
    description: 'Remove the exclusion so the resource is visible again under the subject grant.',
  })
  @ApiResponse({ status: 200, description: 'Resource included successfully' })
  async includeResource(@GetUser() user: any, @Body() dto: ExcludeResourceDto) {
    return this.accessControlService.includeResource(user, dto);
  }

  @Get('schools')
  @ApiOperation({
    summary: 'Get all schools with access to platform resources',
    description: 'Retrieve a paginated list of schools that have been granted access',
  })
  @ApiResponse({ status: 200, description: 'Schools retrieved successfully' })
  async getSchoolsWithAccess(
    @GetUser() user: any,
    @Query() query: QuerySchoolsWithAccessDto,
  ) {
    return this.accessControlService.getSchoolsWithAccess(user, query);
  }

  @Get('schools/:schoolId')
  @ApiOperation({
    summary: 'Get detailed access information for a specific school',
    description: 'View all resources a school has access to with detailed information',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiResponse({ status: 200, description: 'School access details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'School not found' })
  async getSchoolAccessDetails(
    @GetUser() user: any,
    @Param('schoolId') schoolId: string,
    @Query() query: QuerySchoolAccessDetailsDto,
  ) {
    return this.accessControlService.getSchoolAccessDetails(user, schoolId, query);
  }
}
