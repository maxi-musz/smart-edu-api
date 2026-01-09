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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse as SwaggerApiResponse, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CBTService } from './cbt.service';
import { LibraryJwtGuard } from '../library-auth/guard/library-jwt.guard';
import { CreateLibraryCBTDto } from './cbt-dto/create-cbt.dto';
import { UpdateLibraryCBTDto } from './cbt-dto/update-cbt.dto';
import { CreateLibraryCBTQuestionDto } from './cbt-dto/create-cbt-question.dto';
import { UpdateLibraryCBTQuestionDto } from './cbt-dto/update-cbt-question.dto';

@ApiTags('Library CBT Assessment')
@ApiBearerAuth()
@UseGuards(LibraryJwtGuard)
@Controller('library/assessment/cbt')
export class CBTController {
  constructor(private readonly cbtService: CBTService) {}

  /**
   * CREATE CBT ASSESSMENT
   * POST /library/assessment/cbt
   */
  @Post('')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new CBT Assessment',
    description: 'Create a new Computer-Based Test (CBT) assessment for library users. This endpoint only creates CBT type assessments. The assessment will be in DRAFT status initially and must be published before users can access it.'
  })
  @ApiBody({ 
    type: CreateLibraryCBTDto,
    description: 'CBT assessment data. You can specify subject, chapter, or topic level. Duration and time limits control how long users have to complete the assessment.'
  })
  @SwaggerApiResponse({ 
    status: 201, 
    description: 'CBT assessment created successfully. Returns the created assessment with all its properties.' 
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid data provided (e.g., missing required fields, invalid IDs)' 
  })
  @SwaggerApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing authentication token' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - Subject, chapter, or topic not found or does not belong to your platform' 
  })
  @SwaggerApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async createCBT(
    @Body() createCBTDto: CreateLibraryCBTDto,
    @Request() req: any,
  ) {
    return await this.cbtService.createCBT(createCBTDto, req.user);
  }

  /**
   * LIST/FILTER CBT ASSESSMENTS
   * GET /library/assessment/cbt
   */
  @Get('')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'List/Filter CBT assessments',
    description: 'Get a list of CBT assessments with optional filters. You can filter by subject, chapter, topic, status, and pagination. Returns all CBTs created by the authenticated library owner for their platform.'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'CBTs retrieved successfully. Returns an array of CBT assessments matching the filters.',
    schema: {
      example: {
        success: true,
        message: 'Assessments retrieved successfully',
        data: {
          assessments: [
            {
              id: 'cmjb9cbt123',
              title: 'Algebra Basics CBT',
              assessmentType: 'CBT',
              status: 'PUBLISHED',
              isPublished: true,
              duration: 30,
              totalPoints: 100,
              passingScore: 50,
              questionCount: 10,
              attemptCount: 25,
              createdAt: '2025-01-08T10:00:00Z',
            }
          ],
          totalCount: 1
        }
      }
    }
  })
  @SwaggerApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing authentication token' 
  })
  async listCBTs(
    @Request() req: any,
    @Query('subjectId') subjectId?: string,
    @Query('chapterId') chapterId?: string,
    @Query('topicId') topicId?: string,
    @Query('status') status?: string,
  ) {
    return await this.cbtService.listCBTs(req.user, { subjectId, chapterId, topicId, status });
  }

  /**
   * UPLOAD QUESTION IMAGE
   * POST /library/assessment/cbt/:id/questions/upload-image
   */
  @Post(':id/questions/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Upload an image for a CBT question',
    description: 'Upload an image to use in a question. This should be done BEFORE creating the question. The response will include the image URL and S3 key which you should then use when creating/updating the question. Supported formats: JPEG, PNG, GIF, WEBP. Max size: 5MB.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    description: 'Image file to upload',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file (JPEG, PNG, GIF, WEBP, max 5MB)'
        }
      },
      required: ['image']
    }
  })
  @SwaggerApiResponse({ 
    status: 201, 
    description: 'Image uploaded successfully. Returns the image URL and S3 key to use in question creation.',
    schema: {
      example: {
        success: true,
        message: 'Question image uploaded successfully',
        data: {
          imageUrl: 'https://s3.amazonaws.com/bucket/library-assessment-images/platforms/123/assessments/456/question_1234567890_image.jpg',
          imageS3Key: 'library-assessment-images/platforms/123/assessments/456/question_1234567890_image.jpg'
        }
      }
    }
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - No image file provided or invalid image format/size' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async uploadQuestionImage(
    @Param('id') assessmentId: string,
    @UploadedFile() imageFile: Express.Multer.File,
    @Request() req: any,
  ) {
    return await this.cbtService.uploadQuestionImage(assessmentId, imageFile, req.user.sub);
  }

  /**
   * DELETE ORPHANED IMAGE
   * DELETE /library/assessment/cbt/:id/questions/orphaned-image
   */
  @Delete(':id/questions/orphaned-image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete an orphaned image (uploaded but not attached to any question)',
    description: 'Clean up images that were uploaded but never used because the user cancelled question creation. This endpoint deletes the image from S3 using the S3 key. Use this when a user uploads an image but then cancels/closes the modal before creating the question.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @ApiBody({ 
    description: 'S3 key of the orphaned image to delete',
    schema: {
      type: 'object',
      properties: {
        imageS3Key: {
          type: 'string',
          description: 'S3 key returned from upload-image endpoint',
          example: 'library-assessment-images/platforms/123/assessments/456/question_1234567890_image.jpg'
        }
      },
      required: ['imageS3Key']
    }
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Orphaned image deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Orphaned image deleted successfully',
        data: {
          assessmentId: 'cmjb9cbt123',
          imageS3Key: 'library-assessment-images/platforms/123/assessments/456/question_1234567890_image.jpg',
          imageDeleted: true
        }
      }
    }
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Failed to delete image from S3' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async deleteOrphanedImage(
    @Param('id') assessmentId: string,
    @Body('imageS3Key') imageS3Key: string,
    @Request() req: any,
  ) {
    return await this.cbtService.deleteOrphanedImage(assessmentId, imageS3Key, req.user.sub);
  }

  /**
   * CREATE QUESTION
   * POST /library/assessment/cbt/:id/questions
   */
  @Post(':id/questions')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Add a new question to a CBT assessment (with optional image upload)',
    description: 'Create a new question in the CBT with inline image upload. Send as multipart/form-data with "questionData" (JSON string) and optional "image" file. The image will be automatically uploaded to S3 during question creation, eliminating orphaned images. Questions are automatically ordered if order is not specified.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @ApiBody({ 
    description: 'Send as multipart/form-data with "questionData" as JSON string and optional "image" file (max 5MB, JPEG/PNG/GIF/WEBP)',
    schema: {
      type: 'object',
      properties: {
        questionData: {
          type: 'string',
          description: 'JSON string of question data (see CreateLibraryCBTQuestionDto)',
          example: '{"questionText":"What is 2+2?","questionType":"MULTIPLE_CHOICE_SINGLE","points":1,"options":[{"optionText":"3","order":1,"isCorrect":false},{"optionText":"4","order":2,"isCorrect":true}]}'
        },
        image: {
          type: 'string',
          format: 'binary',
          description: 'Optional image file for the question (max 5MB)'
        }
      },
      required: ['questionData']
    }
  })
  @SwaggerApiResponse({ 
    status: 201, 
    description: 'Question created successfully with image uploaded to S3 (if provided)' 
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid question data or image format' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async createQuestion(
    @Param('id') assessmentId: string,
    @Body('questionData') questionDataString: string,
    @UploadedFile() image: Express.Multer.File,
    @Request() req: any,
  ) {
    // Parse the questionData JSON string
    let createQuestionDto: CreateLibraryCBTQuestionDto;
    try {
      createQuestionDto = JSON.parse(questionDataString);
    } catch (error) {
      throw new BadRequestException('Invalid questionData JSON format');
    }

    return await this.cbtService.createQuestion(assessmentId, createQuestionDto, req.user.sub, image);
  }

  /**
   * GET CBT QUESTIONS
   * GET /library/assessment/cbt/:id/questions
   */
  @Get(':id/questions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get all questions for a CBT assessment',
    description: 'Retrieve all questions in a CBT assessment with their options, correct answers, and all related data. Questions are returned in order. This endpoint is for library owners/creators to view and manage questions.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Questions retrieved successfully. Returns an array of all questions with their complete data.' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async getQuestions(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.cbtService.getQuestions(assessmentId, req.user.sub);
  }

  /**
   * UPDATE QUESTION
   * PATCH /library/assessment/cbt/:assessmentId/questions/:questionId
   */
  @Patch(':assessmentId/questions/:questionId')
  @UseInterceptors(FileInterceptor('image'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update a specific question in a CBT assessment',
    description: 'Update any field of an existing question. You can update the question text, type, points, options, correct answers, etc. If updating options or correctAnswers, the entire array will be replaced. You can also upload a new image as part of this request using multipart/form-data.'
  })
  @ApiParam({ 
    name: 'assessmentId', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @ApiParam({ 
    name: 'questionId', 
    description: 'ID of the question to update',
    example: 'cmjb9qst456'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ 
    type: UpdateLibraryCBTQuestionDto,
    description: 'Updated question data. All fields are optional - only provide fields you want to update. If updating options, provide the complete new options array (existing options will be replaced).'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Question updated successfully. Returns the updated question with all its data.' 
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid question data or cannot update question with existing responses' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment or question not found or access denied' 
  })
  async updateQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateLibraryCBTQuestionDto,
    @UploadedFile() imageFile: Express.Multer.File,
    @Request() req: any,
  ) {
    return await this.cbtService.updateQuestion(
      assessmentId,
      questionId,
      updateQuestionDto,
      req.user.sub,
      imageFile,
    );
  }

  /**
   * DELETE QUESTION IMAGE
   * DELETE /library/assessment/cbt/:assessmentId/questions/:questionId/image
   */
  @Delete(':assessmentId/questions/:questionId/image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete the image for a specific question',
    description: 'Remove the image from a question. This deletes the image from S3 storage and removes the imageUrl and imageS3Key from the question. The question text and other data remain unchanged.'
  })
  @ApiParam({ 
    name: 'assessmentId', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @ApiParam({ 
    name: 'questionId', 
    description: 'ID of the question',
    example: 'cmjb9qst456'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Question image deleted successfully' 
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Question does not have an image or CBT is closed' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment or question not found or access denied' 
  })
  async deleteQuestionImage(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return await this.cbtService.deleteQuestionImage(assessmentId, questionId, req.user.sub);
  }

  /**
   * DELETE QUESTION
   * DELETE /library/assessment/cbt/:assessmentId/questions/:questionId
   */
  @Delete(':assessmentId/questions/:questionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete a specific question from a CBT assessment',
    description: 'Permanently delete a question from the CBT. This will also delete all associated options and correct answers. Questions cannot be deleted if the CBT has been attempted by any users.'
  })
  @ApiParam({ 
    name: 'assessmentId', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @ApiParam({ 
    name: 'questionId', 
    description: 'ID of the question to delete',
    example: 'cmjb9qst456'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'Question deleted successfully. Remaining questions are automatically reordered.' 
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Cannot delete question because the CBT has user responses/attempts' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment or question not found or access denied' 
  })
  async deleteQuestion(
    @Param('assessmentId') assessmentId: string,
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return await this.cbtService.deleteQuestion(assessmentId, questionId, req.user.sub);
  }

  /**
   * UPDATE CBT
   * PATCH /library/assessment/cbt/:id
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update a CBT assessment',
    description: 'Update any field of an existing CBT assessment. You can update title, description, instructions, duration, time limits, passing score, dates, shuffle settings, visibility settings, etc. All fields are optional - only provide fields you want to update.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @ApiBody({ 
    type: UpdateLibraryCBTDto,
    description: 'Updated CBT data. All fields are optional. You can also update the status (DRAFT, PUBLISHED, ACTIVE, CLOSED, ARCHIVED).'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'CBT assessment updated successfully. Returns the updated assessment with all its data.' 
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Invalid data provided' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async updateCBT(
    @Param('id') assessmentId: string,
    @Body() updateCBTDto: UpdateLibraryCBTDto,
    @Request() req: any,
  ) {
    return await this.cbtService.updateCBT(assessmentId, updateCBTDto, req.user.sub);
  }

  /**
   * DELETE CBT
   * DELETE /library/assessment/cbt/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete a CBT assessment',
    description: 'Permanently delete a CBT assessment. This will also delete all associated questions, options, and correct answers. CBT assessments cannot be deleted if they have been attempted by any users. Consider archiving instead of deleting if the CBT has been used.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment to delete',
    example: 'cmjb9cbt123'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'CBT assessment deleted successfully' 
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Cannot delete CBT because it has user attempts. Archive it instead.' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async deleteCBT(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.cbtService.deleteCBT(assessmentId, req.user.sub);
  }

  /**
   * PUBLISH CBT
   * POST /library/assessment/cbt/:id/publish
   */
  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Publish a CBT assessment',
    description: 'Publish a CBT assessment to make it available to users. The CBT must have at least one question before it can be published. Once published, users will be able to see and attempt the CBT. The status will change to PUBLISHED and publishedAt timestamp will be set.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment to publish',
    example: 'cmjb9cbt123'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'CBT assessment published successfully' 
  })
  @SwaggerApiResponse({ 
    status: 400, 
    description: 'Bad request - Cannot publish CBT without questions or CBT is already published' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async publishCBT(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.cbtService.publishCBT(assessmentId, req.user.sub);
  }

  /**
   * UNPUBLISH CBT
   * POST /library/assessment/cbt/:id/unpublish
   */
  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Unpublish a CBT assessment',
    description: 'Unpublish a CBT assessment to hide it from users. The CBT will no longer be visible or accessible to users. Existing attempts and data will be preserved. The status will change to DRAFT and isPublished will be set to false.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment to unpublish',
    example: 'cmjb9cbt123'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'CBT assessment unpublished successfully' 
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async unpublishCBT(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.cbtService.unpublishCBT(assessmentId, req.user.sub);
  }

  /**
   * GET CBT BY ID
   * GET /library/assessment/cbt/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get a specific CBT assessment by ID',
    description: 'Retrieve complete details of a CBT assessment including all metadata, settings, and statistics. This does NOT include questions - use GET /cbt/:id/questions to retrieve questions separately.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID of the CBT assessment',
    example: 'cmjb9cbt123'
  })
  @SwaggerApiResponse({ 
    status: 200, 
    description: 'CBT assessment retrieved successfully. Returns complete assessment data including creator info, subject/chapter/topic info, question count, attempt count, and all settings.',
    schema: {
      example: {
        success: true,
        message: 'Assessment retrieved successfully',
        data: {
          id: 'cmjb9cbt123',
          title: 'Algebra Basics CBT',
          description: 'Test your understanding of algebra',
          assessmentType: 'CBT',
          status: 'PUBLISHED',
          isPublished: true,
          publishedAt: '2025-01-08T10:00:00Z',
          duration: 30,
          maxAttempts: 3,
          passingScore: 50,
          totalPoints: 100,
          questionCount: 20,
          attemptCount: 45,
          // ... more fields
        }
      }
    }
  })
  @SwaggerApiResponse({ 
    status: 404, 
    description: 'Not found - CBT assessment not found or access denied' 
  })
  async getCBTById(
    @Param('id') assessmentId: string,
    @Request() req: any,
  ) {
    return await this.cbtService.getCBTById(assessmentId, req.user.sub);
  }
}

