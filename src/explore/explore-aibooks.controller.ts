import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExploreAiBooksService } from './explore-aibooks.service';
import { QueryAiBooksDto } from './dto';
import { JwtGuard } from '../school/auth/guard';

@ApiTags('Explore - AI Books')
@Controller('explore/ai-books')
export class ExploreAiBooksController {
  constructor(private readonly exploreAiBooksService: ExploreAiBooksService) {}

  @Get('landing-page')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch AI book landing page data' })
  @ApiResponse({ status: 200, description: 'Landing page data fetched successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async fetchAiBookLandingPageData(@Request() req: any, @Query() queryDto: QueryAiBooksDto) {
    return this.exploreAiBooksService.fetchAiBookLandingPageData(req.user, queryDto);
  }

  @Get(':bookId/chapters')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch all chapters for a book' })
  @ApiResponse({ status: 200, description: 'Chapters retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book not found' })
  async getBookChapters(@Request() req: any, @Param('bookId') bookId: string) {
    return this.exploreAiBooksService.getBookChapters(req.user, bookId);
  }

  @Get(':bookId/chapters/:chapterId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch a single chapter for a book' })
  @ApiResponse({ status: 200, description: 'Chapter retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Book or chapter not found' })
  async getBookChapter(@Request() req: any, @Param('bookId') bookId: string, @Param('chapterId') chapterId: string) {
    return this.exploreAiBooksService.getBookChapter(req.user, bookId, chapterId);
  }
}
