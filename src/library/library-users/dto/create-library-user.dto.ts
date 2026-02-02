import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, IsArray, Min, Max, MinLength, ValidateIf } from 'class-validator';

export const LIBRARY_USER_ROLES = ['admin', 'manager', 'content_creator', 'reviewer', 'viewer'] as const;
export const LIBRARY_USER_TYPES = [
  'libraryresourceowner',
  'librarymanager',
  'contentcreator',
  'reviewer',
  'viewer',
] as const;

export class CreateLibraryUserDto {
  @ApiProperty({ description: 'Email (unique across platform)', example: 'creator@library.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Password (omit to auto-generate a strong password; onboarding email will contain it)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @ValidateIf((o) => o.password != null && o.password !== '')
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({ description: 'First name', example: 'Jane' })
  @IsString()
  first_name: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  @IsString()
  last_name: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({
    description: 'Role in the library',
    enum: LIBRARY_USER_ROLES,
    example: 'content_creator',
  })
  @IsOptional()
  @IsEnum(LIBRARY_USER_ROLES)
  role?: (typeof LIBRARY_USER_ROLES)[number];

  @ApiPropertyOptional({
    description: 'User type',
    enum: LIBRARY_USER_TYPES,
    example: 'contentcreator',
  })
  @IsOptional()
  @IsEnum(LIBRARY_USER_TYPES)
  userType?: (typeof LIBRARY_USER_TYPES)[number];

  @ApiPropertyOptional({
    description: 'Permission codes from LibraryPermissionDefinition (e.g. manage_library_users, view_analytics)',
    example: ['view_analytics'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Elevated permission level (e.g. 10 = can manage library users)',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  permissionLevel?: number;
}
