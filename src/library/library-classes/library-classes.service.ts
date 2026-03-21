import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';
import { CreateLibraryClassDto } from './dto/create-library-class.dto';
import { UpdateLibraryClassDto } from './dto/update-library-class.dto';

@Injectable()
export class LibraryClassesService {
  private readonly logger = new Logger(LibraryClassesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateLibraryClassDto): Promise<ApiResponse<unknown>> {
    this.logger.log(colors.cyan(`[LIBRARY CLASS] Creating: ${payload.name}`));

    const existing = await this.prisma.libraryClass.findFirst({
      where: { name: payload.name },
    });

    if (existing) {
      this.logger.error(colors.red('A class with this name already exists'));
      throw new BadRequestException('A class with this name already exists');
    }

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

  async list(): Promise<ApiResponse<unknown>> {
    this.logger.log(colors.cyan('[LIBRARY CLASS] Listing all library classes'));

    const classes = await this.prisma.libraryClass.findMany({
      orderBy: { order: 'asc' },
    });

    return new ApiResponse(true, 'Library classes retrieved successfully', classes);
  }

  async getOne(id: string): Promise<ApiResponse<unknown>> {
    this.logger.log(colors.cyan(`[LIBRARY CLASS] Get: ${id}`));

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

  async update(id: string, payload: UpdateLibraryClassDto): Promise<ApiResponse<unknown>> {
    this.logger.log(colors.cyan(`[LIBRARY CLASS] Update: ${id}`));

    const existing = await this.prisma.libraryClass.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library class not found');
    }

    if (payload.name !== undefined && payload.name !== existing.name) {
      const nameTaken = await this.prisma.libraryClass.findFirst({
        where: { name: payload.name, id: { not: id } },
      });
      if (nameTaken) {
        throw new BadRequestException('A class with this name already exists');
      }
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

  async remove(id: string): Promise<ApiResponse<null>> {
    this.logger.log(colors.cyan(`[LIBRARY CLASS] Delete: ${id}`));

    const existing = await this.prisma.libraryClass.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Library class not found');
    }

    const subjectCount = await this.prisma.librarySubject.count({
      where: { classId: id },
    });

    if (subjectCount > 0) {
      throw new BadRequestException(
        `Cannot delete this class: ${subjectCount} subject(s) are still assigned to it. Reassign or remove those subjects first.`,
      );
    }

    await this.prisma.libraryClass.delete({
      where: { id },
    });

    return new ApiResponse(true, 'Library class deleted successfully', null);
  }
}
