import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../shared/services/s3.service';
import * as colors from 'colors';
import {
  buildReportCardPdf,
  type ReportCardTemplateData,
} from '../common/email-templates/report-card-template';

/** school_icon from DB: { url?: string; key?: string; ... } — resolve to buffer for PDF embedding */
async function getSchoolLogoBuffer(
  s3Service: S3Service,
  schoolIcon: unknown,
): Promise<Buffer | null> {
  if (!schoolIcon || typeof schoolIcon !== 'object') return null;
  const obj = schoolIcon as Record<string, unknown>;
  const url = typeof obj.url === 'string' ? obj.url : null;
  const key = typeof obj.key === 'string' ? obj.key : null;

  const tryFetch = (u: string) =>
    fetch(u)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('Fetch failed'))))
      .then((ab) => Buffer.from(ab));

  if (key) {
    const buf = await s3Service.getObjectAsBuffer(key).catch(() => null);
    if (buf) return buf;
  }
  if (url) {
    const buf = await tryFetch(url).catch(() => null);
    if (buf) return buf;
  }
  return null;
}

@Injectable()
export class ResultService {
  private readonly logger = new Logger(ResultService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service,
  ) {}

  /**
   * Returns a PDF buffer of the student report card for the given student and academic session.
   * Authorized if: (1) school user and result.school_id === user.school_id, or
   * (2) library user and school.platformId === user.platform_id.
   */
  async getResultPdf(
    user: { sub: string; email: string; school_id?: string; platform_id?: string },
    studentId: string,
    academicSessionId: string,
  ): Promise<Buffer> {
    if (!studentId || !academicSessionId) {
      throw new BadRequestException('studentId and academicSessionId are required');
    }

    const hasSchoolId = user.school_id != null;
    const hasPlatformId = user.platform_id != null;
    if (!hasSchoolId && !hasPlatformId) {
      this.logger.warn(colors.yellow('Result PDF: user has neither school_id nor platform_id'));
      throw new ForbiddenException('You do not have access to this result');
    }

    const includeRelation = {
      school: {
        select: {
          id: true,
          school_name: true,
          school_address: true,
          school_phone: true,
          school_email: true,
          school_icon: true,
          platformId: true,
        },
      },
      student: {
        select: {
          id: true,
          user_id: true,
          current_class_id: true,
          user: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      },
      class: {
        select: {
          id: true,
          name: true,
          classId: true,
        },
      },
      academicSession: {
        select: {
          id: true,
          academic_year: true,
          term: true,
        },
      },
    } as const;

    // Result.student_id stores Student.id (not User.id). Accept either: try Student.id first, then resolve as User.id.
    let result = await this.prisma.result.findFirst({
      where: {
        student_id: studentId,
        academic_session_id: academicSessionId,
        released_by_school_admin: true,
      },
      include: includeRelation,
    });

    if (!result) {
      const session = await this.prisma.academicSession.findFirst({
        where: { id: academicSessionId },
        select: { school_id: true },
      });
      if (session) {
        const studentByUserId = await this.prisma.student.findFirst({
          where: {
            user_id: studentId,
            school_id: session.school_id,
            academic_session_id: academicSessionId,
            status: 'active',
          },
          select: { id: true },
        });
        if (studentByUserId) {
          result = await this.prisma.result.findFirst({
            where: {
              student_id: studentByUserId.id,
              academic_session_id: academicSessionId,
              released_by_school_admin: true,
            },
            include: includeRelation,
          });
        }
      }
    }

    if (!result) {
      this.logger.warn(
        colors.yellow(
          `Result PDF: no released result for student ${studentId} session ${academicSessionId}`,
        ),
      );
      throw new NotFoundException('Result not found or not released for this student and session');
    }

    if (hasSchoolId && result.school_id !== user.school_id) {
      throw new ForbiddenException('You do not have access to this result');
    }
    if (hasPlatformId && result.school.platformId !== user.platform_id) {
      throw new ForbiddenException('You do not have access to this result');
    }

    const schoolIcon = result.school.school_icon as unknown;
    const schoolLogoBuffer = await getSchoolLogoBuffer(this.s3Service, schoolIcon);

    const templateData: ReportCardTemplateData = {
      school: {
        school_name: result.school.school_name,
        school_address: result.school.school_address,
        school_phone: result.school.school_phone,
        school_email: result.school.school_email,
        school_logo: schoolLogoBuffer ?? null,
      },
      class: result.class,
      academicSession: {
        academic_year: result.academicSession.academic_year,
        term: result.academicSession.term,
      },
      total_students: result.total_students,
      class_position: result.class_position,
      subject_results: (result.subject_results as ReportCardTemplateData['subject_results']) ?? [],
      total_score: result.total_score,
      overall_percentage: result.overall_percentage,
      overall_grade: result.overall_grade,
    };
    return buildReportCardPdf(templateData);
  }
}
