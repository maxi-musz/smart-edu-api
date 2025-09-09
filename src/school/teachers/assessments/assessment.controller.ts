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
import { AssessmentService } from './assessment.service';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';
import { CreateCBTQuizDto, UpdateCBTQuizDto, CreateCBTQuestionDto, UpdateCBTQuestionDto } from './cbt-dto';

@ApiTags('Teachers - Assessments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('')
  @ApiOperation({ summary: 'Create a new CBT quiz' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to topic' })
  @ApiResponse({ status: 404, description: 'Not found - Topic not found' })
  @ApiBody({ type: CreateCBTQuizDto })
  async createQuiz(
    @Body() createQuizDto: CreateCBTQuizDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.createQuiz(createQuizDto, user);
  }

  @Get('')
  @ApiOperation({ summary: 'Get all CBT quizzes created by teacher' })
  @ApiQuery({ name: 'subject_id', required: true, description: 'ID of the subject' })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'] })
  @ApiQuery({ name: 'topic_id', required: false })
  @ApiQuery({ name: 'assessment_type', required: false, enum: ['CBT', 'ASSIGNMENT', 'EXAM', 'OTHER', 'FORMATIVE', 'SUMMATIVE', 'DIAGNOSTIC', 'BENCHMARK', 'PRACTICE', 'MOCK_EXAM', 'QUIZ', 'TEST'] })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - subject_id is required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Invalid access' })
  async getAllAssessments(
    @GetUser() user: any,
    @Query('subject_id') subjectId: string,
    @Query('status') status?: string,
    @Query('topic_id') topicId?: string,
    @Query('assessment_type') assessmentType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.assessmentService.getAllAssessments(
      user.sub,
      { status, subjectId, topicId, assessmentType, page, limit }
    );
  }

  @Get('topic/:topicId')
  @ApiOperation({ summary: 'Get all quizzes for a specific topic' })
  @ApiParam({ name: 'topicId', description: 'ID of the topic' })
  @ApiResponse({ status: 200, description: 'Topic quizzes retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to topic' })
  @ApiResponse({ status: 404, description: 'Not found - Topic not found' })
  async getTopicQuizzes(
    @Param('topicId') topicId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.getTopicQuizzes(topicId, user.sub, user.school_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific assessment by ID' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  async getAssessmentById(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.getQuizById(assessmentId, user.sub);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get all questions for a specific assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async getAssessmentQuestions(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.getAssessmentQuestions(assessmentId, user.sub);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add a new question to an assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiBody({ type: CreateCBTQuestionDto })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid question data' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async createQuestion(
    @Param('id') assessmentId: string,
    @Body() createQuestionDto: CreateCBTQuestionDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.createQuestion(assessmentId, createQuestionDto, user.sub);
  }

  @Patch(':assessmentId/questions/:questionId')
  @ApiOperation({ summary: 'Update a specific question in an assessment' })
  @ApiParam({ name: 'assessmentId', description: 'ID of the assessment' })
  @ApiParam({ name: 'questionId', description: 'ID of the question' })
  @ApiBody({ type: UpdateCBTQuestionDto })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid question data' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or question not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async updateQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateCBTQuestionDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.updateQuestion(assessmentId, questionId, updateQuestionDto, user.sub);
  }

  @Delete(':assessmentId/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a specific question from an assessment' })
  @ApiParam({ name: 'assessmentId', description: 'ID of the assessment' })
  @ApiParam({ name: 'questionId', description: 'ID of the question' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot delete question with responses' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or question not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async deleteQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.deleteQuestion(assessmentId, questionId, user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  @ApiBody({ type: UpdateCBTQuizDto })
  async updateAssessment(
    @Param('id') assessmentId: string,
    @Body() updateAssessmentDto: UpdateCBTQuizDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.updateQuiz(assessmentId, updateAssessmentDto, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Assessment deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot delete assessment with attempts' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  async deleteAssessment(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.deleteQuiz(assessmentId, user.sub, user.school_id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish an assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Assessment published successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot publish assessment without questions' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  async publishAssessment(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.publishQuiz(assessmentId, user.sub, user.school_id);
  }
}