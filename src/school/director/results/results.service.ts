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
   * Release results for all students in the current academic session
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
          released_by: releasedBy
        },
        create: {
          school_id: schoolId,
          academic_session_id: sessionId,
          student_id: student.id,
          class_id: student.current_class_id,
          subject_results: [],
          released_by: releasedBy
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
        released_by: releasedBy
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
        released_by: releasedBy
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
}

