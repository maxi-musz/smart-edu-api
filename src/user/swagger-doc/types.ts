/**
 * TypeScript definitions for User Profile API
 * These types can be used for better IDE support and type safety
 */

export interface UserProfileResponse {
  success: boolean;
  message: string;
  data: UserProfileData;
  statusCode: number;
}

export interface UserProfileData {
  general_info: GeneralInfo;
  academic_info: AcademicInfo;
  settings: Settings;
  support_info: SupportInfo;
}

export interface GeneralInfo {
  student: StudentInfo;
  student_class: StudentClass;
  current_session: AcademicSession;
}

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string; // YYYY-MM-DD format
  display_picture: string; // URL
  student_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}

export interface StudentClass {
  id: string;
  name: string;
  level: string;
  section: string;
}

export interface AcademicSession {
  id: string;
  academic_year: string;
  term: string;
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
}

export interface AcademicInfo {
  subjects_enrolled: SubjectEnrolled[];
  performance_summary: PerformanceSummary;
  recent_achievements: Achievement[];
}

export interface SubjectEnrolled {
  id: string;
  name: string;
  code: string;
  teacher_name: string;
  status: 'active' | 'inactive';
  credits: number;
}

export interface PerformanceSummary {
  average_score: number;
  total_assessments: number;
  passed_assessments: number;
  failed_assessments: number;
  current_rank: number;
  total_students: number;
  grade_point_average: number;
  attendance_percentage: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date_earned: string; // YYYY-MM-DD format
  type: 'academic' | 'attendance' | 'behavior' | 'other';
}

export interface Settings {
  notifications: NotificationSettings;
  app_preferences: AppPreferences;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  push_notifications: boolean;
  email_notifications: boolean;
  assessment_reminders: boolean;
  grade_notifications: boolean;
  announcement_notifications: boolean;
}

export interface AppPreferences {
  dark_mode: boolean;
  sound_effects: boolean;
  haptic_feedback: boolean;
  auto_save: boolean;
  offline_mode: boolean;
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'classmates_only' | 'private';
  show_contact_info: boolean;
  show_academic_progress: boolean;
  data_sharing: boolean;
}

export interface SupportInfo {
  help_center: HelpCenter;
  contact_options: ContactOptions;
  app_info: AppInfo;
}

export interface HelpCenter {
  faq_count: number;
  last_updated: string; // YYYY-MM-DD format
  categories: string[];
}

export interface ContactOptions {
  email_support: string;
  phone_support: string;
  live_chat_available: boolean;
  response_time: string;
}

export interface AppInfo {
  version: string;
  build_number: string;
  last_updated: string; // YYYY-MM-DD format
  minimum_ios_version: string;
  minimum_android_version: string;
}

// Error Response Types
export interface ErrorResponse {
  success: false;
  message: string;
  statusCode: number;
}

export interface UnauthorizedError extends ErrorResponse {
  message: 'Unauthorized';
  statusCode: 401;
}

export interface NotFoundError extends ErrorResponse {
  message: 'User not found' | 'Student record not found' | 'Student class not found';
  statusCode: 404;
}

export interface InternalServerError extends ErrorResponse {
  message: 'Failed to fetch profile data';
  statusCode: 500;
}

// API Request Types
export interface GetUserProfileRequest {
  // No request body needed for GET request
  // Authentication via JWT token in Authorization header
}

// Utility Types
export type UserProfileApiResponse = UserProfileResponse | ErrorResponse;

export type HttpStatusCode = 200 | 401 | 404 | 500;

export type NotificationType = keyof NotificationSettings;

export type AppPreferenceType = keyof AppPreferences;

export type PrivacySettingType = keyof PrivacySettings;

// Constants
export const API_ENDPOINTS = {
  USER_PROFILE: '/api/v1/user/profile',
} as const;

export const HTTP_STATUS_CODES = {
  OK: 200,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const ACHIEVEMENT_TYPES = {
  ACADEMIC: 'academic',
  ATTENDANCE: 'attendance',
  BEHAVIOR: 'behavior',
  OTHER: 'other',
} as const;

export const PROFILE_VISIBILITY = {
  PUBLIC: 'public',
  CLASSMATES_ONLY: 'classmates_only',
  PRIVATE: 'private',
} as const;

export const SUBJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
