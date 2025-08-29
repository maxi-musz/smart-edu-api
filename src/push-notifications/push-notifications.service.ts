import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { User, NotificationType } from '@prisma/client';
import { AcademicSessionService } from 'src/academic-session/academic-session.service';
import { RegisterDeviceDto, DeviceType } from './dto/register-device.dto';
import { UnregisterDeviceDto } from './dto/unregister-device.dto';
import { SendPushDto } from './dto/send-push.dto';
import { IPushMessage, IPushNotificationData, ISendPushNotification } from './interfaces/push-notification.interface';

@Injectable()
export class PushNotificationsService {
  private readonly logger = new Logger(PushNotificationsService.name);
  private readonly expoPushUrl = 'https://exp.host/--/api/v2/push/send';

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService
  ) {}

  // Register device token
  async registerDevice(user: User, dto: RegisterDeviceDto) {
    this.logger.log(colors.cyan(`Registering device token for user: ${user.id}`));

    try {
      // 1. Get full user data with school_id
      const fullUser = await this.prisma.user.findFirst({
        where: { id: user.id },
        select: { id: true, school_id: true }
      });

      if (!fullUser || !fullUser.school_id) {
        this.logger.error(colors.red("User not found or missing school_id"));
        return ResponseHelper.error('User not found or invalid school data', 400);
      }

      // 2. Check if token already exists
      const existingToken = await this.prisma.deviceToken.findUnique({
        where: { token: dto.token }
      });

      let deviceToken:any;

      if (existingToken) {
        // Update existing token
        deviceToken = await this.prisma.deviceToken.update({
          where: { id: existingToken.id },
          data: {
            deviceType: dto.deviceType,
            user_id: fullUser.id,
            school_id: fullUser.school_id,
            isActive: true,
            updatedAt: new Date()
          }
        });
        this.logger.log(colors.yellow(`Updated existing device token: ${dto.token}`));
      } else {
        // Create new token
        deviceToken = await this.prisma.deviceToken.create({
          data: {
            token: dto.token,
            deviceType: dto.deviceType,
            user_id: fullUser.id,
            school_id: fullUser.school_id,
            isActive: true
          }
        });
        this.logger.log(colors.green(`Created new device token: ${dto.token}`));
      }

      // Deactivate other tokens for this user in this school to avoid duplicates
      await this.prisma.deviceToken.updateMany({
        where: {
          user_id: fullUser.id,
          school_id: fullUser.school_id,
          token: { not: dto.token },
          isActive: true
        },
        data: { isActive: false }
      });

      return ResponseHelper.success('Device registered successfully', deviceToken);

    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to register device: ${error.message}`), error);
      return ResponseHelper.error(`Failed to register device: ${error.message}`, 500);
    }
  }

  // Unregister device token
  async unregisterDevice(user: User, dto: UnregisterDeviceDto) {
    this.logger.log(colors.cyan(`Unregistering device token: ${dto.token}`));

    try {
      // 1. Get full user data with school_id
      const fullUser = await this.prisma.user.findFirst({
        where: { id: user.id },
        select: { id: true, school_id: true }
      });

      if (!fullUser || !fullUser.school_id) {
        this.logger.error(colors.red("User not found or missing school_id"));
        return ResponseHelper.error('User not found or invalid school data', 400);
      }

      // 2. Find and deactivate the token
      const deviceToken = await this.prisma.deviceToken.findFirst({
        where: {
          token: dto.token,
          user_id: fullUser.id,
          school_id: fullUser.school_id
        }
      });

      if (!deviceToken) {
        return ResponseHelper.error('Device token not found', 404);
      }

      // Deactivate the token
      await this.prisma.deviceToken.update({
        where: { id: deviceToken.id },
        data: { isActive: false }
      });

      this.logger.log(colors.green(`✅ Device token unregistered: ${dto.token}`));

      return ResponseHelper.success('Device unregistered successfully', null);

    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to unregister device: ${error.message}`), error);
      return ResponseHelper.error(`Failed to unregister device: ${error.message}`, 500);
    }
  }

  // Send push notification to specific users
  async sendPushNotification(user: User, dto: SendPushDto) {
    this.logger.log(colors.cyan(`Sending push notification to ${dto.recipients.length} recipients`));

    try {
      // 1. Get full user data with school_id
      const fullUser = await this.prisma.user.findFirst({
        where: { id: user.id },
        select: { id: true, school_id: true }
      });

      if (!fullUser || !fullUser.school_id) {
        this.logger.error(colors.red("User not found or missing school_id"));
        return ResponseHelper.error('User not found or invalid school data', 400);
      }

      // 2. Get device tokens for recipients
      const deviceTokens = await this.prisma.deviceToken.findMany({
        where: {
          user_id: { in: dto.recipients },
          school_id: fullUser.school_id,
          isActive: true
        },
        select: { token: true }
      });

      if (deviceTokens.length === 0) {
        this.logger.warn(colors.yellow('No active device tokens found for recipients'));
        return ResponseHelper.success('No active devices found for recipients', { sent: 0, total: dto.recipients.length });
      }

      // 3. Prepare push messages
      const messages: IPushMessage[] = deviceTokens.map(deviceToken => ({
        to: deviceToken.token,
        sound: 'default',
        title: dto.title,
        body: dto.body,
        data: dto.data || {},
        badge: 1
      }));

      // 4. Send push notifications
      const result = await this.sendToExpo(messages);

      this.logger.log(colors.green(`✅ Push notification sent to ${deviceTokens.length} devices`));

      return ResponseHelper.success('Push notification sent successfully', {
        sent: deviceTokens.length,
        total: dto.recipients.length,
        result
      });

    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to send push notification: ${error.message}`), error);
      return ResponseHelper.error(`Failed to send push notification: ${error.message}`, 500);
    }
  }

  // Send push notification based on notification type (used by other services)
  async sendNotificationByType(notificationData: ISendPushNotification) {
    this.logger.log(colors.cyan(`Sending notification by type: ${notificationData.notificationType}`));

    try {
      let userIds: string[] = [];
      const schoolId = notificationData.schoolId;

      // Validate required schoolId for school-scoped types
      if (!schoolId && ['all', 'teachers', 'students', 'school_director'].includes(String(notificationData.notificationType))) {
        return { success: false, message: 'schoolId is required for this notification type' };
      }

      // Get user IDs based on notification type
      switch (notificationData.notificationType) {
        case 'all':
          userIds = await this.getAllUserIdsInSchool(schoolId as string);
          break;
        case 'teachers':
          userIds = await this.getTeacherUserIdsInSchool(schoolId as string);
          break;
        case 'students':
          userIds = await this.getStudentUserIdsInSchool(schoolId as string);
          break;
        case 'school_director':
          userIds = await this.getDirectorUserIdsInSchool(schoolId as string);
          break;
        case 'admin':
          userIds = await this.getAdminUserIds();
          break;
        default:
          // Use provided recipients
          userIds = notificationData.recipients ?? [];
      }

      if (userIds.length === 0) {
        this.logger.warn(colors.yellow('No recipients found for notification type'));
        return { success: false, message: 'No recipients found' };
      }

      // Get device tokens for these users
      const deviceTokens = await this.prisma.deviceToken.findMany({
        where: {
          user_id: { in: userIds },
          school_id: schoolId as string,
          isActive: true
        },
        select: { token: true }
      });

      if (deviceTokens.length === 0) {
        this.logger.warn(colors.yellow('No active device tokens found for recipients'));
        return { success: false, message: 'No active devices found' };
      }

      // Prepare and send push messages
      const messages: IPushMessage[] = deviceTokens.map(deviceToken => ({
        to: deviceToken.token,
        sound: 'default',
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data || {},
        badge: 1
      }));

      const result = await this.sendToExpo(messages);

      this.logger.log(colors.green(`✅ Notification sent to ${deviceTokens.length} devices`));

      return { 
        success: true, 
        sent: deviceTokens.length, 
        total: userIds.length,
        result 
      };

    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to send notification by type: ${error.message}`), error);
      return { success: false, message: error.message };
    }
  }

  // Helper method to send to Expo
  private async sendToExpo(messages: IPushMessage[]) {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      };
      if (process.env.EXPO_ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
      }

      const response = await fetch(this.expoPushUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(`Expo API error: ${JSON.stringify(result)}`);
      }

      return result;
    } catch (error) {
      this.logger.error(colors.red(`❌ Expo API error: ${error.message}`), error);
      throw error;
    }
  }

  // Helper methods to get user IDs by role
  private async getAllUserIdsInSchool(schoolId: string): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { school_id: schoolId },
      select: { id: true }
    });
    return users.map(user => user.id);
  }

  private async getTeacherUserIdsInSchool(schoolId: string): Promise<string[]> {
    const teachers = await this.prisma.teacher.findMany({
      where: { school_id: schoolId },
      select: { user_id: true }
    });
    return teachers.map(teacher => teacher.user_id);
  }

  private async getStudentUserIdsInSchool(schoolId: string): Promise<string[]> {
    const students = await this.prisma.student.findMany({
      where: { school_id: schoolId },
      select: { user_id: true }
    });
    return students.map(student => student.user_id);
  }

  private async getDirectorUserIdsInSchool(schoolId: string): Promise<string[]> {
    const directors = await this.prisma.user.findMany({
      where: { 
        school_id: schoolId,
        role: 'school_director'
      },
      select: { id: true }
    });
    return directors.map(director => director.id);
  }

  private async getAdminUserIds(): Promise<string[]> {
    const admins = await this.prisma.user.findMany({
      where: { role: 'super_admin' },
      select: { id: true }
    });
    return admins.map(admin => admin.id);
  }
}
