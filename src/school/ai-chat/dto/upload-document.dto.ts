import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UploadDocumentDto {
  @ApiPropertyOptional({
    description: 'Document title (optional - will auto-generate from filename if not provided)',
    example: 'Mathematics Chapter 5 - Algebra'
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ 
    description: 'Document description',
    example: 'Comprehensive guide to algebraic expressions and equations'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Subject ID (optional - for organizing materials)',
    example: 'clx1234567890abcdef'
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  subject_id?: string;

  @ApiPropertyOptional({ 
    description: 'Topic ID (optional - for organizing materials)',
    example: 'clx1234567890abcdef'
  })
  @IsString()
  @IsOptional()
  @IsUUID()
  topic_id?: string;
}

export class DocumentUploadResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  size: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  subject_id: string;

  @ApiProperty()
  topic_id: string;

  @ApiProperty()
  processing_status: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
