import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLibraryDevDto {
  @ApiProperty({
    description: 'Display name of the public library (must be unique)',
    example: 'Smart Edu Global Library',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug for the library (must be unique)',
    example: 'smart-edu-global-library',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    description: 'Email for the primary library owner account (must be unique across the platform)',
    example: 'owner@access-study.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for the primary library owner account',
    example: 'StrongPassw0rd!',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({
    description: 'Optional description of what this library contains or who owns it',
    example: 'Official Smart Edu public content library for West Africa.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateLibraryDevDto {
  @ApiPropertyOptional({
    description: 'Updated display name of the public library',
    example: 'Smart Edu Global Library (Updated)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated slug for the library (must remain unique)',
    example: 'smart-edu-global-library-updated',
  })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Updated description for the library',
    example: 'Updated description of the library and its contents.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}


export class AddLibraryOwnerDto {
  @ApiProperty({
    description: 'ID of the library platform to attach this owner/user to',
    example: 'lib_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  libraryId: string;

  @ApiProperty({
    description: 'Email for the library owner/manager account (must be unique across the platform)',
    example: 'owner@access-study.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password for the library owner/manager account',
    example: 'StrongPassw0rd!',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'First name of the library owner/manager',
    example: 'Ada',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the library owner/manager',
    example: 'Lovelace',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Phone number of the library owner/manager',
    example: '+2348012345678',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Role for this user inside the library platform (admin is treated as library owner)',
    example: 'admin',
  })
  @IsString()
  @IsOptional()
  role?: string;
}

