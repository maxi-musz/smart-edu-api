import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'The message content to send',
    example: 'What is this chapter about?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'The chapter ID to send the message about (materialId is actually chapterId)',
    example: 'chapter-123',
  })
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @ApiPropertyOptional({
    description: 'Language code for the response (ISO 639-1 format, e.g., "en", "fr", "es", "de"). Defaults to "en" if not provided.',
    example: 'en',
    default: 'en',
  })
  @IsString()
  @IsOptional()
  language?: string;
}
