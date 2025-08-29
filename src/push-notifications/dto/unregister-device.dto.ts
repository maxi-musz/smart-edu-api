import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UnregisterDeviceDto {
  @ApiProperty({
    description: 'Expo push token to unregister',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
