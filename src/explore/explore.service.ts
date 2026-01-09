import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import { QuerySubjectsDto, QueryVideosDto } from './dto';
import * as colors from 'colors';

@Injectable()
export class ExploreService {
  private readonly logger = new Logger(ExploreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getExploreData() {
    this.logger.log(colors.cyan('📚 Fetching explore page data...'));

    try {
      // Fetch all library classes with subject count
      this.logger.log(colors.yellow('Fetching library classes...'));
      const classes = await this.prisma.libraryClass.findMany({
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          order: true,
          _count: {
            select: { subjects: true }
          }
        }
      });

      // Fetch all library subjects with thumbnails and platform info
      this.logger.log(colors.yellow('Fetching library subjects...'));
      const subjects = await this.prisma.librarySubject.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          color: true,
          thumbnailUrl: true,
          thumbnailKey: true,
          createdAt: true,
          platform: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              status: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              order: true
            }
          },
          _count: {
            select: {
              videos: true,
              topics: true
            }
          }
        }
      });

      // Fetch the 20 most recent published videos with topic, subject, and platform info
      this.logger.log(colors.yellow('Fetching recent videos...'));
      const recentVideos = await this.prisma.libraryVideoLesson.findMany({
        where: {
          status: 'published'
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
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
          createdAt: true,
          updatedAt: true,
          topic: {
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              chapter: {
                select: {
                  id: true,
                  title: true,
                  order: true
                }
              }
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              thumbnailUrl: true,
              thumbnailKey: true
            }
          },
          platform: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              status: true
            }
          }
        }
      });

      // Format classes data
      const formattedClasses = classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        order: cls.order,
        subjectsCount: cls._count.subjects
      }));

      // Format subjects data
      const formattedSubjects = subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        color: subject.color,
        thumbnailUrl: subject.thumbnailUrl,
        thumbnailKey: subject.thumbnailKey,
        videosCount: subject._count.videos,
        topicsCount: subject._count.topics,
        createdAt: subject.createdAt,
        platform: subject.platform,
        class: subject.class
      }));

      const data = {
        classes: formattedClasses,
        subjects: formattedSubjects,
        recentVideos: recentVideos,
        statistics: {
          totalClasses: formattedClasses.length,
          totalSubjects: formattedSubjects.length,
          totalVideos: recentVideos.length
        }
      };

      this.logger.log(colors.green(`✅ Explore data retrieved: ${formattedClasses.length} classes, ${formattedSubjects.length} subjects, ${recentVideos.length} videos`));
      return ResponseHelper.success('Explore data retrieved successfully', data);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching explore data: ${error.message}`));
      throw error;
    }
  }

  async getSubjects(queryDto: QuerySubjectsDto) {
    const { classId, search, page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    this.logger.log(colors.cyan(`📚 Fetching subjects - Page: ${page}, Limit: ${limit}, ClassId: ${classId || 'all'}, Search: ${search || 'none'}`));

    try {
      // Build where clause
      const where: any = {};

      if (classId) {
        where.classId = classId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get total count
      const totalItems = await this.prisma.librarySubject.count({ where });

      // Get paginated subjects
      const subjects = await this.prisma.librarySubject.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          color: true,
          thumbnailUrl: true,
          thumbnailKey: true,
          createdAt: true,
          platform: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              status: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              order: true
            }
          },
          _count: {
            select: {
              videos: true,
              topics: true
            }
          }
        }
      });

      const formattedSubjects = subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        color: subject.color,
        thumbnailUrl: subject.thumbnailUrl,
        thumbnailKey: subject.thumbnailKey,
        videosCount: subject._count.videos,
        topicsCount: subject._count.topics,
        createdAt: subject.createdAt,
        platform: subject.platform,
        class: subject.class
      }));

      const totalPages = Math.ceil(totalItems / limit);

      const data = {
          meta: {
            totalItems,
            totalPages,
            currentPage: page,
            limit
          },
        items: formattedSubjects,
      };

      this.logger.log(colors.green(`✅ Subjects retrieved: ${formattedSubjects.length} items (Page ${page}/${totalPages})`));
      return ResponseHelper.success('Subjects retrieved successfully', data);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching subjects: ${error.message}`));
      throw error;
    }
  }

  async getVideos(queryDto: QueryVideosDto) {
    const { classId, subjectId, topicId, search, page = 1, limit = 20 } = queryDto;
    const skip = (page - 1) * limit;

    this.logger.log(colors.cyan(`🎥 Fetching videos - Page: ${page}, SubjectId: ${subjectId || 'all'}, TopicId: ${topicId || 'all'}`));

    try {
      // Build where clause
      const where: any = {
        status: 'published'
      };

      if (topicId) {
        where.topicId = topicId;
      } else if (subjectId) {
        where.subjectId = subjectId;
      } else if (classId) {
        where.subject = {
          classId: classId
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get total count
      const totalItems = await this.prisma.libraryVideoLesson.count({ where });

      // Get paginated videos
      const videos = await this.prisma.libraryVideoLesson.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          createdAt: true,
          updatedAt: true,
          topic: {
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              chapter: {
                select: {
                  id: true,
                  title: true,
                  order: true
                }
              }
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              thumbnailUrl: true,
              thumbnailKey: true
            }
          },
          platform: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              status: true
            }
          }
        }
      });

      const totalPages = Math.ceil(totalItems / limit);

      const data = {
        items: videos,
        meta: {
          totalItems,
          totalPages,
          currentPage: page,
          limit
        }
      };

      this.logger.log(colors.green(`✅ Videos retrieved: ${videos.length} items (Page ${page}/${totalPages})`));
      return ResponseHelper.success('Videos retrieved successfully', data);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching videos: ${error.message}`));
      throw error;
    }
  }

  async getTopicsBySubject(subjectId: string) {
    this.logger.log(colors.cyan(`📖 Fetching topics for subject: ${subjectId}`));

    try {
      // Check if subject exists
      const subject = await this.prisma.librarySubject.findUnique({
        where: { id: subjectId },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          color: true,
          thumbnailUrl: true,
          thumbnailKey: true,
          platform: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              status: true
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              order: true
            }
          }
        }
      });

      if (!subject) {
        throw new NotFoundException(`Subject with ID ${subjectId} not found`);
      }

      // Get all topics with their chapters and video analytics
      const topics = await this.prisma.libraryTopic.findMany({
        where: {
          subjectId,
          is_active: true
        },
        orderBy: [
          { chapter: { order: 'asc' } },
          { order: 'asc' }
        ],
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          is_active: true,
          createdAt: true,
          chapter: {
            select: {
              id: true,
              title: true,
              description: true,
              order: true
            }
          },
          videos: {
            where: {
              status: 'published'
            },
            take: 3,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              title: true,
              thumbnailUrl: true,
              durationSeconds: true,
              views: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              videos: {
                where: { status: 'published' }
              }
            }
          }
        }
      });

      // Calculate video analytics for each topic
      const topicsWithAnalytics = await Promise.all(
        topics.map(async (topic) => {
          const videoStats = await this.prisma.libraryVideoLesson.aggregate({
            where: {
              topicId: topic.id,
              status: 'published'
            },
            _sum: {
              views: true,
              durationSeconds: true
            }
          });

          return {
            id: topic.id,
            title: topic.title,
            description: topic.description,
            order: topic.order,
            is_active: topic.is_active,
            createdAt: topic.createdAt,
            chapter: topic.chapter,
            analytics: {
              videosCount: topic._count.videos,
              totalViews: videoStats._sum.views || 0,
              totalDuration: videoStats._sum.durationSeconds || 0
            },
            recentVideos: topic.videos
          };
        })
      );

      const data = {
        subject,
        topics: topicsWithAnalytics
      };

      this.logger.log(colors.green(`✅ Topics retrieved: ${topicsWithAnalytics.length} topics for subject "${subject.name}"`));
      return ResponseHelper.success('Topics retrieved successfully', data);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching topics: ${error.message}`));
      throw error;
    }
  }

  async playVideo(user: any, videoId: string) {
    this.logger.log(colors.cyan(`🎥 User ${user.sub} requesting video playback: ${videoId}`));

    try {
      // Fetch video details
      const video = await this.prisma.libraryVideoLesson.findUnique({
        where: { 
          id: videoId,
          status: 'published'
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
          createdAt: true,
          updatedAt: true,
          topic: {
            select: {
              id: true,
              title: true,
              description: true,
              chapter: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              thumbnailUrl: true
            }
          },
          platform: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true
            }
          }
        }
      });

      if (!video) {
        this.logger.error(colors.red(`❌ Video not found or not published: ${videoId}`));
        throw new NotFoundException('Video not found or not available');
      }

      // Check if user has already viewed this video (unique view tracking like YouTube)
      const existingView = await this.prisma.libraryVideoView.findUnique({
        where: {
          videoId_userId: {
            videoId: videoId,
            userId: user.sub, // JWT payload uses 'sub' for user ID
          },
        },
      });

      let updatedViews = video.views;

      // Only increment view count if this is a new unique view
      if (!existingView) {
        await this.prisma.$transaction([
          // Increment view count
          this.prisma.libraryVideoLesson.update({
            where: { id: videoId },
            data: {
              views: { increment: 1 },
            },
          }),
          // Record the view
          this.prisma.libraryVideoView.create({
            data: {
              videoId: videoId,
              userId: user.sub,
            },
          }),
        ]);

        updatedViews = video.views + 1;
        this.logger.log(colors.green(`✅ New unique view recorded: "${video.title}" by user ${user.sub} (Total: ${updatedViews})`));
      } else {
        this.logger.log(colors.yellow(`⚠️ Repeat view (not counted): "${video.title}" by user ${user.sub}`));
      }

      const data = {
        ...video,
        views: updatedViews,
        hasViewedBefore: !!existingView,
        viewedAt: existingView?.viewedAt || new Date(),
      };

      this.logger.log(colors.green(`✅ Video playback granted: "${video.title}" (${updatedViews} unique views)`));
      return ResponseHelper.success('Video retrieved for playback', data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error retrieving video for playback: ${error.message}`));
      throw error;
    }
  }
}

