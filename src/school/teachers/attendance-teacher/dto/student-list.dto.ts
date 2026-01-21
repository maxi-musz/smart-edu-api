import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination.dto';

export class StudentInfoDto {
  @ApiProperty({ example: 'student_1', description: 'Student ID' })
  id: string;

  @ApiProperty({ example: 'user-uuid-1', description: 'User ID', required: false })
  user_id?: string;

  @ApiProperty({ example: 'John Doe', description: 'Student full name' })
  name: string;

  @ApiProperty({ example: 'John', description: 'Student first name' })
  first_name: string;

  @ApiProperty({ example: 'Doe', description: 'Student last name' })
  last_name: string;

  @ApiProperty({ 
    example: 'https://api.school.com/images/students/student_1.jpg', 
    description: 'Student display picture URL',
    nullable: true
  })
  display_picture: string | null;

  @ApiProperty({ example: 'john.doe@school.com', description: 'Student email' })
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Student phone number' })
  phone_number: string;

  @ApiProperty({ example: 'Male', description: 'Student gender' })
  gender: string;

  @ApiProperty({ example: 'STU001', description: 'Student ID number' })
  student_id: string;

  @ApiProperty({ example: 'STD/2024/001', description: 'Student admission number', nullable: true })
  admission_number: string | null;

  @ApiProperty({ example: '001', description: 'Student roll number' })
  roll_number: string;

  @ApiProperty({ example: 'active', description: 'Student status', required: false })
  status?: string;
}

export class ClassInfoForStudentsDto {
  @ApiProperty({ example: 'class_1', description: 'Class ID' })
  id: string;

  @ApiProperty({ example: 'Grade 10A', description: 'Class name' })
  name: string;

  @ApiProperty({ example: 'G10A', description: 'Class code' })
  code: string;

  @ApiProperty({ example: 'Class Teacher', description: 'Subject or role' })
  subject: string;

  @ApiProperty({ example: 'John Smith', description: 'Teacher name' })
  teacher_name: string;

  @ApiProperty({ example: 'Room 101', description: 'Room number' })
  room: string;
}

export class StudentsForClassDto {
  @ApiProperty({ type: ClassInfoForStudentsDto, description: 'Class information' })
  class_info: ClassInfoForStudentsDto;

  @ApiProperty({ type: [StudentInfoDto], description: 'List of students in the class' })
  students: StudentInfoDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Pagination metadata' })
  pagination: PaginationMetaDto;
}

export class StudentsForClassResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Students retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: StudentsForClassDto, description: 'Students data' })
  data: StudentsForClassDto;
}
