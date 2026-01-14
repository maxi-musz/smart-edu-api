import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExamBodyAssessmentService } from './exam-body-assessment.service';
import { CreateExamBodyAssessmentDto, CreateExamBodyQuestionDto, UpdateExamBodyAssessmentDto } from './dto';

@ApiTags('Developer - Exam Body Assessments')
@ApiBearerAuth()
@Controller('developer/exam-bodies/:examBodyId/assessments')
export class ExamBodyAssessmentController {
  constructor(private readonly service: ExamBodyAssessmentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createAssessment(
    @Param('examBodyId') examBodyId: string,
    @Query('subjectId') subjectId: string,
    @Query('yearId') yearId: string,
    @Body() createDto: CreateExamBodyAssessmentDto,
  ) {
    return this.service.createAssessment(examBodyId, subjectId, yearId, createDto);
  }

  @Get()
  findAllAssessments(
    @Param('examBodyId') examBodyId: string,
    @Query('subjectId') subjectId?: string,
    @Query('yearId') yearId?: string,
  ) {
    return this.service.findAllAssessments(examBodyId, subjectId, yearId);
  }

  @Get(':id')
  findOneAssessment(@Param('id') id: string) {
    return this.service.findOneAssessment(id);
  }

  @Patch(':id')
  updateAssessment(@Param('id') id: string, @Body() updateDto: UpdateExamBodyAssessmentDto) {
    return this.service.updateAssessment(id, updateDto);
  }

  @Delete(':id')
  deleteAssessment(@Param('id') id: string) {
    return this.service.deleteAssessment(id);
  }

  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  createQuestion(@Param('id') assessmentId: string, @Body() createDto: CreateExamBodyQuestionDto) {
    return this.service.createQuestion(assessmentId, createDto);
  }

  @Get(':id/questions')
  getQuestions(@Param('id') assessmentId: string) {
    return this.service.getQuestions(assessmentId);
  }

  @Delete('questions/:questionId')
  deleteQuestion(@Param('questionId') questionId: string) {
    return this.service.deleteQuestion(questionId);
  }

  @Patch(':id/publish')
  publishAssessment(@Param('id') id: string) {
    return this.service.publishAssessment(id);
  }

  @Patch(':id/unpublish')
  unpublishAssessment(@Param('id') id: string) {
    return this.service.unpublishAssessment(id);
  }
}

