import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { User } from '@prisma/client';
import { formatDate } from 'src/shared/helper-functions/formatter';
import { AcademicSessionService } from '../../../academic-session/academic-session.service';
import { UpdateSchoolOwnerProfileDto } from './dto/update-school-owner-profile.dto';
import { StorageService } from 'src/shared/services/providers/storage.service';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get school owner profile
   * @param user - Authenticated user (school director)
   * @returns School owner profile data
   */
  async getSchoolOwnerProfile(user: User) {
    this.logger.log(
      colors.cyan(`Fetching school owner profile for: ${user.email}`),
    );

    try {
      // Get user with school information
      const director = await this.prisma.user.findUnique({
        where: {
          email: user.email,
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
              updatedAt: true,
            },
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
              data_sharing: true,
            },
          },
        },
      });

      if (!director) {
        this.logger.error(colors.red(`❌ User not found: ${user.email}`));
        throw new NotFoundException('User not found');
      }

      if (!director.school) {
        this.logger.error(
          colors.red(`❌ School not found for user: ${user.email}`),
        );
        throw new NotFoundException('School not found');
      }

      // Get current academic session for the school
      const currentSessionResponse =
        await this.academicSessionService.getCurrentSession(director.school_id);
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
          status: currentSessionResponse.data.status,
        };
      }

      // Get quick stats (optional - can be removed if not needed)
      const [totalTeachers, totalStudents, totalClasses, totalSubjects] =
        await Promise.all([
          this.prisma.teacher.count({
            where: { school_id: director.school_id },
          }),
          this.prisma.student.count({
            where: { school_id: director.school_id },
          }),
          this.prisma.class.count({
            where: { schoolId: director.school_id },
          }),
          this.prisma.subject.count({
            where: { schoolId: director.school_id },
          }),
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
          updated_at: formatDate(director.updatedAt),
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
          updated_at: formatDate(director.school.updatedAt),
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
          data_sharing: false,
        },
        stats: {
          total_teachers: totalTeachers,
          total_students: totalStudents,
          total_classes: totalClasses,
          total_subjects: totalSubjects,
        },
      };

      this.logger.log(
        colors.green(
          `✅ School owner profile fetched successfully for: ${user.email}`,
        ),
      );

      return ResponseHelper.success(
        'School owner profile retrieved successfully',
        formattedResponse,
      );
    } catch (error) {
      this.logger.error(
        colors.red(`❌ Error fetching school owner profile: ${error.message}`),
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new NotFoundException('Failed to fetch school owner profile');
    }
  }

  /**
   * Update school owner profile (only editable fields, email is not editable)
   */
  async updateSchoolOwnerProfile(
    user: User,
    dto: UpdateSchoolOwnerProfileDto,
    displayPictureFile?: Express.Multer.File,
    schoolLogoFile?: Express.Multer.File,
  ) {
    this.logger.log(
      colors.cyan(`Updating school owner profile for: ${user.email}`),
    );

    const director = await this.prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        school_id: true,
      },
    });

    if (!director) {
      this.logger.error(colors.red(`❌ User not found: ${user.email}`));
      throw new NotFoundException('User not found');
    }

    const school = await this.prisma.school.findUnique({
      where: { id: director.school_id },
      select: { id: true, school_name: true, school_icon: true },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const userUpdateData: any = {};
    if (dto.first_name !== undefined)
      userUpdateData.first_name = dto.first_name;
    if (dto.last_name !== undefined) userUpdateData.last_name = dto.last_name;
    if (dto.phone_number !== undefined)
      userUpdateData.phone_number = dto.phone_number;
    if (dto.gender !== undefined) userUpdateData.gender = dto.gender;

    // Handle display picture upload
    if (displayPictureFile) {
      const folder = `schools/${school.school_name.toLowerCase().replace(/\s+/g, '_')}/profiles/display_pictures`;
      const fileName = `display_picture_${Date.now()}.${displayPictureFile.originalname.split('.').pop()}`;

      const uploadResult = await this.storageService.uploadFile(
        displayPictureFile,
        folder,
        fileName,
      );
      userUpdateData.display_picture = {
        url: uploadResult.url,
        key: uploadResult.key,
        ...(uploadResult.bucket && { bucket: uploadResult.bucket }),
        ...(uploadResult.etag && { etag: uploadResult.etag }),
        uploaded_at: new Date().toISOString(),
      };
      this.logger.log(colors.green(`✅ Display picture uploaded successfully`));
    }

    // Handle school logo upload
    const schoolUpdateData: any = {};
    if (schoolLogoFile) {
      const folder = `schools/${school.school_name.toLowerCase().replace(/\s+/g, '_')}/profiles/school_logos`;
      const fileName = `school_logo_${Date.now()}.${schoolLogoFile.originalname.split('.').pop()}`;

      const uploadResult = await this.storageService.uploadFile(
        schoolLogoFile,
        folder,
        fileName,
      );
      schoolUpdateData.school_icon = {
        url: uploadResult.url,
        key: uploadResult.key,
        ...(uploadResult.bucket && { bucket: uploadResult.bucket }),
        ...(uploadResult.etag && { etag: uploadResult.etag }),
        uploaded_at: new Date().toISOString(),
      };
      this.logger.log(colors.green(`✅ School logo uploaded successfully`));
    }

    const settingsUpdateData: any = {};
    const settingKeys: (keyof UpdateSchoolOwnerProfileDto)[] = [
      'push_notifications',
      'email_notifications',
      'assessment_reminders',
      'grade_notifications',
      'announcement_notifications',
      'dark_mode',
      'sound_effects',
      'haptic_feedback',
      'auto_save',
      'offline_mode',
      'profile_visibility',
      'show_contact_info',
      'show_academic_progress',
      'data_sharing',
    ];

    for (const key of settingKeys) {
      if (dto[key] !== undefined) {
        settingsUpdateData[key] = dto[key];
      }
    }

    await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: director.id },
          data: userUpdateData,
        });
      }

      if (Object.keys(schoolUpdateData).length > 0) {
        await tx.school.update({
          where: { id: school.id },
          data: schoolUpdateData,
        });
      }

      if (Object.keys(settingsUpdateData).length > 0) {
        await tx.userSettings.upsert({
          where: { user_id: director.id },
          create: {
            user_id: director.id,
            school_id: director.school_id,
            ...settingsUpdateData,
          },
          update: settingsUpdateData,
        });
      }
    });

    return this.getSchoolOwnerProfile(user);
  }
}
