import { ConflictException, Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  ResultComputationBatchStatus,
  ResultComputationScope,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ApiResponse } from '../../shared/helper-functions/response';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { PushNotificationsService } from '../../push-notifications/push-notifications.service';
import { GradingScaleService } from '../../school/director/grading-scale/grading-scale.service';
import {
  gradeFromMinThresholds,
  type GradeThreshold,
} from '../../shared/grading/school-percentage-grade';

@Injectable()
export class DirectorResultService {
  private readonly logger = new Logger(DirectorResultService.name);
  private readonly BATCH_SIZE = 50; // Process 50 students at a time

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotificationsService: PushNotificationsService,
    private readonly gradingScaleService: GradingScaleService,
  ) {}

  /**
   * Publish results for the whole school (visibility only). Requires computed `Result` rows.
   */
  async releaseResults(
    schoolId: string,
    userId: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🎓 Publishing results (whole school) for school: ${schoolId}`),
    );

    try {
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
          `No current academic session found`,
          null,
          400,
        );
      }

      const updated = await this.prisma.result.updateMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
        },
        data: {
          released_by_school_admin: true,
          released_by: userId,
          released_at: new Date(),
        },
      });

      if (updated.count === 0) {
        return new ApiResponse(
          false,
          'No computed results for this session. Compute results first, then publish.',
          null,
        );
      }

      const results = await this.prisma.result.findMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
        },
        include: {
          student: { select: { user_id: true } },
        },
      });
      const studentUserIds = [
        ...new Set(results.map((r) => r.student.user_id)),
      ];

      await this.sendResultReleaseNotifications(
        schoolId,
        studentUserIds,
        currentSession.academic_year,
        currentSession.term,
        'released',
      );

      return new ApiResponse(true, `Results published for ${updated.count} students`, {
        published_count: updated.count,
        session: {
          id: currentSession.id,
          academic_year: currentSession.academic_year,
          term: currentSession.term,
        },
      });
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error publishing results: ${error.message}`),
      );
      return new ApiResponse(
        false,
        `Failed to publish results: ${error.message}`,
        null,
      );
    }
  }

  /**
   * Publish results for one student (visibility only). Requires a computed `Result` row.
   */
  async releaseResultsForStudent(
    schoolId: string,
    userId: string,
    studentId: string,
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🎓 Publishing results for student: ${studentId}`),
    );

    try {
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

      const student = await this.prisma.student.findFirst({
        where: {
          id: studentId,
          school_id: schoolId,
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
        },
      });

      if (!student) {
        this.logger.error(colors.red(`❌ Student not found`));
        return ResponseHelper.error('Student not found', null, 404);
      }

      const existing = await this.prisma.result.findUnique({
        where: {
          academic_session_id_student_id: {
            academic_session_id: currentSession.id,
            student_id: student.id,
          },
        },
      });

      if (!existing) {
        return ResponseHelper.error(
          'No computed result for this student. Compute results first, then publish.',
          null,
          400,
        );
      }

      await this.prisma.result.update({
        where: {
          academic_session_id_student_id: {
            academic_session_id: currentSession.id,
            student_id: student.id,
          },
        },
        data: {
          released_by_school_admin: true,
          released_by: userId,
          released_at: new Date(),
        },
      });

      await this.sendResultReleaseNotifications(
        schoolId,
        [student.user_id],
        currentSession.academic_year,
        currentSession.term,
        'released',
      );

      return ResponseHelper.success(
        'Results published for student',
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
        colors.red(`❌ Error publishing results for student: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to publish results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Publish results for all students in a class who have computed rows (visibility only).
   */
  async releaseResultsForClass(
    schoolId: string,
    userId: string,
    classId: string,
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(colors.cyan(`🎓 Publishing results for class: ${classId}`));

    try {
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

      const classStudents = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
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

      const updated = await this.prisma.result.updateMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          student_id: { in: studentIds },
        },
        data: {
          released_by_school_admin: true,
          released_by: userId,
          released_at: new Date(),
        },
      });

      if (updated.count === 0) {
        return ResponseHelper.error(
          'No computed results for students in this class. Compute results first, then publish.',
          null,
          400,
        );
      }

      const studentUserIds = classStudents.map((s) => s.user_id);
      await this.sendResultReleaseNotifications(
        schoolId,
        studentUserIds,
        currentSession.academic_year,
        currentSession.term,
        'released',
      );

      return ResponseHelper.success(
        `Results published for ${updated.count} students in class`,
        {
          class_id: classId,
          published_count: updated.count,
          session: {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error publishing results for class: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to publish results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Publish results for multiple students (visibility only). Only updates existing `Result` rows.
   */
  async releaseResultsForStudents(
    schoolId: string,
    userId: string,
    studentIds: string[],
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    this.logger.log(
      colors.cyan(`🎓 Publishing results for ${studentIds.length} students`),
    );

    try {
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

      const students = await this.prisma.student.findMany({
        where: {
          id: { in: studentIds },
          school_id: schoolId,
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
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

      const updated = await this.prisma.result.updateMany({
        where: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          student_id: { in: foundStudentIds },
        },
        data: {
          released_by_school_admin: true,
          released_by: userId,
          released_at: new Date(),
        },
      });

      if (updated.count === 0) {
        return ResponseHelper.error(
          'No computed results for these students. Compute results first, then publish.',
          null,
          400,
        );
      }

      const studentUserIds = students.map((s) => s.user_id);
      await this.sendResultReleaseNotifications(
        schoolId,
        studentUserIds,
        currentSession.academic_year,
        currentSession.term,
        'released',
      );

      return ResponseHelper.success(
        `Results published for ${updated.count} students`,
        {
          total_requested: studentIds.length,
          total_found: students.length,
          published_count: updated.count,
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
        colors.red(`❌ Error publishing results for students: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to publish results: ${error.message}`,
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
          colors.red(`[Director Results Service] ❌ No academic session found`),
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
            `[Director Results Service] ❌ Result not found for this student`,
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

      // Class roster: same rule as Students dashboard — by class, not by Student.academic_session_id
      const classStudents = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
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
   * Compute and store results for one or more students (not visible until published).
   */
  async computeResultsForStudents(
    schoolId: string,
    userId: string,
    studentIds: string[],
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    try {
      const currentSession = await this.resolveAcademicSessionForSchool(
        schoolId,
        sessionId,
      );
      if (!currentSession) {
        return ResponseHelper.error('No academic session found', null, 400);
      }

      const batch = await this.prisma.resultComputationBatch.create({
        data: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          scope: ResultComputationScope.STUDENTS,
          created_by_user_id: userId,
        },
      });

      const students = await this.prisma.student.findMany({
        where: {
          id: { in: studentIds },
          school_id: schoolId,
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true,
        },
      });

      if (students.length === 0) {
        await this.prisma.resultComputationBatch.delete({
          where: { id: batch.id },
        });
        return ResponseHelper.error(
          'No active students found for the given IDs',
          null,
          404,
        );
      }

      const releasedAssessments = await this.fetchReleasedAssessmentsForSession(
        schoolId,
        currentSession.id,
      );
      if (releasedAssessments.length === 0) {
        await this.prisma.resultComputationBatch.delete({
          where: { id: batch.id },
        });
        return ResponseHelper.error(
          'No released assessments found for this session',
          null,
          400,
        );
      }

      const gradeBands =
        await this.gradingScaleService.getResolvedBands(schoolId);

      let processed = 0;
      let errorCount = 0;
      for (const student of students) {
        try {
          await this.processStudentResults(
            student,
            releasedAssessments,
            currentSession.id,
            schoolId,
            userId,
            gradeBands,
            { publish: false, computationBatchId: batch.id },
          );
          processed++;
        } catch (e) {
          this.logger.error(
            colors.red(
              `[compute] student ${student.id}: ${(e as Error).message}`,
            ),
          );
          errorCount++;
        }
      }

      await this.calculateClassPositions(schoolId, currentSession.id);

      return ResponseHelper.success('Results computed', {
        batch_id: batch.id,
        processed,
        errors: errorCount,
        session: {
          id: currentSession.id,
          academic_year: currentSession.academic_year,
          term: currentSession.term,
        },
      });
    } catch (error) {
      this.logger.error(
        colors.red(`computeResultsForStudents: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to compute results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Compute results for all active students in a class.
   */
  async computeResultsForClass(
    schoolId: string,
    userId: string,
    classId: string,
    sessionId?: string,
  ): Promise<ApiResponse<any>> {
    try {
      const currentSession = await this.resolveAcademicSessionForSchool(
        schoolId,
        sessionId,
      );
      if (!currentSession) {
        return ResponseHelper.error('No academic session found', null, 400);
      }

      const batch = await this.prisma.resultComputationBatch.create({
        data: {
          school_id: schoolId,
          academic_session_id: currentSession.id,
          scope: ResultComputationScope.CLASS,
          class_id: classId,
          created_by_user_id: userId,
        },
      });

      const students = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
          current_class_id: classId,
          status: 'active',
        },
        select: {
          id: true,
          user_id: true,
          current_class_id: true,
        },
      });

      if (students.length === 0) {
        await this.prisma.resultComputationBatch.delete({
          where: { id: batch.id },
        });
        return ResponseHelper.error(
          'No students found in this class',
          null,
          404,
        );
      }

      const releasedAssessments = await this.fetchReleasedAssessmentsForSession(
        schoolId,
        currentSession.id,
      );
      if (releasedAssessments.length === 0) {
        await this.prisma.resultComputationBatch.delete({
          where: { id: batch.id },
        });
        return ResponseHelper.error(
          'No released assessments found for this session',
          null,
          400,
        );
      }

      const gradeBands =
        await this.gradingScaleService.getResolvedBands(schoolId);

      let processed = 0;
      let errorCount = 0;
      for (let i = 0; i < students.length; i += this.BATCH_SIZE) {
        const chunk = students.slice(i, i + this.BATCH_SIZE);
        const results = await Promise.all(
          chunk.map((student) =>
            this.processStudentResults(
              student,
              releasedAssessments,
              currentSession.id,
              schoolId,
              userId,
              gradeBands,
              { publish: false, computationBatchId: batch.id },
            ).catch((e) => {
              this.logger.error(
                colors.red(`[compute class] ${student.id}: ${e.message}`),
              );
              errorCount++;
              return null;
            }),
          ),
        );
        processed += results.filter((r) => r !== null).length;
      }

      await this.calculateClassPositions(schoolId, currentSession.id);

      return ResponseHelper.success('Results computed for class', {
        batch_id: batch.id,
        class_id: classId,
        total_students: students.length,
        processed,
        errors: errorCount,
        session: {
          id: currentSession.id,
          academic_year: currentSession.academic_year,
          term: currentSession.term,
        },
      });
    } catch (error) {
      this.logger.error(
        colors.red(`computeResultsForClass: ${error.message}`),
      );
      return ResponseHelper.error(
        `Failed to compute results: ${error.message}`,
        null,
        500,
      );
    }
  }

  /**
   * Delete computed results from a batch (blocked if any row is published).
   */
  async reverseComputationBatch(
    schoolId: string,
    userId: string,
    batchId: string,
  ): Promise<ApiResponse<any>> {
    const batch = await this.prisma.resultComputationBatch.findFirst({
      where: { id: batchId, school_id: schoolId },
    });

    if (!batch) {
      return ResponseHelper.error('Computation batch not found', null, 404);
    }

    if (batch.status === ResultComputationBatchStatus.REVERSED) {
      return ResponseHelper.error('This batch was already reversed', null, 400);
    }

    const affected = await this.prisma.result.findMany({
      where: { computation_batch_id: batchId },
      select: { id: true, released_by_school_admin: true },
    });

    if (affected.some((r) => r.released_by_school_admin)) {
      throw new ConflictException(
        'Unpublish results for these students before reversing this computation.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.result.deleteMany({
        where: { computation_batch_id: batchId },
      }),
      this.prisma.resultComputationBatch.update({
        where: { id: batchId },
        data: {
          status: ResultComputationBatchStatus.REVERSED,
          reversed_at: new Date(),
          reversed_by_user_id: userId,
        },
      }),
    ]);

    await this.calculateClassPositions(schoolId, batch.academic_session_id);

    return ResponseHelper.success('Computation reversed; result rows removed.', {
      batch_id: batchId,
    });
  }

  private async resolveAcademicSessionForSchool(
    schoolId: string,
    sessionId?: string,
  ) {
    if (sessionId) {
      return this.prisma.academicSession.findFirst({
        where: { id: sessionId, school_id: schoolId },
      });
    }
    return this.prisma.academicSession.findFirst({
      where: {
        school_id: schoolId,
        is_current: true,
        status: 'active',
      },
    });
  }

  private async fetchReleasedAssessmentsForSession(
    schoolId: string,
    academicSessionId: string,
  ) {
    return this.prisma.assessment.findMany({
      where: {
        school_id: schoolId,
        academic_session_id: academicSessionId,
        is_result_released: true,
        status: { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] },
        assessment_type: { in: ['EXAM', 'CBT'] },
      },
      include: {
        subject: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  /**
   * Collate attempts into a `Result` row. Use `publish: true` only for legacy flows;
   * compute endpoints use `publish: false` and set `computationBatchId`.
   */
  private async processStudentResults(
    student: { id: string; user_id: string; current_class_id: string | null },
    releasedAssessments: any[],
    sessionId: string,
    schoolId: string,
    actorUserId: string,
    gradeBands: GradeThreshold[],
    options: { publish: boolean; computationBatchId?: string | null },
  ): Promise<any> {
    const { publish, computationBatchId } = options;

    const assessmentResults = await Promise.all(
      releasedAssessments.map(async (assessment) => {
        const studentResult = await this.prisma.assessmentAttempt.findFirst({
          where: {
            assessment_id: assessment.id,
            student_id: student.user_id,
            status: {
              in: ['SUBMITTED', 'GRADED'],
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

    const validResults = assessmentResults.filter(
      (item) => item.result !== null,
    );

    const visibilityData = publish
      ? {
          released_by: actorUserId,
          released_by_school_admin: true,
          released_at: new Date(),
        }
      : {
          released_by: null,
          released_by_school_admin: false,
          computation_batch_id: computationBatchId ?? null,
        };

    if (validResults.length === 0) {
      const saved = await this.prisma.result.upsert({
        where: {
          academic_session_id_student_id: {
            academic_session_id: sessionId,
            student_id: student.id,
          },
        },
        update: {
          class_id: student.current_class_id,
          subject_results: [],
          total_ca_score: 0,
          total_exam_score: 0,
          total_score: 0,
          total_max_score: 0,
          overall_percentage: 0,
          overall_grade: null,
          ...visibilityData,
        },
        create: {
          school_id: schoolId,
          academic_session_id: sessionId,
          student_id: student.id,
          class_id: student.current_class_id,
          subject_results: [],
          total_ca_score: 0,
          total_exam_score: 0,
          total_score: 0,
          total_max_score: 0,
          overall_percentage: 0,
          overall_grade: null,
          ...visibilityData,
        },
      });
      await this.replaceResultSubjectLines(
        saved.id,
        schoolId,
        sessionId,
        student.id,
        [],
      );
      return saved;
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
        const grade = gradeFromMinThresholds(percentage, gradeBands);

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
    const overallGrade = gradeFromMinThresholds(overallPercentage, gradeBands);

    const saved = await this.prisma.result.upsert({
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
        ...visibilityData,
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
        ...visibilityData,
      },
    });

    await this.replaceResultSubjectLines(
      saved.id,
      schoolId,
      sessionId,
      student.id,
      subjectResults,
    );

    return saved;
  }

  private async replaceResultSubjectLines(
    resultId: string,
    schoolId: string,
    academicSessionId: string,
    studentId: string,
    subjectResults: Array<{
      subject_id: string;
      ca_score: number | null;
      exam_score: number | null;
      total_score: number;
      total_max_score: number;
      percentage: number;
      grade: string;
    }>,
  ): Promise<void> {
    await this.prisma.resultSubjectLine.deleteMany({
      where: { result_id: resultId },
    });
    if (subjectResults.length === 0) {
      return;
    }
    await this.prisma.resultSubjectLine.createMany({
      data: subjectResults.map((s) => ({
        result_id: resultId,
        school_id: schoolId,
        academic_session_id: academicSessionId,
        student_id: studentId,
        subject_id: s.subject_id,
        ca_score: s.ca_score ?? 0,
        exam_score: s.exam_score ?? 0,
        total_score: s.total_score,
        total_max_score: s.total_max_score,
        percentage: s.percentage,
        grade: s.grade,
      })),
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
   * Calculate class positions for all students
   */
  private async calculateClassPositions(
    schoolId: string,
    sessionId: string,
  ): Promise<void> {
    this.logger.log(colors.cyan(`📊 Calculating class positions...`));

    // Get all classes
    const classes = await this.prisma.class.findMany({
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
      const totalStudentsInClass = await this.prisma.student.count({
        where: {
          school_id: schoolId,
          academic_session_id: sessionId,
          current_class_id: classItem.id,
          status: 'active',
        },
      });

      const classResults = await this.prisma.result.findMany({
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
        await this.prisma.result.update({
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
   * Director results dashboard: last 10 sessions, classes by display order,
   * per-subject CBT + EXAM slots with score/max (preview before release), DB pagination + search.
   */
  async getResultsDashboard(
    userId: string,
    filters: {
      sessionId?: string;
      classId?: string;
      page?: number;
      limit?: number;
      search?: string;
      studentStatus?: string;
    } = {},
  ) {
    try {
      this.logger.log(
        colors.cyan(`📊 Getting results dashboard for director: ${userId}`),
      );

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, school_id: true, role: true },
      });

      if (!user || user.role !== 'school_director') {
        return ResponseHelper.error(
          'Access denied. Director role required.',
          null,
          403,
        );
      }

      const gradeBands = await this.gradingScaleService.getResolvedBands(
        user.school_id,
      );

      const SESSION_LIMIT = 10;
      const { sessionId, classId, page = 1, limit = 10, search, studentStatus } =
        filters;

      const pageNum =
        typeof page === 'string' ? parseInt(page as string, 10) : Number(page);
      const limitNum =
        typeof limit === 'string' ? parseInt(limit as string, 10) : Number(limit);
      const skip = (pageNum - 1) * limitNum;
      const searchTrim =
        typeof search === 'string' ? search.trim() : '';

      const rawSt = studentStatus?.toLowerCase();
      const studentStatusFilter: UserStatus =
        rawSt === 'active' ||
        rawSt === 'suspended' ||
        rawSt === 'inactive'
          ? (rawSt as UserStatus)
          : UserStatus.active;

      const academicSessions = await this.prisma.academicSession.findMany({
        where: { school_id: user.school_id },
        select: {
          id: true,
          academic_year: true,
          term: true,
          start_date: true,
          end_date: true,
          status: true,
          is_current: true,
          _count: { select: { results: true } },
        },
        orderBy: [
          { is_current: 'desc' },
          { start_year: 'desc' },
          { term: 'desc' },
        ],
        take: SESSION_LIMIT,
      });

      const defaultSession =
        (await this.prisma.academicSession.findFirst({
          where: {
            school_id: user.school_id,
            is_current: true,
            status: 'active',
          },
          select: {
            id: true,
            academic_year: true,
            term: true,
            start_date: true,
            end_date: true,
            status: true,
            is_current: true,
          },
        })) ??
        (await this.prisma.academicSession.findFirst({
          where: { school_id: user.school_id },
          select: {
            id: true,
            academic_year: true,
            term: true,
            start_date: true,
            end_date: true,
            status: true,
            is_current: true,
          },
          orderBy: [{ start_year: 'desc' }, { term: 'desc' }],
        }));

      let selectedSessionId: string | null = null;
      if (sessionId) {
        const requested = await this.prisma.academicSession.findFirst({
          where: { id: sessionId, school_id: user.school_id },
          select: { id: true },
        });
        if (!requested) {
          return ResponseHelper.error('Academic session not found.', null, 404);
        }
        selectedSessionId = requested.id;
      } else {
        selectedSessionId = defaultSession?.id ?? null;
      }

      const classes = await this.prisma.class.findMany({
        where: {
          schoolId: user.school_id,
          is_graduates: false,
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
        orderBy: { display_order: 'asc' },
      });

      let selectedClassId: string | null = null;
      if (classId) {
        const requestedClass = await this.prisma.class.findFirst({
          where: {
            id: classId,
            schoolId: user.school_id,
            is_graduates: false,
          },
          select: { id: true },
        });
        if (!requestedClass) {
          return ResponseHelper.error('Class not found.', null, 404);
        }
        selectedClassId = requestedClass.id;
      } else if (classes.length > 0) {
        selectedClassId = classes[0].id;
      }

      let classSubjects: Array<{
        id: string;
        name: string;
        code: string | null;
        color: string;
        description: string | null;
      }> = [];
      let subjectsWithAssessments: Array<{
        id: string;
        name: string;
        code: string | null;
        color: string;
        description: string | null;
        assessments: Array<{
          id: string;
          title: string;
          assessment_type: string;
          order: number;
          total_points: number;
        }>;
      }> = [];

      let results: any[] = [];
      let totalResults = 0;
      let resultMessage: string | null = null;
      let totalStudentsInClass = 0;

      if (!selectedSessionId || !selectedClassId) {
        resultMessage = !selectedSessionId
          ? 'No academic session available'
          : 'Please select a class to view results';
      } else {
        // Class roster only. Academic session applies to assessments, not to which subjects
        // appear for a class (the DB may still store academic_session_id on Subject — we ignore it here).
        classSubjects = await this.prisma.subject.findMany({
          where: {
            schoolId: user.school_id,
            classId: selectedClassId,
          },
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
            description: true,
          },
          orderBy: { name: 'asc' },
        });

        // Roster: match Students dashboard — everyone in this class at this school, regardless of
        // Student.academic_session_id. The selected session is used for assessments and Result rows.
        const studentWhere: Prisma.StudentWhereInput = {
          school_id: user.school_id,
          current_class_id: selectedClassId,
          status: studentStatusFilter,
        };

        if (searchTrim) {
          studentWhere.OR = [
            {
              user: {
                first_name: {
                  contains: searchTrim,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
            {
              user: {
                last_name: {
                  contains: searchTrim,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
            {
              student_id: {
                contains: searchTrim,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              admission_number: {
                contains: searchTrim,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ];
        }

        const [studentCount, studentsPage] = await Promise.all([
          this.prisma.student.count({ where: studentWhere }),
          this.prisma.student.findMany({
            where: studentWhere,
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
            orderBy: [{ user: { last_name: 'asc' } }, { user: { first_name: 'asc' } }],
            skip,
            take: limitNum,
          }),
        ]);

        totalStudentsInClass = studentCount;

        if (classSubjects.length === 0) {
          resultMessage = 'No subjects found for this class';
        } else if (studentCount === 0) {
          resultMessage = searchTrim
            ? 'No students match your search'
            : 'No students found in this class';
        }

        const pageStudentIds = studentsPage.map((s) => s.id);
        const storedResultRows =
          pageStudentIds.length === 0
            ? []
            : await this.prisma.result.findMany({
                where: {
                  academic_session_id: selectedSessionId,
                  student_id: { in: pageStudentIds },
                },
                select: {
                  student_id: true,
                  released_by_school_admin: true,
                },
              });
        const resultByStudentId = new Map(
          storedResultRows.map((r) => [r.student_id, r]),
        );

        const subjectIds = classSubjects.map((s) => s.id);
        const allAssessments =
          subjectIds.length === 0
            ? []
            : await this.prisma.assessment.findMany({
                where: {
                  school_id: user.school_id,
                  academic_session_id: selectedSessionId,
                  subject_id: { in: subjectIds },
                  assessment_type: { in: ['CBT', 'EXAM'] },
                  status: { in: ['PUBLISHED', 'ACTIVE', 'CLOSED'] },
                },
                select: {
                  id: true,
                  title: true,
                  assessment_type: true,
                  total_points: true,
                  subject_id: true,
                  order: true,
                  createdAt: true,
                },
              });

        subjectsWithAssessments = classSubjects.map((sub) => {
          const forSub = allAssessments.filter((a) => a.subject_id === sub.id);
          const cbts = forSub
            .filter((a) => a.assessment_type === 'CBT')
            .sort(
              (a, b) =>
                a.order - b.order ||
                a.createdAt.getTime() - b.createdAt.getTime(),
            );
          const exams = forSub
            .filter((a) => a.assessment_type === 'EXAM')
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          const ordered = [...cbts, ...exams];
          return {
            ...sub,
            assessments: ordered.map((a) => ({
              id: a.id,
              title: a.title,
              assessment_type: a.assessment_type,
              order: a.order,
              total_points: a.total_points,
            })),
          };
        });

        const assessmentIds = allAssessments.map((a) => a.id);
        const pageUserIds = studentsPage.map((s) => s.user_id);

        let allAttempts: Array<{
          assessment_id: string;
          student_id: string;
          total_score: number;
          submitted_at: Date | null;
        }> = [];

        if (assessmentIds.length > 0 && pageUserIds.length > 0) {
          const rawAttempts = await this.prisma.assessmentAttempt.findMany({
            where: {
              school_id: user.school_id,
              academic_session_id: selectedSessionId,
              assessment_id: { in: assessmentIds },
              student_id: { in: pageUserIds },
              status: { in: ['SUBMITTED', 'GRADED'] },
            },
            select: {
              assessment_id: true,
              student_id: true,
              total_score: true,
              submitted_at: true,
            },
            orderBy: [{ total_score: 'desc' }, { submitted_at: 'desc' }],
          });

          const best = new Map<string, (typeof rawAttempts)[0]>();
          for (const att of rawAttempts) {
            const key = `${att.student_id}:${att.assessment_id}`;
            const prev = best.get(key);
            if (
              !prev ||
              att.total_score > prev.total_score ||
              (att.total_score === prev.total_score &&
                (att.submitted_at?.getTime() ?? 0) >
                  (prev.submitted_at?.getTime() ?? 0))
            ) {
              best.set(key, att);
            }
          }
          allAttempts = Array.from(best.values());
        }

        const attemptByUserAndAssessment = new Map<string, Map<string, number>>();
        for (const att of allAttempts) {
          if (!attemptByUserAndAssessment.has(att.student_id)) {
            attemptByUserAndAssessment.set(att.student_id, new Map());
          }
          attemptByUserAndAssessment
            .get(att.student_id)!
            .set(att.assessment_id, att.total_score);
        }

        results = studentsPage.map((student) => {
          const userAttempts =
            attemptByUserAndAssessment.get(student.user_id) ?? new Map();
          const subjectScores: Record<string, any> = {};
          let totalObtained = 0;
          let totalObtainable = 0;

          for (const sub of subjectsWithAssessments) {
            const cbts = allAssessments.filter(
              (a) => a.subject_id === sub.id && a.assessment_type === 'CBT',
            );
            const exams = allAssessments.filter(
              (a) => a.subject_id === sub.id && a.assessment_type === 'EXAM',
            );
            const cbtsSorted = [...cbts].sort(
              (a, b) =>
                a.order - b.order ||
                a.createdAt.getTime() - b.createdAt.getTime(),
            );
            const examsSorted = [...exams].sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
            );

            const caAssessments = cbtsSorted.map((cbt) => {
              const obtained = userAttempts.has(cbt.id)
                ? userAttempts.get(cbt.id)!
                : null;
              return {
                assessmentId: cbt.id,
                title: cbt.title,
                order: cbt.order,
                obtained,
                max: cbt.total_points,
              };
            });

            const examAssessments = examsSorted.map((ex) => {
              const obtained = userAttempts.has(ex.id)
                ? userAttempts.get(ex.id)!
                : null;
              return {
                assessmentId: ex.id,
                title: ex.title,
                obtained,
                max: ex.total_points,
              };
            });

            let caTotalObtained = 0;
            let caTotalMax = 0;
            for (const row of caAssessments) {
              caTotalMax += row.max;
              caTotalObtained += row.obtained ?? 0;
            }
            let examTotalObtained = 0;
            let examTotalMax = 0;
            for (const row of examAssessments) {
              examTotalMax += row.max;
              examTotalObtained += row.obtained ?? 0;
            }

            const subjectObtained = caTotalObtained + examTotalObtained;
            const subjectMax = caTotalMax + examTotalMax;
            const hasAnyAssessment = cbtsSorted.length + examsSorted.length > 0;
            const subjectPercentage =
              subjectMax > 0 ? (subjectObtained / subjectMax) * 100 : 0;

            subjectScores[sub.id] = {
              subjectId: sub.id,
              subjectName: sub.name,
              subjectCode: sub.code,
              caAssessments,
              exams: examAssessments,
              caTotalObtained,
              caTotalMax,
              examTotalObtained,
              examTotalMax,
              subjectTotalObtained: subjectObtained,
              subjectTotalMax: subjectMax,
              percentage: hasAnyAssessment ? subjectPercentage : null,
              grade: hasAnyAssessment
                ? gradeFromMinThresholds(subjectPercentage, gradeBands)
                : null,
              hasAssessments: hasAnyAssessment,
            };

            if (hasAnyAssessment && subjectMax > 0) {
              totalObtained += subjectObtained;
              totalObtainable += subjectMax;
            }
          }

          const overallPercentage =
            totalObtainable > 0 ? (totalObtained / totalObtainable) * 100 : 0;

          const stored = resultByStudentId.get(student.id);

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
            subjectScores,
            totalObtained,
            totalObtainable,
            percentage: overallPercentage,
            grade: gradeFromMinThresholds(overallPercentage, gradeBands),
            hasComputedResult: !!stored,
            isPublishedToStudents: stored?.released_by_school_admin ?? false,
          };
        });

        totalResults = studentCount;
      }

      const totalPages =
        limitNum > 0 ? Math.ceil(totalResults / limitNum) : 0;

      const responseData = {
        academic_sessions: academicSessions,
        current_session: defaultSession
          ? {
              id: defaultSession.id,
              academic_year: defaultSession.academic_year,
              term: defaultSession.term,
              status: defaultSession.status,
              is_current: defaultSession.is_current,
            }
          : null,
        classes: classes.map((cls) => ({
          id: cls.id,
          name: cls.name,
          display_order: cls.display_order,
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
        subjects:
          subjectsWithAssessments.length > 0 ? subjectsWithAssessments : [],
        selected_filters: {
          sessionId: selectedSessionId,
          classId: selectedClassId,
          search: searchTrim || null,
          studentStatus: studentStatusFilter,
        },
        total_students_in_class: totalStudentsInClass,
        results,
        result_message: resultMessage,
        pagination:
          selectedSessionId && selectedClassId
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

      this.logger.log(colors.cyan(`📤 Results dashboard: ${results.length} rows`));
      this.logger.log(colors.green(`✅ Results dashboard retrieved successfully`));

      return ResponseHelper.success(
        'Results dashboard retrieved successfully',
        responseData,
      );
    } catch (error: any) {
      this.logger.error(
        colors.red(
          `❌ Error getting results dashboard: ${error?.message ?? error}`,
        ),
      );
      return ResponseHelper.error(
        `Failed to retrieve results dashboard: ${error?.message ?? 'Unknown error'}`,
        null,
        500,
      );
    }
  }
}
