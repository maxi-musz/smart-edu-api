import { ApiProperty } from '@nestjs/swagger';

export class StudentAddressDto {
  @ApiProperty({ example: '123 Main Street', description: 'Street address' })
  street: string;

  @ApiProperty({ example: 'New York', description: 'City' })
  city: string;

  @ApiProperty({ example: 'NY', description: 'State' })
  state: string;

  @ApiProperty({ example: 'USA', description: 'Country' })
  country: string;

  @ApiProperty({ example: '10001', description: 'Postal code' })
  postal_code: string;
}

export class StudentInfoDto {
  @ApiProperty({ example: 'student_123', description: 'Student ID' })
  id: string;

  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  name: string;

  @ApiProperty({ example: 'john.doe@school.edu', description: 'Email address' })
  email: string;

  @ApiProperty({ example: '+1234567890', description: 'Phone number' })
  phone: string;

  @ApiProperty({ example: '2005-03-15', description: 'Date of birth' })
  date_of_birth: string;

  @ApiProperty({ example: 'https://example.com/profile.jpg', description: 'Display picture URL' })
  display_picture: string;

  @ApiProperty({ example: 'STU001', description: 'Student ID number' })
  student_id: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Emergency contact name' })
  emergency_contact_name: string;

  @ApiProperty({ example: '+1234567891', description: 'Emergency contact phone' })
  emergency_contact_phone: string;

  @ApiProperty({ type: StudentAddressDto, description: 'Student address' })
  address: StudentAddressDto;
}

export class StudentClassDto {
  @ApiProperty({ example: 'class_456', description: 'Class ID' })
  id: string;

  @ApiProperty({ example: 'Grade 10A', description: 'Class name' })
  name: string;

  @ApiProperty({ example: '10', description: 'Class level' })
  level: string;

  @ApiProperty({ example: 'A', description: 'Class section' })
  section: string;
}

export class CurrentSessionDto {
  @ApiProperty({ example: 'session_789', description: 'Session ID' })
  id: string;

  @ApiProperty({ example: '2024-2025', description: 'Academic year' })
  academic_year: string;

  @ApiProperty({ example: 'first', description: 'Current term', enum: ['first', 'second', 'third'] })
  term: string;

  @ApiProperty({ example: '2024-09-01', description: 'Session start date' })
  start_date: string;

  @ApiProperty({ example: '2024-12-15', description: 'Session end date' })
  end_date: string;
}

export class GeneralInfoDto {
  @ApiProperty({ type: StudentInfoDto, description: 'Student information' })
  student: StudentInfoDto;

  @ApiProperty({ type: StudentClassDto, description: 'Student class information' })
  student_class: StudentClassDto;

  @ApiProperty({ type: CurrentSessionDto, description: 'Current academic session' })
  current_session: CurrentSessionDto;
}

export class SubjectEnrolledDto {
  @ApiProperty({ example: 'subj_001', description: 'Subject ID' })
  id: string;

  @ApiProperty({ example: 'Mathematics', description: 'Subject name' })
  name: string;

  @ApiProperty({ example: 'MATH101', description: 'Subject code' })
  code: string;

  @ApiProperty({ example: 'Dr. Smith', description: 'Teacher name' })
  teacher_name: string;

  @ApiProperty({ example: 'active', description: 'Subject status', enum: ['active', 'inactive', 'completed'] })
  status: string;

  @ApiProperty({ example: 4, description: 'Subject credits' })
  credits: number;
}

export class PerformanceSummaryDto {
  @ApiProperty({ example: 85.5, description: 'Average score' })
  average_score: number;

  @ApiProperty({ example: 12, description: 'Total assessments taken' })
  total_assessments: number;

  @ApiProperty({ example: 10, description: 'Passed assessments' })
  passed_assessments: number;

  @ApiProperty({ example: 2, description: 'Failed assessments' })
  failed_assessments: number;

  @ApiProperty({ example: 3, description: 'Current rank in class' })
  current_rank: number;

  @ApiProperty({ example: 25, description: 'Total students in class' })
  total_students: number;

  @ApiProperty({ example: 3.7, description: 'Grade point average' })
  grade_point_average: number;

  @ApiProperty({ example: 92.5, description: 'Attendance percentage' })
  attendance_percentage: number;
}

export class RecentAchievementDto {
  @ApiProperty({ example: 'ach_001', description: 'Achievement ID' })
  id: string;

  @ApiProperty({ example: 'Top Performer in Mathematics', description: 'Achievement title' })
  title: string;

  @ApiProperty({ example: 'Achieved highest score in mid-term mathematics exam', description: 'Achievement description' })
  description: string;

  @ApiProperty({ example: '2024-10-15', description: 'Date earned' })
  date_earned: string;

  @ApiProperty({ example: 'academic', description: 'Achievement type', enum: ['academic', 'attendance', 'sports', 'other'] })
  type: string;
}

export class AcademicInfoDto {
  @ApiProperty({ type: [SubjectEnrolledDto], description: 'Subjects enrolled' })
  subjects_enrolled: SubjectEnrolledDto[];

