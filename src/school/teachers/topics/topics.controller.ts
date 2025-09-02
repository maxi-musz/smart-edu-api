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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { JwtGuard } from '../../auth/guard/jwt.guard';
import { GetUser } from '../../auth/decorator/get-user-decorator';

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
    @Body() createTopicDto: CreateTopicDto,
    @GetUser() user: any,
  ): Promise<TopicResponseDto> {
    return this.topicsService.createTopic(
      createTopicDto,
      user.school_id,
      user.id,
    );
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
    return this.topicsService.getAllTopics(user.school_id, subjectId, academicSessionId);
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
    return this.topicsService.getTopicsBySubject(subjectId, user.school_id);
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
    return this.topicsService.getTopicById(id, user.school_id);
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
    return this.topicsService.updateTopic(id, updateTopicDto, user.school_id);
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
    return this.topicsService.deleteTopic(id, user.school_id);
  }

  @Post('reorder/:subjectId')
  @ApiOperation({ summary: 'Reorder topics within a subject' })
  @ApiParam({ name: 'subjectId', description: 'Subject ID' })
  @ApiResponse({ status: 200, description: 'Topics reordered successfully' })
  @ApiResponse({ status: 404, description: 'Subject not found' })
  async reorderTopics(
    @Param('subjectId') subjectId: string,
    @Body() topicOrders: { id: string; order: number }[],
    @GetUser() user: any,
  ): Promise<void> {
    return this.topicsService.reorderTopics(subjectId, topicOrders, user.school_id);
  }
}
