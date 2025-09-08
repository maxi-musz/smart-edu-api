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
import { CreateCBTQuizDto, UpdateCBTQuizDto } from './cbt-dto';

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
    return this.assessmentService.getTopicQuizzes(topicId, user.id, user.school_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific quiz by ID' })
  @ApiParam({ name: 'id', description: 'ID of the quiz' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Not found - Quiz not found or access denied' })
  async getQuizById(
    @Param('id') quizId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.getQuizById(quizId, user.id);
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
    return this.assessmentService.getAssessmentQuestions(assessmentId, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a quiz' })
  @ApiParam({ name: 'id', description: 'ID of the quiz' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 404, description: 'Not found - Quiz not found or access denied' })
  @ApiBody({ type: UpdateCBTQuizDto })
  async updateQuiz(
    @Param('id') quizId: string,
    @Body() updateQuizDto: UpdateCBTQuizDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.updateQuiz(quizId, updateQuizDto, user.id, user.school_id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a quiz' })
  @ApiParam({ name: 'id', description: 'ID of the quiz' })
  @ApiResponse({ status: 200, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot delete quiz with attempts' })
  @ApiResponse({ status: 404, description: 'Not found - Quiz not found or access denied' })
  async deleteQuiz(
    @Param('id') quizId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.deleteQuiz(quizId, user.id, user.school_id);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a quiz' })
  @ApiParam({ name: 'id', description: 'ID of the quiz' })
  @ApiResponse({ status: 200, description: 'Quiz published successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Cannot publish quiz without questions' })
  @ApiResponse({ status: 404, description: 'Not found - Quiz not found or access denied' })
  async publishQuiz(
    @Param('id') quizId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.publishQuiz(quizId, user.id, user.school_id);
  }
}