  @ApiProperty({ type: PerformanceSummaryDto, description: 'Performance summary' })
  performance_summary: PerformanceSummaryDto;

  @ApiProperty({ type: [RecentAchievementDto], description: 'Recent achievements' })
  recent_achievements: RecentAchievementDto[];
}

export class NotificationSettingsDto {
  @ApiProperty({ example: true, description: 'Push notifications enabled' })
  push_notifications: boolean;

  @ApiProperty({ example: true, description: 'Email notifications enabled' })
  email_notifications: boolean;

  @ApiProperty({ example: true, description: 'Assessment reminders enabled' })
  assessment_reminders: boolean;

  @ApiProperty({ example: true, description: 'Grade notifications enabled' })
  grade_notifications: boolean;

  @ApiProperty({ example: false, description: 'Announcement notifications enabled' })
  announcement_notifications: boolean;
}

export class AppPreferencesDto {
  @ApiProperty({ example: false, description: 'Dark mode enabled' })
  dark_mode: boolean;

  @ApiProperty({ example: true, description: 'Sound effects enabled' })
  sound_effects: boolean;

  @ApiProperty({ example: true, description: 'Haptic feedback enabled' })
  haptic_feedback: boolean;

  @ApiProperty({ example: true, description: 'Auto save enabled' })
  auto_save: boolean;

  @ApiProperty({ example: false, description: 'Offline mode enabled' })
  offline_mode: boolean;
}

export class PrivacySettingsDto {
  @ApiProperty({ example: 'classmates', description: 'Profile visibility', enum: ['public', 'classmates', 'private'] })
  profile_visibility: string;

  @ApiProperty({ example: true, description: 'Show contact info' })
  show_contact_info: boolean;

  @ApiProperty({ example: true, description: 'Show academic progress' })
  show_academic_progress: boolean;

  @ApiProperty({ example: false, description: 'Data sharing enabled' })
  data_sharing: boolean;
}

export class SettingsDto {
  @ApiProperty({ type: NotificationSettingsDto, description: 'Notification settings' })
  notifications: NotificationSettingsDto;

  @ApiProperty({ type: AppPreferencesDto, description: 'App preferences' })
  app_preferences: AppPreferencesDto;

  @ApiProperty({ type: PrivacySettingsDto, description: 'Privacy settings' })
  privacy: PrivacySettingsDto;
}

export class HelpCenterDto {
  @ApiProperty({ example: 25, description: 'FAQ count' })
  faq_count: number;

  @ApiProperty({ example: '2024-10-01', description: 'Last updated date' })
  last_updated: string;

  @ApiProperty({ example: ['General', 'Academic', 'Technical', 'Account'], description: 'FAQ categories' })
  categories: string[];
}

export class ContactOptionsDto {
  @ApiProperty({ example: 'support@school.edu', description: 'Email support' })
  email_support: string;

  @ApiProperty({ example: '+1-800-SCHOOL', description: 'Phone support' })
  phone_support: string;

  @ApiProperty({ example: true, description: 'Live chat available' })
  live_chat_available: boolean;

  @ApiProperty({ example: '24 hours', description: 'Response time' })
  response_time: string;
}

export class AppInfoDto {
  @ApiProperty({ example: '1.0.0', description: 'App version' })
  version: string;

  @ApiProperty({ example: '100', description: 'Build number' })
  build_number: string;

  @ApiProperty({ example: '2024-10-01', description: 'Last updated date' })
  last_updated: string;

  @ApiProperty({ example: '13.0', description: 'Minimum iOS version' })
  minimum_ios_version: string;

  @ApiProperty({ example: '8.0', description: 'Minimum Android version' })
  minimum_android_version: string;
}

export class SupportInfoDto {
  @ApiProperty({ type: HelpCenterDto, description: 'Help center information' })
  help_center: HelpCenterDto;

  @ApiProperty({ type: ContactOptionsDto, description: 'Contact options' })
  contact_options: ContactOptionsDto;

  @ApiProperty({ type: AppInfoDto, description: 'App information' })
  app_info: AppInfoDto;
}

export class MobileStudentProfileDto {
  @ApiProperty({ type: GeneralInfoDto, description: 'General information' })
  general_info: GeneralInfoDto;

  @ApiProperty({ type: AcademicInfoDto, description: 'Academic information' })
  academic_info: AcademicInfoDto;

  @ApiProperty({ type: SettingsDto, description: 'User settings' })
  settings: SettingsDto;

  @ApiProperty({ type: SupportInfoDto, description: 'Support information' })
  support_info: SupportInfoDto;
}

export class MobileStudentProfileResponseDto {
  @ApiProperty({ example: true, description: 'Success status' })
  success: boolean;

  @ApiProperty({ example: 'Profile retrieved successfully', description: 'Response message' })
  message: string;

  @ApiProperty({ type: MobileStudentProfileDto, description: 'Student profile data' })
  data: MobileStudentProfileDto;
}
