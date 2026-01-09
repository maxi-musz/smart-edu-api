import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
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
}

