import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min, IsBoolean } from 'class-validator';

export class CreateGeneralMaterialDto {
  @ApiProperty({
    description: 'Title of the general material (ebook/textbook)',
    example: 'Advanced Algebra for Senior Secondary Schools',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the material',
    example: 'A comprehensive guide to advanced algebra concepts.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Author of the material',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  author?: string;

  @ApiPropertyOptional({
    description: 'ISBN of the material',
    example: '978-3-16-148410-0',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  isbn?: string;

  @ApiPropertyOptional({
    description: 'Publisher of the material',
    example: 'Smart Edu Publishing',
  })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  publisher?: string;

  @ApiPropertyOptional({
    description: 'Price of the material in platform currency (null or omitted = free)',
    example: 2500,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Currency code (e.g., NGN, USD)',
    example: 'NGN',
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Whether the material is free (overrides price if true)',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({
    description: 'Optional library class ID for categorization',
    example: 'class_123',
  })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Optional library subject ID for categorization',
    example: 'subject_123',
  })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Whether AI chat is enabled for this material',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isAiEnabled?: boolean;
}
