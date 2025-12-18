import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLibraryClassDevDto {

  @ApiProperty({
    description: 'Canonical name of the library class (e.g. "JSS 1", "SS 2 Science")',
    example: 'JSS 1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}


