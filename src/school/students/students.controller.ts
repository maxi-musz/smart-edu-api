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

  /**
   * Get all assessments for currently signed in student
   * GET /api/v1/students/assessments
   */
  @Get('assessments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all assessments for student' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in assessment title or description' })
  @ApiQuery({ name: 'assessmentType', required: false, type: String, description: 'Filter by assessment type' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by assessment status' })
  @ApiResponse({ status: 200, description: 'Assessments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Student not found' })
  getAssessments(
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('assessmentType') assessmentType?: string,
    @Query('status') status?: string
  ) {
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
    return this.studentsService.fetchAssessmentsForStudent(
      user, 
      pageNum, 
      limitNum, 
      search, 
      assessmentType, 
      status
    );
  }

  /**
   * Get assessment questions for student to work on
   * GET /api/v1/students/assessments/:id/questions
   */
  @Get('assessments/:id/questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get assessment questions for student to work on' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment questions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 403, description: 'Access denied or maximum attempts reached' })
  getAssessmentQuestions(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.studentsService.getAssessmentQuestions(user, assessmentId);
  }

  /**
   * Submit assessment answers
   * POST /api/v1/students/assessments/:id/submit
   */
  @Post('assessments/:id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit assessment answers and auto-grade' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiBody({
    description: 'Assessment submission data',
    schema: {
      type: 'object',
      properties: {
        assessment_id: { type: 'string' },
        student_id: { type: 'string' },
        submission_time: { type: 'string', format: 'date-time' },
        time_taken: { type: 'number' },
        answers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question_id: { type: 'string' },
              question_type: { type: 'string', enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'ESSAY', 'NUMERIC', 'DATE'] },
              selected_options: { type: 'array', items: { type: 'string' } },
              text_answer: { type: 'string' },
              points_earned: { type: 'number' }
            }
          }
        },
        total_questions: { type: 'number' },
        questions_answered: { type: 'number' },
        questions_skipped: { type: 'number' },
        total_points_possible: { type: 'number' },
        total_points_earned: { type: 'number' },
        submission_status: { type: 'string', enum: ['COMPLETED', 'IN_PROGRESS', 'ABANDONED'] },
        device_info: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            app_version: { type: 'string' },
            device_model: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: 'Assessment submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 403, description: 'Access denied or maximum attempts reached' })
  submitAssessment(
    @Param('id') assessmentId: string,
    @Body() submissionData: any,
    @GetUser() user: any
  ) {
    return this.studentsService.submitAssessment(user, assessmentId, submissionData);
  }

  /**
   * Get assessment questions with user's previous answers
   * GET /api/v1/students/assessments/:id/answers
   */
  @Get('assessments/:id/answers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get assessment questions with user answers' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment with answers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  getAssessmentWithAnswers(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.studentsService.getAssessmentWithAnswers(user, assessmentId);
  }
}
