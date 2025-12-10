import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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
    private readonly storageService: StorageService
  ) {}

  async getUserProfile(user: any) {
    try {
      this.logger.log(colors.blue(`🔍 Fetching profile for user: ${user.email} Role: ${user.role}`));

      // Get full user details
      const fullUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        include: {
          student: true
        }
      });

      if (!fullUser) {
        this.logger.error(colors.red(`❌ User not found: ${user.sub}`));
        return new ApiResponse(false, 'User not found', null);
      }

      this.logger.log(colors.green(`✅ User found: ${fullUser.role}`));

      if (!fullUser.student) {
        this.logger.error(colors.red(`❌ Student record not found for user: ${user.sub}`));
        return new ApiResponse(false, 'Student record not found', null);
      }

      const student = fullUser.student;
      

      // Get student's class
      const studentClass = await this.prisma.class.findUnique({
        where: { id: student.current_class_id || undefined }
      });

      if (!studentClass) {
        this.logger.error(colors.red(`❌ Student class not found: ${student.current_class_id}`));
        return new ApiResponse(false, 'Student class not found', null);
      }

      // Get current academic session
      const currentSession = await this.prisma.academicSession.findFirst({
        where: {
          school_id: student.school_id,
          status: 'active'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Get student's assessment attempts for performance calculation
      const assessmentAttempts = await this.prisma.assessmentAttempt.findMany({
        where: {
          student_id: user.sub,
          academic_session_id: currentSession?.id
        },
        include: {
          assessment: {
            select: {
              id: true,
              title: true,
              total_points: true
            }
          }
        }
      });

      // Calculate performance metrics
      const totalAssessments = assessmentAttempts.length;
      const passedAssessments = assessmentAttempts.filter(attempt => attempt.passed).length;
      const failedAssessments = totalAssessments - passedAssessments;
      const totalScore = assessmentAttempts.reduce((sum, attempt) => sum + (attempt.total_score || 0), 0);
      const totalPossibleScore = assessmentAttempts.reduce((sum, attempt) => sum + (attempt.max_score || 0), 0);
      const averageScore = totalPossibleScore > 0 ? (totalScore / totalPossibleScore) * 100 : 0;

      // Get class rank (simplified - would need more complex logic for real ranking)
      const classStudents = await this.prisma.student.count({
        where: { current_class_id: studentClass.id }
      });

      // Get subjects for the class
      const classSubjects = await this.prisma.subject.findMany({
        where: { classId: studentClass.id },
        include: {
          teacherSubjects: {
            include: {
              teacher: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true
                }
              }
            }
          }
        }
      });

      // Get subjects enrolled
      const subjectsEnrolled = classSubjects.map(subject => {
        const teacher = subject.teacherSubjects[0]?.teacher;
        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          teacher_name: teacher ? `${teacher.first_name} ${teacher.last_name}` : 'No teacher assigned',
          status: 'active',
          credits: 3 // Default credits - would need to be stored in schema
        };
      });

      // Mock recent achievements (would need to be stored in database)
      const recentAchievements = [
        {
          id: 'ach_001',
          title: 'Top Performer in Mathematics',
          description: 'Achieved highest score in Mathematics assessment',
          date_earned: '2024-01-10',
          type: 'academic'
        },
        {
          id: 'ach_002',
          title: 'Perfect Attendance',
          description: 'No absences for the entire month',
          date_earned: '2024-01-31',
          type: 'attendance'
        }
      ];

      // Build response data
      const responseData = {
        general_info: {
          student: {
            id: student.id,
            name: `${fullUser.first_name} ${fullUser.last_name}`,
            email: fullUser.email,
            phone: fullUser.phone_number || null,
            date_of_birth: student.date_of_birth?.toISOString().split('T')[0] || null,
            display_picture: fullUser.display_picture || 'https://example.com/avatars/default.jpg',
            student_id: student.student_id || null,
            emergency_contact_name: student.emergency_contact || null,
            emergency_contact_phone: student.emergency_contact || null,
            address: {
              street: student.address || null,
              city: student.city || null,
              state: student.state || null,
              country: student.country || null,
              postal_code: student.postal_code || null
            }
          },
          student_class: {
            id: studentClass.id,
            name: studentClass.name || null,
            level: 'Senior Secondary 3', // Mock level - would need to be stored in schema
            section: 'A' // Mock section - would need to be stored in schema
          },
          current_session: {
            id: currentSession?.id || null,
            academic_year: currentSession?.academic_year || null,
            term: currentSession?.term || null,
            start_date: currentSession?.start_date?.toISOString().split('T')[0] || null,
            end_date: currentSession?.end_date?.toISOString().split('T')[0] || null
          }
        },
        academic_info: {
          subjects_enrolled: subjectsEnrolled,
          performance_summary: {
            average_score: Math.round(averageScore * 10) / 10,
            total_assessments: totalAssessments,
            passed_assessments: passedAssessments,
            failed_assessments: failedAssessments,
            current_rank: 15, // Mock rank - would need proper calculation
            total_students: classStudents,
            grade_point_average: 3.2, // Mock GPA - would need proper calculation
            attendance_percentage: 95.5 // Mock attendance - would need proper tracking
          },
          recent_achievements: recentAchievements
        },
        settings: {
          notifications: {
            push_notifications: true,
            email_notifications: true,
            assessment_reminders: true,
            grade_notifications: true,
            announcement_notifications: true
          },
          app_preferences: {
            dark_mode: false,
            sound_effects: true,
            haptic_feedback: true,
            auto_save: true,
            offline_mode: false
          },
          privacy: {
            profile_visibility: 'classmates_only',
            show_contact_info: true,
            show_academic_progress: true,
            data_sharing: false
          }
        },
        support_info: {
          help_center: {
            faq_count: 25,
            last_updated: '2024-01-15',
            categories: ['General', 'Technical', 'Academic', 'Account']
          },
          contact_options: {
            email_support: 'support@school.com',
            phone_support: '+234 800 123 4567',
            live_chat_available: true,
            response_time: '24 hours'
          },
          app_info: {
            version: '1.0.0',
            build_number: '2024.01.15',
            last_updated: '2024-01-13',
            minimum_ios_version: '12.0',
            minimum_android_version: '8.0'
          }
        }
      };

      this.logger.log(colors.green(`✅ Profile data retrieved successfully for user: ${user.sub}`));

      return new ApiResponse(
        true,
        'Profile data retrieved successfully',
        responseData
      );

    } catch (error) {
      this.logger.error(colors.red(`❌ Error fetching user profile: ${error.message}`));
      return new ApiResponse(false, 'Failed to fetch profile data', null);
    }
  }

  /**
   * Update user profile picture (works for all roles: student, teacher, director)
   * @param user - Authenticated user
   * @param file - Profile picture file
   * @returns Updated profile picture information
   */
  async updateProfilePicture(user: any, file: Express.Multer.File) {
    this.logger.log(colors.cyan(`Updating profile picture for user: ${user.email} (Role: ${user.role})`));

    try {
      // Validate file
      if (!file) {
        throw new BadRequestException('Profile picture file is required');
      }

      // Validate file type (images only)
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new BadRequestException('File size exceeds 5MB limit');
      }

      // Get user with current display picture
      const currentUser = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: {
          id: true,
          school_id: true,
          display_picture: true,
          role: true
        }
      });

      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      // Store old picture info for deletion
      const oldDisplayPicture = currentUser.display_picture as any;
      let oldPictureKey: string | undefined;
      
      if (oldDisplayPicture?.key) {
        oldPictureKey = oldDisplayPicture.key;
      }

      // Determine folder based on role
      let folder: string;
      let entityId: string = currentUser.id;

      // Get role-specific entity ID for folder organization
      if (currentUser.role === 'teacher') {
        const teacher = await this.prisma.teacher.findFirst({
          where: { user_id: currentUser.id },
          select: { id: true }
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
          select: { id: true }
        });
        if (student) {
          entityId = student.id;
          folder = `profile-pictures/schools/${currentUser.school_id}/students/${entityId}`;
        } else {
          folder = `profile-pictures/schools/${currentUser.school_id}/users/${entityId}`;
        }
      } else {
        // Director or other roles
        folder = `profile-pictures/schools/${currentUser.school_id}/users/${entityId}`;
      }

      // Upload new picture to storage
      const fileName = `profile_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      let uploadResult;
      let newPictureKey: string | undefined;
      
      try {
        uploadResult = await this.storageService.uploadFile(file, folder, fileName);
        newPictureKey = uploadResult.key;
        this.logger.log(colors.green(`✅ Profile picture uploaded successfully: ${uploadResult.url}`));
      } catch (uploadError) {
        this.logger.error(colors.red(`❌ Failed to upload profile picture: ${uploadError.message}`));
        throw new BadRequestException(`Failed to upload profile picture: ${uploadError.message}`);
      }

      // Prepare new display picture object
      const newDisplayPicture = {
        url: uploadResult.url,
        key: uploadResult.key,
        ...(uploadResult.bucket && { bucket: uploadResult.bucket }),
        ...(uploadResult.etag && { etag: uploadResult.etag }),
        uploaded_at: new Date().toISOString()
      };

      // Update User display_picture
      try {
        await this.prisma.user.update({
          where: { id: currentUser.id },
          data: { display_picture: newDisplayPicture }
        });

        // Also update role-specific entity if it exists
        if (currentUser.role === 'teacher') {
          const teacher = await this.prisma.teacher.findFirst({
            where: { user_id: currentUser.id },
            select: { id: true }
          });
          if (teacher) {
            await this.prisma.teacher.update({
              where: { id: teacher.id },
              data: { display_picture: newDisplayPicture }
            });
          }
        } else if (currentUser.role === 'student') {
          const student = await this.prisma.student.findFirst({
            where: { user_id: currentUser.id },
            select: { id: true }
          });
          if (student) {
            // Note: Student model doesn't have display_picture field, only User does
            // But we keep this structure for consistency
          }
        }

        this.logger.log(colors.green(`✅ Profile picture updated successfully for user: ${user.email}`));

        // Delete old picture if it exists (after successful update)
        if (oldPictureKey) {
          try {
            await this.storageService.deleteFile(oldPictureKey);
            this.logger.log(colors.yellow(`🗑️ Old profile picture deleted: ${oldPictureKey}`));
          } catch (deleteError) {
            // Log but don't fail - old picture deletion is not critical
            this.logger.warn(colors.yellow(`⚠️ Failed to delete old profile picture: ${deleteError.message}`));
          }
        }

        return ResponseHelper.success(
          'Profile picture updated successfully',
          {
            display_picture: newDisplayPicture,
            url: uploadResult.url
          }
        );

      } catch (updateError) {
        // Rollback: Delete newly uploaded picture if database update fails
        this.logger.error(colors.red(`❌ Database update failed, rolling back upload...`));
        if (newPictureKey) {
          try {
            await this.storageService.deleteFile(newPictureKey);
            this.logger.log(colors.yellow(`🗑️ Rolled back: Deleted newly uploaded picture due to database update failure`));
          } catch (deleteError) {
            this.logger.error(colors.red(`❌ Failed to rollback uploaded picture: ${deleteError.message}`));
          }
        }
        throw new BadRequestException(`Failed to update profile picture: ${updateError.message}`);
      }

    } catch (error) {
      this.logger.error(colors.red(`❌ Error updating profile picture: ${error.message}`));
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to update profile picture');
    }
  }
}
