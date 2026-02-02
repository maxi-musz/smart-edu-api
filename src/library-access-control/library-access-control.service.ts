import { 
  Injectable, 
  Logger, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  GrantAccessDto, 
  GrantBulkAccessDto, 
  UpdateAccessDto,
  RevokeAccessDto,
  ExcludeResourceDto,
  QuerySchoolsWithAccessDto,
  QuerySchoolAccessDetailsDto,
  LibraryResourceType,
  AccessLevel
} from './dto';
import * as colors from 'colors';

@Injectable()
export class LibraryAccessControlService {
  private readonly logger = new Logger(LibraryAccessControlService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Grant a school access to library resources
   */
  async grantAccess(libraryUser: any, dto: GrantAccessDto) {
    this.logger.log(colors.cyan(`[LIBRARY ACCESS] Granting access to school: ${dto.schoolId}`));

    try {
      // Get library user's platform
      const libraryResourceUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: libraryUser.sub },
        select: { platformId: true, role: true },
      });

      if (!libraryResourceUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify school exists
      const school = await this.prisma.school.findUnique({
        where: { id: dto.schoolId },
        select: { id: true, school_name: true, status: true },
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${dto.schoolId} not found`);
      }

      if (school.status !== 'approved') {
        throw new BadRequestException(`Cannot grant access to non-approved school: ${school.school_name}`);
      }

      // Validate resource IDs based on resource type
      await this.validateResourceIds(libraryResourceUser.platformId, dto);

      // Check if access already exists
      const existingAccess = await this.prisma.libraryResourceAccess.findFirst({
        where: {
          platformId: libraryResourceUser.platformId,
          schoolId: dto.schoolId,
          resourceType: dto.resourceType,
          subjectId: dto.subjectId || null,
          topicId: dto.topicId || null,
          videoId: dto.videoId || null,
          materialId: dto.materialId || null,
          assessmentId: dto.assessmentId || null,
        },
      });

      if (existingAccess) {
        if (existingAccess.isActive) {
          throw new BadRequestException('Access grant already exists for this resource');
        }
        // Reactivate existing access
        const updated = await this.prisma.libraryResourceAccess.update({
          where: { id: existingAccess.id },
          data: {
            isActive: true,
            accessLevel: dto.accessLevel || AccessLevel.FULL,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            notes: dto.notes,
            updatedAt: new Date(),
          },
          include: {
            school: {
              select: {
                id: true,
                school_name: true,
                school_email: true,
              },
            },
          },
        });

        this.logger.log(colors.green(`✅ Reactivated access grant: ${updated.id}`));
        return {
          success: true,
          message: 'Access reactivated successfully',
          data: updated,
        };
      }

      // Create new access grant
      const accessGrant = await this.prisma.libraryResourceAccess.create({
        data: {
          platformId: libraryResourceUser.platformId,
          schoolId: dto.schoolId,
          resourceType: dto.resourceType,
          subjectId: dto.subjectId || null,
          topicId: dto.topicId || null,
          videoId: dto.videoId || null,
          materialId: dto.materialId || null,
          assessmentId: dto.assessmentId || null,
          accessLevel: dto.accessLevel || AccessLevel.FULL,
          grantedById: libraryUser.sub,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          notes: dto.notes,
        },
        include: {
          school: {
            select: {
              id: true,
              school_name: true,
              school_email: true,
            },
          },
          subject: dto.subjectId ? {
            select: {
              id: true,
              name: true,
              code: true,
            },
          } : undefined,
          topic: dto.topicId ? {
            select: {
              id: true,
              title: true,
            },
          } : undefined,
        },
      });

      // Log audit trail
      await this.logAccessControlChange({
        entityType: 'LibraryResourceAccess',
        entityId: accessGrant.id,
        action: 'CREATED',
        performedById: libraryUser.sub,
        performedByRole: 'libraryresourceowner',
        platformId: libraryResourceUser.platformId,
        schoolId: dto.schoolId,
        changes: {
          resourceType: dto.resourceType,
          accessLevel: dto.accessLevel,
          expiresAt: dto.expiresAt,
        },
      });

      this.logger.log(colors.green(`✅ Access granted successfully: ${accessGrant.id}`));
      return {
        success: true,
        message: 'Access granted successfully',
        data: accessGrant,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error granting access: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to grant access');
    }
  }

  /**
   * Grant multiple schools access to the same resource
   */
  async grantBulkAccess(libraryUser: any, dto: GrantBulkAccessDto) {
    this.logger.log(colors.cyan(`[LIBRARY ACCESS] Bulk granting access to ${dto.schoolIds.length} schools`));

    try {
      // Get library user's platform
      const libraryResourceUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: libraryUser.sub },
        select: { platformId: true },
      });

      if (!libraryResourceUser) {
        throw new NotFoundException('Library user not found');
      }

      // Validate resource IDs
      await this.validateResourceIds(libraryResourceUser.platformId, dto);

      // Verify all schools exist and are active
      const schools = await this.prisma.school.findMany({
        where: {
          id: { in: dto.schoolIds },
          status: 'approved',
        },
        select: { id: true, school_name: true },
      });

      if (schools.length !== dto.schoolIds.length) {
        const foundIds = schools.map(s => s.id);
        const missingIds = dto.schoolIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Some schools not found or inactive: ${missingIds.join(', ')}`);
      }

      // Create access grants for each school
      const results = await Promise.allSettled(
        dto.schoolIds.map(async (schoolId) => {
          // Check if access already exists
          const existing = await this.prisma.libraryResourceAccess.findFirst({
            where: {
              platformId: libraryResourceUser.platformId,
              schoolId,
              resourceType: dto.resourceType,
              subjectId: dto.subjectId || null,
              topicId: dto.topicId || null,
              videoId: dto.videoId || null,
              materialId: dto.materialId || null,
              assessmentId: dto.assessmentId || null,
            },
          });

          if (existing) {
            // Update existing
            return this.prisma.libraryResourceAccess.update({
              where: { id: existing.id },
              data: {
                isActive: true,
                accessLevel: dto.accessLevel || AccessLevel.FULL,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                notes: dto.notes,
              },
            });
          }

          // Create new
          return this.prisma.libraryResourceAccess.create({
            data: {
              platformId: libraryResourceUser.platformId,
              schoolId,
              resourceType: dto.resourceType,
              subjectId: dto.subjectId || null,
              topicId: dto.topicId || null,
              videoId: dto.videoId || null,
              materialId: dto.materialId || null,
              assessmentId: dto.assessmentId || null,
              accessLevel: dto.accessLevel || AccessLevel.FULL,
              grantedById: libraryUser.sub,
              expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
              notes: dto.notes,
            },
          });
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      this.logger.log(colors.green(`✅ Bulk access grant completed: ${successful} successful, ${failed} failed`));

      return {
        success: true,
        message: `Bulk access granted: ${successful} successful, ${failed} failed`,
        data: {
          successful,
          failed,
          total: dto.schoolIds.length,
          results: results.map((r, i) => ({
            schoolId: dto.schoolIds[i],
            status: r.status,
            error: r.status === 'rejected' ? r.reason?.message : undefined,
          })),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error in bulk access grant: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to grant bulk access');
    }
  }

  /**
   * Update an existing access grant
   */
  async updateAccess(libraryUser: any, accessId: string, dto: UpdateAccessDto) {
    this.logger.log(colors.cyan(`[LIBRARY ACCESS] Updating access grant: ${accessId}`));

    try {
      // Get library user's platform
      const libraryResourceUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: libraryUser.sub },
        select: { platformId: true },
      });

      if (!libraryResourceUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify access grant exists and belongs to this platform
      const existingAccess = await this.prisma.libraryResourceAccess.findFirst({
        where: {
          id: accessId,
          platformId: libraryResourceUser.platformId,
        },
      });

      if (!existingAccess) {
        throw new NotFoundException('Access grant not found or does not belong to your platform');
      }

      // Update
      const updated = await this.prisma.libraryResourceAccess.update({
        where: { id: accessId },
        data: {
          accessLevel: dto.accessLevel,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          isActive: dto.isActive,
          notes: dto.notes,
        },
        include: {
          school: {
            select: {
              id: true,
              school_name: true,
            },
          },
        },
      });

      // Log audit trail
      await this.logAccessControlChange({
        entityType: 'LibraryResourceAccess',
        entityId: accessId,
        action: 'UPDATED',
        performedById: libraryUser.sub,
        performedByRole: 'libraryresourceowner',
        platformId: libraryResourceUser.platformId,
        schoolId: existingAccess.schoolId,
        changes: dto,
      });

      this.logger.log(colors.green(`✅ Access updated successfully: ${accessId}`));
      return {
        success: true,
        message: 'Access updated successfully',
        data: updated,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error updating access: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to update access');
    }
  }

  /**
   * Revoke access
   */
  async revokeAccess(libraryUser: any, accessId: string, dto?: RevokeAccessDto) {
    this.logger.log(colors.cyan(`[LIBRARY ACCESS] Revoking access grant: ${accessId}`));

    try {
      // Get library user's platform
      const libraryResourceUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: libraryUser.sub },
        select: { platformId: true },
      });

      if (!libraryResourceUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify access grant exists and belongs to this platform
      const existingAccess = await this.prisma.libraryResourceAccess.findFirst({
        where: {
          id: accessId,
          platformId: libraryResourceUser.platformId,
        },
      });

      if (!existingAccess) {
        throw new NotFoundException('Access grant not found or does not belong to your platform');
      }

      // Soft delete by setting isActive to false
      const revoked = await this.prisma.libraryResourceAccess.update({
        where: { id: accessId },
        data: {
          isActive: false,
          notes: dto?.reason ? `REVOKED: ${dto.reason}` : 'REVOKED',
        },
      });

      // Log audit trail
      await this.logAccessControlChange({
        entityType: 'LibraryResourceAccess',
        entityId: accessId,
        action: 'REVOKED',
        performedById: libraryUser.sub,
        performedByRole: 'libraryresourceowner',
        platformId: libraryResourceUser.platformId,
        schoolId: existingAccess.schoolId,
        changes: { reason: dto?.reason },
      });

      this.logger.log(colors.green(`✅ Access revoked successfully: ${accessId}`));
      return {
        success: true,
        message: 'Access revoked successfully',
        data: revoked,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error revoking access: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to revoke access');
    }
  }

  /**
   * Exclude (turn off) a resource under a subject grant.
   * When library owner grants a subject, all children are on by default; this turns one off.
   */
  async excludeResource(libraryUser: any, dto: ExcludeResourceDto) {
    this.logger.log(colors.cyan(`[LIBRARY ACCESS] Excluding resource for school: ${dto.schoolId}`));

    try {
      const libraryResourceUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: libraryUser.sub },
        select: { platformId: true },
      });
      if (!libraryResourceUser) {
        throw new NotFoundException('Library user not found');
      }

      if (dto.resourceType === LibraryResourceType.TOPIC && !dto.topicId) {
        throw new BadRequestException('topicId is required for TOPIC');
      }
      if (dto.resourceType === LibraryResourceType.VIDEO && !dto.videoId) {
        throw new BadRequestException('videoId is required for VIDEO');
      }
      if (dto.resourceType === LibraryResourceType.MATERIAL && !dto.materialId) {
        throw new BadRequestException('materialId is required for MATERIAL');
      }
      if (dto.resourceType === LibraryResourceType.ASSESSMENT && !dto.assessmentId) {
        throw new BadRequestException('assessmentId is required for ASSESSMENT');
      }

      await this.validateResourceIds(libraryResourceUser.platformId, dto as any);

      const existing = await this.prisma.libraryResourceAccess.findFirst({
        where: {
          platformId: libraryResourceUser.platformId,
          schoolId: dto.schoolId,
          resourceType: dto.resourceType,
          topicId: dto.topicId || null,
          videoId: dto.videoId || null,
          materialId: dto.materialId || null,
          assessmentId: dto.assessmentId || null,
        },
      });

      if (existing) {
        if (!existing.isActive) {
          return { success: true, message: 'Resource already excluded', data: existing };
        }
        const updated = await this.prisma.libraryResourceAccess.update({
          where: { id: existing.id },
          data: { isActive: false, notes: 'Excluded (turned off) by library owner', updatedAt: new Date() },
        });
        return { success: true, message: 'Resource excluded successfully', data: updated };
      }

      const created = await this.prisma.libraryResourceAccess.create({
        data: {
          platformId: libraryResourceUser.platformId,
          schoolId: dto.schoolId,
          resourceType: dto.resourceType,
          subjectId: null,
          topicId: dto.topicId || null,
          videoId: dto.videoId || null,
          materialId: dto.materialId || null,
          assessmentId: dto.assessmentId || null,
          accessLevel: AccessLevel.FULL,
          grantedById: libraryUser.sub,
          isActive: false,
          notes: 'Excluded (turned off) by library owner',
        },
      });
      this.logger.log(colors.green(`✅ Resource excluded: ${created.id}`));
      return { success: true, message: 'Resource excluded successfully', data: created };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error excluding resource: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to exclude resource');
    }
  }

  /**
   * Include (turn on) a resource that was previously excluded.
   */
  async includeResource(libraryUser: any, dto: ExcludeResourceDto) {
    this.logger.log(colors.cyan(`[LIBRARY ACCESS] Including resource for school: ${dto.schoolId}`));

    try {
      const libraryResourceUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: libraryUser.sub },
        select: { platformId: true },
      });
      if (!libraryResourceUser) {
        throw new NotFoundException('Library user not found');
      }

      const existing = await this.prisma.libraryResourceAccess.findFirst({
        where: {
          platformId: libraryResourceUser.platformId,
          schoolId: dto.schoolId,
          resourceType: dto.resourceType,
          isActive: false,
          topicId: dto.topicId || null,
          videoId: dto.videoId || null,
          materialId: dto.materialId || null,
          assessmentId: dto.assessmentId || null,
        },
      });

      if (!existing) {
        return { success: true, message: 'Resource was not excluded', data: null };
      }

      await this.prisma.libraryResourceAccess.delete({
        where: { id: existing.id },
      });
      this.logger.log(colors.green(`✅ Resource included (exclusion removed): ${existing.id}`));
      return { success: true, message: 'Resource included successfully', data: { id: existing.id, removed: true } };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error including resource: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to include resource');
    }
  }

  /**
   * Get all schools with access to platform resources
   */
  async getSchoolsWithAccess(libraryUser: any, query: QuerySchoolsWithAccessDto) {
    this.logger.log(colors.cyan(`[LIBRARY ACCESS] Fetching schools with access`));

    try {
      // Get library user's platform
      const libraryResourceUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: libraryUser.sub },
        select: { platformId: true },
      });

      if (!libraryResourceUser) {
        throw new NotFoundException('Library user not found');
      }

      const { page = 1, limit = 20, resourceType, subjectId, isActive, search } = query;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        platformId: libraryResourceUser.platformId,
      };

      if (resourceType) where.resourceType = resourceType;
      if (subjectId) where.subjectId = subjectId;
      if (isActive !== undefined) where.isActive = isActive;

      if (search) {
        where.school = {
          OR: [
            { school_name: { contains: search, mode: 'insensitive' } },
            { school_email: { contains: search, mode: 'insensitive' } },
          ],
        };
      }

      // Get total count
      const totalCount = await this.prisma.libraryResourceAccess.count({ where });

      // Get paginated results
      const accessGrants = await this.prisma.libraryResourceAccess.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          school: {
            select: {
              id: true,
              school_name: true,
              school_email: true,
              status: true,
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
      });

      const totalPages = Math.ceil(totalCount / limit);

      this.logger.log(colors.green(`✅ Retrieved ${accessGrants.length} access grants`));

      return {
        success: true,
        message: 'Schools retrieved successfully',
        data: {
          items: accessGrants,
          meta: {
            totalItems: totalCount,
            totalPages,
            currentPage: page,
            limit,
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error fetching schools: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to fetch schools with access');
    }
  }

  /**
   * Get detailed access information for a specific school
   */
  async getSchoolAccessDetails(libraryUser: any, schoolId: string, query: QuerySchoolAccessDetailsDto) {
    this.logger.log(colors.cyan(`[LIBRARY ACCESS] Fetching access details for school: ${schoolId}`));

    try {
      // Get library user's platform
      const libraryResourceUser = await this.prisma.libraryResourceUser.findUnique({
        where: { id: libraryUser.sub },
        select: { platformId: true },
      });

      if (!libraryResourceUser) {
        throw new NotFoundException('Library user not found');
      }

      // Verify school exists
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          id: true,
          school_name: true,
          school_email: true,
          status: true,
        },
      });

      if (!school) {
        throw new NotFoundException('School not found');
      }

      // Build where clause
      const where: any = {
        platformId: libraryResourceUser.platformId,
        schoolId,
      };

      if (query.resourceType) where.resourceType = query.resourceType;
      if (query.accessLevel) where.accessLevel = query.accessLevel;
      if (query.isActive !== undefined) where.isActive = query.isActive;

      if (!query.includeExpired) {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ];
      }

      // Get all access grants for this school
      const accessGrants = await this.prisma.libraryResourceAccess.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              description: true,
            },
          },
          topic: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
              description: true,
            },
          },
          material: {
            select: {
              id: true,
              title: true,
              materialType: true,
            },
          },
          assessment: {
            select: {
              id: true,
              title: true,
              assessmentType: true,
            },
          },
          grantedBy: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      this.logger.log(colors.green(`✅ Retrieved ${accessGrants.length} access grants for school`));

      return {
        success: true,
        message: 'School access details retrieved successfully',
        data: {
          school,
          accessGrants,
          summary: {
            total: accessGrants.length,
            active: accessGrants.filter(a => a.isActive).length,
            expired: accessGrants.filter(a => a.expiresAt && a.expiresAt < new Date()).length,
            byResourceType: this.groupByResourceType(accessGrants),
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error fetching school access details: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to fetch school access details');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validate resource IDs based on resource type
   */
  private async validateResourceIds(platformId: string, dto: Partial<GrantAccessDto | GrantBulkAccessDto>) {
    switch (dto.resourceType) {
      case LibraryResourceType.ALL:
        // No validation needed
        break;

      case LibraryResourceType.SUBJECT:
        if (!dto.subjectId) {
          throw new BadRequestException('subjectId is required for SUBJECT resource type');
        }
        const subject = await this.prisma.librarySubject.findFirst({
          where: { id: dto.subjectId, platformId },
        });
        if (!subject) {
          throw new NotFoundException('Subject not found in your platform');
        }
        break;

      case LibraryResourceType.TOPIC:
        if (!dto.topicId) {
          throw new BadRequestException('topicId is required for TOPIC resource type');
        }
        const topic = await this.prisma.libraryTopic.findFirst({
          where: { id: dto.topicId, platformId },
        });
        if (!topic) {
          throw new NotFoundException('Topic not found in your platform');
        }
        break;

      case LibraryResourceType.VIDEO:
        if (!dto.videoId) {
          throw new BadRequestException('videoId is required for VIDEO resource type');
        }
        const video = await this.prisma.libraryVideoLesson.findFirst({
          where: { id: dto.videoId, platformId },
        });
        if (!video) {
          throw new NotFoundException('Video not found in your platform');
        }
        break;

      case LibraryResourceType.MATERIAL:
        if (!dto.materialId) {
          throw new BadRequestException('materialId is required for MATERIAL resource type');
        }
        const material = await this.prisma.libraryMaterial.findFirst({
          where: { id: dto.materialId, platformId },
        });
        if (!material) {
          throw new NotFoundException('Material not found in your platform');
        }
        break;

      case LibraryResourceType.ASSESSMENT:
        if (!dto.assessmentId) {
          throw new BadRequestException('assessmentId is required for ASSESSMENT resource type');
        }
        const assessment = await this.prisma.libraryAssessment.findFirst({
          where: { id: dto.assessmentId, platformId },
        });
        if (!assessment) {
          throw new NotFoundException('Assessment not found in your platform');
        }
        break;
    }
  }

  /**
   * Log access control changes for audit
   */
  private async logAccessControlChange(data: {
    entityType: string;
    entityId: string;
    action: string;
    performedById: string;
    performedByRole: string;
    platformId?: string;
    schoolId?: string;
    changes?: any;
  }) {
    try {
      await this.prisma.accessControlAuditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          performedById: data.performedById,
          performedByRole: data.performedByRole,
          platformId: data.platformId || null,
          schoolId: data.schoolId || null,
          changes: data.changes || {},
        },
      });
    } catch (error) {
      // Don't fail the operation if audit logging fails
      this.logger.error(colors.yellow(`⚠️ Failed to log audit trail: ${error.message}`));
    }
  }

  /**
   * Group access grants by resource type
   */
  private groupByResourceType(accessGrants: any[]) {
    return accessGrants.reduce((acc, grant) => {
      const type = grant.resourceType;
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    }, {});
  }
}
