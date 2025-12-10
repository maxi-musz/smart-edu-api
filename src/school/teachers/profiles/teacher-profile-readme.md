# Teacher Profile Module

## 📋 Overview
The Teacher Profile module provides comprehensive profile management functionality for teachers. It retrieves detailed information about a teacher including personal details, school information, teaching assignments, usage statistics, token consumption, upload counts, and subscription plan details.

## 🎯 Features

### 👤 **Profile Information**
- **Teacher Details**: Employee number, qualification, specialization, years of experience
- **User Information**: Email, name, phone, display picture, verification status
- **School Details**: Complete school information and status
- **Academic Session**: Current and assigned academic session details

### 📚 **Teaching Information**
- **Subjects Teaching**: List of all subjects assigned to the teacher with class associations
- **Classes Managing**: Classes where the teacher serves as class teacher with student/subject counts
- **Statistics**: Total students, subjects, and classes managed

### 📊 **Usage & Analytics**
- **Token Usage**: Daily, weekly, and all-time token consumption with limits
- **Upload Statistics**: 
  - Files uploaded this month and all-time
  - Videos uploaded count
  - Materials (PDFs) uploaded count
- **Storage Usage**: Current storage used vs. maximum allowed
- **Message Statistics**: Messages sent this week with limits

### 💳 **Subscription Plan**
- **Plan Details**: Complete subscription plan information
- **Limits**: All plan limits including tokens, storage, uploads, and messaging
- **Features**: Available features based on subscription tier
- **Billing Information**: Cost, currency, billing cycle, and renewal status

### ⚙️ **User Settings**
- **Notifications**: Push, email, assessment, grade, and announcement notifications
- **App Preferences**: Dark mode, sound effects, haptic feedback
- **Privacy Settings**: Profile visibility, contact info display, data sharing

## 📁 Module Structure

```
profiles/
├── profiles.module.ts              # Main module configuration
├── profiles.service.ts             # Business logic and data retrieval
├── profiles.controller.ts          # API endpoint definitions
├── dto/                           # Data Transfer Objects
│   ├── teacher-profile-response.dto.ts
│   └── index.ts
├── docs/                          # Swagger documentation
│   ├── profiles.docs.ts
│   └── index.ts
├── index.ts                       # Module exports
└── teacher-profile-readme.md      # This file
```

## 🔌 API Endpoints

### **Get Teacher Profile**
- **Endpoint**: `GET /api/v1/teachers/profiles`
- **Authentication**: Required (JWT Bearer Token)
- **Description**: Retrieves comprehensive teacher profile information

### **Update Profile Picture** (Global Endpoint)
- **Endpoint**: `POST /api/v1/user/picture`
- **Authentication**: Required (JWT Bearer Token)
- **Description**: Upload and update user profile picture. Works for all roles (student, teacher, director). The new picture will replace the existing one. If the update fails, the uploaded file will be automatically deleted from storage.
- **Note**: This is a global endpoint available to all user roles. See the [User Profile API documentation](../../../user/README.md) for details.

#### Request
```http
GET /api/v1/teachers/profiles
Authorization: Bearer <jwt_token>
```

