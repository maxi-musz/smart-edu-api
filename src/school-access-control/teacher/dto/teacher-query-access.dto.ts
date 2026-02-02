import { IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LibraryResourceType, AccessLevel } from '../../../library-access-control/dto';

/**
 * DTO for querying resources available to teacher
 */
export class QueryTeacherAvailableResourcesDto {
  @ApiPropertyOptional({
    description: 'Filter by resource type',
    enum: LibraryResourceType,
  })
  @IsOptional()
  @IsEnum(LibraryResourceType)
  resourceType?: LibraryResourceType;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

/**
 * DTO for querying student resources
 */
export class QueryStudentResourcesDto {
  @ApiPropertyOptional({
    description: 'Filter by resource type',
    enum: LibraryResourceType,
  })
  @IsOptional()
  @IsEnum(LibraryResourceType)
  resourceType?: LibraryResourceType;

  @ApiPropertyOptional({
    description: 'Filter by access level',
    enum: AccessLevel,
  })
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    description: 'Include expired access',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeExpired?: boolean = false;
}
