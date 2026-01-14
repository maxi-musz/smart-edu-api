import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExamBodyYearDto, UpdateExamBodyYearDto } from './dto';
import { ResponseHelper } from '../../shared/helper-functions/response.helpers';
import * as colors from 'colors';

@Injectable()
export class ExamBodyYearService {
  private readonly logger = new Logger(ExamBodyYearService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(examBodyId: string, createDto: CreateExamBodyYearDto) {
    this.logger.log(colors.cyan(`📝 Creating year: ${createDto.year} for exam body: ${examBodyId}`));

    const examBody = await this.prisma.examBody.findUnique({ where: { id: examBodyId } });
    if (!examBody) {
      throw new NotFoundException('Exam body not found');
    }

    const existing = await this.prisma.examBodyYear.findFirst({
      where: { examBodyId, year: createDto.year },
    });

    if (existing) {
      throw new ConflictException(`Year "${createDto.year}" already exists for this exam body`);
    }

    const year = await this.prisma.examBodyYear.create({
      data: {
        ...createDto,
        examBodyId,
        startDate: createDto.startDate ? new Date(createDto.startDate) : null,
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      },
      include: { examBody: true },
    });

    this.logger.log(colors.green(`✅ Year created: ${year.year}`));
    return ResponseHelper.success('Year created successfully', year);
  }

  async findAll(examBodyId: string) {
    this.logger.log(colors.cyan(`📚 Fetching years for exam body: ${examBodyId}`));

    const years = await this.prisma.examBodyYear.findMany({
      where: { examBodyId },
      include: {
        examBody: true,
        _count: { select: { assessments: true } },
      },
      orderBy: { order: 'desc' },
    });

    this.logger.log(colors.green(`✅ Found ${years.length} years`));
    return ResponseHelper.success('Years retrieved successfully', years);
  }

  async findOne(id: string) {
    const year = await this.prisma.examBodyYear.findUnique({
      where: { id },
      include: {
        examBody: true,
        _count: { select: { assessments: true } },
      },
    });

    if (!year) {
      throw new NotFoundException('Year not found');
    }

    return ResponseHelper.success('Year retrieved successfully', year);
  }

  async update(id: string, updateDto: UpdateExamBodyYearDto) {
    this.logger.log(colors.cyan(`📝 Updating year: ${id}`));

    const existing = await this.prisma.examBodyYear.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Year not found');
    }

    if (updateDto.year) {
      const conflict = await this.prisma.examBodyYear.findFirst({
        where: { examBodyId: existing.examBodyId, year: updateDto.year, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException(`Year "${updateDto.year}" already exists`);
      }
    }

    const year = await this.prisma.examBodyYear.update({
      where: { id },
      data: {
        ...updateDto,
        startDate: updateDto.startDate ? new Date(updateDto.startDate) : undefined,
        endDate: updateDto.endDate ? new Date(updateDto.endDate) : undefined,
      },
      include: { examBody: true },
    });

    this.logger.log(colors.green(`✅ Year updated: ${year.year}`));
    return ResponseHelper.success('Year updated successfully', year);
  }

  async remove(id: string) {
    const year = await this.prisma.examBodyYear.findUnique({ where: { id } });
    if (!year) {
      throw new NotFoundException('Year not found');
    }

    await this.prisma.examBodyYear.delete({ where: { id } });
    this.logger.log(colors.green(`✅ Year deleted: ${year.year}`));

    return ResponseHelper.success('Year deleted successfully', { id });
  }
}

