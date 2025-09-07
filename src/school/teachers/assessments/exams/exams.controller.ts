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
import { ExamsService } from './exams.service';
import { JwtGuard } from '../../../auth/guard/jwt.guard';
import { GetUser } from '../../../auth/decorator/get-user-decorator';

@ApiTags('Teachers - Exams')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/assessments/exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // ========================================
  // EXAM CRUD ENDPOINTS
  // ========================================
  
  // TODO: Implement exam endpoints:
  // - POST / - Create exam
  // - GET /topic/:topicId - Get topic exams
  // - GET /:id - Get single exam
  // - PUT /:id - Update exam
  // - DELETE /:id - Delete exam
  // - POST /:id/grade/:submissionId - Grade exam
  // - GET /:id/questions - Get exam questions
  // - POST /:id/questions - Add exam questions
  // - GET /:id/results - Get exam results
  // - POST /:id/schedule - Schedule exam
  // - POST /:id/start - Start exam session
  // - POST /:id/end - End exam session
}
