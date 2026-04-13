import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuditForType, AuditPerformedByType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { AuditService } from 'src/audit/audit.service';
import { normalizePagination, paginationMeta } from '../common/finance-helpers';
import { CreateScholarshipDto, ScholarshipQueryDto } from '../dto/scholarship.dto';

@Injectable()
export class ScholarshipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(schoolId: string, userId: string, dto: CreateScholarshipDto) {
    try {
      const scholarship = await this.prisma.scholarship.create({
        data: {
          school_id: schoolId,
          academic_session_id: dto.academic_session_id,
          name: dto.name,
          description: dto.description,
          sponsor: dto.sponsor,
          coverage_type: dto.coverage_type,
          coverage_value: dto.coverage_value,
          applicable_fee_ids: dto.applicable_fee_ids ?? [],
          max_beneficiaries: dto.max_beneficiaries,
          created_by: userId,
        },
      });

      await this.auditService.log({
        auditForType: AuditForType.finance_scholarship_create,
        targetId: scholarship.id,
        schoolId,
        performedById: userId,
        performedByType: AuditPerformedByType.school_user,
        metadata: { scholarship_name: dto.name, coverage_type: dto.coverage_type },
      });

      return ResponseHelper.created('Scholarship created successfully', scholarship);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      return ResponseHelper.error('Failed to create scholarship', error?.message);
    }
  }

  async findAll(schoolId: string, query: ScholarshipQueryDto) {
    try {
      const { page, limit, skip } = normalizePagination(query.page, query.limit);

      const where: Record<string, unknown> = { school_id: schoolId };
      if (query.academic_session_id) where.academic_session_id = query.academic_session_id;
      if (query.is_active !== undefined) where.is_active = query.is_active === 'true';

      const [scholarships, total] = await this.prisma.$transaction([
        this.prisma.scholarship.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            academicSession: { select: { academic_year: true, term: true } },
            _count: { select: { waivers: true } },
          },
        }),
        this.prisma.scholarship.count({ where }),
      ]);

      return ResponseHelper.success(
        'Scholarships retrieved successfully',
        scholarships,
        paginationMeta(total, page, limit),
      );
    } catch (error) {
      return ResponseHelper.error('Failed to retrieve scholarships', error?.message);
    }
  }

  async findOne(schoolId: string, scholarshipId: string) {
    try {
      const scholarship = await this.prisma.scholarship.findFirst({
        where: { id: scholarshipId, school_id: schoolId },
        include: {
          academicSession: { select: { academic_year: true, term: true } },
          _count: { select: { waivers: true } },
        },
      });

      if (!scholarship) {
        throw new NotFoundException('Scholarship not found');
      }

      return ResponseHelper.success('Scholarship retrieved successfully', scholarship);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      return ResponseHelper.error('Failed to retrieve scholarship', error?.message);
    }
  }

  async update(
    schoolId: string,
    scholarshipId: string,
    userId: string,
    dto: Partial<CreateScholarshipDto>,
  ) {
    try {
      const existing = await this.prisma.scholarship.findFirst({
        where: { id: scholarshipId, school_id: schoolId },
      });

      if (!existing) {
        throw new NotFoundException('Scholarship not found');
      }

      const scholarship = await this.prisma.scholarship.update({
        where: { id: scholarshipId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.sponsor !== undefined && { sponsor: dto.sponsor }),
          ...(dto.coverage_type !== undefined && { coverage_type: dto.coverage_type }),
          ...(dto.coverage_value !== undefined && { coverage_value: dto.coverage_value }),
          ...(dto.applicable_fee_ids !== undefined && { applicable_fee_ids: dto.applicable_fee_ids }),
          ...(dto.max_beneficiaries !== undefined && { max_beneficiaries: dto.max_beneficiaries }),
        },
      });

      return ResponseHelper.success('Scholarship updated successfully', scholarship);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      return ResponseHelper.error('Failed to update scholarship', error?.message);
    }
  }

  async deactivate(schoolId: string, scholarshipId: string, userId: string) {
    try {
      const existing = await this.prisma.scholarship.findFirst({
        where: { id: scholarshipId, school_id: schoolId },
      });

      if (!existing) {
        throw new NotFoundException('Scholarship not found');
      }

      const scholarship = await this.prisma.scholarship.update({
        where: { id: scholarshipId },
        data: { is_active: false },
      });

      return ResponseHelper.success('Scholarship deactivated successfully', scholarship);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      return ResponseHelper.error('Failed to deactivate scholarship', error?.message);
    }
  }
}
