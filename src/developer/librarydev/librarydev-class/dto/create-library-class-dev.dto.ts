import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';

export class CreateLibraryClassDevDto {
  @ApiProperty({
    description: 'Library platform ID this class belongs to',
    example: 'clibplat1234567890abcdef',
  })
  @IsUUID()
  @IsNotEmpty()
  platformId: string;

  @ApiProperty({
    description: 'Canonical name of the library class (e.g. "JSS 1", "SS 2 Science")',
    example: 'JSS 1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Display/order index for sorting classes',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}


