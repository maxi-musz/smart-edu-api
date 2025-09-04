import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UploadMaterialDto {
  @ApiProperty({ description: 'Material title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Material description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subject_id: string;

  @ApiProperty({ description: 'Topic ID' })
  @IsString()
  @IsNotEmpty()
  topic_id: string;
}

export class MaterialResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  thumbnail?: any;

  @ApiProperty()
  size: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  downloads: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  order: number;

  @ApiProperty()
  subject_id: string;

  @ApiProperty()
  topic_id: string;

  @ApiProperty()
  uploaded_by: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
