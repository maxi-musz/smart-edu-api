import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { QuerySubjectsDto, QueryVideosDto } from './dto';
import { ExploreDocs } from './docs';
import { JwtGuard } from '../school/auth/guard';

@ApiTags('Explore')
@Controller('explore')
@UseGuards(JwtGuard)
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get('/')
  @ExploreDocs.getExploreData()
  async getExploreData(@Request() req: any) {
    return this.exploreService.getExploreData(req.user);
  }

  @Get('subjects')
  @ExploreDocs.getSubjects()
  async getSubjects(@Request() req: any, @Query() queryDto: QuerySubjectsDto) {
    return this.exploreService.getSubjects(req.user, queryDto);
  }

  @Get('videos')
  @ExploreDocs.getVideos()
  async getVideos(@Request() req: any, @Query() queryDto: QueryVideosDto) {
    return this.exploreService.getVideos(req.user, queryDto);
  }

  @Get('topics/:subjectId')
  @ExploreDocs.getTopicsBySubject()
  async getTopicsBySubject(
    @Request() req: any,
    @Param('subjectId') subjectId: string,
  ) {
    return this.exploreService.getTopicsForSubject(subjectId, req.user);
  }

  @Get('videos/:videoId/play')
  @ExploreDocs.playVideo()
  async playVideo(@Request() req: any, @Param('videoId') videoId: string) {
    return this.exploreService.playVideo(req.user, videoId);
  }
}

