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

  async getTopicsBySubject(subjectId: string, user?: any) {
    const userId = user?.sub || null;
    this.logger.log(
      colors.cyan(
        `📚 Fetching comprehensive topic resources for subject: ${subjectId}${userId ? ` (User: ${userId})` : ' (Public)'}`,
      ),
    );

    try {
      // Fetch the subject with its platform and class
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
          createdAt: true,
          updatedAt: true,
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
        this.logger.error(colors.red(`❌ Subject not found: ${subjectId}`));
        throw new NotFoundException(`Subject with ID ${subjectId} not found`);
      }

      this.logger.log(colors.yellow(`📖 Subject: ${subject.name} (${subject.code})`));

      // Get all chapters for this subject
      const chapters = await this.prisma.libraryChapter.findMany({
        where: {
          subjectId: subjectId,
          is_active: true
        },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          is_active: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          order: 'asc'
        }
      });

      this.logger.log(colors.yellow(`📑 Found ${chapters.length} chapters`));

      // For each chapter, get topics and their complete resources
      const chaptersWithResources = await Promise.all(
        chapters.map(async (chapter) => {
          this.logger.log(colors.cyan(`  📂 Processing chapter: ${chapter.title}`));

          // Get all topics for this chapter
          const topics = await this.prisma.libraryTopic.findMany({
            where: {
              chapterId: chapter.id,
              subjectId: subjectId,
              is_active: true
            },
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              is_active: true,
              createdAt: true,
              updatedAt: true
            },
            orderBy: {
              order: 'asc'
            }
          });

          // For each topic, get all resources (videos, materials, assessments)
          const topicsWithResources = await Promise.all(
            topics.map(async (topic) => {
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
                        last_name: true
                      }
                    }
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
                    url: true,
                    s3Key: true,
                    materialType: true,
                    sizeBytes: true,
                    pageCount: true,
                    status: true,
                    order: true,
                    createdAt: true,
                    updatedAt: true,
                    uploadedBy: {
                      select: {
                        id: true,
                        email: true,
                        first_name: true,
                        last_name: true
                      }
                    }
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
                    passingScore: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true
                  },
                  orderBy: {
                    createdAt: 'desc'
                  }
                })
              ]);

              // Calculate statistics
              const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
              const totalDuration = videos.reduce((sum, video) => sum + (video.durationSeconds || 0), 0);
              const totalVideoSize = videos.reduce((sum, video) => sum + (video.sizeBytes || 0), 0);
              const totalMaterialSize = materials.reduce((sum, material) => sum + (material.sizeBytes || 0), 0);

              // Get question counts for assessments
              const assessmentsWithCounts = await Promise.all(
                assessments.map(async (assessment) => {
                  const questionCount = await this.prisma.libraryAssessmentQuestion.count({
                    where: { assessmentId: assessment.id }
                  });
                  return {
                    ...assessment,
                    questionsCount: questionCount
                  };
                })
              );

              const totalQuestions = assessmentsWithCounts.reduce((sum, assessment) => sum + assessment.questionsCount, 0);

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
                    attemptNumber: true,
                    status: true,
                    submittedAt: true,
                    totalScore: true,
                    maxScore: true,
                    percentage: true,
                    passed: true,
                    timeSpent: true,
                    assessment: {
                      select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                        passingScore: true,
                        _count: {
                          select: {
                            questions: true
                          }
                        }
                      }
                    }
                  },
                  orderBy: {
                    submittedAt: 'desc'
                  }
                });

                this.logger.log(colors.yellow(`📦 Found ${userAttempts.length} attempts for topic: ${topic.title}`));

                submissions = userAttempts.map(attempt => ({
                  id: attempt.id,
                  assessmentId: attempt.assessmentId,
                  assessmentTitle: attempt.assessment.title,
                  attemptNumber: attempt.attemptNumber,
                  status: attempt.status,
                  dateTaken: attempt.submittedAt ? this.formatDate(attempt.submittedAt) : null,
                  totalQuestions: attempt.assessment._count.questions,
                  maxScore: attempt.maxScore,
                  userScore: attempt.totalScore,
                  percentage: Math.round(attempt.percentage),
                  passed: attempt.passed,
                  timeSpent: attempt.timeSpent,
                  passingScore: attempt.assessment.passingScore
                }));
              } else {
                this.logger.log(colors.gray(`⚠️ No submissions check: userId=${userId}, assessmentsCount=${assessmentsWithCounts.length}`));
              }

              return {
                ...topic,
                videos: videos,
                materials: materials,
                assessments: assessmentsWithCounts,
                submissions: submissions,
                statistics: {
                  videosCount: videos.length,
                  materialsCount: materials.length,
                  assessmentsCount: assessments.length,
                  totalViews: totalViews,
                  totalDuration: totalDuration,
                  totalVideoSize: totalVideoSize,
                  totalMaterialSize: totalMaterialSize,
                  totalSize: totalVideoSize + totalMaterialSize,
                  totalQuestions: totalQuestions
                }
              };
            })
          );

          // Calculate chapter-level statistics
          const chapterStats = {
            topicsCount: topics.length,
            videosCount: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.videosCount, 0),
            materialsCount: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.materialsCount, 0),
            assessmentsCount: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.assessmentsCount, 0),
            totalViews: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.totalViews, 0),
            totalDuration: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.totalDuration, 0),
            totalSize: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.totalSize, 0),
            totalQuestions: topicsWithResources.reduce((sum, topic) => sum + topic.statistics.totalQuestions, 0)
          };

          const submissionsCount = topicsWithResources.reduce((sum, topic) => sum + topic.submissions.length, 0);
          const submissionsLog = userId ? `, ${submissionsCount} submissions` : '';
          this.logger.log(colors.green(`    ✅ ${chapter.title}: ${chapterStats.topicsCount} topics, ${chapterStats.videosCount} videos, ${chapterStats.materialsCount} materials, ${chapterStats.assessmentsCount} assessments${submissionsLog}`));

          return {
            ...chapter,
            topics: topicsWithResources,
            statistics: chapterStats
          };
        })
      );

      // Calculate subject-level statistics
      const subjectStats = {
        chaptersCount: chapters.length,
        topicsCount: chaptersWithResources.reduce((sum, chapter) => sum + chapter.statistics.topicsCount, 0),
        videosCount: chaptersWithResources.reduce((sum, chapter) => sum + chapter.statistics.videosCount, 0),
        materialsCount: chaptersWithResources.reduce((sum, chapter) => sum + chapter.statistics.materialsCount, 0),
        assessmentsCount: chaptersWithResources.reduce((sum, chapter) => sum + chapter.statistics.assessmentsCount, 0),
        totalViews: chaptersWithResources.reduce((sum, chapter) => sum + chapter.statistics.totalViews, 0),
        totalDuration: chaptersWithResources.reduce((sum, chapter) => sum + chapter.statistics.totalDuration, 0),
        totalSize: chaptersWithResources.reduce((sum, chapter) => sum + chapter.statistics.totalSize, 0),
        totalQuestions: chaptersWithResources.reduce((sum, chapter) => sum + chapter.statistics.totalQuestions, 0)
      };

      const data = {
        subject,
        chapters: chaptersWithResources,
        statistics: subjectStats
      };

      // Calculate total submissions across all chapters/topics
      const totalSubmissions = chaptersWithResources.reduce(
        (sum, chapter) => sum + chapter.topics.reduce((topicSum, topic) => topicSum + topic.submissions.length, 0),
        0
      );
      const submissionsSummary = userId ? `, ${totalSubmissions} submissions` : '';

      this.logger.log(colors.green(`✅ Complete resources retrieved for "${subject.name}"`));
      this.logger.log(colors.cyan(`📊 Summary: ${subjectStats.chaptersCount} chapters, ${subjectStats.topicsCount} topics, ${subjectStats.videosCount} videos, ${subjectStats.materialsCount} materials, ${subjectStats.assessmentsCount} assessments${submissionsSummary}`));

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

