import { IsString, IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateClassDto {
    @ApiProperty({
        description: 'Name of the class',
        example: 'JSS 1A'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'ID of the class teacher (optional)',
        example: 'teacher-uuid',
        required: false
    })
    @IsString()
    @IsOptional()
    classTeacherId?: string;
}

export class EditClassDto {
    @ApiProperty({
        description: 'Name of the class',
        example: 'JSS 1A'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'ID of the class teacher (optional)',
        example: 'teacher-uuid',
        required: false
    })
    @IsString()
    @IsOptional()
    classTeacherId?: string;
}
