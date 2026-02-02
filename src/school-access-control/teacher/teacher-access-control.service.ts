import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TeacherGrantAccessDto,
  TeacherGrantBulkAccessDto,
  TeacherUpdateAccessDto,
  TeacherRevokeAccessDto,
  QueryTeacherAvailableResourcesDto,
  QueryStudentResourcesDto,
} from './dto';
import { LibraryResourceType, AccessLevel } from '../../library-access-control/dto';
import * as colors from 'colors';

@Injectable()
export class TeacherAccessControlService {
  private readonly logger = new Logger(TeacherAccessControlService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get resources available to teacher (what school has granted)
   */
  async getAvailableResources(user: any, query: QueryTeacherAvailableResourcesDto) {
    this.logger.log(colors.cyan(`[TEACHER ACCESS] Fetching available resources for teacher`));

    try {
      // Verify user is a teacher
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true, teacher: true },
      });

      if (!userData || userData.role !== 'teacher') {
        throw new ForbiddenException('Only teachers can access this endpoint');
      }

      if (!userData.teacher) {
        throw new NotFoundException('Teacher profile not found');
      }

      const { page = 1, limit = 20, resourceType } = query;
      const skip = (page - 1) * limit;

      // Build where clause for school resource access
      // Teachers can manage resources granted to:
      // 1. Teachers role-wide
      // 2. Their specific user ID
      const where: any = {
        schoolId: userData.school_id,
        isActive: true,
        OR: [
          { roleType: 'teacher' },
          { userId: user.sub },
        ],
      };

      if (resourceType) where.resourceType = resourceType;

      // Filter out expired access
      where.AND = [
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      ];

      // Get total count
      const totalCount = await this.prisma.schoolResourceAccess.count({ where });

