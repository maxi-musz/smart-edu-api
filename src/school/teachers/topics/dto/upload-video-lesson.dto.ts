import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class UploadVideoLessonDto {
  @ApiProperty({
    description: 'Title of the video lesson',
    example: 'Introduction to Algebra Basics'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the video lesson',
    example: 'Learn the fundamental concepts of algebra including variables and equations'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Subject ID where the video lesson belongs',
    example: 'cmevi6gbj000xvlhl2dxmixr0'
  })
  @IsString()
  @IsNotEmpty()
  subject_id: string;

  @ApiProperty({
    description: 'Topic ID where the video lesson belongs',
    example: 'topic123'
  })
  @IsString()
  @IsNotEmpty()
  topic_id: string;
}

export class VideoLessonResponseDto {
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
  duration: string;

  @ApiProperty()
  status: string;

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

export class UploadProgressDto {
  @ApiProperty()
  progress: number; // 0-100

  @ApiProperty()
  status: 'uploading' | 'processing' | 'completed' | 'failed';

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  data?: any;

  @ApiPropertyOptional()
  error?: string;
}
