import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/shared/helper-functions/response';
import {
  DEFAULT_GRADE_THRESHOLDS,
  type GradeThreshold,
  attachDisplayMax,
  gradeFromMinThresholds,
} from 'src/shared/grading/school-percentage-grade';
import { UpdateSchoolGradeScaleDto } from './dto/grading-scale.dto';

@Injectable()
export class GradingScaleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Thresholds used for result calculations (defaults when no row exists).
   */
  async getResolvedBands(schoolId: string): Promise<GradeThreshold[]> {
    try {
      const row = await this.prisma.schoolGradeScale.findUnique({
        where: { school_id: schoolId },
      });
      if (!row) {
        return [...DEFAULT_GRADE_THRESHOLDS];
      }
      const parsed = this.parseBandsFromJson(row.bands);
      return parsed.length ? parsed : [...DEFAULT_GRADE_THRESHOLDS];
    } catch (e) {
      if (this.isMissingSchoolGradeScaleTable(e)) {
        return [...DEFAULT_GRADE_THRESHOLDS];
      }
      throw e;
    }
  }

  async getScaleForDirector(userSub: string): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForDirector(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    try {
      const row = await this.prisma.schoolGradeScale.findUnique({
        where: { school_id: schoolId },
      });

      const baseBands = row
        ? this.parseBandsFromJson(row.bands)
        : [...DEFAULT_GRADE_THRESHOLDS];

      const bands =
        baseBands.length > 0 ? baseBands : [...DEFAULT_GRADE_THRESHOLDS];

      const withMax = attachDisplayMax(bands);
      const displaySorted = [...withMax].sort(
        (a, b) => b.minInclusive - a.minInclusive,
      );

      return new ApiResponse(true, 'OK', {
        bands: displaySorted.map((b) => ({
          label: b.label,
          minInclusive: b.minInclusive,
          maxInclusive: Math.round(b.maxInclusive * 100) / 100,
        })),
        usesCustomScale: !!row,
        migrationPending: false,
      });
    } catch (e) {
      if (this.isMissingSchoolGradeScaleTable(e)) {
        const fallback = this.defaultScaleApiPayload();
        return new ApiResponse(true, 'OK', {
          ...fallback,
          migrationPending: true,
        });
      }
      throw e;
    }
  }

  async updateScale(
    userSub: string,
    dto: UpdateSchoolGradeScaleDto,
  ): Promise<ApiResponse<any>> {
    const schoolId = await this.schoolIdForDirector(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    const err = this.validateBands(dto.bands);
    if (err) {
      return new ApiResponse(false, err, null);
    }

    const normalized = this.normalizeBandInput(dto.bands);

    try {
      await this.prisma.schoolGradeScale.upsert({
        where: { school_id: schoolId },
        create: {
          school_id: schoolId,
          bands: normalized as unknown as Prisma.InputJsonValue,
        },
        update: {
          bands: normalized as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      if (this.isMissingSchoolGradeScaleTable(e)) {
        return new ApiResponse(
          false,
          'Saving a custom letter-grade scale is not available yet. You are still using the standard default scale.',
          null,
        );
      }
      throw e;
    }

    return this.getScaleForDirector(userSub);
  }

  async deleteScale(userSub: string): Promise<ApiResponse<null>> {
    const schoolId = await this.schoolIdForDirector(userSub);
    if (!schoolId) {
      return new ApiResponse(false, 'User not found', null);
    }

    try {
      await this.prisma.schoolGradeScale.deleteMany({
        where: { school_id: schoolId },
      });
    } catch (e) {
      if (this.isMissingSchoolGradeScaleTable(e)) {
        return new ApiResponse(
          true,
          'You are already using the standard default letter grades.',
          null,
        );
      }
      throw e;
    }

    return new ApiResponse(true, 'Grading scale reset to defaults', null);
  }

  /** When the migration has not been applied yet, expose the same defaults as the API. */
  private defaultScaleApiPayload(): {
    bands: Array<{
      label: string;
      minInclusive: number;
      maxInclusive: number;
    }>;
    usesCustomScale: boolean;
  } {
    const bands = [...DEFAULT_GRADE_THRESHOLDS];
    const withMax = attachDisplayMax(bands);
    const displaySorted = [...withMax].sort(
      (a, b) => b.minInclusive - a.minInclusive,
    );
    return {
      bands: displaySorted.map((b) => ({
        label: b.label,
        minInclusive: b.minInclusive,
        maxInclusive: Math.round(b.maxInclusive * 100) / 100,
      })),
      usesCustomScale: false,
    };
  }

  /** P2021: table/relation does not exist (migration not applied). */
  private isMissingSchoolGradeScaleTable(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: unknown }).code === 'P2021'
    );
  }

  private async schoolIdForDirector(userSub: string): Promise<string | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: userSub },
      select: { school_id: true, role: true },
    });
    if (!u?.school_id || u.role !== 'school_director') {
      return null;
    }
    return u.school_id;
  }

  private parseBandsFromJson(raw: unknown): GradeThreshold[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    const out: GradeThreshold[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const o = item as Record<string, unknown>;
      const label = typeof o.label === 'string' ? o.label.trim() : '';
      const min =
        typeof o.minInclusive === 'number' && !Number.isNaN(o.minInclusive)
          ? o.minInclusive
          : Number.NaN;
      if (!label || Number.isNaN(min)) {
        continue;
      }
      out.push({ label, minInclusive: min });
    }
    return out;
  }

  private normalizeBandInput(
    bands: { label: string; minInclusive: number }[],
  ): GradeThreshold[] {
    return bands.map((b) => ({
      label: b.label.trim(),
      minInclusive: b.minInclusive,
    }));
  }

  private validateBands(
    bands: { label: string; minInclusive: number }[],
  ): string | null {
    if (bands.length < 2) {
      return 'At least two grade bands are required';
    }

    const labels = new Set<string>();
    const mins = new Set<number>();

    for (const b of bands) {
      const label = (b.label || '').trim();
      if (!label || label.length > 12) {
        return 'Each grade label must be 1–12 characters';
      }
      if (labels.has(label)) {
        return `Duplicate grade label: ${label}`;
      }
      labels.add(label);

      const m = b.minInclusive;
      if (typeof m !== 'number' || Number.isNaN(m) || m < 0 || m > 100) {
        return 'Each minInclusive must be a number from 0 to 100';
      }
      if (mins.has(m)) {
        return 'Each minInclusive value must be unique';
      }
      mins.add(m);
    }

    if (!mins.has(0)) {
      return 'One band must have minInclusive 0 (lowest grade)';
    }

    const sortedAsc = [...bands].sort(
      (a, b) => a.minInclusive - b.minInclusive,
    );
    for (let i = 1; i < sortedAsc.length; i++) {
      if (sortedAsc[i]!.minInclusive <= sortedAsc[i - 1]!.minInclusive) {
        return 'minInclusive values must be unique and ordered';
      }
    }

    return null;
  }
}
