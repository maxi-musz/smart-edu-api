import { Controller, Post, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ResultsService } from './results.service';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';

@ApiTags('Director - Results')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('director/results')
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post('release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Release results for all students in current session',
    description: 'Collates all CA and Exam scores for all students and creates Result records. This is a batch operation that processes students in batches to avoid system overload.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Results released successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            total_students: { type: 'number' },
            processed: { type: 'number' },
            errors: { type: 'number' },
            session: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                academic_year: { type: 'string' },
                term: { type: 'string' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Director role required' })
  @ApiResponse({ status: 404, description: 'No current session or students found' })
  async releaseResults(@GetUser() user: any) {
    return this.resultsService.releaseResults(user.school_id, user.sub);
  }
}

