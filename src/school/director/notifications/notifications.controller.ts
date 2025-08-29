import { Controller, UseGuards, Post, Body, Req, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard/jwt.guard';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { NotificationsDocs } from './utils/api-docs/notifications.docs';
import { User } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('director/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService
  ) {}

  // Create notification
  @Post()
  @ApiOperation(NotificationsDocs.createNotificationOperation)
  @ApiResponse(NotificationsDocs.createNotificationResponse201)
  @ApiResponse(NotificationsDocs.createNotificationResponse400)
  async createNotification(
    @Body() dto: CreateNotificationDto,
    @Req() req: { user: User }
  ) {
    return this.notificationsService.createNotification(req.user, dto);
  }

  // Get all notifications with pagination, filtering, and search
  @Get()
  @ApiOperation(NotificationsDocs.getAllNotificationsOperation)
  @ApiResponse(NotificationsDocs.getAllNotificationsResponse200)
  async getAllNotifications(
    @Query() query: QueryNotificationsDto,
    @Req() req: { user: User }
  ) {
    return this.notificationsService.getAllNotifications(req.user, query);
  }
}
