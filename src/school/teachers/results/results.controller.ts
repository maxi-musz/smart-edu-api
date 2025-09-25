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
    description: 'Retrieves current session, teacher classes, default subject, and paginated student results for the first class and subject'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (defaults to 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (defaults to 10)', example: 10 })
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
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const pageNum = page ? parseInt(page.toString(), 10) : 1;
    const limitNum = limit ? parseInt(limit.toString(), 10) : 10;
    return this.resultsService.getResultMainPageData(user, pageNum, limitNum);
  }
}
