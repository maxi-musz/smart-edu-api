import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Patch,
  Query,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { GetAssessmentsQueryDto } from './dto/get-assessments-query.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { DuplicateAssessmentDto } from './dto/duplicate-assessment.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { DirectorAssessmentService } from './director-assessment.service';

@ApiTags('Director - Assessments (Director-specific)')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('director-assessment')
export class DirectorAssessmentController {
  constructor(
    private readonly directorAssessmentService: DirectorAssessmentService,
  ) {}

  // ========================================
  // DASHBOARD
  // ========================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get assessment dashboard data for director' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'],
  })
  @ApiQuery({
    name: 'assessment_type',
    required: false,
    enum: [
      'CBT', 'ASSIGNMENT', 'EXAM', 'OTHER', 'FORMATIVE', 'SUMMATIVE',
      'DIAGNOSTIC', 'BENCHMARK', 'PRACTICE', 'MOCK_EXAM', 'QUIZ', 'TEST',
    ],
  })
  @ApiQuery({ name: 'subject_id', required: false })
  @ApiQuery({ name: 'class_id', required: false })
  @ApiQuery({ name: 'academic_session_id', required: false })
  @ApiQuery({
    name: 'term',
    required: false,
    enum: ['first', 'second', 'third'],
  })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  async getAssessmentDashboard(
    @GetUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('assessment_type') assessmentType?: string,
    @Query('subject_id') subjectId?: string,
    @Query('class_id') classId?: string,
    @Query('academic_session_id') academic_session_id?: string,
    @Query('term') term?: string,
  ) {
    return this.directorAssessmentService.getAssessmentDashboard(user.sub, {
      page,
      limit,
      status,
      assessmentType,
      subjectId,
      classId,
      academic_session_id,
      term,
    });
  }

  // ========================================
  // LIST ALL ASSESSMENTS
  // ========================================

  @Get()
  @ApiOperation({ summary: 'Fetch all assessments in the director\'s school' })
  @ApiResponse({ status: 200, description: 'Assessments fetched successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async getAllDirectorAssessments(
    @Query() query: GetAssessmentsQueryDto,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.getAllAssessmentsForDirector(
      query,
      user,
    );
  }

  // ========================================
  // CREATE ASSESSMENT (must be before :id routes)
  // ========================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new assessment',
    description:
      'Creates a DRAFT assessment for the director’s school. Requires `subject_id` (must belong to the school). Optional `topic_id` must belong to that subject, school, and the same academic session (resolved from `academic_session_id` or the school’s current session). Uses current academic session unless `academic_session_id` is provided.',
  })
  @ApiResponse({ status: 201, description: 'Assessment created' })
  @ApiResponse({ status: 400, description: 'Bad request or session/type limits' })
  @ApiResponse({ status: 403, description: 'Forbidden — director role required' })
  @ApiResponse({ status: 404, description: 'Subject or topic not found' })
  async createDirectorAssessment(
    @Body() createDto: CreateAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.createDirectorAssessment(
      createDto,
      user,
    );
  }

  // ========================================
  // QUESTIONS PREVIEW (must be before :id)
  // ========================================

  @Get(':id/questions')
  @ApiOperation({ summary: 'Preview assessment questions with correct answers' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Questions retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async getDirectorAssessmentQuestionsPreview(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.getDirectorAssessmentQuestionsForPreview(
      id,
      user,
    );
  }

  // ========================================
  // ATTEMPTS (must be before :id)
  // ========================================

  @Get(':id/attempts')
  @ApiOperation({ summary: 'List student attempts for an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment attempts retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async getAssessmentAttempts(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.getAssessmentAttempts(id, user.sub);
  }

  // ========================================
  // STUDENT SUBMISSION (must be before :id)
  // ========================================

  @Get(':id/students/:studentId/submission')
  @ApiOperation({ summary: "View a specific student's submission for an assessment" })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'studentId', description: 'Student record ID' })
  @ApiResponse({ status: 200, description: 'Student submission retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'Assessment or student not found' })
  async getStudentSubmission(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.getStudentSubmission(
      id,
      studentId,
      user.sub,
    );
  }

  // ========================================
  // GET ASSESSMENT BY ID
  // ========================================

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment details with submission summary' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async getDirectorAssessmentById(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.getDirectorAssessmentById(id, user);
  }

  // ========================================
  // DUPLICATE ASSESSMENT
  // ========================================

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID to duplicate' })
  @ApiResponse({ status: 201, description: 'Assessment duplicated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async duplicateDirectorAssessmentById(
    @Param('id') id: string,
    @Body() duplicateDto: DuplicateAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.duplicateDirectorAssessmentById(
      id,
      duplicateDto,
      user,
    );
  }

  // ========================================
  // ADD QUESTIONS (JSON batch)
  // ========================================

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add questions to an assessment (JSON batch)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 201, description: 'Questions added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async addDirectorAssessmentQuestions(
    @Param('id') id: string,
    @Body() addQuestionsDto: AddQuestionsDto,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.addDirectorAssessmentQuestions(
      id,
      addQuestionsDto,
      user,
    );
  }

  // ========================================
  // ADD QUESTION WITH IMAGE (multipart)
  // ========================================

  @Post(':id/questions/with-image')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'optionImages', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a question with image uploads (multipart)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 201, description: 'Question added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async addDirectorQuestionWithImage(
    @Param('id') id: string,
    @UploadedFiles()
    files: {
      image?: Express.Multer.File[];
      optionImages?: Express.Multer.File[];
    },
    @Body('questionData') questionDataString: string,
    @GetUser() user: any,
  ) {
    const questionImage = files?.image?.[0];
    const optionImages = files?.optionImages || [];

    return this.directorAssessmentService.addDirectorQuestionWithImage(
      id,
      questionDataString,
      questionImage,
      optionImages,
      user,
    );
  }

  // ========================================
  // UPDATE QUESTION (smart merge)
  // ========================================

  @Patch(':id/questions/:questionId')
  @ApiOperation({ summary: 'Update a single question (smart merge options)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateDirectorQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.updateDirectorQuestion(
      id,
      questionId,
      updateQuestionDto,
      user,
    );
  }

  // ========================================
  // UPDATE QUESTION WITH IMAGE (multipart)
  // ========================================

  @Patch(':id/questions/:questionId/with-image')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'newQuestionImage', maxCount: 1 },
      { name: 'newOptionImages', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a question with image uploads (multipart)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async updateDirectorQuestionWithImage(
    @Param('id') assessmentId: string,
    @Param('questionId') questionId: string,
    @GetUser() user: any,
    @UploadedFiles()
    files: {
      newQuestionImage?: Express.Multer.File[];
      newOptionImages?: Express.Multer.File[];
    },
    @Body('questionData') questionDataStr?: string,
    @Body('oldQuestionImageS3Key') oldQuestionImageS3Key?: string,
    @Body('optionImageUpdates') optionImageUpdatesStr?: string,
  ) {
    let updateQuestionDto: any;
    if (!questionDataStr) {
      throw new Error('questionData field is required');
    }

    try {
      updateQuestionDto = JSON.parse(questionDataStr);
    } catch (error) {
      throw new Error('Invalid JSON in questionData field');
    }

    if (oldQuestionImageS3Key) {
      updateQuestionDto.image_s3_key = oldQuestionImageS3Key;
    }

    let optionImageUpdates:
      | Array<{ optionId: string; oldS3Key?: string }>
      | undefined;
    if (optionImageUpdatesStr) {
      try {
        optionImageUpdates = JSON.parse(optionImageUpdatesStr);
      } catch (error) {
        throw new Error('Invalid JSON in optionImageUpdates field');
      }
    }

    const newQuestionImage = files?.newQuestionImage?.[0];
    const newOptionImages = files?.newOptionImages;

    if (newQuestionImage) {
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];

      if (!allowedMimeTypes.includes(newQuestionImage.mimetype)) {
        throw new Error(
          `Invalid image file type: ${newQuestionImage.originalname}. Allowed: JPEG, PNG, GIF, WEBP`,
        );
      }
      if (newQuestionImage.size > 5 * 1024 * 1024) {
        throw new Error(
          `Image file ${newQuestionImage.originalname} exceeds 5MB limit`,
        );
      }
    }

    if (newOptionImages && newOptionImages.length > 0) {
      const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      for (const img of newOptionImages) {
        if (!allowedMimeTypes.includes(img.mimetype)) {
          throw new Error(
            `Invalid image file type: ${img.originalname}. Allowed: JPEG, PNG, GIF, WEBP`,
          );
        }
        if (img.size > 5 * 1024 * 1024) {
          throw new Error(
            `Image file ${img.originalname} exceeds 5MB limit`,
          );
        }
      }
    }

    return this.directorAssessmentService.updateDirectorQuestionWithImage(
      assessmentId,
      questionId,
      updateQuestionDto,
      user,
      newQuestionImage,
      optionImageUpdates,
      newOptionImages,
    );
  }

  // ========================================
  // DELETE QUESTION
  // ========================================

  @Delete(':id/questions/:questionId')
  @ApiOperation({ summary: 'Delete a question from an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiResponse({ status: 200, description: 'Question deleted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Question not found' })
  async deleteDirectorAssessmentQuestion(
    @Param('id') assessmentId: string,
    @Param('questionId') questionId: string,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.deleteDirectorAssessmentQuestion(
      assessmentId,
      questionId,
      user,
    );
  }

  // ========================================
  // UPDATE ASSESSMENT METADATA
  // ========================================

  @Patch(':id')
  @ApiOperation({ summary: 'Update assessment metadata' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async updateDirectorAssessmentById(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.directorAssessmentService.updateDirectorAssessmentById(
      id,
      updateDto,
      user,
    );
  }
}
