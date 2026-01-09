import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { QuerySubjectsDto, QueryVideosDto } from './dto';
import { ExploreDocs } from './docs';
import { JwtGuard } from '../school/auth/guard';

@ApiTags('Explore')
@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get('/')
  @ExploreDocs.getExploreData()
  async getExploreData() {
    return this.exploreService.getExploreData();
  }

  @Get('subjects')
  @ExploreDocs.getSubjects()
  async getSubjects(@Query() queryDto: QuerySubjectsDto) {
    return this.exploreService.getSubjects(queryDto);
  }

  @Get('videos')
  @ExploreDocs.getVideos()
  async getVideos(@Query() queryDto: QueryVideosDto) {
    return this.exploreService.getVideos(queryDto);
  }

  @Get('topics/:subjectId')
  @ExploreDocs.getTopicsBySubject()
  async getTopicsBySubject(@Param('subjectId') subjectId: string) {
    return this.exploreService.getTopicsBySubject(subjectId);
  }

  @Get('videos/:videoId/play')
  @UseGuards(JwtGuard)
  @ExploreDocs.playVideo()
  async playVideo(@Request() req: any, @Param('videoId') videoId: string) {
    return this.exploreService.playVideo(req.user, videoId);
  }
}

