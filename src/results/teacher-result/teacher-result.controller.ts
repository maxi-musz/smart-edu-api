import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from '../../school/auth/guard/jwt.guard';
import { TeacherResultService } from './teacher-result.service';

/**
 * HTTP routes under `/teacher/results` — add endpoints here as you build them.
 */
@ApiTags('Teacher - Results')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teacher/results')
export class TeacherResultController {
  constructor(private readonly teacherResultService: TeacherResultService) {}
}
