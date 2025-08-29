import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationResponseDto } from '../../dto/notification-response.dto';
import { CreateNotificationDto } from '../../dto/create-notification.dto';
import { UpdateNotificationDto } from '../../dto/update-notification.dto';
import { QueryNotificationsDto } from '../../dto/query-notifications.dto';

export class NotificationsDocs {
  // Create notification
  static get createNotificationOperation() {
    return {
      summary: 'Create a new notification',
      description: 'Create a new notification for the school'
    };
  }

  static get createNotificationResponse201() {
    return {
      status: 201,
      description: 'Notification created successfully',
      type: NotificationResponseDto
    };
  }

  static get createNotificationResponse400() {
    return {
      status: 400,
      description: 'Bad request - Invalid data provided'
    };
  }

  // Get all notifications
  static get getAllNotificationsOperation() {
    return {
      summary: 'Get all notifications',
      description: 'Retrieve all notifications with pagination and filtering'
    };
  }

  static get getAllNotificationsResponse200() {
    return {
      status: 200,
      description: 'Notifications retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Notifications retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              notifications: {
                type: 'array',
                items: { $ref: '#/components/schemas/NotificationResponseDto' }
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 10 },
                  total: { type: 'number', example: 25 },
                  totalPages: { type: 'number', example: 3 },
                  hasNext: { type: 'boolean', example: true },
                  hasPrev: { type: 'boolean', example: false }
                }
              },
              stats: {
                type: 'object',
                properties: {
                  total: { type: 'number', example: 25 },
                  all: { type: 'number', example: 10 },
                  teachers: { type: 'number', example: 5 },
                  students: { type: 'number', example: 5 },
                  school_director: { type: 'number', example: 3 },
                  admin: { type: 'number', example: 2 }
                }
              }
            }
          }
        }
      }
    };
  }

  // Get notification by ID
  static get getNotificationByIdOperation() {
    return {
      summary: 'Get notification by ID',
      description: 'Retrieve a specific notification by its ID'
    };
  }

  static get getNotificationByIdResponse200() {
    return {
      status: 200,
      description: 'Notification retrieved successfully',
      type: NotificationResponseDto
    };
  }

  static get getNotificationByIdResponse404() {
    return {
      status: 404,
      description: 'Notification not found'
    };
  }

  // Update notification
  static get updateNotificationOperation() {
    return {
      summary: 'Update notification',
      description: 'Update an existing notification'
    };
  }

  static get updateNotificationResponse200() {
    return {
      status: 200,
      description: 'Notification updated successfully',
      type: NotificationResponseDto
    };
  }

  static get updateNotificationResponse404() {
    return {
      status: 404,
      description: 'Notification not found'
    };
  }

  // Delete notification
  static get deleteNotificationOperation() {
    return {
      summary: 'Delete notification',
      description: 'Delete a notification by its ID'
    };
  }

  static get deleteNotificationResponse200() {
    return {
      status: 200,
      description: 'Notification deleted successfully'
    };
  }

  static get deleteNotificationResponse404() {
    return {
      status: 404,
      description: 'Notification not found'
    };
  }
}
