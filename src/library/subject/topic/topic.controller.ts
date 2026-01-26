import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Patch, Param, Get, Delete, Query, BadRequestException } from '@nestjs/common';
import { TopicService } from './topic.service';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';
import { LibraryJwtGuard } from '../../library-auth/guard/library-jwt.guard';
import { CreateTopicDocs, UpdateTopicDocs, GetTopicMaterialsDocs, GetTopicsBySubjectDocs, DeleteTopicDocs } from './docs/topic.docs';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Library Topic')
@Controller('library/subject/topic')
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

  @Get('getmaterials/:topicId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @GetTopicMaterialsDocs.operation
  @GetTopicMaterialsDocs.response200
  @GetTopicMaterialsDocs.response400
  @GetTopicMaterialsDocs.response401
  @GetTopicMaterialsDocs.response404
  @GetTopicMaterialsDocs.response500
  async getTopicMaterials(
    @Request() req: any,
    @Param('topicId') topicId: string,
  ) {
    return await this.topicService.getTopicMaterials(req.user, topicId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @GetTopicsBySubjectDocs.operation
  @GetTopicsBySubjectDocs.response200
  @GetTopicsBySubjectDocs.response400
  @GetTopicsBySubjectDocs.response401
  @GetTopicsBySubjectDocs.response404
  @GetTopicsBySubjectDocs.response500
  async getTopicsBySubject(
    @Request() req: any,
    @Query('subjectId') subjectId: string,
  ) {
    if (!subjectId) {
      throw new BadRequestException('subjectId query parameter is required');
    }
    return await this.topicService.getTopicsBySubject(req.user, subjectId);
  }

  @Delete('deletetopic/:topicId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LibraryJwtGuard)
  @ApiBearerAuth()
  @DeleteTopicDocs.operation
  @DeleteTopicDocs.response200
  @DeleteTopicDocs.response400
  @DeleteTopicDocs.response401
  @DeleteTopicDocs.response404
  @DeleteTopicDocs.response500
  async deleteTopic(
    @Request() req: any,
    @Param('topicId') topicId: string,
  ) {
    return await this.topicService.deleteTopic(req.user, topicId);
  }
}
