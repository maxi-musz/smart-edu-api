import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ResponseHelper } from '../../../../shared/helper-functions/response.helpers';
import { Logger } from '@nestjs/common';
import * as colors from 'colors';

@Injectable()
export class GradingService {
  private readonly logger = new Logger(GradingService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ========================================
  // GRADING METHODS
  // ========================================
  
  // TODO: Implement grading methods:
  // - gradeAssignment()
  // - gradeQuiz()
  // - getSubmissionDetails()
  // - getGradingHistory()
  // - getGradingAnalytics()
  // - bulkGradeSubmissions()
  // - createGradingRubric()
  // - getGradingRubrics()
  // - updateGradingRubric()
  // - deleteGradingRubric()
}
