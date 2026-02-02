import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePermissionDefinitionDto {
  @ApiProperty({
    description: 'Unique permission code (e.g. upload_video, manage_library_users, view_analytics)',
    example: 'manage_library_users',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z][a-z0-9_]*$/, {
    message: 'code must be lowercase alphanumeric with underscores',
  })
  code: string;

  @ApiProperty({
    description: 'Human-readable name for the permission',
    example: 'Manage library users',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Optional description of what this permission allows',
    example: 'Create, update, and delete library users under this library',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
