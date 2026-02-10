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
  type ReportCardSubjectResult,
} from '../common/email-templates/report-card-template';

/** Set to true to pad PDF with sample subjects for preview; set to false for production. Not exposed to frontend. */
const ADD_SAMPLE_SUBJECTS_FOR_PDF_PREVIEW = false;

/** Sample subjects used when ADD_SAMPLE_SUBJECTS_FOR_PDF_PREVIEW is true. Not saved. */
const SAMPLE_SUBJECTS_FOR_PREVIEW: ReportCardSubjectResult[] = [
  { subject_name: 'English Language', ca1: 15, ca2: 58, total_score: 73, total_max_score: 100, percentage: 73, grade: 'B' },
  { subject_name: 'Mathematics', ca1: 18, ca2: 62, total_score: 80, total_max_score: 100, percentage: 80, grade: 'A' },
  { subject_name: 'Basic Science', ca1: 12, ca2: 48, total_score: 60, total_max_score: 100, percentage: 60, grade: 'C' },
  { subject_name: 'Social Studies', ca1: 14, ca2: 55, total_score: 69, total_max_score: 100, percentage: 69, grade: 'C' },
  { subject_name: 'Civic Education', ca1: 17, ca2: 58, total_score: 75, total_max_score: 100, percentage: 75, grade: 'B' },
  { subject_name: 'Computer Studies', ca1: 19, ca2: 68, total_score: 87, total_max_score: 100, percentage: 87, grade: 'A' },
  { subject_name: 'Agricultural Science', ca1: 13, ca2: 52, total_score: 65, total_max_score: 100, percentage: 65, grade: 'C' },
  { subject_name: 'Business Studies', ca1: 16, ca2: 60, total_score: 76, total_max_score: 100, percentage: 76, grade: 'B' },
  { subject_name: 'Creative Arts', ca1: 18, ca2: 64, total_score: 82, total_max_score: 100, percentage: 82, grade: 'A' },
  { subject_name: 'Home Economics', ca1: 15, ca2: 55, total_score: 70, total_max_score: 100, percentage: 70, grade: 'B' },
  { subject_name: 'Physical Education', ca1: 17, ca2: 61, total_score: 78, total_max_score: 100, percentage: 78, grade: 'B' },
];

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

    let subjectResults: ReportCardTemplateData['subject_results'] =
      (result.subject_results as ReportCardTemplateData['subject_results']) ?? [];
    if (ADD_SAMPLE_SUBJECTS_FOR_PDF_PREVIEW) {
      const real = subjectResults;
      const needed = Math.max(0, 12 - real.length);
      const samples = SAMPLE_SUBJECTS_FOR_PREVIEW.slice(0, needed);
      subjectResults = [...real, ...samples];
    }

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
      subject_results: subjectResults,
      total_score: result.total_score,
      overall_percentage: result.overall_percentage,
      overall_grade: result.overall_grade,
    };
    return buildReportCardPdf(templateData);
  }
}
