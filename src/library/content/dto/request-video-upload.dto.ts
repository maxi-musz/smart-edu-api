import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class RequestVideoUploadDto {
  @ApiProperty({
    description: 'ID of the library topic to upload video to',
    example: 'cmjbnj4zw0002vlevol2u657f',
  })
  @IsString()
  @IsNotEmpty()
  topicId: string;

  @ApiProperty({
    description: 'ID of the library subject (for validation)',
    example: 'cmjbnj4zw0002vlevol2u657f',
  })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({
    description: 'Title of the video lesson',
    example: 'Introduction to Variables',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the video lesson',
    example: 'Learn about variables and how to use them',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({
    description: 'File name of the video (e.g. "lecture.mp4")',
    example: 'introduction-to-variables.mp4',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the video file',
    example: 'video/mp4',
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({
    description: 'Size of the video file in bytes',
    example: 524288000,
  })
  @IsNumber()
  @Min(1)
  @Max(5 * 1024 * 1024 * 1024) // 5GB
  fileSize: number;
}

export class ConfirmVideoUploadDto {
  @ApiProperty({
    description: 'DirectUpload record ID from request-video-upload response',
  })
  @IsString()
  @IsNotEmpty()
  directUploadId: string;

  @ApiProperty({ description: 'S3 key returned from request-video-upload' })
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @ApiProperty({ description: 'Library topic ID' })
  @IsString()
  @IsNotEmpty()
  topicId: string;

  @ApiProperty({ description: 'Library subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: 'Video title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Video description' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'S3 multipart upload ID (for multipart uploads)',
  })
  @IsString()
  @IsOptional()
  uploadId?: string;

  @ApiPropertyOptional({
    description: 'Completed parts with ETags (for multipart uploads)',
  })
  @IsOptional()
  parts?: { partNumber: number; etag: string }[];

  @ApiPropertyOptional({ description: 'Thumbnail S3 key' })
  @IsString()
  @IsOptional()
  thumbnailS3Key?: string;
}

export class RequestThumbnailUploadDto {
  @ApiProperty({
    description: 'File name of the thumbnail',
    example: 'thumb.jpg',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the thumbnail',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({ description: 'Library topic ID' })
  @IsString()
  @IsNotEmpty()
  topicId: string;

  @ApiProperty({ description: 'Library subject ID' })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({ description: 'Video title (for consistent S3 key naming)' })
  @IsString()
  @IsNotEmpty()
  title: string;
}
