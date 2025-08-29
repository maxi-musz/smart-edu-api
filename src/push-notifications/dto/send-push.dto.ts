import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsObject } from 'class-validator';

export class SendPushDto {
  @ApiProperty({
    description: 'Notification ID',
    example: 'cmeriw5pj0003vlluarf41gun'
  })
  @IsString()
  @IsNotEmpty()
  notificationId: string;

  @ApiProperty({
    description: 'Notification title',
    example: 'New Assignment Posted'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'You have a new assignment in Mathematics'
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Additional data for the notification',
    example: {
      type: 'assignment',
      assignmentId: 'cmeriw5pj0003vlluarf41gun',
      screen: 'AssignmentDetail'
    }
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Array of user IDs to send notification to',
    example: ['user1', 'user2', 'user3']
  })
  @IsArray()
  @IsString({ each: true })
  recipients: string[];
}
