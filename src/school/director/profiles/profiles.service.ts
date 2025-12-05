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
   * Get school owner profile
   * @param user - Authenticated user (school director)
   * @returns School owner profile data
   */
  async getSchoolOwnerProfile(user: User) {
    this.logger.log(colors.cyan(`Fetching school owner profile for: ${user.email}`));

    try {
      // Get user with school information
      const director = await this.prisma.user.findUnique({
        where: {
          email: user.email
        },
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
          school_id: true,
          createdAt: true,
          updatedAt: true,
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
      });

      if (!director) {
        this.logger.error(colors.red(`❌ User not found: ${user.email}`));
        throw new NotFoundException('User not found');
      }

      if (!director.school) {
        this.logger.error(colors.red(`❌ School not found for user: ${user.email}`));
        throw new NotFoundException('School not found');
      }

      // Get current academic session for the school
      const currentSessionResponse = await this.academicSessionService.getCurrentSession(director.school_id);
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
          school_id: director.school_id
        }
      });

      // Get all available plan templates from database (for upgrade options)
      // Template plans have school_id: null and is_template: true
      const availablePlans = await this.prisma.platformSubscriptionPlan.findMany({
        where: {
          school_id: null,
          is_template: true,
          is_active: true,
          plan_type: subscriptionPlan?.plan_type ? {
            not: subscriptionPlan.plan_type
          } : undefined
        },
        orderBy: {
          cost: 'asc'
        }
      } as any);

      // Get quick stats (optional - can be removed if not needed)
      const [totalTeachers, totalStudents, totalClasses, totalSubjects] = await Promise.all([
        this.prisma.teacher.count({
          where: { school_id: director.school_id }
        }),
        this.prisma.student.count({
          where: { school_id: director.school_id }
        }),
        this.prisma.class.count({
          where: { schoolId: director.school_id }
        }),
        this.prisma.subject.count({
          where: { schoolId: director.school_id }
        })
      ]);

      // Format response
      const formattedResponse = {
        user: {
          id: director.id,
          email: director.email,
          first_name: director.first_name,
          last_name: director.last_name,
          full_name: `${director.first_name} ${director.last_name}`,
          phone_number: director.phone_number,
          display_picture: director.display_picture,
          gender: director.gender,
          role: director.role,
          status: director.status,
          is_email_verified: director.is_email_verified,
          created_at: formatDate(director.createdAt),
          updated_at: formatDate(director.updatedAt)
        },
        school: {
          id: director.school.id,
          school_name: director.school.school_name,
          school_email: director.school.school_email,
          school_phone: director.school.school_phone,
          school_address: director.school.school_address,
          school_type: director.school.school_type,
          school_ownership: director.school.school_ownership,
          status: director.school.status,
          created_at: formatDate(director.school.createdAt),
          updated_at: formatDate(director.school.updatedAt)
        },
        current_session: currentSession,
        settings: director.userSettings || {
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
          total_teachers: totalTeachers,
          total_students: totalStudents,
          total_classes: totalClasses,
          total_subjects: totalSubjects
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
          max_document_uploads_per_student_per_day: subscriptionPlan.max_document_uploads_per_student_per_day,
          max_document_uploads_per_teacher_per_day: subscriptionPlan.max_document_uploads_per_teacher_per_day,
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
          auto_renew: subscriptionPlan.auto_renew,
          created_at: formatDate(subscriptionPlan.created_at),
          updated_at: formatDate(subscriptionPlan.updated_at)
        } : null,
        available_plans: availablePlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          plan_type: plan.plan_type,
          description: plan.description,
          cost: plan.cost,
          currency: plan.currency,
          billing_cycle: plan.billing_cycle,
          is_active: plan.is_active,
          // Basic Limits
          max_allowed_teachers: plan.max_allowed_teachers,
          max_allowed_students: plan.max_allowed_students,
          max_allowed_classes: plan.max_allowed_classes,
          max_allowed_subjects: plan.max_allowed_subjects,
          // AI Interactions & Document Management
          allowed_document_types: plan.allowed_document_types,
          max_file_size_mb: plan.max_file_size_mb,
          max_document_uploads_per_student_per_day: plan.max_document_uploads_per_student_per_day,
          max_document_uploads_per_teacher_per_day: plan.max_document_uploads_per_teacher_per_day,
          max_storage_mb: plan.max_storage_mb,
          max_files_per_month: plan.max_files_per_month,
          // Token Usage Limits
          max_daily_tokens_per_user: plan.max_daily_tokens_per_user,
          max_weekly_tokens_per_user: plan.max_weekly_tokens_per_user,
          max_monthly_tokens_per_user: plan.max_monthly_tokens_per_user,
          max_total_tokens_per_school: plan.max_total_tokens_per_school,
          // Chat & Messaging Limits
          max_messages_per_week: plan.max_messages_per_week,
          max_conversations_per_user: plan.max_conversations_per_user,
          max_chat_sessions_per_user: plan.max_chat_sessions_per_user,
          // Additional Features
          features: plan.features,
          created_at: formatDate(plan.created_at),
          updated_at: formatDate(plan.updated_at)
        }))
      };

      this.logger.log(colors.green(`✅ School owner profile fetched successfully for: ${user.email}`));
      
      return ResponseHelper.success(
        'School owner profile retrieved successfully',
        formattedResponse
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching school owner profile: ${error.message}`));
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new NotFoundException('Failed to fetch school owner profile');
    }
  }
}