      // Get paginated results
      const availableResources = await this.prisma.schoolResourceAccess.findMany({
        where,
        skip,
        take: limit,
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
          },
        },
      });

      const totalPages = Math.ceil(totalCount / limit);

      this.logger.log(colors.green(`✅ Retrieved ${availableResources.length} available resources for teacher`));

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
   * Grant students/classes access to resources
   */
  async grantAccess(user: any, dto: TeacherGrantAccessDto) {
    this.logger.log(colors.cyan(`[TEACHER ACCESS] Granting access to students`));

    try {
      // Verify user is a teacher
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true, teacher: true },
      });

      if (!userData || userData.role !== 'teacher') {
        throw new ForbiddenException('Only teachers can grant student access');
      }

      if (!userData.teacher) {
        throw new NotFoundException('Teacher profile not found');
      }

      // Validate that at least one scope is provided
      if (!dto.studentId && !dto.classId) {
        throw new BadRequestException('Must specify either studentId or classId');
      }

      // Verify the school resource access exists
      const schoolAccess = await this.prisma.schoolResourceAccess.findFirst({
        where: {
          id: dto.schoolResourceAccessId,
          schoolId: userData.school_id,
          isActive: true,
        },
      });

      if (!schoolAccess) {
        throw new NotFoundException('School resource access not found');
      }

      // Verify student/class if provided
      if (dto.studentId) {
        const student = await this.prisma.user.findFirst({
          where: {
            id: dto.studentId,
            school_id: userData.school_id,
            role: 'student',
          },
        });
        if (!student) {
          throw new NotFoundException('Student not found in your school');
        }
      }

      if (dto.classId) {
        const classData = await this.prisma.class.findFirst({
          where: {
            id: dto.classId,
            schoolId: userData.school_id,
          },
        });
        if (!classData) {
          throw new NotFoundException('Class not found in your school');
        }
      }

      // Check if similar access already exists
      const existingAccess = await this.prisma.teacherResourceAccess.findFirst({
        where: {
          teacherId: user.sub,
          schoolId: userData.school_id,
          schoolResourceAccessId: dto.schoolResourceAccessId,
          studentId: dto.studentId || null,
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
        const updated = await this.prisma.teacherResourceAccess.update({
          where: { id: existingAccess.id },
          data: {
            isActive: true,
            accessLevel: dto.accessLevel || AccessLevel.READ_ONLY,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            notes: dto.notes,
          },
        });

        this.logger.log(colors.green(`✅ Reactivated teacher access: ${updated.id}`));
        return {
          success: true,
          message: 'Access reactivated successfully',
          data: updated,
        };
      }

      // Create new access grant
      const accessGrant = await this.prisma.teacherResourceAccess.create({
        data: {
          teacherId: user.sub,
          schoolId: userData.school_id,
          schoolResourceAccessId: dto.schoolResourceAccessId,
          studentId: dto.studentId || null,
          classId: dto.classId || null,
          resourceType: dto.resourceType,
          subjectId: dto.subjectId || null,
          topicId: dto.topicId || null,
          videoId: dto.videoId || null,
          materialId: dto.materialId || null,
          assessmentId: dto.assessmentId || null,
          accessLevel: dto.accessLevel || AccessLevel.READ_ONLY,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          notes: dto.notes,
        },
        include: {
          student: dto.studentId ? {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
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
        entityType: 'TeacherResourceAccess',
        entityId: accessGrant.id,
        action: 'CREATED',
        performedById: user.sub,
        performedByRole: 'teacher',
        schoolId: userData.school_id,
        changes: {
          resourceType: dto.resourceType,
          accessLevel: dto.accessLevel,
          studentId: dto.studentId,
          classId: dto.classId,
        },
      });

      this.logger.log(colors.green(`✅ Teacher access granted successfully: ${accessGrant.id}`));
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
      this.logger.error(colors.red(`❌ Error granting teacher access: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to grant access');
    }
  }

  /**
   * Bulk grant access to multiple students or classes
   */
  async grantBulkAccess(user: any, dto: TeacherGrantBulkAccessDto) {
    this.logger.log(colors.cyan(`[TEACHER ACCESS] Bulk granting access`));

    try {
      // Verify user is a teacher
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true, teacher: true },
      });

      if (!userData || userData.role !== 'teacher') {
        throw new ForbiddenException('Only teachers can grant student access');
      }

      // Verify school access
      const schoolAccess = await this.prisma.schoolResourceAccess.findFirst({
        where: {
          id: dto.schoolResourceAccessId,
          schoolId: userData.school_id,
          isActive: true,
        },
      });

      if (!schoolAccess) {
        throw new NotFoundException('School resource access not found');
      }

      const results: any[] = [];

      // Grant to students
      if (dto.studentIds && dto.studentIds.length > 0) {
        for (const studentId of dto.studentIds) {
          try {
            const grant = await this.prisma.teacherResourceAccess.create({
              data: {
                teacherId: user.sub,
                schoolId: userData.school_id,
                schoolResourceAccessId: dto.schoolResourceAccessId,
                studentId,
                resourceType: dto.resourceType,
                subjectId: dto.subjectId || null,
                topicId: dto.topicId || null,
                videoId: dto.videoId || null,
                materialId: dto.materialId || null,
                assessmentId: dto.assessmentId || null,
                accessLevel: dto.accessLevel || AccessLevel.READ_ONLY,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                notes: dto.notes,
              },
            });
            results.push({ studentId, status: 'success', id: grant.id });
          } catch (err) {
            results.push({ studentId, status: 'failed', error: err.message });
          }
        }
      }

      // Grant to classes
      if (dto.classIds && dto.classIds.length > 0) {
        for (const classId of dto.classIds) {
          try {
            const grant = await this.prisma.teacherResourceAccess.create({
              data: {
                teacherId: user.sub,
                schoolId: userData.school_id,
                schoolResourceAccessId: dto.schoolResourceAccessId,
                classId,
                resourceType: dto.resourceType,
                subjectId: dto.subjectId || null,
                topicId: dto.topicId || null,
                videoId: dto.videoId || null,
                materialId: dto.materialId || null,
                assessmentId: dto.assessmentId || null,
                accessLevel: dto.accessLevel || AccessLevel.READ_ONLY,
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
   * Update an existing teacher resource access grant
   */
  async updateAccess(user: any, accessId: string, dto: TeacherUpdateAccessDto) {
    this.logger.log(colors.cyan(`[TEACHER ACCESS] Updating access: ${accessId}`));

    try {
      // Verify user is a teacher
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData || userData.role !== 'teacher') {
        throw new ForbiddenException('Only teachers can update access');
      }

      // Verify access belongs to this teacher
      const existingAccess = await this.prisma.teacherResourceAccess.findFirst({
        where: {
          id: accessId,
          teacherId: user.sub,
          schoolId: userData.school_id,
        },
      });

      if (!existingAccess) {
        throw new NotFoundException('Access not found or does not belong to you');
      }

      // Update
      const updated = await this.prisma.teacherResourceAccess.update({
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
        entityType: 'TeacherResourceAccess',
        entityId: accessId,
        action: 'UPDATED',
        performedById: user.sub,
        performedByRole: 'teacher',
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
  async revokeAccess(user: any, accessId: string, dto?: TeacherRevokeAccessDto) {
    this.logger.log(colors.cyan(`[TEACHER ACCESS] Revoking access: ${accessId}`));

    try {
      // Verify user is a teacher
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData || userData.role !== 'teacher') {
        throw new ForbiddenException('Only teachers can revoke access');
      }

      // Verify access belongs to this teacher
      const existingAccess = await this.prisma.teacherResourceAccess.findFirst({
        where: {
          id: accessId,
          teacherId: user.sub,
          schoolId: userData.school_id,
        },
      });

      if (!existingAccess) {
        throw new NotFoundException('Access not found or does not belong to you');
      }

      // Soft delete
      const revoked = await this.prisma.teacherResourceAccess.update({
        where: { id: accessId },
        data: {
          isActive: false,
          notes: dto?.reason ? `REVOKED: ${dto.reason}` : 'REVOKED',
        },
      });

      // Log audit trail
      await this.logAccessControlChange({
        entityType: 'TeacherResourceAccess',
        entityId: accessId,
        action: 'REVOKED',
        performedById: user.sub,
        performedByRole: 'teacher',
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
   * Get resources accessible to a specific student
   */
  async getStudentResources(user: any, studentId: string, query: QueryStudentResourcesDto) {
    this.logger.log(colors.cyan(`[TEACHER ACCESS] Fetching student resources: ${studentId}`));

    try {
      // Verify user is a teacher
      const userData = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { school_id: true, role: true },
      });

      if (!userData || userData.role !== 'teacher') {
        throw new ForbiddenException('Only teachers can view student resources');
      }

      // Verify student exists in same school
      const student = await this.prisma.user.findFirst({
        where: {
          id: studentId,
          school_id: userData.school_id,
          role: 'student',
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          student: {
            select: {
              current_class_id: true,
            },
          },
        },
      });

      if (!student) {
        throw new NotFoundException('Student not found in your school');
      }

      // Build where clause
      const where: any = {
        schoolId: userData.school_id,
        isActive: true,
        OR: [
          { studentId },
          { classId: student.student?.current_class_id },
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
      const accessGrants = await this.prisma.teacherResourceAccess.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          schoolResourceAccess: {
            include: {
              libraryResourceAccess: {
                include: {
                  subject: true,
                  topic: true,
                  video: true,
                  material: true,
                  assessment: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(colors.green(`✅ Retrieved ${accessGrants.length} accessible resources for student`));

      return {
        success: true,
        message: 'Student resources retrieved successfully',
        data: {
          student,
          accessGrants,
          summary: {
            total: accessGrants.length,
            byResourceType: this.groupByResourceType(accessGrants),
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
      this.logger.error(colors.red(`❌ Error fetching student resources: ${error.message}`), error.stack);
      throw new InternalServerErrorException('Failed to fetch student resources');
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

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
}
