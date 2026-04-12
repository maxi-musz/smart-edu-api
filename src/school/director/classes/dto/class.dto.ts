import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
  @ApiProperty({
    description: 'Name of the class',
    example: 'JSS 1A',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'ID of the class teacher (optional)',
    example: 'teacher-uuid',
    required: false,
  })
  @IsString()
  @IsOptional()
  classTeacherId?: string;
}

export class EditClassDto {
  @ApiProperty({
    description: 'Name of the class',
    example: 'JSS 1A',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'ID of the class teacher (optional)',
    example: 'teacher-uuid',
    required: false,
  })
  @IsString()
  @IsOptional()
  classTeacherId?: string;
}

export class ReorderClassesDto {
  @ApiProperty({
    description:
      'Ordered list of class IDs for the current academic session (index 0 = first in ladder)',
    example: ['cl_1', 'cl_2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  class_ids: string[];
}
