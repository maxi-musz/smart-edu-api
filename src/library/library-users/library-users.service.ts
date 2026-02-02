import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';
import * as argon from 'argon2';
import { LibraryUserRole } from '@prisma/client';
import { generateRandomStrongPassword } from 'src/shared/helper-functions/password-generator';
import {
  sendLibraryUserOnboardToNewUser,
  sendLibraryUserOnboardToCreator,
} from 'src/common/mailer/send-library-user-onboard';
import { CreateLibraryUserDto, UpdateLibraryUserDto } from './dto';
import type { LibraryDashboardQueryDto } from './dto/library-dashboard-query.dto';

/** Roles that can manage/upload content (included in "library users" list for CRUD). */
const ROLES_THAT_CAN_MANAGE_OR_UPLOAD: LibraryUserRole[] = ['admin', 'manager', 'content_creator'];

@Injectable()
export class LibraryUsersService {
  private readonly logger = new Logger(LibraryUsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Dashboard for the library of the currently logged-in user: library info, summary stats, content stats,
   * schools with access, and paginated/filterable/sortable list of library users.
   */
  async getDashboard(platformId: string, query: LibraryDashboardQueryDto = {}): Promise<ApiResponse<any>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    this.logger.log(colors.cyan(`[LIBRARY USERS] Dashboard for platform: ${platformId} (page=${page}, limit=${limit})`));

    const baseWhere = { platformId };
    const search = query.search?.trim();
    const searchWhere = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { first_name: { contains: search, mode: 'insensitive' as const } },
            { last_name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const roleWhere = query.role ? { role: query.role as LibraryUserRole } : {};
    const statusWhere = query.status ? { status: query.status as any } : {};
    const where = {
      ...baseWhere,
      ...searchWhere,
      ...(Object.keys(roleWhere).length ? roleWhere : {}),
      ...(Object.keys(statusWhere).length ? statusWhere : {}),
    };

    const orderBy = { [sortBy]: sortOrder };

    const [
      library,
      totalUsersFiltered,
      users,
      allUsersForSummary,
      contentStats,
      schoolsWithAccessCount,
    ] = await Promise.all([
      this.prisma.libraryPlatform.findUnique({
        where: { id: platformId },
        select: { id: true, name: true, slug: true, description: true, status: true },
      }),
      this.prisma.libraryResourceUser.count({ where }),
      this.prisma.libraryResourceUser.findMany({
        where,
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
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              uploadedVideos: true,
              uploadedMaterials: true,
              uploadedAssignments: true,
              uploadedLinks: true,
              uploadedGeneralMaterials: true,
              createdAssessments: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.libraryResourceUser.findMany({
        where: { platformId },
        select: { role: true, status: true },
      }),
      this.prisma.libraryPlatform.findUnique({
        where: { id: platformId },
        select: {
          _count: {
            select: {
              subjects: true,
              topics: true,
              videos: true,
              materials: true,
              assessments: true,
              generalMaterials: true,
            },
          },
        },
      }),
      this.prisma.libraryResourceAccess
        .findMany({ where: { platformId, isActive: true }, select: { schoolId: true } })
        .then((rows) => new Set(rows.map((r) => r.schoolId)).size),
    ]);

    if (!library) {
      this.logger.error(colors.red(`❌ Library not found: ${platformId}`));
      return new ApiResponse(false, 'Library not found', null);
    }

    const byRole = {
      admin: allUsersForSummary.filter((u) => u.role === 'admin').length,
      manager: allUsersForSummary.filter((u) => u.role === 'manager').length,
      content_creator: allUsersForSummary.filter((u) => u.role === 'content_creator').length,
      reviewer: allUsersForSummary.filter((u) => u.role === 'reviewer').length,
      viewer: allUsersForSummary.filter((u) => u.role === 'viewer').length,
    };

    const byStatus = {
      active: allUsersForSummary.filter((u) => u.status === 'active').length,
      inactive: allUsersForSummary.filter((u) => u.status === 'inactive').length,
      suspended: allUsersForSummary.filter((u) => u.status === 'suspended').length,
    };

    const payload = {
      library: {
        id: library.id,
        name: library.name,
        slug: library.slug,
        description: library.description,
        status: library.status,
      },
      summary: {
        totalUsers: allUsersForSummary.length,
        byRole,
        byStatus,
      },
      contentStats: contentStats?._count
        ? {
            subjects: contentStats._count.subjects,
            topics: contentStats._count.topics,
            videos: contentStats._count.videos,
            materials: contentStats._count.materials,
            assessments: contentStats._count.assessments,
            generalMaterials: contentStats._count.generalMaterials,
          }
        : { subjects: 0, topics: 0, videos: 0, materials: 0, assessments: 0, generalMaterials: 0 },
      schoolsWithAccess: schoolsWithAccessCount,
      users,
      meta: {
        page,
        limit,
        total: totalUsersFiltered,
        totalPages: Math.ceil(totalUsersFiltered / limit) || 1,
        hasNextPage: page * limit < totalUsersFiltered,
        hasPreviousPage: page > 1,
      },
    };

    return new ApiResponse(true, 'Library users dashboard retrieved successfully', payload);
  }

  /** List library users under the platform who can manage/upload resources. */
  async list(platformId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY USERS] Listing users for platform: ${platformId}`));

    const users = await this.prisma.libraryResourceUser.findMany({
      where: {
        platformId,
        role: { in: ROLES_THAT_CAN_MANAGE_OR_UPLOAD },
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        role: true,
        userType: true,
        permissions: true,
        permissionLevel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            uploadedVideos: true,
            uploadedMaterials: true,
            uploadedAssignments: true,
            uploadedLinks: true,
            uploadedGeneralMaterials: true,
            createdAssessments: true,
          },
        },
      },
    });

    return new ApiResponse(true, 'Library users retrieved successfully', users);
  }

  /** Get one library user by id with complete profile and all uploads (videos, materials, assignments, links, general materials, assessments) including topic and subject. */
  async getOne(platformId: string, userId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY USERS] Getting full profile for user: ${userId}`));

    const topicSubjectSelect = {
      id: true,
      title: true,
      subject: { select: { id: true, name: true, code: true } },
    };
    const subjectOnlySelect = { id: true, name: true, code: true };

    const user = await this.prisma.libraryResourceUser.findFirst({
      where: { id: userId, platformId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        role: true,
        userType: true,
        permissions: true,
        permissionLevel: true,
        status: true,
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
            views: true,
            status: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            topic: { select: topicSubjectSelect },
            subject: { select: subjectOnlySelect },
          },
          orderBy: { createdAt: 'desc' },
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
            createdAt: true,
            updatedAt: true,
            topic: { select: topicSubjectSelect },
            subject: { select: subjectOnlySelect },
          },
          orderBy: { createdAt: 'desc' },
        },
        uploadedAssignments: {
          select: {
            id: true,
            title: true,
            description: true,
            assignmentType: true,
            instructions: true,
            attachmentUrl: true,
            dueDate: true,
            maxScore: true,
            status: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            topic: { select: topicSubjectSelect },
            subject: { select: subjectOnlySelect },
          },
          orderBy: { createdAt: 'desc' },
        },
        uploadedLinks: {
          select: {
            id: true,
            title: true,
            description: true,
            url: true,
            linkType: true,
            thumbnailUrl: true,
            domain: true,
            status: true,
            order: true,
            createdAt: true,
            updatedAt: true,
            topic: { select: topicSubjectSelect },
            subject: { select: subjectOnlySelect },
          },
          orderBy: { createdAt: 'desc' },
        },
        uploadedGeneralMaterials: {
          select: {
            id: true,
            title: true,
            description: true,
            author: true,
            materialType: true,
            url: true,
            sizeBytes: true,
            pageCount: true,
            thumbnailUrl: true,
            isFree: true,
            isAvailable: true,
            processingStatus: true,
            createdAt: true,
            updatedAt: true,
            subject: { select: subjectOnlySelect },
          },
          orderBy: { createdAt: 'desc' },
        },
        uploadedChapterFiles: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            url: true,
            title: true,
            order: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        createdAssessments: {
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
            maxAttempts: true,
            totalPoints: true,
            passingScore: true,
            createdAt: true,
            updatedAt: true,
            subject: { select: subjectOnlySelect },
            topic: { select: { id: true, title: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            uploadedVideos: true,
            uploadedMaterials: true,
            uploadedAssignments: true,
            uploadedLinks: true,
            uploadedGeneralMaterials: true,
            uploadedChapterFiles: true,
            createdAssessments: true,
            comments: true,
            libraryResourceAccessGrants: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Library user not found');
    }

    const {
      uploadedVideos,
      uploadedMaterials,
      uploadedAssignments,
      uploadedLinks,
      uploadedGeneralMaterials,
      uploadedChapterFiles,
      createdAssessments,
      _count,
      platform,
      ...profileFields
    } = user;

    const payload = {
      profile: {
        ...profileFields,
        displayPicture: null,
      },
      library: platform,
      counts: _count,
      uploads: {
        videos: uploadedVideos,
        materials: uploadedMaterials,
        assignments: uploadedAssignments,
        links: uploadedLinks,
        generalMaterials: uploadedGeneralMaterials,
        chapterFiles: uploadedChapterFiles,
      },
      createdAssessments,
    };

    return new ApiResponse(true, 'Library user retrieved successfully', payload);
  }

  /** Fetch all available permission definitions (catalog) for library owners to assign to users. */
  async getAvailablePermissions(): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan('[LIBRARY USERS] Fetching available permissions'));

    const permissions = await this.prisma.libraryPermissionDefinition.findMany({
      orderBy: { code: 'asc' },
      select: { id: true, code: true, name: true, description: true },
    });

    this.logger.log(colors.green('Available permissions retrieved successfully'));
    return new ApiResponse(true, 'Available permissions retrieved successfully', permissions);
  }

