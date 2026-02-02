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
import { SchoolAccessControlService } from './school-access-control.service';
import {
  SchoolGrantAccessDto,
  SchoolGrantBulkAccessDto,
  SchoolUpdateAccessDto,
  SchoolRevokeAccessDto,
  QueryAvailableResourcesDto,
  QueryUserResourcesDto,
  SchoolExcludeSubjectDto,
} from './dto';
import { GetUser } from '../school/auth/decorator/get-user-decorator';
import { JwtGuard } from '../school/auth/guard/jwt.guard';

@ApiTags('School Access Control')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('school-access-control')
export class SchoolAccessControlController {
  constructor(private readonly accessControlService: SchoolAccessControlService) {}

  @Get('available-resources')
  @ApiOperation({
    summary: 'Get library resources available to school',
    description: 'View all resources that library owners have granted to your school',
  })
  @ApiResponse({ status: 200, description: 'Available resources retrieved successfully' })
  async getAvailableResources(@GetUser() user: any, @Query() query: QueryAvailableResourcesDto) {
    return this.accessControlService.getAvailableResources(user, query);
  }

  @Post('grant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Grant users/roles/classes access to library resources',
    description: 'School directors and admins can control which users, roles, or classes can access library resources',
  })
  @ApiResponse({ status: 201, description: 'Access granted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async grantAccess(@GetUser() user: any, @Body() dto: SchoolGrantAccessDto) {
    return this.accessControlService.grantAccess(user, dto);
  }

  @Post('grant-bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk grant access to multiple users or classes',
    description: 'Grant the same resource access to multiple users or classes at once',
  })
  @ApiResponse({ status: 201, description: 'Bulk access granted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async grantBulkAccess(@GetUser() user: any, @Body() dto: SchoolGrantBulkAccessDto) {
    return this.accessControlService.grantBulkAccess(user, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing access grant',
    description: 'Update access level, expiration, or status',
  })
  @ApiParam({ name: 'id', description: 'School access grant ID' })
  @ApiResponse({ status: 200, description: 'Access updated successfully' })
  @ApiResponse({ status: 404, description: 'Access not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateAccess(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto: SchoolUpdateAccessDto,
  ) {
    return this.accessControlService.updateAccess(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke access',
    description: 'Revoke a user\'s, role\'s, or class\'s access to a resource',
  })
  @ApiParam({ name: 'id', description: 'School access grant ID' })
  @ApiResponse({ status: 200, description: 'Access revoked successfully' })
  @ApiResponse({ status: 404, description: 'Access not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async revokeAccess(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto?: SchoolRevokeAccessDto,
  ) {
    return this.accessControlService.revokeAccess(user, id, dto);
  }

  @Post('exclude-subject')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Exclude (turn off) a subject for the school',
    description: 'School directors/admins can exclude subjects so non-admin users do not see them in explore. School owner still sees all.',
  })
  @ApiResponse({ status: 201, description: 'Subject excluded successfully' })
  @ApiResponse({ status: 400, description: 'School does not have library access to this subject' })
  @ApiResponse({ status: 403, description: 'Forbidden - only school directors and admins' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async excludeSubject(@GetUser() user: any, @Body() dto: SchoolExcludeSubjectDto) {
    return this.accessControlService.excludeSubject(user, dto);
  }

  @Post('include-subject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Include (turn on) a previously excluded subject',
    description: 'Remove the school-level subject exclusion so the subject is visible again to non-admin users.',
  })
  @ApiResponse({ status: 200, description: 'Subject included successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - only school directors and admins' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async includeSubject(@GetUser() user: any, @Body() dto: SchoolExcludeSubjectDto) {
    return this.accessControlService.includeSubject(user, dto);
  }

  @Get('excluded-subjects')
  @ApiOperation({
    summary: 'Get subjects turned off for the school',
    description: 'Returns subject IDs that the school owner has excluded. Use this to show correct "Visible to school" toggle state (OFF for these, ON for others).',
  })
  @ApiResponse({ status: 200, description: 'Excluded subjects retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - only school directors and admins' })
  async getExcludedSubjects(@GetUser() user: any) {
    return this.accessControlService.getExcludedSubjects(user);
  }

  @Post('include-all-subjects')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Turn on all subjects for the school',
    description: 'Remove all school-level exclusions so teachers and students see all subjects the library granted. Use when toggles should all be ON.',
  })
  @ApiResponse({ status: 200, description: 'All subjects now visible' })
  @ApiResponse({ status: 403, description: 'Forbidden - only school directors and admins' })
  async includeAllSubjects(@GetUser() user: any) {
    return this.accessControlService.includeAllSubjects(user);
  }

  @Get('users/:userId/resources')
  @ApiOperation({
    summary: 'Get resources accessible to a specific user',
    description: 'View all library resources a specific user in your school can access',
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User resources retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserResources(
    @GetUser() user: any,
    @Param('userId') userId: string,
    @Query() query: QueryUserResourcesDto,
  ) {
    return this.accessControlService.getUserResources(user, userId, query);
  }
}
