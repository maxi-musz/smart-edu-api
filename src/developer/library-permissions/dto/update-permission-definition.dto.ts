import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdatePermissionDefinitionDto {
  @ApiPropertyOptional({
    description: 'Human-readable name for the permission',
    example: 'Manage library users',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Optional description of what this permission allows',
    example: 'Create, update, and delete library users under this library',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
