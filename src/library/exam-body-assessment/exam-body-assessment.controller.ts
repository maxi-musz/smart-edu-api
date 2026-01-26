import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus, UseGuards, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { LibraryOwnerGuard } from '../library-auth/guard/library-owner.guard';
import { LibraryExamBodyAssessmentService } from './exam-body-assessment.service';
import {
  CreateLibraryExamBodyAssessmentDto,
  CreateLibraryExamBodyQuestionDto,
  UpdateLibraryExamBodyAssessmentDto,
  UpdateLibraryExamBodyQuestionDto,
} from './dto';
import {
  CreateLibraryExamBodyAssessmentDocs,
  GetLibraryExamBodyAssessmentsDocs,
  GetLibraryExamBodyAssessmentDocs,
  UpdateLibraryExamBodyAssessmentDocs,
  DeleteLibraryExamBodyAssessmentDocs,
  CreateLibraryExamBodyQuestionDocs,
  GetLibraryExamBodyQuestionsDocs,
  UpdateLibraryExamBodyQuestionDocs,
  DeleteLibraryExamBodyQuestionDocs,
  PublishLibraryExamBodyAssessmentDocs,
  UnpublishLibraryExamBodyAssessmentDocs,
} from './docs/exam-body-assessment.docs';

@ApiTags('Exam Body Assessments')
@ApiBearerAuth()
@Controller('exam-bodies/:examBodyId/assessments')
export class LibraryExamBodyAssessmentController {
  constructor(private readonly service: LibraryExamBodyAssessmentService) {}

  // Create a new assessment for an exam body (requires subjectId and yearId query params)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @CreateLibraryExamBodyAssessmentDocs.operation
  @CreateLibraryExamBodyAssessmentDocs.querySubjectId
  @CreateLibraryExamBodyAssessmentDocs.queryYearId
  @CreateLibraryExamBodyAssessmentDocs.body
  @CreateLibraryExamBodyAssessmentDocs.response201
  @CreateLibraryExamBodyAssessmentDocs.response400
  @CreateLibraryExamBodyAssessmentDocs.response401
  @CreateLibraryExamBodyAssessmentDocs.response403
  @CreateLibraryExamBodyAssessmentDocs.response404
  createAssessment(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Query('subjectId') subjectId: string,
    @Query('yearId') yearId: string,
    @Body() createDto: CreateLibraryExamBodyAssessmentDto,
  ) {
    return this.service.createAssessment(req.user, examBodyId, subjectId, yearId, createDto);
  }

  // List all assessments for an exam body (optionally filtered by subjectId/yearId)
  @Get()
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @GetLibraryExamBodyAssessmentsDocs.operation
  @GetLibraryExamBodyAssessmentsDocs.querySubjectId
  @GetLibraryExamBodyAssessmentsDocs.queryYearId
  @GetLibraryExamBodyAssessmentsDocs.response200
  @GetLibraryExamBodyAssessmentsDocs.response401
  @GetLibraryExamBodyAssessmentsDocs.response403
  findAllAssessments(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Query('subjectId') subjectId?: string,
    @Query('yearId') yearId?: string,
  ) {
    return this.service.findAllAssessments(req.user, examBodyId, subjectId, yearId);
  }

