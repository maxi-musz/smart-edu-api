import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LibraryResourceType, AccessLevel } from '../../library-access-control/dto';

/**
 * DTO for querying available library resources for school
 */
export class QueryAvailableResourcesDto {
  @ApiPropertyOptional({
    description: 'Filter by resource type',
    enum: LibraryResourceType,
  })
  @IsOptional()
  @IsEnum(LibraryResourceType)
  resourceType?: LibraryResourceType;

  @ApiPropertyOptional({
    description: 'Filter by subject ID',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search query',
  })
  @IsOptional()
  @IsString()
  search?: string;

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
 * DTO for querying user's accessible resources
 */
export class QueryUserResourcesDto {
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

/**
 * DTO for analytics query
 */
export class QueryAccessAnalyticsDto {
  @ApiPropertyOptional({
    description: 'Start date for analytics (ISO 8601)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics (ISO 8601)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Group by field',
    enum: ['resourceType', 'role', 'class', 'user'],
  })
  @IsOptional()
  @IsString()
  groupBy?: string;
}
