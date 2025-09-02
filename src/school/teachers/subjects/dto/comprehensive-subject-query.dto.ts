import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ComprehensiveSubjectQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for topics pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of topics per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term for topic title or description',
    example: 'grammar',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter topics by status',
    example: 'active',
    enum: ['active', 'inactive', 'draft'],
  })
  @IsOptional()
  @IsEnum(['active', 'inactive', 'draft'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter by content type',
    example: 'all',
    enum: ['all', 'videos', 'materials', 'mixed'],
  })
  @IsOptional()
  @IsEnum(['all', 'videos', 'materials', 'mixed'])
  type?: string = 'all';

  @ApiPropertyOptional({
    description: 'Order topics by field',
    example: 'order',
    enum: ['order', 'title', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsEnum(['order', 'title', 'createdAt', 'updatedAt'])
  orderBy?: string = 'order';

  @ApiPropertyOptional({
    description: 'Sort order for topics',
    example: 'asc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc' = 'asc';
}
