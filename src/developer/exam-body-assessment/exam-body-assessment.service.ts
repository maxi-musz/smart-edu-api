import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamBodyAssessmentDto, CreateExamBodyQuestionDto, UpdateExamBodyAssessmentDto } from './dto';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';
import * as colors from 'colors';

@Injectable()
export class ExamBodyAssessmentService {
  private readonly logger = new Logger(ExamBodyAssessmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createAssessment(examBodyId: string, subjectId: string, yearId: string, createDto: CreateExamBodyAssessmentDto) {
    this.logger.log(colors.cyan(`📝 Creating assessment: ${createDto.title}`));

    const [examBody, subject, year] = await Promise.all([
      this.prisma.examBody.findUnique({ where: { id: examBodyId } }),
      this.prisma.examBodySubject.findUnique({ where: { id: subjectId } }),
      this.prisma.examBodyYear.findUnique({ where: { id: yearId } }),
    ]);

    if (!examBody) throw new NotFoundException('Exam body not found');
    if (!subject) throw new NotFoundException('Subject not found');
    if (!year) throw new NotFoundException('Year not found');

    const existing = await this.prisma.examBodyAssessment.findUnique({
      where: { examBodyId_subjectId_yearId: { examBodyId, subjectId, yearId } },
    });

    if (existing) {
      throw new BadRequestException('Assessment already exists for this exam body, subject, and year combination');
    }

    const assessment = await this.prisma.examBodyAssessment.create({
      data: {
        ...createDto,
        examBodyId,
        subjectId,
        yearId,
      },
      include: {
        examBody: true,
        subject: true,
        year: true,
      },
    });

    this.logger.log(colors.green(`✅ Assessment created: ${assessment.title}`));
    return ResponseHelper.success('Assessment created successfully', assessment);
  }

  async findAllAssessments(examBodyId: string, subjectId?: string, yearId?: string) {
    const assessments = await this.prisma.examBodyAssessment.findMany({
      where: {
        examBodyId,
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

    return ResponseHelper.success('Assessments retrieved successfully', assessments);
  }

  async findOneAssessment(id: string) {
    const assessment = await this.prisma.examBodyAssessment.findUnique({
      where: { id },
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

    return ResponseHelper.success('Assessment retrieved successfully', assessment);
  }

  async updateAssessment(id: string, updateDto: UpdateExamBodyAssessmentDto) {
    const existing = await this.prisma.examBodyAssessment.findUnique({ where: { id } });
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
    return ResponseHelper.success('Assessment updated successfully', assessment);
  }

  async deleteAssessment(id: string) {
    const assessment = await this.prisma.examBodyAssessment.findUnique({ where: { id } });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    await this.prisma.examBodyAssessment.delete({ where: { id } });
    this.logger.log(colors.green(`✅ Assessment deleted: ${assessment.title}`));

    return ResponseHelper.success('Assessment deleted successfully', { id });
  }

  async createQuestion(assessmentId: string, createDto: CreateExamBodyQuestionDto) {
    this.logger.log(colors.cyan(`📝 Creating question for assessment: ${assessmentId}`));

    const assessment = await this.prisma.examBodyAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) {
      throw new NotFoundException('Assessment not found');
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const question = await prisma.examBodyAssessmentQuestion.create({
        data: {
          assessmentId,
          questionText: createDto.questionText,
          questionType: createDto.questionType,
          points: createDto.points || 1,
          order: createDto.order || 0,
          explanation: createDto.explanation,
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
              },
            });
          })
        );
      }

      const correctOptionIds = options.filter(opt => opt.isCorrect).map(opt => opt.id);
      let correctAnswers: any[] = [];

      if (correctOptionIds.length > 0) {
        this.logger.log(colors.yellow(`🔧 Auto-generating correct answer from ${correctOptionIds.length} correct options`));

        const correctAnswer = await prisma.examBodyAssessmentCorrectAnswer.create({
          data: {
            questionId: question.id,
            optionIds: correctOptionIds,
          },
        });
        correctAnswers = [correctAnswer];

        this.logger.log(colors.green(`✅ Correct answer auto-generated`));
      }

      return { question, options, correctAnswers };
    });

    await this.updateAssessmentTotalPoints(assessmentId);

    this.logger.log(colors.green(`✅ Question created with ${result.options.length} options`));
    return ResponseHelper.success('Question created successfully', result);
  }

  async getQuestions(assessmentId: string) {
    const questions = await this.prisma.examBodyAssessmentQuestion.findMany({
      where: { assessmentId },
      include: {
        options: { orderBy: { order: 'asc' } },
        correctAnswers: true,
      },
      orderBy: { order: 'asc' },
    });

    return ResponseHelper.success('Questions retrieved successfully', questions);
  }

  async deleteQuestion(id: string) {
    const question = await this.prisma.examBodyAssessmentQuestion.findUnique({ where: { id }, include: { assessment: true } });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.prisma.examBodyAssessmentQuestion.delete({ where: { id } });
    await this.updateAssessmentTotalPoints(question.assessmentId);

    this.logger.log(colors.green(`✅ Question deleted`));
    return ResponseHelper.success('Question deleted successfully', { id });
  }

  async publishAssessment(id: string) {
    const assessment = await this.prisma.examBodyAssessment.update({
      where: { id },
      data: {
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    this.logger.log(colors.green(`✅ Assessment published: ${assessment.title}`));
    return ResponseHelper.success('Assessment published successfully', assessment);
  }

  async unpublishAssessment(id: string) {
    const assessment = await this.prisma.examBodyAssessment.update({
      where: { id },
      data: {
        isPublished: false,
        publishedAt: null,
      },
    });

    this.logger.log(colors.green(`✅ Assessment unpublished: ${assessment.title}`));
    return ResponseHelper.success('Assessment unpublished successfully', assessment);
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

