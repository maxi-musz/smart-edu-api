import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class LibraryDevSubjectService {
  private readonly logger = new Logger(LibraryDevSubjectService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createSubject(payload: {
    platformId: string;
    name: string;
    code?: string;
    classId?: string;
    color?: string;
    description?: string;
  }): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Creating library subject: ${payload.name}`));

    if (!payload.platformId || !payload.name) {
      throw new BadRequestException('platformId and name are required');
    }

    const platform = await this.prisma.libraryPlatform.findUnique({
      where: { id: payload.platformId },
    });
    if (!platform) {
      throw new NotFoundException('Library platform not found');
    }

    if (payload.classId) {
      const libraryClass = await this.prisma.libraryClass.findUnique({
        where: { id: payload.classId },
      });
      if (!libraryClass) {
        throw new NotFoundException('Library class not found');
      }
    }

    if (payload.code) {
      const existingCode = await this.prisma.librarySubject.findFirst({
        where: {
          platformId: payload.platformId,
          code: payload.code,
        },
      });
      if (existingCode) {
        throw new BadRequestException('Subject code already exists in this platform');
      }
    }

    const created = await this.prisma.librarySubject.create({
      data: {
        platformId: payload.platformId,
        classId: payload.classId ?? null,
        name: payload.name,
        code: payload.code ?? null,
        color: payload.color ?? '#3B82F6',
        description: payload.description ?? null,
      },
    });

    return new ApiResponse(true, 'Library subject created successfully', created);
  }

  async listSubjects(platformId: string, classId?: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Listing library subjects for platform: ${platformId}`));

    if (!platformId) {
      throw new BadRequestException('platformId is required');
    }

    const subjects = await this.prisma.librarySubject.findMany({
      where: {
        platformId,
        classId: classId ?? undefined,
      },
      orderBy: { name: 'asc' },
    });

    return new ApiResponse(true, 'Library subjects retrieved successfully', subjects);
  }

  async getSubject(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Getting library subject: ${id}`));

    const subject = await this.prisma.librarySubject.findUnique({
      where: { id },
      include: {
        class: true,
        topics: true,
      },
    });

    if (!subject) {
      throw new NotFoundException('Library subject not found');
    }

    return new ApiResponse(true, 'Library subject retrieved successfully', subject);
  }

  async updateSubject(
    id: string,
    payload: { name?: string; code?: string; classId?: string | null; color?: string; description?: string },
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Updating library subject: ${id}`));

    const existing = await this.prisma.librarySubject.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library subject not found');
    }

    if (payload.classId) {
      const libraryClass = await this.prisma.libraryClass.findUnique({
        where: { id: payload.classId },
      });
      if (!libraryClass) {
        throw new NotFoundException('Library class not found');
      }
    }

    if (payload.code && payload.code !== existing.code) {
      const existingCode = await this.prisma.librarySubject.findFirst({
        where: {
          platformId: existing.platformId,
          code: payload.code,
        },
      });
      if (existingCode) {
        throw new BadRequestException('Subject code already exists in this platform');
      }
    }

    const updated = await this.prisma.librarySubject.update({
      where: { id },
      data: {
        name: payload.name ?? existing.name,
        code: payload.code ?? existing.code,
        classId: payload.classId === undefined ? existing.classId : payload.classId,
        color: payload.color ?? existing.color,
        description: payload.description ?? existing.description,
      },
    });

    return new ApiResponse(true, 'Library subject updated successfully', updated);
  }

  async deleteSubject(id: string): Promise<ApiResponse<null>> {
    this.logger.log(colors.cyan(`[DEV] Deleting library subject: ${id}`));

    const existing = await this.prisma.librarySubject.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library subject not found');
    }

    await this.prisma.librarySubject.delete({
      where: { id },
    });

    return new ApiResponse(true, 'Library subject deleted successfully', null);
  }
}


