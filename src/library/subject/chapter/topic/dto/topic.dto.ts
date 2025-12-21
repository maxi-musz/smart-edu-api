import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTopicDto {
  @ApiProperty({
    description: 'ID of the library chapter to create this topic under',
    example: 'cmjbnj4zw0002vlevol2u657f',
  })
  @IsString()
  @IsNotEmpty()
  chapterId: string;

  @ApiProperty({
    description: 'ID of the library subject (for validation)',
    example: 'cmjbnj4zw0002vlevol2u657f',
  })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({
    description: 'Title of the topic',
    example: 'Introduction to Variables',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the topic',
    example: 'Learn about variables, their types, and how to use them in algebraic expressions',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Order/sequence number for the topic (default: 1)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Whether the topic is active (default: true)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;
}

export class UpdateTopicDto {
  @ApiPropertyOptional({
    description: 'Title of the topic',
    example: 'Introduction to Variables',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the topic',
    example: 'Learn about variables, their types, and how to use them in algebraic expressions',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Order/sequence number for the topic',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Whether the topic is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;
}

