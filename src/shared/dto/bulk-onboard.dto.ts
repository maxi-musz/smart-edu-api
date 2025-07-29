import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkOnboardRowDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John'
  })
  @IsString()
  @IsNotEmpty()
  'First Name': string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe'
  })
  @IsString()
  @IsNotEmpty()
  'Last Name': string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@school.com'
  })
  @IsString()
  @IsNotEmpty()
  'Email': string;

  @ApiProperty({
    description: 'Phone number of the user',
    example: '08012345678'
  })
  @IsString()
  @IsNotEmpty()
  'Phone': string;

  @ApiProperty({
    description: 'Class assignment (only for students)',
    example: 'pry-1',
    enum: ['pry-1', 'pry-2', 'pry-3', 'pry-4', 'pry-5', 'pry-6', 'kg-1', 'kg-2', 'nur-1', 'nur-2', 'jss1', 'jss2', 'jss3', 'ss1', 'ss2', 'ss3']
  })
  @IsString()
  @IsNotEmpty()
  'Class': string;

  @ApiProperty({
    description: 'Role of the user',
    example: 'student',
    enum: ['student', 'teacher', 'school_director']
  })
  @IsString()
  @IsNotEmpty()
  'Role': string;
}

export class BulkOnboardDto {
  @ApiProperty({
    description: 'Array of user data from Excel sheet',
    type: [BulkOnboardRowDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkOnboardRowDto)
  data: BulkOnboardRowDto[];
}

export class BulkOnboardResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Bulk onboarding completed successfully'
  })
  message: string;

  @ApiProperty({
    description: 'Summary of the operation',
    example: {
      total: 50,
      successful: 48,
      failed: 2,
      errors: [
        {
          row: 3,
          email: 'invalid@email.com',
          error: 'Invalid email format'
        }
      ]
    }
  })
  data: {
    total: number;
    successful: number;
    failed: number;
    errors: Array<{
      row: number;
      email: string;
      error: string;
    }>;
    createdUsers: {
      teachers: any[];
      students: any[];
      directors: any[];
    };
  };
} 