import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
  ApiBody
} from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { GetUser } from '../auth/decorator/get-user-decorator';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * Get student dashboard
   * GET /api/v1/students/dashboard
   */
  @Get('dashboard')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get student dashboard' })
  @ApiResponse({ status: 200, description: 'Student dashboard retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentDashboard(@GetUser() user: any) {
    return this.studentsService.getStudentDashboard(user);
  }

  /**
   * Get student subjects
   * GET /api/v1/students/subjects
   */
  @Get('subjects')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get student subjects' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Student subjects retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getStudentSubjects(
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
    return this.studentsService.getStudentSubjects(user, pageNum, limitNum);
  }

  /**
   * Get student subject details with topics
   * GET /api/v1/students/subjects/:id
   */
  @Get('subjects/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get student subject details with topics' })
  @ApiParam({ name: 'id', description: 'Subject ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Subject details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  getStudentSubjectDetails(
    @Param('id') subjectId: string,
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
    return this.studentsService.getStudentSubjectDetails(user, subjectId, pageNum, limitNum);
  }

  /**
   * Get all content for a specific topic
   * GET /api/v1/students/topics/:id/content
   */
  @Get('topics/:id/content')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all content for a specific topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic content retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  getTopicContent(
    @Param('id') topicId: string,
    @GetUser() user: any
  ) {
    return this.studentsService.getTopicContent(user, topicId);
  }

  /**
   * Get all topics for a school/subject
   * GET /api/v1/students/topics
   */
  @Get('topics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all topics for a school' })
  @ApiQuery({
    name: 'subjectId',
    required: false,
    description: 'Filter by subject ID',
  })
  @ApiQuery({
    name: 'academicSessionId',
    required: false,
    description: 'Filter by academic session ID',
  })
  @ApiResponse({ status: 200, description: 'Topics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Topics not found' })
  getAllTopics(
    @GetUser() user: any,
    @Query('subjectId') subjectId?: string,
    @Query('academicSessionId') academicSessionId?: string
  ) {
    return this.studentsService.getAllTopics(user, subjectId, academicSessionId);
  }

  /**
   * Get student timetable schedules
   * GET /api/v1/students/schedules
   */
  @Get('schedules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get student timetable schedules' })
  @ApiResponse({ status: 200, description: 'Schedules retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getSchedulesTab(@GetUser() user: any) {
    return this.studentsService.fetchSchedulesTabForStudent(user);
  }
}
