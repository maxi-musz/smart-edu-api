import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LibrarySignInDto {
  @ApiProperty({
    description: 'Email address of the library user',
    example: 'owner@access-study.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Password of the library user',
    example: 'StrongPassw0rd!',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}


