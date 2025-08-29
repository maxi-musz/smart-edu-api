import { ApiProperty } from '@nestjs/swagger';
import { DeviceType } from './register-device.dto';

export class DeviceTokenResponseDto {
  @ApiProperty({
    description: 'Device token ID',
    example: 'cmeriw5pj0003vlluarf41gun'
  })
  id: string;

  @ApiProperty({
    description: 'Expo push token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
  })
  token: string;

  @ApiProperty({
    description: 'Device type',
    enum: DeviceType,
    example: 'ios'
  })
  deviceType: DeviceType;

  @ApiProperty({
    description: 'User ID',
    example: 'cmeriw5pj0003vlluarf41gun'
  })
  user_id: string;

  @ApiProperty({
    description: 'School ID',
    example: 'cmeriw5pj0003vlluarf41gun'
  })
  school_id: string;

  @ApiProperty({
    description: 'Whether the token is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-08-28T16:45:00.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-08-28T16:45:00.000Z'
  })
  updatedAt: Date;
}
