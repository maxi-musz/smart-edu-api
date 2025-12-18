import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDeveloperDto {
  @ApiProperty({
    description: 'Developer email',
    example: 'dev@smarteduhub.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Developer password',
    example: 'StrongPassword123!',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password: string;
}