  /** Create a library user under the platform (elevated only). Auto-generates strong password if not provided; sends onboarding emails to new user and creator. */
  async create(
    platformId: string,
    dto: CreateLibraryUserDto,
    creatorId: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY USERS] Creating user for platform: ${platformId}`));

    const emailLower = dto.email.toLowerCase();
    const existing = await this.prisma.libraryResourceUser.findUnique({
      where: { email: emailLower },
    });
    if (existing) {
      throw new BadRequestException('A library user with this email already exists');
    }

    const plainPassword =
      dto.password && dto.password.length >= 8
        ? dto.password
        : generateRandomStrongPassword();
    const hashedPassword = await argon.hash(plainPassword);

    const role = (dto.role as any) ?? 'content_creator';
    const userType = (dto.userType as any) ?? 'contentcreator';

    const user = await this.prisma.libraryResourceUser.create({
      data: {
        platformId,
        email: emailLower,
        password: hashedPassword,
        first_name: dto.first_name,
        last_name: dto.last_name,
        phone_number: dto.phone_number ?? null,
        role,
        userType,
        permissions: dto.permissions ?? [],
        permissionLevel: dto.permissionLevel ?? null,
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        role: true,
        userType: true,
        permissions: true,
        permissionLevel: true,
        status: true,
        createdAt: true,
      },
    });

    try {
      const [library, creator] = await Promise.all([
        this.prisma.libraryPlatform.findUnique({
          where: { id: platformId },
          select: { name: true },
        }),
        this.prisma.libraryResourceUser.findUnique({
          where: { id: creatorId },
          select: { email: true, first_name: true, last_name: true },
        }),
      ]);

      const libraryName = library?.name ?? 'Library';

      await sendLibraryUserOnboardToNewUser({
        to: emailLower,
        libraryName,
        firstName: dto.first_name,
        lastName: dto.last_name,
        email: emailLower,
        temporaryPassword: plainPassword,
        role,
      });

      if (creator?.email) {
        await sendLibraryUserOnboardToCreator({
          to: creator.email,
          creatorFirstName: creator.first_name,
          creatorLastName: creator.last_name,
          newUserFirstName: dto.first_name,
          newUserLastName: dto.last_name,
          newUserEmail: emailLower,
          newUserRole: role,
          libraryName,
        });
      }
    } catch (emailError) {
      this.logger.warn(
        colors.yellow(
          `[LIBRARY USERS] User created but onboarding emails failed: ${(emailError as Error).message}`,
        ),
      );
    }

    this.logger.log(colors.green('Library user created successfully'));
    return new ApiResponse(true, 'Library user created successfully', user);
  }

  /** Update a library user (must belong to same platform). */
  async update(platformId: string, userId: string, dto: UpdateLibraryUserDto): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY USERS] Updating user: ${userId}`));

    const existing = await this.prisma.libraryResourceUser.findFirst({
      where: { id: userId, platformId },
    });
    if (!existing) {
      throw new NotFoundException('Library user not found');
    }

    if (dto.email !== undefined) {
      const emailLower = dto.email.toLowerCase();
      const duplicate = await this.prisma.libraryResourceUser.findFirst({
        where: { email: emailLower, id: { not: userId } },
      });
      if (duplicate) {
        throw new BadRequestException('A library user with this email already exists');
      }
    }

    const updateData: any = {
      ...(dto.first_name !== undefined && { first_name: dto.first_name }),
      ...(dto.last_name !== undefined && { last_name: dto.last_name }),
      ...(dto.phone_number !== undefined && { phone_number: dto.phone_number }),
      ...(dto.email !== undefined && { email: dto.email.toLowerCase() }),
      ...(dto.role !== undefined && { role: dto.role as any }),
      ...(dto.userType !== undefined && { userType: dto.userType as any }),
      ...(dto.permissions !== undefined && { permissions: dto.permissions }),
      ...(dto.permissionLevel !== undefined && { permissionLevel: dto.permissionLevel }),
    };
    if (dto.password !== undefined && dto.password.length >= 8) {
      updateData.password = await argon.hash(dto.password);
    }

    const user = await this.prisma.libraryResourceUser.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        role: true,
        userType: true,
        permissions: true,
        permissionLevel: true,
        status: true,
        updatedAt: true,
      },
    });

    this.logger.log(colors.green('Library user updated successfully'));
    return new ApiResponse(true, 'Library user updated successfully', user);
  }

  /**
   * Add or remove a single permission for a library user (elevated only).
   * Use action: 'add' | 'remove' with permissionCode.
   */
  async updatePermission(
    platformId: string,
    userId: string,
    action: 'add' | 'remove',
    permissionCode: string,
  ): Promise<ApiResponse<any>> {
    if (action === 'add') {
      return this.addPermission(platformId, userId, permissionCode);
    }
    return this.removePermission(platformId, userId, permissionCode);
  }

  /** Add a single permission code to a library user's permissions array (elevated only). */
  private async addPermission(
    platformId: string,
    userId: string,
    permissionCode: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY USERS] Adding permission "${permissionCode}" to user: ${userId}`));

    const existing = await this.prisma.libraryResourceUser.findFirst({
      where: { id: userId, platformId },
      select: { id: true, permissions: true },
    });
    if (!existing) {
      throw new NotFoundException('Library user not found');
    }

    const definition = await this.prisma.libraryPermissionDefinition.findUnique({
      where: { code: permissionCode },
    });
    if (!definition) {
      throw new BadRequestException(`Permission "${permissionCode}" is not defined in the catalog`);
    }

    const current = existing.permissions ?? [];
    if (current.includes(permissionCode)) {
      throw new BadRequestException(`User already has permission "${permissionCode}"`);
    }

    const updated = await this.prisma.libraryResourceUser.update({
      where: { id: userId },
      data: { permissions: [...current, permissionCode] },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        userType: true,
        permissions: true,
        permissionLevel: true,
        status: true,
        updatedAt: true,
      },
    });

    this.logger.log(colors.green(`Permission "${permissionCode}" added successfully`));
    return new ApiResponse(true, `Permission "${permissionCode}" added successfully`, updated);
  }

  /** Remove a single permission code from a library user's permissions array (elevated only). */
  private async removePermission(
    platformId: string,
    userId: string,
    permissionCode: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY USERS] Removing permission "${permissionCode}" from user: ${userId}`));

    const existing = await this.prisma.libraryResourceUser.findFirst({
      where: { id: userId, platformId },
      select: { id: true, permissions: true },
    });
    if (!existing) {
      throw new NotFoundException('Library user not found');
    }

    const current = existing.permissions ?? [];
    if (!current.includes(permissionCode)) {
      throw new BadRequestException(`User does not have permission "${permissionCode}"`);
    }

    const newPermissions = current.filter((p) => p !== permissionCode);

    const updated = await this.prisma.libraryResourceUser.update({
      where: { id: userId },
      data: { permissions: newPermissions },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        userType: true,
        permissions: true,
        permissionLevel: true,
        status: true,
        updatedAt: true,
      },
    });

    this.logger.log(colors.green(`Permission "${permissionCode}" removed successfully`));
    return new ApiResponse(true, `Permission "${permissionCode}" removed successfully`, updated);
  }

  /** Delete (or deactivate) a library user. Prefer soft delete if you have status; here we hard delete for simplicity. */
  async remove(platformId: string, userId: string): Promise<ApiResponse<void>> {
    this.logger.log(colors.cyan(`[LIBRARY USERS] Removing user: ${userId}`));

    const existing = await this.prisma.libraryResourceUser.findFirst({
      where: { id: userId, platformId },
    });
    if (!existing) {
      throw new NotFoundException('Library user not found');
    }

    await this.prisma.libraryResourceUser.delete({
      where: { id: userId },
    });

    this.logger.log(colors.green('Library user removed successfully'));
    return new ApiResponse(true, 'Library user removed successfully');
  }

  /** Upload analytics: who uploaded what, how many uploaders, counts by type. For library owners. */
  async getUploadAnalytics(platformId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`[LIBRARY USERS] Upload analytics for platform: ${platformId}`));

    const usersWithUploads = await this.prisma.libraryResourceUser.findMany({
      where: { platformId, status: 'active' },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        _count: {
          select: {
            uploadedVideos: true,
            uploadedMaterials: true,
            uploadedAssignments: true,
            uploadedLinks: true,
            uploadedGeneralMaterials: true,
            createdAssessments: true,
          },
        },
      },
    });

    const uploadersCount = usersWithUploads.filter(
      (u) =>
        u._count.uploadedVideos > 0 ||
        u._count.uploadedMaterials > 0 ||
        u._count.uploadedAssignments > 0 ||
        u._count.uploadedLinks > 0 ||
        u._count.uploadedGeneralMaterials > 0 ||
        u._count.createdAssessments > 0,
    ).length;

    const byType = {
      videos: usersWithUploads.reduce((s, u) => s + u._count.uploadedVideos, 0),
      materials: usersWithUploads.reduce((s, u) => s + u._count.uploadedMaterials, 0),
      assignments: usersWithUploads.reduce((s, u) => s + u._count.uploadedAssignments, 0),
      links: usersWithUploads.reduce((s, u) => s + u._count.uploadedLinks, 0),
      generalMaterials: usersWithUploads.reduce((s, u) => s + u._count.uploadedGeneralMaterials, 0),
      assessments: usersWithUploads.reduce((s, u) => s + u._count.createdAssessments, 0),
    };

    const uploadsDetail: Array<{
      resourceType: string;
      resourceId: string;
      title?: string;
      uploadedBy: { id: string; email: string; first_name: string; last_name: string };
      createdAt: string;
    }> = [];

    const [videos, materials, assignments, links, generalMaterials, assessments] = await Promise.all([
      this.prisma.libraryVideoLesson.findMany({
        where: { topic: { subject: { platformId } } },
        select: { id: true, title: true, uploadedById: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.libraryMaterial.findMany({
        where: { topic: { subject: { platformId } } },
        select: { id: true, title: true, uploadedById: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.libraryAssignment.findMany({
        where: { topic: { subject: { platformId } } },
        select: { id: true, title: true, uploadedById: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.libraryLink.findMany({
        where: { topic: { subject: { platformId } } },
        select: { id: true, title: true, uploadedById: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.libraryGeneralMaterial.findMany({
        where: { platformId },
        select: { id: true, title: true, uploadedById: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.libraryAssessment.findMany({
        where: { subject: { platformId } },
        select: { id: true, title: true, createdById: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const uploaderMap = new Map(
      usersWithUploads.map((u) => [
        u.id,
        { id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name },
      ]),
    );

    videos.forEach((v) => {
      uploadsDetail.push({
        resourceType: 'video',
        resourceId: v.id,
        title: v.title ?? undefined,
        uploadedBy: uploaderMap.get(v.uploadedById) ?? {
          id: v.uploadedById,
          email: '',
          first_name: '',
          last_name: '',
        },
        createdAt: v.createdAt.toISOString(),
      });
    });
    materials.forEach((m) => {
      uploadsDetail.push({
        resourceType: 'material',
        resourceId: m.id,
        title: m.title ?? undefined,
        uploadedBy: uploaderMap.get(m.uploadedById) ?? {
          id: m.uploadedById,
          email: '',
          first_name: '',
          last_name: '',
        },
        createdAt: m.createdAt.toISOString(),
      });
    });
    assignments.forEach((a) => {
      uploadsDetail.push({
        resourceType: 'assignment',
        resourceId: a.id,
        title: a.title ?? undefined,
        uploadedBy: uploaderMap.get(a.uploadedById) ?? {
          id: a.uploadedById,
          email: '',
          first_name: '',
          last_name: '',
        },
        createdAt: a.createdAt.toISOString(),
      });
    });
    links.forEach((l) => {
      uploadsDetail.push({
        resourceType: 'link',
        resourceId: l.id,
        title: l.title ?? undefined,
        uploadedBy: uploaderMap.get(l.uploadedById) ?? {
          id: l.uploadedById,
          email: '',
          first_name: '',
          last_name: '',
        },
        createdAt: l.createdAt.toISOString(),
      });
    });
    generalMaterials.forEach((g) => {
      uploadsDetail.push({
        resourceType: 'general_material',
        resourceId: g.id,
        title: g.title ?? undefined,
        uploadedBy: uploaderMap.get(g.uploadedById) ?? {
          id: g.uploadedById,
          email: '',
          first_name: '',
          last_name: '',
        },
        createdAt: g.createdAt.toISOString(),
      });
    });
    assessments.forEach((a) => {
      uploadsDetail.push({
        resourceType: 'assessment',
        resourceId: a.id,
        title: a.title ?? undefined,
        uploadedBy: uploaderMap.get(a.createdById) ?? {
          id: a.createdById,
          email: '',
          first_name: '',
          last_name: '',
        },
        createdAt: a.createdAt.toISOString(),
      });
    });

    uploadsDetail.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const payload = {
      uploadersCount,
      byType,
      uploadsByUser: usersWithUploads.map((u) => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
        counts: u._count,
      })),
      recentUploads: uploadsDetail.slice(0, 50),
    };

    return new ApiResponse(true, 'Upload analytics retrieved successfully', payload);
  }
}
