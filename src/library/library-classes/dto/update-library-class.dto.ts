import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLibraryClassDto {
  @ApiPropertyOptional({
    description: 'Updated canonical name of the class',
    example: 'JSS 1 (Updated)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Display/order index',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
