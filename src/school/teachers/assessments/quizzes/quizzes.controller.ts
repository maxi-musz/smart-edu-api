import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { JwtGuard } from '../../../auth/guard/jwt.guard';
import { GetUser } from '../../../auth/decorator/get-user-decorator';

@ApiTags('Teachers - CBT Quizzes')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/assessments/quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  // ========================================
  // CBT QUIZ CRUD ENDPOINTS
  // ========================================
  
  // TODO: Implement quiz endpoints:
  // - POST / - Create CBT quiz
  // - GET /topic/:topicId - Get topic quizzes
  // - GET /:id - Get single quiz
  // - PUT /:id - Update quiz
  // - DELETE /:id - Delete quiz
  // - POST /:id/grade/:submissionId - Grade quiz
  // - GET /:id/questions - Get quiz questions
  // - POST /:id/questions - Add quiz questions
}
