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

export class RequestTeacherVideoUploadDto {
  @ApiProperty({ description: 'Title of the video lesson' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the video lesson' })
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

  @ApiProperty({ description: 'File name of the video', example: 'lecture.mp4' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'MIME type of the video', example: 'video/mp4' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({ description: 'Size of the video file in bytes' })
  @IsNumber()
  @Min(1)
  @Max(5 * 1024 * 1024 * 1024) // 5GB
  fileSize: number;
}

export class ConfirmTeacherVideoUploadDto {
  @ApiProperty({ description: 'DirectUpload record ID from request-video-upload' })
  @IsString()
  @IsNotEmpty()
  directUploadId: string;

  @ApiProperty({ description: 'S3 key returned from request-video-upload' })
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @ApiProperty({ description: 'Topic ID' })
  @IsString()
  @IsNotEmpty()
  topic_id: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subject_id: string;

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

  @ApiPropertyOptional({ description: 'Multipart upload ID' })
  @IsString()
  @IsOptional()
  uploadId?: string;

  @ApiPropertyOptional({ description: 'Completed parts with ETags' })
  @IsOptional()
  parts?: { partNumber: number; etag: string }[];

  @ApiPropertyOptional({ description: 'Thumbnail S3 key' })
  @IsString()
  @IsOptional()
  thumbnailS3Key?: string;
}

export class RequestTeacherThumbnailUploadDto {
  @ApiProperty({ description: 'File name of the thumbnail' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'MIME type of the thumbnail' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiProperty({ description: 'Topic ID' })
  @IsString()
  @IsNotEmpty()
  topic_id: string;

  @ApiProperty({ description: 'Subject ID' })
  @IsString()
  @IsNotEmpty()
  subject_id: string;

  @ApiProperty({ description: 'Video title' })
  @IsString()
  @IsNotEmpty()
  title: string;
}
