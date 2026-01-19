# Teacher Profile API Documentation

**Base URL:** `/teachers/profiles`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**Audience:** These endpoints are for **teachers** to access their profile information.

---

## Table of Contents
1. [Get Teacher Profile](#1-get-teacher-profile)

---

## IMPORTANT: Response Structure

**ALL ENDPOINTS** follow this exact response format:

```typescript
{
  success: boolean;      // true for success, false for error
  message: string;       // Human-readable message
  data: object | null;   // Response data (object on success, null on error)
}
```

**⚠️ Frontend developers:** Always check the `success` field first before accessing `data`. The `data` field will be `null` when `success` is `false`.

---

## 1. Get Teacher Profile

Get complete profile information for the authenticated teacher, including personal details, school information, subjects teaching, classes managing, usage statistics, and subscription plan details.

**Endpoint:** `GET /teachers/profiles`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /teachers/profiles
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Teacher profile retrieved successfully",
  "data": {
    "teacher": {
      "id": "teacher-uuid-1",
      "teacher_id": "tch/2024/001",
      "employee_number": "EMP-2024-001",
      "email": "john.doe@school.edu.ng",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone_number": "+2348012345678",
      "display_picture": "https://s3.amazonaws.com/bucket/teachers/photo.jpg",
      "gender": "male",
      "role": "TEACHER",
      "status": "active",
      "qualification": "B.Ed in Mathematics",
      "specialization": "Mathematics",
      "years_of_experience": 5,
      "hire_date": "2019-09-01",
      "salary": 150000,
      "department": "Science Department",
      "is_class_teacher": true,
      "created_at": "2024-01-10",
      "updated_at": "2024-01-16"
    },
    "user": {
      "id": "user-uuid-1",
      "email": "john.doe@school.edu.ng",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone_number": "+2348012345678",
      "display_picture": "https://s3.amazonaws.com/bucket/users/photo.jpg",
      "gender": "male",
      "role": "TEACHER",
      "status": "active",
      "is_email_verified": true,
      "created_at": "2024-01-10",
      "updated_at": "2024-01-16"
    },
    "school": {
      "id": "school-uuid-1",
      "school_name": "Saint Mary High School",
      "school_email": "info@smhs.edu.ng",
      "school_phone": "+2348087654321",
      "school_address": "123 Education Road, Lagos, Nigeria",
      "school_type": "SECONDARY",
      "school_ownership": "PRIVATE",
      "status": "active",
      "created_at": "2020-01-15",
      "updated_at": "2024-01-16"
    },
    "current_session": {
      "id": "session-uuid-1",
      "academic_year": "2024/2025",
      "term": "first",
      "start_date": "2024-09-01",
      "end_date": "2024-12-20",
      "status": "active"
    },
    "academic_session": {
      "id": "session-uuid-1",
      "academic_year": "2024/2025",
      "term": "first",
      "start_date": "2024-09-01",
      "end_date": "2024-12-20",
      "status": "active"
    },
    "subjects_teaching": [
      {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#FF5733",
        "description": "General Mathematics for JSS 1",
        "class": {
          "id": "class-uuid-1",
          "name": "JSS 1A"
        }
      },
      {
        "id": "subject-uuid-2",
        "name": "Further Mathematics",
        "code": "FMATH201",
        "color": "#3498DB",
        "description": "Advanced Mathematics for JSS 2",
        "class": {
          "id": "class-uuid-2",
          "name": "JSS 2A"
        }
      }
    ],
    "classes_managing": [
      {
        "id": "class-uuid-1",
        "name": "JSS 1A",
        "student_count": 30,
        "subject_count": 12
      },
      {
        "id": "class-uuid-3",
        "name": "JSS 3B",
        "student_count": 28,
        "subject_count": 14
      }
    ],
    "settings": {
      "push_notifications": true,
      "email_notifications": true,
      "assessment_reminders": true,
      "grade_notifications": true,
      "announcement_notifications": false,
      "dark_mode": false,
      "sound_effects": true,
      "haptic_feedback": true,
      "auto_save": true,
      "offline_mode": false,
      "profile_visibility": "classmates",
      "show_contact_info": true,
      "show_academic_progress": true,
      "data_sharing": false
    },
    "stats": {
      "total_students": 58,
      "total_subjects": 2,
      "total_classes": 2
    },
    "usage": {
      "tokens_used_this_day": 1250,
      "tokens_used_this_week": 8500,
      "tokens_used_all_time": 45000,
      "max_tokens_per_day": 50000,
      "max_tokens_per_week": 50000,
      "files_uploaded_this_month": 5,
      "total_files_uploaded_all_time": 23,
      "total_storage_used_mb": 145.5,
      "max_storage_mb": 500,
      "max_files_per_month": 10,
      "max_file_size_mb": 100,
      "messages_sent_this_week": 15,
      "max_messages_per_week": 100,
      "videos_uploaded": 8,
      "materials_uploaded": 15
    },
    "subscription_plan": {
      "id": "plan-uuid-1",
      "name": "Professional Plan",
      "plan_type": "PROFESSIONAL",
      "description": "Professional plan for medium-sized schools",
      "cost": 50000,
      "currency": "NGN",
      "billing_cycle": "MONTHLY",
      "is_active": true,
      "max_allowed_teachers": 50,
      "max_allowed_students": 500,
      "max_allowed_classes": 30,
      "max_allowed_subjects": 50,
      "allowed_document_types": ["PDF", "DOCX", "PPTX", "XLSX", "TXT"],
      "max_file_size_mb": 100,
      "max_document_uploads_per_teacher_per_day": 10,
      "max_document_uploads_per_student_per_day": 5,
      "max_storage_mb": 10000,
      "max_files_per_month": 100,
      "max_daily_tokens_per_user": 50000,
      "max_weekly_tokens_per_user": 350000,
      "max_monthly_tokens_per_user": 1500000,
      "max_total_tokens_per_school": 5000000,
      "max_messages_per_week": 100,
      "max_conversations_per_user": 50,
      "max_chat_sessions_per_user": 20,
      "features": [
        "AI-powered grading",
        "Advanced analytics",
        "Custom assessments",
        "Video content",
        "Real-time collaboration",
        "Priority support"
      ],
      "start_date": "2024-01-01",
      "end_date": "2025-01-01",
      "status": "active",
      "auto_renew": true
    }
  }
}
```

---

## Complete Response Structure

```typescript
{
  success: true;
  message: string;
  data: {
    // Teacher Record Information
    teacher: {
      id: string;                    // Teacher record ID
      teacher_id: string;            // Formatted teacher ID (tch/YYYY/###)
      employee_number: string;       // Employee number
      email: string;
      first_name: string;
      last_name: string;
      full_name: string;             // Concatenated first + last name
      phone_number: string;
      display_picture: string | null; // S3 URL or null
      gender: string;                // "male", "female", "other"
      role: string;                  // "TEACHER"
      status: string;                // "active", "inactive", "suspended"
      qualification: string | null;  // Academic qualifications
      specialization: string | null; // Subject specialization
      years_of_experience: number | null;
      hire_date: string | null;      // Formatted date (YYYY-MM-DD)
      salary: number | null;
      department: string | null;
      is_class_teacher: boolean;     // Whether teacher is a class teacher
      created_at: string;            // Formatted date (YYYY-MM-DD)
      updated_at: string;            // Formatted date (YYYY-MM-DD)
    };

    // User Account Information
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      full_name: string;
      phone_number: string;
      display_picture: string | null;
      gender: string;
      role: string;
      status: string;
      is_email_verified: boolean;
      created_at: string;
      updated_at: string;
    };

    // School Information
    school: {
      id: string;
      school_name: string;
      school_email: string;
      school_phone: string;
      school_address: string;
      school_type: string;           // "PRIMARY", "SECONDARY", "TERTIARY"
      school_ownership: string;      // "PRIVATE", "PUBLIC", "GOVERNMENT"
      status: string;                // "active", "inactive", "suspended"
      created_at: string;
      updated_at: string;
    };

    // Current Academic Session
    current_session: {
      id: string;
      academic_year: string;         // Format: "YYYY/YYYY"
      term: string;                  // "first", "second", "third"
      start_date: string;            // Formatted date (YYYY-MM-DD)
      end_date: string;              // Formatted date (YYYY-MM-DD)
      status: string;                // "active", "completed", "upcoming"
    } | null;

    // Teacher's Assigned Academic Session
    academic_session: {
      id: string;
      academic_year: string;
      term: string;
      start_date: string;
      end_date: string;
      status: string;
    } | null;

    // Subjects Teaching
    subjects_teaching: Array<{
      id: string;
      name: string;
      code: string;
      color: string;                 // Hex color code
      description: string | null;
      class: {
        id: string;
        name: string;
      } | null;
    }>;

    // Classes Managing (as class teacher)
    classes_managing: Array<{
      id: string;
      name: string;
      student_count: number;         // Total students in class
      subject_count: number;         // Total subjects in class
    }>;

    // User Settings & Preferences
    settings: {
      // Notification Settings
      push_notifications: boolean;
      email_notifications: boolean;
      assessment_reminders: boolean;
      grade_notifications: boolean;
      announcement_notifications: boolean;
      
      // UI/UX Settings
      dark_mode: boolean;
      sound_effects: boolean;
      haptic_feedback: boolean;
      auto_save: boolean;
      offline_mode: boolean;
      
      // Privacy Settings
      profile_visibility: string;    // "public", "classmates", "private"
      show_contact_info: boolean;
      show_academic_progress: boolean;
      data_sharing: boolean;
    };

    // Statistics
    stats: {
      total_students: number;        // Total students in managed classes
      total_subjects: number;        // Total subjects teaching
      total_classes: number;         // Total classes managing
    };

    // Usage Metrics
    usage: {
      // Token Usage (AI Interactions)
      tokens_used_this_day: number;
      tokens_used_this_week: number;
      tokens_used_all_time: number;
      max_tokens_per_day: number;
      max_tokens_per_week: number;
      
      // File Upload Usage
      files_uploaded_this_month: number;
      total_files_uploaded_all_time: number;
      total_storage_used_mb: number;
      max_storage_mb: number;
      max_files_per_month: number;
      max_file_size_mb: number;
      
      // Messaging Usage
      messages_sent_this_week: number;
      max_messages_per_week: number;
      
      // Content Upload Counts
      videos_uploaded: number;       // Total videos uploaded
      materials_uploaded: number;    // Total PDF materials uploaded
    };

    // Subscription Plan Details
    subscription_plan: {
      id: string;
      name: string;
      plan_type: string;             // "FREE", "BASIC", "PROFESSIONAL", "ENTERPRISE"
      description: string | null;
      cost: number;
      currency: string;              // "NGN", "USD", etc.
      billing_cycle: string;         // "MONTHLY", "YEARLY"
      is_active: boolean;
      
      // Basic Limits
      max_allowed_teachers: number;
      max_allowed_students: number;
      max_allowed_classes: number;
      max_allowed_subjects: number;
      
      // Document Management
      allowed_document_types: string[]; // ["PDF", "DOCX", "PPTX", etc.]
      max_file_size_mb: number;
      max_document_uploads_per_teacher_per_day: number;
      max_document_uploads_per_student_per_day: number;
      max_storage_mb: number;
      max_files_per_month: number;
      
      // Token Usage Limits
      max_daily_tokens_per_user: number;
      max_weekly_tokens_per_user: number;
      max_monthly_tokens_per_user: number;
      max_total_tokens_per_school: number;
      
      // Chat & Messaging Limits
      max_messages_per_week: number;
      max_conversations_per_user: number;
      max_chat_sessions_per_user: number;
      
      // Additional Features
      features: string[];            // Array of feature names
      
      // Subscription Management
      start_date: string | null;     // Formatted date (YYYY-MM-DD)
      end_date: string | null;       // Formatted date (YYYY-MM-DD)
      status: string;                // "active", "expired", "cancelled"
      auto_renew: boolean;
    } | null;
  };
}
```

---

## Important Notes

### 1. Teacher vs User

**Teacher Record:**
- Specific to the school
- Contains teaching-related information (qualification, specialization, hire date, etc.)
- Linked to subjects and classes

**User Account:**
- Platform-wide authentication account
- Contains basic user information
- Manages settings and preferences

### 2. Display Picture

**Two Display Pictures:**
- `teacher.display_picture`: Teacher-specific photo
- `user.display_picture`: User account photo

**Priority:**
- Use `teacher.display_picture` if available
- Fallback to `user.display_picture`
- Both can be null

**Format:**
- Full S3 URL or null
- Example: `https://s3.amazonaws.com/bucket/path/to/photo.jpg`

