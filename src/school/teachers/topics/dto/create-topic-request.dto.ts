import { IsString, IsOptional, IsNotEmpty, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateTopicRequestDto {
  @ApiProperty({
    description: 'Title of the topic',
    example: 'Introduction to English Grammar',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the topic',
    example: 'Basic concepts and fundamentals of English grammar',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Instructions for the topic',
    example: 'Watch the introduction videos and complete the practice problems',
  })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Whether the topic is active (default: true)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Subject ID that this topic belongs to (accepts both subjectId and subject_id)',
    example: 'cmevi6gbj000xvlhl2dxmixr0',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value, obj }) => {
    // Handle both subjectId and subject_id
    return value || obj.subjectId;
  })
  subject_id: string;

  @ApiPropertyOptional({
    description: 'Academic session ID (optional - will use current active session if not provided)',
    example: 'clx1234567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  academic_session_id?: string;
}
