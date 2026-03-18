import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { GetAssessmentsQueryDto } from 'src/assessment/dto/get-assessments-query.dto';
import { UpdateAssessmentDto } from 'src/assessment/dto/update-assessment.dto';
import { DuplicateAssessmentDto } from 'src/assessment/dto/duplicate-assessment.dto';
import { TeachersAssessmentsService } from './teachers-assessments.service';
import { TeachersAssessmentsDocs } from './docs/teachers-assessments.docs';

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
