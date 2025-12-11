import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import * as colors from 'colors';
import { 
  ResultMainPageDataDto, 
  CurrentSessionDto, 
  ClassSubjectDto, 
  ClassStudentResultDto,
  TeacherClassWithResultsDto,
  StudentSubjectResultDto,
  SessionSummaryDto
} from './dto/result-main-page.dto';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get data for result main page
   * @param user - User object with teacher information
   */
  async getResultMainPageData(
    user: any,
    filters: { sessionId?: string; term?: string; page?: number; limit?: number } = {}
  ): Promise<ApiResponse<ResultMainPageDataDto | null>> {
    this.logger.log(colors.cyan(`📊 Fetching result main page data for teacher: ${user.email}`));

    try {
      const { sessionId, term, page = 1, limit = 30 } = filters;

      // Get teacher record
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: user.id },
            { email: user.email }
          ],
          school_id: user.school_id
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          school_id: true
        }
      });

      if (!teacher) {
        this.logger.error(colors.red(`❌ Teacher not found for user: ${user.email}`));
        return new ApiResponse<null>(false, 'Teacher not found', null);
      }

      this.logger.log(colors.green(`✅ Teacher found: ${teacher.first_name} ${teacher.last_name}`));

      // Get target academic session (filtered or current)
      const targetSession = sessionId
        ? await this.prisma.academicSession.findFirst({
            where: {
              id: sessionId,
              school_id: teacher.school_id,
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
              school_id: teacher.school_id,
              is_current: true
            },
            select: {
              id: true,
              academic_year: true,
              term: true
            }
          });

      if (!targetSession) {
        this.logger.error(colors.red(`❌ No academic session found for school: ${teacher.school_id}`));
        return new ApiResponse<null>(false, 'No academic session found', null);
      }

      this.logger.log(colors.green(`✅ Session in use: ${targetSession.academic_year} - ${targetSession.term}`));

      // Available sessions/terms for dropdown/filtering
      const availableSessions = await this.prisma.academicSession.findMany({
        where: { school_id: teacher.school_id },
        select: { id: true, academic_year: true, term: true, is_current: true, createdAt: true },
        orderBy: [{ is_current: 'desc' }, { createdAt: 'desc' }]
      });

      // Get classes managed by the teacher
      const teacherClasses = await this.prisma.class.findMany({
        where: {
          classTeacherId: teacher.id,
          schoolId: teacher.school_id,
          academic_session_id: targetSession.id
        },
        select: {
          id: true,
          name: true,
          classId: true
        },
        orderBy: {
          classId: 'asc' // Order by classId (1, 2, 3...)
        }
      });

      if (teacherClasses.length === 0) {
        this.logger.warn(colors.yellow(`⚠️ No classes found for teacher: ${user.email}`));
        return new ApiResponse<null>(false, 'No classes assigned to teacher', null);
      }

      this.logger.log(colors.green(`✅ Teacher classes: ${teacherClasses.length} classes`));

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

      const classesWithResults: TeacherClassWithResultsDto[] = [];

      for (const teacherClass of teacherClasses) {
        // Subjects offered in the class (not filtered by teacher's subjects)
        const classSubjects = await this.prisma.subject.findMany({
          where: {
            classId: teacherClass.id,
            schoolId: teacher.school_id,
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

        // Students in the class
        const classStudents = await this.prisma.student.findMany({
          where: {
            current_class_id: teacherClass.id,
            school_id: teacher.school_id,
            academic_session_id: targetSession.id,
            status: 'active'
          },
          select: {
            id: true,
            user_id: true,
            student_id: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                display_picture: true
              }
            }
          },
          orderBy: {
            student_id: 'asc'
          }
        });

        // Released results for the class (computed by director)
        const releasedResults = await this.prisma.result.findMany({
          where: {
            school_id: teacher.school_id,
            academic_session_id: targetSession.id,
            class_id: teacherClass.id,
            released_by_school_admin: true
          },
          select: {
            student_id: true,
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

        const resultMap = new Map(releasedResults.map(result => [result.student_id, result]));

        const totalStudents = classStudents.length;
        const paginatedStudents = classStudents.slice((page - 1) * limit, page * limit);

        const studentsWithResults: ClassStudentResultDto[] = paginatedStudents.map(student => {
          const studentResult = resultMap.get(student.id);
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

          return {
            student_id: student.id,
            student_name: `${student.user.first_name} ${student.user.last_name}`,
            roll_number: student.student_id,
            display_picture: (student.user.display_picture as string) || '',
            total_ca_score: studentResult?.total_ca_score ?? null,
            total_exam_score: studentResult?.total_exam_score ?? null,
            total_score: studentResult?.total_score ?? null,
            total_max_score: studentResult?.total_max_score ?? null,
            overall_percentage: studentResult?.overall_percentage ?? null,
            overall_grade: studentResult?.overall_grade ?? null,
            class_position: studentResult?.class_position ?? null,
            total_students: studentResult?.total_students ?? classStudents.length,
            subjects: subjectResults
          };
        });

        classesWithResults.push({
          id: teacherClass.id,
          name: teacherClass.name,
          classId: teacherClass.classId.toString(),
          subjects: classSubjects,
          students: studentsWithResults,
          page,
          limit,
          total_students: totalStudents
        });
      }

      const responseData: ResultMainPageDataDto = {
        current_session: currentSessionDto,
        sessions: sessionsDto,
        classes: classesWithResults,
        page,
        limit
      };

      this.logger.log(colors.green(`🎉 Result main page data retrieved successfully:`));
      this.logger.log(colors.green(`   - Current session: ${targetSession.academic_year} - ${targetSession.term}`));
      this.logger.log(colors.green(`   - Teacher classes: ${teacherClasses.length}`));
      this.logger.log(colors.green(`   - Classes returned with students/results: ${classesWithResults.length}`));

      return new ApiResponse(true, 'Result main page data retrieved successfully', responseData);

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching result main page data: ${error.message}`));
      return new ApiResponse<null>(false, 'Failed to fetch result main page data', null);
    }
  }

  /**
   * Calculate grade based on percentage
   * @param percentage - Percentage score
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    if (percentage >= 50) return 'E';
    return 'F';
  }
}
