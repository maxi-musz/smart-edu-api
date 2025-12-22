import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, IsInt, Min } from 'class-validator';

export class UpdateLibraryVideoDto {
  @ApiPropertyOptional({
    description: 'Title of the video lesson',
    example: 'Introduction to Variables',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the video lesson',
    example: 'Learn about variables, their types, and how to use them in algebraic expressions',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'ID of the video to swap order with. If provided, the orders of both videos will be swapped.',
    example: 'cmjftk4ym0002sbliiepnlu15',
  })
  @IsString()
  @IsOptional()
  swapOrderWith?: string;
}

