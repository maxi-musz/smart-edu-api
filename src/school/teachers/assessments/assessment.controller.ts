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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssessmentService } from './assessment.service';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';
import { CreateAssessmentDto, UpdateAssessmentDto, CreateAssessmentQuestionDto, UpdateAssessmentQuestionDto } from './cbt-dto';

@ApiTags('Teachers - Assessments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/assessments')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('')
  @ApiOperation({ summary: 'Create a new Assessment' })
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to topic' })
  @ApiResponse({ status: 404, description: 'Not found - Topic not found' })
  @ApiBody({ type: CreateAssessmentDto })
  async createAssessment(
    @Body() createQuizDto: CreateAssessmentDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.createAssessment(createQuizDto, user);
  }

  @Get('')
  @ApiOperation({ summary: 'Get all Assessmentzes created by teacher' })
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

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Get all students and their attempts for an assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Student attempts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async getAssessmentAttempts(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.getAssessmentAttempts(assessmentId, user.sub, user.school_id);
  }

  @Get(':id/attempts/:studentId')
  @ApiOperation({ summary: 'Get a specific student\'s submission for an assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiParam({ name: 'studentId', description: 'ID of the student record (Student.id)' })
  @ApiResponse({ status: 200, description: 'Student submission retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or student not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async getStudentSubmission(
    @Param('id') assessmentId: string,
    @Param('studentId') studentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.getStudentSubmission(assessmentId, studentId, user.sub, user.school_id);
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

  @Post(':id/questions/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Upload an image for a question (use this before creating the question)' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    description: 'Image file to upload',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WEBP, max 5MB)'
        }
      },
      required: ['image']
    }
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid image file' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async uploadQuestionImage(
    @Param('id') assessmentId: string,
    @UploadedFile() imageFile: Express.Multer.File,
    @GetUser() user: any
  ) {
    return this.assessmentService.uploadQuestionImage(assessmentId, imageFile, user.sub);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add a new question to an assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiBody({ 
    type: CreateAssessmentQuestionDto,
    description: 'Question data. If you have an image, upload it first using /upload-image endpoint and use the returned image_url here.'
  })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid question data' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async createQuestion(
    @Param('id') assessmentId: string,
    @Body() createQuestionDto: CreateAssessmentQuestionDto,
    @GetUser() user: any
  ) {
    return this.assessmentService.createQuestion(assessmentId, createQuestionDto, user.sub);
  }

  @Post(':id/questions/with-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ 
    summary: 'Create question with image in single request (RECOMMENDED)',
    description: 'Upload image and create question atomically. If question creation fails, image is automatically deleted from S3. This prevents orphaned images.'
  })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Question data as JSON string + optional image file',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Optional image file (JPEG, PNG, GIF, WEBP, max 5MB)'
        },
        questionData: {
          type: 'string',
          description: 'JSON string of question data (CreateAssessmentQuestionDto)',
          example: JSON.stringify({
            question_text: "What is shown in the image?",
            question_type: "MULTIPLE_CHOICE_SINGLE",
            points: 2,
            options: [
              { option_text: "Triangle", order: 1, is_correct: true },
              { option_text: "Square", order: 2, is_correct: false }
            ]
          })
        }
      },
      required: ['questionData']
    }
  })
  @ApiResponse({ status: 201, description: 'Question created successfully with image' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data or image' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to assessment' })
  async createQuestionWithImage(
    @Param('id') assessmentId: string,
    @UploadedFile() imageFile: Express.Multer.File,
    @Body('questionData') questionDataString: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.createQuestionWithImage(assessmentId, questionDataString, imageFile, user.sub);
  }

  @Patch(':assessmentId/questions/:questionId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update a specific question in an assessment' })
  @ApiParam({ name: 'assessmentId', description: 'ID of the assessment' })
  @ApiParam({ name: 'questionId', description: 'ID of the question' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    type: UpdateAssessmentQuestionDto,
    description: 'Updated question data with optional image file'
  })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid question data' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or question not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async updateQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateAssessmentQuestionDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @GetUser() user: any
  ) {
    return this.assessmentService.updateQuestion(assessmentId, questionId, updateQuestionDto, user.sub, imageFile);
  }

  @Delete(':assessmentId/questions/:questionId/image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete the image for a specific question' })
  @ApiParam({ name: 'assessmentId', description: 'ID of the assessment' })
  @ApiParam({ name: 'questionId', description: 'ID of the question' })
  @ApiResponse({ status: 200, description: 'Question image deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Question does not have an image or assessment is closed' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment or question not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async deleteQuestionImage(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.deleteQuestionImage(assessmentId, questionId, user.sub);
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
  @ApiBody({ type: UpdateAssessmentDto })
  async updateAssessment(
    @Param('id') assessmentId: string,
    @Body() updateAssessmentDto: UpdateAssessmentDto,
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

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish an assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Assessment unpublished successfully' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  async unpublishAssessment(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.unpublishQuiz(assessmentId, user.sub, user.school_id);
  }

  @Post(':id/release-results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release assessment results and close the assessment' })
  @ApiParam({ name: 'id', description: 'ID of the assessment' })
  @ApiResponse({ status: 200, description: 'Assessment results released successfully' })
  @ApiResponse({ status: 404, description: 'Not found - Assessment not found or access denied' })
  @ApiResponse({ status: 403, description: 'Forbidden - Teacher does not have access to this assessment' })
  async releaseResults(
    @Param('id') assessmentId: string,
    @GetUser() user: any
  ) {
    return this.assessmentService.releaseAssessmentResults(assessmentId, user.sub, user.school_id);
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
}