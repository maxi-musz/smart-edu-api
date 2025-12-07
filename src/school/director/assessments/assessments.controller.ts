import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { DirectorAssessmentsService } from './assessments.service';

@ApiTags('Director - Assessments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('director/assessments')
export class DirectorAssessmentsController {
  constructor(private readonly assessmentsService: DirectorAssessmentsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get assessment dashboard data for director' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'] })
  @ApiQuery({ name: 'assessment_type', required: false, enum: ['CBT', 'ASSIGNMENT', 'EXAM', 'OTHER', 'FORMATIVE', 'SUMMATIVE', 'DIAGNOSTIC', 'BENCHMARK', 'PRACTICE', 'MOCK_EXAM', 'QUIZ', 'TEST'] })
  @ApiQuery({ name: 'subject_id', required: false })
  @ApiQuery({ name: 'class_id', required: false })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  async getAssessmentDashboard(
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('assessment_type') assessmentType?: string,
    @Query('subject_id') subjectId?: string,
    @Query('class_id') classId?: string
  ) {
    return this.assessmentsService.getAssessmentDashboard(
      user.sub,
      { page, limit, status, assessmentType, subjectId, classId }
    );
  }

  @Get('')
  @ApiOperation({ summary: 'Get all assessments created by all teachers in the school' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'] })
  @ApiQuery({ name: 'subject_id', required: false })
  @ApiQuery({ name: 'topic_id', required: false })
  @ApiQuery({ name: 'assessment_type', required: false, enum: ['CBT', 'ASSIGNMENT', 'EXAM', 'OTHER', 'FORMATIVE', 'SUMMATIVE', 'DIAGNOSTIC', 'BENCHMARK', 'PRACTICE', 'MOCK_EXAM', 'QUIZ', 'TEST'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Assessments retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  async getAllAssessments(
    @GetUser() user: any,
    @Query('status') status?: string,
    @Query('subject_id') subjectId?: string,
    @Query('topic_id') topicId?: string,
    @Query('assessment_type') assessmentType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.assessmentsService.getAllAssessments(
      user.sub,
      { status, subjectId, topicId, assessmentType, page, limit }
    );
  }

  @Get(':assessmentId/attempts')
  @ApiOperation({ summary: 'Get assessment details with student attempts for director' })
  @ApiParam({ name: 'assessmentId', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Assessment attempts retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async getAssessmentAttempts(
    @GetUser() user: any,
    @Param('assessmentId') assessmentId: string
  ) {
    return this.assessmentsService.getAssessmentAttempts(assessmentId, user.sub);
  }

  @Get(':assessmentId/students/:studentId/submission')
  @ApiOperation({ summary: 'Get a specific student\'s submission for an assessment' })
  @ApiParam({ name: 'assessmentId', description: 'ID of the assessment' })
  @ApiParam({ name: 'studentId', description: 'ID of the student (Student record id)' })
  @ApiResponse({ status: 200, description: 'Student submission retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'Assessment or student not found' })
  async getStudentSubmission(
    @GetUser() user: any,
    @Param('assessmentId') assessmentId: string,
    @Param('studentId') studentId: string
  ) {
    return this.assessmentsService.getStudentSubmission(assessmentId, studentId, user.sub);
  }
}

