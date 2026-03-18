# Student Profile – Frontend API

**Endpoint:** `GET /api/v1/user/profile`  
**Auth:** Required. Send school JWT in header: `Authorization: Bearer <token>`  
**Who:** Authenticated user with a **student** record (returns error if user has no student record).

---

## Success response wrapper

All success responses use this wrapper:

```json
{
  "success": true,
  "message": "Profile data retrieved successfully",
  "data": { ... }
}
```

---

## Full response structure (`data`)

```json
{
  "general_info": {
    "school": {
      "id": "string",
      "name": "string"
    },
    "student": {
      "id": "string",
      "user_id": "string",
      "name": "string",
      "email": "string",
      "phone": "string | null",
      "date_of_birth": "string | null",
      "display_picture": "object | null",
      "student_id": "string | null",
      "admission_number": "string | null",
      "emergency_contact_name": "string | null",
      "emergency_contact_phone": "string | null",
      "address": {
        "street": "string | null",
        "city": "string | null",
        "state": "string | null",
        "country": "string | null",
        "postal_code": "string | null"
      }
    },
    "student_class": {
      "id": "string",
      "name": "string | null",
      "class_teacher": {
        "id": "string",
        "name": "string",
        "display_picture": "object | null"
      }
    } | null,
    "current_session": {
      "id": "string",
      "academic_year": "string",
      "term": "first | second | third",
      "start_date": "string | null",
      "end_date": "string | null",
      "is_current": true
    } | null
  },
  "academic_info": {
    "subjects_enrolled": [
      {
        "id": "string",
        "name": "string",
        "code": "string | null",
        "color": "string",
        "teacher_name": "string"
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
        "date_earned": "string",
        "type": "string"
      }
    ]
  },
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
  },
  "support_info": {
    "help_center": {
      "faq_count": "number",
      "last_updated": "string",
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
      "last_updated": "string",
      "minimum_ios_version": "string",
      "minimum_android_version": "string"
    }
  }
}
```

---

## TypeScript types (for frontend)

```ts
interface StudentProfileResponse {
  success: boolean;
  message: string;
  data: {
    general_info: {
      school: { id: string; name: string } | null;
      student: {
        id: string;
        user_id: string;
        name: string;
        email: string;
        phone: string | null;
        date_of_birth: string | null;
        display_picture: unknown | null;
        student_id: string | null;
        admission_number: string | null;
        emergency_contact_name: string | null;
        emergency_contact_phone: string | null;
        address: {
          street: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          postal_code: string | null;
        };
      };
      student_class: {
        id: string;
        name: string | null;
        class_teacher: {
          id: string;
          name: string;
          display_picture: unknown | null;
        } | null;
      } | null;
      current_session: {
        id: string;
        academic_year: string;
        term: 'first' | 'second' | 'third';
        start_date: string | null;
        end_date: string | null;
        is_current: boolean;
      } | null;
    };
    academic_info: {
      subjects_enrolled: Array<{
        id: string;
        name: string;
        code: string | null;
        color: string;
        teacher_name: string;
      }>;
      performance_summary: {
        average_score: number;
        total_assessments: number;
        passed_assessments: number;
        failed_assessments: number;
        current_rank: number;
        total_students: number;
        grade_point_average: number;
        attendance_percentage: number;
      };
      recent_achievements: Array<{
        id: string;
        title: string;
        description: string;
        date_earned: string;
        type: string;
      }>;
    };
    settings: {
      notifications: Record<string, boolean>;
      app_preferences: Record<string, boolean>;
      privacy: Record<string, boolean | string>;
    };
    support_info: {
      help_center: { faq_count: number; last_updated: string; categories: string[] };
      contact_options: Record<string, unknown>;
      app_info: Record<string, string>;
    };
  } | null;
}
```

---

## Example (minimal success response)

```json
{
  "success": true,
  "message": "Profile data retrieved successfully",
  "data": {
    "general_info": {
      "school": { "id": "school_1", "name": "Demo School" },
      "student": {
        "id": "student_1",
        "user_id": "user_1",
        "name": "Jane Doe",
        "email": "jane@school.com",
        "phone": "+2348012345678",
        "date_of_birth": "2010-05-15",
        "display_picture": null,
        "student_id": "STU/2024/001",
        "admission_number": "ADM001",
        "emergency_contact_name": "John Doe",
        "emergency_contact_phone": "+2348098765432",
        "address": {
          "street": "10 School Road",
          "city": "Lagos",
          "state": "Lagos",
          "country": "Nigeria",
          "postal_code": "100001"
        }
      },
      "student_class": {
        "id": "class_1",
        "name": "SS 1A",
        "class_teacher": {
          "id": "teacher_1",
          "name": "Mr. Smith",
          "display_picture": null
        }
      },
      "current_session": {
        "id": "session_1",
        "academic_year": "2024/2025",
        "term": "first",
        "start_date": "2024-09-01",
        "end_date": "2024-12-20",
        "is_current": true
      }
    },
    "academic_info": {
      "subjects_enrolled": [
        {
          "id": "subj_1",
          "name": "Mathematics",
          "code": "MTH",
          "color": "#3B82F6",
          "teacher_name": "Mr. Smith"
        }
      ],
      "performance_summary": {
        "average_score": 72.5,
        "total_assessments": 10,
        "passed_assessments": 8,
        "failed_assessments": 2,
        "current_rank": 15,
        "total_students": 45,
        "grade_point_average": 3.2,
        "attendance_percentage": 95.5
      },
      "recent_achievements": []
    },
    "settings": { ... },
    "support_info": { ... }
  }
}
```

---

## When student has no class

- `general_info.student_class` is `null`.
- `academic_info.subjects_enrolled` is `[]`.
- `academic_info.performance_summary.total_students` is `0`.
- Rest of the payload is unchanged; `current_session` and `school` still populated when available.

---

## Error responses

| Status | Condition | Body |
|--------|-----------|------|
| 401 | Missing or invalid token | Unauthorized |
| 200 | User not found | `{ "success": false, "message": "User not found", "data": null }` |
| 200 | User has no student record | `{ "success": false, "message": "Student record not found", "data": null }` |

---

## Base URL

Prepend your API base (e.g. `https://api.example.com` or `http://localhost:1000`):

- Full URL: `{BASE_URL}/api/v1/user/profile`
