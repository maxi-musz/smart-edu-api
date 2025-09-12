# User Profile Response Schemas

## Main Response Schema

```json
{
  "success": true,
  "message": "Profile data retrieved successfully",
  "data": {
    "general_info": { /* GeneralInfoSchema */ },
    "academic_info": { /* AcademicInfoSchema */ },
    "settings": { /* SettingsSchema */ },
    "support_info": { /* SupportInfoSchema */ }
  },
  "statusCode": 200
}
```

## General Info Schema

```json
{
  "general_info": {
    "student": {
      "id": "string",
      "name": "string",
      "email": "string",
      "phone": "string",
      "date_of_birth": "string (YYYY-MM-DD)",
      "display_picture": "string (URL)",
      "student_id": "string",
      "emergency_contact_name": "string",
      "emergency_contact_phone": "string",
      "address": {
        "street": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "postal_code": "string"
      }
    },
    "student_class": {
      "id": "string",
      "name": "string",
      "level": "string",
      "section": "string"
    },
    "current_session": {
      "id": "string",
      "academic_year": "string",
      "term": "string",
      "start_date": "string (YYYY-MM-DD)",
      "end_date": "string (YYYY-MM-DD)"
    }
  }
}
```

## Academic Info Schema

```json
{
  "academic_info": {
    "subjects_enrolled": [
      {
        "id": "string",
        "name": "string",
        "code": "string",
        "teacher_name": "string",
        "status": "string",
        "credits": "number"
      }
    ],
    "performance_summary": {
      "average_score": "number",
      "total_assessments": "number",
      "passed_assessments": "number",
      "failed_assessments": "number",
      "current_rank": "number",
      "total_students": "number",
      "grade_point_average": "number",
      "attendance_percentage": "number"
    },
    "recent_achievements": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "date_earned": "string (YYYY-MM-DD)",
        "type": "string"
      }
    ]
  }
}
```

## Settings Schema

```json
{
  "settings": {
    "notifications": {
      "push_notifications": "boolean",
      "email_notifications": "boolean",
      "assessment_reminders": "boolean",
      "grade_notifications": "boolean",
      "announcement_notifications": "boolean"
    },
    "app_preferences": {
      "dark_mode": "boolean",
      "sound_effects": "boolean",
      "haptic_feedback": "boolean",
      "auto_save": "boolean",
      "offline_mode": "boolean"
    },
    "privacy": {
      "profile_visibility": "string",
      "show_contact_info": "boolean",
      "show_academic_progress": "boolean",
      "data_sharing": "boolean"
    }
  }
}
```

## Support Info Schema

```json
{
  "support_info": {
    "help_center": {
      "faq_count": "number",
      "last_updated": "string (YYYY-MM-DD)",
      "categories": ["string"]
    },
    "contact_options": {
      "email_support": "string",
      "phone_support": "string",
      "live_chat_available": "boolean",
      "response_time": "string"
    },
    "app_info": {
      "version": "string",
      "build_number": "string",
      "last_updated": "string (YYYY-MM-DD)",
      "minimum_ios_version": "string",
      "minimum_android_version": "string"
    }
  }
}
```

## Field Descriptions

### Student Object
- `id`: Unique student identifier
- `name`: Full name (first_name + last_name)
- `email`: Student's email address
- `phone`: Phone number in international format
- `date_of_birth`: Date of birth in YYYY-MM-DD format
- `display_picture`: URL to student's profile picture
- `student_id`: School-assigned student ID
- `emergency_contact_name`: Name of emergency contact
- `emergency_contact_phone`: Phone number of emergency contact
- `address`: Complete address object

### Student Class Object
- `id`: Unique class identifier
- `name`: Class name (e.g., "SS 3A")
- `level`: Academic level (e.g., "Senior Secondary 3")
- `section`: Class section (e.g., "A")

### Current Session Object
- `id`: Unique session identifier
- `academic_year`: Academic year (e.g., "2024/2025")
- `term`: Current term (e.g., "First Term")
- `start_date`: Session start date
- `end_date`: Session end date

### Performance Summary Object
- `average_score`: Calculated average score from assessments
- `total_assessments`: Total number of assessments taken
- `passed_assessments`: Number of passed assessments
- `failed_assessments`: Number of failed assessments
- `current_rank`: Student's current rank in class
- `total_students`: Total number of students in class
- `grade_point_average`: Calculated GPA
- `attendance_percentage`: Attendance percentage

### Settings Objects
All settings objects contain boolean flags for various preferences and configurations.

### Support Info Objects
Contains help center information, contact options, and app version details.
