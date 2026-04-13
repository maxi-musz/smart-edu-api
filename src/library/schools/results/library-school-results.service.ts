import { Injectable, Logger } from '@nestjs/common';
import { AuditForType, AuditPerformedByType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ApiResponse } from '../../../shared/helper-functions/response';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { PushNotificationsService } from '../../../push-notifications/push-notifications.service';
import { AuditService } from '../../../audit/audit.service';

@Injectable()
export class LibrarySchoolResultsService {
  private readonly logger = new Logger(LibrarySchoolResultsService.name);
  private readonly BATCH_SIZE = 50; // Process 50 students at a time

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Log sensitive result release/unrelease actions to audit log. Never throws.
   */
  private async logAudit(
    auditForType: AuditForType,
    schoolId: string,
    performedById: string,
    metadata: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await this.auditService.log({
        auditForType,
        targetId: schoolId,
        performedById,
        performedByType: AuditPerformedByType.library_user,
        metadata,
      });
    } catch (err: any) {
      this.logger.warn(
        colors.yellow(`Audit log failed: ${err?.message ?? err}`),
      );
    }
  }

  /**
   * Release results for all students in the current academic session (WHOLE SCHOOL)
   * This collates all CA and Exam scores and creates Result records
   */
  async releaseResults(
    schoolId: string,
    userId: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🎓 Starting result release process for school: ${schoolId}`),
    );

    try {
      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: schoolId,
          is_current: true,
          status: 'active',
        },
      });

      if (!currentSession) {
        this.logger.error(colors.red(`❌ No current academic session found`));
        return ResponseHelper.error(
          colors.red(`❌ No current academic session found`),
          null,
          400,
        );
      }

      this.logger.log(
        colors.green(
          `✅ Using session: ${currentSession.academic_year} - ${currentSession.term}`,
        ),
      );

      // Check if results already exist for this session
      const existingResults = await this.prisma.result.findFirst({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
        },
      });

      if (existingResults) {
        this.logger.warn(
          colors.yellow(
            `⚠️ Results already exist for this session. Recalculating and updating existing results...`,
          ),
        );
      }

      // Get all active students in the school for this session
      const allStudents = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true,
        },
      });

      if (allStudents.length === 0) {
        this.logger.error(
          colors.red(`❌ No active students found for this session`),
        );
        return new ApiResponse(
          false,
          'No active students found for this session',
          null,
        );
      }

      this.logger.log(
        colors.blue(`📊 Found ${allStudents.length} students to process`),
      );

      // Get all eligible assessments for this session (library owner can release even if not yet marked released)
      const releasedAssessments = await this.prisma.assessment.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED'],
          },
          assessment_type: {
            in: ['EXAM', 'CBT'],
          },
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (releasedAssessments.length === 0) {
        this.logger.error(
          colors.red(
            `[Library School Results Service] ❌ No assessments found for this session`,
          ),
        );
        return new ApiResponse(
          false,
          'No assessments found for this session',
          null,
        );
      }

      // All DB writes in one transaction: all succeed or all fail
      let processedCount = 0;
      let errorCount = 0;
      await this.prisma.$transaction(async (tx) => {
        // Library owner: mark assessments as released and set view/edit flags
        await tx.assessment.updateMany({
          where: { id: { in: releasedAssessments.map((a) => a.id) } },
          data: {
            is_result_released: true,
            student_can_view_grading: true,
            can_edit_assessment: false,
            status: 'CLOSED',
          },
        });

        this.logger.log(
          colors.blue(
            `[Library School Results Service] 📚 Found ${releasedAssessments.length} assessments - marked as released`,
          ),
        );

        // Process students in batches to avoid overwhelming the system
        const totalBatches = Math.ceil(allStudents.length / this.BATCH_SIZE);

        for (let i = 0; i < allStudents.length; i += this.BATCH_SIZE) {
          const batch = allStudents.slice(i, i + this.BATCH_SIZE);
          const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

          this.logger.log(
            colors.cyan(
              `[Library School Results Service] 🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} students)`,
            ),
          );

          const batchPromises = batch.map((student) =>
            this.processStudentResults(
              student,
              releasedAssessments,
              currentSession.id,
              schoolId,
              null,
              tx,
            ).catch((error) => {
              this.logger.error(
                colors.red(
                  `[Library School Results Service] ❌ Error processing student ${student.id}: ${error.message}`,
                ),
              );
              errorCount++;
              return null;
            }),
          );

          const batchResults = await Promise.all(batchPromises);
          processedCount += batchResults.filter((r) => r !== null).length;

          if (i + this.BATCH_SIZE < allStudents.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        await this.calculateClassPositions(schoolId, currentSession.id, tx);
      });

      // Send push notifications to all students
      const studentUserIds = allStudents.map((s) => s.user_id);
      await this.sendResultReleaseNotifications(
        schoolId,
        studentUserIds,
        currentSession.academic_year,
        currentSession.term,
        'released',
      );

      this.logger.log(colors.green(`✅ Result release completed!`));
      this.logger.log(
        colors.green(
          `   - Processed: ${processedCount}/${allStudents.length} students`,
        ),
      );
      this.logger.log(colors.green(`   - Errors: ${errorCount}`));

      await this.logAudit(AuditForType.release_results, schoolId, userId, {
        scope: 'whole_school',
        session_id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term,
        processed: processedCount,
        total_students: allStudents.length,
        errors: errorCount,
      });

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
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error releasing results: ${error.message}`),
      );
      return new ApiResponse(
        false,
        `Failed to release results: ${error.message}`,
        null,
      );
    }
  }

  /**
   * Release results for a single student
   */
  async releaseResultsForStudent(
    schoolId: string,
    userId: string,
    studentId: string,
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🎓 Releasing results for student: ${studentId}`),
    );

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId,
          },
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active',
          },
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
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true,
        },
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found`));
        return ResponseHelper.error('Student not found', null, 404);
      }

      // Get all eligible assessments for this session (library owner can release even if not yet marked released)
      const assessments = await this.prisma.assessment.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED'],
          },
          assessment_type: {
            in: ['EXAM', 'CBT'],
          },
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (assessments.length === 0) {
        this.logger.error(
          colors.red(`❌ No assessments found for this session`),
        );
        return ResponseHelper.error(
          'No assessments found for this session',
          null,
          400,
        );
      }

      // All DB writes in one transaction: all succeed or all fail
      await this.prisma.$transaction(async (tx) => {
        await tx.assessment.updateMany({
          where: { id: { in: assessments.map((a) => a.id) } },
          data: {
            is_result_released: true,
            student_can_view_grading: true,
            can_edit_assessment: false,
            status: 'CLOSED',
          },
        });
        await this.processStudentResults(
          student,
          assessments,
          currentSession.id,
          schoolId,
          null,
          tx,
        );
        await this.calculateClassPositions(schoolId, currentSession.id, tx);
      });

      // Send push notification to student
      await this.sendResultReleaseNotifications(
        schoolId,
        [student.user_id],
        currentSession.academic_year,
        currentSession.term,
        'released',
      );

      this.logger.log(
        colors.green(`✅ Results released successfully for student`),
      );

      await this.logAudit(AuditForType.release_results, schoolId, userId, {
        scope: 'student',
        student_id: studentId,
        session_id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term,
      });

      return ResponseHelper.success(
        'Results released successfully for student',
        {
          student_id: student.id,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error releasing results for student: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to release results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Release results for all students in a specific class
   */
  async releaseResultsForClass(
    schoolId: string,
    userId: string,
    classId: string,
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`🎓 Releasing results for class: ${classId}`));

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId,
          },
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active',
          },
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
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true,
        },
      });

      if (classStudents.length === 0) {
        this.logger.error(
          colors.red(
            `[Library School Results Service] ❌ No students found in this class`,
          ),
        );
        return ResponseHelper.error(
          'No students found in this class',
          null,
          404,
        );
      }

      // Get all eligible assessments for this session (library owner can release even if not yet marked released)
      const releasedAssessments = await this.prisma.assessment.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED'],
          },
          assessment_type: {
            in: ['EXAM', 'CBT'],
          },
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (releasedAssessments.length === 0) {
        this.logger.error(
          colors.red(
            `[Library School Results Service] ❌ No assessments found for this session`,
          ),
        );
        return ResponseHelper.error(
          'No assessments found for this session',
          null,
          400,
        );
      }

      this.logger.log(
        colors.blue(
          `[Library School Results Service] 📊 Processing ${classStudents.length} students in class`,
        ),
      );

      let processedCount = 0;
      let errorCount = 0;
      await this.prisma.$transaction(async (tx) => {
        await tx.assessment.updateMany({
          where: { id: { in: releasedAssessments.map((a) => a.id) } },
          data: {
            is_result_released: true,
            student_can_view_grading: true,
            can_edit_assessment: false,
            status: 'CLOSED',
          },
        });

        const totalBatches = Math.ceil(classStudents.length / this.BATCH_SIZE);
        for (let i = 0; i < classStudents.length; i += this.BATCH_SIZE) {
          const batch = classStudents.slice(i, i + this.BATCH_SIZE);
          const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

          this.logger.log(
            colors.cyan(
              `[Library School Results Service] 🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} students)`,
            ),
          );

          const batchPromises = batch.map((student) =>
            this.processStudentResults(
              student,
              releasedAssessments,
              currentSession.id,
              schoolId,
              null,
              tx,
            ).catch((error) => {
              this.logger.error(
                colors.red(
                  `❌ Error processing student ${student.id}: ${error.message}`,
                ),
              );
              errorCount++;
              return null;
            }),
          );

          const batchResults = await Promise.all(batchPromises);
          processedCount += batchResults.filter((r) => r !== null).length;

          if (i + this.BATCH_SIZE < classStudents.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        await this.calculateClassPositions(schoolId, currentSession.id, tx);
      });

      // Send push notifications to all students in class
      const studentUserIds = classStudents.map((s) => s.user_id);
      await this.sendResultReleaseNotifications(
        schoolId,
        studentUserIds,
        currentSession.academic_year,
        currentSession.term,
        'released',
      );

      this.logger.log(
        colors.green(`✅ Results released successfully for class`),
      );
      this.logger.log(
        colors.green(
          `   - Processed: ${processedCount}/${classStudents.length} students`,
        ),
      );
      this.logger.log(colors.green(`   - Errors: ${errorCount}`));

      await this.logAudit(AuditForType.release_results, schoolId, userId, {
        scope: 'class',
        class_id: classId,
        session_id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term,
        total_students: classStudents.length,
        processed: processedCount,
        errors: errorCount,
      });

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
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error releasing results for class: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to release results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Release results for multiple students by their IDs
   */
  async releaseResultsForStudents(
    schoolId: string,
    userId: string,
    studentIds: string[],
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🎓 Releasing results for ${studentIds.length} students`),
    );

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId,
          },
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active',
          },
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
            in: studentIds,
          },
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true,
        },
      });

      if (students.length === 0) {
        this.logger.error(colors.red(`❌ No students found`));
        return ResponseHelper.error(
          'No students found with the provided IDs',
          null,
          404,
        );
      }

      // Check if some student IDs were not found
      const foundStudentIds = students.map((s) => s.id);
      const notFoundIds = studentIds.filter(
        (id) => !foundStudentIds.includes(id),
      );
      if (notFoundIds.length > 0) {
        this.logger.warn(
          colors.yellow(
            `⚠️  Some student IDs not found: ${notFoundIds.join(', ')}`,
          ),
        );
      }

      // Get all eligible assessments for this session (library owner can release even if not yet marked released)
      const releasedAssessments = await this.prisma.assessment.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          status: {
            in: ['PUBLISHED', 'ACTIVE', 'CLOSED'],
          },
          assessment_type: {
            in: ['EXAM', 'CBT'],
          },
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      if (releasedAssessments.length === 0) {
        this.logger.error(
          colors.red(
            `[Library School Results Service] ❌ No assessments found for this session`,
          ),
        );
        return ResponseHelper.error(
          'No assessments found for this session',
          null,
          400,
        );
      }

      this.logger.log(
        colors.blue(
          `[Library School Results Service] 📊 Processing ${students.length} students`,
        ),
      );

      let processedCount = 0;
      let errorCount = 0;
      await this.prisma.$transaction(async (tx) => {
        await tx.assessment.updateMany({
          where: { id: { in: releasedAssessments.map((a) => a.id) } },
          data: {
            is_result_released: true,
            student_can_view_grading: true,
            can_edit_assessment: false,
            status: 'CLOSED',
          },
        });

        const totalBatches = Math.ceil(students.length / this.BATCH_SIZE);
        for (let i = 0; i < students.length; i += this.BATCH_SIZE) {
          const batch = students.slice(i, i + this.BATCH_SIZE);
          const batchNumber = Math.floor(i / this.BATCH_SIZE) + 1;

          this.logger.log(
            colors.cyan(
              `[Library School Results Service] 🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} students)`,
            ),
          );

          const batchPromises = batch.map((student) =>
            this.processStudentResults(
              student,
              releasedAssessments,
              currentSession.id,
              schoolId,
              null,
              tx,
            ).catch((error) => {
              this.logger.error(
                colors.red(
                  `[Library School Results Service] ❌ Error processing student ${student.id}: ${error.message}`,
                ),
              );
              errorCount++;
              return null;
            }),
          );

          const batchResults = await Promise.all(batchPromises);
          processedCount += batchResults.filter((r) => r !== null).length;

          if (i + this.BATCH_SIZE < students.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        await this.calculateClassPositions(schoolId, currentSession.id, tx);
      });

      // Send push notifications to all students
      const studentUserIds = students.map((s) => s.user_id);
      await this.sendResultReleaseNotifications(
        schoolId,
        studentUserIds,
        currentSession.academic_year,
        currentSession.term,
        'released',
      );

      this.logger.log(
        colors.green(`✅ Results released successfully for students`),
      );
      this.logger.log(
        colors.green(
          `   - Processed: ${processedCount}/${students.length} students`,
        ),
      );
      this.logger.log(colors.green(`   - Errors: ${errorCount}`));
      if (notFoundIds.length > 0) {
        this.logger.log(
          colors.yellow(`   - Not found: ${notFoundIds.length} student IDs`),
        );
      }

      await this.logAudit(AuditForType.release_results, schoolId, userId, {
        scope: 'students',
        student_ids: studentIds,
        session_id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term,
        total_requested: studentIds.length,
        total_found: students.length,
        processed: processedCount,
        errors: errorCount,
        not_found_count: notFoundIds.length,
      });

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
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error releasing results for students: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to release results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Unrelease results for a single student
   */
  async unreleaseResultsForStudent(
    schoolId: string,
    userId: string,
    studentId: string,
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🔒 Unreleasing results for student: ${studentId}`),
    );

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId,
          },
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active',
          },
        });
      }

      if (!currentSession) {
        this.logger.error(
          colors.red(
            `[Library School Results Service] ❌ No academic session found`,
          ),
        );
        return ResponseHelper.error('No academic session found', null, 400);
      }

      // Check if result exists
      const result = await this.prisma.result.findUnique({
        where: {
          academic_session_id_student_id: {
            academic_session_id: currentSession.id,
            student_id: studentId,
          },
        },
      });

      if (!result) {
        this.logger.error(
          colors.red(
            `[Library School Results Service] ❌ Result not found for this student`,
          ),
        );
        return ResponseHelper.error(
          'Result not found for this student',
          null,
          404,
        );
      }

      // Get student user_id for notification
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        select: { user_id: true },
      });

      // Update the flag to false
      await this.prisma.result.update({
        where: {
          academic_session_id_student_id: {
            academic_session_id: currentSession.id,
            student_id: studentId,
          },
        },
        data: {
          released_by_school_admin: false,
        },
      });

      // Send push notification to student
      if (student) {
        await this.sendResultReleaseNotifications(
          schoolId,
          [student.user_id],
          currentSession.academic_year,
          currentSession.term,
          'unreleased',
        );
      }

      this.logger.log(
        colors.green(`✅ Results unreleased successfully for student`),
      );

      await this.logAudit(AuditForType.unrelease_results, schoolId, userId, {
        scope: 'student',
        student_id: studentId,
        session_id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term,
      });

      return ResponseHelper.success(
        'Results unreleased successfully for student',
        {
          student_id: studentId,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(
          `❌ Error unreleasing results for student: ${error.message}`,
        ),
      );
      return ResponseHelper.error(
        `Failed to unrelease results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Unrelease results for multiple students by their IDs
   */
  async unreleaseResultsForStudents(
    schoolId: string,
    userId: string,
    studentIds: string[],
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🔒 Unreleasing results for ${studentIds.length} students`),
    );

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId,
          },
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active',
          },
        });
      }

      if (!currentSession) {
        this.logger.error(colors.red(`❌ No academic session found`));
        return ResponseHelper.error('No academic session found', null, 400);
      }

      // Get student user_ids for notifications
      const students = await this.prisma.student.findMany({
        where: {
          id: { in: studentIds },
          school_id: schoolId,
        },
        select: { user_id: true },
      });

      // Update all results for these students
      const updateResult = await this.prisma.result.updateMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          student_id: {
            in: studentIds,
          },
        },
        data: {
          released_by_school_admin: false,
        },
      });

      // Send push notifications to all students
      if (students.length > 0) {
        const studentUserIds = students.map((s) => s.user_id);
        await this.sendResultReleaseNotifications(
          schoolId,
          studentUserIds,
          currentSession.academic_year,
          currentSession.term,
          'unreleased',
        );
      }

      this.logger.log(
        colors.green(
          `✅ Results unreleased successfully for ${updateResult.count} students`,
        ),
      );

      await this.logAudit(AuditForType.unrelease_results, schoolId, userId, {
        scope: 'students',
        student_ids: studentIds,
        session_id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term,
        total_requested: studentIds.length,
        total_updated: updateResult.count,
      });

      return ResponseHelper.success(
        `Results unreleased successfully for ${updateResult.count} students`,
        {
          total_requested: studentIds.length,
          total_updated: updateResult.count,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(
          `❌ Error unreleasing results for students: ${error.message}`,
        ),
      );
      return ResponseHelper.error(
        `Failed to unrelease results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Unrelease results for all students in a specific class
   */
  async unreleaseResultsForClass(
    schoolId: string,
    userId: string,
    classId: string,
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🔒 Unreleasing results for class: ${classId}`),
    );

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId,
          },
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active',
          },
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
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
        },
      });

      if (classStudents.length === 0) {
        this.logger.error(colors.red(`❌ No students found in this class`));
        return ResponseHelper.error(
          'No students found in this class',
          null,
          404,
        );
      }

      const studentIds = classStudents.map((s) => s.id);
      const studentUserIds = classStudents.map((s) => s.user_id);

      // Update all results for students in this class
      const updateResult = await this.prisma.result.updateMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          student_id: {
            in: studentIds,
          },
        },
        data: {
          released_by_school_admin: false,
        },
      });

      // Send push notifications to all students in class
      await this.sendResultReleaseNotifications(
        schoolId,
        studentUserIds,
        currentSession.academic_year,
        currentSession.term,
        'unreleased',
      );

      this.logger.log(
        colors.green(`✅ Results unreleased successfully for class`),
      );
      this.logger.log(
        colors.green(
          `   - Updated: ${updateResult.count}/${classStudents.length} students`,
        ),
      );

      await this.logAudit(AuditForType.unrelease_results, schoolId, userId, {
        scope: 'class',
        class_id: classId,
        session_id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term,
        total_students: classStudents.length,
        updated: updateResult.count,
      });

      return ResponseHelper.success(
        `Results unreleased successfully for ${updateResult.count} students in class`,
        {
          class_id: classId,
          total_students: classStudents.length,
          updated: updateResult.count,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error unreleasing results for class: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to unrelease results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Unrelease results for all students in the school (whole school)
   */
  async unreleaseResults(
    schoolId: string,
    userId: string,
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`🔒 Unreleasing results for whole school`));

    try {
      // Get academic session (use provided or current)
      let currentSession;
      if (sessionId) {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            id: sessionId,
            school_id: schoolId,
          },
        });
      } else {
        currentSession = await this.prisma.academicSession.findFirst({
          where: {
            school_id: schoolId,
            is_current: true,
            status: 'active',
          },
        });
      }

      if (!currentSession) {
        this.logger.error(colors.red(`❌ No academic session found`));
        return ResponseHelper.error('No academic session found', null, 400);
      }

      // Get all students with results for this session
      const results = await this.prisma.result.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
        },
        select: {
          student_id: true,
        },
      });

      // Get student user_ids
      const studentIds = [...new Set(results.map((r) => r.student_id))];
      const students = await this.prisma.student.findMany({
        where: {
          id: { in: studentIds },
          school_id: schoolId,
        },
        select: { user_id: true },
      });

      // Update all results for this session
      const updateResult = await this.prisma.result.updateMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
        },
        data: {
          released_by_school_admin: false,
        },
      });

      // Send push notifications to all students
      if (students.length > 0) {
        const studentUserIds = students.map((s) => s.user_id);
        await this.sendResultReleaseNotifications(
          schoolId,
          studentUserIds,
          currentSession.academic_year,
          currentSession.term,
          'unreleased',
        );
      }

      this.logger.log(
        colors.green(`✅ Results unreleased successfully for whole school`),
      );
      this.logger.log(
        colors.green(`   - Updated: ${updateResult.count} results`),
      );

      await this.logAudit(AuditForType.unrelease_results, schoolId, userId, {
        scope: 'whole_school',
        session_id: currentSession.id,
        academic_year: currentSession.academic_year,
        term: currentSession.term,
        total_updated: updateResult.count,
      });

      return ResponseHelper.success(
        `Results unreleased successfully for ${updateResult.count} students`,
        {
          total_updated: updateResult.count,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error unreleasing results: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to unrelease results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Process results for a single student.
   * releasedBy: User.id when released by school director; null when released by library owner (Result.released_by FK is to User only).
   * tx: optional transaction client for atomic release (all succeed or all fail).
   */
  private async processStudentResults(
    student: { id: string; user_id: string; current_class_id: string | null },
    releasedAssessments: any[],
    sessionId: string,
    schoolId: string,
    releasedBy: string | null,
    tx?: Prisma.TransactionClient,
  ): Promise<any> {
    const client = tx ?? this.prisma;
    // Get final result (best attempt) for each released assessment
    const assessmentResults = await Promise.all(
      releasedAssessments.map(async (assessment) => {
        const studentResult = await client.assessmentAttempt.findFirst({
          where: {
            assessment_id: assessment.id,
            student_id: student.user_id,
            status: {
              in: ['SUBMITTED', 'GRADED'], // Include both submitted and graded attempts
            },
          },
          orderBy: [{ total_score: 'desc' }, { submitted_at: 'desc' }],
        });

        return {
          assessment,
          result: studentResult,
        };
      }),
    );

    // Filter out assessments where student has no result
    const validResults = assessmentResults.filter(
      (item) => item.result !== null,
    );

    if (validResults.length === 0) {
      // Upsert empty result record
      return await client.result.upsert({
        where: {
          academic_session_id_student_id: {
            academic_session_id: sessionId,
            student_id: student.id,
          },
        },
        update: {
          class_id: student.current_class_id,
          subject_results: [],
          released_by: releasedBy,
          released_by_school_admin: true,
        },
        create: {
          school_id: schoolId,
          academic_session_id: sessionId,
          student_id: student.id,
          class_id: student.current_class_id,
          subject_results: [],
          released_by: releasedBy,
          released_by_school_admin: true,
        },
      });
    }

    // Group results by subject
    const subjectMap = new Map<
      string,
      {
        subject_id: string;
        subject_code: string;
        subject_name: string;
        ca_score: number;
        exam_score: number;
        ca_max_score: number;
        exam_max_score: number;
        total_score: number;
        total_max_score: number;
      }
    >();

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
          total_max_score: 0,
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
    const subjectResults = Array.from(subjectMap.values()).map(
      (subjectData) => {
        const percentage =
          subjectData.total_max_score > 0
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
          grade: grade,
        };
      },
    );

    // Calculate overall statistics
    const totalCaScore = subjectResults.reduce(
      (sum, s) => sum + (s.ca_score || 0),
      0,
    );
    const totalExamScore = subjectResults.reduce(
      (sum, s) => sum + (s.exam_score || 0),
      0,
    );
    const totalScore = subjectResults.reduce(
      (sum, s) => sum + s.total_score,
      0,
    );
    const totalMaxScore = subjectResults.reduce(
      (sum, s) => sum + s.total_max_score,
      0,
    );
    const overallPercentage =
      totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
    const overallGrade = this.calculateGrade(overallPercentage);

    // Upsert result record
    return await client.result.upsert({
      where: {
        academic_session_id_student_id: {
          academic_session_id: sessionId,
          student_id: student.id,
        },
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
        released_by_school_admin: true,
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
        released_by_school_admin: true,
      },
    });
  }

  /**
   * Send push notifications for result release/unrelease
   */
  private async sendResultReleaseNotifications(
    schoolId: string,
    studentUserIds: string[],
    academicYear: string,
    term: string,
    action: 'released' | 'unreleased',
  ): Promise<void> {
    try {
      if (studentUserIds.length === 0) {
        return;
      }

      const title =
        action === 'released' ? '📊 Results Released' : '🔒 Results Unreleased';

      const body =
        action === 'released'
          ? `Your ${term} results for ${academicYear} have been released. Check your results now!`
          : `Your ${term} results for ${academicYear} are no longer available.`;

      this.logger.log(
        colors.cyan(
          `📱 Sending ${action} notifications to ${studentUserIds.length} students`,
        ),
      );

      await this.pushNotificationsService.sendNotificationByType({
        title,
        body,
        recipients: studentUserIds,
        schoolId,
        data: {
          type: 'result_release',
          action: action,
          academicYear,
          term,
          screen: 'Results',
        },
      });

      this.logger.log(colors.green(`✅ Notifications sent successfully`));
    } catch (error) {
      // Don't fail the main operation if notifications fail
      this.logger.error(
        colors.red(`❌ Error sending notifications: ${error.message}`),
      );
    }
  }

  /**
   * Calculate class positions for all students.
   * tx: optional transaction client for atomic release (all succeed or all fail).
   */
  private async calculateClassPositions(
    schoolId: string,
    sessionId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    this.logger.log(colors.cyan(`📊 Calculating class positions...`));

    // Get all classes
    const classes = await client.class.findMany({
      where: {
        schoolId: schoolId,
      },
      select: {
        id: true,
      },
    });

    // Calculate positions for each class
    for (const classItem of classes) {
      // Get actual count of active students in the class (not just those with results)
      const totalStudentsInClass = await client.student.count({
        where: {
          school_id: schoolId,
          academic_session_id: sessionId,
          current_class_id: classItem.id,
          status: 'active',
        },
      });

      const classResults = await client.result.findMany({
        where: {
          class_id: classItem.id,
          academic_session_id: sessionId,
        },
        orderBy: {
          overall_percentage: 'desc',
        },
      });

      // Update positions
      for (let i = 0; i < classResults.length; i++) {
        await client.result.update({
          where: { id: classResults[i].id },
          data: {
            class_position: i + 1,
            total_students: totalStudentsInClass, // Use actual class enrollment count
          },
        });
      }
    }

    this.logger.log(colors.green(`✅ Class positions calculated`));
  }

  /**
   * Calculate grade based on percentage
   * Scale: A 80-100, B 70-79.9, C 60-69.9, D 50-59.9, E 40-49.9, F <40
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
  }

  /**
   * Get results dashboard data for a school (library owner on behalf of school).
   * Returns: sessions, classes, subjects, and paginated results.
   */
  async getResultsDashboard(
    schoolId: string,
    filters: {
      sessionId?: string;
      classId?: string;
      subjectId?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    try {
      this.logger.log(
        colors.cyan(
          `[LIBRARY-OWNER] 📊 Getting results dashboard for school: ${schoolId}`,
        ),
      );

      const { sessionId, classId, subjectId, page = 1, limit = 10 } = filters;

      const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
      const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : limit;
      const skip = (pageNum - 1) * limitNum;

      // 1. Get all academic sessions and terms (active session/term at top)
      const allSessions = await this.prisma.academicSession.findMany({
        where: {
          school_id: schoolId,
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
              results: true,
            },
          },
        },
        orderBy: [
          { is_current: 'desc' },
          { start_year: 'desc' },
          { term: 'desc' },
        ],
      });

      // Get current active session
      const currentSession =
        allSessions.find((s) => s.is_current && s.status === 'active') ||
        allSessions[0];

      // 2. Get all classes
      const classes = await this.prisma.class.findMany({
        where: {
          schoolId: schoolId,
        },
        include: {
          classTeacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          _count: {
            select: {
              students: true,
              subjects: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      // 3. Get all subjects
      const subjects = await this.prisma.subject.findMany({
        where: {
          schoolId: schoolId,
          ...(currentSession ? { academic_session_id: currentSession.id } : {}),
        },
        select: {
          id: true,
          name: true,
          code: true,
          color: true,
          description: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      // Determine which session and class to use (NO default subject selection)
      const selectedSessionId = sessionId || currentSession?.id;
      const selectedClassId =
        classId || (classes.length > 0 ? classes[0].id : null);

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
            school_id: schoolId,
            academic_session_id: selectedSessionId,
            current_class_id: selectedClassId,
            status: 'active',
          },
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                display_picture: true,
              },
            },
          },
          orderBy: {
            user: {
              last_name: 'asc',
            },
          },
        });

        totalStudentsInClass = allStudentsInClass.length;

        if (totalStudentsInClass === 0) {
          resultMessage = 'No students found in this class';
        } else {
          // Get all subjects for this class
          classSubjects = await this.prisma.subject.findMany({
            where: {
              schoolId: schoolId,
              academic_session_id: selectedSessionId,
              classId: selectedClassId,
            },
            select: {
              id: true,
              name: true,
              code: true,
              color: true,
              description: true,
            },
            orderBy: {
              name: 'asc',
            },
          });

          this.logger.log(
            colors.cyan(`📊 Class subjects: ${classSubjects.length}`),
          );

          if (classSubjects.length === 0) {
            resultMessage = 'No subjects found for this class';
          } else {
            const studentUserIds = allStudentsInClass.map((s) => s.user_id);

            // Get all released assessments (status CLOSED) for all subjects in this class
            const allReleasedAssessments =
              await this.prisma.assessment.findMany({
                where: {
                  school_id: schoolId,
                  academic_session_id: selectedSessionId,
                  subject_id: {
                    in: classSubjects.map((s) => s.id),
                  },
                  assessment_type: {
                    in: ['CBT', 'EXAM'],
                  },
                  // status: 'CLOSED',
                  // is_result_released: true
                },
                select: {
                  id: true,
                  title: true,
                  assessment_type: true,
                  total_points: true,
                  subject_id: true,
                  createdAt: true,
                },
                orderBy: [
                  { subject_id: 'asc' },
                  { assessment_type: 'asc' },
                  { createdAt: 'asc' },
                ],
              });

            this.logger.log(
              colors.cyan(
                `📊 Released assessments: ${allReleasedAssessments.length}`,
              ),
            );

            // Check which students have results released by admin for this session
            const releasedResults = await this.prisma.result.findMany({
              where: {
                school_id: schoolId,
                academic_session_id: selectedSessionId,
                student_id: {
                  in: allStudentsInClass.map((s) => s.id),
                },
                released_by_school_admin: true,
              },
              select: {
                student_id: true,
              },
            });

            // Create a map of student IDs that have released results
            const releasedStudentIds = new Set(
              releasedResults.map((r) => r.student_id),
            );

            // Get all assessment attempts for these assessments (student may have multiple attempts per assessment)
            const allAttempts = await this.prisma.assessmentAttempt.findMany({
              where: {
                school_id: schoolId,
                academic_session_id: selectedSessionId,
                assessment_id: {
                  in: allReleasedAssessments.map((a) => a.id),
                },
                student_id: {
                  in: studentUserIds,
                },
                status: {
                  in: ['SUBMITTED', 'GRADED'],
                },
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
                    subject_id: true,
                  },
                },
              },
            });

            // For each (student, assessment), keep only the attempt with the highest total_score
            const bestAttemptByStudentAndAssessment = new Map<string, any>();
            for (const attempt of allAttempts) {
              const key = `${attempt.student_id}:${attempt.assessment_id}`;
              const existing = bestAttemptByStudentAndAssessment.get(key);
              const attemptScore = attempt.total_score ?? 0;
              if (!existing || (existing.total_score ?? 0) < attemptScore) {
                bestAttemptByStudentAndAssessment.set(key, attempt);
              }
            }

            // Build map: student_id -> subject_id -> assessment_id -> best attempt
            const attemptsMap = new Map<
              string,
              Map<string, Map<string, any>>
            >();
            bestAttemptByStudentAndAssessment.forEach((attempt) => {
              if (!attemptsMap.has(attempt.student_id)) {
                attemptsMap.set(attempt.student_id, new Map());
              }
              const studentAttempts = attemptsMap.get(attempt.student_id)!;
              const subjectId = attempt.assessment.subject_id;
              if (!studentAttempts.has(subjectId)) {
                studentAttempts.set(subjectId, new Map());
              }
              const subjectAttempts = studentAttempts.get(subjectId)!;
              subjectAttempts.set(attempt.assessment_id, attempt);
            });

            // Helper: A 80-100, B 70-79.9, C 60-69.9, D 50-59.9, E 40-49.9, F <40
            const calculateGrade = (percentage: number): string => {
              if (percentage >= 80) return 'A';
              if (percentage >= 70) return 'B';
              if (percentage >= 60) return 'C';
              if (percentage >= 50) return 'D';
              if (percentage >= 40) return 'E';
              return 'F';
            };

            // Build results table - calculate score for each subject
            const studentResults = allStudentsInClass.map((student) => {
              const studentAttempts =
                attemptsMap.get(student.user_id) || new Map();
              const subjectScores: any = {};
              let totalObtained = 0;
              let totalObtainable = 0;

              // Calculate score for each subject
              classSubjects.forEach((subject) => {
                const subjectAttempts =
                  studentAttempts.get(subject.id) || new Map();

                // Get all assessments for this subject
                const subjectAssessments = allReleasedAssessments.filter(
                  (a) => a.subject_id === subject.id,
                );
                const cbtAssessments = subjectAssessments.filter(
                  (a) => a.assessment_type === 'CBT',
                );
                const examAssessments = subjectAssessments.filter(
                  (a) => a.assessment_type === 'EXAM',
                );

                // Check if any assessments exist for this subject
                const hasAssessments = subjectAssessments.length > 0;

                // Calculate CBT total
                let cbtObtained = 0;
                let cbtObtainable = 0;
                cbtAssessments.forEach((cbt) => {
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

                // If no assessments exist for this subject, mark as not available
                const isAvailable = hasAssessments;
                const subjectPercentage =
                  subjectObtainable > 0
                    ? (subjectObtained / subjectObtainable) * 100
                    : 0;

                subjectScores[subject.id] = {
                  subjectId: subject.id,
                  subjectName: subject.name,
                  subjectCode: subject.code,
                  obtained: isAvailable ? subjectObtained : null,
                  obtainable: isAvailable ? subjectObtainable : null,
                  percentage: isAvailable ? subjectPercentage : null,
                  grade: isAvailable ? calculateGrade(subjectPercentage) : null,
                  isAvailable: isAvailable, // Flag to indicate if assessments exist
                };

                // Only add to totals if assessments exist for this subject
                if (isAvailable) {
                  totalObtained += subjectObtained;
                  totalObtainable += subjectObtainable;
                }
              });

              const overallPercentage =
                totalObtainable > 0
                  ? (totalObtained / totalObtainable) * 100
                  : 0;

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
                  displayPicture: student.user.display_picture,
                },
                subjectScores: subjectScores,
                totalObtained: totalObtained,
                totalObtainable: totalObtainable,
                percentage: overallPercentage,
                grade: calculateGrade(overallPercentage),
                position: 0, // Will be calculated after sorting
                isReleased: isReleased, // Indicates if results are released by admin for this term
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
            const paginatedResults = studentResults.slice(
              skip,
              skip + limitNum,
            );

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
        current_session: currentSession
          ? {
              id: currentSession.id,
              academic_year: currentSession.academic_year,
              term: currentSession.term,
              status: currentSession.status,
              is_current: currentSession.is_current,
            }
          : null,
        classes: classes.map((cls) => ({
          id: cls.id,
          name: cls.name,
          classTeacher: cls.classTeacher
            ? {
                id: cls.classTeacher.id,
                first_name: cls.classTeacher.first_name,
                last_name: cls.classTeacher.last_name,
                email: cls.classTeacher.email,
              }
            : null,
          student_count: cls._count.students,
          subject_count: cls._count.subjects,
        })),
        subjects: classSubjects.length > 0 ? classSubjects : subjects,
        selected_filters: {
          sessionId: selectedSessionId,
          classId: selectedClassId,
          subjectId: null, // No default subject selection
        },
        total_students_in_class: totalStudentsInClass,
        results: hasResults ? results : null,
        result_message: resultMessage,
        pagination: hasResults
          ? {
              page: pageNum,
              limit: limitNum,
              total: totalResults,
              totalPages,
              hasNext: pageNum < totalPages,
              hasPrev: pageNum > 1,
            }
          : null,
      };

      // Log what's being sent to frontend
      this.logger.log(colors.cyan(`📤 Sending to frontend:`));
      this.logger.log(
        colors.cyan(`   - Class subjects: ${classSubjects.length}`),
      );
      this.logger.log(
        colors.cyan(`   - Total students in class: ${totalStudentsInClass}`),
      );
      this.logger.log(
        colors.cyan(`   - Results count: ${results ? results.length : 0}`),
      );
      if (results && results.length > 0) {
        this.logger.log(
          colors.cyan(
            `   - First result student: ${results[0].student.firstName} ${results[0].student.lastName}`,
          ),
        );
        this.logger.log(
          colors.cyan(
            `   - First result subjects with scores: ${Object.keys(results[0].subjectScores || {}).length}`,
          ),
        );
        this.logger.log(
          colors.cyan(
            `   - First result total obtained: ${results[0].totalObtained}`,
          ),
        );
        this.logger.log(
          colors.cyan(
            `   - First result total obtainable: ${results[0].totalObtainable}`,
          ),
        );
        this.logger.log(
          colors.cyan(`   - First result grade: ${results[0].grade}`),
        );
        this.logger.log(
          colors.cyan(`   - First result position: ${results[0].position}`),
        );
      }
      this.logger.log(
        colors.cyan(`   - Result message: ${resultMessage || 'None'}`),
      );
      this.logger.log(
        colors.green(`✅ Results dashboard retrieved successfully`),
      );

      return ResponseHelper.success(
        'Results dashboard retrieved successfully',
        responseData,
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error getting results dashboard: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to retrieve results dashboard: ${error.message}`,
        null,
        500,
      );
    }
  }
}
