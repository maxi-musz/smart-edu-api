import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateTopicRequestDto } from './dto/create-topic-request.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { TopicResponseDto } from './dto/topic-response.dto';
import { UploadVideoLessonDto, VideoLessonResponseDto, UploadProgressDto } from './dto/upload-video-lesson.dto';
import { ResponseHelper } from '../../../shared/helper-functions/response.helpers';

import { S3Service } from '../../../shared/services/s3.service';
import { UploadProgressService } from '../../ai-chat/upload-progress.service';
import { DocumentProcessingService } from '../../ai-chat/services';
import * as colors from 'colors';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { FileValidationHelper } from 'src/shared/helper-functions/file-validation.helper';
import * as child_process from 'child_process';
import * as util from 'util';
import * as path from 'path';
import * as fs from 'fs';
const exec = util.promisify(child_process.exec);

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService,
    private readonly s3Service: S3Service,
    private readonly uploadProgressService: UploadProgressService,
    private readonly documentProcessingService: DocumentProcessingService,
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

  /**
   * Get all content for a specific topic including videos, materials, assignments, etc.
   */
  async getTopicContent(topicId: string, user: any) {
    this.logger.log(colors.cyan(`🔄 Starting to fetch content for topic: ${topicId}`));
    
    try {
      // Fetch user from database to get school_id
      this.logger.log(colors.blue(`📋 Fetching user details for topic content...`));
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true }
      });

      if (!dbUser) {
        this.logger.error(colors.red(`❌ User not found for topic content fetch`));
        throw new NotFoundException('User not found');
      }

      const schoolId = dbUser.school_id;
      // this.logger.log(colors.blue(`✅ User validated. School ID: ${schoolId}`));

      // Get the topic first to validate it exists and belongs to the school
      // this.logger.log(colors.blue(`📚 Validating topic exists and belongs to school...`));
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: topicId,
          school_id: schoolId,
          is_active: true,
        },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!topic) {
        this.logger.error(colors.red(`❌ Topic not found: ${topicId}`));
        throw new NotFoundException('Topic not found');
      }
      const [
        videos,
        materials,
        assignments,
        quizzes,
        liveClasses,
        libraryResources
      ] = await Promise.all([
        // Videos
        this.prisma.videoContent.findMany({
          where: {
            topic_id: topicId,
            schoolId: schoolId,
          },
          orderBy: { order: 'asc' }, // Order by content order, not creation date
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            thumbnail: true,
            duration: true,
            order: true,
            size: true,
            views: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // PDF Materials
        this.prisma.pDFMaterial.findMany({
          where: {
            topic_id: topicId,
            schoolId: schoolId,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // Assignments
        this.prisma.assignment.findMany({
          where: {
            topic_id: topicId,
            school_id: schoolId,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            due_date: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // CBT Quizzes
        this.prisma.cBTQuiz.findMany({
          where: {
            topic_id: topicId,
            school_id: schoolId,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            duration: true,
            order: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // Live Classes
        this.prisma.liveClass.findMany({
          where: {
            topic_id: topicId,
            schoolId: schoolId,
          },
          orderBy: { startTime: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            meetingUrl: true,
            startTime: true,
            endTime: true,
            createdAt: true,
            updatedAt: true,
          },
        }),

        // Library Resources
        this.prisma.libraryResource.findMany({
          where: {
            topic_id: topicId,
            schoolId: schoolId,
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            resourceType: true,
            url: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      this.logger.log(colors.blue(`📊 Content fetched successfully:`));
      this.logger.log(colors.blue(`   - Videos: ${videos.length}`));
      this.logger.log(colors.blue(`   - Materials: ${materials.length}`));
      this.logger.log(colors.blue(`   - Assignments: ${assignments.length}`));
      this.logger.log(colors.blue(`   - Quizzes: ${quizzes.length}`));
      this.logger.log(colors.blue(`   - Live Classes: ${liveClasses.length}`));
      this.logger.log(colors.blue(`   - Library Resources: ${libraryResources.length}`));

      // Calculate content summary
      const contentSummary = {
        totalVideos: videos.length,
        totalMaterials: materials.length,
        totalAssignments: assignments.length,
        totalQuizzes: quizzes.length,
        totalLiveClasses: liveClasses.length,
        totalLibraryResources: libraryResources.length,
        totalContent: videos.length + materials.length + assignments.length + 
                     quizzes.length + liveClasses.length + libraryResources.length,
      };

      // Build response
      const response = {
        topicId: topic.id,
        topicTitle: topic.title,
        topicDescription: topic.description,
        topicOrder: topic.order,
        contentSummary,
        videos,
        materials,
        assignments,
        quizzes,
        liveClasses,
        libraryResources,
        createdAt: formatDate(topic.createdAt),
        updatedAt: formatDate(topic.updatedAt),
      };

      this.logger.log(colors.green(`🎉 Successfully retrieved content for topic "${topic.title}": ${contentSummary.totalContent} total items`));
      
      return ResponseHelper.success(
        'Topic content retrieved successfully',
        response
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching topic content for ${topicId}: ${error.message}`));
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Failed to fetch topic content: ${error.message}`);
    }
  }

  /**
   * Upload video lesson for a topic with progress tracking
   */
  async uploadVideoLesson(
    uploadDto: UploadVideoLessonDto,
    videoFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    user: any
  ): Promise<VideoLessonResponseDto> {
    this.logger.log(colors.cyan(`🎬 Starting video lesson upload: "${uploadDto.title}"`));
    
    try {
      // Validate file sizes
      this.logger.log(colors.blue(`📁 Validating file sizes...`));
      
      const maxVideoSize = 300 * 1024 * 1024; // 300MB
      const maxThumbnailSize = 10 * 1024 * 1024; // 10MB
      
      if (videoFile.size > maxVideoSize) {
        this.logger.error(colors.red(`❌ Video file too large: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB (max: 300MB)`));
        throw new BadRequestException('Video file size exceeds 300MB limit');
      }
      
      if (thumbnailFile && thumbnailFile.size > maxThumbnailSize) {
        this.logger.error(colors.red(`❌ Thumbnail file too large: ${(thumbnailFile.size / 1024 / 1024).toFixed(2)}MB (max: 10MB)`));
        throw new BadRequestException('Thumbnail file size exceeds 10MB limit');
      }

      // Fetch user from database to get school_id
      this.logger.log(colors.blue(`📋 Fetching user details...`));
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true }
      });

      if (!dbUser) {
        this.logger.error(colors.red(`❌ User not found for video upload`));
        throw new NotFoundException('User not found');
      }

      const schoolId = dbUser.school_id;
      const userId = dbUser.id;
      this.logger.log(colors.blue(`✅ User validated. School ID: ${schoolId}`));

      // Validate subject exists and belongs to the school
      this.logger.log(colors.blue(`📚 Validating subject...`));
      const subject = await this.prisma.subject.findFirst({
        where: {
          id: uploadDto.subject_id,
          schoolId: schoolId,
        },
      });

      if (!subject) {
        this.logger.error(colors.red(`❌ Subject not found: ${uploadDto.subject_id}`));
        throw new NotFoundException('Subject not found or does not belong to this school');
      }

      // Validate topic exists and belongs to the subject
      this.logger.log(colors.blue(`📖 Validating topic...`));
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: uploadDto.topic_id,
          subject_id: uploadDto.subject_id,
          school_id: schoolId,
          is_active: true,
        },
      });

      if (!topic) {
        this.logger.error(colors.red(`❌ Topic not found: ${uploadDto.topic_id}`));
        throw new NotFoundException('Topic not found or does not belong to this subject');
      }

      this.logger.log(colors.blue(`✅ Subject and topic validated successfully`));

      // Use S3 for video uploads (much faster than Cloudinary)
      this.logger.log(colors.blue(`🚀 Starting S3 video upload (much faster than Cloudinary)...`));
      
      const videoUploadResult = await this.s3Service.uploadFile(
        videoFile,
        `lecture-videos/schools/${schoolId}/subjects/${uploadDto.subject_id}/topics/${uploadDto.topic_id}`,
        `${uploadDto.title.replace(/\s+/g, '_')}_${Date.now()}.mp4`
      );

               this.logger.log(colors.green(`✅ Video uploaded successfully to S3`));

      // Upload thumbnail to S3 if provided
      let thumbnailResult: any = null;
      if (thumbnailFile) {
        this.logger.log(colors.blue(`🖼️ Uploading thumbnail to S3...`));
        
        const thumbnailUploadResult = await this.s3Service.uploadFile(
          thumbnailFile,
          `thumbnails/schools/${schoolId}/subjects/${uploadDto.subject_id}/topics/${uploadDto.topic_id}`,
          `${uploadDto.title.replace(/\s+/g, '_')}_thumbnail_${Date.now()}.${thumbnailFile.originalname.split('.').pop()}`
        );
        
        thumbnailResult = {
          secure_url: thumbnailUploadResult.url,
          public_id: thumbnailUploadResult.key
        };
        
        this.logger.log(colors.green(`✅ Thumbnail uploaded successfully to S3`));
      }

      // Calculate video duration and size
      const videoSize = (videoFile.size / 1024 / 1024).toFixed(2) + ' MB';
      const videoDuration = await this.extractVideoDuration(videoFile);

      // Get the next order number for videos in this topic
      this.logger.log(colors.blue(`📊 Getting next order number for videos in topic...`));
      const lastVideo = await this.prisma.videoContent.findFirst({
        where: {
          topic_id: uploadDto.topic_id,
          schoolId: schoolId,
        },
        orderBy: {
          order: 'desc',
        },
        select: { order: true }
      });

      const nextOrder = (lastVideo?.order || 0) + 1;
      this.logger.log(colors.blue(`   - Next video order: ${nextOrder}`));

      // Create video content record in database
      this.logger.log(colors.blue(`💾 Saving video lesson to database...`));
      
      const videoContent = await this.prisma.videoContent.create({
        data: {
          title: uploadDto.title.toLowerCase(),
          description: uploadDto.description?.toLowerCase(),
          topic_id: uploadDto.topic_id,
          schoolId: schoolId,
          platformId: 's3-platform-001', // Using S3 organisation ID
          uploadedById: userId,
          order: nextOrder, // Auto-assign order
          url: videoUploadResult.url, // S3 URL
          duration: videoDuration,
          size: videoSize,
          thumbnail: thumbnailResult ? {
            secure_url: thumbnailResult.secure_url,
            public_id: thumbnailResult.public_id
          } : undefined,
          status: 'published',
          views: 0
        },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      this.logger.log(colors.green(`🎉 Video lesson "${uploadDto.title}" uploaded successfully!`));
      this.logger.log(colors.blue(`📊 Video Details:`));
      this.logger.log(colors.blue(`   - Size: ${videoSize}`));
      this.logger.log(colors.blue(`   - Duration: ${videoDuration}`));
      this.logger.log(colors.blue(`   - URL: ${videoContent.url}`));
      this.logger.log(colors.blue(`   - Thumbnail: ${thumbnailResult ? 'Yes' : 'No'}`));

      // Return the created video lesson
      return {
        id: videoContent.id,
        title: videoContent.title,
        description: videoContent.description || undefined,
        url: videoContent.url,
        thumbnail: videoContent.thumbnail || undefined,
        size: videoContent.size || '0 MB',
        duration: videoContent.duration || '00:00:00',
        status: videoContent.status || 'published',
        subject_id: uploadDto.subject_id,
        topic_id: uploadDto.topic_id,
        uploaded_by: userId,
        createdAt: videoContent.createdAt,
        updatedAt: videoContent.updatedAt
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Error uploading video lesson: ${error.message}`));
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Failed to upload video lesson: ${error.message}`);
    }
  }

  /**
   * Same as uploadVideoLesson but emits progress via UploadProgressService
   */
  async uploadVideoLessonWithProgress(
    uploadDto: UploadVideoLessonDto,
    videoFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    user: any,
    sessionId: string
  ): Promise<VideoLessonResponseDto> {
    const maxVideoSize = 100 * 1024 * 1024; // 100MB per user request
    if (videoFile.size > maxVideoSize) {
      this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Video exceeds 100MB limit');
      throw new BadRequestException('Video file size exceeds 100MB limit');
    }

    try {
      this.uploadProgressService.updateProgress(sessionId, 'validating', 0);

      // Fetch user
      const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { id: true, school_id: true } });
      if (!dbUser) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'User not found');
        throw new NotFoundException('User not found');
      }
      const schoolId = dbUser.school_id;
      const userId = dbUser.id;

      // Validate subject and topic
      const subject = await this.prisma.subject.findFirst({ where: { id: uploadDto.subject_id, schoolId } });
      if (!subject) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Subject not found');
        throw new NotFoundException('Subject not found or does not belong to this school');
      }
      const topic = await this.prisma.topic.findFirst({ where: { id: uploadDto.topic_id, subject_id: uploadDto.subject_id, school_id: schoolId, is_active: true } });
      if (!topic) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Topic not found');
        throw new NotFoundException('Topic not found or does not belong to this subject');
      }

      // Upload video to S3 with progress callback (smooth, monotonic, combined with thumb later)
      const totalBytes = videoFile.size + (thumbnailFile?.size || 0);
      let lastPercent = -1;
      // Smoothing state
      let lastKnownLoaded = 0; // bytes acknowledged from S3 callbacks
      let emittedLoaded = 0;   // bytes we have emitted to clients
      const onePercent = Math.max(1, Math.floor(totalBytes / 100));
      const tickMs = 300;
      this.uploadProgressService.updateProgress(sessionId, 'uploading', 0);
      const smoother = setInterval(() => {
        if (emittedLoaded < lastKnownLoaded) {
          const delta = Math.max(onePercent, Math.floor((lastKnownLoaded - emittedLoaded) / 3));
          emittedLoaded = Math.min(emittedLoaded + delta, lastKnownLoaded);
          const percent = Math.floor((emittedLoaded / totalBytes) * 100);
          if (percent > lastPercent) {
            lastPercent = percent;
            this.uploadProgressService.updateProgress(sessionId, 'uploading', emittedLoaded);
          }
        }
      }, tickMs);
      const videoUploadResult = await this.s3Service.uploadFile(
        videoFile,
        `lecture-videos/schools/${schoolId}/subjects/${uploadDto.subject_id}/topics/${uploadDto.topic_id}`,
        `${uploadDto.title.replace(/\s+/g, '_')}_${Date.now()}.mp4`,
        (loaded) => {
          lastKnownLoaded = Math.min(loaded, videoFile.size);
        }
      );

      // Optional thumbnail
      let thumbnailResult: any = null;
      if (thumbnailFile) {
        const thumbRes = await this.s3Service.uploadFile(
          thumbnailFile,
          `thumbnails/schools/${schoolId}/subjects/${uploadDto.subject_id}/topics/${uploadDto.topic_id}`,
          `${uploadDto.title.replace(/\s+/g, '_')}_thumbnail_${Date.now()}.${thumbnailFile.originalname.split('.').pop()}`,
          (loaded) => {
            lastKnownLoaded = Math.min(videoFile.size + loaded, totalBytes);
          }
        );
        thumbnailResult = { secure_url: thumbRes.url, public_id: thumbRes.key };
      }

      this.uploadProgressService.updateProgress(sessionId, 'processing');
      // Remux/transcode to MP4 if needed, then replace URL
      const processed = await this.ensureMp4FromUrl(videoUploadResult.url, uploadDto.title);
      const finalVideoUrl = processed?.url || videoUploadResult.url;
      const videoSize = (videoFile.size / 1024 / 1024).toFixed(2) + ' MB';
      const videoDuration = await this.extractVideoDuration(videoFile);

      this.uploadProgressService.updateProgress(sessionId, 'saving');

      // Next order
      const lastVideo = await this.prisma.videoContent.findFirst({
        where: { topic_id: uploadDto.topic_id, schoolId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      const nextOrder = (lastVideo?.order || 0) + 1;

      const videoContent = await this.prisma.videoContent.create({
        data: {
          title: uploadDto.title.toLowerCase(),
          description: uploadDto.description?.toLowerCase(),
          topic_id: uploadDto.topic_id,
          schoolId,
          platformId: 's3-platform-001',
          uploadedById: userId,
          order: nextOrder,
          url: finalVideoUrl,
          duration: videoDuration,
          size: videoSize,
          thumbnail: thumbnailResult ? {
            secure_url: thumbnailResult.secure_url,
            public_id: thumbnailResult.public_id
          } : undefined,
          status: 'published',
          views: 0
        },
        include: {
          topic: { select: { id: true, title: true, subject: { select: { id: true, name: true } } } }
        }
      });

      // Ensure final state is 100%
      lastKnownLoaded = totalBytes;
      emittedLoaded = totalBytes;
      this.uploadProgressService.updateProgress(sessionId, 'processing', emittedLoaded);
      this.uploadProgressService.updateProgress(sessionId, 'saving', emittedLoaded);
      clearInterval(smoother);
      this.uploadProgressService.updateProgress(sessionId, 'completed', totalBytes, undefined, undefined, videoContent.id);

      return {
        id: videoContent.id,
        title: videoContent.title,
        description: videoContent.description || undefined,
        url: videoContent.url,
        thumbnail: videoContent.thumbnail || undefined,
        size: videoContent.size || '0 MB',
        duration: videoContent.duration || '00:00:00',
        status: videoContent.status || 'published',
        subject_id: uploadDto.subject_id,
        topic_id: uploadDto.topic_id,
        uploaded_by: userId,
        createdAt: videoContent.createdAt,
        updatedAt: videoContent.updatedAt
      };
    } catch (error) {
      this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, error.message);
      throw error;
    }
  }

  /**
   * Start a video upload session and return sessionId (async upload)
   */
  async startVideoUploadSession(
    uploadDto: UploadVideoLessonDto,
    videoFile: Express.Multer.File,
    thumbnailFile: Express.Multer.File | undefined,
    user: any
  ) {
    if (!videoFile) {
      throw new BadRequestException('Video file is required');
    }

    const totalBytes = videoFile.size + (thumbnailFile?.size || 0);
    const sessionId = this.uploadProgressService.createUploadSession(user.sub, user.school_id, totalBytes);

    this.uploadVideoLessonWithProgress(uploadDto, videoFile, thumbnailFile, user, sessionId)
      .catch(err => this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, err.message));

    return {
      success: true,
      message: 'Upload started',
      data: { sessionId },
      statusCode: 202
    };
  }

  /**
   * Get current video upload status for polling
   */
  async getVideoUploadStatus(sessionId: string) {
    const progress = this.uploadProgressService.getCurrentProgress(sessionId);
    if (!progress) {
      throw new BadRequestException('Upload session not found');
    }
    return {
      success: true,
      message: 'Upload status retrieved',
      data: progress,
      statusCode: 200
    };
  }

  /**
   * Extract video duration from uploaded file
   * Note: This is a simplified implementation. For production, you might want to use ffmpeg or similar
   */
  private async extractVideoDuration(videoFile: Express.Multer.File): Promise<string> {
    // This is a placeholder. In production, you'd use ffmpeg or a video processing library
    // For now, we'll return a default duration
    return '00:00:00';
  }

  /**
   * Ensure we have an MP4 copy of the uploaded video URL.
   * If source is already MP4, returns undefined. Otherwise downloads, remuxes/transcodes, uploads MP4 and returns new URL.
   */
  private async ensureMp4FromUrl(sourceUrl: string, baseTitle: string): Promise<{ url: string } | undefined> {
    try {
      if (sourceUrl.toLowerCase().endsWith('.mp4')) return undefined;

      // Derive S3 key from URL
      const s3Key = sourceUrl.split('.amazonaws.com/')[1];
      if (!s3Key) return undefined;

      // Download to temp
      const { filePath } = await this.s3Service.downloadToTempFile(s3Key);

      // Try remux first (copy codecs)
      const mp4Temp = filePath.replace(/\.[^/.]+$/, '') + '_remux.mp4';
      try {
        await exec(`ffmpeg -y -i ${JSON.stringify(filePath)} -c copy -movflags +faststart ${JSON.stringify(mp4Temp)}`);
      } catch {
        // Fallback: visually lossless transcode
        await exec(`ffmpeg -y -i ${JSON.stringify(filePath)} -c:v libx264 -preset veryslow -crf 18 -c:a aac -b:a 192k -movflags +faststart ${JSON.stringify(mp4Temp)}`);
      }

      // Upload MP4 next to original
      const folder = s3Key.substring(0, s3Key.lastIndexOf('/'));
      const fileName = `${baseTitle.replace(/\s+/g, '_')}_${Date.now()}.mp4`;
      const uploaded = await this.s3Service.uploadLocalFile(mp4Temp, folder, fileName, 'video/mp4');

      // Cleanup temp files
      try { fs.unlinkSync(filePath); } catch {}
      try { fs.unlinkSync(mp4Temp); } catch {}

      return { url: uploaded.url };
    } catch {
      return undefined;
    }
  }

  /**
   * Get upload progress for a specific upload (legacy placeholder)
   */
  async getUploadProgress(uploadId: string): Promise<UploadProgressDto> {
    this.logger.log(colors.cyan(`🔍 Getting upload progress for uploadId: ${uploadId}`));
    const progress = this.uploadProgressService.getCurrentProgress(uploadId);
    return progress as any;
  }

  /**
   * Test AWS S3 connection
   */
  async testS3Connection(): Promise<boolean> {
    try {
      this.logger.log(colors.cyan(`🧪 Testing AWS S3 connection...`));
      const isConnected = await this.s3Service.testConnection();
      
      if (isConnected) {
        this.logger.log(colors.green(`✅ AWS S3 connection test successful`));
      } else {
        this.logger.error(colors.red(`❌ AWS S3 connection test failed`));
      }
      
      return isConnected;
    } catch (error) {
      this.logger.error(colors.red(`❌ AWS S3 connection test error: ${error.message}`));
      return false;
    }
  }

  /**
   * Upload material (PDF, DOC, DOCX, PPT, PPTX) for a topic
   */
  async uploadMaterial(
    uploadDto: any,
    materialFile: Express.Multer.File,
    user: any
  ): Promise<any> {
    this.logger.log(colors.cyan(`📚 Starting material upload: "${uploadDto.title}"`));
    
    try {
      // Validate file
      this.logger.log(colors.blue(`📁 Validating material file...`));
      const validationResult = FileValidationHelper.validateMaterialFile(materialFile);
      
      if (!validationResult.isValid) {
        this.logger.error(colors.red(`❌ File validation failed: ${validationResult.error}`));
        throw new BadRequestException(validationResult.error);
      }

      this.logger.log(colors.green(`✅ File validation passed: ${materialFile.originalname}`));

      // Fetch user from database to get school_id
      this.logger.log(colors.blue(`📋 Fetching user details...`));
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { id: true, school_id: true }
      });

      if (!dbUser) {
        this.logger.error(colors.red(`❌ User not found: ${user.sub}`));
        throw new NotFoundException('User not found');
      }

      const schoolId = dbUser.school_id;
      const userId = dbUser.id;
      this.logger.log(colors.blue(`✅ User validated. School ID: ${schoolId}`));

      // Validate subject exists and belongs to the school
      this.logger.log(colors.blue(`📚 Validating subject...`));
      const subject = await this.prisma.subject.findFirst({
        where: {
          id: uploadDto.subject_id,
          schoolId: schoolId,
        },
      });

      if (!subject) {
        this.logger.error(colors.red(`❌ Subject not found: ${uploadDto.subject_id}`));
        throw new NotFoundException('Subject not found or does not belong to this school');
      }

      // Validate topic exists and belongs to the subject
      this.logger.log(colors.blue(`📖 Validating topic...`));
      const topic = await this.prisma.topic.findFirst({
        where: {
          id: uploadDto.topic_id,
          subject_id: uploadDto.subject_id,
          school_id: schoolId,
          is_active: true,
        },
      });

      if (!topic) {
        this.logger.error(colors.red(`❌ Topic not found: ${uploadDto.topic_id}`));
        throw new NotFoundException('Topic not found or does not belong to this subject');
      }

      this.logger.log(colors.blue(`✅ Subject and topic validated successfully`));

      // Get the next order number for materials in this topic
      this.logger.log(colors.blue(`📊 Getting next order number for materials in topic...`));
      const lastMaterial = await this.prisma.pDFMaterial.findFirst({
        where: {
          topic_id: uploadDto.topic_id,
          schoolId: schoolId,
        },
        orderBy: {
          order: 'desc',
        },
        select: { order: true }
      });

      const nextOrder = (lastMaterial?.order || 0) + 1;
      this.logger.log(colors.blue(`   - Next material order: ${nextOrder}`));

      // Upload material to S3
      this.logger.log(colors.blue(`🚀 Starting S3 material upload...`));
      const materialUploadResult = await this.s3Service.uploadFile(
        materialFile,
        `materials/schools/${schoolId}/subjects/${uploadDto.subject_id}/topics/${uploadDto.topic_id}`,
        `${uploadDto.title.replace(/\s+/g, '_')}_${Date.now()}.${validationResult.fileType}`
      );

      this.logger.log(colors.green(`✅ Material uploaded successfully to S3`));

      // Calculate material size
      const materialSize = FileValidationHelper.formatFileSize(materialFile.size);

      // Create material record in database
      this.logger.log(colors.blue(`💾 Saving material to database...`));
      
      const material = await this.prisma.pDFMaterial.create({
        data: {
          title: uploadDto.title.toLowerCase(),
          description: uploadDto.description?.toLowerCase(),
          topic_id: uploadDto.topic_id,
          schoolId: schoolId,
          platformId: 's3-platform-001', // Using S3 organisation ID
          uploadedById: userId,
          order: nextOrder, // Auto-assign order
          url: materialUploadResult.url, // S3 URL
          size: materialSize,
          fileType: validationResult.fileType,
          originalName: materialFile.originalname,
          status: 'published',
          downloads: 0
        },
        include: {
          topic: {
            select: {
              id: true,
              title: true,
              subject: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      this.logger.log(colors.green(`🎉 Material "${uploadDto.title}" uploaded successfully!`));
      try {
        this.logger.log(colors.blue(`🧠 Starting AI processing for material: ${material.id}`));
        this.documentProcessingService.processDocument(material.id);
      } catch (e) {
        this.logger.error(colors.red(`❌ Failed to start AI processing for material ${material.id}: ${e.message}`));
      }
      // Kick off background processing for AI chat (chunking + embeddings)
      try {
        this.logger.log(colors.blue(`🧠 Starting AI processing for material: ${material.id}`));
        this.documentProcessingService.processDocument(material.id);
      } catch (e) {
        this.logger.error(colors.red(`❌ Failed to start AI processing for material ${material.id}: ${e.message}`));
      }
      this.logger.log(colors.blue(`📊 Material Details:`));
      this.logger.log(colors.blue(`   - Size: ${materialSize}`));
      this.logger.log(colors.blue(`   - Type: ${validationResult.fileType}`));
      this.logger.log(colors.blue(`   - URL: ${material.url}`));

      // Return the created material using ResponseHelper
      const materialResponse = {
        id: material.id,
        title: material.title,
        description: material.description || undefined,
        url: material.url,
        thumbnail: undefined, // Materials don't have thumbnails by default
        size: material.size || '0 Bytes',
        fileType: material.fileType || 'unknown',
        originalName: material.originalName || '',
        downloads: material.downloads || 0,
        status: material.status || 'published',
        order: material.order || 1,
        subject_id: uploadDto.subject_id,
        topic_id: uploadDto.topic_id,
        uploaded_by: userId,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt
      };

      return ResponseHelper.created(
        'Material uploaded successfully',
        materialResponse
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error uploading material: ${error.message}`));
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new Error(`Failed to upload material: ${error.message}`);
    }
  }

  /**
   * Start material upload with progress (returns sessionId immediately)
   */
  async startMaterialUploadSession(
    uploadDto: any,
    materialFile: Express.Multer.File,
    user: any
  ) {
    if (!materialFile) {
      throw new BadRequestException('Material file is required');
    }

    const sessionId = this.uploadProgressService.createUploadSession(user.sub, user.school_id, materialFile.size);

    this.uploadMaterialWithProgress(uploadDto, materialFile, user, sessionId)
      .catch(err => this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, err.message));

    return {
      success: true,
      message: 'Upload started',
      data: { sessionId },
      statusCode: 202
    };
  }

  /**
   * Upload material with progress updates and DB save
   */
  async uploadMaterialWithProgress(
    uploadDto: any,
    materialFile: Express.Multer.File,
    user: any,
    sessionId: string
  ) {
    this.logger.log(colors.cyan(`📚 Starting material upload with progress: "${uploadDto.title}"`));
    try {
      // Validate file type/size using existing helper
      const validationResult = FileValidationHelper.validateMaterialFile(materialFile);
      if (!validationResult.isValid) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, validationResult.error);
        throw new BadRequestException(validationResult.error);
      }

      // Fetch user
      const dbUser = await this.prisma.user.findUnique({ where: { id: user.sub }, select: { id: true, school_id: true } });
      if (!dbUser) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'User not found');
        throw new NotFoundException('User not found');
      }
      const schoolId = dbUser.school_id;
      const userId = dbUser.id;

      // Validate subject & topic
      const subject = await this.prisma.subject.findFirst({ where: { id: uploadDto.subject_id, schoolId } });
      if (!subject) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Subject not found');
        throw new NotFoundException('Subject not found or does not belong to this school');
      }
      const topic = await this.prisma.topic.findFirst({ where: { id: uploadDto.topic_id, subject_id: uploadDto.subject_id, school_id: schoolId, is_active: true } });
      if (!topic) {
        this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, 'Topic not found');
        throw new NotFoundException('Topic not found or does not belong to this subject');
      }

      // Smooth progress for single file
      const totalBytes = materialFile.size;
      let lastPercent = -1;
      let lastKnownLoaded = 0;
      let emittedLoaded = 0;
      const onePercent = Math.max(1, Math.floor(totalBytes / 100));
      const tickMs = 250;
      this.uploadProgressService.updateProgress(sessionId, 'uploading', 0);
      const smoother = setInterval(() => {
        if (emittedLoaded < lastKnownLoaded) {
          const delta = Math.max(onePercent, Math.floor((lastKnownLoaded - emittedLoaded) / 3));
          emittedLoaded = Math.min(emittedLoaded + delta, lastKnownLoaded);
          const percent = Math.floor((emittedLoaded / totalBytes) * 100);
          if (percent > lastPercent) {
            lastPercent = percent;
            this.uploadProgressService.updateProgress(sessionId, 'uploading', emittedLoaded);
          }
        }
      }, tickMs);

      // Upload to S3 with progress callback
      const materialUploadResult = await this.s3Service.uploadFile(
        materialFile,
        `materials/schools/${schoolId}/subjects/${uploadDto.subject_id}/topics/${uploadDto.topic_id}`,
        `${uploadDto.title.replace(/\s+/g, '_')}_${Date.now()}.${validationResult.fileType}`,
        (loaded) => {
          lastKnownLoaded = Math.min(loaded, totalBytes);
        }
      );

      // Processing/saving
      this.uploadProgressService.updateProgress(sessionId, 'processing', lastKnownLoaded);

      // Next order
      const lastMaterial = await this.prisma.pDFMaterial.findFirst({
        where: { topic_id: uploadDto.topic_id, schoolId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });
      const nextOrder = (lastMaterial?.order || 0) + 1;

      this.uploadProgressService.updateProgress(sessionId, 'saving', lastKnownLoaded);

      const material = await this.prisma.pDFMaterial.create({
        data: {
          title: uploadDto.title.toLowerCase(),
          description: uploadDto.description?.toLowerCase(),
          topic_id: uploadDto.topic_id,
          schoolId,
          platformId: 's3-platform-001',
          uploadedById: userId,
          order: nextOrder,
          url: materialUploadResult.url,
          size: FileValidationHelper.formatFileSize(materialFile.size),
          fileType: validationResult.fileType,
          originalName: materialFile.originalname,
          status: 'published',
          downloads: 0
        },
        include: {
          topic: { select: { id: true, title: true, subject: { select: { id: true, name: true } } } }
        }
      });

      clearInterval(smoother);
      // finalize
      this.uploadProgressService.updateProgress(sessionId, 'completed', totalBytes, undefined, undefined, material.id);

      return ResponseHelper.created(
        'Material uploaded successfully',
        {
          id: material.id,
          title: material.title,
          description: material.description || undefined,
          url: material.url,
          thumbnail: undefined,
          size: material.size || '0 Bytes',
          fileType: material.fileType || 'unknown',
          originalName: material.originalName || '',
          downloads: material.downloads || 0,
          status: material.status || 'published',
          order: material.order || 1,
          subject_id: uploadDto.subject_id,
          topic_id: uploadDto.topic_id,
          uploaded_by: userId,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt
        }
      );
    } catch (error) {
      this.uploadProgressService.updateProgress(sessionId, 'error', undefined, undefined, error.message);
      throw error;
    }
  }

  /**
   * Process a material for AI chat (chunking + embeddings) if not already processed
   */
  async processMaterialForChat(id: string, user?: any) {
    this.logger.log(colors.cyan(`🔄 Requested AI processing for material: ${id}`));
    // Validate material exists
    const material = await this.prisma.pDFMaterial.findUnique({
      where: { id: id },
      select: { id: true }
    });
    if (!material) {
      this.logger.error(colors.red(`❌ Material not found: ${id}`));
      throw new NotFoundException('Material not found');
    }

    // If user provided, check if there is an existing conversation for this user & material
    if (user?.id || user?.sub) {
      const userId = user.id || user.sub;
      // Find the most recent conversation tied to this material and user
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          user_id: userId,
          material_id: id,
        },
        orderBy: { last_activity: 'desc' }
      });

      if (conversation) {
        // Fetch last N messages for quick resume
        const messages = await this.prisma.chatMessage.findMany({
          where: {
            conversation_id: conversation.id,
            user_id: userId,
          },
          orderBy: { createdAt: 'desc' },
          take: 25,
        });

        return ResponseHelper.success('Existing conversation found for this material', {
          materialId: id,
          conversationId: conversation.id,
          title: conversation.title,
          totalMessages: conversation.total_messages,
          lastActivity: conversation.last_activity?.toISOString?.() || conversation.last_activity,
          messages: messages.reverse().map(m => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
          })),
        });
      }
    } else {
      this.logger.error(colors.red(`❌ User not found: ${user?.id || user?.sub}`));
      throw new NotFoundException('User not found');
    }

    // Check processing status via existing AI service
    let status: any | null = null;
    try {
      status = await this.documentProcessingService.getProcessingStatus(id);
    } catch {}

    // If already processed, return success
    if (status && (status.total_chunks > 0 || status.status === 'COMPLETED')) {
      this.logger.log(colors.green(`✅ Document successfully processed for chat: ${id}`));
      return ResponseHelper.success('Document successfully processed for chat', {
        materialId: id,
        status: status.status,
        totalChunks: status.total_chunks,
        processedChunks: status.processed_chunks,
        failedChunks: status.failed_chunks,
      });
    }

    // Not yet processed → ensure processing is running, and inform client it's not ready
    if (!status || status.status !== 'PROCESSING') {
      this.logger.log(colors.blue(`🧠 Starting AI processing for document: ${id}`));
      this.documentProcessingService.processDocument(id);
    } else {
      this.logger.log(colors.yellow(`⏳ Document is currently processing: ${id}`));
    }

    return new ApiResponse(false, 'Document not yet processed for AI chat', {
      materialId: id,
      status: 'PROCESSING'
    });
  }
}
