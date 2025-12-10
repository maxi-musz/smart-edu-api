import { ApiProperty } from '@nestjs/swagger';

export class TeacherProfileDto {
  @ApiProperty({ example: 'teacher-uuid' })
  id: string;

  @ApiProperty({ example: 'TCH001' })
  teacher_id: string;

  @ApiProperty({ example: 'EMP001', nullable: true })
  employee_number: string | null;

  @ApiProperty({ example: 'teacher@school.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  last_name: string;

  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ example: '+1234567890' })
  phone_number: string;

  @ApiProperty({ nullable: true })
  display_picture: any;

  @ApiProperty({ example: 'male' })
  gender: string;

  @ApiProperty({ example: 'teacher' })
  role: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'B.Sc. Mathematics', nullable: true })
  qualification: string | null;

  @ApiProperty({ example: 'Mathematics', nullable: true })
  specialization: string | null;

  @ApiProperty({ example: 5, nullable: true })
  years_of_experience: number | null;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM', nullable: true })
  hire_date: string | null;

  @ApiProperty({ example: 50000, nullable: true })
  salary: number | null;

  @ApiProperty({ example: 'Mathematics', nullable: true })
  department: string | null;

  @ApiProperty({ example: true })
  is_class_teacher: boolean;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM' })
  created_at: string;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM' })
  updated_at: string;
}

export class UserProfileDto {
  @ApiProperty({ example: 'user-uuid' })
  id: string;

  @ApiProperty({ example: 'teacher@school.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  first_name: string;

  @ApiProperty({ example: 'Doe' })
  last_name: string;

  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ example: '+1234567890' })
  phone_number: string;

  @ApiProperty({ nullable: true })
  display_picture: any;

  @ApiProperty({ example: 'male' })
  gender: string;

  @ApiProperty({ example: 'teacher' })
  role: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: true })
  is_email_verified: boolean;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM' })
  created_at: string;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM' })
  updated_at: string;
}

export class SchoolDto {
  @ApiProperty({ example: 'school-uuid' })
  id: string;

  @ApiProperty({ example: 'ABC School' })
  school_name: string;

  @ApiProperty({ example: 'info@abcschool.com' })
  school_email: string;

  @ApiProperty({ example: '+1234567890' })
  school_phone: string;

  @ApiProperty({ example: '123 Main St' })
  school_address: string;

  @ApiProperty({ example: 'primary_and_secondary' })
  school_type: string;

  @ApiProperty({ example: 'private' })
  school_ownership: string;

  @ApiProperty({ example: 'approved' })
  status: string;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM' })
  created_at: string;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM' })
  updated_at: string;
}

export class AcademicSessionDto {
  @ApiProperty({ example: 'session-uuid' })
  id: string;

  @ApiProperty({ example: '2024/2025' })
  academic_year: string;

  @ApiProperty({ example: 'first' })
  term: string;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM' })
  start_date: string;

  @ApiProperty({ example: 'Mar 31, 2024, 10:00 AM' })
  end_date: string;

  @ApiProperty({ example: 'active' })
  status: string;
}

export class SubjectTeachingDto {
  @ApiProperty({ example: 'subject-uuid' })
  id: string;

  @ApiProperty({ example: 'Mathematics' })
  name: string;

  @ApiProperty({ example: 'MATH101' })
  code: string;

  @ApiProperty({ example: '#FF5733' })
  color: string;