#### Response Format
```json
{
  "success": true,
  "message": "Teacher profile retrieved successfully",
  "data": {
    "teacher": {
      "id": "teacher-uuid",
      "teacher_id": "TCH001",
      "employee_number": "EMP001",
      "email": "teacher@school.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone_number": "+1234567890",
      "display_picture": null,
      "gender": "male",
      "role": "teacher",
      "status": "active",
      "qualification": "B.Sc. Mathematics",
      "specialization": "Mathematics",
      "years_of_experience": 5,
      "hire_date": "Jan 1, 2024, 10:00 AM",
      "salary": 50000,
      "department": "Mathematics",
      "is_class_teacher": true,
      "created_at": "Jan 1, 2024, 10:00 AM",
      "updated_at": "Jan 1, 2024, 10:00 AM"
    },
    "user": {
      "id": "user-uuid",
      "email": "teacher@school.com",
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "phone_number": "+1234567890",
      "display_picture": null,
      "gender": "male",
      "role": "teacher",
      "status": "active",
      "is_email_verified": true,
      "created_at": "Jan 1, 2024, 10:00 AM",
      "updated_at": "Jan 1, 2024, 10:00 AM"
    },
    "school": {
      "id": "school-uuid",
      "school_name": "ABC School",
      "school_email": "info@abcschool.com",
      "school_phone": "+1234567890",
      "school_address": "123 Main St",
      "school_type": "primary_and_secondary",
      "school_ownership": "private",
      "status": "approved",
      "created_at": "Jan 1, 2024, 10:00 AM",
      "updated_at": "Jan 1, 2024, 10:00 AM"
    },
    "current_session": {
      "id": "session-uuid",
      "academic_year": "2024/2025",
      "term": "first",
      "start_date": "Jan 1, 2024, 10:00 AM",
      "end_date": "Mar 31, 2024, 10:00 AM",
      "status": "active"
    },
    "academic_session": {
      "id": "session-uuid",
      "academic_year": "2024/2025",
      "term": "first",
      "start_date": "Jan 1, 2024, 10:00 AM",
      "end_date": "Mar 31, 2024, 10:00 AM",
      "status": "active"
    },
    "subjects_teaching": [
      {
        "id": "subject-uuid",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#FF5733",
        "description": "Introduction to Mathematics",
        "class": {
          "id": "class-uuid",
          "name": "Class 10A"
        }
      }
    ],
    "classes_managing": [
      {
        "id": "class-uuid",
        "name": "Class 10A",
        "student_count": 30,
        "subject_count": 5
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
      "total_students": 150,
      "total_subjects": 5,
      "total_classes": 3
    },
    "usage": {
      "tokens_used_this_day": 15000,
      "tokens_used_this_week": 50000,
      "tokens_used_all_time": 200000,
      "max_tokens_per_day": 50000,
      "max_tokens_per_week": 50000,
      "files_uploaded_this_month": 25,
      "total_files_uploaded_all_time": 150,
      "total_storage_used_mb": 1024,
      "max_storage_mb": 500,
      "max_files_per_month": 10,
      "max_file_size_mb": 100,
      "messages_sent_this_week": 50,
      "max_messages_per_week": 100,
      "videos_uploaded": 15,
      "materials_uploaded": 30
    },
    "subscription_plan": {
      "id": "plan-uuid",
      "name": "Premium Plan",
      "plan_type": "premium",
      "description": "Premium subscription with advanced features",
      "cost": 99.99,
      "currency": "USD",
      "billing_cycle": "monthly",
      "is_active": true,
      "max_allowed_teachers": 50,
      "max_allowed_students": 1000,
      "max_allowed_classes": 20,
      "max_allowed_subjects": 30,
      "max_file_size_mb": 100,
      "max_document_uploads_per_teacher_per_day": 10,
      "max_storage_mb": 1000,
      "max_daily_tokens_per_user": 100000,
      "max_weekly_tokens_per_user": 500000,
      "max_monthly_tokens_per_user": 2000000,
      "max_total_tokens_per_school": 10000000,
      "start_date": "Jan 1, 2024, 10:00 AM",
      "end_date": "Dec 31, 2024, 10:00 AM",
      "status": "active",
      "auto_renew": true
    }
  },
  "statusCode": 200
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid or missing JWT token"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Teacher profile not found"
}
```

---

### **Update Profile Picture** (Global Endpoint)

**Note**: This endpoint has been moved to the global User Profile API. Use `POST /api/v1/user/picture` instead.

#### Request
```http
POST /api/v1/user/picture
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

Form Data:
- picture: <image_file>
```

**File Requirements:**
- **Allowed Types**: JPEG, PNG, GIF, WEBP
- **Max Size**: 5MB
- **Field Name**: `picture`

