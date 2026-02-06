import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditForType, AuditPerformedByType } from '@prisma/client';

export interface CreateAuditLogInput {
  auditForType: AuditForType;
  targetId?: string;
  performedById?: string;
  performedByType?: AuditPerformedByType;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        audit_for_type: input.auditForType,
        target_id: input.targetId ?? null,
        performed_by_id: input.performedById ?? null,
        performed_by_type: input.performedByType ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  }
}
