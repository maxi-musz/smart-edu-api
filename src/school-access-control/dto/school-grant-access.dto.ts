import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LibraryResourceType, AccessLevel } from '../../library-access-control/dto';

/**
 * DTO for school owners to grant users/roles/classes access to library resources
 */
export class SchoolGrantAccessDto {
  @ApiProperty({
    description: 'Library resource access ID (the grant from library owner)',
    example: 'clxxx123456',
  })
  @IsString()
  libraryResourceAccessId: string;

  @ApiPropertyOptional({
    description: 'Specific user ID to grant access (student, teacher, etc)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Role type to grant access to all users with this role',
    enum: ['student', 'teacher', 'school_director', 'school_admin', 'parent', 'ict_staff'],
    example: 'student',
  })
  @IsOptional()
  @IsString()
  roleType?: string;

  @ApiPropertyOptional({
    description: 'Class ID to grant access to all users in this class',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({
    description: 'Type of resource being granted',
    enum: LibraryResourceType,
    example: LibraryResourceType.SUBJECT,
  })
  @IsEnum(LibraryResourceType)
  resourceType: LibraryResourceType;

  @ApiPropertyOptional({
    description: 'Subject ID (if restricting to specific subject)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Topic ID (if restricting to specific topic)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Video ID (if restricting to specific video)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({
    description: 'Material ID (if restricting to specific material)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional({
    description: 'Assessment ID (if restricting to specific assessment)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  assessmentId?: string;

  @ApiProperty({
    description: 'Access level',
    enum: AccessLevel,
    default: AccessLevel.READ_ONLY,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel = AccessLevel.READ_ONLY;

  @ApiPropertyOptional({
    description: 'Optional expiration date (ISO 8601 format)',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Optional notes',
    example: 'Access for current term only',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for bulk granting access
 */
export class SchoolGrantBulkAccessDto {
  @ApiProperty({
    description: 'Library resource access ID',
    example: 'clxxx123456',
  })
  @IsString()
  libraryResourceAccessId: string;

  @ApiPropertyOptional({
    description: 'Array of user IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of class IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @ApiProperty({
    description: 'Type of resource',
    enum: LibraryResourceType,
  })
  @IsEnum(LibraryResourceType)
  resourceType: LibraryResourceType;

  @ApiPropertyOptional({
    description: 'Subject ID',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Topic ID',
  })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Video ID',
  })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({
    description: 'Material ID',
  })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional({
    description: 'Assessment ID',
  })
  @IsOptional()
  @IsString()
  assessmentId?: string;

  @ApiProperty({
    description: 'Access level',
    enum: AccessLevel,
    default: AccessLevel.READ_ONLY,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel = AccessLevel.READ_ONLY;

  @ApiPropertyOptional({
    description: 'Optional expiration date',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Optional notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for updating school resource access
 */
export class SchoolUpdateAccessDto {
  @ApiPropertyOptional({
    description: 'New access level',
    enum: AccessLevel,
  })
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    description: 'New expiration date',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Whether the access is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Updated notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for revoking access
 */
export class SchoolRevokeAccessDto {
  @ApiPropertyOptional({
    description: 'Reason for revoking',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
