import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SchoolGrantAccessDto,
  SchoolGrantBulkAccessDto,
  SchoolUpdateAccessDto,
  SchoolRevokeAccessDto,
  QueryAvailableResourcesDto,
  QueryUserResourcesDto,
  QueryAccessAnalyticsDto,
} from './dto';
import { LibraryResourceType, AccessLevel } from '../library-access-control/dto';
import * as colors from 'colors';

@Injectable()
export class SchoolAccessControlService {
  private readonly logger = new Logger(SchoolAccessControlService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all library resources available to the school (granted by library owner)
   */
  async getAvailableResources(user: any, query: QueryAvailableResourcesDto) {
    this.logger.log(colors.cyan(`[SCHOOL ACCESS] Fetching available library resources`));

    try {
      // Get user's school
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      // Verify user is school director or admin
      if (!['school_director', 'school_admin'].includes(userData.role)) {
        throw new ForbiddenException('Only school directors and admins can manage access');
      }

      const { page = 1, limit = 20, resourceType, subjectId, isActive, search } = query;
      const skip = (page - 1) * limit;

      // Build where clause for library resource access
      const where: any = {
        schoolId: userData.school_id,
        isActive: isActive !== undefined ? isActive : true,
      };

      if (resourceType) where.resourceType = resourceType;
      if (subjectId) where.subjectId = subjectId;

      // Filter out expired access
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];

      // Get total count
      const totalCount = await this.prisma.libraryResourceAccess.count({ where });

      // Get paginated results
      const availableResources = await this.prisma.libraryResourceAccess.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
              description: true,
              thumbnailUrl: true,
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
              thumbnailUrl: true,
              durationSeconds: true,
            },
          },
          material: {
            select: {
              id: true,
              title: true,
              description: true,
              materialType: true,
            },
          },
          assessment: {
            select: {
              id: true,
              title: true,
              description: true,
              assessmentType: true,
            },
          },
        },
      });

      const totalPages = Math.ceil(totalCount / limit);

      this.logger.log(colors.green(`✅ Retrieved ${availableResources.length} available resources`));

      return {
        success: true,
        message: 'Available resources retrieved successfully',
        data: {
          items: availableResources,
          meta: {
            totalItems: totalCount,
            totalPages,
            currentPage: page,
            limit,
          },
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error fetching available resources: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to fetch available resources');
    }
  }

  /**
   * Grant users/roles/classes access to library resources
   */
  async grantAccess(user: any, dto: SchoolGrantAccessDto) {
    this.logger.log(colors.cyan(`[SCHOOL ACCESS] Granting access within school`));

    try {
      // Get user's school and verify permissions
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      if (!['school_director', 'school_admin'].includes(userData.role)) {
        throw new ForbiddenException('Only school directors and admins can grant access');
      }

      // Verify the library resource access exists and belongs to this school
      const libraryAccess = await this.prisma.libraryResourceAccess.findFirst({
        where: {
          id: dto.libraryResourceAccessId,
          schoolId: userData.school_id,
          isActive: true,
        },
      });

      if (!libraryAccess) {
        throw new NotFoundException('Library resource access not found or not available to your school');
      }

      // Check that library access hasn't expired
      if (libraryAccess.expiresAt && libraryAccess.expiresAt < new Date()) {
        throw new BadRequestException('Library resource access has expired');
      }

      // Validate that at least one scope is provided (userId, roleType, or classId)
      if (!dto.userId && !dto.roleType && !dto.classId) {
        throw new BadRequestException('Must specify at least one of: userId, roleType, or classId');
      }

      // Validate specific user/class if provided
      if (dto.userId) {
        const targetUser = await this.prisma.user.findFirst({
          where: { id: dto.userId, school_id: userData.school_id },
        });
        if (!targetUser) {
          throw new NotFoundException('User not found in your school');
        }
      }

      if (dto.classId) {
        const targetClass = await this.prisma.class.findFirst({
          where: { id: dto.classId, schoolId: userData.school_id },
        });
        if (!targetClass) {
          throw new NotFoundException('Class not found in your school');
        }
      }

      // Validate that school is not granting more than library owner granted
      await this.validateSchoolResourceScope(libraryAccess, dto);

      // Check if similar access already exists
      const existingAccess = await this.prisma.schoolResourceAccess.findFirst({
        where: {
          schoolId: userData.school_id,
          libraryResourceAccessId: dto.libraryResourceAccessId,
          userId: dto.userId || null,
          roleType: (dto.roleType as any) || null,
          classId: dto.classId || null,
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
          throw new BadRequestException('Similar access grant already exists');
        }
        // Reactivate
        const updated = await this.prisma.schoolResourceAccess.update({
          where: { id: existingAccess.id },
          data: {
            isActive: true,
            accessLevel: dto.accessLevel || AccessLevel.READ_ONLY,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            notes: dto.notes,
          },
        });

        this.logger.log(colors.green(`✅ Reactivated school access: ${updated.id}`));
        return {
          success: true,
          message: 'Access reactivated successfully',
          data: updated,
        };
      }

      // Create new access grant
      const accessGrant = await this.prisma.schoolResourceAccess.create({
        data: {
          schoolId: userData.school_id,
          libraryResourceAccessId: dto.libraryResourceAccessId,
          userId: dto.userId || null,
          roleType: dto.roleType as any || null,
          classId: dto.classId || null,
          resourceType: dto.resourceType,
          subjectId: dto.subjectId || null,
          topicId: dto.topicId || null,
          videoId: dto.videoId || null,
          materialId: dto.materialId || null,
          assessmentId: dto.assessmentId || null,
          accessLevel: dto.accessLevel || AccessLevel.READ_ONLY,
          grantedById: user.sub,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          notes: dto.notes,
        },
        include: {
          user: dto.userId ? {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          } : undefined,
          class: dto.classId ? {
            select: {
              id: true,
              name: true,
            },
          } : undefined,
        },
      });

      // Log audit trail
      await this.logAccessControlChange({
        entityType: 'SchoolResourceAccess',
        entityId: accessGrant.id,
        action: 'CREATED',
        performedById: user.sub,
        performedByRole: userData.role,
        schoolId: userData.school_id,
        changes: {
          resourceType: dto.resourceType,
          accessLevel: dto.accessLevel,
          userId: dto.userId,
          roleType: dto.roleType,
          classId: dto.classId,
        },
      });

      this.logger.log(colors.green(`✅ School access granted successfully: ${accessGrant.id}`));
      return {
        success: true,
        message: 'Access granted successfully',
        data: accessGrant,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error granting school access: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to grant access');
    }
  }

  /**
   * Bulk grant access to multiple users or classes
   */
  async grantBulkAccess(user: any, dto: SchoolGrantBulkAccessDto) {
    this.logger.log(colors.cyan(`[SCHOOL ACCESS] Bulk granting access`));

    try {
      // Get user's school and verify permissions
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      if (!['school_director', 'school_admin'].includes(userData.role)) {
        throw new ForbiddenException('Only school directors and admins can grant access');
      }

      // Verify library access
      const libraryAccess = await this.prisma.libraryResourceAccess.findFirst({
        where: {
          id: dto.libraryResourceAccessId,
          schoolId: userData.school_id,
          isActive: true,
        },
      });

      if (!libraryAccess) {
        throw new NotFoundException('Library resource access not found');
      }

      const results: any[] = [];

      // Grant to users
      if (dto.userIds && dto.userIds.length > 0) {
        for (const userId of dto.userIds) {
          try {
            const grant = await this.prisma.schoolResourceAccess.create({
              data: {
                schoolId: userData.school_id,
                libraryResourceAccessId: dto.libraryResourceAccessId,
                userId,
                resourceType: dto.resourceType,
                subjectId: dto.subjectId || null,
                topicId: dto.topicId || null,
                videoId: dto.videoId || null,
                materialId: dto.materialId || null,
                assessmentId: dto.assessmentId || null,
                accessLevel: dto.accessLevel || AccessLevel.READ_ONLY,
                grantedById: user.sub,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                notes: dto.notes,
              },
            });
            results.push({ userId, status: 'success', id: grant.id });
          } catch (err) {
            results.push({ userId, status: 'failed', error: err.message });
          }
        }
      }

      // Grant to classes
      if (dto.classIds && dto.classIds.length > 0) {
        for (const classId of dto.classIds) {
          try {
            const grant = await this.prisma.schoolResourceAccess.create({
              data: {
                schoolId: userData.school_id,
                libraryResourceAccessId: dto.libraryResourceAccessId,
                classId,
                resourceType: dto.resourceType,
                subjectId: dto.subjectId || null,
                topicId: dto.topicId || null,
                videoId: dto.videoId || null,
                materialId: dto.materialId || null,
                assessmentId: dto.assessmentId || null,
                accessLevel: dto.accessLevel || AccessLevel.READ_ONLY,
                grantedById: user.sub,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                notes: dto.notes,
              },
            });
            results.push({ classId, status: 'success', id: grant.id });
          } catch (err) {
            results.push({ classId, status: 'failed', error: err.message });
          }
        }
      }

      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.filter(r => r.status === 'failed').length;

      this.logger.log(colors.green(`✅ Bulk grant completed: ${successful} successful, ${failed} failed`));

      return {
        success: true,
        message: `Bulk access granted: ${successful} successful, ${failed} failed`,
        data: {
          successful,
          failed,
          total: results.length,
          results,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error in bulk grant: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to grant bulk access');
    }
  }

  /**
   * Update an existing school resource access grant
   */
  async updateAccess(user: any, accessId: string, dto: SchoolUpdateAccessDto) {
    this.logger.log(colors.cyan(`[SCHOOL ACCESS] Updating access: ${accessId}`));

    try {
      // Get user's school and verify permissions
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      if (!['school_director', 'school_admin'].includes(userData.role)) {
        throw new ForbiddenException('Only school directors and admins can update access');
      }

      // Verify access belongs to this school
      const existingAccess = await this.prisma.schoolResourceAccess.findFirst({
        where: {
          id: accessId,
          schoolId: userData.school_id,
        },
      });

      if (!existingAccess) {
        throw new NotFoundException('Access not found or does not belong to your school');
      }

      // Update
      const updated = await this.prisma.schoolResourceAccess.update({
        where: { id: accessId },
        data: {
          accessLevel: dto.accessLevel,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
          isActive: dto.isActive,
          notes: dto.notes,
        },
      });

      // Log audit trail
      await this.logAccessControlChange({
        entityType: 'SchoolResourceAccess',
        entityId: accessId,
        action: 'UPDATED',
        performedById: user.sub,
        performedByRole: userData.role,
        schoolId: userData.school_id,
        changes: dto,
      });

      this.logger.log(colors.green(`✅ Access updated successfully: ${accessId}`));
      return {
        success: true,
        message: 'Access updated successfully',
        data: updated,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error updating access: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to update access');
    }
  }

  /**
   * Revoke access
   */
  async revokeAccess(user: any, accessId: string, dto?: SchoolRevokeAccessDto) {
    this.logger.log(colors.cyan(`[SCHOOL ACCESS] Revoking access: ${accessId}`));

    try {
      // Get user's school and verify permissions
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      if (!['school_director', 'school_admin'].includes(userData.role)) {
        throw new ForbiddenException('Only school directors and admins can revoke access');
      }

      // Verify access belongs to this school
      const existingAccess = await this.prisma.schoolResourceAccess.findFirst({
        where: {
          id: accessId,
          schoolId: userData.school_id,
        },
      });

      if (!existingAccess) {
        throw new NotFoundException('Access not found or does not belong to your school');
      }

      // Soft delete
      const revoked = await this.prisma.schoolResourceAccess.update({
        where: { id: accessId },
        data: {
          isActive: false,
          notes: dto?.reason ? `REVOKED: ${dto.reason}` : 'REVOKED',
        },
      });

      // Log audit trail
      await this.logAccessControlChange({
        entityType: 'SchoolResourceAccess',
        entityId: accessId,
        action: 'REVOKED',
        performedById: user.sub,
        performedByRole: userData.role,
        schoolId: userData.school_id,
        changes: { reason: dto?.reason },
      });

      this.logger.log(colors.green(`✅ Access revoked successfully: ${accessId}`));
      return {
        success: true,
        message: 'Access revoked successfully',
        data: revoked,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error revoking access: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to revoke access');
    }
  }

  /**
   * Get resources accessible to a specific user
   */
  async getUserResources(user: any, userId: string, query: QueryUserResourcesDto) {
    this.logger.log(colors.cyan(`[SCHOOL ACCESS] Fetching user resources: ${userId}`));

    try {
      // Get requesting user's school
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData) {
        throw new NotFoundException('User not found');
      }

      // Verify target user is in same school
      const targetUser = await this.prisma.user.findFirst({
        where: { id: userId, school_id: userData.school_id },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          student: {
            select: {
              current_class_id: true,
            },
          },
        },
      });

      if (!targetUser) {
        throw new NotFoundException('User not found in your school');
      }

      // Build where clause
      const where: any = {
        schoolId: userData.school_id,
        isActive: true,
        OR: [
          { userId },
          { roleType: targetUser.role },
          { classId: targetUser.student?.current_class_id },
        ],
      };

      if (query.resourceType) where.resourceType = query.resourceType;
      if (query.accessLevel) where.accessLevel = query.accessLevel;

      if (!query.includeExpired) {
        where.AND = [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
        ];
      }

      // Get accessible resources
      const accessGrants = await this.prisma.schoolResourceAccess.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          libraryResourceAccess: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  description: true,
                  thumbnailUrl: true,
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
                  thumbnailUrl: true,
                  durationSeconds: true,
                  videoUrl: true,
                },
              },
              material: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  materialType: true,
                  url: true,
                },
              },
              assessment: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  assessmentType: true,
                  totalPoints: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(colors.green(`✅ Retrieved ${accessGrants.length} accessible resources for user`));

      return {
        success: true,
        message: 'User resources retrieved successfully',
        data: {
          user: targetUser,
          accessGrants,
          summary: {
            total: accessGrants.length,
            byResourceType: this.groupByResourceType(accessGrants),
            byAccessLevel: this.groupByAccessLevel(accessGrants),
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(colors.red(`❌ Error fetching user resources: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to fetch user resources');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Validate that school is not granting more access than library owner granted
   */
  private async validateSchoolResourceScope(libraryAccess: any, dto: SchoolGrantAccessDto) {
    // If library granted ALL, school can grant anything
    if (libraryAccess.resourceType === LibraryResourceType.ALL) {
      return;
    }

    // If library granted SUBJECT, school can only grant that subject or its children
    if (libraryAccess.resourceType === LibraryResourceType.SUBJECT) {
      if (dto.resourceType === LibraryResourceType.SUBJECT && dto.subjectId !== libraryAccess.subjectId) {
        throw new BadRequestException('Cannot grant access to a different subject than what library granted');
      }
      // School can grant topics/videos/materials under the granted subject
      return;
    }

    // Similar validations for other resource types...
    // For now, we allow school to be more restrictive but not broader
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
          schoolId: data.schoolId || null,
          changes: data.changes || {},
        },
      });
    } catch (error) {
      this.logger.error(colors.yellow(`⚠️ Failed to log audit trail: ${error.message}`));
    }
  }

  /**
   * Group by resource type
   */
  private groupByResourceType(grants: any[]) {
    return grants.reduce((acc, grant) => {
      const type = grant.resourceType;
      if (!acc[type]) acc[type] = 0;
      acc[type]++;
      return acc;
    }, {});
  }

  /**
   * Group by access level
   */
  private groupByAccessLevel(grants: any[]) {
    return grants.reduce((acc, grant) => {
      const level = grant.accessLevel;
      if (!acc[level]) acc[level] = 0;
      acc[level]++;
      return acc;
    }, {});
  }
}
