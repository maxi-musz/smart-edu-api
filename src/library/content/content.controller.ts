import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  Get,
  Param,
  Query,
  Sse,
  Delete,
  Patch,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { ContentService } from './content.service';
import {
  UploadLibraryVideoDto,
  UploadLibraryVideoResponseDto,
} from './dto/upload-video.dto';
import {
  UploadLibraryMaterialDto,
  UploadLibraryMaterialResponseDto,
} from './dto/upload-material.dto';
import { CreateLibraryLinkDto } from './dto/create-link.dto';
import { UpdateLibraryVideoDto } from './dto/update-video.dto';
import {
  RequestVideoUploadDto,
  ConfirmVideoUploadDto,
  RequestThumbnailUploadDto,
} from './dto/request-video-upload.dto';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { UploadProgressService } from '../../school/ai-chat/upload-progress.service';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { MessageEvent } from '@nestjs/common';

@ApiTags('Library Content')
@Controller('library/content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly uploadProgressService: UploadProgressService,
  ) {}

  // ==================== VIDEO UPLOAD ====================

  @Post('upload-video/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Start video upload with progress tracking',
    description:
      'Starts a video upload session and returns a sessionId. Use the progress endpoint to track upload status.',
  })
  @ApiBody({
    description:
      'Video upload data with optional thumbnail (duration is auto-extracted from video file)',
    schema: {
      type: 'object',
      properties: {
        topicId: { type: 'string', description: 'Library topic ID' },
        subjectId: { type: 'string', description: 'Library subject ID' },
        title: { type: 'string', description: 'Video title' },
        description: {
          type: 'string',
          description: 'Video description (optional)',
        },
        video: {
          type: 'string',
          format: 'binary',
          description: 'Video file (MP4, max 500MB)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Thumbnail image (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Upload started successfully',
    type: UploadLibraryVideoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async startVideoUpload(
    @Request() req: any,
    @Body() uploadDto: UploadLibraryVideoDto,
    @UploadedFiles()
    files: { video?: Express.Multer.File[]; thumbnail?: Express.Multer.File[] },
  ) {
    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];
    return await this.contentService.startVideoUploadSession(
      uploadDto,
      videoFile!,
      thumbnailFile,
      req.user,
    );
  }

  // ==================== DIRECT-TO-S3 PRESIGNED UPLOAD (FAST) ====================

  @Post('request-video-upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get presigned URL for direct-to-S3 video upload (fast path)',
    description:
      'Returns presigned URL(s) for the client to upload directly to S3, bypassing the backend. ' +
      'For files <= 100MB: returns a single presigned PUT URL. ' +
      'For files > 100MB: initiates multipart upload with per-part presigned URLs. ' +
      'After uploading to S3, call confirm-video-upload to save the record.',
  })
  @ApiResponse({ status: 200, description: 'Presigned URL(s) generated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async requestVideoUpload(
    @Request() req: any,
    @Body() dto: RequestVideoUploadDto,
  ) {
    return await this.contentService.requestVideoUpload(dto, req.user);
  }

  @Post('request-thumbnail-upload')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get presigned URL for direct-to-S3 thumbnail upload',
    description:
      'Returns a presigned PUT URL for uploading a thumbnail directly to S3. ' +
      'Use the returned s3Key in the confirm-video-upload call.',
  })
  @ApiResponse({ status: 200, description: 'Presigned URL generated' })
  async requestThumbnailUpload(
    @Request() req: any,
    @Body() dto: RequestThumbnailUploadDto,
  ) {
    return await this.contentService.requestThumbnailUpload(dto, req.user);
  }

  @Post('confirm-video-upload')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm a direct-to-S3 video upload',
    description:
      'After the client has uploaded the video directly to S3 via presigned URL, ' +
      'call this to verify the S3 object, save the DB record, and trigger HLS transcoding.',
  })
  @ApiResponse({ status: 201, description: 'Video confirmed and saved' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - file not found in S3',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async confirmVideoUpload(
    @Request() req: any,
    @Body() dto: ConfirmVideoUploadDto,
  ) {
    return await this.contentService.confirmVideoUpload(dto, req.user);
  }

  @Patch('upload-progress/:uploadId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update upload progress (called by frontend during S3 upload)',
    description:
      'Frontend calls this periodically to persist upload progress in DB. ' +
      'This way, if the user refreshes or navigates away, progress is saved.',
  })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  async updateUploadProgress(
    @Request() req: any,
    @Param('uploadId') uploadId: string,
    @Body() body: { progress: number },
  ) {
    return await this.contentService.updateUploadProgress(
      uploadId,
      body.progress,
      req.user,
    );
  }

  @Get('my-uploads')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'My uploads (direct sessions + saved videos/materials)',
    description:
      'Returns `directUploads` (presigned flow), plus `videos` and `materials` already saved for this user. ' +
      'Optional `topicId` filters all three. Direct-upload rows older than 24h when completed are omitted.',
  })
  @ApiResponse({ status: 200, description: 'OK' })
  @ApiResponse({ status: 404, description: 'Library user not found' })
  async getMyUploads(
    @Request() req: any,
    @Query('topicId') topicId?: string,
  ) {
    return await this.contentService.getMyUploads(req.user, topicId);
  }

  @Post('resume-upload/:uploadId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resume a failed or expired upload',
    description:
      'Generates fresh presigned URLs for a failed/expired upload. ' +
      'The frontend can then retry the S3 upload with the same S3 key.',
  })
  @ApiResponse({ status: 200, description: 'Upload resumed' })
  async resumeUpload(
    @Request() req: any,
    @Param('uploadId') uploadId: string,
  ) {
    return await this.contentService.resumeUpload(uploadId, req.user);
  }

  @Post('cancel-upload/:uploadId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel an upload',
    description: 'Cancels a pending/in-progress upload and cleans up S3.',
  })
  @ApiResponse({ status: 200, description: 'Upload cancelled' })
  async cancelUpload(
    @Request() req: any,
    @Param('uploadId') uploadId: string,
  ) {
    return await this.contentService.cancelUpload(uploadId, req.user);
  }

  // ==================== MATERIAL UPLOAD ====================

  @Post('upload-material/start')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'material', maxCount: 1 }]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Start material upload with progress tracking',
    description:
      'Starts a material upload session and returns a sessionId. Use the progress endpoint to track upload status.',
  })
  @ApiBody({
    description: 'Material upload data',
    schema: {
      type: 'object',
      properties: {
        topicId: { type: 'string', description: 'Library topic ID' },
        subjectId: { type: 'string', description: 'Library subject ID' },
        title: { type: 'string', description: 'Material title' },
        description: {
          type: 'string',
          description: 'Material description (optional)',
        },
        material: {
          type: 'string',
          format: 'binary',
          description: 'Material file (PDF, DOC, DOCX, PPT, PPTX, max 300MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 202,
    description: 'Upload started successfully',
    type: UploadLibraryMaterialResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file or data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async startMaterialUpload(
    @Request() req: any,
    @Body() uploadDto: UploadLibraryMaterialDto,
    @UploadedFiles() files: { material?: Express.Multer.File[] },
  ) {
    const materialFile = files.material?.[0];
    return await this.contentService.startMaterialUploadSession(
      uploadDto,
      materialFile!,
      req.user,
    );
  }

  // ==================== LINK CREATION ====================

  @Post('create-link')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a link for a topic',
    description:
      'Creates an external link attached to a library topic. No file upload required.',
  })
  @ApiResponse({
    status: 201,
    description: 'Link created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid URL or data',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async createLink(@Request() req: any, @Body() payload: CreateLibraryLinkDto) {
    return await this.contentService.createLink(req.user, payload);
  }

  // ==================== PROGRESS TRACKING ====================

  @Get('upload-progress/:sessionId')
  @Sse('upload-progress/:sessionId')
  @ApiOperation({ summary: 'Stream upload progress via SSE' })
  getUploadProgress(
    @Param('sessionId') sessionId: string,
  ): Observable<MessageEvent> {
    return new Observable((observer) => {
      const current = this.uploadProgressService.getCurrentProgress(sessionId);
      if (current) {
        observer.next({ data: JSON.stringify(current) } as MessageEvent);
      }
      const unsubscribe = this.uploadProgressService.subscribeToProgress(
        sessionId,
        (progress) => {
          observer.next({ data: JSON.stringify(progress) } as MessageEvent);
          if (progress.stage === 'completed' || progress.stage === 'error') {
            observer.complete();
          }
        },
      );
      return () => unsubscribe();
    });
  }

  @Get('upload-progress/:sessionId/poll')
  @ApiOperation({ summary: 'Get current upload progress (polling)' })
  async getUploadProgressPoll(@Param('sessionId') sessionId: string) {
    return await this.contentService.getUploadProgress(sessionId);
  }

  // ==================== VIDEO PLAYBACK ====================

  @Get('video/:videoId/play')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get video for playback',
    description:
      'Retrieves video details and URL for playback. Automatically increments view count when accessed. Use this endpoint when user clicks play button.',
  })
  @ApiResponse({
    status: 200,
    description: 'Video retrieved successfully for playback',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: "Video not found or does not belong to user's platform",
  })
  async getVideoForPlayback(
    @Request() req: any,
    @Param('videoId') videoId: string,
  ) {
    return await this.contentService.getVideoForPlayback(req.user, videoId);
  }

  // ==================== VIDEO UPDATE ====================

  @Patch('video/:videoId/update')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a video',
    description:
      'Updates video title, description, and/or swaps order with another video. To swap orders, provide the swapOrderWith field with the ID of the video to swap with.',
  })
  @ApiResponse({
    status: 200,
    description: 'Video updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: "Video not found or does not belong to user's platform",
  })
  async updateVideo(
    @Request() req: any,
    @Param('videoId') videoId: string,
    @Body() payload: UpdateLibraryVideoDto,
  ) {
    return await this.contentService.updateVideo(req.user, videoId, payload);
  }

  // ==================== VIDEO DELETE ====================

  @Delete('video/:videoId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a video',
    description:
      'Deletes a video from the library. Removes the video file, thumbnail, and database record. Automatically reorders remaining videos in the same topic to close gaps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Video deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: "Video not found or does not belong to user's platform",
  })
  async deleteVideo(@Request() req: any, @Param('videoId') videoId: string) {
    return await this.contentService.deleteVideo(req.user, videoId);
  }

  // ==================== MATERIAL DELETE ====================

  @Delete('material/:materialId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a material',
    description:
      'Deletes a material (PDF, DOC, PPT, etc.) from the library. Removes the material file and database record. Automatically reorders remaining materials in the same topic to close gaps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Material deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: "Material not found or does not belong to user's platform",
  })
  async deleteMaterial(
    @Request() req: any,
    @Param('materialId') materialId: string,
  ) {
    return await this.contentService.deleteMaterial(req.user, materialId);
  }

  // ==================== LINK DELETE ====================

  @Delete('link/:linkId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a link',
    description:
      'Deletes a link from the library. Removes the database record. Automatically reorders remaining links in the same topic to close gaps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Link deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: "Link not found or does not belong to user's platform",
  })
  async deleteLink(@Request() req: any, @Param('linkId') linkId: string) {
    return await this.contentService.deleteLink(req.user, linkId);
  }

  // ==================== ASSIGNMENT DELETE ====================

  @Delete('assignment/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete an assignment',
    description:
      'Deletes an assignment from the library. Removes the assignment file (if any) and database record. Automatically reorders remaining assignments in the same topic to close gaps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 404,
    description: "Assignment not found or does not belong to user's platform",
  })
  async deleteAssignment(
    @Request() req: any,
    @Param('assignmentId') assignmentId: string,
  ) {
    return await this.contentService.deleteAssignment(req.user, assignmentId);
  }
}
