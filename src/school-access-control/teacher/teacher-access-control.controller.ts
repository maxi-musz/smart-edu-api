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
import { TeacherAccessControlService } from './teacher-access-control.service';
import {
  TeacherGrantAccessDto,
  TeacherGrantBulkAccessDto,
  TeacherUpdateAccessDto,
  TeacherRevokeAccessDto,
  QueryTeacherAvailableResourcesDto,
  QueryStudentResourcesDto,
  TeacherExcludeResourceDto,
} from './dto';
import { GetUser } from '../../school/auth/decorator/get-user-decorator';
import { JwtGuard } from '../../school/auth/guard/jwt.guard';

@ApiTags('Teacher Access Control')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('school-access-control/teacher')
export class TeacherAccessControlController {
  constructor(private readonly teacherAccessService: TeacherAccessControlService) {}

  @Get('available-resources')
  @ApiOperation({
    summary: 'Get resources available to teacher',
    description: 'View all resources that the school has granted to teachers',
  })
  @ApiResponse({ status: 200, description: 'Available resources retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - user is not a teacher' })
  async getAvailableResources(@GetUser() user: any, @Query() query: QueryTeacherAvailableResourcesDto) {
    return this.teacherAccessService.getAvailableResources(user, query);
  }

  @Post('exclude')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Exclude (turn off) a topic/video/material/assessment for students or class',
    description: 'Teachers can exclude resources so selected students or class do not see them in explore.',
  })
  @ApiResponse({ status: 201, description: 'Resource excluded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - missing resource ID or classId/studentId' })
  @ApiResponse({ status: 403, description: 'Forbidden - user is not a teacher' })
  @ApiResponse({ status: 404, description: 'Subject, student, or class not found' })
  async excludeResource(@GetUser() user: any, @Body() dto: TeacherExcludeResourceDto) {
    return this.teacherAccessService.excludeResource(user, dto);
  }

  @Post('include')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Include (turn on) a previously excluded resource',
    description: 'Remove the teacher-level exclusion so the resource is visible again to students/class.',
  })
  @ApiResponse({ status: 200, description: 'Resource included successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - user is not a teacher' })
  async includeResource(@GetUser() user: any, @Body() dto: TeacherExcludeResourceDto) {
    return this.teacherAccessService.includeResource(user, dto);
  }

  @Post('grant')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Grant students/classes access to resources',
    description: 'Teachers can control which students or classes can access specific library resources',
  })
  @ApiResponse({ status: 201, description: 'Access granted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden - user is not a teacher' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async grantAccess(@GetUser() user: any, @Body() dto: TeacherGrantAccessDto) {
    return this.teacherAccessService.grantAccess(user, dto);
  }

  @Post('grant-bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk grant access to multiple students or classes',
    description: 'Grant the same resource access to multiple students or classes at once',
  })
  @ApiResponse({ status: 201, description: 'Bulk access granted' })
  @ApiResponse({ status: 403, description: 'Forbidden - user is not a teacher' })
  async grantBulkAccess(@GetUser() user: any, @Body() dto: TeacherGrantBulkAccessDto) {
    return this.teacherAccessService.grantBulkAccess(user, dto);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an existing access grant',
    description: 'Update access level, expiration, or status',
  })
  @ApiParam({ name: 'id', description: 'Teacher access grant ID' })
  @ApiResponse({ status: 200, description: 'Access updated successfully' })
  @ApiResponse({ status: 404, description: 'Access not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateAccess(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto: TeacherUpdateAccessDto,
  ) {
    return this.teacherAccessService.updateAccess(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke access',
    description: 'Revoke a student\'s or class\'s access to a resource',
  })
  @ApiParam({ name: 'id', description: 'Teacher access grant ID' })
  @ApiResponse({ status: 200, description: 'Access revoked successfully' })
  @ApiResponse({ status: 404, description: 'Access not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async revokeAccess(
    @GetUser() user: any,
    @Param('id') id: string,
    @Body() dto?: TeacherRevokeAccessDto,
  ) {
    return this.teacherAccessService.revokeAccess(user, id, dto);
  }

  @Get('students/:studentId/resources')
  @ApiOperation({
    summary: 'Get resources accessible to a specific student',
    description: 'View all library resources a specific student can access',
  })
  @ApiParam({ name: 'studentId', description: 'Student user ID' })
  @ApiResponse({ status: 200, description: 'Student resources retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - user is not a teacher' })
  async getStudentResources(
    @GetUser() user: any,
    @Param('studentId') studentId: string,
    @Query() query: QueryStudentResourcesDto,
  ) {
    return this.teacherAccessService.getStudentResources(user, studentId, query);
  }
}
