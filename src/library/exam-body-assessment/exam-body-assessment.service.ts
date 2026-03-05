import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import { StorageService } from '../../shared/services/providers/storage.service';
import { CreateLibraryExamBodyAssessmentDto, CreateLibraryExamBodyQuestionDto, UpdateLibraryExamBodyAssessmentDto, UpdateLibraryExamBodyQuestionDto } from './dto';
import * as colors from 'colors';

@Injectable()
export class LibraryExamBodyAssessmentService {
  private readonly logger = new Logger(LibraryExamBodyAssessmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  private async getPlatformId(userId: string): Promise<string> {
    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: userId },
      select: { platformId: true },
    });

    if (!libraryUser) {
      throw new NotFoundException('Library user not found');
    }

    return libraryUser.platformId;
  }

  async createAssessment(
    user: any,
    examBodyId: string,
    subjectId: string,
    yearId: string,
    createDto: CreateLibraryExamBodyAssessmentDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY EXAM BODY] Creating assessment: ${createDto.title}`));

    const platformId = await this.getPlatformId(user.sub);

    const [examBody, subject, year] = await Promise.all([
      this.prisma.examBody.findUnique({ where: { id: examBodyId } }),
      this.prisma.examBodySubject.findFirst({ where: { id: subjectId, examBodyId } }),
      this.prisma.examBodyYear.findFirst({ where: { id: yearId, examBodyId } }),
    ]);

    if (!examBody) throw new NotFoundException('Exam body not found');
    if (!subject) throw new NotFoundException('Subject not found for this exam body');
    if (!year) throw new NotFoundException('Year not found for this exam body');

    const existing = await this.prisma.examBodyAssessment.findFirst({
      where: {
        examBodyId,
        subjectId,
        yearId,
        platformId,
      },
    });

    if (existing) {
      throw new BadRequestException('Assessment already exists for this exam body, subject, and year');
    }

    const assessment = await this.prisma.examBodyAssessment.create({
      data: {
        ...createDto,
        examBodyId,
        subjectId,
        yearId,
        platformId,
        assessmentType: 'EXAM', // Default to EXAM
      },
      include: {
        examBody: true,
        subject: true,
        year: true,
      },
    });

    this.logger.log(colors.green(`✅ Assessment created: ${assessment.title}`));
    return new ApiResponse(true, 'Assessment created successfully', assessment);
  }

  async findAllAssessments(
    user: any,
    examBodyId: string,
    subjectId?: string,
    yearId?: string,
  ): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const assessments = await this.prisma.examBodyAssessment.findMany({
      where: {
        examBodyId,
        platformId,
        ...(subjectId && { subjectId }),
        ...(yearId && { yearId }),
      },
      include: {
        examBody: true,
        subject: true,
        year: true,
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return new ApiResponse(true, 'Assessments retrieved successfully', assessments);
  }

  async findOneAssessment(user: any, examBodyId: string, id: string): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const assessment = await this.prisma.examBodyAssessment.findFirst({
      where: { id, examBodyId, platformId },
      include: {
        examBody: true,
        subject: true,
        year: true,
        questions: {
          include: {
            options: { orderBy: { order: 'asc' } },
            correctAnswers: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    return new ApiResponse(true, 'Assessment retrieved successfully', assessment);
  }

  async updateAssessment(
    user: any,
    examBodyId: string,
    id: string,
    updateDto: UpdateLibraryExamBodyAssessmentDto,
  ): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const existing = await this.prisma.examBodyAssessment.findFirst({
      where: { id, examBodyId, platformId },
    });
    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }

    const assessment = await this.prisma.examBodyAssessment.update({
      where: { id },
      data: updateDto,
      include: {
        examBody: true,
        subject: true,
        year: true,
      },
    });

    this.logger.log(colors.green(`✅ Assessment updated: ${assessment.title}`));
    return new ApiResponse(true, 'Assessment updated successfully', assessment);
  }

  async deleteAssessment(user: any, examBodyId: string, id: string): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const assessment = await this.prisma.examBodyAssessment.findFirst({
      where: { id, examBodyId, platformId },
    });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    await this.prisma.examBodyAssessment.delete({ where: { id } });
    this.logger.log(colors.green(`✅ Assessment deleted: ${assessment.title}`));

    return new ApiResponse(true, 'Assessment deleted successfully', { id });
  }

  async createQuestion(
    user: any,
    examBodyId: string,
    assessmentId: string,
    createDto: CreateLibraryExamBodyQuestionDto,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`📝 Creating question for assessment: ${assessmentId}`));

    const platformId = await this.getPlatformId(user.sub);

    const assessment = await this.prisma.examBodyAssessment.findFirst({
      where: { id: assessmentId, examBodyId, platformId },
    });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    // Auto-calculate order if not provided
    let questionOrder = createDto.order;
    if (questionOrder === undefined || questionOrder === null) {
      const lastQuestion = await this.prisma.examBodyAssessmentQuestion.findFirst({
        where: { assessmentId },
        orderBy: { order: 'desc' },
      });
      questionOrder = lastQuestion ? lastQuestion.order + 1 : 0;
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const question = await prisma.examBodyAssessmentQuestion.create({
        data: {
          assessmentId,
          questionText: createDto.questionText,
          questionType: createDto.questionType,
          points: createDto.points || 1,
          order: questionOrder,
          explanation: createDto.explanation,
          imageUrl: (createDto as any).imageUrl,
        },
      });

      let options: any[] = [];
      if (createDto.options && createDto.options.length > 0) {
        options = await Promise.all(
          createDto.options.map(async (optionData: any) => {
            return await prisma.examBodyAssessmentOption.create({
              data: {
                questionId: question.id,
                optionText: optionData.optionText,
                order: optionData.order || 0,
                isCorrect: optionData.isCorrect || false,
                imageUrl: optionData.imageUrl,
              },
            });
          })
        );
      }

      const correctOptionIds = options.filter(opt => opt.isCorrect).map(opt => opt.id);
      let correctAnswers: any[] = [];

      if (correctOptionIds.length > 0) {
        const correctAnswer = await prisma.examBodyAssessmentCorrectAnswer.create({
          data: {
            questionId: question.id,
            optionIds: correctOptionIds,
          },
        });
        correctAnswers = [correctAnswer];
      }

      return { question, options, correctAnswers };
    });

    await this.updateAssessmentTotalPoints(assessmentId);

    this.logger.log(colors.green(`✅ Question created with ${result.options.length} options`));
    return new ApiResponse(true, 'Question created successfully', result);
  }

  async createQuestionWithImage(
    user: any,
    examBodyId: string,
    assessmentId: string,
    questionDataString: string,
    imageFile?: Express.Multer.File,
    optionImageFiles: Express.Multer.File[] = [],
  ): Promise<ApiResponse<any>> {
    const uploadedImageKeys: string[] = [];

    try {
      this.logger.log(colors.cyan(`📝 Creating question with image for assessment: ${assessmentId}`));

      // Parse question data from JSON string
      let createQuestionDto: CreateLibraryExamBodyQuestionDto;
      try {
        createQuestionDto = JSON.parse(questionDataString);
      } catch (parseError) {
        throw new BadRequestException('Invalid JSON in questionData field');
      }

      const platformId = await this.getPlatformId(user.sub);

      const assessment = await this.prisma.examBodyAssessment.findFirst({
        where: { id: assessmentId, examBodyId, platformId },
        include: {
          examBody: { select: { id: true, name: true } },
        },
      });

      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }

      // Base folder for all question/option images for this assessment
      const s3Folder = `exam-body-assessment-images/platforms/${platformId}/assessments/${assessmentId}`;

      // Upload image to S3 if provided
      if (imageFile) {
        this.logger.log(colors.blue(`📤 Uploading image: ${imageFile.originalname}`));

        // Validate image
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(imageFile.mimetype)) {
          throw new BadRequestException('Invalid image file type. Allowed: JPEG, PNG, GIF, WEBP');
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          throw new BadRequestException('Image file size exceeds 5MB limit');
        }

        // Upload to S3
        const fileName = `question_${Date.now()}_${imageFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        try {
          const uploadResult = await this.storageService.uploadFile(imageFile, s3Folder, fileName);
          uploadedImageKeys.push(uploadResult.key);

          // Add image data to DTO
          (createQuestionDto as any).imageUrl = uploadResult.url;

          this.logger.log(colors.green(`✅ Image uploaded: ${uploadResult.key}`));
        } catch (uploadError: any) {
          this.logger.error(colors.red(`❌ Image upload failed: ${uploadError.message}`));
          throw new BadRequestException(`Failed to upload image: ${uploadError.message}`);
        }
      }

      // Upload option images if provided
      if (optionImageFiles.length > 0 && createQuestionDto.options?.length) {
        for (let i = 0; i < optionImageFiles.length; i++) {
          const optionFile = optionImageFiles[i];
          this.logger.log(colors.blue(`📤 Uploading option image [${i}]: ${optionFile.originalname}`));

          const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
          if (!allowedMimeTypes.includes(optionFile.mimetype)) {
            throw new BadRequestException('Invalid image file type. Allowed: JPEG, PNG, GIF, WEBP');
          }

          const maxSize = 5 * 1024 * 1024; // 5MB
          if (optionFile.size > maxSize) {
            throw new BadRequestException('Image file size exceeds 5MB limit');
          }

          const optionFileName = `option_${Date.now()}_${i}_${optionFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          try {
            const uploadResult = await this.storageService.uploadFile(optionFile, s3Folder, optionFileName);
            uploadedImageKeys.push(uploadResult.key);

            const matchingOption = (createQuestionDto.options as any[]).find(
              (opt: any) => opt.imageIndex === i,
            );

            if (matchingOption) {
              matchingOption.imageUrl = uploadResult.url;
              this.logger.log(colors.green(`✅ Option image [${i}] uploaded and matched to option`));
            } else {
              this.logger.warn(
                colors.yellow(
                  `⚠️ Option image [${i}] uploaded but no option in questionData.options has imageIndex=${i}`,
                ),
              );
            }
          } catch (optionUploadError: any) {
            this.logger.error(colors.red(`❌ Option image upload failed: ${optionUploadError.message}`));
            throw new BadRequestException(`Failed to upload option image: ${optionUploadError.message}`);
          }
        }
      }

      // Create question in database
      try {
        const question = await this.createQuestion(user, examBodyId, assessmentId, createQuestionDto);
        this.logger.log(colors.green(`✅ Question created successfully with image`));
        return question;
      } catch (questionError) {
        // Question creation failed - rollback image upload
        if (uploadedImageKeys.length > 0) {
          this.logger.warn(
            colors.yellow(
              `⚠️  Question creation failed. Rolling back ${uploadedImageKeys.length} uploaded image(s).`,
            ),
          );
          for (const key of uploadedImageKeys) {
            try {
              await this.storageService.deleteFile(key);
              this.logger.log(colors.green(`✅ Orphaned image deleted from S3: ${key}`));
            } catch (deleteError: any) {
              this.logger.error(colors.red(`❌ Failed to delete orphaned image ${key}: ${deleteError.message}`));
            }
          }
        }
        throw questionError;
      }
    } catch (error) {
      this.logger.error(colors.red(`❌ Error in createQuestionWithImage: ${error.message}`));
      throw error;
    }
  }

  async getQuestions(user: any, examBodyId: string, assessmentId: string): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const assessment = await this.prisma.examBodyAssessment.findFirst({
      where: { id: assessmentId, examBodyId, platformId },
      select: { id: true },
    });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const questions = await this.prisma.examBodyAssessmentQuestion.findMany({
      where: { assessmentId },
      include: {
        options: { orderBy: { order: 'asc' } },
        correctAnswers: true,
      },
      orderBy: { order: 'asc' },
    });

    return new ApiResponse(true, 'Questions retrieved successfully', questions);
  }

  async updateQuestion(
    user: any,
    examBodyId: string,
    questionId: string,
    updateDto: UpdateLibraryExamBodyQuestionDto,
    imageFile?: Express.Multer.File,
    optionImageFiles: Express.Multer.File[] = [],
  ): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const existingQuestion = await this.prisma.examBodyAssessmentQuestion.findUnique({
      where: { id: questionId },
      include: {
        assessment: { select: { id: true, examBodyId: true, platformId: true } },
      },
    });

    if (!existingQuestion || existingQuestion.assessment.platformId !== platformId || existingQuestion.assessment.examBodyId !== examBodyId) {
      throw new NotFoundException('Question not found');
    }

    let imageUrl: string | undefined;
    let imageS3Key: string | undefined;
    let oldImageS3Key: string | undefined;

    // Base folder for all images (question + options) for this assessment
    const s3Folder = `exam-body-assessment-images/platforms/${platformId}/assessments/${existingQuestion.assessment.id}`;

    // Handle image upload if new file provided
    if (imageFile) {
      this.logger.log(colors.blue(`📤 Uploading new image for question: ${questionId}`));

      // Validate image
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(imageFile.mimetype)) {
        throw new BadRequestException('Invalid image file type. Allowed: JPEG, PNG, GIF, WEBP');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        throw new BadRequestException('Image file size exceeds 5MB limit');
      }

      // Store old image key for cleanup
      oldImageS3Key = existingQuestion.imageUrl ? this.extractS3KeyFromUrl(existingQuestion.imageUrl) : undefined;

      // Upload new image to S3
      const fileName = `question_${Date.now()}_${imageFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      try {
        const uploadResult = await this.storageService.uploadFile(imageFile, s3Folder, fileName);
        imageUrl = uploadResult.url;
        imageS3Key = uploadResult.key;
        this.logger.log(colors.green(`✅ New image uploaded to S3: ${imageS3Key}`));
      } catch (s3Error: any) {
        this.logger.error(colors.red(`❌ Failed to upload image to S3: ${s3Error.message}`));
        throw new BadRequestException(`Failed to upload image: ${s3Error.message}`);
      }
    } else if ((updateDto as any).imageUrl === null || (updateDto as any).imageUrl === '') {
      // If image_url is explicitly set to null/empty, remove the image
      imageUrl = undefined;
      imageS3Key = undefined;
      oldImageS3Key = existingQuestion.imageUrl ? this.extractS3KeyFromUrl(existingQuestion.imageUrl) : undefined;
    } else if ((updateDto as any).imageUrl !== undefined) {
      // If imageUrl is provided in DTO, use it
      imageUrl = (updateDto as any).imageUrl;
    }

    // Handle option image uploads, mapped via imageIndex on each option
    if (optionImageFiles.length > 0 && updateDto.options?.length) {
      for (let i = 0; i < optionImageFiles.length; i++) {
        const optionFile = optionImageFiles[i];
        this.logger.log(colors.blue(`📤 Uploading option image [${i}] for question: ${questionId}`));

        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(optionFile.mimetype)) {
          throw new BadRequestException('Invalid image file type. Allowed: JPEG, PNG, GIF, WEBP');
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (optionFile.size > maxSize) {
          throw new BadRequestException('Image file size exceeds 5MB limit');
        }

        const optionFileName = `option_${Date.now()}_${i}_${optionFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        try {
          const uploadResult = await this.storageService.uploadFile(optionFile, s3Folder, optionFileName);

          const matchingOption = (updateDto.options as any[]).find(
            (opt: any) => opt.imageIndex === i,
          );

          if (matchingOption) {
            matchingOption.imageUrl = uploadResult.url;
            this.logger.log(colors.green(`✅ Option image [${i}] uploaded and matched to option`));
          } else {
            this.logger.warn(
              colors.yellow(
                `⚠️ Option image [${i}] uploaded but no option in updateDto.options has imageIndex=${i}`,
              ),
            );
          }
        } catch (optionUploadError: any) {
          this.logger.error(colors.red(`❌ Option image upload failed: ${optionUploadError.message}`));
          throw new BadRequestException(`Failed to upload option image: ${optionUploadError.message}`);
        }
      }
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updateData: any = {
        questionText: updateDto.questionText,
        questionType: updateDto.questionType,
        points: updateDto.points,
        order: updateDto.order,
        explanation: updateDto.explanation,
      };

      // Only update image fields if they've changed
      if (imageFile || (updateDto as any).imageUrl === null || (updateDto as any).imageUrl === '') {
        updateData.imageUrl = imageUrl;
      } else if ((updateDto as any).imageUrl !== undefined) {
        updateData.imageUrl = (updateDto as any).imageUrl;
      }

      const question = await prisma.examBodyAssessmentQuestion.update({
        where: { id: questionId },
        data: updateData,
      });

      let options: any[] | undefined;
      let correctAnswers: any[] | undefined;

      if (updateDto.options) {
        await prisma.examBodyAssessmentOption.deleteMany({ where: { questionId } });
        await prisma.examBodyAssessmentCorrectAnswer.deleteMany({ where: { questionId } });

        options = await Promise.all(
          updateDto.options.map(async (optionData: any) => {
            return await prisma.examBodyAssessmentOption.create({
              data: {
                questionId,
                optionText: optionData.optionText,
                order: optionData.order || 0,
                isCorrect: optionData.isCorrect || false,
                imageUrl: optionData.imageUrl,
              },
            });
          })
        );

        const correctOptionIds = options.filter(opt => opt.isCorrect).map(opt => opt.id);
        if (correctOptionIds.length > 0) {
          const correctAnswer = await prisma.examBodyAssessmentCorrectAnswer.create({
            data: {
              questionId,
              optionIds: correctOptionIds,
            },
          });
          correctAnswers = [correctAnswer];
        } else {
          correctAnswers = [];
        }
      }

      return { question, options, correctAnswers };
    });

    // Delete old image from S3 if it was replaced or removed
    if (oldImageS3Key && (imageFile || (updateDto as any).imageUrl === null || (updateDto as any).imageUrl === '')) {
      try {
        await this.storageService.deleteFile(oldImageS3Key);
        this.logger.log(colors.green(`🗑️ Old image deleted from S3: ${oldImageS3Key}`));
      } catch (deleteError: any) {
        // Log error but don't fail the update
        this.logger.error(colors.yellow(`⚠️ Failed to delete old image from S3: ${deleteError.message}`));
      }
    }

    await this.updateAssessmentTotalPoints(existingQuestion.assessment.id);

    this.logger.log(colors.green(`✅ Question updated successfully: ${questionId}`));
    return new ApiResponse(true, 'Question updated successfully', result);
  }

  async deleteQuestionImage(
    user: any,
    examBodyId: string,
    questionId: string,
  ): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const question = await this.prisma.examBodyAssessmentQuestion.findUnique({
      where: { id: questionId },
      include: {
        assessment: { select: { id: true, examBodyId: true, platformId: true } },
      },
    });

    if (!question || question.assessment.platformId !== platformId || question.assessment.examBodyId !== examBodyId) {
      throw new NotFoundException('Question not found');
    }

    if (!question.imageUrl) {
      throw new BadRequestException('Question does not have an image');
    }

    const imageS3Key = this.extractS3KeyFromUrl(question.imageUrl);

    // Delete image from S3
    if (imageS3Key) {
      try {
        await this.storageService.deleteFile(imageS3Key);
        this.logger.log(colors.green(`🗑️ Image deleted from S3: ${imageS3Key}`));
      } catch (deleteError: any) {
        this.logger.error(colors.yellow(`⚠️ Failed to delete image from S3: ${deleteError.message}`));
        // Continue to remove imageUrl from DB even if S3 delete fails
      }
    }

    // Remove image URL from question
    await this.prisma.examBodyAssessmentQuestion.update({
      where: { id: questionId },
      data: { imageUrl: null },
    });

    this.logger.log(colors.green(`✅ Question image deleted successfully`));
    return new ApiResponse(true, 'Question image deleted successfully', { questionId });
  }

  private extractS3KeyFromUrl(url: string): string | undefined {
    // Extract S3 key from URL if it's an S3 URL
    // Format: https://bucket.s3.region.amazonaws.com/key
    const s3UrlMatch = url.match(/https:\/\/[^/]+\.s3\.[^/]+\/(.+)$/);
    return s3UrlMatch ? s3UrlMatch[1] : undefined;
  }

  async deleteQuestion(user: any, examBodyId: string, questionId: string): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const question = await this.prisma.examBodyAssessmentQuestion.findUnique({
      where: { id: questionId },
      include: { assessment: true },
    });
    if (!question || question.assessment.platformId !== platformId || question.assessment.examBodyId !== examBodyId) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.examBodyAssessmentQuestion.delete({ where: { id: questionId } });
    await this.updateAssessmentTotalPoints(question.assessmentId);

    this.logger.log(colors.green('✅ Question deleted'));
    return new ApiResponse(true, 'Question deleted successfully', { id: questionId });
  }

  async publishAssessment(user: any, examBodyId: string, id: string): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const existing = await this.prisma.examBodyAssessment.findFirst({
      where: { id, examBodyId, platformId },
    });
    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }

    const assessment = await this.prisma.examBodyAssessment.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    this.logger.log(colors.green(`✅ Assessment published: ${assessment.title}`));
    return new ApiResponse(true, 'Assessment published successfully', assessment);
  }

  async unpublishAssessment(user: any, examBodyId: string, id: string): Promise<ApiResponse<any>> {
    const platformId = await this.getPlatformId(user.sub);

    const existing = await this.prisma.examBodyAssessment.findFirst({
      where: { id, examBodyId, platformId },
    });
    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }

    const assessment = await this.prisma.examBodyAssessment.update({
      where: { id },
      data: {
        isPublished: false,
        publishedAt: null,
      },
    });

    this.logger.log(colors.green(`✅ Assessment unpublished: ${assessment.title}`));
    return new ApiResponse(true, 'Assessment unpublished successfully', assessment);
  }

  private async updateAssessmentTotalPoints(assessmentId: string) {
    const questions = await this.prisma.examBodyAssessmentQuestion.findMany({
      where: { assessmentId },
      select: { points: true },
    });

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    await this.prisma.examBodyAssessment.update({
      where: { id: assessmentId },
      data: { totalPoints },
    });

    this.logger.log(colors.cyan(`📊 Total points updated: ${totalPoints}`));
  }
}
