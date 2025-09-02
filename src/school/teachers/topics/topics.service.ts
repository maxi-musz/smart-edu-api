import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateTopicRequestDto } from './dto/create-topic-request.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService,
  ) {}

  async createTopic(createTopicRequestDto: CreateTopicRequestDto, user: any) {
    // Fetch user from database to get school_id
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true }
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const schoolId = dbUser.school_id;
    const userId = dbUser.id;

    this.logger.log(colors.cyan(`Creating topic: ${createTopicRequestDto.title} for subject: ${createTopicRequestDto.subject_id}`));

    // Get current active academic session automatically (or use provided one)
    let currentSessionId = await this.academicSessionService.getCurrentSessionId(schoolId);
    if (!currentSessionId) {
      this.logger.error(colors.red('No active academic session found for this school'));
      throw new NotFoundException('No active academic session found for this school');
    } else {
      // Validate provided academic session
      const academicSessionResponse = await this.academicSessionService.findOne(currentSessionId);
      if (!academicSessionResponse.success || !academicSessionResponse.data) {
        throw new NotFoundException('Academic session not found');
      }
    }

    // Validate subject exists and belongs to the school
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: createTopicRequestDto.subject_id,
        schoolId,
        academic_session_id: currentSessionId,
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject not found or does not belong to this school and academic session (${currentSessionId})`);
    }

    // Check if topic with same title already exists in the subject and academic session
    const existingTopic = await this.prisma.topic.findFirst({
      where: {
        title: createTopicRequestDto.title,
        subject_id: createTopicRequestDto.subject_id,
        academic_session_id: currentSessionId,
      },
    });

    if (existingTopic) {
      throw new BadRequestException(`Topic with title "${createTopicRequestDto.title}" already exists in this subject`);
    }

    // Get the next order number for the subject (always auto-assign)
    const lastTopic = await this.prisma.topic.findFirst({
      where: {
        subject_id: createTopicRequestDto.subject_id,
        academic_session_id: currentSessionId,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const nextOrder = (lastTopic?.order || 0) + 1;

    const topic = await this.prisma.topic.create({
      data: {
        title: createTopicRequestDto.title.toLowerCase(),
        description: createTopicRequestDto.description?.toLowerCase(),
        instructions: createTopicRequestDto.instructions?.toLowerCase(),
        order: nextOrder, // Always auto-assign order
        subject_id: createTopicRequestDto.subject_id,
        school_id: schoolId,
        academic_session_id: currentSessionId,
        created_by: userId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(colors.green(`Topic created successfully: ${topic.id}`));
    return ResponseHelper.created(
      'Topic created successfully',
      this.mapToResponseDto(topic)
    );
  }

  async getAllTopics(user: any, subjectId?: string, academicSessionId?: string): Promise<TopicResponseDto[]> {
    // Fetch user from database to get school_id
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true }
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const schoolId = dbUser.school_id;

    this.logger.log(colors.cyan(`Fetching topics for school: ${schoolId}`));

    const where: any = { school_id: schoolId };
    if (subjectId) {
      where.subject_id = subjectId;
    }
    if (academicSessionId) {
      where.academic_session_id = academicSessionId;
    }

    const topics = await this.prisma.topic.findMany({
      where,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { subject_id: 'asc' },
        { order: 'asc' },
      ],
    });

    return topics.map(topic => this.mapToResponseDto(topic));
  }

  async getTopicById(topicId: string, user: any): Promise<TopicResponseDto> {
    // Fetch user from database to get school_id
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true }
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const schoolId = dbUser.school_id;

    this.logger.log(colors.cyan(`Fetching topic: ${topicId}`));

    const topic = await this.prisma.topic.findFirst({
      where: {
        id: topicId,
        school_id: schoolId,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    return this.mapToResponseDto(topic);
  }

  async updateTopic(topicId: string, updateTopicDto: UpdateTopicDto, user: any): Promise<TopicResponseDto> {
    // Fetch user from database to get school_id
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true }
    });

    if (!dbUser) {
      this.logger.error(colors.red('User not found'));
      throw new NotFoundException('User not found');
    }

    const schoolId = dbUser.school_id;

    this.logger.log(colors.cyan(`Updating topic: ${topicId}`));

    // Check if topic exists
    const existingTopic = await this.prisma.topic.findFirst({
      where: {
        id: topicId,
        school_id: schoolId,
      },
    });

    if (!existingTopic) {
      this.logger.error(colors.red('Topic not found'));
      throw new NotFoundException('Topic not found');
    }

    // Check if title is being updated and if it conflicts with existing topics
    if (updateTopicDto.title && updateTopicDto.title !== existingTopic.title) {
      const titleConflict = await this.prisma.topic.findFirst({
        where: {
          title: updateTopicDto.title,
          subject_id: existingTopic.subject_id,
          academic_session_id: existingTopic.academic_session_id,
          id: { not: topicId },
        },
      });

      if (titleConflict) {
        this.logger.error(colors.red(`Topic with title "${updateTopicDto.title}" already exists in this subject`));
        throw new BadRequestException(`Topic with title "${updateTopicDto.title}" already exists in this subject`);
      }
    }

    const updatedTopic = await this.prisma.topic.update({
      where: { id: topicId },
      data: {
        title: updateTopicDto.title,
        description: updateTopicDto.description,
        is_active: updateTopicDto.is_active !== undefined ? updateTopicDto.is_active : undefined,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(colors.green(`Topic updated successfully: ${topicId}`));
    return this.mapToResponseDto(updatedTopic);
  }

  async deleteTopic(topicId: string, user: any): Promise<void> {
    // Fetch user from database to get school_id
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true }
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const schoolId = dbUser.school_id;

    this.logger.log(colors.cyan(`Deleting topic: ${topicId}`));

    // Check if topic exists
    const topic = await this.prisma.topic.findFirst({
      where: {
        id: topicId,
        school_id: schoolId,
      },
    });

    if (!topic) {
      throw new NotFoundException('Topic not found');
    }

    // Check if topic has content
    const contentCount = await this.prisma.videoContent.count({
      where: { topic_id: topicId },
    });

    if (contentCount > 0) {
      throw new BadRequestException(`Cannot delete topic. It has ${contentCount} content item(s) associated with it.`);
    }

    await this.prisma.topic.delete({
      where: { id: topicId },
    });

    this.logger.log(colors.green(`Topic deleted successfully: ${topicId}`));
  }

  async reorderTopics(subjectId: string, topicOrders: { id: string; order: number }[], user: any): Promise<void> {
    this.logger.log(colors.cyan(`Reordering topics for subject: ${subjectId}`));
    // Fetch user from database to get school_id
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true }
    });

    if (!dbUser) {
      this.logger.error(colors.red('User not found'));
      throw new NotFoundException('User not found');
    }

    const schoolId = dbUser.school_id;

    this.logger.log(colors.cyan(`Reordering topics for subject: ${subjectId}`));

    // Validate subject exists and belongs to the school
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Get all topics for this subject to understand current ordering
    const allTopics = await this.prisma.topic.findMany({
      where: {
        subject_id: subjectId,
        school_id: schoolId,
        is_active: true,
      },
      orderBy: { order: 'asc' },
      select: { id: true, order: true }
    });

    if (allTopics.length === 0) {
      this.logger.error(colors.red('No topics found for this subject'));
      throw new BadRequestException('No topics found for this subject');
    }

    // Create a map of current topic positions
    const currentPositions = new Map(allTopics.map(topic => [topic.id, topic.order]));
    
    // Process each reorder request
    for (const topicOrder of topicOrders) {
      const topicId = topicOrder.id;
      const newPosition = topicOrder.order;
      const currentPosition = currentPositions.get(topicId);

      if (currentPosition === undefined) {
        throw new BadRequestException(`Topic ${topicId} not found in subject ${subjectId}`);
      }

      if (newPosition === currentPosition) {
        continue; // No change needed
      }

      // Calculate the shift direction and range
      if (newPosition > currentPosition) {
        // Moving DOWN: shift topics between current and new position UP by 1
        // Example: moving from position 4 to 6, shift positions 5,6,7... up by 1
        await this.prisma.topic.updateMany({
          where: {
            subject_id: subjectId,
            school_id: schoolId,
            order: {
              gte: currentPosition + 1,
              lte: newPosition
            },
            id: { not: topicId } // Don't update the moved topic yet
          },
          data: {
            order: { decrement: 1 }
          }
        });
      } else {
        // Moving UP: shift topics between new and current position DOWN by 1
        // Example: moving from position 6 to 4, shift positions 4,5,6... down by 1
        await this.prisma.topic.updateMany({
          where: {
            subject_id: subjectId,
            school_id: schoolId,
            order: {
              gte: newPosition,
              lt: currentPosition
            },
            id: { not: topicId } // Don't update the moved topic yet
          },
          data: {
            order: { increment: 1 }
          }
        });
      }

      // Now update the moved topic to its new position
      await this.prisma.topic.update({
        where: { id: topicId },
        data: { order: newPosition }
      });

      // Update our local position map
      currentPositions.set(topicId, newPosition);
    }

    this.logger.log(colors.green(`Topics reordered successfully for subject: ${subjectId}`));
  }

  /**
   * Reorder a single topic to a new position (drag and drop)
   * This method handles shifting other topics automatically
   */
  async reorderSingleTopic(subjectId: string, topicId: string, newPosition: number, user: any) {
    // Fetch user from database to get school_id
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true }
    });

    if (!dbUser) {
      this.logger.error(colors.red('User not found'));
      throw new NotFoundException('User not found');
    }

    const schoolId = dbUser.school_id;

    this.logger.log(colors.cyan(`Reordering topic ${topicId} to position ${newPosition} in subject ${subjectId}`));

    // Validate subject exists and belongs to the school
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId,
      },
    });

    if (!subject) {
      this.logger.error(colors.red('Subject not found'));
      throw new NotFoundException('Subject not found');
    }

    // Get the topic to be moved
    const topicToMove = await this.prisma.topic.findFirst({
      where: {
        id: topicId,
        subject_id: subjectId,
        school_id: schoolId,
        is_active: true,
      },
    });

    if (!topicToMove) {
      throw new NotFoundException('Topic not found');
    }

    const currentPosition = topicToMove.order;

    if (newPosition === currentPosition) {
      this.logger.log(colors.yellow(`Topic is already at position ${newPosition}`));
      return; // No change needed
    }

    // Validate new position is within valid range
    const totalTopics = await this.prisma.topic.count({
      where: {
        subject_id: subjectId,
        school_id: schoolId,
        is_active: true,
      },
    });

    if (newPosition < 1 || newPosition > totalTopics) {
      throw new BadRequestException(`New position must be between 1 and ${totalTopics}`);
    }

    // Use a transaction to ensure data consistency
    await this.prisma.$transaction(async (tx) => {
      if (newPosition > currentPosition) {
        // Moving DOWN: shift topics between current and new position UP by 1
        // Example: moving from position 4 to 6, shift positions 5,6,7... up by 1
        await tx.topic.updateMany({
          where: {
            subject_id: subjectId,
            school_id: schoolId,
            order: {
              gte: currentPosition + 1,
              lte: newPosition
            },
            id: { not: topicId } // Don't update the moved topic yet
          },
          data: {
            order: { decrement: 1 }
          }
        });
      } else {
        // Moving UP: shift topics between new and current position DOWN by 1
        // Example: moving from position 6 to 4, shift positions 4,5,6... down by 1
        await tx.topic.updateMany({
          where: {
            subject_id: subjectId,
            school_id: schoolId,
            order: {
              gte: newPosition,
              lt: currentPosition
            },
            id: { not: topicId } // Don't update the moved topic yet
          },
          data: {
            order: { increment: 1 }
          }
        });
      }

      // Now update the moved topic to its new position
      await tx.topic.update({
        where: { id: topicId },
        data: { order: newPosition }
      });
    });

    this.logger.log(colors.green(`Topic ${topicId} moved from position ${currentPosition} to ${newPosition} successfully`));
    return new ApiResponse(true, 'Topic moved successfully', null);
  }

  async getTopicsBySubject(subjectId: string, user: any): Promise<TopicResponseDto[]> {
    // Fetch user from database to get school_id
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, school_id: true }
    });

    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    const schoolId = dbUser.school_id;

    this.logger.log(colors.cyan(`Fetching topics for subject: ${subjectId}`));

    const topics = await this.prisma.topic.findMany({
      where: {
        subject_id: subjectId,
        school_id: schoolId,
        is_active: true,
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        school: {
          select: {
            id: true,
            school_name: true,
          },
        },
        academicSession: {
          select: {
            id: true,
            academic_year: true,
            term: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return topics.map(topic => this.mapToResponseDto(topic));
  }

  private mapToResponseDto(topic: any): TopicResponseDto {
    return {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      instructions: topic.instructions,
      order: topic.order,
      is_active: topic.is_active,
      subject: topic.subject,
      school: topic.school,
      academicSession: topic.academicSession,
      createdBy: topic.createdBy,
      createdAt: topic.createdAt,
      updatedAt: topic.updatedAt,
    };
  }
}
