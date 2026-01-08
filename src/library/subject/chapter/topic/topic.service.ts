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

  async getTopicMaterials(user: any, topicId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY TOPIC] Fetching materials for topic: ${topicId} for library user: ${user.email}`));

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
      const topic = await this.prisma.libraryTopic.findFirst({
        where: {
          id: topicId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          is_active: true,
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

      if (!topic) {
        this.logger.error(colors.red(`Topic not found or does not belong to user's platform: ${topicId}`));
        throw new NotFoundException('Topic not found or does not belong to your platform');
      }

      // Fetch all materials in parallel
      const [videos, materials, links, assignments, comments, cbts] = await Promise.all([
        // Videos
        this.prisma.libraryVideoLesson.findMany({
          where: {
            topicId: topicId,
            platformId: libraryUser.platformId,
            status: 'published' as any,
          },
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
            thumbnailUrl: true,
            durationSeconds: true,
            sizeBytes: true,
            views: true,
            order: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            uploadedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        }) as any,

        // Materials
        this.prisma.libraryMaterial.findMany({
          where: {
            topicId: topicId,
            platformId: libraryUser.platformId,
            status: 'published' as any,
          },
          select: {
            id: true,
            title: true,
            description: true,
            materialType: true,
            url: true,
            sizeBytes: true,
            pageCount: true,
            order: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            uploadedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        }) as any,

        // Links
        this.prisma.libraryLink.findMany({
          where: {
            topicId: topicId,
            platformId: libraryUser.platformId,
            status: 'published' as any,
          },
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            linkType: true,
            domain: true,
            thumbnailUrl: true,
            order: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            uploadedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        }) as any,

        // Assignments
        this.prisma.libraryAssignment.findMany({
          where: {
            topicId: topicId,
            platformId: libraryUser.platformId,
            status: 'PUBLISHED' as any,
          },
          select: {
            id: true,
            title: true,
            description: true,
            assignmentType: true,
            instructions: true,
            attachmentUrl: true,
            dueDate: true,
            maxScore: true,
            allowLateSubmission: true,
            latePenalty: true,
            order: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            uploadedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        }) as any,

        // Comments (only non-deleted)
        this.prisma.libraryComment.findMany({
          where: {
            topicId: topicId,
            platformId: libraryUser.platformId,
            isDeleted: false,
          },
          select: {
            id: true,
            content: true,
            isEdited: true,
            editedAt: true,
            createdAt: true,
            updatedAt: true,
            commentedBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
            parentCommentId: true,
            replies: {
              where: {
                isDeleted: false,
              },
              select: {
                id: true,
                content: true,
                isEdited: true,
                editedAt: true,
                createdAt: true,
                updatedAt: true,
                commentedBy: {
                  select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    email: true,
                    first_name: true,
                    last_name: true,
                  },
                },
                parentCommentId: true,
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }) as any,

        // CBT Assessments (only CBT type, with questions, options, and correct answers)
        this.prisma.libraryAssessment.findMany({
          where: {
            topicId: topicId,
            platformId: libraryUser.platformId,
            assessmentType: 'CBT',
          },
          select: {
            id: true,
            title: true,
            description: true,
            instructions: true,
            assessmentType: true,
            gradingType: true,
            status: true,
            duration: true,
            timeLimit: true,
            startDate: true,
            endDate: true,
            maxAttempts: true,
            allowReview: true,
            autoSubmit: true,
            totalPoints: true,
            passingScore: true,
            showCorrectAnswers: true,
            showFeedback: true,
            studentCanViewGrading: true,
            shuffleQuestions: true,
            shuffleOptions: true,
            isPublished: true,
            publishedAt: true,
            isResultReleased: true,
            resultReleasedAt: true,
            tags: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            createdBy: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
            questions: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                order: true,
                points: true,
                isRequired: true,
                timeLimit: true,
                imageUrl: true,
                audioUrl: true,
                videoUrl: true,
                allowMultipleAttempts: true,
                showHint: true,
                hintText: true,
                minLength: true,
                maxLength: true,
                minValue: true,
                maxValue: true,
                explanation: true,
                difficultyLevel: true,
                createdAt: true,
                updatedAt: true,
                options: {
                  select: {
                    id: true,
                    optionText: true,
                    order: true,
                    isCorrect: true,
                    imageUrl: true,
                    audioUrl: true,
                  },
                  orderBy: {
                    order: 'asc',
                  },
                },
                correctAnswers: {
                  select: {
                    id: true,
                    answerText: true,
                    answerNumber: true,
                    answerDate: true,
                    optionIds: true,
                    answerJson: true,
                  },
                },
              },
              orderBy: {
                order: 'asc',
              },
            },
            _count: {
              select: {
                questions: true,
                attempts: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        }) as any,
      ]);

      // Build detailed statistics/analysis
      const totalVideoViews = videos.reduce((sum, video) => sum + ((video.views as number) || 0), 0);
      const totalVideoDuration = videos.reduce((sum, video) => sum + ((video.durationSeconds as number) || 0), 0);
      const totalVideoSize = videos.reduce((sum, video) => sum + ((video.sizeBytes as number) || 0), 0);
      const totalMaterialSize = materials.reduce((sum, material) => sum + ((material.sizeBytes as number) || 0), 0);
      
      // Material type breakdown
      const materialTypeBreakdown = materials.reduce((acc, material) => {
        const type = material.materialType || 'OTHER';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Assignment type breakdown
      const assignmentTypeBreakdown = assignments.reduce((acc, assignment) => {
        const type = assignment.assignmentType || 'OTHER';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Link type breakdown
      const linkTypeBreakdown = links.reduce((acc, link) => {
        const type = link.linkType || 'external_resource';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Comments breakdown (top-level vs replies)
      const topLevelComments = comments.filter(c => !c.parentCommentId);
      const totalReplies = comments.reduce((sum, comment) => sum + (comment.replies?.length || 0), 0);

      const statistics = {
        // Resource counts
        totalVideos: videos.length,
        totalMaterials: materials.length,
        totalLinks: links.length,
        totalAssignments: assignments.length,
        totalComments: comments.length,
        totalCbts: cbts.length,
        totalContent: videos.length + materials.length + links.length + assignments.length + cbts.length,
        
        // Video analysis
        totalVideoViews,
        totalVideoDuration, // in seconds
        totalVideoDurationFormatted: this.formatDuration(totalVideoDuration), // formatted as HH:MM:SS
        totalVideoSize, // in bytes
        totalVideoSizeFormatted: this.formatBytes(totalVideoSize), // formatted as MB/GB
        
        // Material analysis
        totalMaterialSize, // in bytes
        totalMaterialSizeFormatted: this.formatBytes(totalMaterialSize), // formatted as MB/GB
        materialTypeBreakdown, // { PDF: 5, DOC: 2, PPT: 1 }
        
        // Assignment analysis
        assignmentTypeBreakdown, // { HOMEWORK: 3, PROJECT: 1 }
        assignmentsWithDueDate: assignments.filter(a => a.dueDate).length,
        
        // Link analysis
        linkTypeBreakdown, // { tutorial: 2, article: 1 }
        
        // Comment analysis
        topLevelComments: topLevelComments.length,
        totalReplies,
        editedComments: comments.filter(c => c.isEdited).length,
        
        // CBT analysis
        totalCbtQuestions: cbts.reduce((sum, cbt) => sum + (cbt._count?.questions || 0), 0),
        totalCbtAttempts: cbts.reduce((sum, cbt) => sum + (cbt._count?.attempts || 0), 0),
        publishedCbts: cbts.filter(cbt => cbt.isPublished).length,
        
        // Total size
        totalContentSize: totalVideoSize + totalMaterialSize,
        totalContentSizeFormatted: this.formatBytes(totalVideoSize + totalMaterialSize),
      };

      const responseData = {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          order: topic.order,
          is_active: topic.is_active,
          chapter: topic.chapter,
          subject: topic.subject,
        },
        statistics,
        content: {
          videos,
          materials,
          links,
          assignments,
          comments,
          cbts,
        },
      };

      // Enhanced logging with statistics
      this.logger.log(colors.green(`Successfully retrieved materials for topic: ${topic.title}`));
      this.logger.log(colors.cyan(`📊 Statistics Summary:`));
      this.logger.log(colors.cyan(`   - Videos: ${statistics.totalVideos} (${statistics.totalVideoViews} total views, ${statistics.totalVideoDurationFormatted} duration)`));
      this.logger.log(colors.cyan(`   - Materials: ${statistics.totalMaterials} (${statistics.totalMaterialSizeFormatted})`));
      this.logger.log(colors.cyan(`   - Links: ${statistics.totalLinks}`));
      this.logger.log(colors.cyan(`   - Assignments: ${statistics.totalAssignments}`));
      this.logger.log(colors.cyan(`   - Comments: ${statistics.totalComments} (${statistics.topLevelComments} top-level, ${statistics.totalReplies} replies)`));
      this.logger.log(colors.cyan(`   - CBT Assessments: ${statistics.totalCbts} (${statistics.totalCbtQuestions} questions, ${statistics.totalCbtAttempts} attempts)`));
      this.logger.log(colors.cyan(`   - Total Content: ${statistics.totalContent} items (${statistics.totalContentSizeFormatted} total size)`));
      
      if (Object.keys(statistics.materialTypeBreakdown).length > 0) {
        this.logger.log(colors.cyan(`   - Material Types: ${JSON.stringify(statistics.materialTypeBreakdown)}`));
      }
      
      if (Object.keys(statistics.assignmentTypeBreakdown).length > 0) {
        this.logger.log(colors.cyan(`   - Assignment Types: ${JSON.stringify(statistics.assignmentTypeBreakdown)}`));
      }
      
      if (Object.keys(statistics.linkTypeBreakdown).length > 0) {
        this.logger.log(colors.cyan(`   - Link Types: ${JSON.stringify(statistics.linkTypeBreakdown)}`));
      }
      return new ApiResponse(true, 'Topic materials retrieved successfully', responseData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching topic materials: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to retrieve topic materials');
    }
  }

  /**
   * Helper: Format duration in seconds to HH:MM:SS
   */
  private formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Helper: Format bytes to human-readable format (MB, GB)
   */
  private formatBytes(bytes: number): string {
    if (!bytes || bytes < 0) return '0 B';
    
    const kb = 1024;
    const mb = kb * 1024;
    const gb = mb * 1024;
    
    if (bytes >= gb) {
      return `${(bytes / gb).toFixed(2)} GB`;
    } else if (bytes >= mb) {
      return `${(bytes / mb).toFixed(2)} MB`;
    } else if (bytes >= kb) {
      return `${(bytes / kb).toFixed(2)} KB`;
    } else {
      return `${bytes} B`;
    }
  }
}

