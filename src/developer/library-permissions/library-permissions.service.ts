import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';
import { CreatePermissionDefinitionDto, UpdatePermissionDefinitionDto } from './dto';

@Injectable()
export class LibraryPermissionsService {
  private readonly logger = new Logger(LibraryPermissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreatePermissionDefinitionDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Creating permission definition: ${payload.code}`));

    const existing = await this.prisma.libraryPermissionDefinition.findUnique({
      where: { code: payload.code },
    });
    if (existing) {
      throw new BadRequestException(`Permission with code "${payload.code}" already exists`);
    }

    const created = await this.prisma.libraryPermissionDefinition.create({
      data: {
        code: payload.code,
        name: payload.name,
        description: payload.description ?? null,
      },
    });

    this.logger.log(colors.green('Permission definition created successfully'));
    return new ApiResponse(true, 'Permission definition created successfully', created);
  }

  async findAll(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('[DEV] Listing all permission definitions'));

    const list = await this.prisma.libraryPermissionDefinition.findMany({
      orderBy: { code: 'asc' },
    });

    return new ApiResponse(true, 'Permission definitions retrieved successfully', list);
  }

  async findOne(id: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Getting permission definition: ${id}`));

    const item = await this.prisma.libraryPermissionDefinition.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException('Permission definition not found');
    }

    return new ApiResponse(true, 'Permission definition retrieved successfully', item);
  }

  async update(id: string, payload: UpdatePermissionDefinitionDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[DEV] Updating permission definition: ${id}`));

    const existing = await this.prisma.libraryPermissionDefinition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Permission definition not found');
    }

    const updated = await this.prisma.libraryPermissionDefinition.update({
      where: { id },
      data: {
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.description !== undefined && { description: payload.description }),
      },
    });

    this.logger.log(colors.green('Permission definition updated successfully'));
    return new ApiResponse(true, 'Permission definition updated successfully', updated);
  }

  async remove(id: string): Promise<ApiResponse<void>> {
    this.logger.log(colors.cyan(`[DEV] Deleting permission definition: ${id}`));

    const existing = await this.prisma.libraryPermissionDefinition.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Permission definition not found');
    }

    await this.prisma.libraryPermissionDefinition.delete({
      where: { id },
    });

    this.logger.log(colors.green('Permission definition deleted successfully'));
    return new ApiResponse(true, 'Permission definition deleted successfully');
  }
}
