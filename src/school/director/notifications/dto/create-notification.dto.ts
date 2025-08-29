import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'New Student Enrollment'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification description',
    example: 'A new student has been enrolled in Class 10A'
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: 'all'
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'When the notification is coming up (optional)',
    example: '2024-09-15T10:00:00Z',
    required: false
  })
  @IsOptional()
  @IsDateString()
  comingUpOn?: string;
}
