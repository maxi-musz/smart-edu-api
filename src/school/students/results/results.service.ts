import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import * as colors from 'colors';
import { 
  StudentResultDataDto, 
  CurrentSessionDto, 
  ClassSubjectDto, 
  ClassInfoDto,
  StudentSubjectResultDto,
  SessionSummaryDto
} from './dto/student-result.dto';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get student results for a particular student
   * @param user - User object with student information
   * @param filters - Optional filters for session and term
   */
  async getStudentResults(
    user: any,
    filters: { sessionId?: string; term?: string } = {}
  ): Promise<ApiResponse<StudentResultDataDto | null>> {
    this.logger.log(colors.cyan(`📊 Fetching results for student: ${user.email}`));

    try {
      const { sessionId, term } = filters;

      // Get student record
      const student = await this.prisma.student.findFirst({
        where: {
          user_id: user.id,
          school_id: user.school_id,
          status: 'active'
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true,
          student_id: true,
          user: {
            select: {
              first_name: true,
              last_name: true
            }
          }
        }
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found for user: ${user.email}`));
        return new ApiResponse<null>(false, 'Student not found', null);
      }

      this.logger.log(colors.green(`✅ Student found: ${student.user.first_name} ${student.user.last_name}`));

      if (!student.current_class_id) {
        this.logger.error(colors.red(`❌ Student not assigned to any class`));
        return new ApiResponse<null>(false, 'Student not assigned to any class', null);
      }

      // Get target academic session (filtered or current)
      const targetSession = sessionId
        ? await this.prisma.academicSession.findFirst({
            where: {
              id: sessionId,
              school_id: user.school_id,
              ...(term ? { term: term as any } : {})
            },
            select: {
              id: true,
              academic_year: true,
              term: true
            }
          })
        : await this.prisma.academicSession.findFirst({
            where: {
              school_id: user.school_id,
              is_current: true
            },
            select: {
              id: true,
              academic_year: true,
              term: true
            }
          });

      if (!targetSession) {
        this.logger.error(colors.red(`❌ No academic session found for school: ${user.school_id}`));
        return new ApiResponse<null>(false, 'No academic session found', null);
      }

      this.logger.log(colors.green(`✅ Session in use: ${targetSession.academic_year} - ${targetSession.term}`));

      // Available sessions/terms for dropdown/filtering
      const availableSessions = await this.prisma.academicSession.findMany({
        where: { school_id: user.school_id },
        select: { id: true, academic_year: true, term: true, is_current: true, createdAt: true },
        orderBy: [{ is_current: 'desc' }, { createdAt: 'desc' }]
      });

      // Get released result for the student (computed by director)
      // This will give us the class_id the student was in when results were released
      const studentResult = await this.prisma.result.findFirst({
        where: {
          school_id: user.school_id,
          academic_session_id: targetSession.id,
          student_id: student.id,
          released_by_school_admin: true
        },
        select: {
          class_id: true,
          subject_results: true,
          total_ca_score: true,
          total_exam_score: true,
          total_score: true,
          total_max_score: true,
          overall_percentage: true,
          overall_grade: true,
          class_position: true,
          total_students: true
        }
      });

      // Use class_id from result if available, otherwise fall back to student's current_class_id
      const classIdToUse = studentResult?.class_id || student.current_class_id;

      if (!classIdToUse) {
        this.logger.error(colors.red(`❌ No class found for student in this session`));
        return new ApiResponse<null>(false, 'No class found for student in this session', null);
      }

      // Get class information for the session
      const currentClass = await this.prisma.class.findFirst({
        where: {
          id: classIdToUse,
          schoolId: user.school_id,
          academic_session_id: targetSession.id
        },
        select: {
          id: true,
          name: true,
          classId: true
        }
      });

      if (!currentClass) {
        this.logger.error(colors.red(`❌ Class not found for student`));
        return new ApiResponse<null>(false, 'Class not found', null);
      }

      // Get subjects for the class in the target session
      const classSubjects = await this.prisma.subject.findMany({
        where: {
          classId: currentClass.id,
          schoolId: user.school_id,
          academic_session_id: targetSession.id
        },
        select: {
          id: true,
          name: true,
          code: true,
          color: true
        },
        orderBy: {
          name: 'asc'
        }
      }) as ClassSubjectDto[];

      // Parse subject results from JSON
      const subjectResultsRaw = (studentResult?.subject_results ?? []) as any[];
      const subjectResults: StudentSubjectResultDto[] = Array.isArray(subjectResultsRaw)
        ? subjectResultsRaw.map(subject => ({
            subject_id: subject.subject_id ?? '',
            subject_name: subject.subject_name ?? '',
            subject_code: subject.subject_code ?? '',
            ca_score: subject.ca_score ?? null,
            exam_score: subject.exam_score ?? null,
            total_score: subject.total_score ?? 0,
            total_max_score: subject.total_max_score ?? 0,
            percentage: subject.percentage ?? 0,
            grade: subject.grade ?? null
          }))
        : [];

      // Build response
      const currentSessionDto: CurrentSessionDto = {
        id: targetSession.id,
        academic_year: targetSession.academic_year,
        term: targetSession.term
      };

      const sessionsDto: SessionSummaryDto[] = availableSessions.map(s => ({
        id: s.id,
        academic_year: s.academic_year,
        term: s.term,
        is_current: s.is_current
      }));

      const classInfoDto: ClassInfoDto = {
        id: currentClass.id,
        name: currentClass.name,
        classId: currentClass.classId.toString()
      };

      const responseData: StudentResultDataDto = {
        current_session: currentSessionDto,
        sessions: sessionsDto,
        current_class: classInfoDto,
        subjects: classSubjects,
        total_ca_score: studentResult?.total_ca_score ?? null,
        total_exam_score: studentResult?.total_exam_score ?? null,
        total_score: studentResult?.total_score ?? null,
        total_max_score: studentResult?.total_max_score ?? null,
        overall_percentage: studentResult?.overall_percentage ?? null,
        overall_grade: studentResult?.overall_grade ?? null,
        class_position: studentResult?.class_position ?? null,
        total_students: studentResult?.total_students ?? null,
        subject_results: subjectResults
      };

      this.logger.log(colors.green(`🎉 Student result retrieved successfully:`));
      this.logger.log(colors.green(`   - Session: ${targetSession.academic_year} - ${targetSession.term}`));
      this.logger.log(colors.green(`   - Class: ${currentClass.name}`));
      this.logger.log(colors.green(`   - Subjects: ${classSubjects.length}`));
      this.logger.log(colors.green(`   - Subject results: ${subjectResults.length}`));

      return new ApiResponse(true, 'Student result retrieved successfully', responseData);

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching student result: ${error.message}`));
      return new ApiResponse<null>(false, 'Failed to fetch student result', null);
    }
  }
}
