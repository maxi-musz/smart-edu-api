import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';
import { AuditService } from '../../../audit/audit.service';
import {
  AuditForType,
  AuditPerformedByType,
  AcademicSessionStatus,
  Prisma,
} from '@prisma/client';
import { ApiResponse } from 'src/shared/helper-functions/response';
import {
  AssignStudentsClassDto,
  DirectorCreateAcademicSessionDto,
  DirectorUpdateAcademicSessionDto,
  ManagementDashboardQueryDto,
  PreviewProgressionDto,
  StudentIdsBodyDto,
} from './dto/management.dto';
import { UpdateAcademicSessionDto } from '../../../academic-session/dto/update-academic-session.dto';

const STUDENT_MOVE_AUDIT: AuditForType[] = [
  'management_student_promote',
  'management_student_demote',
  'management_student_bulk_assign_class',
];

@Injectable()
export class ManagementService {
  /** Longer timeouts for large Prisma batch transactions (capped). */
  private prismaBulkTransactionOptions(operationCount: number): {
    maxWait: number;
    timeout: number;
  } {
    const n = Math.max(1, operationCount);
    const timeout = Math.min(180_000, 8_000 + n * 150);
    return { maxWait: 20_000, timeout };
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService,
    private readonly auditService: AuditService,
  ) {}

