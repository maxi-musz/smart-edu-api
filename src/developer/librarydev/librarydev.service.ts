import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class LibraryDevService {
  private readonly logger = new Logger(LibraryDevService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== LibraryPlatform CRUD (developer-only) =====

  async createPlatform(payload: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Creating library platform: ${payload.name}`));

    if (!payload.name || !payload.slug) {
      throw new BadRequestException('name and slug are required');
    }

    const existing = await this.prisma.libraryPlatform.findFirst({
      where: {
        OR: [{ name: payload.name }, { slug: payload.slug }],
      },
    });

    if (existing) {
      throw new BadRequestException('A library platform with this name or slug already exists');
    }

    const platform = await this.prisma.libraryPlatform.create({
      data: {
        name: payload.name,
        slug: payload.slug,
        description: payload.description ?? null,
      },
    });

    return new ApiResponse(true, 'Library platform created successfully', platform);
  }

  async updatePlatform(id: string, payload: { name?: string; slug?: string; description?: string }): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Updating library platform: ${id}`));

    const existing = await this.prisma.libraryPlatform.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library platform not found');
    }

    if (payload.slug && payload.slug !== existing.slug) {
      const slugTaken = await this.prisma.libraryPlatform.findFirst({
        where: { slug: payload.slug },
      });
      if (slugTaken) {
        throw new BadRequestException('Slug already in use');
      }
    }

    const updated = await this.prisma.libraryPlatform.update({
      where: { id },
      data: {
        name: payload.name ?? existing.name,
        slug: payload.slug ?? existing.slug,
        description: payload.description ?? existing.description,
      },
    });

    return new ApiResponse(true, 'Library platform updated successfully', updated);
  }

  async deletePlatform(id: string): Promise<ApiResponse<null>> {
    this.logger.log(colors.cyan(`[DEV] Deleting library platform: ${id}`));

    const existing = await this.prisma.libraryPlatform.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library platform not found');
    }

    await this.prisma.libraryPlatform.delete({
      where: { id },
    });

    return new ApiResponse(true, 'Library platform deleted successfully', null);
  }

  async listPlatforms(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('[DEV] Listing all library platforms'));

    const platforms = await this.prisma.libraryPlatform.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return new ApiResponse(true, 'Library platforms retrieved successfully', platforms);
  }

  async getPlatform(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Getting library platform: ${id}`));

    const platform = await this.prisma.libraryPlatform.findUnique({
      where: { id },
      include: {
        classes: true,
        subjects: true,
        topics: true,
      },
    });

    if (!platform) {
      throw new NotFoundException('Library platform not found');
    }

    return new ApiResponse(true, 'Library platform retrieved successfully', platform);
  }
}


