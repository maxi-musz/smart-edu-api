import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UploadLibraryVideoDto {
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
    example: 'Learn about variables, their types, and how to use them in algebraic expressions',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;
}

export class UploadLibraryVideoResponseDto {
  @ApiProperty()
  sessionId: string;

  @ApiProperty()
  progressEndpoint: string;
}

