import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsBoolean } from 'class-validator';

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
}
