import { ApiProperty } from '@nestjs/swagger';

export class StudentClassDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Class ID' })
  id: string;

  @ApiProperty({ example: 'Class 10A', description: 'Class name' })
  name: string;

  @ApiProperty({ example: 10, description: 'Class level' })
  classId: number;

  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra1', description: 'Class teacher ID' })
  classTeacherId: string;

  @ApiProperty({ example: 'John Doe', description: 'Class teacher name' })
  classTeacherName?: string;
}

export class StudentParentDto {
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'Parent ID' })
  id: string;

  @ApiProperty({ example: 'Jane Smith', description: 'Parent name' })
  name: string;

  @ApiProperty({ example: 'jane.smith@email.com', description: 'Parent email' })
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Parent phone' })
  phone: string;

  @ApiProperty({ example: 'Mother', description: 'Relationship to student' })
  relationship?: string;

  @ApiProperty({ example: 'Engineer', description: 'Parent occupation' })
  occupation?: string;

  @ApiProperty({ example: 'Tech Corp', description: 'Parent employer' })
  employer?: string;

  @ApiProperty({ example: true, description: 'Is primary contact' })
  isPrimaryContact: boolean;
}

export class StudentAcademicInfoDto {
  @ApiProperty({ example: 'STU001', description: 'Student ID' })
  studentId: string;

  @ApiProperty({ example: 'ADM2024001', description: 'Admission number' })
  admissionNumber?: string;

  @ApiProperty({ example: '2024-09-01T00:00:00Z', description: 'Admission date' })
  admissionDate: string;

  @ApiProperty({ example: '2010-05-15T00:00:00Z', description: 'Date of birth' })
  dateOfBirth?: string;

  @ApiProperty({ example: 'Grade 10', description: 'Academic level' })
  academicLevel?: string;

  @ApiProperty({ example: 'ABC High School', description: 'Previous school' })
  previousSchool?: string;

  @ApiProperty({ type: StudentClassDto, description: 'Current class information' })
  currentClass: StudentClassDto;

  @ApiProperty({ example: '2024-2025', description: 'Current academic year' })
  academicYear: string;

  @ApiProperty({ example: 'first', description: 'Current term', enum: ['first', 'second', 'third'] })
  currentTerm: string;
}

export class StudentPersonalInfoDto {
  @ApiProperty({ example: '123 Main Street', description: 'Student address' })
  address?: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  city?: string;

  @ApiProperty({ example: 'NY', description: 'State' })
  state?: string;

  @ApiProperty({ example: '10001', description: 'Postal code' })
  postalCode?: string;

  @ApiProperty({ example: 'USA', description: 'Country' })
  country?: string;

  @ApiProperty({ example: 'O+', description: 'Blood group' })
  bloodGroup?: string;

  @ApiProperty({ example: 'None', description: 'Medical conditions' })
  medicalConditions?: string;

  @ApiProperty({ example: 'Peanuts', description: 'Allergies' })
  allergies?: string;

  @ApiProperty({ example: '+1234567890', description: 'Emergency contact' })
  emergencyContact?: string;
}

export class StudentGuardianInfoDto {
  @ApiProperty({ example: 'John Smith', description: 'Guardian name' })
  guardianName?: string;

  @ApiProperty({ example: '+1234567890', description: 'Guardian phone' })
  guardianPhone?: string;

  @ApiProperty({ example: 'john.smith@email.com', description: 'Guardian email' })
  guardianEmail?: string;

  @ApiProperty({ example: 'Father', description: 'Relationship to student' })
  relationship?: string;
}

export class StudentPerformanceDto {
  @ApiProperty({ example: 85.5, description: 'Average score this term' })
  averageScore?: number;

  @ApiProperty({ example: 5, description: 'Total assessments taken' })
  totalAssessments?: number;

  @ApiProperty({ example: 4, description: 'Passed assessments' })
  passedAssessments?: number;

  @ApiProperty({ example: 3, description: 'Current position in class' })
  classPosition?: number;

  @ApiProperty({ example: 25, description: 'Total students in class' })
  totalStudentsInClass?: number;
}

export class StudentProfileDto {
  // Basic user information
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'john.doe@email.com', description: 'Email address' })
  email: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  lastName: string;

  @ApiProperty({ example: '+1234567890', description: 'Phone number' })
  phoneNumber?: string;

  @ApiProperty({ example: 'male', description: 'Gender', enum: ['male', 'female', 'other'] })
  gender?: string;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Display picture URL' })
  displayPicture?: string;

  @ApiProperty({ example: 'active', description: 'User status', enum: ['active', 'inactive', 'suspended'] })
  status: string;

  @ApiProperty({ example: true, description: 'Email verified status' })
  isEmailVerified: boolean;

  @ApiProperty({ example: '2024-09-01T00:00:00Z', description: 'Account creation date' })
  createdAt: string;

  @ApiProperty({ example: '2024-09-15T00:00:00Z', description: 'Last update date' })
  updatedAt: string;

  // School information
  @ApiProperty({ example: 'cmft0keqn00avsbkyybjn0ra0', description: 'School ID' })
  schoolId: string;

  @ApiProperty({ example: 'ABC High School', description: 'School name' })
  schoolName: string;

  @ApiProperty({ example: 'school@abc.edu', description: 'School email' })
  schoolEmail: string;

  @ApiProperty({ example: '+1234567890', description: 'School phone' })
  schoolPhone: string;

  @ApiProperty({ example: '456 School Street', description: 'School address' })
  schoolAddress: string;

  // Student-specific information
  @ApiProperty({ type: StudentAcademicInfoDto, description: 'Academic information' })
  academicInfo: StudentAcademicInfoDto;

  @ApiProperty({ type: StudentPersonalInfoDto, description: 'Personal information' })
  personalInfo: StudentPersonalInfoDto;

  @ApiProperty({ type: StudentGuardianInfoDto, description: 'Guardian information' })
  guardianInfo: StudentGuardianInfoDto;

  @ApiProperty({ type: StudentParentDto, description: 'Parent information' })
  parentInfo?: StudentParentDto;

  @ApiProperty({ type: StudentPerformanceDto, description: 'Performance metrics' })
  performance: StudentPerformanceDto;
}

export class StudentProfileResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Student profile retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: StudentProfileDto, description: 'Student profile data' })
  data: StudentProfileDto;
}
