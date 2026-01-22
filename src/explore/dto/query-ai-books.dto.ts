import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAiBooksDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term (title, author, description)', example: 'algebra' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by class ID (single class)', example: 'class_123' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple class IDs (array)', example: ['class_123', 'class_456'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  classIds?: string[];
}
