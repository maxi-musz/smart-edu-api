import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLibrarySubjectDevDto {
  @ApiProperty({
    description: 'Library platform ID this subject belongs to',
    example: 'clibplat1234567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  platformId: string;

  @ApiProperty({
    description: 'Name of the subject',
    example: 'Mathematics',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Optional subject code (must be unique per platform if provided)',
    example: 'MTH101',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Optional library class ID this subject is grouped under',
    example: 'clibclass1234567890abcdef',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Hex color used when displaying this subject',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Optional subject description',
    example: 'Core mathematics subject for junior secondary school.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}


