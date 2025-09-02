import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import * as colors from 'colors';

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService,
  ) {}

  async createTopic(createTopicDto: CreateTopicDto, schoolId: string, userId: string): Promise<TopicResponseDto> {
    this.logger.log(colors.cyan(`Creating topic: ${createTopicDto.title} for subject: ${createTopicDto.subject_id}`));

    // Validate academic session
    const academicSessionResponse = await this.academicSessionService.findOne(createTopicDto.academic_session_id);
    if (!academicSessionResponse.success || !academicSessionResponse.data) {
      throw new NotFoundException('Academic session not found');
    }

    // Validate subject exists and belongs to the school
    const subject = await this.prisma.subject.findFirst({
      where: {
        id: createTopicDto.subject_id,
        schoolId,
        academic_session_id: createTopicDto.academic_session_id,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found or does not belong to this school and academic session');
    }

    // Check if topic with same title already exists in the subject and academic session
    const existingTopic = await this.prisma.topic.findFirst({
      where: {
        title: createTopicDto.title,
        subject_id: createTopicDto.subject_id,
        academic_session_id: createTopicDto.academic_session_id,
      },
    });

    if (existingTopic) {
      throw new BadRequestException(`Topic with title "${createTopicDto.title}" already exists in this subject`);
    }

    // Get the next order number for the subject
    const lastTopic = await this.prisma.topic.findFirst({
      where: {
        subject_id: createTopicDto.subject_id,
        academic_session_id: createTopicDto.academic_session_id,
      },
      orderBy: {
        order: 'desc',
      },
    });

    const nextOrder = (lastTopic?.order || 0) + 1;

    const topic = await this.prisma.topic.create({
      data: {
        title: createTopicDto.title,
        description: createTopicDto.description,
        order: createTopicDto.order || nextOrder,
        subject_id: createTopicDto.subject_id,
        school_id: schoolId,
        academic_session_id: createTopicDto.academic_session_id,
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
    return this.mapToResponseDto(topic);
  }

  async getAllTopics(schoolId: string, subjectId?: string, academicSessionId?: string): Promise<TopicResponseDto[]> {
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

  async getTopicById(topicId: string, schoolId: string): Promise<TopicResponseDto> {
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

  async updateTopic(topicId: string, updateTopicDto: UpdateTopicDto, schoolId: string): Promise<TopicResponseDto> {
    this.logger.log(colors.cyan(`Updating topic: ${topicId}`));

    // Check if topic exists
    const existingTopic = await this.prisma.topic.findFirst({
      where: {
        id: topicId,
        school_id: schoolId,
      },
    });

    if (!existingTopic) {
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
        throw new BadRequestException(`Topic with title "${updateTopicDto.title}" already exists in this subject`);
      }
    }

    const updatedTopic = await this.prisma.topic.update({
      where: { id: topicId },
      data: {
        title: updateTopicDto.title,
        description: updateTopicDto.description,
        order: updateTopicDto.order,
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

  async deleteTopic(topicId: string, schoolId: string): Promise<void> {
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

  async reorderTopics(subjectId: string, topicOrders: { id: string; order: number }[], schoolId: string): Promise<void> {
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

    // Update topic orders
    for (const topicOrder of topicOrders) {
      await this.prisma.topic.updateMany({
        where: {
          id: topicOrder.id,
          subject_id: subjectId,
          school_id: schoolId,
        },
        data: {
          order: topicOrder.order,
        },
      });
    }

    this.logger.log(colors.green(`Topics reordered successfully for subject: ${subjectId}`));
  }

  async getTopicsBySubject(subjectId: string, schoolId: string): Promise<TopicResponseDto[]> {
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
