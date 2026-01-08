import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssessmentService } from './assessment.service';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { CreateLibraryAssessmentDto } from './dto/create-assessment.dto';
import { UpdateLibraryAssessmentDto } from './dto/update-assessment.dto';
import { CreateLibraryAssessmentQuestionDto } from './dto/create-question.dto';
import { UpdateLibraryAssessmentQuestionDto } from './dto/update-question.dto';
import {
  CreateAssessmentDocs,
  GetAssessmentsByTopicDocs,
  GetAssessmentByIdDocs,
  GetAssessmentQuestionsDocs,
  UploadQuestionImageDocs,
  CreateQuestionDocs,
  UpdateQuestionDocs,
  DeleteQuestionImageDocs,
  DeleteQuestionDocs,
  UpdateAssessmentDocs,
  DeleteAssessmentDocs,
  PublishAssessmentDocs,
  UnpublishAssessmentDocs,
  ReleaseResultsDocs,
  GetAssessmentAnalyticsDocs,
  GetUserAssessmentHistoryDocs,
} from './docs/assessment.docs';

@ApiTags('Library Assessment')
@ApiBearerAuth()
@UseGuards(LibraryJwtGuard)
@Controller('library/assessment')
export class AssessmentController {
  constructor(private readonly assessmentService: AssessmentService) {}

  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @CreateAssessmentDocs.operation
  @CreateAssessmentDocs.body
  @CreateAssessmentDocs.response201
  @CreateAssessmentDocs.response400
  @CreateAssessmentDocs.response401
  @CreateAssessmentDocs.response404
  @CreateAssessmentDocs.response500
  async createAssessment(
    @Body() createAssessmentDto: CreateLibraryAssessmentDto,
    @Request() req: any,
  ) {
    return await this.assessmentService.createAssessment(createAssessmentDto, req.user);
  }

