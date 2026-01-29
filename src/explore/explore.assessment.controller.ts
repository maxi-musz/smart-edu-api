import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExploreAssessmentService } from './explore.assessment.service';
import { JwtGuard } from '../school/auth/guard';
import { ExploreAssessmentDocs } from './docs/explore.assessment.docs';
import { SubmitAssessmentDto } from './dto';

@ApiTags('Explore - Assessments')
@Controller('explore/assessments')
@UseGuards(JwtGuard)
@ApiBearerAuth('JWT-auth')
export class ExploreAssessmentController {
  constructor(
    private readonly exploreAssessmentService: ExploreAssessmentService,
  ) {}

  @Get(':assessmentId')
  @ExploreAssessmentDocs.getAssessment()
  async getAssessment(
    @Request() req: any,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.exploreAssessmentService.getAssessment(
      req.user,
      assessmentId,
    );
  }

  @Get(':assessmentId/questions')
  @ExploreAssessmentDocs.getAssessmentQuestions()
  async getAssessmentQuestions(
    @Request() req: any,
    @Param('assessmentId') assessmentId: string,
  ) {
    return this.exploreAssessmentService.getAssessmentQuestions(
      req.user,
      assessmentId,
    );
  }

  @Post(':assessmentId/submit')
  @ExploreAssessmentDocs.submitAssessment()
  async submitAssessment(
    @Request() req: any,
    @Param('assessmentId') assessmentId: string,
    @Body() submitDto: SubmitAssessmentDto,
  ) {
    return this.exploreAssessmentService.submitAssessment(
      req.user,
      assessmentId,
      submitDto,
    );
  }

  // Get all attempts for user (MUST come before attempts/:attemptId to avoid route conflicts)
  @Get('attempts')
  @ExploreAssessmentDocs.getUserAttempts()
  async getUserAttempts(
    @Request() req: any,
    @Query('assessmentId') assessmentId?: string,
  ) {
    return this.exploreAssessmentService.getUserAttempts(
      req.user,
      assessmentId,
    );
  }

  @Get('attempts/:attemptId')
  @ExploreAssessmentDocs.getAttemptResults()
  async getAttemptResults(
    @Request() req: any,
    @Param('attemptId') attemptId: string,
  ) {
    return this.exploreAssessmentService.getAttemptResults(
      req.user,
      attemptId,
    );
  }
}

