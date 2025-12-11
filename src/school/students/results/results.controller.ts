import {
  Controller,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';
import { StudentResultResponseDto } from './dto/student-result.dto';

@ApiTags('Students - Results')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('students/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  /**
   * Get student results
   * GET /api/v1/students/results
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get student results',
    description: 'Retrieves a list of sessions/terms, and for a selected session/term (defaults to current), returns the student\'s current class, subjects, and released results (as prepared by the director).'
  })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Academic session ID to filter by (defaults to current session)' })
  @ApiQuery({ name: 'term', required: false, description: 'Term to filter by; used with sessionId' })
  @ApiResponse({ 
    status: 200, 
    description: 'Student result retrieved successfully',
    type: StudentResultResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Student not found or not assigned to a class' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Access denied' 
  })
  getStudentResults(
    @GetUser() user: any,
    @Query('sessionId') sessionId?: string,
    @Query('term') term?: string
  ) {
    return this.resultsService.getStudentResults(user, { sessionId, term });
  }
}
