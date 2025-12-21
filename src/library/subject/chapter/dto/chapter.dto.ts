import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChapterDto {
  @ApiProperty({
    description: 'ID of the library subject to create this chapter under',
    example: 'cmjbnj4zw0002vlevol2u657f',
  })
  @IsString()
  @IsNotEmpty()
  subjectId: string;

  @ApiProperty({
    description: 'Title of the chapter',
    example: 'Chapter 1: Algebra Basics',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the chapter',
    example: 'Introduction to algebraic concepts including variables, equations, and basic operations',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Order/sequence number for the chapter (default: 1)',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Whether the chapter is active (default: true)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;
}

export class UpdateChapterDto {
  @ApiPropertyOptional({
    description: 'Title of the chapter',
    example: 'Chapter 1: Algebra Basics',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the chapter',
    example: 'Introduction to algebraic concepts including variables, equations, and basic operations',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Order/sequence number for the chapter',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  order?: number;

  @ApiPropertyOptional({
    description: 'Whether the chapter is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  is_active?: boolean;
}

