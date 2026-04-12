import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import { AuditForType, Prisma } from '@prisma/client';

@Injectable()
export class DirectorAuditService {
  constructor(private readonly prisma: PrismaService) {}

  private async schoolIdForUser(userSub: string): Promise<string | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: userSub },
      select: { school_id: true },
    });
    return u?.school_id ?? null;
  }

  async listAuditLogs(
    userSub: string,
    query: {
      page?: number;
      limit?: number;
      audit_for_type?: string;
      from?: string;
      to?: string;
    },
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForUser(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      school_id: schoolId,
    };

    if (query.audit_for_type) {
      const allowed = Object.values(AuditForType) as string[];
      if (!allowed.includes(query.audit_for_type)) {
        return new ApiResponse(false, 'Invalid audit_for_type filter', null);
      }
      where.audit_for_type = query.audit_for_type as AuditForType;
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        where.createdAt.lte = new Date(query.to);
      }
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const userIds = [
      ...new Set(
        logs.map((l) => l.performed_by_id).filter((id): id is string =>
          Boolean(id),
        ),
      ),
    ];

    const users =
      userIds.length > 0
        ? await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          })
        : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = logs.map((l) => ({
      id: l.id,
      audit_for_type: l.audit_for_type,
      target_id: l.target_id,
      metadata: l.metadata,
      createdAt: l.createdAt,
      performed_by_id: l.performed_by_id,
      performed_by: l.performed_by_id
        ? userMap.get(l.performed_by_id) ?? {
            id: l.performed_by_id,
            first_name: null as string | null,
            last_name: null as string | null,
            email: null as string | null,
          }
        : null,
    }));

    const total_pages = Math.max(1, Math.ceil(total / limit));

    return new ApiResponse(true, 'Audit logs retrieved', {
      data,
      pagination: {
        page,
        limit,
        total,
        total_pages,
      },
    });
  }
}
