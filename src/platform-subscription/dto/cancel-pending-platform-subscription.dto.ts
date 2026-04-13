import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CancelPendingPlatformSubscriptionDto {
  @ApiProperty({ description: 'PlatformSubscriptionPayment id (must be PENDING for this school)' })
  @IsString()
  @MinLength(8)
  payment_id!: string;
}
