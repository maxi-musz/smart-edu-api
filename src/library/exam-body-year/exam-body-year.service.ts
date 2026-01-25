import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLibraryExamBodyYearDto, UpdateLibraryExamBodyYearDto } from './dto';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class LibraryExamBodyYearService {
  private readonly logger = new Logger(LibraryExamBodyYearService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(examBodyId: string, createDto: CreateLibraryExamBodyYearDto) {
    this.logger.log(colors.cyan(`[LIBRARY EXAM BODY] Creating year: ${createDto.year}`));

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

    // Auto-calculate order if not provided
    let order = createDto.order;
    if (order === undefined || order === null) {
      const lastYear = await this.prisma.examBodyYear.findFirst({
        where: { examBodyId },
        orderBy: { order: 'desc' },
      });
      order = lastYear ? lastYear.order + 1 : 0;
    }

    const year = await this.prisma.examBodyYear.create({
      data: {
        ...createDto,
        examBodyId,
        order,
        startDate: createDto.startDate ? new Date(createDto.startDate) : null,
        endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      },
      include: { examBody: true },
    });

    return new ApiResponse(true, 'Year created successfully', year);
  }

  async findAll(examBodyId: string) {
    const years = await this.prisma.examBodyYear.findMany({
      where: { examBodyId },
      include: {
        examBody: true,
        _count: { select: { assessments: true } },
      },
      orderBy: { order: 'desc' },
    });

    return new ApiResponse(true, 'Years retrieved successfully', years);
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

    return new ApiResponse(true, 'Year retrieved successfully', year);
  }

  async update(id: string, updateDto: UpdateLibraryExamBodyYearDto) {
    this.logger.log(colors.cyan(`[LIBRARY EXAM BODY] Updating year: ${id}`));

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

    return new ApiResponse(true, 'Year updated successfully', year);
  }

  async remove(id: string) {
    const year = await this.prisma.examBodyYear.findUnique({ where: { id } });
    if (!year) {
      throw new NotFoundException('Year not found');
    }

    await this.prisma.examBodyYear.delete({ where: { id } });

    return new ApiResponse(true, 'Year deleted successfully', { id });
  }
}
