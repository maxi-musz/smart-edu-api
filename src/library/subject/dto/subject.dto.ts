import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsHexColor, MaxLength } from 'class-validator';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'ID of the library class to create this subject under',
    example: 'cmjbnj4zw0002vlevol2u657f',
  })
  @IsString()
  @IsNotEmpty()
  classId: string;

  @ApiProperty({
    description: 'Name of the subject',
    example: 'Mathematics',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Subject code (must be unique within the platform)',
    example: 'MATH',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the subject (default: #3B82F6)',
    example: '#3B82F6',
  })
  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Description of the subject',
    example: 'Mathematics subject covering algebra, geometry, and calculus',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Thumbnail image for the subject (JPEG, PNG, GIF, WEBP - max 5MB)',
    type: 'string',
    format: 'binary',
  })
  thumbnail?: any;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({
    description: 'Name of the subject',
    example: 'Mathematics',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Subject code (must be unique within the platform)',
    example: 'MATH',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({
    description: 'Hex color code for the subject',
    example: '#3B82F6',
  })
  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({
    description: 'Description of the subject',
    example: 'Mathematics subject covering algebra, geometry, and calculus',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;
}

