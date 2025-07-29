import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddNewTeacherDto {
  @ApiProperty({ example: 'John', description: 'First name of the teacher' })
  @IsString()
  first_name: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the teacher' })
  @IsString()
  last_name: string;

  @ApiProperty({ example: 'john.doe@email.com', description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '08012345678', description: 'Phone number' })
  @IsString()
  phone_number: string;

  @ApiProperty({ example: 'https://...', description: 'Display picture URL', required: false })
  @IsOptional()
  @IsString()
  display_picture?: string;

  @ApiProperty({ example: 'active', description: 'Status', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: ['subject-id-1', 'subject-id-2'], description: 'Array of subject IDs', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectsTeaching?: string[];

  @ApiProperty({ example: ['class-id-1', 'class-id-2'], description: 'Array of class IDs', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classesManaging?: string[];

  @ApiProperty({ example: 'password123', description: 'Password (optional, will be generated if not provided)', required: false })
  @IsOptional()
  @IsString()
  password?: string;
}

export class UpdateTeacherDto {
  @ApiProperty({ example: 'John', description: 'First name of the teacher', required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the teacher', required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ example: 'john.doe@email.com', description: 'Email address', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '08012345678', description: 'Phone number', required: false })
  @IsOptional()
  @IsString()
  phone_number?: string;

  @ApiProperty({ example: 'https://...', description: 'Display picture URL', required: false })
  @IsOptional()
  @IsString()
  display_picture?: string;

  @ApiProperty({ example: 'active', description: 'Status', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: ['subject-id-1', 'subject-id-2'], description: 'Array of subject IDs', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectsTeaching?: string[];

  @ApiProperty({ example: ['class-id-1', 'class-id-2'], description: 'Array of class IDs', required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classesManaging?: string[];

  @ApiProperty({ example: 'password123', description: 'Password (optional, will be generated if not provided)', required: false })
  @IsOptional()
  @IsString()
  password?: string;
} 