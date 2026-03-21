import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { GetUser } from '../library-auth/decorator/get-user.decorator';
import { LibraryAssessmentService } from './library-assessment.service';
import { CreateLibraryAssessmentDto } from './dto/create-assessment.dto';
import { UpdateLibraryAssessmentDto } from './dto/update-assessment.dto';
import { GetLibraryAssessmentsQueryDto } from './dto/get-assessments-query.dto';
import { SubmitLibraryAssessmentDto } from './dto/submit-assessment.dto';
import { DuplicateLibraryAssessmentDto } from './dto/duplicate-assessment.dto';
import { AddLibraryQuestionsDto } from './dto/add-questions.dto';
import { UpdateLibraryQuestionDto } from './dto/update-question.dto';

@ApiTags('Library - Assessments')
@ApiBearerAuth()
@UseGuards(LibraryJwtGuard)
@Controller('library-assessment')
export class LibraryAssessmentController {
  constructor(
    private readonly libraryAssessmentService: LibraryAssessmentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a library assessment' })
  createAssessment(
    @Body() dto: CreateLibraryAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.createAssessment(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List library assessments' })
  getAllAssessments(
    @Query() query: GetLibraryAssessmentsQueryDto,
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.getAllAssessments(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get library assessment details' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  getAssessmentDetails(@Param('id') id: string, @GetUser() user: any) {
    return this.libraryAssessmentService.getAssessmentDetails(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a library assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  updateAssessment(
    @Param('id') id: string,
    @Body() dto: UpdateLibraryAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.updateAssessment(id, dto, user);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get assessment questions (with answers for owners)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  getAssessmentQuestions(@Param('id') id: string, @GetUser() user: any) {
    return this.libraryAssessmentService.getAssessmentQuestions(id, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit assessment answers' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  submitAssessment(
    @Param('id') id: string,
    @Body() dto: SubmitLibraryAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.submitAssessment(id, dto, user);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate an assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  duplicateAssessment(
    @Param('id') id: string,
    @Body() dto: DuplicateLibraryAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.duplicateAssessment(id, dto, user);
  }

  @Post(':id/questions')
  @ApiOperation({ summary: 'Add questions to assessment (JSON)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  addQuestions(
    @Param('id') id: string,
    @Body() dto: AddLibraryQuestionsDto,
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.addQuestions(id, dto, user);
  }

  @Post(':id/questions/with-image')
  @ApiOperation({ summary: 'Add a question with image uploads' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'questionImage', maxCount: 1 },
      { name: 'optionImages', maxCount: 10 },
    ]),
  )
  addQuestionWithImage(
    @Param('id') id: string,
    @Body('questionData') questionData: string,
    @UploadedFiles()
    files: {
      questionImage?: Express.Multer.File[];
      optionImages?: Express.Multer.File[];
    },
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.addQuestionWithImage(
      id,
      questionData,
      files?.questionImage?.[0],
      files?.optionImages || [],
      user,
    );
  }

  @Patch(':id/questions/:questionId')
  @ApiOperation({ summary: 'Update a question' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  updateQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateLibraryQuestionDto,
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.updateQuestion(
      id,
      questionId,
      dto,
      user,
    );
  }

  @Patch(':id/questions/:questionId/with-image')
  @ApiOperation({ summary: 'Update a question with image uploads' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'questionImage', maxCount: 1 },
      { name: 'optionImages', maxCount: 10 },
    ]),
  )
  updateQuestionWithImage(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateLibraryQuestionDto,
    @UploadedFiles()
    files: {
      questionImage?: Express.Multer.File[];
      optionImages?: Express.Multer.File[];
    },
    @GetUser() user: any,
  ) {
    const optionImageUpdates = dto['optionImageUpdates'] as
      | Array<{ optionId: string; oldS3Key?: string }>
      | undefined;

    return this.libraryAssessmentService.updateQuestionWithImage(
      id,
      questionId,
      dto,
      user,
      files?.questionImage?.[0],
      optionImageUpdates,
      files?.optionImages,
    );
  }

  @Delete(':id/questions/:questionId')
  @ApiOperation({ summary: 'Delete a question from assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiParam({ name: 'questionId', description: 'Question ID' })
  deleteQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @GetUser() user: any,
  ) {
    return this.libraryAssessmentService.deleteQuestion(id, questionId, user);
  }
}
