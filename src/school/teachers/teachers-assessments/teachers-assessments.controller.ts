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
  Res,
  UploadedFiles,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { GetAssessmentsQueryDto } from './dto/get-assessments-query.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { DuplicateAssessmentDto } from './dto/duplicate-assessment.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CreateNewAssessmentDto } from './dto/create-new-assessment.dto';
import { TeachersAssessmentsService } from './teachers-assessments.service';
import { TeachersAssessmentsDocs } from './api-docs/teachers-assessments.docs';

@ApiTags('Teachers - Assessments (Teacher-specific)')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers-assessments')
export class TeachersAssessmentsController {
  constructor(
    private readonly teachersAssessmentsService: TeachersAssessmentsService,
  ) {}

  /**
   * Fetch all assessments available to the authenticated teacher.
   *
   * Access control:
   * - Teacher sees only assessments for subjects they teach (based on `teacher.subjectsTeaching`).
   *
   * Response shape and analytics match the central `GET /assessment` behavior.
   */
  @Get()
  @TeachersAssessmentsDocs.getAll.operation
  @TeachersAssessmentsDocs.getAll.response200
  @TeachersAssessmentsDocs.getAll.response400
  @TeachersAssessmentsDocs.getAll.response404
  async getAllTeacherAssessments(
    @Query() query: GetAssessmentsQueryDto,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.getAllAssessmentsForTeacher(
      query,
      user,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @TeachersAssessmentsDocs.create.operation
  @TeachersAssessmentsDocs.create.response201
  @TeachersAssessmentsDocs.create.response400
  @TeachersAssessmentsDocs.create.response403
  @TeachersAssessmentsDocs.create.response404
  async createTeacherAssessment(
    @Body() createDto: CreateNewAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.createTeacherAssessment(
      createDto,
      user,
    );
  }

  // teacher preview questions for a specific assessment
  // GET /teachers-assessments/:id/questions
  // Private endpoint
  @Get(':id/questions')
  @TeachersAssessmentsDocs.getQuestionsPreview.operation
  @TeachersAssessmentsDocs.getQuestionsPreview.response200
  @TeachersAssessmentsDocs.getQuestionsPreview.response400
  @TeachersAssessmentsDocs.getQuestionsPreview.response403
  @TeachersAssessmentsDocs.getQuestionsPreview.response404
  async getTeacherAssessmentQuestionsPreview(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.getTeacherAssessmentQuestionsForPreview(
      id,
      user,
    );
  }

  @Get(':id/bulk-questions/template')
  @TeachersAssessmentsDocs.downloadBulkQuestionsTemplate.operation
  @TeachersAssessmentsDocs.downloadBulkQuestionsTemplate.response200
  @TeachersAssessmentsDocs.downloadBulkQuestionsTemplate.response401
  @TeachersAssessmentsDocs.downloadBulkQuestionsTemplate.response403
  @TeachersAssessmentsDocs.downloadBulkQuestionsTemplate.response404
  async downloadBulkQuestionsTemplate(
    @Param('id') id: string,
    @GetUser() user: any,
    @Res() res: Response,
  ) {
    await this.teachersAssessmentsService.verifyTeacherCanBulkImportQuestions(
      id,
      user,
    );

    const templateBuffer =
      await this.teachersAssessmentsService.getBulkQuestionsTemplateXlsxBuffer();

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':
        'attachment; filename="teacher-assessment-bulk-questions-template.xlsx"',
      'Content-Length': templateBuffer.length,
    });

    res.send(templateBuffer);
  }

  @Post(':id/bulk-questions/upload')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'excel_file', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  @TeachersAssessmentsDocs.bulkUploadQuestions.body
  @TeachersAssessmentsDocs.bulkUploadQuestions.operation
  @TeachersAssessmentsDocs.bulkUploadQuestions.response201
  @TeachersAssessmentsDocs.bulkUploadQuestions.response400
  @TeachersAssessmentsDocs.bulkUploadQuestions.response403
  @TeachersAssessmentsDocs.bulkUploadQuestions.response404
  async bulkUploadAssessmentQuestions(
    @Param('id') id: string,
    @UploadedFiles() files: { excel_file?: Express.Multer.File[] },
    @GetUser() user: any,
  ) {
    const file = files?.excel_file?.[0];
    if (!file) {
      throw new BadRequestException('excel_file is required');
    }
    return this.teachersAssessmentsService.bulkUploadAssessmentQuestionsFromExcel(
      id,
      file,
      user,
    );
  }

  // second endpoint is to get a specific assessment by id for a teacher
  // GET /teachers-assessments/:id
  // Private endpoint
  @Get(':id')
  @TeachersAssessmentsDocs.getById.operation
  @TeachersAssessmentsDocs.getById.response200
  @TeachersAssessmentsDocs.getById.response400
  @TeachersAssessmentsDocs.getById.response403
  @TeachersAssessmentsDocs.getById.response404
  async getTeacherAssessmentById(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.getTeacherAssessmentById(id, user);
  }

