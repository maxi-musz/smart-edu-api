import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';
import { StudentAssessmentService } from './student-assessment.service';
import { GetStudentAssessmentsQueryDto } from './dto/get-assessments-query.dto';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

@ApiTags('Student - Assessments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('student-assessment')
export class StudentAssessmentController {
  constructor(
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List assessments for the authenticated student' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in title or description' })
  @ApiQuery({ name: 'assessmentType', required: false, type: String, description: 'Filter by assessment type' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by status' })
  @ApiQuery({ name: 'subject_id', required: false, type: String, description: 'Filter by subject ID' })
  @ApiResponse({ status: 200, description: 'Assessments fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  fetchAssessments(
    @Query() query: GetStudentAssessmentsQueryDto,
    @GetUser() user: any,
  ) {
    return this.studentAssessmentService.fetchAssessments(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment details by ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  getAssessmentDetails(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.studentAssessmentService.getAssessmentDetails(id, user);
  }

  @Get(':id/questions')
  @ApiOperation({ summary: 'Get assessment questions for taking the assessment' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment questions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  getAssessmentQuestions(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.studentAssessmentService.getAssessmentQuestions(id, user);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit assessment answers' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 201, description: 'Assessment submitted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  submitAssessment(
    @Param('id') id: string,
    @Body() body: SubmitAssessmentDto,
    @GetUser() user: any,
  ) {
    return this.studentAssessmentService.submitAssessment(id, body, user);
  }

  @Get(':id/answers')
  @ApiOperation({ summary: 'View assessment with answers and grading' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment with answers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  getAssessmentWithAnswers(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.studentAssessmentService.getAssessmentWithAnswers(id, user);
  }
}
