import { IsString, IsOptional, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({
    description: 'Name of the subject',
    example: 'Mathematics',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Subject code (e.g., MATH101)',
    example: 'MATH101',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Hex color for the subject (default: #3B82F6)',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Description of the subject',
    example: 'Advanced mathematics including algebra, calculus, and geometry',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Thumbnail image for the subject',
    example: { secure_url: 'https://example.com/image.jpg', public_id: 'image_id' },
  })
  @IsOptional()
  thumbnail?: any;

  @ApiProperty({
    description: 'Academic session ID',
    example: 'clx1234567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  academic_session_id: string;
}
