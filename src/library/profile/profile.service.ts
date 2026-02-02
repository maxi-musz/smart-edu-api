import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(user: any): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY PROFILE] Fetching profile for library user: ${user.email}`));

    const libraryUser = await this.prisma.libraryResourceUser.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        role: true,
        userType: true,
        status: true,
        permissions: true,
        permissionLevel: true,
        platformId: true,
        createdAt: true,
        updatedAt: true,
        platform: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            status: true,
          },
        },
        uploadedVideos: {
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
            thumbnailUrl: true,
            durationSeconds: true,
            sizeBytes: true,
            status: true,
            order: true,
            subjectId: true,
            topicId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        uploadedMaterials: {
          select: {
            id: true,
            title: true,
            description: true,
            materialType: true,
            url: true,
            sizeBytes: true,
            pageCount: true,
            status: true,
            order: true,
            subjectId: true,
            topicId: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!libraryUser) {
      this.logger.error(colors.red('Library user not found'));
      throw new NotFoundException('Library user not found');
    }

    // Fetch all videos and materials for the library platform
    const [allPlatformVideos, allPlatformMaterials] = await Promise.all([
      this.prisma.libraryVideoLesson.findMany({
        where: {
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          videoUrl: true,
          thumbnailUrl: true,
          durationSeconds: true,
          sizeBytes: true,
          status: true,
          order: true,
          subjectId: true,
          topicId: true,
          uploadedById: true,
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
          createdAt: 'desc',
        },
      }),
      this.prisma.libraryMaterial.findMany({
        where: {
          platformId: libraryUser.platformId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          materialType: true,
          url: true,
          sizeBytes: true,
          pageCount: true,
          status: true,
          order: true,
          subjectId: true,
          topicId: true,
          uploadedById: true,
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
          createdAt: 'desc',
        },
      }),
    ]);

    const { uploadedVideos, uploadedMaterials, ...userData } = libraryUser;

    const responseData = {
      user: {
        ...userData,
        uploadedVideosCount: uploadedVideos.length,
        uploadedMaterialsCount: uploadedMaterials.length,
      },
      myUploads: {
        videos: uploadedVideos,
        materials: uploadedMaterials,
      },
      libraryContent: {
        videos: allPlatformVideos,
        materials: allPlatformMaterials,
        totalVideos: allPlatformVideos.length,
        totalMaterials: allPlatformMaterials.length,
      },
    };

    this.logger.log(colors.green('Library user profile retrieved successfully'));

    return new ApiResponse(true, 'Library user profile retrieved successfully', responseData);
  }
}

