import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDeveloperDto {
  @ApiProperty({
    description: 'Developer display name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Developer email (used for login / identification)',
    example: 'dev@smarteduhub.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Plaintext password for the developer (will be hashed later)',
    example: 'StrongPassword123!',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Optional note or role description for this developer',
    example: 'Platform super admin',
  })
  @IsOptional()
  @IsString()
  note?: string;
}


