import { Injectable, Logger, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ApiResponse } from '../../../../shared/helper-functions/response';
import { CreateTopicDto, UpdateTopicDto } from './dto/topic.dto';
import * as colors from 'colors';

@Injectable()
export class TopicService {
  private readonly logger = new Logger(TopicService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createTopic(user: any, payload: CreateTopicDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY TOPIC] Creating topic for library user: ${user.email}`));

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
      const chapter = await this.prisma.libraryChapter.findFirst({
        where: {
          id: payload.chapterId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          subjectId: true,
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              platformId: true,
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

      if (!chapter) {
        this.logger.error(colors.red(`Chapter not found or does not belong to user's platform: ${payload.chapterId}`));
        throw new NotFoundException('Chapter not found or does not belong to your platform');
      }

      // Verify the subject matches the chapter's subject
      if (chapter.subjectId !== payload.subjectId) {
        this.logger.error(colors.red(`Subject ID mismatch: chapter belongs to subject ${chapter.subjectId}, but ${payload.subjectId} was provided`));
        throw new BadRequestException('Subject ID does not match the chapter\'s subject');
      }

      // Verify the subject belongs to the user's platform
      if (chapter.subject.platformId !== libraryUser.platformId) {
        this.logger.error(colors.red(`Subject does not belong to user's platform`));
        throw new NotFoundException('Subject does not belong to your platform');
      }

      // If order is not provided, get the next order number for this chapter
      let order = payload.order;
      if (!order) {
        const lastTopic = await this.prisma.libraryTopic.findFirst({
          where: {
            chapterId: payload.chapterId,
            platformId: libraryUser.platformId,
          },
          orderBy: {
            order: 'desc',
          },
          select: {
            order: true,
          },
        });

        order = lastTopic ? lastTopic.order + 1 : 1;
      }

      // Create the topic in a transaction
      const topic = await this.prisma.$transaction(async (tx) => {
        return await tx.libraryTopic.create({
          data: {
            platformId: libraryUser.platformId,
            subjectId: payload.subjectId,
            chapterId: payload.chapterId,
            title: payload.title,
            description: payload.description ?? null,
            order: order!,
            is_active: payload.is_active ?? true,
          },
          include: {
            chapter: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
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

      this.logger.log(colors.green(`Topic created successfully: ${topic.id}`));
      return new ApiResponse(true, 'Topic created successfully', topic);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error creating topic: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to create topic');
    }
  }

  async updateTopic(user: any, topicId: string, payload: UpdateTopicDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY TOPIC] Updating topic: ${topicId} for library user: ${user.email}`));

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

      // Verify the topic exists and belongs to the user's platform
      const existingTopic = await this.prisma.libraryTopic.findFirst({
        where: {
          id: topicId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
        },
      });

      if (!existingTopic) {
        this.logger.error(colors.red(`Topic not found or does not belong to user's platform: ${topicId}`));
        throw new NotFoundException('Topic not found or does not belong to your platform');
      }

      // Build update data object (only include fields that are provided)
      const updateData: any = {};
      if (payload.title !== undefined) updateData.title = payload.title;
      if (payload.description !== undefined) updateData.description = payload.description ?? null;
      if (payload.order !== undefined) updateData.order = payload.order;
      if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

      // If no fields to update, return early
      if (Object.keys(updateData).length === 0) {
        const topic = await this.prisma.libraryTopic.findUnique({
          where: { id: topicId },
          include: {
            chapter: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
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
        return new ApiResponse(true, 'No changes detected', topic);
      }

      // Update the topic in a transaction
      const topic = await this.prisma.$transaction(async (tx) => {
        return await tx.libraryTopic.update({
          where: { id: topicId },
          data: updateData,
          include: {
            chapter: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
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

      this.logger.log(colors.green(`Topic updated successfully: ${topic.id}`));
      return new ApiResponse(true, 'Topic updated successfully', topic);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(colors.red(`Error updating topic: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to update topic');
    }
  }
}

