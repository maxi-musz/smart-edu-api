import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';

@Injectable()
export class ResultsService {
  private readonly logger = new Logger(ResultsService.name);
  private readonly BATCH_SIZE = 50; // Process 50 students at a time

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Release results for all students in the current academic session (WHOLE SCHOOL)
   * This collates all CA and Exam scores and creates Result records
   */
  async releaseResults(schoolId: string, userId: string): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`🎓 Starting result release process for school: ${schoolId}`));

    try {
      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true,
          status: 'active'
        }
      });

      if (!currentSession) {
        this.logger.error(colors.red(`❌ No current academic session found`));
        return ResponseHelper.error(colors.red(`❌ No current academic session found`), null, 400);
      }

      this.logger.log(colors.green(`✅ Using session: ${currentSession.academic_year} - ${currentSession.term}`));

      // Check if results already exist for this session
      const existingResults = await this.prisma.result.findFirst({  
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id
        }
      });

      if (existingResults) {
        this.logger.warn(colors.yellow(`⚠️ Results already exist for this session. Recalculating and updating existing results...`));
      }

      // Get all active students in the school for this session
      const allStudents = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: 'active'
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true
        }
      });

      if (allStudents.length === 0) {
        this.logger.error(colors.red(`❌ No active students found for this session`));
        return new ApiResponse(false, 'No active students found for this session', null);
      }

      this.logger.log(colors.blue(`📊 Found ${allStudents.length} students to process`));

      // Get all released assessments for this session (EXAM and CBT types only)
      const releasedAssessments = await this.prisma.assessment.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          is_result_released: true,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED']
          },
          // Only include EXAM and CBT assessment types
          assessment_type: {
            in: ['EXAM', 'CBT']
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      if (releasedAssessments.length === 0) {
        this.logger.error(colors.red(`❌ No released assessments found for this session`));
        return new ApiResponse(false, 'No released assessments found for this session', null);
      }

      this.logger.log(colors.blue(`📚 Found ${releasedAssessments.length} released assessments`));

      // Process students in batches to avoid overwhelming the system
      const totalBatches = Math.ceil(allStudents.length / this.BATCH_SIZE);
      let processedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < allStudents.length; i += this.BATCH_SIZE) {
        const batch = allStudents.slice(i, i + this.BATCH_SIZE);
        const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

        this.logger.log(colors.cyan(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} students)`));

        // Process batch in parallel
        const batchPromises = batch.map(student => 
          this.processStudentResults(student, releasedAssessments, currentSession.id, schoolId, userId)
            .catch(error => {
              this.logger.error(colors.red(`❌ Error processing student ${student.id}: ${error.message}`));
              errorCount++;
              return null;
            })
        );

        const batchResults = await Promise.all(batchPromises);
        processedCount += batchResults.filter(r => r !== null).length;

        // Small delay between batches to prevent overwhelming the database
        if (i + this.BATCH_SIZE < allStudents.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Calculate class positions for all students
      await this.calculateClassPositions(schoolId, currentSession.id);

      this.logger.log(colors.green(`✅ Result release completed!`));
      this.logger.log(colors.green(`   - Processed: ${processedCount}/${allStudents.length} students`));
      this.logger.log(colors.green(`   - Errors: ${errorCount}`));

      return new ApiResponse(
        true,
        `Results released successfully for ${processedCount} students`,
        {
          total_students: allStudents.length,
          processed: processedCount,
          errors: errorCount,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error releasing results: ${error.message}`));
      return new ApiResponse(false, `Failed to release results: ${error.message}`, null);
    }
  }

  /**
   * Release results for a single student
   */
  async releaseResultsForStudent(
    schoolId: string,
    userId: string,
    studentId: string,
    sessionId?: string
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`🎓 Releasing results for student: ${studentId}`));

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId
          }
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active'
          }
        });
      }

      if (!currentSession) {
        this.logger.error(colors.red(`❌ No academic session found`));
        return ResponseHelper.error('No academic session found', null, 400);
      }

      // Get student
      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: 'active'
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true
        }
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found`));
        return ResponseHelper.error('Student not found', null, 404);
      }

      // Get all released assessments for this session
      const releasedAssessments = await this.prisma.assessment.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          is_result_released: true,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED']
          },
          assessment_type: {
            in: ['EXAM', 'CBT']
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      if (releasedAssessments.length === 0) {
        this.logger.error(colors.red(`❌ No released assessments found`));
        return ResponseHelper.error('No released assessments found for this session', null, 400);
      }

      // Process student results
      await this.processStudentResults(student, releasedAssessments, currentSession.id, schoolId, userId);

      // Recalculate class positions
      await this.calculateClassPositions(schoolId, currentSession.id);

      this.logger.log(colors.green(`✅ Results released successfully for student`));

      return ResponseHelper.success(
        'Results released successfully for student',
        {
          student_id: student.id,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error releasing results for student: ${error.message}`));
      return ResponseHelper.error(`Failed to release results: ${error.message}`, null, 500);
    }
  }

  /**
   * Release results for all students in a specific class
   */
  async releaseResultsForClass(
    schoolId: string,
    userId: string,
    classId: string,
    sessionId?: string
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`🎓 Releasing results for class: ${classId}`));

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId
          }
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active'
          }
        });
      }

      if (!currentSession) {
        this.logger.error(colors.red(`❌ No academic session found`));
        return ResponseHelper.error('No academic session found', null, 400);
      }

      // Get all students in the class
      const classStudents = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          current_class_id: classId,
          status: 'active'
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true
        }
      });

      if (classStudents.length === 0) {
        this.logger.error(colors.red(`❌ No students found in this class`));
        return ResponseHelper.error('No students found in this class', null, 404);
      }

      // Get all released assessments for this session
      const releasedAssessments = await this.prisma.assessment.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          is_result_released: true,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED']
          },
          assessment_type: {
            in: ['EXAM', 'CBT']
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      if (releasedAssessments.length === 0) {
        this.logger.error(colors.red(`❌ No released assessments found`));
        return ResponseHelper.error('No released assessments found for this session', null, 400);
      }

      this.logger.log(colors.blue(`📊 Processing ${classStudents.length} students in class`));

      // Process students in batches
      const totalBatches = Math.ceil(classStudents.length / this.BATCH_SIZE);
      let processedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < classStudents.length; i += this.BATCH_SIZE) {
        const batch = classStudents.slice(i, i + this.BATCH_SIZE);
        const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

        this.logger.log(colors.cyan(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} students)`));

        const batchPromises = batch.map(student =>
          this.processStudentResults(student, releasedAssessments, currentSession.id, schoolId, userId)
            .catch(error => {
              this.logger.error(colors.red(`❌ Error processing student ${student.id}: ${error.message}`));
              errorCount++;
              return null;
            })
        );

        const batchResults = await Promise.all(batchPromises);
        processedCount += batchResults.filter(r => r !== null).length;

        if (i + this.BATCH_SIZE < classStudents.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Recalculate class positions
      await this.calculateClassPositions(schoolId, currentSession.id);

      this.logger.log(colors.green(`✅ Results released successfully for class`));
      this.logger.log(colors.green(`   - Processed: ${processedCount}/${classStudents.length} students`));
      this.logger.log(colors.green(`   - Errors: ${errorCount}`));

      return ResponseHelper.success(
        `Results released successfully for ${processedCount} students in class`,
        {
          class_id: classId,
          total_students: classStudents.length,
          processed: processedCount,
          errors: errorCount,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error releasing results for class: ${error.message}`));
      return ResponseHelper.error(`Failed to release results: ${error.message}`, null, 500);
    }
  }

  /**
   * Release results for multiple students by their IDs
   */
  async releaseResultsForStudents(
    schoolId: string,
    userId: string,
    studentIds: string[],
    sessionId?: string
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`🎓 Releasing results for ${studentIds.length} students`));

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId
          }
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active'
          }
        });
      }

      if (!currentSession) {
        this.logger.error(colors.red(`❌ No academic session found`));
        return ResponseHelper.error('No academic session found', null, 400);
      }

      // Get all specified students
      const students = await this.prisma.student.findMany({
        where: {
          id: {
            in: studentIds
          },
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: 'active'
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true
        }
      });

      if (students.length === 0) {
        this.logger.error(colors.red(`❌ No students found`));
        return ResponseHelper.error('No students found with the provided IDs', null, 404);
      }

      // Check if some student IDs were not found
      const foundStudentIds = students.map(s => s.id);
      const notFoundIds = studentIds.filter(id => !foundStudentIds.includes(id));
      if (notFoundIds.length > 0) {
        this.logger.warn(colors.yellow(`⚠️  Some student IDs not found: ${notFoundIds.join(', ')}`));
      }

      // Get all released assessments for this session
      const releasedAssessments = await this.prisma.assessment.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          is_result_released: true,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED']
          },
          assessment_type: {
            in: ['EXAM', 'CBT']
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      if (releasedAssessments.length === 0) {
        this.logger.error(colors.red(`❌ No released assessments found`));
        return ResponseHelper.error('No released assessments found for this session', null, 400);
      }

      this.logger.log(colors.blue(`📊 Processing ${students.length} students`));

      // Process students in batches
      const totalBatches = Math.ceil(students.length / this.BATCH_SIZE);
      let processedCount = 0;
      let errorCount = 0;

      for (let i = 0; i < students.length; i += this.BATCH_SIZE) {
        const batch = students.slice(i, i + this.BATCH_SIZE);
        const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

        this.logger.log(colors.cyan(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} students)`));

        const batchPromises = batch.map(student =>
          this.processStudentResults(student, releasedAssessments, currentSession.id, schoolId, userId)
            .catch(error => {
              this.logger.error(colors.red(`❌ Error processing student ${student.id}: ${error.message}`));
              errorCount++;
              return null;
            })
        );

        const batchResults = await Promise.all(batchPromises);
        processedCount += batchResults.filter(r => r !== null).length;

        if (i + this.BATCH_SIZE < students.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Recalculate class positions for affected classes
      const affectedClasses = [...new Set(students.map(s => s.current_class_id).filter(Boolean))];
      for (const classId of affectedClasses) {
        if (classId) {
          await this.calculateClassPositions(schoolId, currentSession.id);
          break; // Only need to calculate once as it processes all classes
        }
      }

      this.logger.log(colors.green(`✅ Results released successfully for students`));
      this.logger.log(colors.green(`   - Processed: ${processedCount}/${students.length} students`));
      this.logger.log(colors.green(`   - Errors: ${errorCount}`));
      if (notFoundIds.length > 0) {
        this.logger.log(colors.yellow(`   - Not found: ${notFoundIds.length} student IDs`));
      }

      return ResponseHelper.success(
        `Results released successfully for ${processedCount} students`,
        {
          total_requested: studentIds.length,
          total_found: students.length,
          processed: processedCount,
          errors: errorCount,
          not_found: notFoundIds.length > 0 ? notFoundIds : undefined,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term
          }
        }
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error releasing results for students: ${error.message}`));
      return ResponseHelper.error(`Failed to release results: ${error.message}`, null, 500);
    }
  }

  /**
   * Process results for a single student
   */
  private async processStudentResults(
    student: { id: string; user_id: string; current_class_id: string | null },
    releasedAssessments: any[],
    sessionId: string,
    schoolId: string,
    releasedBy: string
  ): Promise<any> {
    // Get final result (best attempt) for each released assessment
    const assessmentResults = await Promise.all(
      releasedAssessments.map(async (assessment) => {
        const studentResult = await this.prisma.assessmentAttempt.findFirst({
          where: {
            assessment_id: assessment.id,
            student_id: student.user_id,
            status: 'SUBMITTED'
          },
          orderBy: [
            { total_score: 'desc' },
            { submitted_at: 'desc' }
          ]
        });

        return {
          assessment,
          result: studentResult
        };
      })
    );

    // Filter out assessments where student has no result
    const validResults = assessmentResults.filter(item => item.result !== null);

    if (validResults.length === 0) {
      // Upsert empty result record
      return await this.prisma.result.upsert({
        where: {
          academic_session_id_student_id: {
            academic_session_id: sessionId,
            student_id: student.id
          }
        },
        update: {
          class_id: student.current_class_id,
          subject_results: [],
          released_by: releasedBy,
          released_by_school_admin: true // Set to true when released by director
        },
        create: {
          school_id: schoolId,
          academic_session_id: sessionId,
          student_id: student.id,
          class_id: student.current_class_id,
          subject_results: [],
          released_by: releasedBy,
          released_by_school_admin: true // Set to true when released by director
        }
      });
    }

    // Group results by subject
    const subjectMap = new Map<string, {
      subject_id: string;
      subject_code: string;
      subject_name: string;
      ca_score: number;
      exam_score: number;
      ca_max_score: number;
      exam_max_score: number;
      total_score: number;
      total_max_score: number;
    }>();

    for (const { assessment, result } of validResults) {
      if (!result || !assessment.subject) continue;

      const subjectId = assessment.subject.id;
      const isExam = assessment.assessment_type === 'EXAM';

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subject_id: subjectId,
          subject_code: assessment.subject.code || '',
          subject_name: assessment.subject.name,
          ca_score: 0,
          exam_score: 0,
          ca_max_score: 0,
          exam_max_score: 0,
          total_score: 0,
          total_max_score: 0
        });
      }

      const subjectData = subjectMap.get(subjectId)!;

      if (isExam) {
        subjectData.exam_score += result.total_score;
        subjectData.exam_max_score += result.max_score;
      } else {
        subjectData.ca_score += result.total_score;
        subjectData.ca_max_score += result.max_score;
      }

      subjectData.total_score += result.total_score;
      subjectData.total_max_score += result.max_score;
    }

    // Calculate grades and prepare subject results
    const subjectResults = Array.from(subjectMap.values()).map(subjectData => {
      const percentage = subjectData.total_max_score > 0
        ? (subjectData.total_score / subjectData.total_max_score) * 100
        : 0;
      const grade = this.calculateGrade(percentage);

      return {
        subject_id: subjectData.subject_id,
        subject_code: subjectData.subject_code,
        subject_name: subjectData.subject_name,
        ca_score: subjectData.ca_score || null,
        exam_score: subjectData.exam_score || null,
        total_score: subjectData.total_score,
        total_max_score: subjectData.total_max_score,
        percentage: Math.round(percentage * 100) / 100,
        grade: grade
      };
    });

    // Calculate overall statistics
    const totalCaScore = subjectResults.reduce((sum, s) => sum + (s.ca_score || 0), 0);
    const totalExamScore = subjectResults.reduce((sum, s) => sum + (s.exam_score || 0), 0);
    const totalScore = subjectResults.reduce((sum, s) => sum + s.total_score, 0);
    const totalMaxScore = subjectResults.reduce((sum, s) => sum + s.total_max_score, 0);
    const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    const overallGrade = this.calculateGrade(overallPercentage);

    // Upsert result record
    return await this.prisma.result.upsert({
      where: {
        academic_session_id_student_id: {
          academic_session_id: sessionId,
          student_id: student.id
        }
      },
      update: {
        class_id: student.current_class_id,
        subject_results: subjectResults as any,
        total_ca_score: totalCaScore,
        total_exam_score: totalExamScore,
        total_score: totalScore,
        total_max_score: totalMaxScore,
        overall_percentage: Math.round(overallPercentage * 100) / 100,
        overall_grade: overallGrade,
        released_by: releasedBy,
        released_by_school_admin: true // Set to true when released by director
      },
      create: {
        school_id: schoolId,
        academic_session_id: sessionId,
        student_id: student.id,
        class_id: student.current_class_id,
        subject_results: subjectResults as any,
        total_ca_score: totalCaScore,
        total_exam_score: totalExamScore,
        total_score: totalScore,
        total_max_score: totalMaxScore,
        overall_percentage: Math.round(overallPercentage * 100) / 100,
        overall_grade: overallGrade,
        released_by: releasedBy,
        released_by_school_admin: true // Set to true when released by director
      }
    });
  }

  /**
   * Calculate class positions for all students
   */
  private async calculateClassPositions(schoolId: string, sessionId: string): Promise<void> {
    this.logger.log(colors.cyan(`📊 Calculating class positions...`));

    // Get all classes
    const classes = await this.prisma.class.findMany({
      where: {
        schoolId: schoolId,
        academic_session_id: sessionId
      },
      select: {
        id: true
      }
    });

    // Calculate positions for each class
    for (const classItem of classes) {
      const classResults = await this.prisma.result.findMany({
        where: {
          class_id: classItem.id,
          academic_session_id: sessionId
        },
        orderBy: {
          overall_percentage: 'desc'
        }
      });

      // Update positions
      for (let i = 0; i < classResults.length; i++) {
        await this.prisma.result.update({
          where: { id: classResults[i].id },
          data: {
            class_position: i + 1,
            total_students: classResults.length
          }
        });
      }
    }

    this.logger.log(colors.green(`✅ Class positions calculated`));
  }

  /**
   * Calculate grade based on percentage
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    if (percentage >= 50) return 'E';
    return 'F';
  }

  /**
   * Get results dashboard data for director
   * Returns: sessions, classes, subjects, and paginated results
   */
  async getResultsDashboard(
    userId: string,
    filters: {
      sessionId?: string;
      classId?: string;
      subjectId?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      this.logger.log(colors.cyan(`📊 Getting results dashboard for director: ${userId}`));

      // Get director/school info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, school_id: true, role: true }
      });

      if (!user || user.role !== 'school_director') {
        return ResponseHelper.error('Access denied. Director role required.', null, 403);
      }

      const {
        sessionId,
        classId,
        subjectId,
        page = 1,
        limit = 10
      } = filters;

      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
      const skip = (pageNum - 1) * limitNum;

      // 1. Get all academic sessions and terms (active session/term at top)
      const allSessions = await this.prisma.academicSession.findMany({
        where: {
          school_id: user.school_id
        },
        select: {
          id: true,
          academic_year: true,
          term: true,
          start_date: true,
          end_date: true,
          status: true,
          is_current: true,
          _count: {
            select: {
              results: true
            }
          }
        },
        orderBy: [
          { is_current: 'desc' },
          { start_year: 'desc' },
          { term: 'desc' }
        ]
      });

      // Get current active session
      const currentSession = allSessions.find(s => s.is_current && s.status === 'active') || allSessions[0];

      // 2. Get all classes
      const classes = await this.prisma.class.findMany({
        where: {
          schoolId: user.school_id,
          ...(currentSession ? { academic_session_id: currentSession.id } : {})
        },
        include: {
          classTeacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true
            }
          },
          _count: {
            select: {
              students: true,
              subjects: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // 3. Get all subjects
      const subjects = await this.prisma.subject.findMany({
        where: {
          schoolId: user.school_id,
          ...(currentSession ? { academic_session_id: currentSession.id } : {})
        },
        select: {
          id: true,
          name: true,
          code: true,
          color: true,
          description: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Determine which session and class to use (NO default subject selection)
      const selectedSessionId = sessionId || (currentSession?.id);
      const selectedClassId = classId || (classes.length > 0 ? classes[0].id : null);

      // 4. Get results table data for selected filters
      let results: any[] = [];
      let totalResults = 0;
      let hasResults = false;
      let resultMessage: string | null = null;
      let totalStudentsInClass = 0;
      let classSubjects: any[] = [];

      if (selectedSessionId && selectedClassId) {
        // Get all students in the selected class
        const allStudentsInClass = await this.prisma.student.findMany({
          where: {
            school_id: user.school_id,
            academic_session_id: selectedSessionId,
            current_class_id: selectedClassId,
            status: 'active'
          },
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                display_picture: true
              }
            }
          },
          orderBy: {
            user: {
              last_name: 'asc'
            }
          }
        });

        totalStudentsInClass = allStudentsInClass.length;

        if (totalStudentsInClass === 0) {
          resultMessage = 'No students found in this class';
        } else {
          // Get all subjects for this class
          classSubjects = await this.prisma.subject.findMany({
            where: {
              schoolId: user.school_id,
              academic_session_id: selectedSessionId,
              classId: selectedClassId
            },
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              description: true
            },
            orderBy: {
              name: 'asc'
            }
          });

          this.logger.log(colors.cyan(`📊 Class subjects: ${classSubjects.length}`));

          if (classSubjects.length === 0) {
            resultMessage = 'No subjects found for this class';
          } else {
            const studentUserIds = allStudentsInClass.map(s => s.user_id);

            // Get all released assessments (status CLOSED) for all subjects in this class
            const allReleasedAssessments = await this.prisma.assessment.findMany({
              where: {
                school_id: user.school_id,
                academic_session_id: selectedSessionId,
                subject_id: {
                  in: classSubjects.map(s => s.id)
                },
                assessment_type: {
                  in: ['CBT', 'EXAM']
                },
                status: 'CLOSED',
                is_result_released: true
              },
              select: {
                id: true,
                title: true,
                assessment_type: true,
                total_points: true,
                subject_id: true,
                createdAt: true
              },
              orderBy: [
                { subject_id: 'asc' },
                { assessment_type: 'asc' },
                { createdAt: 'asc' }
              ]
            });

            this.logger.log(colors.cyan(`📊 Released assessments: ${allReleasedAssessments.length}`));

            // Check which students have results released by admin for this session
            const releasedResults = await this.prisma.result.findMany({
              where: {
                school_id: user.school_id,
                academic_session_id: selectedSessionId,
                student_id: {
                  in: allStudentsInClass.map(s => s.id)
                },
                released_by_school_admin: true
              },
              select: {
                student_id: true
              }
            });

            // Create a map of student IDs that have released results
            const releasedStudentIds = new Set(releasedResults.map(r => r.student_id));

            // Get all assessment attempts for these assessments
            const allAttempts = await this.prisma.assessmentAttempt.findMany({
              where: {
                school_id: user.school_id,
                academic_session_id: selectedSessionId,
                assessment_id: {
                  in: allReleasedAssessments.map(a => a.id)
                },
                student_id: {
                  in: studentUserIds
                },
                status: {
                  in: ['SUBMITTED', 'GRADED']
                }
              },
              select: {
                id: true,
                assessment_id: true,
                student_id: true,
                total_score: true,
                max_score: true,
                percentage: true,
                submitted_at: true,
                assessment: {
                  select: {
                    subject_id: true
                  }
                }
              },
              orderBy: [
                { total_score: 'desc' },
                { submitted_at: 'desc' }
              ]
            });

            // Create a map: student_id -> subject_id -> assessment_id -> best attempt
            const attemptsMap = new Map<string, Map<string, Map<string, any>>>();
            allAttempts.forEach(attempt => {
              if (!attemptsMap.has(attempt.student_id)) {
                attemptsMap.set(attempt.student_id, new Map());
              }
              const studentAttempts = attemptsMap.get(attempt.student_id)!;
              const subjectId = attempt.assessment.subject_id;
              
              if (!studentAttempts.has(subjectId)) {
                studentAttempts.set(subjectId, new Map());
              }
              const subjectAttempts = studentAttempts.get(subjectId)!;
              
              // Keep only the best attempt for each assessment
              if (!subjectAttempts.has(attempt.assessment_id) || 
                  subjectAttempts.get(attempt.assessment_id)!.total_score < attempt.total_score) {
                subjectAttempts.set(attempt.assessment_id, attempt);
              }
            });

            // Helper function to calculate grade based on percentage
            const calculateGrade = (percentage: number): string => {
              if (percentage >= 70) return 'A';
              if (percentage >= 60) return 'B';
              if (percentage >= 50) return 'C';
              if (percentage >= 40) return 'D';
              return 'F';
            };

            // Build results table - calculate score for each subject
            const studentResults = allStudentsInClass.map((student) => {
              const studentAttempts = attemptsMap.get(student.user_id) || new Map();
              const subjectScores: any = {};
              let totalObtained = 0;
              let totalObtainable = 0;

              // Calculate score for each subject
              classSubjects.forEach(subject => {
                const subjectAttempts = studentAttempts.get(subject.id) || new Map();
                
                // Get all assessments for this subject
                const subjectAssessments = allReleasedAssessments.filter(a => a.subject_id === subject.id);
                const cbtAssessments = subjectAssessments.filter(a => a.assessment_type === 'CBT');
                const examAssessments = subjectAssessments.filter(a => a.assessment_type === 'EXAM');

                // Calculate CBT total
                let cbtObtained = 0;
                let cbtObtainable = 0;
                cbtAssessments.forEach(cbt => {
                  const attempt = subjectAttempts.get(cbt.id);
                  cbtObtained += attempt ? attempt.total_score : 0;
                  cbtObtainable += cbt.total_points;
                });

                // Calculate Exam total
                let examObtained = 0;
                let examObtainable = 0;
                if (examAssessments.length > 0) {
                  const exam = examAssessments[0]; // Only one exam per term
                  const attempt = subjectAttempts.get(exam.id);
                  examObtained = attempt ? attempt.total_score : 0;
                  examObtainable = exam.total_points;
                }

                const subjectObtained = cbtObtained + examObtained;
                const subjectObtainable = cbtObtainable + examObtainable;
                const subjectPercentage = subjectObtainable > 0 ? (subjectObtained / subjectObtainable) * 100 : 0;

                subjectScores[subject.id] = {
                  subjectId: subject.id,
                  subjectName: subject.name,
                  subjectCode: subject.code,
                  obtained: subjectObtained,
                  obtainable: subjectObtainable,
                  percentage: subjectPercentage,
                  grade: calculateGrade(subjectPercentage)
                };

                totalObtained += subjectObtained;
                totalObtainable += subjectObtainable;
              });

              const overallPercentage = totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;

              // Check if results are released for this student
              const isReleased = releasedStudentIds.has(student.id);

              return {
                student: {
                  id: student.id,
                  userId: student.user_id,
                  studentNumber: student.student_id,
                  firstName: student.user.first_name,
                  lastName: student.user.last_name,
                  email: student.user.email,
                  displayPicture: student.user.display_picture
                },
                subjectScores: subjectScores,
                totalObtained: totalObtained,
                totalObtainable: totalObtainable,
                percentage: overallPercentage,
                grade: calculateGrade(overallPercentage),
                position: 0, // Will be calculated after sorting
                isReleased: isReleased // Indicates if results are released by admin for this term
              };
            });

            // Sort by total obtained (descending) to calculate positions
            studentResults.sort((a, b) => b.totalObtained - a.totalObtained);

            // Assign positions
            studentResults.forEach((result, index) => {
              result.position = index + 1;
            });

            // Apply pagination
            totalResults = studentResults.length;
            const paginatedResults = studentResults.slice(skip, skip + limitNum);

            results = paginatedResults;
            hasResults = true;
          }
        }
      } else {
        if (!selectedClassId) {
          resultMessage = 'Please select a class to view results';
        } else {
          resultMessage = 'No result released for this term';
        }
      }

      const totalPages = Math.ceil(totalResults / limitNum);

      // Prepare response data
      const responseData = {
        academic_sessions: allSessions,
        current_session: currentSession ? {
          id: currentSession.id,
          academic_year: currentSession.academic_year,
          term: currentSession.term,
          status: currentSession.status,
          is_current: currentSession.is_current
        } : null,
        classes: classes.map(cls => ({
          id: cls.id,
          name: cls.name,
          classTeacher: cls.classTeacher ? {
            id: cls.classTeacher.id,
            first_name: cls.classTeacher.first_name,
            last_name: cls.classTeacher.last_name,
            email: cls.classTeacher.email
          } : null,
          student_count: cls._count.students,
          subject_count: cls._count.subjects
        })),
        subjects: classSubjects.length > 0 ? classSubjects : subjects,
        selected_filters: {
          sessionId: selectedSessionId,
          classId: selectedClassId,
          subjectId: null // No default subject selection
        },
        total_students_in_class: totalStudentsInClass,
        results: hasResults ? results : null,
        result_message: resultMessage,
        pagination: hasResults ? {
          page: pageNum,
          limit: limitNum,
          total: totalResults,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        } : null
      };

      // Log what's being sent to frontend
      this.logger.log(colors.cyan(`📤 Sending to frontend:`));
      this.logger.log(colors.cyan(`   - Class subjects: ${classSubjects.length}`));
      this.logger.log(colors.cyan(`   - Total students in class: ${totalStudentsInClass}`));
      this.logger.log(colors.cyan(`   - Results count: ${results ? results.length : 0}`));
      if (results && results.length > 0) {
        this.logger.log(colors.cyan(`   - First result student: ${results[0].student.firstName} ${results[0].student.lastName}`));
        this.logger.log(colors.cyan(`   - First result subjects with scores: ${Object.keys(results[0].subjectScores || {}).length}`));
        this.logger.log(colors.cyan(`   - First result total obtained: ${results[0].totalObtained}`));
        this.logger.log(colors.cyan(`   - First result total obtainable: ${results[0].totalObtainable}`));
        this.logger.log(colors.cyan(`   - First result grade: ${results[0].grade}`));
        this.logger.log(colors.cyan(`   - First result position: ${results[0].position}`));
      }
      this.logger.log(colors.cyan(`   - Result message: ${resultMessage || 'None'}`));
      this.logger.log(colors.green(`✅ Results dashboard retrieved successfully`));

      return ResponseHelper.success(
        'Results dashboard retrieved successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error getting results dashboard: ${error.message}`));
      return ResponseHelper.error(`Failed to retrieve results dashboard: ${error.message}`, null, 500);
    }
  }
}

