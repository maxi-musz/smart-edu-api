import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';

export class QueryGeneralMaterialsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 20, default: 20 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Search term (title, author, description)', example: 'algebra' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter', example: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter', example: 5000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by free materials', example: true })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({ description: 'Filter by AI-enabled materials', example: true })
  @IsBoolean()
  @IsOptional()
  isAiEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Filter by class ID', example: 'class_123' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ description: 'Filter by subject ID', example: 'subject_123' })
  @IsString()
  @IsOptional()
  subjectId?: string;
}
