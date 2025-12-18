import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateLibraryClassDevDto {
  @ApiPropertyOptional({
    description: 'Updated canonical name of the class',
    example: 'JSS 1 (Updated)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated display/order index',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}


