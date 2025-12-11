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
import { ResultMainPageResponseDto } from './dto/result-main-page.dto';

@ApiTags('Teachers - Results')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  /**
   * Get data for result main page
   * GET /api/v1/teachers/results/main-page
   */
  @Get('main-page')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get data for result main page',
    description: 'Retrieves a list of sessions/terms, and for a selected session/term (defaults to current), returns every class managed by the teacher with students and their released subject results (as prepared by the director). Supports pagination of students.'
  })
  @ApiQuery({ name: 'sessionId', required: false, description: 'Academic session ID to filter by (defaults to current session)' })
  @ApiQuery({ name: 'term', required: false, description: 'Term to filter by; used with sessionId' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for students pagination (defaults to 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size for students pagination (defaults to 30)', example: 30 })
  @ApiResponse({ 
    status: 200, 
    description: 'Result main page data retrieved successfully',
    type: ResultMainPageResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing JWT token' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Teacher not found or no classes/subjects assigned' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Access denied' 
  })
  getResultMainPageData(
    @GetUser() user: any,
    @Query('sessionId') sessionId?: string,
    @Query('term') term?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 30;
    return this.resultsService.getResultMainPageData(user, { sessionId, term, page: pageNum, limit: limitNum });
  }
}
