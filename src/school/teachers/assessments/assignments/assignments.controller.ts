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
import { AssignmentsService } from './assignments.service';
import { JwtGuard } from '../../../auth/guard/jwt.guard';
import { GetUser } from '../../../auth/decorator/get-user-decorator';

@ApiTags('Teachers - Assignments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/assessments/assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

}
