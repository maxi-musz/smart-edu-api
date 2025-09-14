import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum UserRole {
  TEACHER = 'teacher',
  STUDENT = 'student',
  SCHOOL_DIRECTOR = 'school_director',
  SCHOOL_ADMIN = 'school_admin',
  PARENT = 'parent',
  ICT_STAFF = 'ict_staff'
}

export class InitiateAiChatDto {
  @ApiProperty({
    description: 'User role to determine AI chat capabilities',
    enum: UserRole,
    example: 'teacher'
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(UserRole)
  userRole: UserRole;
}

export class TeacherMaterialDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string | null;

  @ApiProperty()
  fileType: string | null;

  @ApiProperty()
  originalName: string | null;

  @ApiProperty()
  size: string | null;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  isProcessed: boolean;
}

export class SupportedDocumentTypeDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  extension: string;

  @ApiProperty()
  mimeType: string;

  @ApiProperty()
  maxSize: string;

  @ApiProperty()
  description: string;
}

export class UsageLimitsDto {
  @ApiProperty()
  filesUploadedThisMonth: number;

  @ApiProperty()
  totalFilesUploadedAllTime: number;

  @ApiProperty()
  totalStorageUsedMB: number;

  @ApiProperty()
  maxFilesPerMonth: number;

  @ApiProperty()
  maxFileSizeMB: number;

  @ApiProperty()
  maxStorageMB: number;

  @ApiProperty()
  tokensUsedThisWeek: number;

  @ApiProperty()
  tokensUsedAllTime: number;

  @ApiProperty()
  messagesSentThisWeek: number;

  @ApiProperty()
  maxTokensPerWeek: number;

  @ApiProperty()
  maxMessagesPerWeek: number;

  @ApiProperty()
  maxTokensPerMessage: number;

  @ApiProperty()
  lastFileResetDate: string;

  @ApiProperty()
  lastTokenResetDate: string;
}

export class InitiateAiChatResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    userRole: string;
    documentCount: number;
    supportedDocumentTypes: SupportedDocumentTypeDto[];
    uploadedDocuments: TeacherMaterialDto[];
    conversations: any[];
    usageLimits: UsageLimitsDto;
  };

  @ApiProperty()
  statusCode: number;
}
