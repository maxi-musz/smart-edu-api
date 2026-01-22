import { IsString, IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TextToSpeechDto {
  @ApiProperty({
    description: 'The text to convert to speech',
    example: 'Hello, this is a sample text that will be converted to speech.',
    maxLength: 4096,
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Voice to use for speech synthesis',
    enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    default: 'alloy',
    example: 'alloy',
  })
  @IsOptional()
  @IsIn(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'])
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

  @ApiPropertyOptional({
    description: 'Speed of speech (0.25 to 4.0)',
    minimum: 0.25,
    maximum: 4.0,
    default: 1.0,
    example: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.25)
  @Max(4.0)
  speed?: number;

  @ApiPropertyOptional({
    description: 'Language code (ISO 639-1) for speech synthesis',
    default: 'en',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;
}
