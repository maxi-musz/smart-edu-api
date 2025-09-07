import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ResponseHelper } from '../../../../shared/helper-functions/response.helpers';
import { Logger } from '@nestjs/common';
import * as colors from 'colors';

@Injectable()
export class QuizzesService {
  private readonly logger = new Logger(QuizzesService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ========================================
  // CBT QUIZ MANAGEMENT METHODS
  // ========================================
  
  // TODO: Implement quiz methods:
  // - createQuiz()
  // - getTopicQuizzes()
  // - getQuizById()
  // - updateQuiz()
  // - deleteQuiz()
  // - gradeQuiz()
  // - getQuizQuestions()
  // - addQuizQuestion()
  // - updateQuizQuestion()
  // - deleteQuizQuestion()
  // - getQuizSubmissions()
  // - getQuizAnalytics()
}