  // duplicate a specific assessment by id for a teacher
  @Post(':id/duplicate')
  @TeachersAssessmentsDocs.duplicateById.operation
  @TeachersAssessmentsDocs.duplicateById.response201
  @TeachersAssessmentsDocs.duplicateById.response400
  @TeachersAssessmentsDocs.duplicateById.response403
  @TeachersAssessmentsDocs.duplicateById.response404
  async duplicateTeacherAssessmentById(
    @Param('id') id: string,
    @Body() duplicateDto: DuplicateAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.duplicateTeacherAssessmentById(
      id,
      duplicateDto,
      user,
    );
  }

  // add questions (batch, no images)
  @Post(':id/questions')
  @TeachersAssessmentsDocs.addQuestionsById.operation
  @TeachersAssessmentsDocs.addQuestionsById.response201
  @TeachersAssessmentsDocs.addQuestionsById.response400
  @TeachersAssessmentsDocs.addQuestionsById.response403
  @TeachersAssessmentsDocs.addQuestionsById.response404
  async addTeacherAssessmentQuestions(
    @Param('id') id: string,
    @Body() addQuestionsDto: AddQuestionsDto,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.addTeacherAssessmentQuestions(
      id,
      addQuestionsDto,
      user,
    );
  }

  // add question atomically (question image + option images)
  @Post(':id/questions/with-image')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'image', maxCount: 1 },
      { name: 'optionImages', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @TeachersAssessmentsDocs.addQuestionWithImageById.operation
  @TeachersAssessmentsDocs.addQuestionWithImageById.response201
  @TeachersAssessmentsDocs.addQuestionWithImageById.response400
  @TeachersAssessmentsDocs.addQuestionWithImageById.response403
  @TeachersAssessmentsDocs.addQuestionWithImageById.response404
  async addTeacherQuestionWithImage(
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

    return this.teachersAssessmentsService.addTeacherQuestionWithImage(
      id,
      questionDataString,
      questionImage,
      optionImages,
      user,
    );
  }

  // update a single question (smart merge options)
  @Patch(':id/questions/:questionId')
  @TeachersAssessmentsDocs.updateQuestionById.operation
  @TeachersAssessmentsDocs.updateQuestionById.response200
  @TeachersAssessmentsDocs.updateQuestionById.response400
  @TeachersAssessmentsDocs.updateQuestionById.response403
  @TeachersAssessmentsDocs.updateQuestionById.response404
  async updateTeacherQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.updateTeacherQuestion(
      id,
      questionId,
      updateQuestionDto,
      user,
    );
  }

  // delete a question from an assessment
  @Delete(':id/questions/:questionId')
  @TeachersAssessmentsDocs.deleteQuestionById.operation
  @TeachersAssessmentsDocs.deleteQuestionById.response200
  @TeachersAssessmentsDocs.deleteQuestionById.response400
  @TeachersAssessmentsDocs.deleteQuestionById.response403
  @TeachersAssessmentsDocs.deleteQuestionById.response404
  async deleteTeacherAssessmentQuestion(
    @Param('id') assessmentId: string,
    @Param('questionId') questionId: string,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.deleteTeacherAssessmentQuestion(
      assessmentId,
      questionId,
      user,
    );
  }

  // update a question with image uploads (multipart)
  @Patch(':id/questions/:questionId/with-image')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'newQuestionImage', maxCount: 1 },
      { name: 'newOptionImages', maxCount: 10 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @TeachersAssessmentsDocs.updateQuestionWithImageById.operation
  @TeachersAssessmentsDocs.updateQuestionWithImageById.response200
  @TeachersAssessmentsDocs.updateQuestionWithImageById.response400
  @TeachersAssessmentsDocs.updateQuestionWithImageById.response403
  @TeachersAssessmentsDocs.updateQuestionWithImageById.response404
  async updateTeacherQuestionWithImage(
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
    // Parse questionData JSON
    let updateQuestionDto: any;
    if (!questionDataStr) {
      throw new Error('questionData field is required');
    }

    try {
      updateQuestionDto = JSON.parse(questionDataStr);
    } catch (error) {
      throw new Error('Invalid JSON in questionData field');
    }

    // Add old question image S3 key to DTO if provided
    if (oldQuestionImageS3Key) {
      updateQuestionDto.image_s3_key = oldQuestionImageS3Key;
    }

    // Parse optionImageUpdates JSON
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

    // Validate image files
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

    return this.teachersAssessmentsService.updateTeacherQuestionWithImage(
      assessmentId,
      questionId,
      updateQuestionDto,
      user,
      newQuestionImage,
      optionImageUpdates,
      newOptionImages,
    );
  }

  // fourth endpoint is to update a specific assessment by id for a teacher
  @Patch(':id')
  @TeachersAssessmentsDocs.updateById.operation
  @TeachersAssessmentsDocs.updateById.response200
  @TeachersAssessmentsDocs.updateById.response400
  @TeachersAssessmentsDocs.updateById.response403
  @TeachersAssessmentsDocs.updateById.response404
  async updateTeacherAssessmentById(
    @Param('id') id: string,
    @Body() updateDto: UpdateAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.updateTeacherAssessmentById(
      id,
      updateDto,
      user,
    );
  }
}

// third endpoint is to update a soecific assessment by id for a teacher
// Patch /teachers-assessments/:id
// Private
