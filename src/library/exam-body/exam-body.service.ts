import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class LibraryExamBodyService {
  private readonly logger = new Logger(LibraryExamBodyService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('[LIBRARY EXAM BODY] Fetching exam bodies'));

    const examBodies = await this.prisma.examBody.findMany({
      where: { status: 'active' },
      include: {
        subjects: {
          where: { status: 'active' },
          orderBy: { order: 'asc' },
        },
        years: {
          where: { status: 'active' },
          orderBy: { order: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return new ApiResponse(true, 'Exam bodies retrieved successfully', examBodies);
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY EXAM BODY] Fetching exam body: ${id}`));

    const examBody = await this.prisma.examBody.findUnique({
      where: { id },
      include: {
        subjects: {
          where: { status: 'active' },
          orderBy: { order: 'asc' },
        },
        years: {
          where: { status: 'active' },
          orderBy: { order: 'desc' },
        },
      },
    });

    return new ApiResponse(true, 'Exam body retrieved successfully', examBody);
  }
}
