import { Controller, Get, Post, Put, Patch, UseGuards, HttpCode, HttpStatus, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AttendanceTeacherService } from './attendance-teacher.service';
import { JwtGuard } from '../../auth/guard';
import { GetUser } from '../../auth/decorator';
import { User } from '@prisma/client';
import { AttendanceOverviewResponseDto, StudentsForClassResponseDto, PaginationQueryDto, AttendanceForDateResponseDto, SubmitAttendanceDto, SubmitAttendanceResponseDto, UpdateAttendanceDto, StudentAttendanceResponseDto } from './dto';

@ApiTags('Teachers - Attendance')
@Controller('teachers/attendance')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class AttendanceTeacherController {
  constructor(private readonly attendanceTeacherService: AttendanceTeacherService) {}

  /**
   * Get session details and classes assigned to teacher
   * GET /api/v1/teachers/attendance/getsessiondetailsandclasses
   */
  @Get('getsessiondetailsandclasses')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get session details and classes',
    description: 'Retrieve classes assigned to teacher and current academic session details'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session details and classes retrieved successfully',
    type: AttendanceOverviewResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Teacher not found' 
  })
  async getSessionDetailsAndClasses(@GetUser() user: User) {
    return this.attendanceTeacherService.getSessionDetailsAndClasses(user);
  }

  /**
   * Get all students for a selected class with pagination
   * GET /api/v1/teachers/attendance/classes/{classId}/students
   */
  @Get('classes/:classId/students')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get students for a class (paginated)',
    description: 'Retrieve students in a specific class that the teacher manages with pagination support'
  })
  @ApiParam({
    name: 'classId',
    description: 'Class ID',
    example: 'class_1',
    type: 'string'
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-based)',
    required: false,
    example: 1,
    type: 'number'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page (max 100)',
    required: false,
    example: 10,
    type: 'number'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Students retrieved successfully',
    type: StudentsForClassResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Teacher not authorized to view this class' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Class not found or teacher not found' 
  })
  async getStudentsForClass(
    @GetUser() user: User,
    @Param('classId') classId: string,
    @Query() paginationQuery: PaginationQueryDto
  ) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    return this.attendanceTeacherService.getStudentsForClass(user, classId, page, limit);
  }

  /**
   * Get attendance for a specific date
   * GET /api/v1/teachers/attendance/classes/{classId}/date/{date}
   */
  @Get('classes/:classId/date/:date')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get attendance for specific date',
    description: 'Retrieve attendance records for a specific class on a specific date'
  })
  @ApiParam({
    name: 'classId',
    description: 'Class ID',
    example: 'class_1',
    type: 'string'
  })
  @ApiParam({
    name: 'date',
    description: 'Date in YYYY-MM-DD format',
    example: '2024-01-15',
    type: 'string'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Attendance retrieved successfully',
    type: AttendanceForDateResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid date format' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Teacher not authorized to view this class' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Class not found or teacher not found' 
  })
  async getAttendanceForDate(
    @GetUser() user: User,
    @Param('classId') classId: string,
    @Param('date') date: string
  ) {
    return this.attendanceTeacherService.getAttendanceForDate(user, classId, date);
  }

  /**
   * Submit attendance for a class
   * POST /api/v1/teachers/attendance/submit
   */
  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Submit attendance for a class',
    description: 'Submit attendance records for students in a specific class on a specific date'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Attendance submitted successfully',
    type: SubmitAttendanceResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid data or attendance already exists' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Teacher not authorized to manage this class' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Class not found or teacher not found' 
  })
  async submitAttendance(
    @GetUser() user: User,
    @Body() submitData: SubmitAttendanceDto
  ) {
    return this.attendanceTeacherService.submitAttendance(user, submitData);
  }

  /**
   * Update attendance for specific students (partial update)
   * PATCH /api/v1/teachers/attendance/update
   */
  @Patch('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update attendance for specific students',
    description: 'Update attendance records for only the students specified in the request. Other students remain unchanged.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Attendance updated successfully',
    type: SubmitAttendanceResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid data or no attendance session found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Teacher not authorized to manage this class' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Class not found or teacher not found' 
  })
  async updateAttendance(
    @GetUser() user: User,
    @Body() updateData: UpdateAttendanceDto
  ) {
    return this.attendanceTeacherService.updateAttendance(user, updateData);
  }

  /**
   * Get student attendance for a specific month
   * GET /api/v1/teachers/attendance/students/{studentId}
   */
  @Get('students/:studentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get student attendance for a specific month',
    description: 'Retrieve attendance records and summary for a specific student for the current month or specified month/year'
  })
  @ApiParam({ 
    name: 'studentId', 
    description: 'Student ID',
    example: 'cmft0keqn00avsbkyybjn0ra0'
  })
  @ApiQuery({ 
    name: 'year', 
    description: 'Year (optional, defaults to current year)',
    required: false,
    example: 2025
  })
  @ApiQuery({ 
    name: 'month', 
    description: 'Month (optional, defaults to current month)',
    required: false,
    example: 9
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Student attendance retrieved successfully',
    type: StudentAttendanceResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid student ID or date parameters' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Teacher not authorized to view this student\'s attendance' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Student not found' 
  })
  async getStudentAttendance(
    @GetUser() user: User,
    @Param('studentId') studentId: string,
    @Query('year') year?: number,
    @Query('month') month?: number
  ) {
    return this.attendanceTeacherService.getStudentAttendance(user, studentId, year, month);
  }

}
