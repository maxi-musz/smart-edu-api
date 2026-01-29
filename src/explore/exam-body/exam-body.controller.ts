import { Controller, Get, Post, Param, Query, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../../school/auth/guard';
import { ExploreExamBodyService } from './exam-body.service';
import { ExploreExamBodyDocs } from './docs/exam-body.docs';
import { SubmitExamBodyAssessmentDto } from './dto/submit-assessment.dto';

@ApiTags('Explore - Exam Bodies')
@ApiBearerAuth('JWT-auth')
@Controller('explore/exam-bodies')
export class ExploreExamBodyController {
  constructor(private readonly service: ExploreExamBodyService) {}

  // Get all exam bodies with subjects and years
  @Get()
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getAllExamBodies()
  getAllExamBodies() {
    return this.service.findAllExamBodies();
  }

  // Get all attempts for the authenticated user (optionally filtered by assessmentId)
  // MUST come before :examBodyId route to avoid routing conflicts
  @Get('attempts')
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getUserAttempts()
  getUserAttempts(
    @Request() req: any,
    @Query('assessmentId') assessmentId?: string,
  ) {
    return this.service.getUserAttempts(req.user, assessmentId);
  }

  // Get attempt results (MUST come after 'attempts' but before 'attempts/:attemptId')
  @Get('attempts/:attemptId')
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getAttemptResults()
  getAttemptResults(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
  ) {
    return this.service.getAttemptResults(req.user, attemptId);
  }

  // Get a single exam body with subjects and years
  @Get(':examBodyId')
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getExamBody()
  getExamBody(@Param('examBodyId') examBodyId: string) {
    return this.service.findOneExamBody(examBodyId);
  }

  // Get subjects for an exam body
  @Get(':examBodyId/subjects')
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getSubjects()
  getSubjects(@Param('examBodyId') examBodyId: string) {
    return this.service.getSubjects(examBodyId);
  }

  // Get years for an exam body
  @Get(':examBodyId/years')
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getYears()
  getYears(@Param('examBodyId') examBodyId: string) {
    return this.service.getYears(examBodyId);
  }

  // Get published assessments (optionally filtered by subjectId and yearId)
  @Get(':examBodyId/assessments')
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getAssessments()
  getAssessments(
    @Param('examBodyId') examBodyId: string,
    @Query('subjectId') subjectId?: string,
    @Query('yearId') yearId?: string,
  ) {
    return this.service.getAssessments(examBodyId, subjectId, yearId);
  }

  // Get questions for an assessment (WITHOUT correct answers)
  @Get(':examBodyId/assessments/:assessmentId/questions')
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getQuestions()
  getQuestions(
    @Param('examBodyId') examBodyId: string,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.service.getQuestions(examBodyId, assessmentId);
  }

  // Submit assessment (automatic grading, results released immediately)
  @Post(':examBodyId/assessments/:assessmentId/submit')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.submitAssessment()
  submitAssessment(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('assessmentId') assessmentId: string,
    @Body() submitDto: SubmitExamBodyAssessmentDto,
  ) {
    return this.service.submitAssessment(req.user, examBodyId, assessmentId, submitDto);
  }

  // Get attempts for a specific assessment (nested route)
  @Get(':examBodyId/assessments/:assessmentId/attempts')
  @UseGuards(JwtGuard)
  @ExploreExamBodyDocs.getAssessmentAttempts()
  getAssessmentAttempts(
    @Request() req: any,
    @Param('examBodyId') examBodyId: string,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.service.getUserAttempts(req.user, assessmentId);
  }
}
