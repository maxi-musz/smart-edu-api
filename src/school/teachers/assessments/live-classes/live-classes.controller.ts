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
import { LiveClassesService } from './live-classes.service';
import { JwtGuard } from '../../../auth/guard/jwt.guard';
import { GetUser } from '../../../auth/decorator/get-user-decorator';

@ApiTags('Teachers - Live Classes')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/assessments/live-classes')
export class LiveClassesController {
  constructor(private readonly liveClassesService: LiveClassesService) {}

  // ========================================
  // LIVE CLASS CRUD ENDPOINTS
  // ========================================
  
  // TODO: Implement live class endpoints:
  // - POST / - Create live class
  // - GET /topic/:topicId - Get topic live classes
  // - GET /:id - Get single live class
  // - PUT /:id - Update live class
  // - DELETE /:id - Delete live class
  // - POST /:id/start - Start live class
  // - POST /:id/end - End live class
  // - GET /:id/participants - Get participants
  // - POST /:id/join - Join live class
}
