import { IsString, IsNotEmpty, IsOptional, IsHexColor, IsArray } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
    @ApiProperty({
        description: 'Name of the subject',
        example: 'Mathematics'
    })
    @IsString()
    @IsNotEmpty()
    subject_name: string;

    @ApiProperty({
        description: 'Subject code (optional)',
        example: 'MATH101',
        required: false
    })
    @IsString()
    @IsOptional()
    code?: string;

    @ApiProperty({
        description: 'Class that takes this subject (optional)',
        example: 'JSS 1A',
        required: false
    })
    @IsString()
    @IsOptional()
    class_taking_it?: string;

    @ApiProperty({
        description: 'Teacher assigned to this subject (optional)',
        example: 'teacher-uuid',
        required: false
    })
    @IsString()
    @IsOptional()
    teacher_taking_it?: string;

    @ApiProperty({
        description: 'Color code for the subject (hex format)',
        example: '#FF5733',
        required: false
    })
    @IsString()
    @IsHexColor()
    @IsOptional()
    color?: string;

    @ApiProperty({
        description: 'Description of the subject (optional)',
        example: 'Advanced mathematics for junior secondary students',
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;
}

export class EditSubjectDto {
    @ApiProperty({
        description: 'Name of the subject (optional for PATCH)',
        example: 'Mathematics',
        required: false
    })
    @IsString()
    @IsOptional()
    subject_name?: string;

    @ApiProperty({
        description: 'Subject code (optional)',
        example: 'MATH101',
        required: false
    })
    @IsString()
    @IsOptional()
    code?: string;

    @ApiProperty({
        description: 'Class that takes this subject (optional)',
        example: 'class-uuid',
        required: false
    })
    @IsString()
    @IsOptional()
    class_taking_it?: string;

    @ApiProperty({
        description: 'Teachers assigned to this subject (array of teacher IDs)',
        example: ['teacher-uuid-1', 'teacher-uuid-2'],
        required: false,
        type: [String]
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    teachers_taking_it?: string[];

    @ApiProperty({
        description: 'Color code for the subject (hex format)',
        example: '#FF5733',
        required: false
    })
    @IsString()
    @IsHexColor()
    @IsOptional()
    color?: string;

    @ApiProperty({
        description: 'Description of the subject (optional)',
        example: 'Advanced mathematics for junior secondary students',
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;
}