  @Get('topic/:topicId')
  @HttpCode(HttpStatus.OK)
  @GetAssessmentsByTopicDocs.operation
  @GetAssessmentsByTopicDocs.param
  @GetAssessmentsByTopicDocs.response200
  @GetAssessmentsByTopicDocs.response401
  @GetAssessmentsByTopicDocs.response404
  @GetAssessmentsByTopicDocs.response500
  async getAssessmentsByTopic(
    @Request() req: any,
    @Param('topicId') topicId: string,
  ) {
    return await this.assessmentService.getAssessmentsByTopic(req.user, topicId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @GetAssessmentByIdDocs.operation
  @GetAssessmentByIdDocs.param
  @GetAssessmentByIdDocs.response200
  @GetAssessmentByIdDocs.response404
  async getAssessmentById(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.assessmentService.getAssessmentById(assessmentId, req.user.sub);
  }

  @Get(':id/questions')
  @HttpCode(HttpStatus.OK)
  @GetAssessmentQuestionsDocs.operation
  @GetAssessmentQuestionsDocs.param
  @GetAssessmentQuestionsDocs.response200
  @GetAssessmentQuestionsDocs.response404
  async getAssessmentQuestions(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.assessmentService.getAssessmentQuestions(assessmentId, req.user.sub);
  }

  @Post(':id/questions/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.CREATED)
  @UploadQuestionImageDocs.operation
  @UploadQuestionImageDocs.param
  @UploadQuestionImageDocs.consumes
  @UploadQuestionImageDocs.body
  @UploadQuestionImageDocs.response201
  @UploadQuestionImageDocs.response400
  @UploadQuestionImageDocs.response404
  async uploadQuestionImage(
    @Param('id') assessmentId: string,
    @UploadedFile() imageFile: Express.Multer.File,
    @Request() req: any,
  ) {
    return await this.assessmentService.uploadQuestionImage(assessmentId, imageFile, req.user.sub);
  }

  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @CreateQuestionDocs.operation
  @CreateQuestionDocs.param
  @CreateQuestionDocs.body
  @CreateQuestionDocs.response201
  @CreateQuestionDocs.response400
  @CreateQuestionDocs.response404
  async createQuestion(
    @Param('id') assessmentId: string,
    @Body() createQuestionDto: CreateLibraryAssessmentQuestionDto,
    @Request() req: any,
  ) {
    return await this.assessmentService.createQuestion(assessmentId, createQuestionDto, req.user.sub);
  }

  @Patch(':assessmentId/questions/:questionId')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  @UpdateQuestionDocs.operation
  @UpdateQuestionDocs.paramAssessment
  @UpdateQuestionDocs.paramQuestion
  @UpdateQuestionDocs.consumes
  @UpdateQuestionDocs.body
  @UpdateQuestionDocs.response200
  @UpdateQuestionDocs.response400
  @UpdateQuestionDocs.response404
  async updateQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateLibraryAssessmentQuestionDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @Request() req: any,
  ) {
    return await this.assessmentService.updateQuestion(assessmentId, questionId, updateQuestionDto, req.user.sub, imageFile);
  }

  @Delete(':assessmentId/questions/:questionId/image')
  @HttpCode(HttpStatus.OK)
  @DeleteQuestionImageDocs.operation
  @DeleteQuestionImageDocs.paramAssessment
  @DeleteQuestionImageDocs.paramQuestion
  @DeleteQuestionImageDocs.response200
  @DeleteQuestionImageDocs.response400
  @DeleteQuestionImageDocs.response404
  async deleteQuestionImage(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return await this.assessmentService.deleteQuestionImage(assessmentId, questionId, req.user.sub);
  }

  @Delete(':assessmentId/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @DeleteQuestionDocs.operation
  @DeleteQuestionDocs.paramAssessment
  @DeleteQuestionDocs.paramQuestion
  @DeleteQuestionDocs.response200
  @DeleteQuestionDocs.response400
  @DeleteQuestionDocs.response404
  async deleteQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return await this.assessmentService.deleteQuestion(assessmentId, questionId, req.user.sub);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UpdateAssessmentDocs.operation
  @UpdateAssessmentDocs.param
  @UpdateAssessmentDocs.body
  @UpdateAssessmentDocs.response200
  @UpdateAssessmentDocs.response400
  @UpdateAssessmentDocs.response404
  async updateAssessment(
    @Param('id') assessmentId: string,
    @Body() updateAssessmentDto: UpdateLibraryAssessmentDto,
    @Request() req: any,
  ) {
    return await this.assessmentService.updateAssessment(assessmentId, updateAssessmentDto, req.user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @DeleteAssessmentDocs.operation
  @DeleteAssessmentDocs.param
  @DeleteAssessmentDocs.response200
  @DeleteAssessmentDocs.response400
  @DeleteAssessmentDocs.response404
  async deleteAssessment(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.assessmentService.deleteAssessment(assessmentId, req.user.sub);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @PublishAssessmentDocs.operation
  @PublishAssessmentDocs.param
  @PublishAssessmentDocs.response200
  @PublishAssessmentDocs.response400
  @PublishAssessmentDocs.response404
  async publishAssessment(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.assessmentService.publishAssessment(assessmentId, req.user.sub);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @UnpublishAssessmentDocs.operation
  @UnpublishAssessmentDocs.param
  @UnpublishAssessmentDocs.response200
  @UnpublishAssessmentDocs.response404
  async unpublishAssessment(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.assessmentService.unpublishAssessment(assessmentId, req.user.sub);
  }

  @Post(':id/release-results')
  @HttpCode(HttpStatus.OK)
  @ReleaseResultsDocs.operation
  @ReleaseResultsDocs.param
  @ReleaseResultsDocs.response200
  @ReleaseResultsDocs.response404
  async releaseResults(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.assessmentService.releaseResults(assessmentId, req.user.sub);
  }

  @Get('analytics/:assessmentId')
  @HttpCode(HttpStatus.OK)
  @GetAssessmentAnalyticsDocs.operation
  @GetAssessmentAnalyticsDocs.param
  @GetAssessmentAnalyticsDocs.response200
  @GetAssessmentAnalyticsDocs.response404
  async getAssessmentAnalytics(
    @Request() req: any,
    @Param('assessmentId') assessmentId: string,
  ) {
    return await this.assessmentService.getAssessmentAnalytics(req.user, assessmentId);
  }

  @Get('user-history/:userId')
  @HttpCode(HttpStatus.OK)
  @GetUserAssessmentHistoryDocs.operation
  @GetUserAssessmentHistoryDocs.param
  @GetUserAssessmentHistoryDocs.response200
  @GetUserAssessmentHistoryDocs.response404
  async getUserAssessmentHistory(
    @Param('userId') userId: string,
  ) {
    return await this.assessmentService.getUserAssessmentHistory(userId);
  }
}