### 3. Academic Sessions

**Two Session Fields:**

**current_session:**
- The active academic session for the entire school
- Retrieved from the current session endpoint
- May be null if no active session

**academic_session:**
- The specific session assigned to this teacher
- From the teacher's record
- May differ from current_session
- May be null

### 4. Classes Managing

**Only shows classes where teacher is the class teacher:**
- `is_class_teacher` must be true
- Includes student and subject counts
- Empty array if not a class teacher

### 5. Subjects Teaching

**All subjects assigned to the teacher:**
- Includes subject details and associated class
- `class` field may be null for school-wide subjects
- Empty array if no subjects assigned

### 6. Usage Metrics

**Token Usage:**
- Tracks AI interactions and API usage
- Resets daily/weekly based on limits
- Used for billing and quota management

**File Upload Usage:**
- Tracks document, video, and material uploads
- Monthly reset for file count
- Storage is cumulative

**Messaging Usage:**
- Tracks chat and messaging activity
- Weekly reset

### 7. Subscription Plan

**May be null if:**
- School has no active subscription
- Subscription expired
- Free tier with no formal plan

**Features Array:**
- List of enabled features for the plan
- Use to show/hide UI elements
- Control access to premium features

### 8. Settings Defaults

**If user has no settings record:**
- Returns default values
- Sensible defaults for new users
- Can be updated via settings endpoint

