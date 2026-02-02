import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LibraryResourceType, AccessLevel } from '../../../library-access-control/dto';

/**
 * DTO for teachers to grant students/classes access to resources
 */
export class TeacherGrantAccessDto {
  @ApiProperty({
    description: 'School resource access ID (what the school granted)',
    example: 'clxxx123456',
  })
  @IsString()
  schoolResourceAccessId: string;

  @ApiPropertyOptional({
    description: 'Specific student ID',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'Class ID (all students in the class)',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  classId?: string;

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
 * DTO for bulk granting access to multiple students
 */
export class TeacherGrantBulkAccessDto {
  @ApiProperty({
    description: 'School resource access ID',
  })
  @IsString()
  schoolResourceAccessId: string;

  @ApiPropertyOptional({
    description: 'Array of student IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of class IDs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];

  @ApiProperty({
    description: 'Resource type',
    enum: LibraryResourceType,
  })
  @IsEnum(LibraryResourceType)
  resourceType: LibraryResourceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  materialId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentId?: string;

  @ApiProperty({
    enum: AccessLevel,
    default: AccessLevel.READ_ONLY,
  })
  @IsEnum(AccessLevel)
  @IsOptional()
  accessLevel?: AccessLevel = AccessLevel.READ_ONLY;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for updating teacher resource access
 */
export class TeacherUpdateAccessDto {
  @ApiPropertyOptional({
    enum: AccessLevel,
  })
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for revoking access
 */
export class TeacherRevokeAccessDto {
  @ApiPropertyOptional({
    description: 'Reason for revoking',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