  // Get a single assessment by ID with all details
  @Get(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @GetLibraryExamBodyAssessmentDocs.operation
  @GetLibraryExamBodyAssessmentDocs.paramAssessmentId
  @GetLibraryExamBodyAssessmentDocs.response200
  @GetLibraryExamBodyAssessmentDocs.response404
  findOneAssessment(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('id') id: string,
  ) {
    return this.service.findOneAssessment(req.user, examBodyId, id);
  }

  // Update assessment metadata (title, description, maxAttempts, etc.)
  @Patch(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @UpdateLibraryExamBodyAssessmentDocs.operation
  @UpdateLibraryExamBodyAssessmentDocs.body
  @UpdateLibraryExamBodyAssessmentDocs.response200
  @UpdateLibraryExamBodyAssessmentDocs.response404
  updateAssessment(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateLibraryExamBodyAssessmentDto,
  ) {
    return this.service.updateAssessment(req.user, examBodyId, id, updateDto);
  }

  // Delete an assessment (removes assessment and all its questions)
  @Delete(':id')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @DeleteLibraryExamBodyAssessmentDocs.operation
  @DeleteLibraryExamBodyAssessmentDocs.response200
  @DeleteLibraryExamBodyAssessmentDocs.response404
  deleteAssessment(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('id') id: string,
  ) {
    return this.service.deleteAssessment(req.user, examBodyId, id);
  }

  // Create a question for an assessment (JSON body, no image)
  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @CreateLibraryExamBodyQuestionDocs.operation
  @CreateLibraryExamBodyQuestionDocs.body
  @CreateLibraryExamBodyQuestionDocs.response201
  @CreateLibraryExamBodyQuestionDocs.response404
  createQuestion(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('id') assessmentId: string,
    @Body() createDto: CreateLibraryExamBodyQuestionDto,
  ) {
    return this.service.createQuestion(req.user, examBodyId, assessmentId, createDto);
  }

  // Create a question with image upload (multipart/form-data with image file)
  @Post(':id/questions/with-image')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @CreateLibraryExamBodyQuestionDocs.operation
  @CreateLibraryExamBodyQuestionDocs.response201
  @CreateLibraryExamBodyQuestionDocs.response400
  @CreateLibraryExamBodyQuestionDocs.response404
  createQuestionWithImage(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('id') assessmentId: string,
    @Body('questionData') questionDataString: string,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    return this.service.createQuestionWithImage(req.user, examBodyId, assessmentId, questionDataString, imageFile);
  }

  // Get all questions for an assessment (with options and correct answers)
  @Get(':id/questions')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @GetLibraryExamBodyQuestionsDocs.operation
  @GetLibraryExamBodyQuestionsDocs.response200
  @GetLibraryExamBodyQuestionsDocs.response404
  getQuestions(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.service.getQuestions(req.user, examBodyId, assessmentId);
  }

  // Update a question (supports image upload/replacement via multipart/form-data)
  @Patch('questions/:questionId')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @UpdateLibraryExamBodyQuestionDocs.operation
  @UpdateLibraryExamBodyQuestionDocs.body
  @UpdateLibraryExamBodyQuestionDocs.response200
  @UpdateLibraryExamBodyQuestionDocs.response404
  updateQuestion(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('questionId') questionId: string,
    @Body() updateDto: UpdateLibraryExamBodyQuestionDto,
    @UploadedFile() imageFile?: Express.Multer.File,
  ) {
    return this.service.updateQuestion(req.user, examBodyId, questionId, updateDto, imageFile);
  }

  // Delete only the image from a question (keeps the question, removes image from S3)
  @Delete('questions/:questionId/image')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @DeleteLibraryExamBodyQuestionDocs.operation
  @DeleteLibraryExamBodyQuestionDocs.response200
  @DeleteLibraryExamBodyQuestionDocs.response404
  deleteQuestionImage(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.service.deleteQuestionImage(req.user, examBodyId, questionId);
  }

  // Delete a question entirely (removes question, options, and correct answers)
  @Delete('questions/:questionId')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @DeleteLibraryExamBodyQuestionDocs.operation
  @DeleteLibraryExamBodyQuestionDocs.response200
  @DeleteLibraryExamBodyQuestionDocs.response404
  deleteQuestion(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.service.deleteQuestion(req.user, examBodyId, questionId);
  }

  // Publish an assessment (makes it available for students to take)
  @Patch(':id/publish')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @PublishLibraryExamBodyAssessmentDocs.operation
  @PublishLibraryExamBodyAssessmentDocs.response200
  @PublishLibraryExamBodyAssessmentDocs.response404
  publishAssessment(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('id') id: string,
  ) {
    return this.service.publishAssessment(req.user, examBodyId, id);
  }

  // Unpublish an assessment (hides it from students, keeps data intact)
  @Patch(':id/unpublish')
  @UseGuards(LibraryJwtGuard, LibraryOwnerGuard)
  @UnpublishLibraryExamBodyAssessmentDocs.operation
  @UnpublishLibraryExamBodyAssessmentDocs.response200
  @UnpublishLibraryExamBodyAssessmentDocs.response404
  unpublishAssessment(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('id') id: string,
  ) {
    return this.service.unpublishAssessment(req.user, examBodyId, id);
  }
}
