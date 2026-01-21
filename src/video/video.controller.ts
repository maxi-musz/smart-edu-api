import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { UniversalJwtGuard } from './guards/universal-jwt.guard';
import { TrackWatchProgressDto } from './dto/track-watch-progress.dto';

@ApiTags('Video - Universal Playback')
@Controller('video')
@UseGuards(UniversalJwtGuard)
@ApiBearerAuth()
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Universal video playback endpoint
   * Works for both library videos (LibraryVideoLesson) and school videos (VideoContent)
   * Automatically detects video type and tracks unique views
   */
  @Get(':videoId/play')
  @ApiOperation({
    summary: 'Play video (Universal)',
    description:
      'Universal video playback endpoint that works for all video types. Automatically detects video type (library or school), tracks unique views (YouTube-style), and returns video details with playback URL. Supports resume functionality with last watch position.',
  })
  @ApiParam({
    name: 'videoId',
    description: 'Video ID (works for both LibraryVideoLesson and VideoContent)',
    example: 'video-uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Video retrieved successfully for playback',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Video not found or not published' })
  async playVideo(@Request() req: any, @Param('videoId') videoId: string) {
    return this.videoService.playVideo(req.user, videoId);
  }

  /**
   * Track video watch progress and history
   * Records detailed watch metrics for analytics and resume functionality
   */
  @Post(':videoId/watch-progress')
  @ApiOperation({
    summary: 'Track video watch progress',
    description:
      'Records detailed watch progress including completion percentage, last position, device info, and engagement metrics. Enables resume functionality and analytics.',
  })
  @ApiParam({
    name: 'videoId',
    description: 'Video ID',
    example: 'video-uuid-123',
  })
  @ApiBody({ type: TrackWatchProgressDto })
  @ApiResponse({
    status: 200,
    description: 'Watch progress tracked successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async trackWatchProgress(
    @Request() req: any,
    @Param('videoId') videoId: string,
    @Body() watchData: TrackWatchProgressDto,
  ) {
    return this.videoService.trackWatchProgress(req.user, videoId, watchData);
  }
}

