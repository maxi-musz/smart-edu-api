import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum LibraryResourceType {
  SUBJECT = 'SUBJECT',
  TOPIC = 'TOPIC',
  VIDEO = 'VIDEO',
  MATERIAL = 'MATERIAL',
  ASSESSMENT = 'ASSESSMENT',
  ALL = 'ALL',
}

export enum AccessLevel {
  FULL = 'FULL',
  READ_ONLY = 'READ_ONLY',
  LIMITED = 'LIMITED',
}

/**
 * DTO for granting a school access to library resources
 */
export class GrantAccessDto {
  @ApiProperty({
    description: 'School ID to grant access to',
    example: 'clxxx123456',
  })
  @IsString()
  schoolId: string;

  @ApiProperty({
    description: 'Type of resource being granted',
    enum: LibraryResourceType,
    example: LibraryResourceType.SUBJECT,
  })
  @IsEnum(LibraryResourceType)
  resourceType: LibraryResourceType;

  @ApiPropertyOptional({
    description: 'Subject ID (required if resourceType is SUBJECT, TOPIC, VIDEO, MATERIAL, or ASSESSMENT under a subject)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Topic ID (required if resourceType is TOPIC, VIDEO, MATERIAL, or ASSESSMENT under a topic)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Video ID (required if resourceType is VIDEO)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({
    description: 'Material ID (required if resourceType is MATERIAL)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional({
    description: 'Assessment ID (required if resourceType is ASSESSMENT)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  assessmentId?: string;

  @ApiProperty({
    description: 'Access level for the resource',
    enum: AccessLevel,
    default: AccessLevel.FULL,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel = AccessLevel.FULL;

  @ApiPropertyOptional({
    description: 'Optional expiration date for the access (ISO 8601 format)',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Optional notes about this access grant',
    example: 'Trial access for Q1 2026',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for granting multiple schools access to the same resource
 */
export class GrantBulkAccessDto {
  @ApiProperty({
    description: 'Array of school IDs to grant access to',
    example: ['clxxx123456', 'clxxx789012'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  schoolIds: string[];

  @ApiProperty({
    description: 'Type of resource being granted',
    enum: LibraryResourceType,
    example: LibraryResourceType.SUBJECT,
  })
  @IsEnum(LibraryResourceType)
  resourceType: LibraryResourceType;

  @ApiPropertyOptional({
    description: 'Subject ID',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Topic ID',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({
    description: 'Video ID',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({
    description: 'Material ID',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional({
    description: 'Assessment ID',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  assessmentId?: string;

  @ApiProperty({
    description: 'Access level for the resource',
    enum: AccessLevel,
    default: AccessLevel.FULL,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel = AccessLevel.FULL;

  @ApiPropertyOptional({
    description: 'Optional expiration date for the access (ISO 8601 format)',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Optional notes about this access grant',
    example: 'Bulk trial access for partner schools',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for updating an existing access grant
 */
export class UpdateAccessDto {
  @ApiPropertyOptional({
    description: 'New access level',
    enum: AccessLevel,
  })
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    description: 'New expiration date (ISO 8601 format)',
    example: '2026-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Whether the access is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Updated notes',
    example: 'Extended access for Q2 2026',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for revoking access (with optional reason)
 */
export class RevokeAccessDto {
  @ApiPropertyOptional({
    description: 'Reason for revoking access',
    example: 'Subscription ended',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * DTO for excluding (turning off) a resource under a subject grant.
 * When library owner grants a subject, all topics/videos/materials/assessments are on by default.
 * They can turn off individual items; this creates an "exclusion" (isActive: false).
 */
export class ExcludeResourceDto {
  @ApiProperty({ description: 'School ID', example: 'clxxx123456' })
  @IsString()
  schoolId: string;

  @ApiProperty({
    description: 'Type of resource to turn off',
    enum: [LibraryResourceType.TOPIC, LibraryResourceType.VIDEO, LibraryResourceType.MATERIAL, LibraryResourceType.ASSESSMENT],
    example: LibraryResourceType.TOPIC,
  })
  @IsEnum(LibraryResourceType)
  resourceType: LibraryResourceType.TOPIC | LibraryResourceType.VIDEO | LibraryResourceType.MATERIAL | LibraryResourceType.ASSESSMENT;

  @ApiPropertyOptional({ description: 'Topic ID (required if resourceType is TOPIC)' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({ description: 'Video ID (required if resourceType is VIDEO)' })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({ description: 'Material ID (required if resourceType is MATERIAL)' })
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional({ description: 'Assessment ID (required if resourceType is ASSESSMENT)' })
  @IsOptional()
  @IsString()
  assessmentId?: string;
}
