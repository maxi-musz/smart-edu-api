import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class LibraryService {
  private readonly logger = new Logger(LibraryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getLibraryDashboard(user: any): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY DASHBOARD] Fetching dashboard for library user: ${user.email}`));

    // Get the library user to access platformId
    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        platformId: true,
        email: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!libraryUser) {
      this.logger.error(colors.red('Library user not found'));
      throw new NotFoundException('Library user not found');
    }

    // Fetch library platform info
    const platform = await this.prisma.libraryPlatform.findUnique({
      where: { id: libraryUser.platformId },
      include: {
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        topics: {
          select: {
            id: true,
            title: true,
            subjectId: true,
          },
        },
      },
    });

    if (!platform) {
      this.logger.error(colors.red('Library platform not found'));
      throw new NotFoundException('Library platform not found');
    }

    // Fetch all videos and materials for the library platform
    // Note: Type assertions used because Prisma client needs regeneration after schema changes
    const [allVideos, allMaterials, userUploads] = await Promise.all([
      // @ts-ignore - Prisma client needs regeneration after schema changes
      this.prisma.libraryVideoLesson.findMany({
        where: {
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
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
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
          uploadedBy: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }) as any,
      // @ts-ignore - Prisma client needs regeneration after schema changes
      this.prisma.libraryResourceUser.findUnique({
        where: { id: user.sub },
        select: {
          uploadedVideos: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10, // Recent 10 uploads
          },
          uploadedMaterials: {
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 10, // Recent 10 uploads
          },
        },
      }) as any,
    ]);

    // Calculate statistics
    const videoStats = {
      total: allVideos.length,
      published: allVideos.filter((v) => v.status === 'published').length,
      draft: allVideos.filter((v) => v.status === 'draft').length,
      archived: allVideos.filter((v) => v.status === 'archived').length,
    };

    const materialStats = {
      total: allMaterials.length,
      published: allMaterials.filter((m) => m.status === 'published').length,
      draft: allMaterials.filter((m) => m.status === 'draft').length,
      archived: allMaterials.filter((m) => m.status === 'archived').length,
      byType: {
        PDF: allMaterials.filter((m) => m.materialType === 'PDF').length,
        DOC: allMaterials.filter((m) => m.materialType === 'DOC').length,
        PPT: allMaterials.filter((m) => m.materialType === 'PPT').length,
        VIDEO: allMaterials.filter((m) => m.materialType === 'VIDEO').length,
        NOTE: allMaterials.filter((m) => m.materialType === 'NOTE').length,
        LINK: allMaterials.filter((m) => m.materialType === 'LINK').length,
        OTHER: allMaterials.filter((m) => m.materialType === 'OTHER').length,
      },
    };

    // Get unique uploaders count
    const uniqueVideoUploaders = new Set(allVideos.map((v: any) => v.uploadedById)).size;
    const uniqueMaterialUploaders = new Set(allMaterials.map((m: any) => m.uploadedById)).size;

    const dashboardData = {
      library: {
        id: platform.id,
        name: platform.name,
        slug: platform.slug,
        description: platform.description,
        status: platform.status,
        subjectsCount: platform.subjects.length,
        topicsCount: platform.topics.length,
      },
      statistics: {
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
      },
      content: {
        videos: allVideos,
        materials: allMaterials,
      },
      myActivity: {
        videosUploaded: (userUploads as any)?.uploadedVideos?.length || 0,
        materialsUploaded: (userUploads as any)?.uploadedMaterials?.length || 0,
        recentVideos: (userUploads as any)?.uploadedVideos || [],
        recentMaterials: (userUploads as any)?.uploadedMaterials || [],
      },
    };

    this.logger.log(colors.green('Library dashboard retrieved successfully'));

    return new ApiResponse(true, 'Library dashboard retrieved successfully', dashboardData);
  }
}


