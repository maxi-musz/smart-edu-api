import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID',
    example: 'cmeriw5pj0003vlluarf41gun'
  })
  id: string;

  @ApiProperty({
    description: 'School ID',
    example: 'cmeriw5pj0003vlluarf41gun'
  })
  school_id: string;

  @ApiProperty({
    description: 'Academic session ID',
    example: 'cmeriw5pj0003vlluarf41gun'
  })
  academic_session_id: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'New Student Enrollment'
  })
  title: string;

  @ApiProperty({
    description: 'Notification description',
    example: 'A new student has been enrolled in Class 10A'
  })
  description: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: 'all'
  })
  type: NotificationType;

  @ApiProperty({
    description: 'When the notification is coming up',
    example: '2024-09-15T10:00:00Z',
    nullable: true
  })
  comingUpOn: Date | null;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-08-28T16:20:15.000Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-08-28T16:20:15.000Z'
  })
  updatedAt: Date;
}