#### Response Format
```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "display_picture": {
      "url": "https://storage.example.com/profile-pictures/schools/school-id/teachers/teacher-id/profile_1234567890.jpg",
      "key": "profile-pictures/schools/school-id/teachers/teacher-id/profile_1234567890.jpg",
      "bucket": "my-bucket",
      "etag": "etag-value",
      "uploaded_at": "2024-01-15T10:30:00.000Z"
    },
    "url": "https://storage.example.com/profile-pictures/schools/school-id/teachers/teacher-id/profile_1234567890.jpg"
  },
  "statusCode": 200
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Allowed types: JPEG, PNG, GIF, WEBP"
}
```

```json
{
  "statusCode": 400,
  "message": "File size exceeds 5MB limit"
}
```

```json
{
  "statusCode": 400,
  "message": "Profile picture file is required"
}
```

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized - Invalid or missing JWT token"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Teacher profile not found"
}
```

## 🗄️ Database Models

The module works with the following Prisma models:

- **`Teacher`** - Teacher records with professional information
- **`User`** - User authentication and token/upload tracking
- **`School`** - School information
- **`AcademicSession`** - Academic session details
- **`Subject`** - Subject information
- **`Class`** - Class information
- **`TeacherSubject`** - Teacher-subject assignments
- **`VideoContent`** - Video uploads by teacher
- **`PDFMaterial`** - Material uploads by teacher
- **`PlatformSubscriptionPlan`** - Subscription plan details
- **`UserSettings`** - User preferences and settings

## 📊 Response Data Structure

### Teacher Object
Contains professional teacher information:
- Basic identification (ID, teacher_id, employee_number)
- Personal details (name, email, phone, display picture)
- Professional details (qualification, specialization, years of experience)
- Employment details (hire_date, salary, department, is_class_teacher)

### User Object
Contains user account information:
- Account details (email, name, phone, display picture)
- Verification status (is_email_verified)
- Account status and timestamps

### School Object
Contains school information:
- School identification and contact details
- School type and ownership
- Status and timestamps

### Usage Object
Contains usage statistics and limits:
- **Token Usage**: Daily, weekly, and all-time consumption
- **File Uploads**: Monthly and all-time counts
- **Storage**: Used and maximum storage
- **Messages**: Weekly message count
- **Content**: Videos and materials uploaded

### Subscription Plan Object
Contains subscription plan details:
- Plan identification and pricing
- Feature limits (teachers, students, classes, subjects)
- Token limits (daily, weekly, monthly, school-wide)
- Storage and upload limits
- Billing information

## 🔒 Security Considerations

- **Authentication Required**: All endpoints require JWT Bearer token
- **School Validation**: Teachers can only access their own school's data
- **User Validation**: Profile data is scoped to the authenticated teacher
- **Data Privacy**: Sensitive information (salary) is included but should be protected in frontend

## 🚀 Usage Examples

### Update Profile Picture (JavaScript/TypeScript)

**Note**: Use the global endpoint `/api/v1/user/picture` which works for all roles.

```typescript
// Using FormData and fetch API
const updateProfilePicture = async (token: string, imageFile: File) => {
  const formData = new FormData();
  formData.append('picture', imageFile);

  const response = await fetch('https://api.example.com/api/v1/user/picture', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  const data = await response.json();

  if (data.success) {
    console.log('Profile picture updated:', data.data.display_picture.url);
  }
};
```

### Update Profile Picture (Axios)

```typescript
import axios from 'axios';

const updateProfilePicture = async (token: string, imageFile: File) => {
  const formData = new FormData();
  formData.append('picture', imageFile);

  try {
    const response = await axios.post(
      'https://api.example.com/api/v1/user/picture',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
};
```

### Fetch Teacher Profile (JavaScript/TypeScript)

```typescript
// Using fetch API
const response = await fetch('https://api.example.com/api/v1/teachers/profiles', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();

if (data.success) {
  console.log('Teacher:', data.data.teacher);
  console.log('Usage Stats:', data.data.usage);
  console.log('Subscription Plan:', data.data.subscription_plan);
}
```

### Fetch Teacher Profile (Axios)

```typescript
import axios from 'axios';

const getTeacherProfile = async (token: string) => {
  try {
    const response = await axios.get(
      'https://api.example.com/api/v1/teachers/profiles',
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};
```

### Access Usage Statistics

```typescript
const profile = await getTeacherProfile(token);

// Check token usage
const tokenUsage = {
  daily: profile.data.usage.tokens_used_this_day,
  weekly: profile.data.usage.tokens_used_this_week,
  allTime: profile.data.usage.tokens_used_all_time,
  dailyLimit: profile.data.usage.max_tokens_per_day,
  weeklyLimit: profile.data.usage.max_tokens_per_week
};

// Check upload counts
const uploadStats = {
  filesThisMonth: profile.data.usage.files_uploaded_this_month,
  totalFiles: profile.data.usage.total_files_uploaded_all_time,
  videos: profile.data.usage.videos_uploaded,
  materials: profile.data.usage.materials_uploaded
};

// Check storage
const storage = {
  used: profile.data.usage.total_storage_used_mb,
  max: profile.data.usage.max_storage_mb,
  percentage: (profile.data.usage.total_storage_used_mb / profile.data.usage.max_storage_mb) * 100
};
```

## 🧪 Testing

### Manual Testing

1. **Get Teacher Profile**
   ```bash
   curl -X GET https://api.example.com/api/v1/teachers/profiles \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

2. **Update Profile Picture** (Global Endpoint)
   ```bash
   curl -X POST https://api.example.com/api/v1/user/picture \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -F "picture=@/path/to/image.jpg"
   ```

3. **Verify Response Structure**
   - Check that all required fields are present
   - Verify token usage counts are accurate
   - Confirm upload counts match actual uploads
   - Validate subscription plan details
   - Verify profile picture URL is accessible

### Unit Testing

```typescript
describe('ProfilesService', () => {
  it('should fetch teacher profile successfully', async () => {
    const user = { id: 'user-id', email: 'teacher@school.com', school_id: 'school-id' };
    const result = await profilesService.getTeacherProfile(user);
    
    expect(result.success).toBe(true);
    expect(result.data.teacher).toBeDefined();
    expect(result.data.usage).toBeDefined();
    expect(result.data.subscription_plan).toBeDefined();
  });
});
```

## 📝 Dependencies

- `@nestjs/common` - NestJS core functionality
- `@nestjs/swagger` - API documentation
- `prisma` - Database ORM
- `colors` - Console logging colors

## 🔄 Related Modules

- **AcademicSessionModule** - For current session information
- **PrismaModule** - For database access
- **AuthModule** - For JWT authentication

## 🎯 Future Enhancements

- **Profile Update Endpoint**: Allow teachers to update their profile information (name, phone, etc.)
- **Settings Update Endpoint**: Allow teachers to update their preferences
- **Usage Analytics**: Detailed usage charts and trends
- **Export Profile**: PDF export of teacher profile
- **Profile Picture Management**: Delete profile picture option
- **Activity History**: Track recent activities and changes

## 📚 Additional Resources

- [Swagger Documentation](./docs/profiles.docs.ts) - API documentation
- [DTO Definitions](./dto/teacher-profile-response.dto.ts) - Response type definitions
- [Main Teachers Module](../teachers.module.ts) - Parent module configuration

## ⚠️ Notes

- Token usage is tracked per user and resets daily/weekly based on plan settings
- Upload counts are tracked separately for videos and materials
- Storage usage includes all files uploaded by the teacher
- Subscription plan information is fetched from the school's active plan
- All dates are formatted using the `formatDate` helper function

## 🐛 Troubleshooting

### Profile Not Found
- Ensure the user has a corresponding Teacher record
- Verify the user's school_id matches the teacher's school_id
- Check that the teacher status is active

### Missing Usage Data
- Verify the User model has token and upload tracking fields
- Check that upload counts are being tracked in VideoContent and PDFMaterial tables
- Ensure subscription plan exists for the school

### Missing Subscription Plan
- Check if the school has an active subscription plan
- Verify the PlatformSubscriptionPlan table has a record for the school
- Plan will be `null` if no subscription exists

