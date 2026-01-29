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
              order: true
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
              order: true
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

  async getTopicsForSubject(subjectId: string, user?: any) {
    const userId = user?.sub || null;
    this.logger.log(
      colors.cyan(
        `📚 Fetching comprehensive topic resources for subject: ${subjectId}${userId ? ` (User: ${userId})` : ' (Public)'}`,
      ),
    );

    try {
      // Fetch the subject with only required fields
      const subject = await this.prisma.librarySubject.findUnique({
        where: { id: subjectId },
        select: {
          name: true,
          code: true,
          description: true,
          color: true
        }
      });

      if (!subject) {
        this.logger.error(colors.red(`❌ Subject not found: ${subjectId}`));
        throw new NotFoundException(`Subject with ID ${subjectId} not found`);
      }

      this.logger.log(colors.yellow(`📖 Subject: ${subject.name} (${subject.code})`));

      // Check if there's a subject-level assessment (assessment with subjectId but no topicId)
      const subjectLevelAssessment = await this.prisma.libraryAssessment.findFirst({
        where: {
          subjectId: subjectId,
          // topicId: null,
          status: 'ACTIVE',
          isPublished: true,
        },
        // select: {
        //   id: true,
        // },
        orderBy: {
          createdAt: 'desc', // Get the most recent one if multiple exist
        },
      });

      const libraryAssessmentInfo = subjectLevelAssessment
        ? {
            has_library_assessment: true,
            assessment_id: subjectLevelAssessment.id,
            title: subjectLevelAssessment.title,
            description: subjectLevelAssessment.description,
            duration: subjectLevelAssessment.duration,
            passingScore: subjectLevelAssessment.passingScore,
          }
        : {
            has_library_assessment: false,
            assessment_id: null,
          };

      this.logger.log(
        colors.yellow(
          `📝 Subject-level assessment check: ${libraryAssessmentInfo.has_library_assessment ? `Found (ID: ${libraryAssessmentInfo.assessment_id})` : 'None'}`,
        ),
      );

      // Get all topics for this subject directly (no chapters)
      const topics = await this.prisma.libraryTopic.findMany({
        where: {
          subjectId: subjectId,
          is_active: true
        },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          is_active: true
        },
        orderBy: {
          order: 'asc'
        }
      });

      this.logger.log(colors.yellow(`📑 Found ${topics.length} topics`));

      // For each topic, get all resources (videos, materials, assessments)
      const topicsWithResources = await Promise.all(
        topics.map(async (topic) => {
          this.logger.log(colors.cyan(`  📂 Processing topic: ${topic.title}`));
              const [videos, materials, assessments] = await Promise.all([
                // Get published video lessons
                this.prisma.libraryVideoLesson.findMany({
                  where: {
                    topicId: topic.id,
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
                    views: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }),
                // Get all materials (PDF, DOC, etc.)
                this.prisma.libraryMaterial.findMany({
                  where: {
                    topicId: topic.id,
                    status: 'published'
                  },
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    materialType: true,
                    sizeBytes: true,
                    pageCount: true
                  },
                  orderBy: {
                    order: 'asc'
                  }
                }),
                // Get ONLY published assessments
                this.prisma.libraryAssessment.findMany({
                  where: {
                    topicId: topic.id,
                    status: 'ACTIVE' // Only published assessments
                  },
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    duration: true,
                    passingScore: true
                  },
                  orderBy: {
                    createdAt: 'desc'
                  }
                })
              ]);

              // Get question counts for assessments
              const assessmentsWithCounts = await Promise.all(
                assessments.map(async (assessment) => {
                  const questionCount = await this.prisma.libraryAssessmentQuestion.count({
                    where: { assessmentId: assessment.id }
                  });
                  return {
                    id: assessment.id,
                    title: assessment.title,
                    description: assessment.description,
                    duration: assessment.duration,
                    passingScore: assessment.passingScore,
                    questionsCount: questionCount
                  };
                })
              );

              // Get user submissions for assessments in this topic (if user is authenticated)
              let submissions: any[] = [];
              if (userId && assessmentsWithCounts.length > 0) {
                const assessmentIds = assessmentsWithCounts.map(a => a.id);
                this.logger.log(colors.yellow(`🔍 Searching submissions for userId: ${userId}, assessmentIds: ${assessmentIds.join(', ')}`));
                
                const userAttempts = await this.prisma.libraryAssessmentAttempt.findMany({
                  where: {
                    userId: userId,
                    assessmentId: { in: assessmentIds }
                  },
                  select: {
                    id: true,
                    assessmentId: true,
                    percentage: true,
                    passed: true
                  },
                  orderBy: {
                    submittedAt: 'desc'
                  }
                });

                this.logger.log(colors.yellow(`📦 Found ${userAttempts.length} attempts for topic: ${topic.title}`));

                submissions = userAttempts.map(attempt => ({
                  id: attempt.id,
                  assessmentId: attempt.assessmentId,
                  percentage: Math.round(attempt.percentage),
                  passed: attempt.passed
                }));
              } else {
                this.logger.log(colors.gray(`⚠️ No submissions check: userId=${userId}, assessmentsCount=${assessmentsWithCounts.length}`));
              }

              // format the response and return formatted response 
              

              return {
                id: topic.id,
                title: topic.title,
                description: topic.description,
                order: topic.order,
                is_active: topic.is_active,
                videos: videos.map(video => ({
                  id: video.id,
                  title: video.title,
                  description: video.description,
                  videoUrl: video.videoUrl,
                  thumbnailUrl: video.thumbnailUrl,
                  durationSeconds: video.durationSeconds,
                  sizeBytes: video.sizeBytes,
                  views: video.views
                })),
                materials: materials.map(material => ({
                  id: material.id,
                  title: material.title,
                  description: material.description,
                  materialType: material.materialType,
                  sizeBytes: material.sizeBytes,
                  pageCount: material.pageCount
                })),
                assessments: assessmentsWithCounts,
                submissions: submissions,
                statistics: {
                  videosCount: videos.length,
                  materialsCount: materials.length,
                  assessmentsCount: assessments.length,
                  submissionsCount: submissions.length
                }
              };
            })
          );

      // Calculate subject-level statistics
      const subjectStats = {
        topicsCount: topics.length,
        videosCount: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.videosCount, 0),
        materialsCount: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.materialsCount, 0)
      };

      const data = {
        subject: {
          name: subject.name,
          code: subject.code,
          color: subject.color,
          description: subject.description
        },
        library_assessment: libraryAssessmentInfo,
        topics: topicsWithResources,
        statistics: subjectStats
      };

      // Calculate total submissions across all topics
      const totalSubmissions = topicsWithResources.reduce(
        (sum, topic) => sum + topic.submissions.length,
        0
      );
      const submissionsSummary = userId ? `, ${totalSubmissions} submissions` : '';

      this.logger.log(colors.green(`✅ Complete resources retrieved for "${subject.name}"`));
      this.logger.log(colors.cyan(`📊 Summary: ${subjectStats.topicsCount} topics, ${subjectStats.videosCount} videos, ${subjectStats.materialsCount} materials${submissionsSummary}`));

      return ResponseHelper.success('Subject resources retrieved successfully', data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error fetching subject resources: ${error.message}`));
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
      const existingView = await this.prisma.libraryVideoView.findFirst({
        where: {
          videoId: videoId,
          userId: user.sub, // JWT payload uses 'sub' for user ID
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

  /**
   * Format date to "Wed, Jan 15 2025" format
   */
  private formatDate(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const d = new Date(date);
    const dayName = days[d.getDay()];
    const monthName = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    
    return `${dayName}, ${monthName} ${day} ${year}`;
  }
}

