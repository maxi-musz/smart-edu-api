import {
  Controller,
  Post,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Param,
  Body,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { LibrarySchoolResultsService } from './library-school-results.service';
import { LibraryJwtGuard } from '../../library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../../library-auth/guard/library-owner.guard';
import { ReleaseResultsForStudentsDto } from './dto/release-results.dto';

@ApiTags('Library - School Results')
@ApiBearerAuth('library-jwt')
@UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
@Controller('library/schools/:schoolId/results')
export class LibrarySchoolResultsController {
  constructor(private readonly resultsService: LibrarySchoolResultsService) {}

  @Post('release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release results for all students in current session (WHOLE SCHOOL)',
    description:
      'Library owner on behalf of school: collates all CA and Exam scores for all students and creates Result records.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiResponse({ status: 200, description: 'Results released successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  @ApiResponse({ status: 404, description: 'No current session or students found' })
  async releaseResults(
    @Param('schoolId') schoolId: string,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.resultsService.releaseResults(schoolId, req.libraryUser.id);
  }

  @Post('release/student/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release results for a single student',
    description: 'Library owner on behalf of school: releases results for a specific student.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results released successfully for student' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async releaseResultsForStudent(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query('session_id') sessionId: string | undefined,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.resultsService.releaseResultsForStudent(
      schoolId,
      req.libraryUser.id,
      studentId,
      sessionId,
    );
  }

  @Post('release/class/:classId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release results for all students in a specific class',
    description: 'Library owner on behalf of school: releases results for all students in a class.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results released successfully for class' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  @ApiResponse({ status: 404, description: 'Class or students not found' })
  async releaseResultsForClass(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
    @Query('session_id') sessionId: string | undefined,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.resultsService.releaseResultsForClass(
      schoolId,
      req.libraryUser.id,
      classId,
      sessionId,
    );
  }

  @Post('release/students')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release results for multiple students by their IDs',
    description: 'Library owner on behalf of school: releases results for specified students. Body: { studentIds: string[], sessionId?: string }.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiBody({ type: ReleaseResultsForStudentsDto })
  @ApiResponse({ status: 200, description: 'Results released successfully for students' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input or no assessments found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  @ApiResponse({ status: 404, description: 'No students found with provided IDs' })
  async releaseResultsForStudents(
    @Param('schoolId') schoolId: string,
    @Body() dto: ReleaseResultsForStudentsDto,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.resultsService.releaseResultsForStudents(
      schoolId,
      req.libraryUser.id,
      dto.studentIds,
      dto.sessionId,
    );
  }

  @Post('unrelease')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unrelease results for all students in current session (WHOLE SCHOOL)',
    description: 'Library owner on behalf of school: sets released_by_school_admin to false for all students.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results unreleased successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  @ApiResponse({ status: 404, description: 'No current session found' })
  async unreleaseResults(
    @Param('schoolId') schoolId: string,
    @Query('session_id') sessionId: string | undefined,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.resultsService.unreleaseResults(schoolId, req.libraryUser.id, sessionId);
  }

  @Post('unrelease/student/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unrelease results for a single student',
    description: 'Library owner on behalf of school: unreleases results for a specific student.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results unreleased successfully for student' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async unreleaseResultsForStudent(
    @Param('schoolId') schoolId: string,
    @Param('studentId') studentId: string,
    @Query('session_id') sessionId: string | undefined,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.resultsService.unreleaseResultsForStudent(
      schoolId,
      req.libraryUser.id,
      studentId,
      sessionId,
    );
  }

  @Post('unrelease/students')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unrelease results for multiple students by their IDs',
    description: 'Library owner on behalf of school: unreleases results for specified students.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiBody({ type: ReleaseResultsForStudentsDto })
  @ApiResponse({ status: 200, description: 'Results unreleased successfully for students' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  async unreleaseResultsForStudents(
    @Param('schoolId') schoolId: string,
    @Body() dto: ReleaseResultsForStudentsDto,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.resultsService.unreleaseResultsForStudents(
      schoolId,
      req.libraryUser.id,
      dto.studentIds,
      dto.sessionId,
    );
  }

  @Post('unrelease/class/:classId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unrelease results for all students in a specific class',
    description: 'Library owner on behalf of school: unreleases results for all students in a class.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results unreleased successfully for class' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  @ApiResponse({ status: 404, description: 'Class or students not found' })
  async unreleaseResultsForClass(
    @Param('schoolId') schoolId: string,
    @Param('classId') classId: string,
    @Query('session_id') sessionId: string | undefined,
    @Request() req: { libraryUser: { id: string } },
  ) {
    return this.resultsService.unreleaseResultsForClass(
      schoolId,
      req.libraryUser.id,
      classId,
      sessionId,
    );
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get results dashboard data for school',
    description:
      'Library owner on behalf of school: returns sessions, classes, subjects, and paginated results.',
  })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiQuery({ name: 'class_id', required: false, description: 'Class ID (defaults to first class)' })
  @ApiQuery({ name: 'subject_id', required: false, description: 'Subject ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Results dashboard retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Library owner required' })
  async getResultsDashboard(
    @Param('schoolId') schoolId: string,
    @Query('session_id') sessionId?: string,
    @Query('class_id') classId?: string,
    @Query('subject_id') subjectId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.resultsService.getResultsDashboard(schoolId, {
      sessionId,
      classId,
      subjectId,
      page,
      limit,
    });
  }
}
