import { IsNotEmpty, IsString, IsArray, IsEmail, IsEnum, IsOptional, IsDateString } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';
import { AcademicTerm } from '@prisma/client';

export class OnboardSchoolDto {
    @ApiProperty({
        description: 'Name of the school',
        example: 'St. Mary\'s Secondary School'
    })
    @IsNotEmpty()
    @IsString()
    school_name: string;

    @ApiProperty({
        description: 'Email address of the school',
        example: 'info@stmarys.edu.ng'
    })
    @IsNotEmpty()
    @IsString()
    school_email: string;

    @ApiProperty({
        description: 'Physical address of the school',
        example: '123 Education Street, Lagos, Nigeria'
    })
    @IsNotEmpty()
    @IsString()
    school_address: string;

    @ApiProperty({
        description: 'Phone number of the school',
        example: '+2348012345678'
    })
    @IsNotEmpty()
    @IsString()
    school_phone: string;

    @ApiProperty({
        description: 'Type of school',
        enum: ['primary', 'secondary', 'primary_and_secondary', 'other'],
        example: 'secondary'
    })
    @IsNotEmpty()
    @IsString()
    school_type: SchoolType;

    @ApiProperty({
        description: 'Ownership type of the school',
        enum: ['government', 'private', 'other'],
        example: 'private'
    })
    @IsNotEmpty()
    @IsString()
    school_ownership: SchoolOwnership;

    @ApiProperty({
        description: 'Current academic year (e.g., "2024/2025", "2024-2025")',
        example: '2024/2025'
    })
    @IsNotEmpty()
    @IsString()
    academic_year: string;

    @ApiProperty({
        description: 'Current academic term',
        enum: ['first', 'second', 'third'],
        example: 'first'
    })
    @IsNotEmpty()
    @IsEnum(AcademicTerm)
    current_term: AcademicTerm;

    @ApiProperty({
        description: 'Start date of the current term',
        example: '2024-09-01'
    })
    @IsNotEmpty()
    @IsDateString()
    term_start_date: string;

    @ApiProperty({
        description: 'End date of the current term (optional - can be updated later)',
        example: '2024-12-20',
        required: false
    })
    @IsOptional()
    @IsDateString()
    term_end_date?: string;
}

enum SchoolType {
    primary = "primary",
    secondary = "secondary",
    primary_and_secondary = "primary_and_secondary",
    other = "other"
}
enum SchoolOwnership {
    GOVERNMENT_OWNED = "government",
    PRIVATE = "private",
    OTHER = "other"
}

export class SignInDto {
    @ApiProperty({
        description: 'Email address for authentication',
        example: 'director@school.edu.ng'
    })
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty({
        description: 'Password for authentication',
        example: 'password123'
    })
    @IsNotEmpty()
    @IsString()
    password: string;
}

export class RequestPasswordResetDTO {
    @ApiProperty({
        description: 'Email address to send password reset OTP',
        example: 'user@school.edu.ng'
    })
    @IsNotEmpty()
    @IsString()
    email: string
}

export class RequestLoginOtpDTO {
    @ApiProperty({
        description: 'Email address to send login OTP',
        example: 'director@school.edu.ng'
    })
    @IsNotEmpty()
    @IsString()
    email: string
}

export class VerifyEmailOTPDto {
    @ApiProperty({
        description: 'Email address associated with the OTP',
        example: 'director@school.edu.ng'
    })
    @IsString()
    @IsNotEmpty()
    email: string

    @ApiProperty({
        description: 'One-time password for email verification',
        example: '123456'
    })
    @IsNotEmpty()
    @IsString()
    otp: string
}

export class VerifyresetOtp {
    @ApiProperty({
        description: 'One-time password for password reset verification',
        example: '123456'
    })
    @IsString()
    @IsNotEmpty()
    otp: string

    @ApiProperty({
        description: 'Email address associated with the reset OTP',
        example: 'user@school.edu.ng'
    })
    @IsString()
    @IsNotEmpty()
    email: string
}

export class ResetPasswordDTO {
    @ApiProperty({
        description: 'New password for the account',
        example: 'newPassword123'
    })
    @IsString()
    @IsNotEmpty()
    new_password: string
    
    @ApiProperty({
        description: 'Confirmation of the new password',
        example: 'newPassword123'
    })
    @IsString()
    @IsNotEmpty()
    confirm_password: string

