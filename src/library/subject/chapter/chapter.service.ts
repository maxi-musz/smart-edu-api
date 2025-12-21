import { Injectable, Logger, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import { CreateChapterDto, UpdateChapterDto } from './dto/chapter.dto';
import * as colors from 'colors';

@Injectable()
export class ChapterService {
  private readonly logger = new Logger(ChapterService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createChapter(user: any, payload: CreateChapterDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CHAPTER] Creating chapter for library user: ${user.email}`));

    try {
      // Get the library user to ensure they exist and get their platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Verify the subject exists and belongs to the user's platform
      const subject = await this.prisma.librarySubject.findFirst({
        where: {
          id: payload.subjectId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          name: true,
          code: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!subject) {
        this.logger.error(colors.red(`Subject not found or does not belong to user's platform: ${payload.subjectId}`));
        throw new NotFoundException('Subject not found or does not belong to your platform');
      }

      // If order is not provided, get the next order number for this subject
      let order = payload.order;
      if (!order) {
        const lastChapter = await this.prisma.libraryChapter.findFirst({
          where: {
            subjectId: payload.subjectId,
            platformId: libraryUser.platformId,
          },
          orderBy: {
            order: 'desc',
          },
          select: {
            order: true,
          },
        });

        order = lastChapter ? lastChapter.order + 1 : 1;
      }

      // Create the chapter in a transaction
      const chapter = await this.prisma.$transaction(async (tx) => {
        return await tx.libraryChapter.create({
          data: {
            platformId: libraryUser.platformId,
            subjectId: payload.subjectId,
            title: payload.title,
            description: payload.description ?? null,
            order: order!,
            is_active: payload.is_active ?? true,
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      this.logger.log(colors.green(`Chapter created successfully: ${chapter.id}`));
      return new ApiResponse(true, 'Chapter created successfully', chapter);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error creating chapter: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to create chapter');
    }
  }

  async updateChapter(user: any, chapterId: string, payload: UpdateChapterDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY CHAPTER] Updating chapter: ${chapterId} for library user: ${user.email}`));

    try {
      // Get the library user to ensure they exist and get their platform
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: { platformId: true },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Verify the chapter exists and belongs to the user's platform
      const existingChapter = await this.prisma.libraryChapter.findFirst({
        where: {
          id: chapterId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
        },
      });

      if (!existingChapter) {
        this.logger.error(colors.red(`Chapter not found or does not belong to user's platform: ${chapterId}`));
        throw new NotFoundException('Chapter not found or does not belong to your platform');
      }

      // Build update data object (only include fields that are provided)
      const updateData: any = {};
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description ?? null;
      if (payload.order !== undefined) updateData.order = payload.order;
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

      // If no fields to update, return early
      if (Object.keys(updateData).length === 0) {
        const chapter = await this.prisma.libraryChapter.findUnique({
          where: { id: chapterId },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
        return new ApiResponse(true, 'No changes detected', chapter);
      }

      // Update the chapter in a transaction
      const chapter = await this.prisma.$transaction(async (tx) => {
        return await tx.libraryChapter.update({
          where: { id: chapterId },
          data: updateData,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });
      }, {
        maxWait: 5000,
        timeout: 15000,
      });

      this.logger.log(colors.green(`Chapter updated successfully: ${chapter.id}`));
      return new ApiResponse(true, 'Chapter updated successfully', chapter);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error updating chapter: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to update chapter');
    }
  }
}

