import { Controller, Post, Get, UseGuards, HttpCode, HttpStatus, Query, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';
import { ReleaseResultsForStudentsDto } from './dto/release-results.dto';

@ApiTags('Director - Results')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('director/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post('release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Release results for all students in current session (WHOLE SCHOOL)',
    description: 'Collates all CA and Exam scores for all students in the school and creates Result records. This is a batch operation that processes students in batches to avoid system overload.'
  })
  @ApiResponse({ status: 200, description: 'Results released successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'No current session or students found' })
  async releaseResults(@GetUser() user: any) {
    return this.resultsService.releaseResults(user.school_id, user.sub);
  }

  @Post('release/student/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Release results for a single student',
    description: 'Collates all CA and Exam scores for a specific student and creates/updates their Result record. Only results released by school admin can be viewed by students.'
  })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results released successfully for student' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  async releaseResultsForStudent(
    @GetUser() user: any,
    @Param('studentId') studentId: string,
    @Query('session_id') sessionId?: string
  ) {
    return this.resultsService.releaseResultsForStudent(user.school_id, user.sub, studentId, sessionId);
  }

  @Post('release/class/:classId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Release results for all students in a specific class',
    description: 'Collates all CA and Exam scores for all students in a class and creates/updates their Result records. Only results released by school admin can be viewed by students.'
  })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results released successfully for class' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'Class or students not found' })
  async releaseResultsForClass(
    @GetUser() user: any,
    @Param('classId') classId: string,
    @Query('session_id') sessionId?: string
  ) {
    return this.resultsService.releaseResultsForClass(user.school_id, user.sub, classId, sessionId);
  }

  @Post('release/students')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Release results for multiple students by their IDs',
    description: 'Collates all CA and Exam scores for specified students and creates/updates their Result records. Accepts an array of student IDs in the request body. Only results released by school admin can be viewed by students.'
  })
  @ApiBody({ type: ReleaseResultsForStudentsDto })
  @ApiResponse({ status: 200, description: 'Results released successfully for students' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input or no assessments found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'No students found with provided IDs' })
  async releaseResultsForStudents(
    @GetUser() user: any,
    @Body() dto: ReleaseResultsForStudentsDto
  ) {
    return this.resultsService.releaseResultsForStudents(
      user.school_id,
      user.sub,
      dto.studentIds,
      dto.sessionId
    );
  }

  @Post('unrelease')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Unrelease results for all students in current session (WHOLE SCHOOL)',
    description: 'Sets released_by_school_admin to false for all students in the school. Results remain in database but students cannot view them.'
  })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results unreleased successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'No current session found' })
  async unreleaseResults(
    @GetUser() user: any,
    @Query('session_id') sessionId?: string
  ) {
    return this.resultsService.unreleaseResults(user.school_id, user.sub, sessionId);
  }

  @Post('unrelease/student/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Unrelease results for a single student',
    description: 'Sets released_by_school_admin to false for a specific student. Result remains in database but student cannot view it.'
  })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results unreleased successfully for student' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'Result not found' })
  async unreleaseResultsForStudent(
    @GetUser() user: any,
    @Param('studentId') studentId: string,
    @Query('session_id') sessionId?: string
  ) {
    return this.resultsService.unreleaseResultsForStudent(user.school_id, user.sub, studentId, sessionId);
  }

  @Post('unrelease/students')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Unrelease results for multiple students by their IDs',
    description: 'Sets released_by_school_admin to false for specified students. Results remain in database but students cannot view them.'
  })
  @ApiBody({ type: ReleaseResultsForStudentsDto })
  @ApiResponse({ status: 200, description: 'Results unreleased successfully for students' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  async unreleaseResultsForStudents(
    @GetUser() user: any,
    @Body() dto: ReleaseResultsForStudentsDto
  ) {
    return this.resultsService.unreleaseResultsForStudents(
      user.school_id,
      user.sub,
      dto.studentIds,
      dto.sessionId
    );
  }

  @Post('unrelease/class/:classId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Unrelease results for all students in a specific class',
    description: 'Sets released_by_school_admin to false for all students in a class. Results remain in database but students cannot view them.'
  })
  @ApiParam({ name: 'classId', description: 'Class ID' })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiResponse({ status: 200, description: 'Results unreleased successfully for class' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'Class or students not found' })
  async unreleaseResultsForClass(
    @GetUser() user: any,
    @Param('classId') classId: string,
    @Query('session_id') sessionId?: string
  ) {
    return this.resultsService.unreleaseResultsForClass(user.school_id, user.sub, classId, sessionId);
  }

  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get results dashboard data for director',
    description: 'Returns all sessions, classes, subjects, and paginated results. Defaults to current active session, first class, and first subject if results are released.'
  })
  @ApiQuery({ name: 'session_id', required: false, description: 'Academic session ID (defaults to current active session)' })
  @ApiQuery({ name: 'class_id', required: false, description: 'Class ID (defaults to first class)' })
  @ApiQuery({ name: 'subject_id', required: false, description: 'Subject ID (defaults to first subject, filters results by subject)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Results dashboard retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  async getResultsDashboard(
    @GetUser() user: any,
    @Query('session_id') sessionId?: string,
    @Query('class_id') classId?: string,
    @Query('subject_id') subjectId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.resultsService.getResultsDashboard(
      user.sub,
      { sessionId, classId, subjectId, page, limit }
    );
  }
}

