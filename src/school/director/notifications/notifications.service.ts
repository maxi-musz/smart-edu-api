import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as colors from 'colors';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';
import { User, NotificationType } from '@prisma/client';
import { AcademicSessionService } from 'src/academic-session/academic-session.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { formatDate } from 'src/shared/helper-functions/formatter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly academicSessionService: AcademicSessionService
  ) {}

  // Create notification
  async createNotification(user: User, dto: CreateNotificationDto) {
    this.logger.log(colors.cyan(`Creating new notification: ${dto.title}`));

    try {
      // 1. Get full user data with school_id
      const fullUser = await this.prisma.user.findFirst({
        where: { id: user.id },
        select: { id: true, school_id: true, first_name: true, last_name: true }
      });

      if (!fullUser || !fullUser.school_id) {
        this.logger.error(colors.red("User not found or missing school_id"));
        return ResponseHelper.error('User not found or invalid school data', 400);
      }

      // 2. Get current academic session for the school
      const currentSessionResponse = await this.academicSessionService.getCurrentSession(fullUser.school_id);
      if (!currentSessionResponse.success) {
        return ResponseHelper.error('No current academic session found for the school', 400);
      }
      const currentSession = currentSessionResponse.data;

      // 3. Create notification
      const notification = await this.prisma.notification.create({
        data: {
          school_id: fullUser.school_id,
          academic_session_id: currentSession.id,
          title: dto.title,
          description: dto.description,
          type: dto.type,
          comingUpOn: dto.comingUpOn ? new Date(dto.comingUpOn) : null
        }
      });

      this.logger.log(colors.green(`✅ Notification created successfully: ${notification.id}`));

      // Format the response
      const formattedNotification = {
        ...notification,
        comingUpOn: notification.comingUpOn ? formatDate(notification.comingUpOn) : null,
        createdAt: formatDate(notification.createdAt),
        updatedAt: formatDate(notification.updatedAt)
      };

      return ResponseHelper.success('Notification created successfully', formattedNotification);

    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to create notification: ${error.message}`), error);
      return ResponseHelper.error(`Failed to create notification: ${error.message}`, 500);
    }
  }

  // Get all notifications with pagination, filtering, and search
  async getAllNotifications(user: User, query: QueryNotificationsDto) {
    this.logger.log(colors.cyan(`Fetching notifications with filters: ${JSON.stringify(query)}`));

    try {
      // 1. Get full user data with school_id
      const fullUser = await this.prisma.user.findFirst({
        where: { id: user.id },
        select: { id: true, school_id: true, first_name: true, last_name: true }
      });

      if (!fullUser || !fullUser.school_id) {
        this.logger.error(colors.red("User not found or missing school_id"));
        return ResponseHelper.error('User not found or invalid school data', 400);
      }

      // 2. Get current academic session for the school
      const currentSessionResponse = await this.academicSessionService.getCurrentSession(fullUser.school_id);
      if (!currentSessionResponse.success) {
        return ResponseHelper.error('No current academic session found for the school', 400);
      }
      const currentSessionId = currentSessionResponse.data.id;

      // 3. Build where clause for filtering
      const whereClause: any = {
        school_id: fullUser.school_id,
        academic_session_id: currentSessionId
      };

      // Add type filter if provided
      if (query.type) {
        whereClause.type = query.type;
      }

      // Add search filter if provided
      if (query.search) {
        whereClause.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } }
        ];
      }

      // 4. Build order by clause
      const orderByClause: any = {};
      if (query.sort_by === 'title') {
        orderByClause.title = query.sort_order;
      } else if (query.sort_by === 'type') {
        orderByClause.type = query.sort_order;
      } else {
        orderByClause.createdAt = query.sort_order;
      }

      // 5. Calculate pagination
      const page = query.page || 1;
      const limit = query.limit || 10;
      const skip = (page - 1) * limit;

      // 6. Get notifications with pagination
      const [notifications, totalCount] = await Promise.all([
        this.prisma.notification.findMany({
          where: whereClause,
          orderBy: orderByClause,
          skip,
          take: limit,
          select: {
            id: true,
            school_id: true,
            academic_session_id: true,
            title: true,
            description: true,
            type: true,
            comingUpOn: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        this.prisma.notification.count({
          where: whereClause
        })
      ]);

      // 7. Get notification statistics
      const stats = await this.prisma.notification.groupBy({
        by: ['type'],
        where: {
          school_id: fullUser.school_id,
          academic_session_id: currentSessionId
        },
        _count: {
          type: true
        }
      });

      // 8. Format statistics
      const notificationStats = {
        total: totalCount,
        all: 0,
        teachers: 0,
        students: 0,
        school_director: 0,
        admin: 0
      };

      stats.forEach(stat => {
        notificationStats[stat.type] = stat._count.type;
      });

      // 9. Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      const pagination = {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext,
        hasPrev
      };

      // Format notifications with date formatting
      const formattedNotifications = notifications.map(notification => ({
        ...notification,
        comingUpOn: notification.comingUpOn ? formatDate(notification.comingUpOn) : null,
        createdAt: formatDate(notification.createdAt),
        updatedAt: formatDate(notification.updatedAt)
      }));

      this.logger.log(colors.green(`✅ Fetched ${notifications.length} notifications out of ${totalCount} total`));

      return ResponseHelper.success('Notifications fetched successfully', {
        pagination,
        stats: notificationStats,
        notifications: formattedNotifications,
      });

    } catch (error) {
      this.logger.error(colors.red(`❌ Failed to fetch notifications: ${error.message}`), error);
      return ResponseHelper.error(`Failed to fetch notifications: ${error.message}`, 500);
    }
  }
}
