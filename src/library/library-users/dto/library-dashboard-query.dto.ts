import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DASHBOARD_SORT_BY = ['createdAt', 'email', 'first_name', 'last_name', 'role', 'status'] as const;
export const SORT_ORDER = ['asc', 'desc'] as const;

export class LibraryDashboardQueryDto {
  @ApiPropertyOptional({ description: 'Page number (1-based)', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search by email, first name, or last name (case-insensitive)',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: DASHBOARD_SORT_BY,
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(DASHBOARD_SORT_BY)
  sortBy?: (typeof DASHBOARD_SORT_BY)[number] = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SORT_ORDER,
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(SORT_ORDER)
  sortOrder?: (typeof SORT_ORDER)[number] = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: ['admin', 'manager', 'content_creator', 'reviewer', 'viewer'],
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['active', 'inactive', 'suspended'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
