import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Resource types that teachers can exclude (not SUBJECT or ALL). */
export const TEACHER_EXCLUDE_RESOURCE_TYPES = ['TOPIC', 'VIDEO', 'MATERIAL', 'ASSESSMENT'] as const;
export type TeacherExcludeResourceType = (typeof TEACHER_EXCLUDE_RESOURCE_TYPES)[number];

/**
 * DTO for teacher to exclude (turn off) a topic/video/material/assessment for students or a class.
 * Teacher cannot exclude subjects. Students see school content minus these exclusions.
 */
export class TeacherExcludeResourceDto {
  @ApiProperty({
    description: 'Library subject ID under which the resource lives',
    example: 'clxxx123456',
  })
  @IsString()
  subjectId: string;

  @ApiProperty({
    description: 'Type of resource to exclude',
    enum: TEACHER_EXCLUDE_RESOURCE_TYPES,
    example: 'TOPIC',
  })
  @IsEnum(TEACHER_EXCLUDE_RESOURCE_TYPES)
  resourceType: TeacherExcludeResourceType;

  @ApiPropertyOptional({
    description: 'Topic ID (required if resourceType is TOPIC)',
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

  @ApiPropertyOptional({
    description: 'Library class ID – exclude for library class (e.g. JSS-1, Primary-1 from Explore). Use for library materials.',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Library class ID (same as classId). Exclusions affect only this school.',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  libraryClassId?: string;

  @ApiPropertyOptional({
    description: 'Student user ID – exclude for this student only. Omit to exclude for class only.',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  studentId?: string;
}
