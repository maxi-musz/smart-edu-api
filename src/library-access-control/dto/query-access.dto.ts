import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { LibraryResourceType, AccessLevel } from './grant-access.dto';

/**
 * DTO for querying schools with access
 */
export class QuerySchoolsWithAccessDto {
  @ApiPropertyOptional({
    description: 'Filter by resource type',
    enum: LibraryResourceType,
  })
  @IsOptional()
  @IsEnum(LibraryResourceType)
  resourceType?: LibraryResourceType;

  @ApiPropertyOptional({
    description: 'Filter by subject ID',
    example: 'clxxx123456',
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search by school name or email',
    example: 'Adventist',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
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
 * DTO for querying access details for a specific school
 */
export class QuerySchoolAccessDetailsDto {
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
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Include expired access grants',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeExpired?: boolean = false;
}
