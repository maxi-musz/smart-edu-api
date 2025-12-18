import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createPlatform(payload: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Creating library platform: ${payload.name}`));

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

  async getPlatforms(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('Fetching all library platforms'));

    const platforms = await this.prisma.libraryPlatform.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return new ApiResponse(true, 'Library platforms retrieved successfully', platforms);
  }

  async getPlatformExplorer(slug: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`Fetching explorer data for platform: ${slug}`));

    const platform = await this.prisma.libraryPlatform.findUnique({
      where: { slug },
      include: {
        classes: {
          orderBy: { order: 'asc' },
          include: {
            subjects: {
              orderBy: { name: 'asc' },
              include: {
                topics: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!platform) {
      throw new NotFoundException('Library platform not found');
    }

    return new ApiResponse(true, 'Library explorer data retrieved successfully', platform);
  }
}


