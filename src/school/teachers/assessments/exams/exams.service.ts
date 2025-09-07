import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ResponseHelper } from '../../../../shared/helper-functions/response.helpers';
import { Logger } from '@nestjs/common';
import * as colors from 'colors';

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ========================================
  // EXAM MANAGEMENT METHODS
  // ========================================
  
  // TODO: Implement exam methods:
  // - createExam()
  // - getTopicExams()
  // - getExamById()
  // - updateExam()
  // - deleteExam()
  // - gradeExam()
  // - getExamQuestions()
  // - addExamQuestion()
  // - updateExamQuestion()
  // - deleteExamQuestion()
  // - getExamResults()
  // - scheduleExam()
  // - startExamSession()
  // - endExamSession()
  // - getExamAnalytics()
  // - getExamSubmissions()
  // - getExamStatistics()
}
