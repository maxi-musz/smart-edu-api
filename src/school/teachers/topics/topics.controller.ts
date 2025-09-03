import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { CreateTopicRequestDto } from './dto/create-topic-request.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { ReorderTopicsDto } from './dto/reorder-topics.dto';
import { TopicContentResponseDto } from './dto/topic-content.dto';
import { UploadVideoLessonDto, VideoLessonResponseDto } from './dto/upload-video-lesson.dto';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

@ApiTags('Teachers - Topics')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('teachers/topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new topic' })
  @ApiResponse({
    status: 201,
    description: 'Topic created successfully',
    type: TopicResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Subject or academic session not found' })
  async createTopic(
    @Body() createTopicRequestDto: CreateTopicRequestDto,
    @GetUser() user: any,
  ) {
    return this.topicsService.createTopic(createTopicRequestDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all topics for a school' })
  @ApiQuery({
    name: 'subjectId',
    required: false,
    description: 'Filter by subject ID',
  })
  @ApiQuery({
    name: 'academicSessionId',
    required: false,
    description: 'Filter by academic session ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Topics retrieved successfully',
    type: [TopicResponseDto],
  })
  async getAllTopics(
    @GetUser() user: any,
    @Query('subjectId') subjectId?: string,
    @Query('academicSessionId') academicSessionId?: string,
  ): Promise<TopicResponseDto[]> {
    return this.topicsService.getAllTopics(user, subjectId, academicSessionId);
  }

  @Get('test-s3-connection')
  @ApiOperation({ summary: 'Test AWS S3 connection' })
  @ApiResponse({ status: 200, description: 'S3 connection test result' })
  async testS3Connection() {
    try {
      const isConnected = await this.topicsService.testS3Connection();
      return {
        success: true,
        message: 'S3 connection test completed',
        data: {
          connected: isConnected,
          timestamp: new Date().toISOString(),
          message: isConnected 
            ? '✅ AWS S3 connection successful!' 
            : '❌ AWS S3 connection failed. Check your credentials and bucket.'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'S3 connection test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('subject/:subjectId')
  @ApiOperation({ summary: 'Get all topics for a specific subject' })
  @ApiParam({ name: 'subjectId', description: 'Subject ID' })
  @ApiResponse({
    status: 200,
    description: 'Topics retrieved successfully',
    type: [TopicResponseDto],
  })
  async getTopicsBySubject(
    @Param('subjectId') subjectId: string,
    @GetUser() user: any,
  ): Promise<TopicResponseDto[]> {
    return this.topicsService.getTopicsBySubject(subjectId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a topic by ID' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiResponse({
    status: 200,
    description: 'Topic retrieved successfully',
    type: TopicResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async getTopicById(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<TopicResponseDto> {
    return this.topicsService.getTopicById(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiResponse({
    status: 200,
    description: 'Topic updated successfully',
    type: TopicResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateTopic(
    @Param('id') id: string,
    @Body() updateTopicDto: UpdateTopicDto,
    @GetUser() user: any,
  ): Promise<TopicResponseDto> {
    return this.topicsService.updateTopic(id, updateTopicDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiResponse({ status: 204, description: 'Topic deleted successfully' })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete topic with content' })
  async deleteTopic(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<void> {
    return this.topicsService.deleteTopic(id, user);
  }

  @Post('reorder/:subjectId')
  @ApiOperation({ summary: 'Reorder multiple topics within a subject' })
  @ApiParam({ name: 'subjectId', description: 'Subject ID' })
  @ApiResponse({ status: 200, description: 'Topics reordered successfully' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async reorderTopics(
    @Param('subjectId') subjectId: string,
    @Body() reorderDto: ReorderTopicsDto,
    @GetUser() user: any,
  ): Promise<void> {
    return this.topicsService.reorderTopics(subjectId, reorderDto.topics, user);
  }

  @Patch('reorder/:subjectId/:topicId')
  @ApiOperation({ summary: 'Reorder a single topic to a new position (drag and drop)' })
  @ApiParam({ name: 'subjectId', description: 'Subject ID' })
  @ApiParam({ name: 'topicId', description: 'Topic ID to reorder' })
  @ApiResponse({ status: 200, description: 'Topic reordered successfully' })
  @ApiResponse({ status: 404, description: 'Subject or topic not found' })
  @ApiResponse({ status: 400, description: 'Invalid position' })
  async reorderSingleTopic(
    @Param('subjectId') subjectId: string,
    @Param('topicId') topicId: string,
    @Body() body: { newPosition: number },
    @GetUser() user: any,
  ) {
    return this.topicsService.reorderSingleTopic(subjectId, topicId, body.newPosition, user);
  }

  

  @Get(':id/content')
  @ApiOperation({ summary: 'Get all content for a specific topic' })
  @ApiParam({ name: 'id', description: 'Topic ID' })
  @ApiResponse({
    status: 200,
    description: 'Topic content retrieved successfully',
    type: TopicContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Topic not found' })
  async getTopicContent(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.topicsService.getTopicContent(id, user);
  }

  @Post('upload-video')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 }
    ])
  )
  @ApiOperation({ summary: 'Upload video lesson for a topic' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Video lesson upload data',
    type: UploadVideoLessonDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Video lesson uploaded successfully',
    type: VideoLessonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file or data' })
  @ApiResponse({ status: 404, description: 'Subject or topic not found' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async uploadVideoLesson(
    @Body() uploadDto: UploadVideoLessonDto,
    @UploadedFiles() files: { video?: Express.Multer.File[], thumbnail?: Express.Multer.File[] },
    @GetUser() user: any,
  ) {
    const videoFile = files.video?.[0];
    const thumbnailFile = files.thumbnail?.[0];
    
    if (!videoFile) {
      throw new BadRequestException('Video file is required');
    }
    
    return this.topicsService.uploadVideoLesson(
      uploadDto,
      videoFile,
      thumbnailFile,
      user
    );
  }

}
