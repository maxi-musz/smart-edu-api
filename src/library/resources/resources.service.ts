import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getResourcesDashboard(user: any): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY RESOURCES] Fetching resources dashboard for library user: ${user.email}`));

    try {
      // Get the library user to access platformId
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: {
          id: true,
          platformId: true,
          email: true,
        },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Get the user's platform
      const platform = await this.prisma.libraryPlatform.findUnique({
        where: { id: libraryUser.platformId },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      });

      if (!platform) {
        this.logger.error(colors.red('Library platform not found'));
        throw new NotFoundException('Library platform not found');
      }

      // Fetch all library classes
      const libraryClasses = await this.prisma.libraryClass.findMany({
        select: {
          id: true,
          name: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

      // Fetch videos and materials for this user's platform only
      const [allVideos, allMaterials, allSubjects, allTopics] = await Promise.all([
        this.prisma.libraryVideoLesson.findMany({
          where: {
            platformId: libraryUser.platformId,
          },
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                classId: true,
              },
            },
            topic: {
              select: {
                id: true,
                title: true,
              },
            },
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
            createdAt: 'desc',
          },
        }) as any,
        this.prisma.libraryMaterial.findMany({
          where: {
            platformId: libraryUser.platformId,
          },
          include: {
            platform: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                classId: true,
              },
            },
            topic: {
              select: {
                id: true,
                title: true,
              },
            },
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
            createdAt: 'desc',
          },
        }) as any,
        this.prisma.librarySubject.findMany({
          where: {
            platformId: libraryUser.platformId,
          },
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            platformId: true,
            classId: true,
            createdAt: true,
          },
          orderBy: {
            name: 'asc',
          },
        }),
        this.prisma.libraryTopic.findMany({
          where: {
            platformId: libraryUser.platformId,
          },
          select: {
            id: true,
            title: true,
            platformId: true,
            subjectId: true,
            order: true,
            is_active: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

      // Calculate statistics
      const videoStats = {
        total: allVideos.length,
        published: allVideos.filter((v: any) => v.status === 'published').length,
        draft: allVideos.filter((v: any) => v.status === 'draft').length,
        archived: allVideos.filter((v: any) => v.status === 'archived').length,
      };

      const materialStats = {
        total: allMaterials.length,
        published: allMaterials.filter((m: any) => m.status === 'published').length,
        draft: allMaterials.filter((m: any) => m.status === 'draft').length,
        archived: allMaterials.filter((m: any) => m.status === 'archived').length,
        byType: {
          PDF: allMaterials.filter((m: any) => m.materialType === 'PDF').length,
          DOC: allMaterials.filter((m: any) => m.materialType === 'DOC').length,
          PPT: allMaterials.filter((m: any) => m.materialType === 'PPT').length,
          VIDEO: allMaterials.filter((m: any) => m.materialType === 'VIDEO').length,
          NOTE: allMaterials.filter((m: any) => m.materialType === 'NOTE').length,
          LINK: allMaterials.filter((m: any) => m.materialType === 'LINK').length,
          OTHER: allMaterials.filter((m: any) => m.materialType === 'OTHER').length,
        },
      };

      // Get unique uploaders
      const uniqueVideoUploaders = new Set(allVideos.map((v: any) => v.uploadedById)).size;
      const uniqueMaterialUploaders = new Set(allMaterials.map((m: any) => m.uploadedById)).size;

      // Group resources by library class
      const resourcesByClass = libraryClasses.map((libClass) => {
        const classSubjects = allSubjects.filter((s) => s.classId === libClass.id);
        const classSubjectIds = classSubjects.map((s) => s.id);

        const classVideos = allVideos.filter((v: any) => classSubjectIds.includes(v.subjectId));
        const classMaterials = allMaterials.filter((m: any) => classSubjectIds.includes(m.subjectId));

        return {
          ...libClass,
          subjectsCount: classSubjects.length,
          videosCount: classVideos.length,
          materialsCount: classMaterials.length,
          subjects: classSubjects.map((subject) => ({
            ...subject,
            videosCount: allVideos.filter((v: any) => v.subjectId === subject.id).length,
            materialsCount: allMaterials.filter((m: any) => m.subjectId === subject.id).length,
          })),
        };
      });

      const statistics = {
        overview: {
          totalClasses: libraryClasses.length,
          totalSubjects: allSubjects.length,
          totalTopics: allTopics.length,
          totalVideos: allVideos.length,
          totalMaterials: allMaterials.length,
        },
        videos: videoStats,
        materials: materialStats,
        contributors: {
          totalUniqueUploaders: new Set([
            ...allVideos.map((v: any) => v.uploadedById),
            ...allMaterials.map((m: any) => m.uploadedById),
          ]).size,
          videoUploaders: uniqueVideoUploaders,
          materialUploaders: uniqueMaterialUploaders,
        },
      };

      const responseData = {
        platform: {
          ...platform,
          videosCount: allVideos.length,
          materialsCount: allMaterials.length,
        },
        statistics,
        libraryClasses: resourcesByClass,
        resources: {
          videos: allVideos,
          materials: allMaterials,
        },
        subjects: allSubjects,
        topics: allTopics,
      };

      this.logger.log(colors.green(`Successfully retrieved resources dashboard data for platform: ${platform.name}`));

      return new ApiResponse(true, 'Resources dashboard retrieved successfully', responseData);
    } catch (error) {
      this.logger.error(colors.red(`Error fetching resources dashboard: ${error.message}`));
      throw new InternalServerErrorException('Failed to retrieve resources dashboard data');
    }
  }

  async getResourcesByClass(user: any, classId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY RESOURCES] Fetching resources for class: ${classId} for user: ${user.email}`));

    try {
      // Get the library user to access platformId
      const libraryUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: {
          id: true,
          platformId: true,
          email: true,
        },
      });

      if (!libraryUser) {
        this.logger.error(colors.red('Library user not found'));
        throw new NotFoundException('Library user not found');
      }

      // Get the user's platform
      const platform = await this.prisma.libraryPlatform.findUnique({
        where: { id: libraryUser.platformId },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      });

      if (!platform) {
        this.logger.error(colors.red('Library platform not found'));
        throw new NotFoundException('Library platform not found');
      }

      // Get the library class
      const libraryClass = await this.prisma.libraryClass.findUnique({
        where: { id: classId },
        select: {
          id: true,
          name: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!libraryClass) {
        this.logger.error(colors.red(`Library class not found: ${classId}`));
        throw new NotFoundException('Library class not found');
      }

      // Get all subjects for this class and this user's platform
      const subjects = await this.prisma.librarySubject.findMany({
        where: {
          classId: classId,
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          name: true,
          code: true,
          color: true,
          description: true,
          thumbnailUrl: true,
          thumbnailKey: true,
          platformId: true,
          classId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // For each subject, get topics and their materials directly (no chapters)
      const subjectsWithResources = await Promise.all(
        subjects.map(async (subject) => {
          // Get all topics for this subject
          const topics = await this.prisma.libraryTopic.findMany({
            where: {
              subjectId: subject.id,
              platformId: libraryUser.platformId,
            },
            select: {
              id: true,
              title: true,
              description: true,
              order: true,
              is_active: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              order: 'asc',
            },
          });

          // For each topic, get materials and videos
          const topicsWithResources = await Promise.all(
            topics.map(async (topic) => {
              const [materials, videos] = await Promise.all([
                this.prisma.libraryMaterial.findMany({
                  where: {
                    topicId: topic.id,
                    platformId: libraryUser.platformId,
                  },
                  include: {
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
                this.prisma.libraryVideoLesson.findMany({
                  where: {
                    topicId: topic.id,
                    platformId: libraryUser.platformId,
                  },
                  include: {
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
              ]);

              return {
                ...topic,
                materials: materials,
                videos: videos,
                materialsCount: materials.length,
                videosCount: videos.length,
              };
            }),
          );

          // Calculate totals for the subject
          const totalMaterials = topicsWithResources.reduce((sum, topic) => sum + topic.materialsCount, 0);
          const totalVideos = topicsWithResources.reduce((sum, topic) => sum + topic.videosCount, 0);

          return {
            ...subject,
            topics: topicsWithResources,
            topicsCount: topics.length,
            totalMaterials: totalMaterials,
            totalVideos: totalVideos,
          };
        }),
      );

      const responseData = {
        platform: {
          id: platform.id,
          name: platform.name,
          slug: platform.slug,
        },
        class: {
          ...libraryClass,
        },
        subjects: subjectsWithResources,
        statistics: {
          totalSubjects: subjectsWithResources.length,
          totalTopics: subjectsWithResources.reduce((sum, subject) => sum + subject.topicsCount, 0),
          totalMaterials: subjectsWithResources.reduce((sum, subject) => sum + subject.totalMaterials, 0),
          totalVideos: subjectsWithResources.reduce((sum, subject) => sum + subject.totalVideos, 0),
        },
      };

      this.logger.log(colors.green(`Successfully retrieved resources for class: ${libraryClass.name}`));

      return new ApiResponse(true, 'Class resources retrieved successfully', responseData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(colors.red(`Error fetching class resources: ${error.message}`));
      throw new InternalServerErrorException('Failed to retrieve class resources');
    }
  }
}

