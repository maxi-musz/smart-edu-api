import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android'
}

export class RegisterDeviceDto {
  @ApiProperty({
    description: 'Expo push token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Device type',
    enum: DeviceType,
    example: 'ios'
  })
  @IsEnum(DeviceType)
  deviceType: DeviceType;
}