  @ApiProperty({ example: 'Introduction to Mathematics', nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  class: {
    id: string;
    name: string;
  } | null;
}

export class ClassManagingDto {
  @ApiProperty({ example: 'class-uuid' })
  id: string;

  @ApiProperty({ example: 'Class 10A' })
  name: string;

  @ApiProperty({ example: 30 })
  student_count: number;

  @ApiProperty({ example: 5 })
  subject_count: number;
}

export class UserSettingsDto {
  @ApiProperty({ example: true })
  push_notifications: boolean;

  @ApiProperty({ example: true })
  email_notifications: boolean;

  @ApiProperty({ example: true })
  assessment_reminders: boolean;

  @ApiProperty({ example: true })
  grade_notifications: boolean;

  @ApiProperty({ example: false })
  announcement_notifications: boolean;

  @ApiProperty({ example: false })
  dark_mode: boolean;

  @ApiProperty({ example: true })
  sound_effects: boolean;

  @ApiProperty({ example: true })
  haptic_feedback: boolean;

  @ApiProperty({ example: true })
  auto_save: boolean;

  @ApiProperty({ example: false })
  offline_mode: boolean;

  @ApiProperty({ example: 'classmates' })
  profile_visibility: string;

  @ApiProperty({ example: true })
  show_contact_info: boolean;

  @ApiProperty({ example: true })
  show_academic_progress: boolean;

  @ApiProperty({ example: false })
  data_sharing: boolean;
}

export class UsageStatsDto {
  @ApiProperty({ example: 15000 })
  tokens_used_this_day: number;

  @ApiProperty({ example: 50000 })
  tokens_used_this_week: number;

  @ApiProperty({ example: 200000 })
  tokens_used_all_time: number;

  @ApiProperty({ example: 50000 })
  max_tokens_per_day: number;

  @ApiProperty({ example: 50000 })
  max_tokens_per_week: number;

  @ApiProperty({ example: 25 })
  files_uploaded_this_month: number;

  @ApiProperty({ example: 150 })
  total_files_uploaded_all_time: number;

  @ApiProperty({ example: 1024 })
  total_storage_used_mb: number;

  @ApiProperty({ example: 500 })
  max_storage_mb: number;

  @ApiProperty({ example: 10 })
  max_files_per_month: number;

  @ApiProperty({ example: 100 })
  max_file_size_mb: number;

  @ApiProperty({ example: 50 })
  messages_sent_this_week: number;

  @ApiProperty({ example: 100 })
  max_messages_per_week: number;

  @ApiProperty({ example: 15 })
  videos_uploaded: number;

  @ApiProperty({ example: 30 })
  materials_uploaded: number;
}

export class StatsDto {
  @ApiProperty({ example: 150 })
  total_students: number;

  @ApiProperty({ example: 5 })
  total_subjects: number;

  @ApiProperty({ example: 3 })
  total_classes: number;
}

export class SubscriptionPlanDto {
  @ApiProperty({ example: 'plan-uuid' })
  id: string;

  @ApiProperty({ example: 'Premium Plan' })
  name: string;

  @ApiProperty({ example: 'premium' })
  plan_type: string;

  @ApiProperty({ example: 'Premium subscription with advanced features' })
  description: string;

  @ApiProperty({ example: 99.99 })
  cost: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 'monthly' })
  billing_cycle: string;

  @ApiProperty({ example: true })
  is_active: boolean;

  @ApiProperty({ example: 50 })
  max_allowed_teachers: number;

  @ApiProperty({ example: 1000 })
  max_allowed_students: number;

  @ApiProperty({ example: 20 })
  max_allowed_classes: number;

  @ApiProperty({ example: 30 })
  max_allowed_subjects: number;

  @ApiProperty({ example: 100 })
  max_file_size_mb: number;

  @ApiProperty({ example: 10 })
  max_document_uploads_per_teacher_per_day: number;

  @ApiProperty({ example: 1000 })
  max_storage_mb: number;

  @ApiProperty({ example: 100000 })
  max_daily_tokens_per_user: number;

  @ApiProperty({ example: 500000 })
  max_weekly_tokens_per_user: number;

  @ApiProperty({ example: 2000000 })
  max_monthly_tokens_per_user: number;

  @ApiProperty({ example: 10000000 })
  max_total_tokens_per_school: number;

  @ApiProperty({ example: 'Jan 1, 2024, 10:00 AM', nullable: true })
  start_date: string | null;

  @ApiProperty({ example: 'Dec 31, 2024, 10:00 AM', nullable: true })
  end_date: string | null;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: true })
  auto_renew: boolean;
}

export class TeacherProfileResponseDto {
  @ApiProperty({ type: TeacherProfileDto })
  teacher: TeacherProfileDto;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;

  @ApiProperty({ type: SchoolDto })
  school: SchoolDto;

  @ApiProperty({ type: AcademicSessionDto, nullable: true })
  current_session: AcademicSessionDto | null;

  @ApiProperty({ type: AcademicSessionDto, nullable: true })
  academic_session: AcademicSessionDto | null;

  @ApiProperty({ type: [SubjectTeachingDto] })
  subjects_teaching: SubjectTeachingDto[];

  @ApiProperty({ type: [ClassManagingDto] })
  classes_managing: ClassManagingDto[];

  @ApiProperty({ type: UserSettingsDto })
  settings: UserSettingsDto;

  @ApiProperty({ type: StatsDto })
  stats: StatsDto;

  @ApiProperty({ type: UsageStatsDto })
  usage: UsageStatsDto;

  @ApiProperty({ type: SubscriptionPlanDto, nullable: true })
  subscription_plan: SubscriptionPlanDto | null;
}

