import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import * as colors from 'colors';
import { CreateLibraryClassDevDto } from './dto';

@Injectable()
export class LibraryDevClassService {
  private readonly logger = new Logger(LibraryDevClassService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createClass(payload: CreateLibraryClassDevDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Creating library class: ${payload.name}`));

    const existing = await this.prisma.libraryClass.findFirst({
      where: {
        name: payload.name,
      },
    });

    if (existing) {
      this.logger.error(colors.red('A class with this name already exists'));
      throw new BadRequestException('A class with this name already exists');
    }

    // Compute next order automatically (auto-increment-like behavior)
    const lastClass = await this.prisma.libraryClass.findFirst({
      orderBy: { order: 'desc' },
    });

    const nextOrder = (lastClass?.order ?? 0) + 1;

    const created = await this.prisma.libraryClass.create({
      data: {
        name: payload.name,
        order: nextOrder,
      },
    });

    this.logger.log(colors.green('Library class created successfully'));

    return new ApiResponse(true, 'Library class created successfully', created);
  }

  async listClasses(platformId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Listing library classes for platform: ${platformId}`));

    // if (!platformId) {
    //   throw new BadRequestException('platformId is required');
    // }

    const classes = await this.prisma.libraryClass.findMany({
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