  private async schoolIdForUser(userSub: string): Promise<string | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: userSub },
      select: { school_id: true },
    });
    return u?.school_id ?? null;
  }

  async getDashboard(
    userSub: string,
    query: ManagementDashboardQueryDto,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const sessionLimit = Math.min(
      50,
      Math.max(1, Number(query.session_limit) || 5),
    );
    const auditLimit = Math.min(
      100,
      Math.max(1, Number(query.audit_limit) || 10),
    );

    const currentRes =
      await this.academicSessionService.getCurrentSession(schoolId);

    const sessionWhere: Record<string, unknown> = { school_id: schoolId };
    if (query.academic_year) {
      sessionWhere.academic_year = {
        contains: query.academic_year,
        mode: 'insensitive',
      };
    }
    if (query.term) {
      sessionWhere.term = query.term;
    }
    if (query.status) {
      sessionWhere.status = query.status;
    }

    const [recentSessions, totalSessions, recentMoves, currentSessionId] =
      await Promise.all([
        this.prisma.academicSession.findMany({
          where: sessionWhere,
          orderBy: { start_date: 'desc' },
          take: sessionLimit,
          select: {
            id: true,
            academic_year: true,
            term: true,
            start_year: true,
            end_year: true,
            start_date: true,
            end_date: true,
            status: true,
            is_current: true,
          },
        }),
        this.prisma.academicSession.count({ where: { school_id: schoolId } }),
        this.prisma.auditLog.findMany({
          where: {
            school_id: schoolId,
            audit_for_type: { in: STUDENT_MOVE_AUDIT },
          },
          orderBy: { createdAt: 'desc' },
          take: auditLimit,
          select: {
            id: true,
            audit_for_type: true,
            metadata: true,
            createdAt: true,
            performed_by_id: true,
          },
        }),
        this.academicSessionService.getCurrentSessionId(schoolId),
      ]);

    let studentsInCurrent = 0;
    let classesInCurrent = 0;
    if (currentSessionId) {
      [studentsInCurrent, classesInCurrent] = await Promise.all([
        this.prisma.student.count({
          where: {
            school_id: schoolId,
            academic_session_id: currentSessionId,
          },
        }),
        this.prisma.class.count({
          where: {
            schoolId,
          },
        }),
      ]);
    }

    return new ApiResponse(true, 'Management dashboard', {
      current_session: currentRes.success ? currentRes.data : null,
      recent_sessions: recentSessions,
      total_sessions: totalSessions,
      counts: {
        students_in_current_session: studentsInCurrent,
        classes_in_current_session: classesInCurrent,
      },
      recent_student_moves: recentMoves,
    });
  }

  async listSessions(
    userSub: string,
    page = 1,
    limit = 10,
    search?: string,
    term?: string,
    status?: AcademicSessionStatus,
    is_current?: boolean,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    return this.academicSessionService.findAll(
      {
        school_id: schoolId,
        term: term as any,
        status: status as any,
        is_current,
      },
      {
        page,
        limit,
        search,
        // Current session first, then newest academic years (not raw calendar start_date).
        orderBy: [
          { is_current: 'desc' },
          { start_year: 'desc' },
          { end_year: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    );
  }

  async createSession(
    userSub: string,
    dto: DirectorCreateAcademicSessionDto,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const res = await this.academicSessionService.create({
      ...dto,
      school_id: schoolId,
    });

    if (res.success && res.data?.id) {
      await this.auditService.log({
        auditForType: 'management_academic_session_create',
        targetId: res.data.id,
        schoolId,
        performedById: userSub,
        performedByType: AuditPerformedByType.school_user,
        metadata: {
          academic_year: dto.academic_year,
          term: dto.term,
        },
      });
    }

    return res;
  }

  async updateSession(
    userSub: string,
    sessionId: string,
    dto: DirectorUpdateAcademicSessionDto,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const owned = await this.prisma.academicSession.findFirst({
      where: { id: sessionId, school_id: schoolId },
      select: { id: true },
    });
    if (!owned) {
      return new ApiResponse(false, 'Academic session not found', null);
    }

    const updatePayload: UpdateAcademicSessionDto = { ...dto };
    const res = await this.academicSessionService.update(
      sessionId,
      updatePayload,
    );

    if (res.success) {
      await this.auditService.log({
        auditForType: 'management_academic_session_update',
        targetId: sessionId,
        schoolId,
        performedById: userSub,
        performedByType: AuditPerformedByType.school_user,
        metadata: dto as unknown as Prisma.InputJsonValue,
      });
    }

    return res;
  }

  async deleteSession(
    userSub: string,
    sessionId: string,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const owned = await this.prisma.academicSession.findFirst({
      where: { id: sessionId, school_id: schoolId },
      select: { id: true },
    });
    if (!owned) {
      return new ApiResponse(false, 'Academic session not found', null);
    }

    const res = await this.academicSessionService.remove(sessionId);

    if (res.success) {
      await this.auditService.log({
        auditForType: 'management_academic_session_delete',
        targetId: sessionId,
        schoolId,
        performedById: userSub,
        performedByType: AuditPerformedByType.school_user,
        metadata: {},
      });
    }

    return res;
  }

  async setCurrentSession(
    userSub: string,
    sessionId: string,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const owned = await this.prisma.academicSession.findFirst({
      where: { id: sessionId, school_id: schoolId },
      select: { id: true },
    });
    if (!owned) {
      return new ApiResponse(false, 'Academic session not found', null);
    }

    const res = await this.academicSessionService.update(sessionId, {
      is_current: true,
      status: 'active',
    });

    if (res.success) {
      await this.auditService.log({
        auditForType: 'management_set_current_session',
        targetId: sessionId,
        schoolId,
        performedById: userSub,
        performedByType: AuditPerformedByType.school_user,
        metadata: {},
      });
    }

    return res;
  }

  async getClassLadder(userSub: string): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const currentRes =
      await this.academicSessionService.getCurrentSession(schoolId);
    if (!currentRes.success || !currentRes.data) {
      return new ApiResponse(
        false,
        'No current academic session found for the school',
        null,
      );
    }

    const classes = await this.prisma.class.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        display_order: true,
        classId: true,
        is_graduates: true,
      },
      orderBy: [{ display_order: 'asc' }, { classId: 'asc' }],
    });

    return new ApiResponse(true, 'Class ladder', { classes });
  }

  /** Teaching classes only — excludes the school’s Graduates sink class. */
  private async orderedTeachingClassIds(schoolId: string): Promise<string[]> {
    const rows = await this.prisma.class.findMany({
      where: { schoolId, is_graduates: false },
      select: { id: true },
      orderBy: [{ display_order: 'asc' }, { classId: 'asc' }],
    });
    return rows.map((r) => r.id);
  }

  /**
   * Ensures a single Graduates class exists for the school (promotion target after last teaching class).
   */
  private async ensureGraduatesClass(
    db: PrismaService | Prisma.TransactionClient,
    schoolId: string,
  ): Promise<{ id: string; name: string }> {
    const existing = await db.class.findFirst({
      where: { schoolId, is_graduates: true },
      select: { id: true, name: true },
    });
    if (existing) {
      return existing;
    }

    const maxAgg = await db.class.aggregate({
      where: { schoolId, is_graduates: false },
      _max: { display_order: true },
    });
    const display_order = (maxAgg._max.display_order ?? -1) + 1;

    return db.class.create({
      data: {
        schoolId,
        name: 'Graduates',
        display_order,
        is_graduates: true,
      },
      select: { id: true, name: true },
    });
  }

  private indexInLadder(
    ladder: string[],
    classId: string | null,
  ): number {
    if (!classId) {
      return -1;
    }
    return ladder.indexOf(classId);
  }

  async assignStudentsToClass(
    userSub: string,
    dto: AssignStudentsClassDto,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const targetClass = await this.prisma.class.findFirst({
      where: {
        id: dto.target_class_id,
        schoolId,
      },
      select: { id: true, name: true },
    });

    if (!targetClass) {
      return new ApiResponse(false, 'Target class not found', null);
    }

    const students = await this.prisma.student.findMany({
      where: {
        id: { in: dto.student_ids },
        school_id: schoolId,
      },
      select: {
        id: true,
        current_class_id: true,
      },
    });

    if (students.length !== dto.student_ids.length) {
      return new ApiResponse(
        false,
        'One or more students were not found in this school',
        null,
      );
    }

    const changes = students.map((s) => ({
      student_id: s.id,
      from_class_id: s.current_class_id,
      to_class_id: targetClass.id,
    }));

    const assignCount = dto.student_ids.length;
    await this.prisma.$transaction(
      async (tx) => {
        for (const sid of dto.student_ids) {
          await tx.student.update({
            where: { id: sid },
            data: { current_class_id: targetClass.id },
          });
        }
      },
      this.prismaBulkTransactionOptions(assignCount),
    );

    await this.auditService.log({
      auditForType: 'management_student_bulk_assign_class',
      targetId: targetClass.id,
      schoolId,
      performedById: userSub,
      performedByType: AuditPerformedByType.school_user,
      metadata: {
        target_class_name: targetClass.name,
        changes,
      },
    });

    return new ApiResponse(true, 'Students assigned to class', {
      updated: dto.student_ids.length,
      target_class_id: targetClass.id,
    });
  }

  async promoteStudentsNext(
    userSub: string,
    dto: StudentIdsBodyDto,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const students = await this.prisma.student.findMany({
      where: {
        id: { in: dto.student_ids },
        school_id: schoolId,
      },
      select: {
        id: true,
        current_class_id: true,
        academic_session_id: true,
      },
    });

    if (students.length !== dto.student_ids.length) {
      return new ApiResponse(
        false,
        'One or more students were not found in this school',
        null,
      );
    }

    const changes: {
      student_id: string;
      from_class_id: string | null;
      to_class_id: string;
      academic_session_id: string;
      is_graduation: boolean;
    }[] = [];

    const teachingLadder = await this.orderedTeachingClassIds(schoolId);

    const currentClassIds = [
      ...new Set(
        students.map((s) => s.current_class_id).filter((id): id is string =>
          Boolean(id),
        ),
      ),
    ];
    const classFlags = await this.prisma.class.findMany({
      where: { id: { in: currentClassIds }, schoolId },
      select: { id: true, is_graduates: true },
    });
    const graduatesClassIds = new Set(
      classFlags.filter((c) => c.is_graduates).map((c) => c.id),
    );

    for (const s of students) {
      if (s.current_class_id && graduatesClassIds.has(s.current_class_id)) {
        return new ApiResponse(
          false,
          `Student ${s.id} is already in the Graduates class`,
          null,
        );
      }
      const ladder = teachingLadder;
      const idx = this.indexInLadder(ladder, s.current_class_id);
      if (idx === -1 || !s.current_class_id) {
        return new ApiResponse(
          false,
          `Student ${s.id} has no current class in the teaching ladder`,
          null,
        );
      }
      if (ladder.length === 0) {
        return new ApiResponse(
          false,
          `No teaching classes configured for this school`,
          null,
        );
      }
      if (idx === ladder.length - 1) {
        changes.push({
          student_id: s.id,
          from_class_id: s.current_class_id,
          to_class_id: '',
          academic_session_id: s.academic_session_id,
          is_graduation: true,
        });
        continue;
      }
      const nextId = ladder[idx + 1];
      changes.push({
        student_id: s.id,
        from_class_id: s.current_class_id,
        to_class_id: nextId,
        academic_session_id: s.academic_session_id,
        is_graduation: false,
      });
    }

    await this.prisma.$transaction(
      async (tx) => {
        let graduatesClassId: string | null = null;
        if (changes.some((c) => c.is_graduation)) {
          const g = await this.ensureGraduatesClass(tx, schoolId);
          graduatesClassId = g.id;
        }

        for (const c of changes) {
          const toId = c.is_graduation
            ? graduatesClassId!
            : c.to_class_id;
          await tx.student.update({
            where: { id: c.student_id },
            data: { current_class_id: toId },
          });
        }

        const gradRows = changes
          .filter((c) => c.is_graduation)
          .map((c) => ({
            student_id: c.student_id,
            academic_session_id: c.academic_session_id,
            from_class_id: c.from_class_id,
          }));
        if (gradRows.length > 0) {
          await tx.studentGraduation.createMany({
            data: gradRows,
            skipDuplicates: true,
          });
        }
      },
      this.prismaBulkTransactionOptions(changes.length),
    );

    const gradRow = await this.prisma.class.findFirst({
      where: { schoolId, is_graduates: true },
      select: { id: true },
    });

    const changesOut = changes.map((c) => ({
      student_id: c.student_id,
      from_class_id: c.from_class_id,
      to_class_id: c.is_graduation
        ? (gradRow?.id ?? '')
        : c.to_class_id,
      is_graduation: c.is_graduation,
    }));

    await this.auditService.log({
      auditForType: 'management_student_promote',
      schoolId,
      performedById: userSub,
      performedByType: AuditPerformedByType.school_user,
      metadata: { changes: changesOut },
    });

    return new ApiResponse(true, 'Students promoted', {
      count: changes.length,
      changes: changesOut,
    });
  }

  /**
   * Dry-run promote/demote: same rules as apply, returns human-readable rows for confirmation UI.
   */
  async previewProgression(
    userSub: string,
    dto: PreviewProgressionDto,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const students = await this.prisma.student.findMany({
      where: {
        id: { in: dto.student_ids },
        school_id: schoolId,
      },
      select: {
        id: true,
        current_class_id: true,
        academic_session_id: true,
        user: {
          select: { first_name: true, last_name: true },
        },
      },
    });

    if (students.length !== dto.student_ids.length) {
      return new ApiResponse(
        false,
        'One or more students were not found in this school',
        null,
      );
    }

    const teachingLadderPreview = await this.orderedTeachingClassIds(schoolId);

    const currentClassIds = [
      ...new Set(
        students.map((s) => s.current_class_id).filter((id): id is string =>
          Boolean(id),
        ),
      ),
    ];
    const classMeta = await this.prisma.class.findMany({
      where: { id: { in: currentClassIds }, schoolId },
      select: { id: true, name: true, is_graduates: true },
    });
    const graduatesByClassId = new Map(
      classMeta.map((c) => [c.id, c.is_graduates]),
    );

    const rawChanges: {
      student_id: string;
      student_name: string;
      from_class_id: string | null;
      to_class_id: string;
      to_graduation: boolean;
    }[] = [];

    for (const s of students) {
      const studentName =
        `${s.user.first_name ?? ''} ${s.user.last_name ?? ''}`.trim() ||
        'Student';
      const ladder = teachingLadderPreview;
      const inGrads =
        s.current_class_id &&
        graduatesByClassId.get(s.current_class_id) === true;

      if (dto.action === 'promote') {
        if (inGrads) {
          return new ApiResponse(
            false,
            `${studentName} is already in the Graduates class`,
            null,
          );
        }
        const idx = this.indexInLadder(ladder, s.current_class_id);
        if (idx === -1 || !s.current_class_id) {
          return new ApiResponse(
            false,
            `${studentName} has no current class in the teaching ladder`,
            null,
          );
        }
        if (ladder.length === 0) {
          return new ApiResponse(
            false,
            `No teaching classes configured for this school`,
            null,
          );
        }
        if (idx === ladder.length - 1) {
          rawChanges.push({
            student_id: s.id,
            student_name: studentName,
            from_class_id: s.current_class_id,
            to_class_id: '',
            to_graduation: true,
          });
          continue;
        }
        rawChanges.push({
          student_id: s.id,
          student_name: studentName,
          from_class_id: s.current_class_id,
          to_class_id: ladder[idx + 1],
          to_graduation: false,
        });
      } else {
        if (inGrads) {
          if (ladder.length === 0) {
            return new ApiResponse(
              false,
              `No teaching classes configured to demote into`,
              null,
            );
          }
          const bottomTeachingId = ladder[ladder.length - 1];
          rawChanges.push({
            student_id: s.id,
            student_name: studentName,
            from_class_id: s.current_class_id,
            to_class_id: bottomTeachingId,
            to_graduation: false,
          });
          continue;
        }
        const idx = this.indexInLadder(ladder, s.current_class_id);
        if (idx === -1 || !s.current_class_id) {
          return new ApiResponse(
            false,
            `${studentName} has no current class in the promotion ladder`,
            null,
          );
        }
        if (idx <= 0) {
          return new ApiResponse(
            false,
            `${studentName} is already in the lowest teaching class`,
            null,
          );
        }
        rawChanges.push({
          student_id: s.id,
          student_name: studentName,
          from_class_id: s.current_class_id,
          to_class_id: ladder[idx - 1],
          to_graduation: false,
        });
      }
    }

    const gradClassRow = await this.prisma.class.findFirst({
      where: {
        schoolId,
        is_graduates: true,
      },
      select: { id: true, name: true },
    });

    const classIds = new Set<string>();
    for (const c of rawChanges) {
      if (c.from_class_id) classIds.add(c.from_class_id);
      if (c.to_class_id) classIds.add(c.to_class_id);
    }

    const classRows = await this.prisma.class.findMany({
      where: { id: { in: [...classIds] }, schoolId: schoolId },
      select: { id: true, name: true },
    });
    const nameById = new Map(classRows.map((r) => [r.id, r.name]));

    const previews = rawChanges.map((c) => {
      const toName = c.to_graduation
        ? (gradClassRow?.name ?? 'Graduates')
        : (nameById.get(c.to_class_id) ?? 'Unknown class');
      const existingGradId = gradClassRow?.id;
      return {
        student_id: c.student_id,
        student_name: c.student_name,
        from_class_id: c.from_class_id,
        from_class_name: c.from_class_id
          ? (nameById.get(c.from_class_id) ?? 'Unknown class')
          : '—',
        to_class_id: c.to_graduation ? (existingGradId ?? '') : c.to_class_id,
        to_class_name: toName,
      };
    });

    return new ApiResponse(true, 'Preview ready', {
      action: dto.action,
      count: previews.length,
      previews,
    });
  }

  async demoteStudentsPrevious(
    userSub: string,
    dto: StudentIdsBodyDto,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const students = await this.prisma.student.findMany({
      where: {
        id: { in: dto.student_ids },
        school_id: schoolId,
      },
      select: {
        id: true,
        current_class_id: true,
        academic_session_id: true,
      },
    });

    if (students.length !== dto.student_ids.length) {
      return new ApiResponse(
        false,
        'One or more students were not found in this school',
        null,
      );
    }

    const changes: {
      student_id: string;
      from_class_id: string | null;
      to_class_id: string;
    }[] = [];

    const teachingLadderDemote = await this.orderedTeachingClassIds(schoolId);

    const curIds = [
      ...new Set(
        students.map((s) => s.current_class_id).filter((id): id is string =>
          Boolean(id),
        ),
      ),
    ];
    const curFlags = await this.prisma.class.findMany({
      where: { id: { in: curIds }, schoolId },
      select: { id: true, is_graduates: true },
    });
    const isGradClass = new Set(
      curFlags.filter((c) => c.is_graduates).map((c) => c.id),
    );

    for (const s of students) {
      const ladder = teachingLadderDemote;
      const fromGrads =
        s.current_class_id && isGradClass.has(s.current_class_id);

      if (fromGrads) {
        if (ladder.length === 0) {
          return new ApiResponse(
            false,
            `No teaching classes configured for this school`,
            null,
          );
        }
        const bottomTeachingId = ladder[ladder.length - 1];
        changes.push({
          student_id: s.id,
          from_class_id: s.current_class_id,
          to_class_id: bottomTeachingId,
        });
        continue;
      }

      const idx = this.indexInLadder(ladder, s.current_class_id);
      if (idx === -1 || !s.current_class_id) {
        return new ApiResponse(
          false,
          `Student ${s.id} has no current class in the teaching ladder`,
          null,
        );
      }
      if (idx <= 0) {
        return new ApiResponse(
          false,
          `Student ${s.id} is already in the lowest teaching class`,
          null,
        );
      }
      const prevId = ladder[idx - 1];
      changes.push({
        student_id: s.id,
        from_class_id: s.current_class_id,
        to_class_id: prevId,
      });
    }

    const demotedFromGraduates = students.filter(
      (s) => s.current_class_id && isGradClass.has(s.current_class_id),
    );

    await this.prisma.$transaction(
      async (tx) => {
        for (const c of changes) {
          await tx.student.update({
            where: { id: c.student_id },
            data: { current_class_id: c.to_class_id },
          });
        }
        if (demotedFromGraduates.length > 0) {
          await tx.studentGraduation.deleteMany({
            where: {
              OR: demotedFromGraduates.map((s) => ({
                student_id: s.id,
                academic_session_id: s.academic_session_id,
              })),
            },
          });
        }
      },
      this.prismaBulkTransactionOptions(changes.length),
    );

    await this.auditService.log({
      auditForType: 'management_student_demote',
      schoolId,
      performedById: userSub,
      performedByType: AuditPerformedByType.school_user,
      metadata: { changes },
    });

    return new ApiResponse(true, 'Students demoted', {
      count: changes.length,
      changes,
    });
  }
}
