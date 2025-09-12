# User Profile Request Examples

## Example Requests

### Get User Profile

#### cURL Request
```bash
curl -X GET "https://api.school.com/api/v1/user/profile" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

#### JavaScript/Fetch Request
```javascript
const response = await fetch('/api/v1/user/profile', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```

#### Axios Request
```javascript
import axios from 'axios';

const response = await axios.get('/api/v1/user/profile', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});

console.log(response.data);
```

#### React Hook Example
```javascript
import { useState, useEffect } from 'react';

const useUserProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/v1/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        
        const data = await response.json();
        setProfile(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { profile, loading, error };
};
```

## Example Responses

### Success Response
```json
{
  "success": true,
  "message": "Profile data retrieved successfully",
  "data": {
    "general_info": {
      "student": {
        "id": "stu_123456",
        "name": "John Doe",
        "email": "john.doe@school.com",
        "phone": "+234 801 234 5678",
        "date_of_birth": "2005-01-15",
        "display_picture": "https://example.com/avatars/john-doe.jpg",
        "student_id": "STU/2024/001",
        "emergency_contact_name": "Jane Doe",
        "emergency_contact_phone": "+234 802 345 6789",
        "address": {
          "street": "123 Education Street",
          "city": "Lagos",
          "state": "Lagos State",
          "country": "Nigeria",
          "postal_code": "100001"
        }
      },
      "student_class": {
        "id": "class_001",
        "name": "SS 3A",
        "level": "Senior Secondary 3",
        "section": "A"
      },
      "current_session": {
        "id": "session_2024",
        "academic_year": "2024/2025",
        "term": "First Term",
        "start_date": "2024-09-01",
        "end_date": "2024-12-20"
      }
    },
    "academic_info": {
      "subjects_enrolled": [
        {
          "id": "subj_001",
          "name": "Mathematics",
          "code": "MATH301",
          "teacher_name": "Dr. Sarah Johnson",
          "status": "active",
          "credits": 3
        },
        {
          "id": "subj_002",
          "name": "English Language",
          "code": "ENG301",
          "teacher_name": "Mr. Michael Brown",
          "status": "active",
          "credits": 3
        }
      ],
      "performance_summary": {
        "average_score": 78.5,
        "total_assessments": 12,
        "passed_assessments": 10,
        "failed_assessments": 2,
        "current_rank": 15,
        "total_students": 45,
        "grade_point_average": 3.2,
        "attendance_percentage": 95.5
      },
      "recent_achievements": [
        {
          "id": "ach_001",
          "title": "Top Performer in Mathematics",
          "description": "Achieved highest score in Mathematics assessment",
          "date_earned": "2024-01-10",
          "type": "academic"
        }
      ]
    },
    "settings": {
      "notifications": {
        "push_notifications": true,
        "email_notifications": true,
        "assessment_reminders": true,
        "grade_notifications": true,
        "announcement_notifications": true
      },
      "app_preferences": {
        "dark_mode": false,
        "sound_effects": true,
        "haptic_feedback": true,
        "auto_save": true,
        "offline_mode": false
      },
      "privacy": {
        "profile_visibility": "classmates_only",
        "show_contact_info": true,
        "show_academic_progress": true,
        "data_sharing": false
      }
    },
    "support_info": {
      "help_center": {
        "faq_count": 25,
        "last_updated": "2024-01-15",
        "categories": ["General", "Technical", "Academic", "Account"]
      },
      "contact_options": {
        "email_support": "support@school.com",
        "phone_support": "+234 800 123 4567",
        "live_chat_available": true,
        "response_time": "24 hours"
      },
      "app_info": {
        "version": "1.0.0",
        "build_number": "2024.01.15",
        "last_updated": "2024-01-13",
        "minimum_ios_version": "12.0",
        "minimum_android_version": "8.0"
      }
    }
  },
  "statusCode": 200
}
```

### Error Response Examples

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

#### 404 User Not Found
```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

#### 404 Student Record Not Found
```json
{
  "success": false,
  "message": "Student record not found",
  "statusCode": 404
}
```

#### 404 Student Class Not Found
```json
{
  "success": false,
  "message": "Student class not found",
  "statusCode": 404
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch profile data",
  "statusCode": 500
}
```

## Testing Examples

### Postman Collection
```json
{
  "info": {
    "name": "User Profile API",
    "description": "API for user profile management"
  },
  "item": [
    {
      "name": "Get User Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{auth_token}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/v1/user/profile",
          "host": ["{{base_url}}"],
          "path": ["api", "v1", "user", "profile"]
        }
      }
    }
  ]
}
```

### Jest Test Example
```javascript
describe('User Profile API', () => {
  test('should return user profile data', async () => {
    const response = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('general_info');
    expect(response.body.data).toHaveProperty('academic_info');
    expect(response.body.data).toHaveProperty('settings');
    expect(response.body.data).toHaveProperty('support_info');
  });

  test('should return 401 for missing token', async () => {
    await request(app)
      .get('/api/v1/user/profile')
      .expect(401);
  });
});
```
