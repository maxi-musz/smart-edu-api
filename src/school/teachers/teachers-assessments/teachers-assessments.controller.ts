import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard';
import { GetUser } from 'src/school/auth/decorator';
import { GetAssessmentsQueryDto } from 'src/assessment/dto/get-assessments-query.dto';
import { UpdateAssessmentDto } from 'src/assessment/dto/update-assessment.dto';
import { TeachersAssessmentsService } from './teachers-assessments.service';

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
  @ApiOperation({
    summary: 'Fetch all assessments for the authenticated teacher',
  })
  @ApiResponse({ status: 200, description: 'Assessments fetched successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid query/auth context',
  })
  @ApiResponse({ status: 404, description: 'Teacher record not found' })
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
  @Get(':id/questions')
  @ApiOperation({ summary: 'Fetch assessment questions (teacher preview mode)' })
  @ApiResponse({ status: 200, description: 'Questions fetched successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid auth/context' })
  @ApiResponse({ status: 403, description: 'Forbidden - teacher has no access to this assessment' })
  @ApiResponse({ status: 404, description: 'Not found - teacher/assessment not found' })
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
  @ApiOperation({
    summary: 'Fetch full assessment details for the authenticated teacher',
  })
  @ApiResponse({
    status: 200,
    description: 'Assessment details fetched successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid auth or missing session',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teacher has no access to this assessment',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - teacher or assessment not found',
  })
  async getTeacherAssessmentById(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.teachersAssessmentsService.getTeacherAssessmentById(id, user);
  }

  // fourth endpoint is to update a specific assessment by id for a teacher
  @Patch(':id')
  @ApiOperation({ summary: 'Update an assessment (teacher-only)' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - cannot update published/active assessments',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - teacher does not have access to update',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found - assessment not found or access denied',
  })
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