### 9. Statistics

**Calculated in real-time:**
- `total_students`: Only students in classes teacher manages
- `total_subjects`: Count of teacher-subject assignments
- `total_classes`: Count of classes where teacher is class teacher

### 10. Status Values

**Teacher/User Status:**
- `active`: Normal active status
- `inactive`: Temporarily inactive
- `suspended`: Account suspended

**School Status:**
- `active`: School is operational
- `inactive`: School temporarily closed
- `suspended`: School suspended by platform

**Session Status:**
- `active`: Current active session
- `completed`: Past session
- `upcoming`: Future session

---

## Error Responses

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher profile not found",
  "data": null
}
```

**404 Not Found - School Not Found:**
```json
{
  "success": false,
  "message": "School not found",
  "data": null
}
```

**404 Not Found - Profile Mismatch:**
```json
{
  "success": false,
  "message": "Teacher profile mismatch - user does not match teacher record",
  "data": null
}
```

**404 Not Found - General Error:**
```json
{
  "success": false,
  "message": "Failed to fetch teacher profile",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Profile retrieved successfully |
| 401 | Unauthorized - Invalid or missing authentication token |
| 404 | Not Found - Teacher profile not found |
| 500 | Internal Server Error - Server error occurred |

---

## Example Usage (JavaScript/TypeScript)

### Fetching Teacher Profile

```typescript
const fetchTeacherProfile = async () => {
  try {
    const response = await fetch('/teachers/profiles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { 
        teacher, 
        user, 
        school, 
        current_session,
        subjects_teaching,
        classes_managing,
        settings,
        stats,
        usage,
        subscription_plan
      } = result.data;
      
      console.log('Teacher:', teacher.full_name);
      console.log('School:', school.school_name);
      console.log('Subjects Teaching:', subjects_teaching.length);
      console.log('Classes Managing:', classes_managing.length);
      console.log('Total Students:', stats.total_students);
      
      // Display profile picture (prefer teacher over user)
      const profilePicture = teacher.display_picture || user.display_picture || '/default-avatar.png';
      
      // Check usage limits
      const tokenUsagePercent = (usage.tokens_used_this_day / usage.max_tokens_per_day) * 100;
      const storageUsagePercent = (usage.total_storage_used_mb / usage.max_storage_mb) * 100;
      
      console.log(`Token Usage: ${tokenUsagePercent.toFixed(2)}%`);
      console.log(`Storage Usage: ${storageUsagePercent.toFixed(2)}%`);
      
      // Check subscription features
      if (subscription_plan && subscription_plan.features.includes('AI-powered grading')) {
        console.log('AI grading is available');
      }
      
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    showToast('error', 'Failed to load teacher profile');
    return null;
  }
};
```

### Building Profile UI

```typescript
const buildProfileUI = (profileData) => {
  const { teacher, school, subjects_teaching, classes_managing, stats, usage } = profileData;
  
  // Header Section
  const header = {
    name: teacher.full_name,
    email: teacher.email,
    phone: teacher.phone_number,
    picture: teacher.display_picture || '/default-avatar.png',
    employeeNumber: teacher.employee_number,
    teacherId: teacher.teacher_id
  };
  
  // School Information
  const schoolInfo = {
    name: school.school_name,
    address: school.school_address,
    type: school.school_type,
    ownership: school.school_ownership
  };
  
  // Professional Details
  const professionalInfo = {
    qualification: teacher.qualification,
    specialization: teacher.specialization,
    experience: teacher.years_of_experience,
    hireDate: teacher.hire_date,
    department: teacher.department,
    isClassTeacher: teacher.is_class_teacher
  };
  
  // Teaching Assignment
  const teachingInfo = {
    subjects: subjects_teaching.map(s => ({
      name: s.name,
      code: s.code,
      class: s.class?.name || 'All Classes',
      color: s.color
    })),
    classes: classes_managing.map(c => ({
      name: c.name,
      students: c.student_count,
      subjects: c.subject_count
    }))
  };
  
  // Statistics Cards
  const statsCards = [
    {
      title: 'Total Students',
      value: stats.total_students,
      icon: 'users',
      color: 'blue'
    },
    {
      title: 'Subjects',
      value: stats.total_subjects,
      icon: 'book',
      color: 'green'
    },
    {
      title: 'Classes',
      value: stats.total_classes,
      icon: 'school',
      color: 'purple'
    }
  ];
  
  // Usage Indicators
  const usageIndicators = [
    {
      label: 'Token Usage Today',
      current: usage.tokens_used_this_day,
      max: usage.max_tokens_per_day,
      unit: 'tokens',
      percentage: (usage.tokens_used_this_day / usage.max_tokens_per_day) * 100
    },
    {
      label: 'Storage Used',
      current: usage.total_storage_used_mb,
      max: usage.max_storage_mb,
      unit: 'MB',
      percentage: (usage.total_storage_used_mb / usage.max_storage_mb) * 100
    },
    {
      label: 'Files This Month',
      current: usage.files_uploaded_this_month,
      max: usage.max_files_per_month,
      unit: 'files',
      percentage: (usage.files_uploaded_this_month / usage.max_files_per_month) * 100
    }
  ];
  
  return {
    header,
    schoolInfo,
    professionalInfo,
    teachingInfo,
    statsCards,
    usageIndicators
  };
};
```

### Checking Feature Access

```typescript
const checkFeatureAccess = (profileData, featureName) => {
  const { subscription_plan } = profileData;
  
  if (!subscription_plan) {
    console.warn('No subscription plan found');
    return false;
  }
  
  if (!subscription_plan.is_active) {
    console.warn('Subscription is not active');
    return false;
  }
  
  if (subscription_plan.status !== 'active') {
    console.warn(`Subscription status: ${subscription_plan.status}`);
    return false;
  }
  
  // Check if feature is included
  const hasFeature = subscription_plan.features.includes(featureName);
  
  if (hasFeature) {
    console.log(`Feature "${featureName}" is available`);
    return true;
  } else {
    console.log(`Feature "${featureName}" is not available in ${subscription_plan.name}`);
    return false;
  }
};

// Usage examples
const canUseAIGrading = checkFeatureAccess(profileData, 'AI-powered grading');
const canUseAdvancedAnalytics = checkFeatureAccess(profileData, 'Advanced analytics');
const canUploadVideos = checkFeatureAccess(profileData, 'Video content');
```

### Checking Usage Limits

```typescript
const checkUsageLimits = (profileData) => {
  const { usage } = profileData;
  
  const limits = {
    tokens: {
      canUse: usage.tokens_used_this_day < usage.max_tokens_per_day,
      remaining: usage.max_tokens_per_day - usage.tokens_used_this_day,
      percentage: (usage.tokens_used_this_day / usage.max_tokens_per_day) * 100,
      warning: (usage.tokens_used_this_day / usage.max_tokens_per_day) > 0.8
    },
    storage: {
      canUpload: usage.total_storage_used_mb < usage.max_storage_mb,
      remaining: usage.max_storage_mb - usage.total_storage_used_mb,
      percentage: (usage.total_storage_used_mb / usage.max_storage_mb) * 100,
      warning: (usage.total_storage_used_mb / usage.max_storage_mb) > 0.9
    },
    files: {
      canUpload: usage.files_uploaded_this_month < usage.max_files_per_month,
      remaining: usage.max_files_per_month - usage.files_uploaded_this_month,
      percentage: (usage.files_uploaded_this_month / usage.max_files_per_month) * 100,
      warning: (usage.files_uploaded_this_month / usage.max_files_per_month) > 0.8
    },
    messages: {
      canSend: usage.messages_sent_this_week < usage.max_messages_per_week,
      remaining: usage.max_messages_per_week - usage.messages_sent_this_week,
      percentage: (usage.messages_sent_this_week / usage.max_messages_per_week) * 100,
      warning: (usage.messages_sent_this_week / usage.max_messages_per_week) > 0.8
    }
  };
  
  // Show warnings if needed
  if (limits.tokens.warning) {
    showToast('warning', `Token usage at ${limits.tokens.percentage.toFixed(1)}%`);
  }
  
  if (limits.storage.warning) {
    showToast('warning', `Storage usage at ${limits.storage.percentage.toFixed(1)}%`);
  }
  
  return limits;
};
```

### Displaying Subjects and Classes

```typescript
const displayTeachingAssignment = (profileData) => {
  const { subjects_teaching, classes_managing } = profileData;
  
  // Group subjects by class
  const subjectsByClass = {};
  
  subjects_teaching.forEach(subject => {
    const className = subject.class?.name || 'School-wide';
    
    if (!subjectsByClass[className]) {
      subjectsByClass[className] = [];
    }
    
    subjectsByClass[className].push({
      name: subject.name,
      code: subject.code,
      color: subject.color,
      description: subject.description
    });
  });
  
  console.log('Subjects by Class:', subjectsByClass);
  
  // Display classes managing
  classes_managing.forEach(classItem => {
    console.log(`Class: ${classItem.name}`);
    console.log(`  Students: ${classItem.student_count}`);
    console.log(`  Subjects: ${classItem.subject_count}`);
  });
  
  return { subjectsByClass, classes_managing };
};
```

---

## UI/UX Recommendations

### 1. Profile Header
- **Large Profile Picture:** Prominent display with edit option
- **Name & Title:** Full name with teacher ID and employee number
- **Quick Stats:** Card-based statistics (students, subjects, classes)
- **Status Badge:** Active/Inactive status indicator

### 2. Information Sections

**Personal Information:**
- Email, phone, gender
- Qualification and specialization
- Years of experience
- Hire date and department

**School Information:**
- School name and logo
- Address and contact
- School type and ownership

**Academic Session:**
- Current session with dates
- Term indicator
- Session status

### 3. Teaching Assignment

**Subjects Card:**
- List of subjects with color coding
- Class association
- Subject codes
- Clickable for more details

**Classes Managing:**
- Grid or list view
- Student and subject counts
- Quick navigation to class details

### 4. Usage Dashboard

**Progress Bars:**
- Token usage (daily/weekly)
- Storage usage
- File uploads this month
- Messages sent this week

**Color Coding:**
- Green: < 50% used
- Yellow: 50-80% used
- Red: > 80% used

**Warnings:**
- Show alerts when approaching limits
- Suggest upgrade if consistently hitting limits

### 5. Subscription Information

**Plan Card:**
- Plan name and type
- Billing cycle and cost
- Active features list
- Upgrade/renew buttons

**Feature Indicators:**
- Show available features
- Lock icon for unavailable features
- Tooltips explaining benefits

### 6. Settings

**Notification Preferences:**
- Toggle switches for each notification type
- Email/Push notification options

**Privacy Settings:**
- Profile visibility options
- Contact info display
- Academic progress sharing

**UI Preferences:**
- Dark mode toggle
- Sound effects
- Haptic feedback
- Auto-save

### 7. Content Statistics

**Uploads Summary:**
- Videos uploaded count
- Materials uploaded count
- Total storage used
- Visual charts

### 8. General UI

**Loading States:**
- Skeleton loaders for profile data
- Smooth transitions

**Error Handling:**
- Clear error messages
- Retry option

**Refresh:**
- Pull-to-refresh on mobile
- Manual refresh button

**Edit Profile:**
- Edit button for editable fields
- Separate endpoint for updates (not covered here)

---

## Testing Endpoint

### Using cURL

```bash
# Get teacher profile
curl -X GET "/teachers/profiles" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in request header
2. **Response Checking:** Always check `success` field before accessing `data`
3. **Error Handling:** Display user-friendly error messages
4. **Display Picture Priority:** Use `teacher.display_picture` first, fallback to `user.display_picture`
5. **Null Handling:** Many fields can be null, provide defaults
6. **Date Formatting:** Dates are pre-formatted as YYYY-MM-DD
7. **Usage Monitoring:** Show visual indicators for usage limits
8. **Feature Gating:** Check subscription features before showing UI
9. **Empty States:** Handle empty arrays for subjects/classes gracefully
10. **Session Info:** Display current academic session prominently
11. **Color Coding:** Use subject colors for visual consistency
12. **Responsive Design:** Adapt layout for mobile/tablet/desktop

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 16, 2026


