import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class UpdateNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Updated Student Enrollment',
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Notification description',
    example: 'An updated notification about student enrollment',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: 'school_director',
    required: false
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({
    description: 'When the notification is coming up',
    example: '2024-09-15T10:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  comingUpOn?: string;
}
