import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtGuard } from '../school/auth/guard';
import { ExamPracticeService } from './exam-practice.service';
import { SubmitExamAssessmentDto } from './dto';

@ApiTags('Exam Practice')
@Controller('exam-practice')
export class ExamPracticeController {
  constructor(private readonly service: ExamPracticeService) {}

  @Get('exam-bodies')
  getExamBodiesWithSubjects() {
    return this.service.getExamBodiesWithSubjects();
  }

  @Get('assessments')
  getAssessmentsByFilters(
    @Query('examBodyId') examBodyId: string,
    @Query('subjectId') subjectId?: string,
    @Query('yearId') yearId?: string,
  ) {
    return this.service.getAssessmentsByFilters(examBodyId, subjectId, yearId);
  }

  @Get('assessments/:assessmentId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  getAssessmentDetails(@Request() req: any, @Param('assessmentId') assessmentId: string) {
    return this.service.getAssessmentDetails(req.user.sub, assessmentId);
  }

  @Get('assessments/:assessmentId/questions')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  getAssessmentQuestions(@Request() req: any, @Param('assessmentId') assessmentId: string) {
    return this.service.getAssessmentQuestions(req.user.sub, assessmentId);
  }

  @Post('assessments/:assessmentId/submit')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  submitAssessment(
    @Request() req: any,
    @Param('assessmentId') assessmentId: string,
    @Body() submitDto: SubmitExamAssessmentDto,
  ) {
    return this.service.submitAssessment(req.user, assessmentId, submitDto);
  }
}

