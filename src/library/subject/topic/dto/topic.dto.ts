import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTopicDto {
  @ApiProperty({
    description: 'ID of the library subject to create this topic under',
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
    example:
      'Learn about variables, their types, and how to use them in algebraic expressions',
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
    example:
      'Learn about variables, their types, and how to use them in algebraic expressions',
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

/** Body for drag-and-drop reorder: 1-based positions as shown in the topic list. */
export class ReorderTopicDto {
  @ApiProperty({
    description:
      '1-based index of this topic in the list before the move (must match server order; used to detect stale UI)',
    example: 9,
    minimum: 1,
  })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  currentOrder: number;

  @ApiProperty({
    description:
      '1-based index where the topic should appear after the move (1 = first, N = last). ' +
      'You may also send N+1 to mean “after the last topic” (treated as N; same total count).',
    example: 7,
    minimum: 1,
  })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  newOrder: number;
}
