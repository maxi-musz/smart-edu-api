import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Patch, Param } from '@nestjs/common';
import { TopicService } from './topic.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';
import { LibraryJwtGuard } from '../../../library-auth/guard/library-jwt.guard';
import { CreateTopicDocs, UpdateTopicDocs } from './docs/topic.docs';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Library Topic')
@Controller('library/subject/chapter/topic')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post('createtopic')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @CreateTopicDocs.operation
  @CreateTopicDocs.body
  @CreateTopicDocs.response201
  @CreateTopicDocs.response400
  @CreateTopicDocs.response401
  @CreateTopicDocs.response404
  @CreateTopicDocs.response500
  async createTopic(
    @Request() req: any,
    @Body() payload: CreateTopicDto,
  ) {
    return await this.topicService.createTopic(req.user, payload);
  }

  @Patch('updatetopic/:topicId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @UpdateTopicDocs.operation
  @UpdateTopicDocs.body
  @UpdateTopicDocs.response200
  @UpdateTopicDocs.response400
  @UpdateTopicDocs.response401
  @UpdateTopicDocs.response404
  @UpdateTopicDocs.response500
  async updateTopic(
    @Request() req: any,
    @Param('topicId') topicId: string,
    @Body() payload: UpdateTopicDto,
  ) {
    return await this.topicService.updateTopic(req.user, topicId, payload);
  }
}

