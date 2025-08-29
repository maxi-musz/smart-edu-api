// Note: Return plain objects for Swagger decorators; do not type as ApiOperation/ApiResponse
import { DeviceTokenResponseDto } from '../../dto/device-token-response.dto';
import { RegisterDeviceDto } from '../../dto/register-device.dto';
import { UnregisterDeviceDto } from '../../dto/unregister-device.dto';
import { SendPushDto } from '../../dto/send-push.dto';

export class PushNotificationsDocs {
  // Register Device
  static get registerDeviceOperation() {
    return {
      summary: 'Register device for push notifications',
      description: 'Register a device token to receive push notifications. This should be called when the app starts or when the user logs in.',
      tags: ['Push Notifications']
    };
  }

  static get registerDeviceResponse200() {
    return {
      status: 200,
      description: 'Device registered successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Device registered successfully' },
          data: {
            $ref: '#/components/schemas/DeviceTokenResponseDto'
          }
        }
      }
    };
  }

  static get registerDeviceResponse400() {
    return {
      status: 400,
      description: 'Bad request - Invalid data or user not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'User not found or invalid school data' },
          data: { type: 'null', example: null }
        }
      }
    };
  }

  static get registerDeviceResponse500() {
    return {
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Failed to register device: Database error' },
          data: { type: 'null', example: null }
        }
      }
    };
  }

  // Unregister Device
  static get unregisterDeviceOperation() {
    return {
      summary: 'Unregister device from push notifications',
      description: 'Unregister a device token to stop receiving push notifications. This should be called when the user logs out.',
      tags: ['Push Notifications']
    };
  }

  static get unregisterDeviceResponse200() {
    return {
      status: 200,
      description: 'Device unregistered successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Device unregistered successfully' },
          data: { type: 'null', example: null }
        }
      }
    };
  }

  static get unregisterDeviceResponse400() {
    return {
      status: 400,
      description: 'Bad request - Invalid data or user not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'User not found or invalid school data' },
          data: { type: 'null', example: null }
        }
      }
    };
  }

  static get unregisterDeviceResponse404() {
    return {
      status: 404,
      description: 'Device token not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Device token not found' },
          data: { type: 'null', example: null }
        }
      }
    };
  }

  static get unregisterDeviceResponse500() {
    return {
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Failed to unregister device: Database error' },
          data: { type: 'null', example: null }
        }
      }
    };
  }

  // Send Push Notification
  static get sendPushOperation() {
    return {
      summary: 'Send push notification to specific users',
      description: 'Send a push notification to specific users. This endpoint is typically used by administrators or for testing.',
      tags: ['Push Notifications']
    };
  }

  static get sendPushResponse200() {
    return {
      status: 200,
      description: 'Push notification sent successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Push notification sent successfully' },
          data: {
            type: 'object',
            properties: {
              sent: { type: 'number', example: 5 },
              total: { type: 'number', example: 10 },
              result: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        id: { type: 'string', example: 'ExponentPushToken[...]' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  static get sendPushResponse400() {
    return {
      status: 400,
      description: 'Bad request - Invalid data or user not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'User not found or invalid school data' },
          data: { type: 'null', example: null }
        }
      }
    };
  }

  static get sendPushResponse500() {
    return {
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Failed to send push notification: Expo API error' },
          data: { type: 'null', example: null }
        }
      }
    };
  }
}
