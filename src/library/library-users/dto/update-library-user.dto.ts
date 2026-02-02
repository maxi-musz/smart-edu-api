import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString, IsArray, Min, Max, MinLength } from 'class-validator';
import { LIBRARY_USER_ROLES, LIBRARY_USER_TYPES } from './create-library-user.dto';

export class UpdateLibraryUserDto {
  @ApiPropertyOptional({ description: 'Email (unique across platform)', example: 'creator@library.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Password (omit to keep current)', example: 'SecurePass123!', minLength: 8 })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ description: 'First name', example: 'Jane' })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({ description: 'Last name', example: 'Doe' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+2348012345678' })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiPropertyOptional({ description: 'Role in the library', enum: LIBRARY_USER_ROLES })
  @IsOptional()
  @IsEnum(LIBRARY_USER_ROLES)
  role?: (typeof LIBRARY_USER_ROLES)[number];

  @ApiPropertyOptional({ description: 'User type', enum: LIBRARY_USER_TYPES })
  @IsOptional()
  @IsEnum(LIBRARY_USER_TYPES)
  userType?: (typeof LIBRARY_USER_TYPES)[number];

  @ApiPropertyOptional({
    description: 'Permission codes (replaces existing)',
    example: ['view_analytics', 'manage_library_users'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @ApiPropertyOptional({
    description: 'Elevated permission level (e.g. 10)',
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
