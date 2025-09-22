import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationQueryDto {
  @ApiProperty({ 
    example: 1, 
    description: 'Page number (1-based)',
    required: false,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 1;
    const parsed = parseInt(value);
    return isNaN(parsed) ? 1 : parsed;
  })
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    example: 10, 
    description: 'Number of items per page',
    required: false,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return 10;
    const parsed = parseInt(value);
    return isNaN(parsed) ? 10 : Math.min(Math.max(parsed, 1), 100);
  })
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number' })
  current_page: number;

  @ApiProperty({ example: 10, description: 'Number of items per page' })
  per_page: number;

  @ApiProperty({ example: 25, description: 'Total number of items' })
  total: number;

  @ApiProperty({ example: 3, description: 'Total number of pages' })
  total_pages: number;

  @ApiProperty({ example: true, description: 'Whether there is a next page' })
  has_next: boolean;

  @ApiProperty({ example: false, description: 'Whether there is a previous page' })
  has_previous: boolean;
}
