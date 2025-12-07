# Director Results API Documentation

## Overview
This API provides endpoints for school directors to release and view student results. Directors can release results for individual students, specific classes, or the entire school.

---

## Endpoints

### 1. Release Results for Whole School
**POST** `/api/v1/director/results/release`

Release results for all students in the current academic session.

**Authentication:** Required (Bearer Token)

**Request Body:** None

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results released successfully for X students",
  "data": {
    "total_students": 150,
    "processed": 150,
    "errors": 0,
    "session": {
      "id": "session123",
      "academic_year": "2024/2025",
      "term": "FIRST_TERM"
    }
  },
  "statusCode": 200
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden - Director role required
- `404` - No current session or students found

---

### 2. Release Results for Single Student
**POST** `/api/v1/director/results/release/student/:studentId`

Release results for a specific student.

**Authentication:** Required (Bearer Token)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentId` | string | Yes | Student ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | No | Academic session ID (defaults to current active session) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results released successfully for student",
  "data": {
    "student_id": "student123",
    "session": {
      "id": "session123",
      "academic_year": "2024/2025",
      "term": "FIRST_TERM"
    }
  },
  "statusCode": 200
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden - Director role required
- `404` - Student not found

---

### 3. Release Results for Class
**POST** `/api/v1/director/results/release/class/:classId`

Release results for all students in a specific class.

**Authentication:** Required (Bearer Token)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classId` | string | Yes | Class ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | No | Academic session ID (defaults to current active session) |

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results released successfully for X students in class",
  "data": {
    "class_id": "class123",
    "total_students": 35,
    "processed": 35,
    "errors": 0,
    "session": {
      "id": "session123",
      "academic_year": "2024/2025",
      "term": "FIRST_TERM"
    }
  },
  "statusCode": 200
}
```

**Error Responses:**
- `401` - Unauthorized
- `403` - Forbidden - Director role required
- `404` - Class or students not found

---

### 4. Get Results Dashboard
**GET** `/api/v1/director/results/dashboard`

Get results dashboard data with sessions, classes, subjects, and paginated results.

**Authentication:** Required (Bearer Token)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | No | Academic session ID (defaults to current active session) |
| `class_id` | string | No | Class ID (defaults to first class) |
| `subject_id` | string | No | Subject ID (filters results by subject) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 10) |

**Response (200 OK):**
See `RESULT_API_DOCUMENTATION.md` for detailed response structure.

**Error Responses:**
- `403` - Forbidden - Director role required

---

## Notes

1. **Result Release**: When results are released by the director, the `released_by_school_admin` flag is set to `true`. Only results with this flag can be viewed by students.

2. **Batch Processing**: The whole school release operation processes students in batches to avoid system overload.

3. **Session Default**: If no `session_id` is provided, the system uses the current active session.

4. **Class Positions**: After releasing results, class positions are automatically calculated for all students.

---

## Related Documentation

- See `RESULT_API_DOCUMENTATION.md` for detailed dashboard response structure and frontend implementation notes.

