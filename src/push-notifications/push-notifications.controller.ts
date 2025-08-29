import { Controller, Post, Delete, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtGuard } from 'src/school/auth/guard/jwt.guard';
import { PushNotificationsService } from './push-notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { UnregisterDeviceDto } from './dto/unregister-device.dto';
import { SendPushDto } from './dto/send-push.dto';
import { DeviceTokenResponseDto } from './dto/device-token-response.dto';
import { PushNotificationsDocs } from './utils/api-docs/push-notifications.docs';

@ApiTags('Push Notifications')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('push-notifications')
export class PushNotificationsController {
  constructor(private readonly pushNotificationsService: PushNotificationsService) {}

  @Post('register-device')
  @ApiOperation(PushNotificationsDocs.registerDeviceOperation)
  @ApiResponse(PushNotificationsDocs.registerDeviceResponse200)
  @ApiResponse(PushNotificationsDocs.registerDeviceResponse400)
  @ApiResponse(PushNotificationsDocs.registerDeviceResponse500)
  async registerDevice(@Body() dto: RegisterDeviceDto, @Req() req: any) {
    return this.pushNotificationsService.registerDevice(req.user, dto);
  }

  @Delete('unregister-device')
  @ApiOperation(PushNotificationsDocs.unregisterDeviceOperation)
  @ApiResponse(PushNotificationsDocs.unregisterDeviceResponse200)
  @ApiResponse(PushNotificationsDocs.unregisterDeviceResponse400)
  @ApiResponse(PushNotificationsDocs.unregisterDeviceResponse404)
  @ApiResponse(PushNotificationsDocs.unregisterDeviceResponse500)
  async unregisterDevice(@Body() dto: UnregisterDeviceDto, @Req() req: any) {
    return this.pushNotificationsService.unregisterDevice(req.user, dto);
  }

  @Post('send-push')
  @ApiOperation(PushNotificationsDocs.sendPushOperation)
  @ApiResponse(PushNotificationsDocs.sendPushResponse200)
  @ApiResponse(PushNotificationsDocs.sendPushResponse400)
  @ApiResponse(PushNotificationsDocs.sendPushResponse500)
  async sendPushNotification(@Body() dto: SendPushDto, @Req() req: any) {
    return this.pushNotificationsService.sendPushNotification(req.user, dto);
  }
}
