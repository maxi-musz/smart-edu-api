import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryGeneralMaterialsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term (title, author, description)', example: 'algebra' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by AI-enabled materials', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAiEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Filter by class ID (single class)', example: 'class_123' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by multiple class IDs (array)', example: ['class_123', 'class_456'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  classIds?: string[];

  @ApiPropertyOptional({ description: 'Filter by subject ID', example: 'subject_123' })
  @IsString()
  @IsOptional()
  subjectId?: string;
}
