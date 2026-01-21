import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean, Min, Max } from 'class-validator';

export class TrackWatchProgressDto {
  @ApiPropertyOptional({
    description: 'How long the user watched in seconds',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  watchDurationSeconds?: number;

  @ApiPropertyOptional({
    description: 'Last watch position in seconds (for resume functionality)',
    example: 120,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lastWatchPosition?: number;

  @ApiPropertyOptional({
    description: 'Device type',
    example: 'mobile',
    enum: ['mobile', 'tablet', 'desktop', 'tv'],
  })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiPropertyOptional({
    description: 'Platform',
    example: 'ios',
    enum: ['ios', 'android', 'web'],
  })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({
    description: 'How user arrived at the video',
    example: 'search',
    enum: ['direct', 'search', 'recommendation', 'related_video', 'playlist'],
  })
  @IsOptional()
  @IsString()
  referrerSource?: string;

  @ApiPropertyOptional({
    description: 'Video quality',
    example: '720p',
    enum: ['360p', '480p', '720p', '1080p', '1440p', '2160p'],
  })
  @IsOptional()
  @IsString()
  videoQuality?: string;

  @ApiPropertyOptional({
    description: 'Playback speed',
    example: 1.0,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(2.0)
  playbackSpeed?: number;

  @ApiPropertyOptional({
    description: 'Number of buffering interruptions',
    example: 2,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferingEvents?: number;

  @ApiPropertyOptional({
    description: 'Session ID to group multiple watch events',
    example: 'session-uuid-123',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'User agent string',
    example: 'Mozilla/5.0...',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

