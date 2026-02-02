import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LibraryResourceType } from '../library-access-control/dto';
import * as colors from 'colors';

export interface AccessCheckResult {
  hasAccess: boolean;
  accessLevel?: string;
  reason?: string;
  grantPath?: string[]; // Shows the path of grants: [library, school, teacher]
}

/**
 * Centralized service to check access across all 3 levels:
 * 1. Library Owner → School
 * 2. School Owner → Users/Roles/Classes
 * 3. Teacher → Students
 */
@Injectable()
export class AccessControlHelperService {
  private readonly logger = new Logger(AccessControlHelperService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a user has access to a specific library resource
   * This checks the entire access control chain
   */
  async checkUserAccess(
    userId: string,
    resourceType: LibraryResourceType,
    resourceId: string,
  ): Promise<AccessCheckResult> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          school_id: true,
          role: true,
          student: {
            select: {
              current_class_id: true,
            },
          },
        },
      });

      if (!user) {
        return {
          hasAccess: false,
          reason: 'User not found',
        };
      }

      // LEVEL 1: Check if library owner granted school access
      const libraryAccess = await this.checkLibrarySchoolAccess(
        user.school_id,
        resourceType,
        resourceId,
      );

      if (!libraryAccess.hasAccess) {
        return {
          hasAccess: false,
          reason: 'School does not have library access to this resource',
          grantPath: ['library_denied'],
        };
      }

      // LEVEL 2: Check if school owner granted access to user/role/class
      const schoolAccess = await this.checkSchoolUserAccess(
        user.school_id,
        userId,
        user.role,
        user.student?.current_class_id,
        libraryAccess.libraryAccessId!,
        resourceType,
        resourceId,
      );

      if (!schoolAccess.hasAccess) {
        return {
          hasAccess: false,
          reason: 'School has not granted you access to this resource',
          grantPath: ['library_granted', 'school_denied'],
        };
      }

      // LEVEL 3: For students, check if teacher has granted specific access (only when school has set granular access)
      if (user.role === 'student' && schoolAccess.schoolAccessId) {
        const teacherAccess = await this.checkTeacherStudentAccess(
          user.school_id,
          userId,
          user.student?.current_class_id,
          schoolAccess.schoolAccessId,
          resourceType,
          resourceId,
        );

        // If teacher has set specific restrictions, respect them
        if (teacherAccess.hasRestrictions && !teacherAccess.hasAccess) {
          return {
            hasAccess: false,
            reason: 'Your teacher has not granted access to this resource yet',
            grantPath: ['library_granted', 'school_granted', 'teacher_denied'],
          };
        }

        // Teacher granted access or no teacher restrictions exist
        return {
          hasAccess: true,
          accessLevel: this.determineAccessLevel([
            libraryAccess.accessLevel,
            schoolAccess.accessLevel,
            teacherAccess.accessLevel,
          ]),
          grantPath: teacherAccess.hasAccess
            ? ['library_granted', 'school_granted', 'teacher_granted']
            : ['library_granted', 'school_granted', 'no_teacher_restrictions'],
        };
      }

      // For non-students (teachers, admins, etc.), school access is sufficient
      return {
        hasAccess: true,
        accessLevel: this.determineAccessLevel([
          libraryAccess.accessLevel,
          schoolAccess.accessLevel,
        ]),
        grantPath: ['library_granted', 'school_granted'],
      };
    } catch (error) {
      this.logger.error(colors.red(`❌ Error checking access: ${error.message}`), error.stack);
      return {
        hasAccess: false,
        reason: 'Error checking access',
      };
    }
  }

  /**
   * Get all accessible resources for a user (uses SchoolResourceAccess when present).
   * Not used for explore visibility: subject list and video list use library grants to school only
   * (getSubjectIdsGrantedToSchool / getAccessibleSubjectIds). Kept for checkUserAccess and any legacy use.
   */
  async getUserAccessibleResources(
    userId: string,
    resourceType?: LibraryResourceType,
  ): Promise<string[]> {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          school_id: true,
          role: true,
          student: {
            select: {
              current_class_id: true,
            },
          },
        },
      });

      if (!user) {
        return [];
      }

      // Include ALL when filtering by type - library can grant entire platform
      const libraryResourceTypes =
        resourceType === LibraryResourceType.SUBJECT
          ? [LibraryResourceType.ALL, LibraryResourceType.SUBJECT]
          : resourceType === LibraryResourceType.TOPIC
            ? [LibraryResourceType.ALL, LibraryResourceType.SUBJECT, LibraryResourceType.TOPIC]
            : resourceType === LibraryResourceType.VIDEO
              ? [LibraryResourceType.ALL, LibraryResourceType.SUBJECT, LibraryResourceType.TOPIC, LibraryResourceType.VIDEO]
              : resourceType
                ? [LibraryResourceType.ALL, resourceType]
                : undefined;

      const libraryAccessWhere: any = {
        schoolId: user.school_id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      };

      if (libraryResourceTypes) {
        libraryAccessWhere.resourceType = { in: libraryResourceTypes };
      }

      const libraryAccess = await this.prisma.libraryResourceAccess.findMany({
        where: libraryAccessWhere,
        select: {
          id: true,
          platformId: true,
          resourceType: true,
          subjectId: true,
          topicId: true,
          videoId: true,
          materialId: true,
          assessmentId: true,
        },
      });

      if (libraryAccess.length === 0) {
        return [];
      }

      const libraryAccessIds = libraryAccess.map((la) => la.id);

      // Get school access grants for user
      const schoolAccessWhere: any = {
        schoolId: user.school_id,
        libraryResourceAccessId: { in: libraryAccessIds },
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
        AND: [
          {
            OR: [
              { userId },
              { roleType: user.role },
              { classId: user.student?.current_class_id },
            ],
          },
        ],
      };

      const schoolAccess = await this.prisma.schoolResourceAccess.findMany({
        where: schoolAccessWhere,
        select: {
          id: true,
          libraryResourceAccessId: true,
          subjectId: true,
          topicId: true,
          videoId: true,
          materialId: true,
          assessmentId: true,
          libraryResourceAccess: {
            select: {
              platformId: true,
              resourceType: true,
              subjectId: true,
              topicId: true,
              videoId: true,
              materialId: true,
              assessmentId: true,
            },
          },
        },
      });

      const resourceIds = new Set<string>();

      // If school owner has set granular access (SchoolResourceAccess), use that
      if (schoolAccess.length > 0) {
        for (const sa of schoolAccess) {
          const lib = sa.libraryResourceAccess;
          const effectiveSubjectId = sa.subjectId ?? lib.subjectId;
          const effectiveTopicId = sa.topicId ?? lib.topicId;
          const effectiveVideoId = sa.videoId ?? lib.videoId;
          const effectiveMaterialId = sa.materialId ?? lib.materialId;
          const effectiveAssessmentId = sa.assessmentId ?? lib.assessmentId;

          if (lib.resourceType === LibraryResourceType.ALL) {
            const subjects = await this.prisma.librarySubject.findMany({
              where: { platformId: lib.platformId },
              select: { id: true },
            });
            subjects.forEach((s) => resourceIds.add(s.id));
          } else if (effectiveSubjectId) {
            resourceIds.add(effectiveSubjectId);
          }
          if (effectiveTopicId) resourceIds.add(effectiveTopicId);
          if (effectiveVideoId) resourceIds.add(effectiveVideoId);
          if (effectiveMaterialId) resourceIds.add(effectiveMaterialId);
          if (effectiveAssessmentId) resourceIds.add(effectiveAssessmentId);
        }
      } else {
        // No SchoolResourceAccess yet: library granted school → everyone in school sees what library granted
        for (const lib of libraryAccess) {
          if (lib.resourceType === LibraryResourceType.ALL) {
            const subjects = await this.prisma.librarySubject.findMany({
              where: { platformId: lib.platformId },
              select: { id: true },
            });
            subjects.forEach((s) => resourceIds.add(s.id));
          } else if (lib.subjectId) {
            resourceIds.add(lib.subjectId);
          }
          if (lib.topicId) resourceIds.add(lib.topicId);
          if (lib.videoId) resourceIds.add(lib.videoId);
          if (lib.materialId) resourceIds.add(lib.materialId);
          if (lib.assessmentId) resourceIds.add(lib.assessmentId);
        }
      }

      return Array.from(resourceIds);
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting accessible resources: ${error.message}`));
      return [];
    }
  }

  /**
   * Get subject IDs that the library has granted to the school (LibraryResourceAccess only).
   * Used as the source of truth for "which subjects can this school see" so teachers and students
   * see the same list. SchoolResourceAccess (per-user/role/class grants) is not used here, to avoid
   * legacy grants restricting teachers to a subset of subjects when the library granted the whole set.
   */
  private async getSubjectIdsGrantedToSchool(schoolId: string): Promise<string[]> {
    const libraryAccess = await this.prisma.libraryResourceAccess.findMany({
      where: {
        schoolId,
        isActive: true,
        AND: [
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
          { resourceType: { in: [LibraryResourceType.ALL, LibraryResourceType.SUBJECT] } },
        ],
      },
      select: { platformId: true, resourceType: true, subjectId: true },
    });
    const subjectIds = new Set<string>();
    for (const la of libraryAccess) {
      if (la.resourceType === LibraryResourceType.ALL) {
        const subjects = await this.prisma.librarySubject.findMany({
          where: { platformId: la.platformId },
          select: { id: true },
        });
        subjects.forEach((s) => subjectIds.add(s.id));
      } else if (la.subjectId) {
        subjectIds.add(la.subjectId);
      }
    }
    return Array.from(subjectIds);
  }

  /**
   * Get accessible subject IDs for filtering explore data.
   * Source: library grants to the school (not SchoolResourceAccess), then minus school-level exclusions.
   * School owner (school_director, school_admin) sees all granted subjects; others see granted minus school exclusions.
   * Teachers and students thus see the same subject list when the library granted multiple subjects to the school.
   */
  async getAccessibleSubjectIds(userId: string): Promise<string[]> {
    this.logger.log(colors.cyan(`📚 Getting accessible subject IDs for user ${userId}...`));
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { school_id: true, role: true },
    });
    if (!user) return [];
    const subjectIds = await this.getSubjectIdsGrantedToSchool(user.school_id);
    if (subjectIds.length === 0) return [];
    if (user.role === 'school_director' || user.role === 'school_admin') {
      return subjectIds;
    }
    const schoolExclusions = await this.prisma.schoolResourceExclusion.findMany({
      where: { schoolId: user.school_id },
      select: { subjectId: true },
    });
    if (schoolExclusions.length === 0) return subjectIds;
    const excludedSet = new Set(schoolExclusions.map((e) => e.subjectId));
    return subjectIds.filter((id) => !excludedSet.has(id));
  }

  /**
   * Get accessible video IDs. Based on library grants to the school (same as subjects), not SchoolResourceAccess.
   * Returns all published videos in subjects the user can see, minus library and teacher exclusions.
   */
  async getAccessibleVideoIds(userId: string): Promise<string[]> {
    const subjectIds = await this.getAccessibleSubjectIds(userId);
    if (subjectIds.length === 0) return [];

    const videos = await this.prisma.libraryVideoLesson.findMany({
      where: {
        status: 'published',
        subjectId: { in: subjectIds },
      },
      select: { id: true },
    });

    const accessibleVideoIds = videos.map((v) => v.id);
    const [libraryExcluded, teacherExcluded] = await Promise.all([
      this.getExcludedVideoIdsForUser(userId),
      this.getTeacherExcludedVideoIdsForUser(userId),
    ]);
    const excludedSet = new Set([...libraryExcluded, ...teacherExcluded]);
    if (excludedSet.size > 0) {
      return accessibleVideoIds.filter((id) => !excludedSet.has(id));
    }
    return accessibleVideoIds;
  }

  /**
   * Get all video IDs that teachers have excluded for this user (student or class).
   */
  private async getTeacherExcludedVideoIdsForUser(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { school_id: true, student: { select: { current_class_id: true } } },
    });
    if (!user) return [];
    const where: any = {
      schoolId: user.school_id,
      resourceType: 'VIDEO',
      OR: [{ studentId: userId }],
    };
    if (user.student?.current_class_id) {
      where.OR.push({ classId: user.student.current_class_id, studentId: null });
    }
    const rows = await this.prisma.teacherResourceExclusion.findMany({
      where,
      select: { resourceId: true },
    });
    return rows.map((r) => r.resourceId);
  }

  /**
   * Get all video IDs that library owner has "turned off" (excluded) for this user's school.
   */
  private async getExcludedVideoIdsForUser(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { school_id: true },
    });
    if (!user) return [];
    const rows = await this.prisma.libraryResourceAccess.findMany({
      where: {
        schoolId: user.school_id,
        resourceType: LibraryResourceType.VIDEO,
        isActive: false,
        videoId: { not: null },
      },
      select: { videoId: true },
    });
    return rows.map((r) => r.videoId!).filter(Boolean);
  }

  /**
   * Get resource IDs that are "turned off" (excluded) by library owner for a subject.
   * Library owner can turn off individual topics/videos/materials/assessments under a subject grant.
   */
  async getExcludedResourceIdsInSubject(
    schoolId: string,
    platformId: string,
    subjectId: string,
    resourceType: LibraryResourceType.TOPIC | LibraryResourceType.VIDEO | LibraryResourceType.MATERIAL | LibraryResourceType.ASSESSMENT,
  ): Promise<string[]> {
    try {
      if (resourceType === LibraryResourceType.TOPIC) {
        const rows = await this.prisma.libraryResourceAccess.findMany({
          where: {
            schoolId,
            platformId,
            resourceType: LibraryResourceType.TOPIC,
            isActive: false,
            topic: { subjectId },
          },
          select: { topicId: true },
        });
        return rows.map((r) => r.topicId!).filter(Boolean);
      }
      if (resourceType === LibraryResourceType.VIDEO) {
        const rows = await this.prisma.libraryResourceAccess.findMany({
          where: {
            schoolId,
            platformId,
            resourceType: LibraryResourceType.VIDEO,
            isActive: false,
            video: { subjectId },
          },
          select: { videoId: true },
        });
        return rows.map((r) => r.videoId!).filter(Boolean);
      }
      if (resourceType === LibraryResourceType.MATERIAL) {
        const rows = await this.prisma.libraryResourceAccess.findMany({
          where: {
            schoolId,
            platformId,
            resourceType: LibraryResourceType.MATERIAL,
            isActive: false,
            material: { subjectId },
          },
          select: { materialId: true },
        });
        return rows.map((r) => r.materialId!).filter(Boolean);
      }
      if (resourceType === LibraryResourceType.ASSESSMENT) {
        const rows = await this.prisma.libraryResourceAccess.findMany({
          where: {
            schoolId,
            platformId,
            resourceType: LibraryResourceType.ASSESSMENT,
            isActive: false,
            assessment: { subjectId },
          },
          select: { assessmentId: true },
        });
        return rows.map((r) => r.assessmentId!).filter(Boolean);
      }
      return [];
    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting excluded resources: ${error.message}`));
      return [];
    }
  }

  /**
   * Get excluded topic/video/material/assessment IDs for a subject (for current user's school).
   * Includes library-level exclusions. Teacher-level exclusions are applied only for teachers and students;
   * school owners (school_director, school_admin) see all library-granted content and are not affected by teacher exclusions.
   */
  async getExcludedIdsForSubject(
    userId: string,
    subjectId: string,
  ): Promise<{
    topicIds: string[];
    videoIds: string[];
    materialIds: string[];
    assessmentIds: string[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { school_id: true, role: true, student: { select: { current_class_id: true } } },
    });
    if (!user) {
      return { topicIds: [], videoIds: [], materialIds: [], assessmentIds: [] };
    }
    const subject = await this.prisma.librarySubject.findUnique({
      where: { id: subjectId },
      select: { platformId: true, classId: true },
    });
    if (!subject) {
      return { topicIds: [], videoIds: [], materialIds: [], assessmentIds: [] };
    }
    const [libraryTopicIds, libraryVideoIds, libraryMaterialIds, libraryAssessmentIds] = await Promise.all([
      this.getExcludedResourceIdsInSubject(user.school_id, subject.platformId, subjectId, LibraryResourceType.TOPIC),
      this.getExcludedResourceIdsInSubject(user.school_id, subject.platformId, subjectId, LibraryResourceType.VIDEO),
      this.getExcludedResourceIdsInSubject(user.school_id, subject.platformId, subjectId, LibraryResourceType.MATERIAL),
      this.getExcludedResourceIdsInSubject(user.school_id, subject.platformId, subjectId, LibraryResourceType.ASSESSMENT),
    ]);
    const isSchoolOwner = user.role === 'school_director' || user.role === 'school_admin';
    const teacherExcluded = isSchoolOwner
      ? { topicIds: [] as string[], videoIds: [] as string[], materialIds: [] as string[], assessmentIds: [] as string[] }
      : await this.getTeacherExcludedIdsForUser(
          userId,
          user.school_id,
          subjectId,
          subject.classId ?? undefined,
        );
    return {
      topicIds: [...new Set([...libraryTopicIds, ...teacherExcluded.topicIds])],
      videoIds: [...new Set([...libraryVideoIds, ...teacherExcluded.videoIds])],
      materialIds: [...new Set([...libraryMaterialIds, ...teacherExcluded.materialIds])],
      assessmentIds: [...new Set([...libraryAssessmentIds, ...teacherExcluded.assessmentIds])],
    };
  }

  /**
   * Get resource IDs excluded by teachers for this user or for this subject's library class in this school.
   * Exclusions are scoped to schoolId so they only affect students in this school.
   */
  private async getTeacherExcludedIdsForUser(
    userId: string,
    schoolId: string,
    subjectId: string,
    subjectLibraryClassId?: string,
  ): Promise<{ topicIds: string[]; videoIds: string[]; materialIds: string[]; assessmentIds: string[] }> {
    const orConditions: Array<{ studentId: string } | { libraryClassId: string; studentId: null }> = [{ studentId: userId }];
    if (subjectLibraryClassId) {
      orConditions.push({ libraryClassId: subjectLibraryClassId, studentId: null });
    }
    const rows = await this.prisma.teacherResourceExclusion.findMany({
      where: { schoolId, subjectId, OR: orConditions },
      select: { resourceType: true, resourceId: true },
    });
    const topicIds: string[] = [];
    const videoIds: string[] = [];
    const materialIds: string[] = [];
    const assessmentIds: string[] = [];
    for (const r of rows) {
      if (r.resourceType === 'TOPIC') topicIds.push(r.resourceId);
      else if (r.resourceType === 'VIDEO') videoIds.push(r.resourceId);
      else if (r.resourceType === 'MATERIAL') materialIds.push(r.resourceId);
      else if (r.resourceType === 'ASSESSMENT') assessmentIds.push(r.resourceId);
    }
    return { topicIds, videoIds, materialIds, assessmentIds };
  }

  /**
   * Bulk check access for multiple resources
   */
  async checkBulkAccess(
    userId: string,
    resources: Array<{ resourceType: LibraryResourceType; resourceId: string }>,
  ): Promise<Map<string, AccessCheckResult>> {
    const results = new Map<string, AccessCheckResult>();

    for (const resource of resources) {
      const key = `${resource.resourceType}:${resource.resourceId}`;
      const access = await this.checkUserAccess(
        userId,
        resource.resourceType,
        resource.resourceId,
      );
      results.set(key, access);
    }

    return results;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Check Level 1: Library → School access
   */
  private async checkLibrarySchoolAccess(
    schoolId: string,
    resourceType: LibraryResourceType,
    resourceId: string,
  ): Promise<{ hasAccess: boolean; accessLevel?: string; libraryAccessId?: string }> {
    const where: any = {
      schoolId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    // Check for exact resource match or parent access
    const accessChecks: any[] = [];

    switch (resourceType) {
      case LibraryResourceType.VIDEO: {
        accessChecks.push(
          { ...where, resourceType: LibraryResourceType.ALL },
          { ...where, resourceType: LibraryResourceType.VIDEO, videoId: resourceId },
        );
        const video = await this.prisma.libraryVideoLesson.findUnique({
          where: { id: resourceId },
          select: { subjectId: true, topicId: true },
        });
        if (video?.subjectId) {
          accessChecks.push({ ...where, resourceType: LibraryResourceType.SUBJECT, subjectId: video.subjectId });
        }
        if (video?.topicId) {
          accessChecks.push({ ...where, resourceType: LibraryResourceType.TOPIC, topicId: video.topicId });
        }
        break;
      }
      case LibraryResourceType.MATERIAL:
        accessChecks.push(
          { ...where, resourceType: LibraryResourceType.ALL },
          { ...where, resourceType: LibraryResourceType.MATERIAL, materialId: resourceId },
        );
        break;
      case LibraryResourceType.ASSESSMENT:
        accessChecks.push(
          { ...where, resourceType: LibraryResourceType.ALL },
          { ...where, resourceType: LibraryResourceType.ASSESSMENT, assessmentId: resourceId },
        );
        break;
      case LibraryResourceType.TOPIC:
        accessChecks.push(
          { ...where, resourceType: LibraryResourceType.ALL },
          { ...where, resourceType: LibraryResourceType.TOPIC, topicId: resourceId },
        );
        break;
      case LibraryResourceType.SUBJECT:
        accessChecks.push(
          { ...where, resourceType: LibraryResourceType.ALL },
          { ...where, resourceType: LibraryResourceType.SUBJECT, subjectId: resourceId },
        );
        break;
      default:
        accessChecks.push({ ...where, resourceType: LibraryResourceType.ALL });
    }

    for (const check of accessChecks) {
      const access = await this.prisma.libraryResourceAccess.findFirst({
        where: check,
        select: {
          id: true,
          accessLevel: true,
        },
      });

      if (access) {
        return {
          hasAccess: true,
          accessLevel: access.accessLevel,
          libraryAccessId: access.id,
        };
      }
    }

    return { hasAccess: false };
  }

  /**
   * Check Level 2: School → User/Role/Class access
   */
  private async checkSchoolUserAccess(
    schoolId: string,
    userId: string,
    userRole: string,
    classId: string | null | undefined,
    libraryAccessId: string,
    resourceType: LibraryResourceType,
    resourceId: string,
  ): Promise<{ hasAccess: boolean; accessLevel?: string; schoolAccessId?: string }> {
    const where: any = {
      schoolId,
      libraryResourceAccessId: libraryAccessId,
      isActive: true,
      OR: [
        { userId },
        { roleType: userRole },
        { classId: classId || undefined },
      ],
    };

    // Filter out expired access
    where.AND = [
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    ];

    const access = await this.prisma.schoolResourceAccess.findFirst({
      where,
      select: {
        id: true,
        accessLevel: true,
      },
    });

    if (access) {
      return {
        hasAccess: true,
        accessLevel: access.accessLevel,
        schoolAccessId: access.id,
      };
    }

    // No SchoolResourceAccess: library granted school → everyone in school gets access (no school restriction)
    const libraryGrant = await this.prisma.libraryResourceAccess.findUnique({
      where: { id: libraryAccessId },
      select: { accessLevel: true },
    });
    if (libraryGrant) {
      return {
        hasAccess: true,
        accessLevel: libraryGrant.accessLevel,
        schoolAccessId: undefined,
      };
    }

    return { hasAccess: false };
  }

  /**
   * Check Level 3: Teacher → Student access
   */
  private async checkTeacherStudentAccess(
    schoolId: string,
    studentId: string,
    classId: string | null | undefined,
    schoolAccessId: string,
    resourceType: LibraryResourceType,
    resourceId: string,
  ): Promise<{ hasAccess: boolean; hasRestrictions: boolean; accessLevel?: string }> {
    // Check if any teacher has set restrictions for this student/class
    const restrictions = await this.prisma.teacherResourceAccess.findMany({
      where: {
        schoolId,
        schoolResourceAccessId: schoolAccessId,
        isActive: true,
        OR: [
          { studentId },
          { classId: classId || undefined },
        ],
      },
    });

    if (restrictions.length === 0) {
      // No teacher restrictions, student has access based on school grants
      return { hasAccess: true, hasRestrictions: false };
    }

    // Teacher has set restrictions, check if student has explicit access
    const access = restrictions.find((r) => {
      // Check if this restriction grants access to the specific resource
      return true; // Simplified - would need more specific logic
    });

    if (access) {
      return {
        hasAccess: true,
        hasRestrictions: true,
        accessLevel: access.accessLevel,
      };
    }

    return { hasAccess: false, hasRestrictions: true };
  }

  /**
   * Determine the most restrictive access level from a chain of grants
   */
  private determineAccessLevel(levels: (string | undefined)[]): string {
    const validLevels = levels.filter((l) => l !== undefined);

    if (validLevels.includes('LIMITED')) return 'LIMITED';
    if (validLevels.includes('READ_ONLY')) return 'READ_ONLY';
    return 'FULL';
  }
}
