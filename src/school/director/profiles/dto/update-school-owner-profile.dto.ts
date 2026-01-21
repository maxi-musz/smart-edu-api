import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateSchoolOwnerProfileDto {
  // User fields (email is NOT editable)
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  // User settings (all optional)
  @IsOptional()
  @IsBoolean()
  push_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  email_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  assessment_reminders?: boolean;

  @IsOptional()
  @IsBoolean()
  grade_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  announcement_notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  dark_mode?: boolean;

  @IsOptional()
  @IsBoolean()
  sound_effects?: boolean;

  @IsOptional()
  @IsBoolean()
  haptic_feedback?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_save?: boolean;

  @IsOptional()
  @IsBoolean()
  offline_mode?: boolean;

  @IsOptional()
  @IsString()
  profile_visibility?: string;

  @IsOptional()
  @IsBoolean()
  show_contact_info?: boolean;

  @IsOptional()
  @IsBoolean()
  show_academic_progress?: boolean;

  @IsOptional()
  @IsBoolean()
  data_sharing?: boolean;
}


