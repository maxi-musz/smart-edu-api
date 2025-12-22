import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum, IsInt, Min } from 'class-validator';
import { LibraryMaterialType } from '@prisma/client';

export class UploadChapterFileDto {
  @ApiPropertyOptional({
    description: 'Title/name for the file (optional, defaults to original filename)',
    example: 'Chapter 1 - Introduction PDF',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the file content',
    example: 'Introduction to algebra concepts',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of material file',
    enum: LibraryMaterialType,
    example: LibraryMaterialType.PDF,
  })
  @IsEnum(LibraryMaterialType)
  @IsOptional()
  fileType?: LibraryMaterialType;

  @ApiPropertyOptional({
    description: 'Order/sequence number for the file within the chapter (default: 1)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  order?: number;

  @ApiProperty({
    description: 'File to upload (PDF, DOC, DOCX, PPT, PPTX, etc. - max 300MB)',
    type: 'string',
    format: 'binary',
  })
  file: any; // For Swagger documentation
}

