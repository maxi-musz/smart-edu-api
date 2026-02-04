import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HlsTranscodeService } from '../../shared/services/hls-transcode.service';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';

// TODO: Add proper admin guard when available
// import { AdminGuard } from '../guards/admin.guard';

@ApiTags('Admin - HLS Transcode')
@Controller('admin/hls-transcode')
// @UseGuards(AdminGuard) // Uncomment when admin guard is available
export class HlsTranscodeController {
  constructor(private readonly hlsTranscodeService: HlsTranscodeService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get HLS transcode statistics' })
  @ApiResponse({ status: 200, description: 'Transcode statistics retrieved' })
  async getStats() {
    const stats = await this.hlsTranscodeService.getTranscodeStats();
    return ResponseHelper.success('Transcode statistics retrieved', stats);
  }

  @Get('failed/library')
  @ApiOperation({ summary: 'Get all failed library video transcodes' })
  @ApiResponse({ status: 200, description: 'Failed library videos retrieved' })
  async getFailedLibraryVideos() {
    const videos = await this.hlsTranscodeService.getFailedLibraryVideos();
    return ResponseHelper.success('Failed library videos retrieved', {
      count: videos.length,
      videos,
    });
  }

  @Get('failed/school')
  @ApiOperation({ summary: 'Get all failed school video transcodes' })
  @ApiResponse({ status: 200, description: 'Failed school videos retrieved' })
  async getFailedSchoolVideos() {
    const videos = await this.hlsTranscodeService.getFailedSchoolVideos();
    return ResponseHelper.success('Failed school videos retrieved', {
      count: videos.length,
      videos,
    });
  }

  @Post('retry/library/:videoId')
  @ApiOperation({ summary: 'Retry HLS transcode for a library video' })
  @ApiResponse({ status: 200, description: 'Transcode retry queued' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async retryLibraryVideo(@Param('videoId') videoId: string) {
    // Trigger in background, don't wait
    this.hlsTranscodeService.retryLibraryVideoTranscode(videoId);
    return ResponseHelper.success('Transcode retry queued', { videoId });
  }

  @Post('retry/school/:videoId')
  @ApiOperation({ summary: 'Retry HLS transcode for a school video' })
  @ApiResponse({ status: 200, description: 'Transcode retry queued' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async retrySchoolVideo(@Param('videoId') videoId: string) {
    // Trigger in background, don't wait
    this.hlsTranscodeService.retrySchoolVideoTranscode(videoId);
    return ResponseHelper.success('Transcode retry queued', { videoId });
  }

  @Post('retry-all/library')
  @ApiOperation({ summary: 'Retry all failed library video transcodes' })
  @ApiResponse({ status: 200, description: 'Bulk retry queued' })
  async retryAllFailedLibraryVideos() {
    const result = await this.hlsTranscodeService.retryAllFailedLibraryVideos();
    return ResponseHelper.success('Bulk retry queued for library videos', result);
  }

  @Post('retry-all/school')
  @ApiOperation({ summary: 'Retry all failed school video transcodes' })
  @ApiResponse({ status: 200, description: 'Bulk retry queued' })
  async retryAllFailedSchoolVideos() {
    const result = await this.hlsTranscodeService.retryAllFailedSchoolVideos();
    return ResponseHelper.success('Bulk retry queued for school videos', result);
  }

  @Get('status/library/:videoId')
  @ApiOperation({ summary: 'Get HLS transcode status for a library video' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getLibraryVideoStatus(@Param('videoId') videoId: string) {
    const status = await this.hlsTranscodeService.getLibraryVideoTranscodeStatus(videoId);
    return ResponseHelper.success('Transcode status retrieved', status);
  }

  @Get('status/school/:videoId')
  @ApiOperation({ summary: 'Get HLS transcode status for a school video' })
  @ApiResponse({ status: 200, description: 'Status retrieved' })
  async getSchoolVideoStatus(@Param('videoId') videoId: string) {
    const status = await this.hlsTranscodeService.getSchoolVideoTranscodeStatus(videoId);
    return ResponseHelper.success('Transcode status retrieved', status);
  }
}
