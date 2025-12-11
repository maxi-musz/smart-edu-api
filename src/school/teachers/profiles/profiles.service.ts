import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { User } from '@prisma/client';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService
  ) {}

  /**
   * Get teacher profile
   * @param user - Authenticated user (teacher)
   * @returns Teacher profile data
   */
  async getTeacherProfile(user: User) {
    this.logger.log(colors.cyan(`Fetching teacher profile for: ${user.email}`));
    
    // Use user.sub (JWT subject) as primary, fallback to user.id
    const userId = (user as any).sub || user.id;
    this.logger.log(colors.blue(`🔍 User ID: ${userId}, School ID: ${user.school_id}`));

    try {
      // Get teacher with all related data
      // Use OR clause to match by both user_id and email for robustness (same as dashboard)
      const teacher = await this.prisma.teacher.findFirst({
        where: {
          OR: [
            { user_id: userId },
            { email: user.email }
          ],
          school_id: user.school_id
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              phone_number: true,
              display_picture: true,
              gender: true,
              role: true,
              status: true,
              is_email_verified: true,
              createdAt: true,
              updatedAt: true,
              // Token usage fields
              tokensUsedThisDay: true,
              tokensUsedThisWeek: true,
              tokensUsedAllTime: true,
              maxTokensPerDay: true,
              maxTokensPerWeek: true,
              // Upload and storage fields
              filesUploadedThisMonth: true,
              totalFilesUploadedAllTime: true,
              totalStorageUsedMB: true,
              maxStorageMB: true,
              maxFilesPerMonth: true,
              maxFileSizeMB: true,
              messagesSentThisWeek: true,
              maxMessagesPerWeek: true,
              lastFileResetDate: true,
              lastTokenResetDateAllTime: true,
              userSettings: {
                select: {
                  push_notifications: true,
                  email_notifications: true,
                  assessment_reminders: true,
                  grade_notifications: true,
                  announcement_notifications: true,
                  dark_mode: true,
                  sound_effects: true,
                  haptic_feedback: true,
                  auto_save: true,
                  offline_mode: true,
                  profile_visibility: true,
                  show_contact_info: true,
                  show_academic_progress: true,
                  data_sharing: true
                }
              }
            }
          },
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
              createdAt: true,
              updatedAt: true
            }
          },
          academicSession: {
            select: {
              id: true,
              academic_year: true,
              term: true,
              start_date: true,
              end_date: true,
              status: true
            }
          },
          subjectsTeaching: {
            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  color: true,
                  description: true,
                  classId: true,
                  Class: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          },
          classesManaging: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  students: true,
                  subjects: true
                }
              }
            }
          }
        }
      });

      if (!teacher) {
        this.logger.error(colors.red(`❌ Teacher not found for user: ${user.email} (ID: ${userId})`));
        throw new NotFoundException('Teacher profile not found');
      }

      // Verify the teacher matches the user
      if (teacher.user_id !== userId && teacher.email !== user.email) {
        this.logger.error(colors.red(`❌ Teacher user_id mismatch! Teacher user_id: ${teacher.user_id}, Requested userId: ${userId}`));
        this.logger.error(colors.red(`❌ Teacher email: ${teacher.email}, Requested user.email: ${user.email}`));
        throw new NotFoundException('Teacher profile mismatch - user does not match teacher record');
      }

      this.logger.log(colors.green(`✅ Teacher found: ${teacher.first_name} ${teacher.last_name} (ID: ${teacher.id}, User ID: ${teacher.user_id})`));
    //   log teacher display picture 
    this.logger.log(colors.blue(`🔍 Teacher display picture: ${JSON.stringify(teacher.display_picture)}`));

      if (!teacher.school) {
        this.logger.error(colors.red(`❌ School not found for teacher: ${user.email}`));
        throw new NotFoundException('School not found');
      }

      // Get current academic session for the school
      const currentSessionResponse = await this.academicSessionService.getCurrentSession(teacher.school_id);
      let currentSession: {
        id: string;
        academic_year: string;
        term: string;
        start_date: string;
        end_date: string;
        status: string;
      } | null = null;
      
      if (currentSessionResponse.success) {
        currentSession = {
          id: currentSessionResponse.data.id,
          academic_year: currentSessionResponse.data.academic_year,
          term: currentSessionResponse.data.term,
          start_date: formatDate(currentSessionResponse.data.start_date),
          end_date: formatDate(currentSessionResponse.data.end_date),
          status: currentSessionResponse.data.status
        };
      }

      // Get subscription plan for the school
      const subscriptionPlan = await this.prisma.platformSubscriptionPlan.findUnique({
        where: {
          school_id: teacher.school_id
        }
      });

      // Get upload counts
      const [totalStudents, totalSubjects, totalClasses, totalVideos, totalMaterials] = await Promise.all([
        this.prisma.student.count({
          where: { 
            school_id: teacher.school_id,
            current_class_id: {
              in: teacher.classesManaging.map(cls => cls.id)
            }
          }
        }),
        this.prisma.teacherSubject.count({
          where: { teacherId: teacher.id }
        }),
        teacher.classesManaging.length,
        // Count videos uploaded by teacher
        this.prisma.videoContent.count({
          where: {
            uploadedById: teacher.user_id,
            schoolId: teacher.school_id
          }
        }),
        // Count materials uploaded by teacher
        this.prisma.pDFMaterial.count({
          where: {
            uploadedById: teacher.user_id,
            schoolId: teacher.school_id
          }
        })
      ]);

      // Format response
      const formattedResponse = {
        teacher: {
          id: teacher.id,
          teacher_id: teacher.teacher_id,
          employee_number: teacher.employee_number,
          email: teacher.email,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          full_name: `${teacher.first_name} ${teacher.last_name}`,
          phone_number: teacher.phone_number,
          display_picture: teacher.display_picture,
          gender: teacher.gender,
          role: teacher.role,
          status: teacher.status,
          qualification: teacher.qualification,
          specialization: teacher.specialization,
          years_of_experience: teacher.years_of_experience,
          hire_date: teacher.hire_date ? formatDate(teacher.hire_date) : null,
          salary: teacher.salary,
          department: teacher.department,
          is_class_teacher: teacher.is_class_teacher,
          created_at: formatDate(teacher.createdAt),
          updated_at: formatDate(teacher.updatedAt)
        },
        user: {
          id: teacher.user.id,
          email: teacher.user.email,
          first_name: teacher.user.first_name,
          last_name: teacher.user.last_name,
          full_name: `${teacher.user.first_name} ${teacher.user.last_name}`,
          phone_number: teacher.user.phone_number,
          display_picture: teacher.user.display_picture,
          gender: teacher.user.gender,
          role: teacher.user.role,
          status: teacher.user.status,
          is_email_verified: teacher.user.is_email_verified,
          created_at: formatDate(teacher.user.createdAt),
          updated_at: formatDate(teacher.user.updatedAt)
        },
        school: {
          id: teacher.school.id,
          school_name: teacher.school.school_name,
          school_email: teacher.school.school_email,
          school_phone: teacher.school.school_phone,
          school_address: teacher.school.school_address,
          school_type: teacher.school.school_type,
          school_ownership: teacher.school.school_ownership,
          status: teacher.school.status,
          created_at: formatDate(teacher.school.createdAt),
          updated_at: formatDate(teacher.school.updatedAt)
        },
        current_session: currentSession,
        academic_session: teacher.academicSession ? {
          id: teacher.academicSession.id,
          academic_year: teacher.academicSession.academic_year,
          term: teacher.academicSession.term,
          start_date: formatDate(teacher.academicSession.start_date),
          end_date: formatDate(teacher.academicSession.end_date),
          status: teacher.academicSession.status
        } : null,
        subjects_teaching: teacher.subjectsTeaching.map(ts => ({
          id: ts.subject.id,
          name: ts.subject.name,
          code: ts.subject.code,
          color: ts.subject.color,
          description: ts.subject.description,
          class: ts.subject.Class ? {
            id: ts.subject.Class.id,
            name: ts.subject.Class.name
          } : null
        })),
        classes_managing: teacher.classesManaging.map(cls => ({
          id: cls.id,
          name: cls.name,
          student_count: cls._count.students,
          subject_count: cls._count.subjects
        })),
        settings: teacher.user.userSettings || {
          push_notifications: true,
          email_notifications: true,
          assessment_reminders: true,
          grade_notifications: true,
          announcement_notifications: false,
          dark_mode: false,
          sound_effects: true,
          haptic_feedback: true,
          auto_save: true,
          offline_mode: false,
          profile_visibility: 'classmates',
          show_contact_info: true,
          show_academic_progress: true,
          data_sharing: false
        },
        stats: {
          total_students: totalStudents,
          total_subjects: totalSubjects,
          total_classes: totalClasses
        },
        usage: {
          tokens_used_this_day: teacher.user.tokensUsedThisDay || 0,
          tokens_used_this_week: teacher.user.tokensUsedThisWeek || 0,
          tokens_used_all_time: teacher.user.tokensUsedAllTime || 0,
          max_tokens_per_day: teacher.user.maxTokensPerDay || 50000,
          max_tokens_per_week: teacher.user.maxTokensPerWeek || 50000,
          files_uploaded_this_month: teacher.user.filesUploadedThisMonth || 0,
          total_files_uploaded_all_time: teacher.user.totalFilesUploadedAllTime || 0,
          total_storage_used_mb: teacher.user.totalStorageUsedMB || 0,
          max_storage_mb: teacher.user.maxStorageMB || 500,
          max_files_per_month: teacher.user.maxFilesPerMonth || 10,
          max_file_size_mb: teacher.user.maxFileSizeMB || 100,
          messages_sent_this_week: teacher.user.messagesSentThisWeek || 0,
          max_messages_per_week: teacher.user.maxMessagesPerWeek || 100,
          videos_uploaded: totalVideos,
          materials_uploaded: totalMaterials
        },
        subscription_plan: subscriptionPlan ? {
          id: subscriptionPlan.id,
          name: subscriptionPlan.name,
          plan_type: subscriptionPlan.plan_type,
          description: subscriptionPlan.description,
          cost: subscriptionPlan.cost,
          currency: subscriptionPlan.currency,
          billing_cycle: subscriptionPlan.billing_cycle,
          is_active: subscriptionPlan.is_active,
          // Basic Limits
          max_allowed_teachers: subscriptionPlan.max_allowed_teachers,
          max_allowed_students: subscriptionPlan.max_allowed_students,
          max_allowed_classes: subscriptionPlan.max_allowed_classes,
          max_allowed_subjects: subscriptionPlan.max_allowed_subjects,
          // AI Interactions & Document Management
          allowed_document_types: subscriptionPlan.allowed_document_types,
          max_file_size_mb: subscriptionPlan.max_file_size_mb,
          max_document_uploads_per_teacher_per_day: subscriptionPlan.max_document_uploads_per_teacher_per_day,
          max_document_uploads_per_student_per_day: subscriptionPlan.max_document_uploads_per_student_per_day,
          max_storage_mb: subscriptionPlan.max_storage_mb,
          max_files_per_month: subscriptionPlan.max_files_per_month,
          // Token Usage Limits
          max_daily_tokens_per_user: subscriptionPlan.max_daily_tokens_per_user,
          max_weekly_tokens_per_user: subscriptionPlan.max_weekly_tokens_per_user,
          max_monthly_tokens_per_user: subscriptionPlan.max_monthly_tokens_per_user,
          max_total_tokens_per_school: subscriptionPlan.max_total_tokens_per_school,
          // Chat & Messaging Limits
          max_messages_per_week: subscriptionPlan.max_messages_per_week,
          max_conversations_per_user: subscriptionPlan.max_conversations_per_user,
          max_chat_sessions_per_user: subscriptionPlan.max_chat_sessions_per_user,
          // Additional Features
          features: subscriptionPlan.features,
          // Subscription Management
          start_date: subscriptionPlan.start_date ? formatDate(subscriptionPlan.start_date) : null,
          end_date: subscriptionPlan.end_date ? formatDate(subscriptionPlan.end_date) : null,
          status: subscriptionPlan.status,
          auto_renew: subscriptionPlan.auto_renew
        } : null
      };

      this.logger.log(colors.green(`✅ Teacher profile fetched successfully for: ${user.email}`));
      
      return ResponseHelper.success(
        'Teacher profile retrieved successfully',
        formattedResponse
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching teacher profile: ${error.message}`));
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new NotFoundException('Failed to fetch teacher profile');
    }
  }
}

