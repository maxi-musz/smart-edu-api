import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Roles, PlatformSubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../shared/helper-functions/response';
import { ResponseHelper } from '../shared/helper-functions/response.helpers';
import * as colors from 'colors';
import { StorageService } from '../shared/services/providers/storage.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Single entry profile for school users. Shape varies by `data.role` and `data.roleDetails`.
   */
  async getUserProfile(user: any): Promise<ApiResponse<any>> {
    try {
      const userId = user.sub;
      this.logger.log(
        colors.blue(`Fetching profile for user with email=${user.email}`),
      );

      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          school: {
            select: {
              id: true,
              school_name: true,
              school_email: true,
              school_phone: true,
              school_address: true,
              school_type: true,
              school_ownership: true,
              status: true,
              school_icon: true,
              subscriptionPlan: true,
            },
          },
          student: true,
          teacher: true,
          parent: true,
        },
      });

      if (!dbUser) {
        this.logger.error(colors.red(`User not found for email=${user.email}`));
        return new ApiResponse(false, 'User not found', null);
      }

      if (dbUser.role === Roles.student && !dbUser.student) {
        this.logger.error(colors.red(`Student record not found for user with email=${user.email}`));
        return new ApiResponse(
          false,
          'Student record not found for this account',
          null,
        );
      }

      if (dbUser.role === Roles.teacher && !dbUser.teacher) {
        this.logger.error(colors.red(`Teacher record not found for user with email=${user.email}`));
        return new ApiResponse(
          false,
          'Teacher record not found for this account',
          null,
        );
      }

      if (dbUser.role === Roles.parent && !dbUser.parent) {
        this.logger.error(colors.red(`Parent record not found for user with email=${user.email}`));
        return new ApiResponse(
          false,
          'Parent record not found for this account',
          null,
        );
      }

      const coreUser = {
        id: dbUser.id,
        email: dbUser.email,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        phone_number: dbUser.phone_number,
        display_picture: dbUser.display_picture,
        gender: dbUser.gender,
        status: dbUser.status,
        school_id: dbUser.school_id,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      };

      const schoolSummary = dbUser.school
        ? {
            id: dbUser.school.id,
            school_name: dbUser.school.school_name,
            school_email: dbUser.school.school_email,
            school_phone: dbUser.school.school_phone,
            school_address: dbUser.school.school_address,
            school_type: dbUser.school.school_type,
            school_ownership: dbUser.school.school_ownership,
            status: dbUser.school.status,
            school_icon: dbUser.school.school_icon,
            subscription_plan: this.serializeSubscriptionPlan(
              dbUser.school.subscriptionPlan,
            ),
          }
        : null;

      let roleDetails: Record<string, unknown>;
      switch (dbUser.role) {
        case Roles.student:
          roleDetails = await this.buildStudentRoleDetails(dbUser);
          break;
        case Roles.teacher:
          roleDetails = await this.buildTeacherRoleDetails(dbUser);
          break;
        case Roles.parent:
          roleDetails = await this.buildParentRoleDetails(dbUser);
          break;
        case Roles.school_director:
        case Roles.school_admin:
        case Roles.ict_staff:
        case Roles.super_admin:
          roleDetails = await this.buildStaffRoleDetails(dbUser);
          break;
        default:
          roleDetails = { kind: 'generic' };
      }

      this.logger.log(colors.green(`Profile retrieved successfully for user with email=${user.email}`));
      return new ApiResponse(true, 'Profile retrieved successfully', {
        role: dbUser.role,
        user: coreUser,
        school: schoolSummary,
        roleDetails,
      });
    } catch (error: any) {
      this.logger.error(colors.red(`[user/profile] ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch profile', null);
    }
  }

  /**
   * Full school subscription row for feature gating (limits, plan_type, features JSON, billing window).
   * Null when the school has no PlatformSubscriptionPlan row yet.
   */
  private serializeSubscriptionPlan(
    plan: PlatformSubscriptionPlan | null,
  ): Record<string, unknown> | null {
    if (!plan) {
      return null;
    }

    return {
      id: plan.id,
      school_id: plan.school_id,
      name: plan.name,
      plan_type: plan.plan_type,
      description: plan.description,
      cost: plan.cost,
      yearly_cost: plan.yearly_cost,
      currency: plan.currency,
      billing_cycle: plan.billing_cycle,
      is_active: plan.is_active,
      max_allowed_teachers: plan.max_allowed_teachers,
      max_allowed_students: plan.max_allowed_students,
      max_allowed_classes: plan.max_allowed_classes,
      max_allowed_subjects: plan.max_allowed_subjects,
      allowed_document_types: plan.allowed_document_types,
      max_file_size_mb: plan.max_file_size_mb,
      max_document_uploads_per_student_per_day:
        plan.max_document_uploads_per_student_per_day,
      max_document_uploads_per_teacher_per_day:
        plan.max_document_uploads_per_teacher_per_day,
      max_storage_mb: plan.max_storage_mb,
      max_files_per_month: plan.max_files_per_month,
      max_daily_tokens_per_user: plan.max_daily_tokens_per_user,
      max_weekly_tokens_per_user: plan.max_weekly_tokens_per_user,
      max_monthly_tokens_per_user: plan.max_monthly_tokens_per_user,
      max_total_tokens_per_school: plan.max_total_tokens_per_school,
      max_messages_per_week: plan.max_messages_per_week,
      max_conversations_per_user: plan.max_conversations_per_user,
      max_chat_sessions_per_user: plan.max_chat_sessions_per_user,
      max_concurrent_published_assessments:
        plan.max_concurrent_published_assessments,
      max_assessments_created_per_school_day:
        plan.max_assessments_created_per_school_day,
      max_assessment_questions_added_per_school_day:
        plan.max_assessment_questions_added_per_school_day,
      max_questions_per_assessment: plan.max_questions_per_assessment,
      features: plan.features,
      start_date: plan.start_date?.toISOString() ?? null,
      end_date: plan.end_date?.toISOString() ?? null,
      status: plan.status,
      auto_renew: plan.auto_renew,
      created_at: plan.created_at.toISOString(),
      updated_at: plan.updated_at.toISOString(),
      is_template: plan.is_template,
    };
  }

  private async buildStudentRoleDetails(dbUser: any): Promise<Record<string, unknown>> {
    const student = dbUser.student;
    const currentSession = await this.prisma.academicSession.findFirst({
      where: { school_id: student.school_id, is_current: true },
    });

    let studentClass: {
      id: string;
      name: string;
      classTeacher: {
        id: string;
        first_name: string;
        last_name: string;
        display_picture: unknown;
      } | null;
    } | null = null;

    if (student.current_class_id) {
      const cls = await this.prisma.class.findUnique({
        where: { id: student.current_class_id },
        include: {
          classTeacher: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              display_picture: true,
            },
          },
        },
      });
      if (cls) {
        studentClass = {
          id: cls.id,
          name: cls.name,
          classTeacher: cls.classTeacher,
        };
      }
    }

    const assessmentAttempts = await this.prisma.assessmentAttempt.findMany({
      where: {
        student_id: dbUser.id,
        ...(currentSession?.id && { academic_session_id: currentSession.id }),
      },
      include: {
        assessment: {
          select: { id: true, title: true, total_points: true },
        },
      },
    });

    const totalAssessments = assessmentAttempts.length;
    const passedAssessments = assessmentAttempts.filter((a) => a.passed).length;
    const totalScore = assessmentAttempts.reduce(
      (s, a) => s + (a.total_score || 0),
      0,
    );
    const totalPossibleScore = assessmentAttempts.reduce(
      (s, a) => s + (a.max_score || 0),
      0,
    );
    const averageScore =
      totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;

    let classPeerCount = 0;
    const subjectsEnrolled: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string;
      teacher_name: string;
    }> = [];

    if (studentClass && currentSession?.id) {
      classPeerCount = await this.prisma.student.count({
        where: { current_class_id: studentClass.id },
      });

      const classSubjects = await this.prisma.subject.findMany({
        where: {
          classId: studentClass.id,
          academic_session_id: currentSession.id,
        },
        include: {
          teacherSubjects: {
            include: {
              teacher: {
                select: { first_name: true, last_name: true },
              },
            },
          },
        },
      });

      for (const subject of classSubjects) {
        const t = subject.teacherSubjects[0]?.teacher;
        subjectsEnrolled.push({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          color: subject.color ?? '#3B82F6',
          teacher_name: t
            ? `${t.first_name} ${t.last_name}`
            : 'No teacher assigned',
        });
      }
    }

    return {
      kind: 'student',
      student: {
        id: student.id,
        student_id: student.student_id,
        admission_number: student.admission_number,
        date_of_birth:
          student.date_of_birth?.toISOString().split('T')[0] ?? null,
        admission_date:
          student.admission_date?.toISOString().split('T')[0] ?? null,
        guardian_name: student.guardian_name,
        guardian_phone: student.guardian_phone,
        guardian_email: student.guardian_email,
        emergency_contact: student.emergency_contact,
        address: {
          street: student.address,
          city: student.city,
          state: student.state,
          country: student.country,
          postal_code: student.postal_code,
        },
        academic_level: student.academic_level,
        status: student.status,
      },
      current_class: studentClass
        ? {
            id: studentClass.id,
            name: studentClass.name,
            class_teacher: studentClass.classTeacher
              ? {
                  id: studentClass.classTeacher.id,
                  name: `${studentClass.classTeacher.first_name} ${studentClass.classTeacher.last_name}`,
                  display_picture: studentClass.classTeacher.display_picture,
                }
              : null,
          }
        : null,
      current_session: currentSession
        ? {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
            start_date:
              currentSession.start_date?.toISOString().split('T')[0] ?? null,
            end_date:
              currentSession.end_date?.toISOString().split('T')[0] ?? null,
            is_current: currentSession.is_current,
          }
        : null,
      academics: {
        subjects_enrolled: subjectsEnrolled,
        performance_summary: {
          average_score: Math.round(averageScore * 10) / 10,
          total_assessments: totalAssessments,
          passed_assessments: passedAssessments,
          failed_assessments: totalAssessments - passedAssessments,
          students_in_class: classPeerCount,
        },
      },
    };
  }

  private async buildTeacherRoleDetails(dbUser: any): Promise<Record<string, unknown>> {
    const teacher = dbUser.teacher;

    const subjectLinks = await this.prisma.teacherSubject.findMany({
      where: { teacherId: teacher.id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            classId: true,
          },
        },
      },
    });

    const classesManaging = await this.prisma.class.findMany({
      where: { classTeacherId: teacher.id },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    const currentSession = await this.prisma.academicSession.findFirst({
      where: { school_id: teacher.school_id, is_current: true },
    });

    return {
      kind: 'teacher',
      teacher: {
        id: teacher.id,
        teacher_id: teacher.teacher_id,
        employee_number: teacher.employee_number,
        department: teacher.department,
        qualification: teacher.qualification,
        specialization: teacher.specialization,
        years_of_experience: teacher.years_of_experience,
        is_class_teacher: teacher.is_class_teacher,
        hire_date: teacher.hire_date?.toISOString().split('T')[0] ?? null,
        status: teacher.status,
        display_picture: teacher.display_picture ?? dbUser.display_picture,
      },
      subjects: subjectLinks.map((l) => ({
        id: l.subject.id,
        name: l.subject.name,
        code: l.subject.code,
        class_id: l.subject.classId,
      })),
      classes_as_form_teacher: classesManaging,
      current_session: currentSession
        ? {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
            is_current: currentSession.is_current,
          }
        : null,
    };
  }

  private async buildParentRoleDetails(dbUser: any): Promise<Record<string, unknown>> {
    const parent = dbUser.parent;

    const children = await this.prisma.student.findMany({
      where: { parent_id: parent.id },
      select: {
        id: true,
        student_id: true,
        admission_number: true,
        status: true,
        user: {
          select: { first_name: true, last_name: true, email: true },
        },
        current_class: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      kind: 'parent',
      parent: {
        id: parent.id,
        parent_id: parent.parent_id,
        occupation: parent.occupation,
        employer: parent.employer,
        address: parent.address,
        emergency_contact: parent.emergency_contact,
        relationship: parent.relationship,
        is_primary_contact: parent.is_primary_contact,
        status: parent.status,
      },
      children: children.map((c) => ({
        student_table_id: c.id,
        student_id: c.student_id,
        admission_number: c.admission_number,
        name: `${c.user.first_name} ${c.user.last_name}`,
        email: c.user.email,
        status: c.status,
        current_class: c.current_class,
      })),
    };
  }

  private async buildStaffRoleDetails(dbUser: any): Promise<Record<string, unknown>> {
    const schoolId = dbUser.school_id;
    const [studentCount, teacherCount, classCount] = await Promise.all([
      this.prisma.student.count({ where: { school_id: schoolId } }),
      this.prisma.teacher.count({ where: { school_id: schoolId } }),
      this.prisma.class.count({ where: { schoolId } }),
    ]);

    const currentSession = await this.prisma.academicSession.findFirst({
      where: { school_id: schoolId, is_current: true },
    });

    return {
      kind: 'staff',
      staff_role: dbUser.role,
      school_overview: {
        student_count: studentCount,
        teacher_count: teacherCount,
        class_count: classCount,
      },
      current_session: currentSession
        ? {
            id: currentSession.id,
            academic_year: currentSession.academic_year,
            term: currentSession.term,
            is_current: currentSession.is_current,
          }
        : null,
    };
  }

  /**
   * Update user profile picture (works for all roles: student, teacher, director)
   */
  async updateProfilePicture(user: any, file: Express.Multer.File) {
    this.logger.log(
      colors.cyan(
        `Updating profile picture for user: ${user.email} (Role: ${user.role})`,
      ),
    );

    try {
      if (!file) {
        throw new BadRequestException('Profile picture file is required');
      }

      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP',
        );
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new BadRequestException('File size exceeds 5MB limit');
      }

      const currentUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: {
          id: true,
          school_id: true,
          display_picture: true,
          role: true,
        },
      });

      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      const oldDisplayPicture = currentUser.display_picture as any;
      let oldPictureKey: string | undefined;

      if (oldDisplayPicture?.key) {
        oldPictureKey = oldDisplayPicture.key;
      }

      let folder: string;
      let entityId: string = currentUser.id;

      if (currentUser.role === 'teacher') {
        const teacher = await this.prisma.teacher.findFirst({
          where: { user_id: currentUser.id },
          select: { id: true },
        });
        if (teacher) {
          entityId = teacher.id;
          folder = `profile-pictures/schools/${currentUser.school_id}/teachers/${entityId}`;
        } else {
          folder = `profile-pictures/schools/${currentUser.school_id}/users/${entityId}`;
        }
      } else if (currentUser.role === 'student') {
        const student = await this.prisma.student.findFirst({
          where: { user_id: currentUser.id },
          select: { id: true },
        });
        if (student) {
          entityId = student.id;
          folder = `profile-pictures/schools/${currentUser.school_id}/students/${entityId}`;
        } else {
          folder = `profile-pictures/schools/${currentUser.school_id}/users/${entityId}`;
        }
      } else {
        folder = `profile-pictures/schools/${currentUser.school_id}/users/${entityId}`;
      }

      const fileName = `profile_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      let uploadResult;
      let newPictureKey: string | undefined;

      try {
        uploadResult = await this.storageService.uploadFile(
          file,
          folder,
          fileName,
        );
        newPictureKey = uploadResult.key;
        this.logger.log(
          colors.green(
            `✅ Profile picture uploaded successfully: ${uploadResult.url}`,
          ),
        );
      } catch (uploadError: any) {
        this.logger.error(
          colors.red(
            `❌ Failed to upload profile picture: ${uploadError.message}`,
          ),
        );
        throw new BadRequestException(
          `Failed to upload profile picture: ${uploadError.message}`,
        );
      }

      const newDisplayPicture = {
        url: uploadResult.url,
        key: uploadResult.key,
        ...(uploadResult.bucket && { bucket: uploadResult.bucket }),
        ...(uploadResult.etag && { etag: uploadResult.etag }),
        uploaded_at: new Date().toISOString(),
      };

      try {
        await this.prisma.user.update({
          where: { id: currentUser.id },
          data: { display_picture: newDisplayPicture },
        });

        if (currentUser.role === 'teacher') {
          const teacher = await this.prisma.teacher.findFirst({
            where: { user_id: currentUser.id },
            select: { id: true },
          });
          if (teacher) {
            await this.prisma.teacher.update({
              where: { id: teacher.id },
              data: { display_picture: newDisplayPicture },
            });
          }
        }

        this.logger.log(
          colors.green(
            `✅ Profile picture updated successfully for user: ${user.email}`,
          ),
        );

        if (oldPictureKey) {
          try {
            await this.storageService.deleteFile(oldPictureKey);
            this.logger.log(
              colors.yellow(`🗑️ Old profile picture deleted: ${oldPictureKey}`),
            );
          } catch (deleteError: any) {
            this.logger.warn(
              colors.yellow(
                `⚠️ Failed to delete old profile picture: ${deleteError.message}`,
              ),
            );
          }
        }

        return ResponseHelper.success('Profile picture updated successfully', {
          display_picture: newDisplayPicture,
          url: uploadResult.url,
        });
      } catch (updateError: any) {
        this.logger.error(
          colors.red(`❌ Database update failed, rolling back upload...`),
        );
        if (newPictureKey) {
          try {
            await this.storageService.deleteFile(newPictureKey);
            this.logger.log(
              colors.yellow(
                `🗑️ Rolled back: Deleted newly uploaded picture due to database update failure`,
              ),
            );
          } catch (deleteError: any) {
            this.logger.error(
              colors.red(
                `❌ Failed to rollback uploaded picture: ${deleteError.message}`,
              ),
            );
          }
        }
        throw new BadRequestException(
          `Failed to update profile picture: ${updateError.message}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        colors.red(`❌ Error updating profile picture: ${error.message}`),
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new BadRequestException('Failed to update profile picture');
    }
  }
}
