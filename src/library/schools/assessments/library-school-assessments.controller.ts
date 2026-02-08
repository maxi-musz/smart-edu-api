import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssessmentService, LibraryAssessmentContext } from '../../../school/teachers/assessments/assessment.service';
import { CreateAssessmentDto, UpdateAssessmentDto, CreateAssessmentQuestionDto, UpdateAssessmentQuestionDto } from '../../../school/teachers/assessments/cbt-dto';
import { LibraryJwtGuard } from '../../library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../../library-auth/guard/library-owner.guard';

@ApiTags('Library - School Assessments')
@ApiBearerAuth('library-jwt')
@UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
@Controller('library/schools/:schoolId/assessments')
export class LibrarySchoolAssessmentsController {
  constructor(private readonly assessmentService: AssessmentService) {}

  private ctx(schoolId: string, createdByUserId?: string): LibraryAssessmentContext {
    return { schoolId, createdByUserId };
  }

  @Post('')
  @ApiOperation({ summary: 'Create assessment for a school (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'School not found' })
  create(
    @Param('schoolId') schoolId: string,
    @Body() body: CreateAssessmentDto & { created_by_user_id?: string },
    @Request() req: { libraryUser: { id: string } },
  ) {
    const { created_by_user_id, ...dto } = body;
    return this.assessmentService.createAssessment(
      dto,
      { sub: '' },
      this.ctx(schoolId, created_by_user_id),
    );
  }

  @Get('')
  @ApiOperation({ summary: 'Get all assessments for a school subject (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiQuery({ name: 'subject_id', required: true, description: 'Subject ID' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'topic_id', required: false })
  @ApiQuery({ name: 'assessment_type', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Assessments retrieved successfully' })
  getAll(
    @Param('schoolId') schoolId: string,
    @Query('subject_id') subjectId: string,
    @Query('status') status?: string,
    @Query('topic_id') topicId?: string,
    @Query('assessment_type') assessmentType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.assessmentService.getAllAssessments(
      '',
      { subjectId, status, topicId, assessmentType, page, limit },
      this.ctx(schoolId),
    );
  }

  @Get('topic/:topicId')
  @ApiOperation({ summary: 'Get assessments for a topic (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'topicId', description: 'Topic ID' })
  @ApiResponse({ status: 200, description: 'Topic assessments retrieved successfully' })
  getTopicQuizzes(
    @Param('schoolId') schoolId: string,
    @Param('topicId') topicId: string,
  ) {
    return this.assessmentService.getTopicQuizzes(topicId, '', schoolId, this.ctx(schoolId));
  }

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Get assessment attempts (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Attempts retrieved successfully' })
  getAttempts(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.assessmentService.getAssessmentAttempts(assessmentId, '', schoolId, this.ctx(schoolId));
  }

  @Get(':id/attempts/:studentId')
  @ApiOperation({ summary: 'Get student submission for assessment (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'studentId', description: 'Student record ID' })
  @ApiResponse({ status: 200, description: 'Submission retrieved successfully' })
  getStudentSubmission(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.assessmentService.getStudentSubmission(assessmentId, studentId, '', schoolId, this.ctx(schoolId));
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get assessment questions (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  getQuestions(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.assessmentService.getAssessmentQuestions(assessmentId, '', this.ctx(schoolId));
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add question to assessment (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  createQuestion(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
    @Body() dto: CreateAssessmentQuestionDto,
  ) {
    return this.assessmentService.createQuestion(assessmentId, dto, '', this.ctx(schoolId));
  }

  @Post(':id/questions/with-image')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Add question with image (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 201, description: 'Question created successfully' })
  createQuestionWithImage(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
    @Body('questionData') questionDataString: string,
    @UploadedFile() imageFile: Express.Multer.File,
  ) {
    return this.assessmentService.createQuestionWithImage(
      assessmentId,
      questionDataString,
      imageFile,
      '',
      this.ctx(schoolId),
    );
  }

  @Patch(':assessmentId/questions/:questionId')
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({ summary: 'Update question (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  updateQuestion(
    @Param('schoolId') schoolId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateAssessmentQuestionDto,
    @UploadedFile() imageFile: Express.Multer.File,
  ) {
    return this.assessmentService.updateQuestion(assessmentId, questionId, dto, '', imageFile, this.ctx(schoolId));
  }

  @Delete(':assessmentId/questions/:questionId/image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete question image (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  deleteQuestionImage(
    @Param('schoolId') schoolId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.assessmentService.deleteQuestionImage(assessmentId, questionId, '', this.ctx(schoolId));
  }

  @Delete(':assessmentId/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete question (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'assessmentId', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  deleteQuestion(
    @Param('schoolId') schoolId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.assessmentService.deleteQuestion(assessmentId, questionId, '', this.ctx(schoolId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update assessment (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  update(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.assessmentService.updateQuiz(assessmentId, dto, '', this.ctx(schoolId));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete assessment (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment deleted successfully' })
  delete(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.assessmentService.deleteQuiz(assessmentId, '', schoolId, this.ctx(schoolId));
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish assessment (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment published successfully' })
  publish(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.assessmentService.publishQuiz(assessmentId, '', schoolId, this.ctx(schoolId));
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unpublish assessment (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment unpublished successfully' })
  unpublish(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.assessmentService.unpublishQuiz(assessmentId, '', schoolId, this.ctx(schoolId));
  }

  @Post(':id/release-results')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release assessment results (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Results released successfully' })
  releaseResults(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.assessmentService.releaseAssessmentResults(assessmentId, '', schoolId, this.ctx(schoolId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment by ID (library owner)' })
  @ApiParam({ name: 'schoolId', description: 'School ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  getById(
    @Param('schoolId') schoolId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.assessmentService.getQuizById(assessmentId, '', this.ctx(schoolId));
  }
}