    @ApiProperty({
        description: 'Email address for password reset',
        example: 'user@school.edu.ng'
    })
    @IsString()
    @IsNotEmpty()
    email: string
}

export class OnboardClassesDto {
    @ApiProperty({
        description: 'Array of class names to create',
        example: ['JSS 1A', 'JSS 1B', 'SSS 1A'],
        type: [String]
    })
    @IsNotEmpty({ message: 'Class names array cannot be empty' })
    @IsArray({ message: 'Class names must be an array' })
    @IsString({ each: true, message: 'Each class name must be a string' })
    class_names: string[];
}

export class TeacherDto {
    @ApiProperty({
        description: 'First name of the teacher',
        example: 'John'
    })
    @IsNotEmpty({ message: 'First name is required' })
    @IsString({ message: 'First name must be a string' })
    first_name: string;

    @ApiProperty({
        description: 'Last name of the teacher',
        example: 'Doe'
    })
    @IsNotEmpty({ message: 'Last name is required' })
    @IsString({ message: 'Last name must be a string' })
    last_name: string;

    @ApiProperty({
        description: 'Email address of the teacher',
        example: 'john.doe@school.edu.ng'
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email must be a string' })
    email: string;

    @ApiProperty({
        description: 'Phone number of the teacher',
        example: '+2348012345678'
    })
    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString({ message: 'Phone number must be a string' })
    phone_number: string;
}

export class OnboardTeachersDto {
    @ApiProperty({
        description: 'Array of teacher data to create',
        type: [TeacherDto]
    })
    @IsNotEmpty({ message: 'Teachers array cannot be empty' })
    @IsArray({ message: 'Teachers must be an array' })
    teachers: TeacherDto[];
}

export class StudentDto {
    @ApiProperty({
        description: 'First name of the student',
        example: 'Jane'
    })
    @IsNotEmpty({ message: 'First name is required' })
    @IsString({ message: 'First name must be a string' })
    first_name: string;

    @ApiProperty({
        description: 'Last name of the student',
        example: 'Smith'
    })
    @IsNotEmpty({ message: 'Last name is required' })
    @IsString({ message: 'Last name must be a string' })
    last_name: string;

    @ApiProperty({
        description: 'Email address of the student',
        example: 'jane.smith@school.edu.ng'
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email must be a string' })
    email: string;

    @ApiProperty({
        description: 'Phone number of the student',
        example: '+2348012345678'
    })
    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString({ message: 'Phone number must be a string' })
    phone_number: string;

    @ApiProperty({
        description: 'Default class for the student',
        example: 'JSS 1A'
    })
    @IsNotEmpty({ message: 'Default class is required' })
    @IsString({ message: 'Default class must be a string' })
    default_class: string;
}

export class OnboardStudentsDto {
    @ApiProperty({
        description: 'Array of student data to create',
        type: [StudentDto]
    })
    @IsNotEmpty({ message: 'Students array cannot be empty' })
    @IsArray({ message: 'Students must be an array' })
    students: StudentDto[];
}

export class DirectorDto {
    @ApiProperty({
        description: 'First name of the director',
        example: 'Michael'
    })
    @IsNotEmpty({ message: 'First name is required' })
    @IsString({ message: 'First name must be a string' })
    first_name: string;

    @ApiProperty({
        description: 'Last name of the director',
        example: 'Johnson'
    })
    @IsNotEmpty({ message: 'Last name is required' })
    @IsString({ message: 'Last name must be a string' })
    last_name: string;

    @ApiProperty({
        description: 'Email address of the director',
        example: 'michael.johnson@school.edu.ng'
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email must be a string' })
    email: string;

    @ApiProperty({
        description: 'Phone number of the director',
        example: '+2348012345678'
    })
    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString({ message: 'Phone number must be a string' })
    phone_number: string;
}

export class OnboardDirectorsDto {
    @ApiProperty({
        description: 'Array of director data to create',
        type: [DirectorDto]
    })
    @IsNotEmpty({ message: 'Directors array cannot be empty' })
    @IsArray({ message: 'Directors must be an array' })
    directors: DirectorDto[];
}

export class OnboardDataDto {
    @ApiProperty({
        description: 'Array of class names to create',
        example: ['JSS 1A', 'JSS 1B'],
        type: [String],
        required: false
    })
    @IsArray({ message: 'Class names must be an array' })
    @IsString({ each: true, message: 'Each class name must be a string' })
    class_names?: string[];

    @ApiProperty({
        description: 'Array of teacher data to create',
        type: [TeacherDto],
        required: false
    })
    @IsArray({ message: 'Teachers must be an array' })
    teachers?: TeacherDto[];

    @ApiProperty({
        description: 'Array of student data to create',
        type: [StudentDto],
        required: false
    })
    @IsArray({ message: 'Students must be an array' })
    students?: StudentDto[];

    @ApiProperty({
        description: 'Array of director data to create',
        type: [DirectorDto],
        required: false
    })
    @IsArray({ message: 'Directors must be an array' })
    directors?: DirectorDto[];
}

export class RefreshTokenDto {
    @ApiProperty({
        description: 'Refresh token to get new access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    @IsNotEmpty({ message: 'Refresh token is required' })
    @IsString({ message: 'Refresh token must be a string' })
    refresh_token: string;
}

export class RequestEmailVerificationDto {
    @ApiProperty({
        description: 'Email address to send verification code to',
        example: 'user@example.com'
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;
}

export class AddStudentToClassDto {
    @ApiProperty({
        description: 'Student ID to add to the class',
        example: 'student-uuid-here'
    })
    @IsNotEmpty()
    @IsString()
    student_id: string;

    @ApiProperty({
        description: 'Class ID to add the student to',
        example: 'class-uuid-here'
    })
    @IsNotEmpty()
    @IsString()
    class_id: string;
}

export class EnrollNewStudentDto {
    @ApiProperty({
        description: 'First name of the student',
        example: 'Jane'
    })
    @IsNotEmpty({ message: 'First name is required' })
    @IsString({ message: 'First name must be a string' })
    first_name: string;

    @ApiProperty({
        description: 'Last name of the student',
        example: 'Smith'
    })
    @IsNotEmpty({ message: 'Last name is required' })
    @IsString({ message: 'Last name must be a string' })
    last_name: string;

    @ApiProperty({
        description: 'Email address of the student',
        example: 'jane.smith@school.edu.ng'
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        description: 'Phone number of the student',
        example: '+2348012345678'
    })
    @IsNotEmpty({ message: 'Phone number is required' })
    @IsString({ message: 'Phone number must be a string' })
    phone_number: string;

    @ApiProperty({
        description: 'Display picture URL (optional)',
        example: 'https://example.com/photo.jpg',
        required: false
    })
    display_picture?: any;

    @ApiProperty({
        description: 'Gender of the student',
        enum: ['male', 'female', 'other'],
        example: 'female'
    })
    @IsNotEmpty({ message: 'Gender is required' })
    @IsString({ message: 'Gender must be a string' })
    gender: 'male' | 'female' | 'other';

    @ApiProperty({
        description: 'Date of birth of the student',
        example: '2008-05-15',
        required: false
    })
    date_of_birth?: string;

    @ApiProperty({
        description: 'Admission number (optional)',
        example: 'STD/2024/001',
        required: false
    })
    admission_number?: string;

    @ApiProperty({
        description: 'Guardian name (optional)',
        example: 'John Smith',
        required: false
    })
    guardian_name?: string;

    @ApiProperty({
        description: 'Guardian phone number (optional)',
        example: '+2348012345678',
        required: false
    })
    guardian_phone?: string;

    @ApiProperty({
        description: 'Guardian email (optional)',
        example: 'guardian@example.com',
        required: false
    })
    guardian_email?: string;

    @ApiProperty({
        description: 'Address of the student (optional)',
        example: '123 Student Street, Lagos',
        required: false
    })
    address?: string;

    @ApiProperty({
        description: 'Emergency contact (optional)',
        example: '+2348012345678',
        required: false
    })
    emergency_contact?: string;

    @ApiProperty({
        description: 'Blood group (optional)',
        example: 'O+',
        required: false
    })
    blood_group?: string;

    @ApiProperty({
        description: 'Medical conditions (optional)',
        example: 'None',
        required: false
    })
    medical_conditions?: string;

    @ApiProperty({
        description: 'Allergies (optional)',
        example: 'None',
        required: false
    })
    allergies?: string;

    @ApiProperty({
        description: 'Previous school attended (optional)',
        example: 'Previous School Name',
        required: false
    })
    previous_school?: string;

    @ApiProperty({
        description: 'Academic level (optional)',
        example: 'JSS 2',
        required: false
    })
    academic_level?: string;

    @ApiProperty({
        description: 'Parent ID (optional)',
        example: 'parent-uuid-here',
        required: false
    })
    parent_id?: string;

    @ApiProperty({
        description: 'Class ID to enroll the student in',
        example: 'class-uuid-here'
    })
    @IsNotEmpty({ message: 'Class ID is required' })
    @IsString({ message: 'Class ID must be a string' })
    class_id: string;

    @ApiProperty({
        description: 'Password for the student account (optional - will be auto-generated if not provided)',
        example: 'password123',
        required: false
    })
    password?: string;
}

export class VerifyOTPAndResetPasswordDto {
    @ApiProperty({
        description: 'Email address of the user',
        example: 'user@school.edu.ng'
    })
    @IsNotEmpty({ message: 'Email is required' })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email: string;

    @ApiProperty({
        description: 'OTP code sent to email',
        example: '123456'
    })
    @IsNotEmpty({ message: 'OTP is required' })
    @IsString({ message: 'OTP must be a string' })
    otp: string;

    @ApiProperty({
        description: 'New password',
        example: 'newPassword123'
    })
    @IsNotEmpty({ message: 'New password is required' })
    @IsString({ message: 'New password must be a string' })
    new_password: string;
}

export class UpdateStudentDto {
    @ApiProperty({
        description: 'First name of the student',
        example: 'Jane',
        required: false
    })
    @IsString({ message: 'First name must be a string' })
    first_name?: string;

    @ApiProperty({
        description: 'Last name of the student',
        example: 'Smith',
        required: false
    })
    @IsString({ message: 'Last name must be a string' })
    last_name?: string;

    @ApiProperty({
        description: 'Email address of the student',
        example: 'jane.smith@school.edu.ng',
        required: false
    })
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email?: string;

    @ApiProperty({
        description: 'Phone number of the student',
        example: '+2348012345678',
        required: false
    })
    @IsString({ message: 'Phone number must be a string' })
    phone_number?: string;

    @ApiProperty({
        description: 'Display picture URL (optional)',
        example: 'https://example.com/photo.jpg',
        required: false
    })
    display_picture?: any;

    @ApiProperty({
        description: 'Gender of the student',
        enum: ['male', 'female', 'other'],
        example: 'female',
        required: false
    })
    @IsString({ message: 'Gender must be a string' })
    gender?: 'male' | 'female' | 'other';

    @ApiProperty({
        description: 'Date of birth of the student',
        example: '2008-05-15',
        required: false
    })
    date_of_birth?: string;

    @ApiProperty({
        description: 'Admission number (optional)',
        example: 'STD/2024/001',
        required: false
    })
    admission_number?: string;

    @ApiProperty({
        description: 'Guardian name (optional)',
        example: 'John Smith',
        required: false
    })
    guardian_name?: string;

    @ApiProperty({
        description: 'Guardian phone number (optional)',
        example: '+2348012345678',
        required: false
    })
    guardian_phone?: string;

    @ApiProperty({
        description: 'Guardian email (optional)',
        example: 'guardian@example.com',
        required: false
    })
    guardian_email?: string;

    @ApiProperty({
        description: 'Address of the student (optional)',
        example: '123 Student Street, Lagos',
        required: false
    })
    address?: string;

    @ApiProperty({
        description: 'Emergency contact (optional)',
        example: '+2348012345678',
        required: false
    })
    emergency_contact?: string;

    @ApiProperty({
        description: 'Blood group (optional)',
        example: 'O+',
        required: false
    })
    blood_group?: string;

    @ApiProperty({
        description: 'Medical conditions (optional)',
        example: 'None',
        required: false
    })
    medical_conditions?: string;

    @ApiProperty({
        description: 'Allergies (optional)',
        example: 'None',
        required: false
    })
    allergies?: string;

    @ApiProperty({
        description: 'Previous school attended (optional)',
        example: 'Previous School Name',
        required: false
    })
    previous_school?: string;

    @ApiProperty({
        description: 'Academic level (optional)',
        example: 'JSS 2',
        required: false
    })
    academic_level?: string;

    @ApiProperty({
        description: 'Parent ID (optional)',
        example: 'parent-uuid-here',
        required: false
    })
    parent_id?: string;

    @ApiProperty({
        description: 'Class ID to transfer the student to (optional)',
        example: 'class-uuid-here',
        required: false
    })
    @IsString({ message: 'Class ID must be a string' })
    class_id?: string;

    @ApiProperty({
        description: 'Student status',
        enum: ['active', 'suspended', 'inactive'],
        example: 'active',
        required: false
    })
    status?: 'active' | 'suspended' | 'inactive';
}