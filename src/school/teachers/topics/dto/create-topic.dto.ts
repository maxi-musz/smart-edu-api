import { IsString, IsOptional, IsNotEmpty, IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTopicDto {
  @ApiProperty({
    description: 'Title of the topic',
    example: 'Introduction to Algebra',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the topic',
    example: 'Basic concepts of algebra including variables, equations, and expressions',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Order of the topic within the subject (auto-assigned if not provided)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Whether the topic is active (default: true)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Subject ID that this topic belongs to',
    example: 'clx1234567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  subject_id: string;

  @ApiProperty({
    description: 'Academic session ID',
    example: 'clx1234567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  academic_session_id: string;
}
