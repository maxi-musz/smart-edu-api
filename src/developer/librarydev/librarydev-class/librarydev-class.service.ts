import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class LibraryDevClassService {
  private readonly logger = new Logger(LibraryDevClassService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createClass(payload: {
    platformId: string;
    name: string;
    order?: number;
  }): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Creating library class: ${payload.name}`));

    if (!payload.platformId || !payload.name) {
      throw new BadRequestException('platformId and name are required');
    }

    const platform = await this.prisma.libraryPlatform.findUnique({
      where: { id: payload.platformId },
    });

    if (!platform) {
      throw new NotFoundException('Library platform not found');
    }

    const existing = await this.prisma.libraryClass.findFirst({
      where: {
        platformId: payload.platformId,
        name: payload.name,
      },
    });

    if (existing) {
      throw new BadRequestException('A class with this name already exists in this platform');
    }

    const created = await this.prisma.libraryClass.create({
      data: {
        platformId: payload.platformId,
        name: payload.name,
        order: payload.order ?? 1,
      },
    });

    return new ApiResponse(true, 'Library class created successfully', created);
  }

  async listClasses(platformId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Listing library classes for platform: ${platformId}`));

    if (!platformId) {
      throw new BadRequestException('platformId is required');
    }

    const classes = await this.prisma.libraryClass.findMany({
      where: { platformId },
      orderBy: { order: 'asc' },
    });

    return new ApiResponse(true, 'Library classes retrieved successfully', classes);
  }

  async getClass(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Getting library class: ${id}`));

    const libraryClass = await this.prisma.libraryClass.findUnique({
      where: { id },
      include: {
        subjects: true,
      },
    });

    if (!libraryClass) {
      throw new NotFoundException('Library class not found');
    }

    return new ApiResponse(true, 'Library class retrieved successfully', libraryClass);
  }

  async updateClass(id: string, payload: { name?: string; order?: number }): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Updating library class: ${id}`));

    const existing = await this.prisma.libraryClass.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library class not found');
    }

    const updated = await this.prisma.libraryClass.update({
      where: { id },
      data: {
        name: payload.name ?? existing.name,
        order: payload.order ?? existing.order,
      },
    });

    return new ApiResponse(true, 'Library class updated successfully', updated);
  }

  async deleteClass(id: string): Promise<ApiResponse<null>> {
    this.logger.log(colors.cyan(`[DEV] Deleting library class: ${id}`));

    const existing = await this.prisma.libraryClass.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library class not found');
    }

    await this.prisma.libraryClass.delete({
      where: { id },
    });

    return new ApiResponse(true, 'Library class deleted successfully', null);
  }
}


