import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min } from 'class-validator';

export class CreateGeneralMaterialChapterDto {
  @ApiProperty({
    description: 'Title of the chapter',
    example: 'Chapter 1: Introduction to Algebra',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the chapter',
    example: 'This chapter introduces basic algebraic concepts.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Starting page number of this chapter in the full material (optional)',
    example: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  pageStart?: number;

  @ApiPropertyOptional({
    description: 'Ending page number of this chapter in the full material (optional)',
    example: 20,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  pageEnd?: number;
}
