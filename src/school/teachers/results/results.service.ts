import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import * as colors from 'colors';
import { 
  ResultMainPageDataDto, 
  CurrentSessionDto, 
  TeacherClassDto, 
  ClassSubjectDto, 
  StudentResultDto 
} from './dto/result-main-page.dto';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get data for result main page
   * @param user - User object with teacher information
   * @param page - Page number for pagination
   * @param limit - Number of items per page
   */
  async getResultMainPageData(user: any, page: number = 1, limit: number = 10): Promise<ApiResponse<ResultMainPageDataDto | null>> {
    this.logger.log(colors.cyan(`📊 Fetching result main page data for teacher: ${user.email}`));

    try {
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

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
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

      if (!currentSession) {
        this.logger.error(colors.red(`❌ No current academic session found for school: ${teacher.school_id}`));
        return new ApiResponse<null>(false, 'No current academic session found', null);
      }

      this.logger.log(colors.green(`✅ Current session: ${currentSession.academic_year} - ${currentSession.term}`));

      // Get classes managed by the teacher
      const teacherClasses = await this.prisma.class.findMany({
        where: {
          classTeacherId: teacher.id,
          schoolId: teacher.school_id,
          academic_session_id: currentSession.id
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

      // Get first class (lowest classId)
      const firstClass = teacherClasses[0];
      this.logger.log(colors.blue(`📚 Using first class: ${firstClass.name} (ID: ${firstClass.classId})`));

      // Get subjects for the first class
      const classSubjects = await this.prisma.subject.findMany({
        where: {
          classId: firstClass.id,
          schoolId: teacher.school_id,
          academic_session_id: currentSession.id
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
      }) as Array<{
        id: string;
        name: string;
        code: string;
        color: string;
      }>;

      if (classSubjects.length === 0) {
        this.logger.warn(colors.yellow(`⚠️ No subjects found for class: ${firstClass.name}`));
        return new ApiResponse<null>(false, 'No subjects found for the class', null);
      }

      this.logger.log(colors.green(`✅ Class subjects: ${classSubjects.length} subjects`));

      // Get first subject (default selection)
      const defaultSubject = classSubjects[0];
      this.logger.log(colors.blue(`📖 Using first subject: ${defaultSubject.name}`));

      // Get students in the first class
      const classStudents = await this.prisma.student.findMany({
        where: {
          current_class_id: firstClass.id,
          school_id: teacher.school_id,
          academic_session_id: currentSession.id,
          status: 'active'
        },
        select: {
          id: true,
          user_id: true,
          student_id: true,
          user: {
            select: {
              id: true,
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

      this.logger.log(colors.green(`✅ Class students: ${classStudents.length} students`));

      // Calculate pagination for students
      const skip = (page - 1) * limit;
      const totalStudents = classStudents.length;
      const totalPages = Math.ceil(totalStudents / limit);
      const hasMore = page < totalPages;
      const hasPrev = page > 1;

      // Get all assessments for the default subject
      const subjectAssessments = await this.prisma.assessment.findMany({
        where: {
          subject_id: defaultSubject.id,
          school_id: teacher.school_id,
          academic_session_id: currentSession.id,
          is_published: true,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED']
          }
        },
        select: {
          id: true,
          title: true,
          total_points: true
        }
      });

      this.logger.log(colors.green(`✅ Subject assessments: ${subjectAssessments.length} assessments`));

      // Get assessment attempts for all students in this subject
      const assessmentAttempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          assessment: {
            subject_id: defaultSubject.id,
            school_id: teacher.school_id,
            academic_session_id: currentSession.id
          },
          student_id: {
            in: classStudents.map(student => student.user_id)
          },
          status: 'GRADED'
        },
        select: {
          id: true,
          student_id: true,
          assessment_id: true,
          total_score: true,
          percentage: true,
          submitted_at: true,
          assessment: {
            select: {
              total_points: true
            }
          }
        }
      });

      this.logger.log(colors.green(`✅ Assessment attempts: ${assessmentAttempts.length} attempts`));

      // Apply pagination to students
      const paginatedStudents = classStudents.slice(skip, skip + limit);

      // Calculate student results for paginated students
      const studentResults: StudentResultDto[] = paginatedStudents.map(student => {
        // Get attempts for this student
        const studentAttempts = assessmentAttempts.filter(attempt => attempt.student_id === student.user_id);
        
        // Calculate total score and max score
        const totalScore = studentAttempts.reduce((sum, attempt) => sum + attempt.total_score, 0);
        const maxScore = studentAttempts.reduce((sum, attempt) => sum + attempt.assessment.total_points, 0);
        
        // Calculate percentage
        const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
        
        // Calculate grade
        const grade = this.calculateGrade(percentage);
        
        // Determine submission status
        let submissionStatus = 'not_submitted';
        if (studentAttempts.length === subjectAssessments.length) {
          submissionStatus = 'submitted';
        } else if (studentAttempts.length > 0) {
          submissionStatus = 'partial';
        }
        
        // Get last submission date
        const lastSubmission = studentAttempts.length > 0 
          ? studentAttempts.sort((a, b) => {
              if (!a.submitted_at || !b.submitted_at) return 0;
              return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
            })[0]
          : null;

        return {
          student_id: student.id,
          student_name: `${student.user.first_name} ${student.user.last_name}`,
          roll_number: student.student_id,
          display_picture: student.user.display_picture as string || '',
          total_score: totalScore,
          max_score: maxScore,
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
          grade: grade,
          assessments_attempted: studentAttempts.length,
          total_assessments: subjectAssessments.length,
          submission_status: submissionStatus,
          last_submission_date: lastSubmission && lastSubmission.submitted_at ? lastSubmission.submitted_at.toISOString() : null
        };
      });

      // Format response data
      const currentSessionDto: CurrentSessionDto = {
        id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term
      };

      const teacherClassesDto: TeacherClassDto[] = teacherClasses.map(cls => ({
        id: cls.id,
        name: cls.name,
        classId: cls.classId.toString()
      }));

      const defaultSubjectDto: ClassSubjectDto = {
        id: defaultSubject.id,
        name: defaultSubject.name,
        code: defaultSubject.code,
        color: defaultSubject.color
      };

      const paginationData = {
        page: page,
        limit: limit,
        total: totalStudents,
        total_pages: totalPages,
        has_more: hasMore,
        has_prev: hasPrev
      };

      const responseData: ResultMainPageDataDto = {
        current_session: currentSessionDto,
        teacher_classes: teacherClassesDto,
        default_subject: defaultSubjectDto,
        student_results: studentResults,
        pagination: paginationData
      };

      this.logger.log(colors.green(`🎉 Result main page data retrieved successfully:`));
      this.logger.log(colors.green(`   - Current session: ${currentSession.academic_year} - ${currentSession.term}`));
      this.logger.log(colors.green(`   - Teacher classes: ${teacherClasses.length}`));
      this.logger.log(colors.green(`   - Default subject: ${defaultSubject.name}`));
      this.logger.log(colors.green(`   - Student results: ${studentResults.length}/${totalStudents} (page ${page}/${totalPages})`));

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
