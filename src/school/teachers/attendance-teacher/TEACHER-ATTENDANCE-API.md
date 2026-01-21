# Teacher Attendance API Documentation

**Base URL:** `/api/v1/teachers/attendance`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**Audience:** These endpoints are for **teachers** to manage attendance for classes they teach.

---

## Table of Contents
1. [Integration Flow Overview](#integration-flow-overview)
2. [Get Session Details and Classes](#1-get-session-details-and-classes)
3. [Get Students for Class](#2-get-students-for-class)
4. [Get Attendance for Date](#3-get-attendance-for-date)
5. [Submit Attendance](#4-submit-attendance)
6. [Update Attendance](#5-update-attendance)
7. [Get Student Attendance](#6-get-student-attendance)

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

## Integration Flow Overview

**Recommended flow for frontend integration:**

1. **First Call** - Get session details and classes:
   - `GET /api/v1/teachers/attendance/getsessiondetailsandclasses`
   - Use this to populate the attendance dashboard with available classes

2. **Second Call** - Get students for selected class:
   - `GET /api/v1/teachers/attendance/classes/{classId}/students`
   - Load the student list for the class you want to mark attendance for

3. **Third Call** - Check existing attendance for date (optional but recommended):
   - `GET /api/v1/teachers/attendance/classes/{classId}/date/{date}`
   - Check if attendance already exists for the selected date
   - If `session_id` is null → use POST to create new attendance
   - If `session_id` exists → use PATCH to update existing attendance

4. **Fourth Call** - Submit or Update attendance:
   - **New attendance:** `POST /api/v1/teachers/attendance/submit`
   - **Update existing:** `PATCH /api/v1/teachers/attendance/update`

5. **Optional** - View student attendance history:
   - `GET /api/v1/teachers/attendance/students/{studentId}?year=YYYY&month=MM`

---

## 1. Get Session Details and Classes

Get current academic session details and classes assigned to the teacher for attendance management.

**Endpoint:** `GET /api/v1/teachers/attendance/getsessiondetailsandclasses`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /api/v1/teachers/attendance/getsessiondetailsandclasses
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Session details and classes retrieved successfully",
  "data": {
    "classes_managing": [
      {
        "id": "class-uuid-1",
        "name": "JSS 1A",
        "code": "JSS1A",
        "subject": "Class Teacher",
        "teacher_name": "John Doe",
        "room": "Room 101",
        "total_students": 30
      },
      {
        "id": "class-uuid-2",
        "name": "JSS 1B",
        "code": "JSS1B",
        "subject": "Class Teacher",
        "teacher_name": "John Doe",
        "room": "Room 102",
        "total_students": 28
      }
    ],
    "academic_sessions": [
      {
        "academic_year": "2024/2025",
        "term": "first",
        "term_start_date": "2024-09-01",
        "term_end_date": "2024-12-20",
        "current_date": "2024-01-16",
        "is_current": true
      },
      {
        "academic_year": "2023/2024",
        "term": "third",
        "term_start_date": "2024-04-01",
        "term_end_date": "2024-07-15",
        "current_date": "2024-01-16",
        "is_current": false
      }
    ]
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    classes_managing: Array<{
      id: string;
      name: string;
      code: string;
      subject: string;              // Usually "Class Teacher"
      teacher_name: string;
      room: string;                 // Room number or "TBD"
      total_students: number;
    }>;
    academic_sessions: Array<{
      academic_year: string;        // Format: "YYYY/YYYY"
      term: string;                 // "first", "second", "third"
      term_start_date: string;      // YYYY-MM-DD
      term_end_date: string;        // YYYY-MM-DD
      current_date: string;         // YYYY-MM-DD
      is_current: boolean;          // true for current session
    }>;
  };
}
```

**Important Notes:**

1. **Classes Shown:** Only classes where the authenticated teacher is the **class teacher**
2. **Academic Sessions:** Shows up to 3 most recent sessions
3. **Current Session:** The session with `is_current: true` is the active session
4. **Director Access:** School directors can access all classes in the school

**Error Responses:**

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**400 Bad Request - No Academic Sessions:**
```json
{
  "success": false,
  "message": "No academic sessions found",
  "data": null
}
```

**400 Bad Request - No Current Session:**
```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to fetch session details and classes",
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

## 2. Get Students for Class

Get paginated list of students in a specific class for attendance marking.

**Endpoint:** `GET /api/v1/teachers/attendance/classes/:classId/students`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| classId | string | Yes | Class ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number (1-based) |
| limit | number | No | 10 | Items per page (max 100) |

**Example Request:**
```
GET /api/v1/teachers/attendance/classes/class-uuid-1/students?page=1&limit=10
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Students retrieved successfully",
  "data": {
    "students": [
      {
        "id": "student-uuid-1",
        "user_id": "user-uuid-1",
        "student_id": "smh/2024/001",
        "admission_number": "STD/2024/001",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@school.edu.ng",
        "phone_number": "+2348012345678",
        "display_picture": "https://example.com/photo.jpg",
        "gender": "female",
        "status": "active"
      },
      {
        "id": "student-uuid-2",
        "user_id": "user-uuid-2",
        "student_id": "smh/2024/002",
        "admission_number": "STD/2024/002",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.edu.ng",
        "phone_number": "+2348087654321",
        "display_picture": "https://example.com/photo2.jpg",
        "gender": "male",
        "status": "active"
      }
    ],
    "class_info": {
      "id": "class-uuid-1",
      "name": "JSS 1A",
      "class_teacher": "John Doe",
      "room": "Room 101",
      "total_students": 30
    },
    "pagination": {
      "total": 30,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    students: Array<{
      id: string;                   // Student record ID
      user_id: string;              // User ID
      student_id: string;           // Formatted ID (smh/YYYY/###)
      admission_number: string | null;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      display_picture: string | null;
      gender: string;
      status: string;               // "active", "inactive", "suspended"
    }>;
    class_info: {
      id: string;
      name: string;
      class_teacher: string;
      room: string;
      total_students: number;
    };
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
}
```

**Important Notes:**

1. **Only Active Students:** Only students with `status: "active"` are returned
2. **Sorted:** Students are sorted alphabetically by first name
3. **Max Limit:** Maximum 100 students per page
4. **Authorization:** Teacher must be the class teacher for the specified class

**Error Responses:**

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**400 Bad Request - No Academic Session:**
```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null
}
```

**404 Not Found - Class Not Found:**
```json
{
  "success": false,
  "message": "Class not found",
  "data": null
}
```

**403 Forbidden - Not Authorized:**
```json
{
  "success": false,
  "message": "You are not authorized to view students for this class",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to retrieve students",
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

## 3. Get Attendance for Date

Get attendance records for a specific class on a specific date.

**Endpoint:** `GET /api/v1/teachers/attendance/classes/:classId/date/:date`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| classId | string | Yes | Class ID |
| date | string | Yes | Date in YYYY-MM-DD format |

**Example Request:**
```
GET /api/v1/teachers/attendance/classes/class-uuid-1/date/2024-01-15
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Attendance retrieved successfully",
  "data": {
    "session_id": "attendance-session-uuid-1",
    "class_id": "class-uuid-1",
    "class_name": "JSS 1A",
    "date": "2024-01-15",
    "session_type": "DAILY",
    "status": "SUBMITTED",
    "submitted_at": "2024-01-15T08:30:00Z",
    "submitted_by": "teacher-uuid-1",
    "notes": "All students present today",
    "statistics": {
      "total_students": 30,
      "present_count": 28,
      "absent_count": 2,
      "late_count": 0,
      "excused_count": 1,
      "partial_count": 0,
      "attendance_rate": 93.33
    },
    "attendance_records": [
      {
        "id": "record-uuid-1",
        "student_id": "student-uuid-1",
        "student_user_id": "user-uuid-1",
        "student_name": "Jane Smith",
        "student_email": "jane.smith@school.edu.ng",
        "student_number": "smh/2024/001",
        "display_picture": "https://example.com/photo.jpg",
        "status": "PRESENT",
        "reason": null,
        "is_excused": false,
        "excuse_note": null,
        "marked_at": "2024-01-15T08:30:00Z"
      },
      {
        "id": "record-uuid-2",
        "student_id": "student-uuid-2",
        "student_user_id": "user-uuid-2",
        "student_name": "John Doe",
        "student_email": "john.doe@school.edu.ng",
        "student_number": "smh/2024/002",
        "display_picture": "https://example.com/photo2.jpg",
        "status": "ABSENT",
        "reason": "Sick",
        "is_excused": true,
        "excuse_note": "Doctor's note provided",
        "marked_at": "2024-01-15T08:30:00Z"
      }
    ]
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    session_id: string | null;     // null if no attendance submitted yet
    class_id: string;
    class_name: string;
    date: string;                   // YYYY-MM-DD
    session_type: string;           // "DAILY", "MORNING", "AFTERNOON", etc.
    status: string | null;          // "SUBMITTED", "DRAFT", null if not submitted
    submitted_at: string | null;    // ISO 8601 timestamp
    submitted_by: string | null;    // Teacher ID
    notes: string | null;
    statistics: {
      total_students: number;
      present_count: number;
      absent_count: number;
      late_count: number;
      excused_count: number;
      partial_count: number;
      attendance_rate: number;      // Percentage (0-100)
    };
    attendance_records: Array<{
      id: string | null;            // null if not submitted yet
      student_id: string;
      student_user_id: string;
      student_name: string;
      student_email: string;
      student_number: string;
      display_picture: string | null;
      status: string | null;        // "PRESENT", "ABSENT", "LATE", "EXCUSED", "PARTIAL"
      reason: string | null;
      is_excused: boolean;
      excuse_note: string | null;
      marked_at: string | null;     // ISO 8601 timestamp
    }>;
  };
}
```

**Important Notes:**

1. **No Attendance Yet:** If attendance hasn't been submitted for the date, `session_id` will be `null` and `attendance_records` will have `status: null` for all students
2. **Date Format:** Date must be in YYYY-MM-DD format
3. **Statistics:** Automatically calculated from attendance records
4. **Attendance Rate:** Calculated as (present_count + late_count) / total_students * 100

**Error Responses:**

**400 Bad Request - Invalid Date:**
```json
{
  "success": false,
  "message": "Invalid date format. Please use YYYY-MM-DD format",
  "data": null
}
```

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**400 Bad Request - No Academic Session:**
```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null
}
```

**404 Not Found - Class Not Found:**
```json
{
  "success": false,
  "message": "Class not found",
  "data": null
}
```

**403 Forbidden - Not Authorized:**
```json
{
  "success": false,
  "message": "You are not authorized to view attendance for this class",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to retrieve attendance",
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

## 4. Submit Attendance

Submit attendance records for a class on a specific date.

**Endpoint:** `POST /api/v1/teachers/attendance/submit`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| class_id | string | Yes | Class ID |
| date | string | Yes | Date in YYYY-MM-DD format |
| session_type | string | No | Type of session (default: "DAILY") |
| attendance_records | array | Yes | Array of attendance records |
| notes | string | No | Optional notes about the session |

**Attendance Record Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| student_id | string | Yes | Student ID |
| status | string | Yes | Attendance status |
| reason | string | No | Reason for absence/lateness |
| is_excused | boolean | No | Whether absence is excused |
| excuse_note | string | No | Excuse note or details |

**Attendance Status Values:**
- `PRESENT` - Student is present
- `ABSENT` - Student is absent
- `LATE` - Student arrived late
- `EXCUSED` - Student has excused absence
- `PARTIAL` - Student attended partial day

**Session Type Values:**
- `DAILY` (default)
- `MORNING`
- `AFTERNOON`
- `EVENING`
- `SPECIAL`

**Example Request:**
```json
{
  "class_id": "class-uuid-1",
  "date": "2024-01-15",
  "session_type": "DAILY",
  "attendance_records": [
    {
      "student_id": "student-uuid-1",
      "status": "PRESENT"
    },
    {
      "student_id": "student-uuid-2",
      "status": "ABSENT",
      "reason": "Sick",
      "is_excused": true,
      "excuse_note": "Doctor's note provided"
    },
    {
      "student_id": "student-uuid-3",
      "status": "LATE",
      "reason": "Traffic"
    }
  ],
  "notes": "Normal attendance day"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Attendance submitted successfully",
  "data": {
    "session_id": "attendance-session-uuid-1",
    "class_id": "class-uuid-1",
    "date": "2024-01-15",
    "status": "SUBMITTED",
    "total_students": 30,
    "present_count": 28,
    "absent_count": 1,
    "late_count": 1,
    "excused_count": 1,
    "attendance_rate": 96.67
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    session_id: string;
    class_id: string;
    date: string;
    status: string;                 // "SUBMITTED"
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_rate: number;        // Percentage
  };
}
```

**Important Notes:**

1. **Student Validation:** All student IDs in `attendance_records` must be valid students in the specified class
2. **Duplicate Prevention:** Cannot submit attendance if it already exists for the date (use PATCH to update)
3. **Transaction:** All records are created in a database transaction (all or nothing)
4. **Statistics:** Automatically calculated and stored with the session

**Error Responses:**

**400 Bad Request - Invalid Date:**
```json
{
  "success": false,
  "message": "Invalid date format. Please use YYYY-MM-DD format",
  "data": null
}
```

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**400 Bad Request - No Academic Session:**
```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null
}
```

**404 Not Found - Class Not Found:**
```json
{
  "success": false,
  "message": "Class not found or you are not authorized to manage this class",
  "data": null
}
```

**400 Bad Request - Already Exists:**
```json
{
  "success": false,
  "message": "Attendance for this date has already been submitted",
  "data": null
}
```

**400 Bad Request - Invalid Student IDs:**
```json
{
  "success": false,
  "message": "Some student IDs are invalid for this class",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to submit attendance",
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

## 5. Update Attendance

Update attendance records for specific students (partial update).

**Endpoint:** `PATCH /api/v1/teachers/attendance/update`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| class_id | string | Yes | Class ID |
| date | string | Yes | Date in YYYY-MM-DD format |
| attendance_records | array | Yes | Array of attendance records to update |
| notes | string | No | Optional notes about the update |

**Attendance Record Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| student_id | string | Yes | Student ID |
| status | string | Yes | New attendance status |
| reason | string | No | Reason for absence/lateness |
| is_excused | boolean | No | Whether absence is excused |
| excuse_note | string | No | Excuse note or details |

**Example Request:**
```json
{
  "class_id": "class-uuid-1",
  "date": "2024-01-15",
  "attendance_records": [
    {
      "student_id": "student-uuid-2",
      "status": "EXCUSED",
      "reason": "Medical appointment",
      "is_excused": true,
      "excuse_note": "Doctor's appointment confirmed"
    },
    {
      "student_id": "student-uuid-3",
      "status": "PRESENT"
    }
  ],
  "notes": "Updated attendance after receiving excuse notes"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Attendance updated successfully",
  "data": {
    "session_id": "attendance-session-uuid-1",
    "class_id": "class-uuid-1",
    "date": "2024-01-15",
    "status": "SUBMITTED",
    "total_students": 30,
    "present_count": 29,
    "absent_count": 0,
    "late_count": 0,
    "excused_count": 1,
    "attendance_rate": 96.67
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    session_id: string;
    class_id: string;
    date: string;
    status: string;
    total_students: number;
    present_count: number;
    absent_count: number;
    late_count: number;
    excused_count: number;
    attendance_rate: number;
  };
}
```

**Important Notes:**

1. **Partial Update:** Only updates records for students specified in the request
2. **Other Students:** Students not in the request remain unchanged
3. **Session Must Exist:** Attendance must have been submitted first using POST endpoint
4. **Statistics Recalculation:** Statistics are automatically recalculated after update

**Error Responses:**

**400 Bad Request - Invalid Date:**
```json
{
  "success": false,
  "message": "Invalid date format. Please use YYYY-MM-DD format",
  "data": null
}
```

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**400 Bad Request - No Academic Session:**
```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null
}
```

**404 Not Found - Class Not Found:**
```json
{
  "success": false,
  "message": "Class not found or you are not authorized to manage this class",
  "data": null
}
```

**400 Bad Request - No Session Found:**
```json
{
  "success": false,
  "message": "No attendance session found for this date. Please submit attendance first.",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to update attendance",
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

## 6. Get Student Attendance

Get attendance history and summary for a specific student for a given month.

**Endpoint:** `GET /api/v1/teachers/attendance/students/:studentId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| studentId | string | Yes | Student ID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| year | number | No | Current year | Year to fetch attendance for |
| month | number | No | Current month | Month to fetch attendance for (1-12) |

**Example Request:**
```
GET /api/v1/teachers/attendance/students/student-uuid-1?year=2024&month=9
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Student attendance retrieved successfully",
  "data": {
    "student": {
      "id": "student-uuid-1",
      "user_id": "user-uuid-1",
      "student_id": "smh/2024/001",
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.smith@school.edu.ng",
      "display_picture": "https://example.com/photo.jpg",
      "class_id": "class-uuid-1",
      "class_name": "JSS 1A"
    },
    "period": {
      "year": 2024,
      "month": 9,
      "month_name": "September",
      "start_date": "2024-09-01",
      "end_date": "2024-09-30",
      "school_days": 22
    },
    "summary": {
      "total_days": 22,
      "present_count": 20,
      "absent_count": 1,
      "late_count": 1,
      "excused_count": 1,
      "partial_count": 0,
      "attendance_rate": 95.45
    },
    "attendance_records": [
      {
        "date": "2024-09-02",
        "day_of_week": "Monday",
        "status": "PRESENT",
        "reason": null,
        "is_excused": false,
        "excuse_note": null,
        "marked_at": "2024-09-02T08:30:00Z"
      },
      {
        "date": "2024-09-03",
        "day_of_week": "Tuesday",
        "status": "ABSENT",
        "reason": "Sick",
        "is_excused": true,
        "excuse_note": "Doctor's note provided",
        "marked_at": "2024-09-03T08:30:00Z"
      },
      {
        "date": "2024-09-04",
        "day_of_week": "Wednesday",
        "status": "LATE",
        "reason": "Traffic",
        "is_excused": false,
        "excuse_note": null,
        "marked_at": "2024-09-04T09:15:00Z"
      }
    ]
  }
}
```

**Response Structure:**

```typescript
{
  success: true;
  message: string;
  data: {
    student: {
      id: string;
      user_id: string;
      student_id: string;
      first_name: string;
      last_name: string;
      email: string;
      display_picture: string | null;
      class_id: string;
      class_name: string;
    };
    period: {
      year: number;
      month: number;
      month_name: string;
      start_date: string;           // YYYY-MM-DD
      end_date: string;             // YYYY-MM-DD
      school_days: number;          // Total school days in month
    };
    summary: {
      total_days: number;
      present_count: number;
      absent_count: number;
      late_count: number;
      excused_count: number;
      partial_count: number;
      attendance_rate: number;      // Percentage
    };
    attendance_records: Array<{
      date: string;                 // YYYY-MM-DD
      day_of_week: string;          // "Monday", "Tuesday", etc.
      status: string;               // "PRESENT", "ABSENT", "LATE", "EXCUSED", "PARTIAL"
      reason: string | null;
      is_excused: boolean;
      excuse_note: string | null;
      marked_at: string;            // ISO 8601 timestamp
    }>;
  };
}
```

**Important Notes:**

1. **Default Period:** Defaults to current year and month if not specified
2. **School Days:** Only includes days when school was in session (excludes weekends/holidays)
3. **Sorted:** Records are sorted chronologically
4. **Authorization:** Teacher must be managing a class that includes this student

**Error Responses:**

**404 Not Found - Student Not Found:**
```json
{
  "success": false,
  "message": "Student not found",
  "data": null
}
```

**403 Forbidden - Not Authorized:**
```json
{
  "success": false,
  "message": "You are not authorized to view this student's attendance",
  "data": null
}
```

**400 Bad Request - Invalid Parameters:**
```json
{
  "success": false,
  "message": "Invalid year or month parameter",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to retrieve student attendance",
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

## Common Response Format

**ALL ENDPOINTS** follow this structure:

```typescript
{
  success: boolean;      // true = success, false = error
  message: string;       // Human-readable message
  data: object | null;   // Response data (object when success=true, null when success=false)
}
```

### Success Response Pattern
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // ... response data here ...
  }
}
```

### Error Response Pattern
```json
{
  "success": false,
  "message": "Error description here",
  "data": null
}
```

**⚠️ CRITICAL FOR FRONTEND:**
- **Always check `success` field first**
- **Only access `data` when `success === true`**
- **`data` will always be `null` when `success === false`**

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Attendance submitted successfully |
| 400 | Bad Request - Invalid request data or validation error |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Not authorized to access this resource |
| 404 | Not Found - Resource not found (teacher, class, student) |
| 500 | Internal Server Error - Server error occurred |

---

## Data Types & Enums

### Attendance Status Enum
```typescript
enum AttendanceStatus {
  PRESENT = 'PRESENT',        // Student is present
  ABSENT = 'ABSENT',          // Student is absent
  LATE = 'LATE',              // Student arrived late
  EXCUSED = 'EXCUSED',        // Excused absence
  PARTIAL = 'PARTIAL'         // Partial day attendance
}
```

### Session Type Enum
```typescript
enum SessionType {
  DAILY = 'DAILY',            // Regular daily attendance
  MORNING = 'MORNING',        // Morning session
  AFTERNOON = 'AFTERNOON',    // Afternoon session
  EVENING = 'EVENING',        // Evening session
  SPECIAL = 'SPECIAL'         // Special event/session
}
```

### Date Format
- **Format:** `YYYY-MM-DD`
- **Example:** `2024-01-15`
- **Validation:** Must be valid date

---

## Business Logic Notes

### 1. Class Authorization

**Teacher Access:**
- Teachers can only manage attendance for classes where they are the **class teacher**
- The `classTeacherId` field in the class record must match the teacher's ID

**Director Access:**
- School directors can access attendance for all classes in their school
- System automatically detects director role and bypasses class teacher check

### 2. Attendance Submission

**First Time Submission (POST):**
- All student IDs in `attendance_records` must be valid students in the specified class
- Creates new attendance session
- Cannot submit if session already exists for the date (returns error: "Attendance for this date has already been submitted")
- All records created in a database transaction (all or nothing)

**Updates (PATCH):**
- Only updates specified students
- Other students remain unchanged
- Session must exist before updating (returns error: "No attendance session found for this date. Please submit attendance first.")
- Statistics automatically recalculated after update

### 3. Statistics Calculation

**Attendance Rate:**
```
attendance_rate = ((present_count + late_count) / total_students) * 100
```

**Counts:**
- `present_count`: Students with status "PRESENT"
- `absent_count`: Students with status "ABSENT"
- `late_count`: Students with status "LATE"
- `excused_count`: Students with `is_excused: true`
- `partial_count`: Students with status "PARTIAL"

### 4. Student Attendance History

**Month View:**
- Shows all attendance records for the specified month
- Only includes school days (excludes weekends/holidays)
- Calculates summary statistics for the month
- Sorted chronologically

**Authorization:**
- Teacher must manage a class that includes the student
- Directors can view any student in their school

---

## Example Usage (JavaScript/TypeScript)

### Fetching Session Details and Classes

```typescript
const fetchAttendanceOverview = async () => {
  try {
    const response = await fetch('/api/v1/teachers/attendance/getsessiondetailsandclasses', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { classes_managing, academic_sessions } = result.data;
      
      console.log('Classes:', classes_managing);
      console.log('Current Session:', academic_sessions.find(s => s.is_current));
      
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to fetch attendance overview');
    return null;
  }
};
```

### Getting Students for Class

```typescript
const fetchStudentsForAttendance = async (classId, page = 1, limit = 30) => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    const response = await fetch(
      `/api/v1/teachers/attendance/classes/${classId}/students?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    if (result.success) {
      const { students, class_info, pagination } = result.data;
      
      console.log('Students:', students);
      console.log('Total:', pagination.total);
      
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};
```

### Checking Existing Attendance for Date

```typescript
const checkAttendanceForDate = async (classId, date) => {
  try {
    const response = await fetch(
      `/api/v1/teachers/attendance/classes/${classId}/date/${date}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    if (result.success) {
      const attendanceData = result.data;
      
      // Check if attendance was already submitted
      if (attendanceData.session_id) {
        console.log('Attendance already submitted');
        console.log('Statistics:', attendanceData.statistics);
        return {
          submitted: true,
          data: attendanceData
        };
      } else {
        console.log('No attendance submitted yet');
        return {
          submitted: false,
          data: attendanceData
        };
      }
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};
```

### Submitting Attendance

```typescript
const submitAttendance = async (classId, date, attendanceRecords, notes = '') => {
  try {
    const response = await fetch('/api/v1/teachers/attendance/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        class_id: classId,
        date: date,  // Format: "YYYY-MM-DD"
        session_type: 'DAILY',
        attendance_records: attendanceRecords.map(record => ({
          student_id: record.studentId,
          status: record.status,  // "PRESENT", "ABSENT", "LATE", etc.
          reason: record.reason || undefined,
          is_excused: record.isExcused || false,
          excuse_note: record.excuseNote || undefined
        })),
        notes: notes
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Attendance submitted successfully');
      console.log('Session:', result.data);
      console.log('Attendance Rate:', result.data.attendance_rate + '%');
      return result.data;
    } else {
      showToast('error', result.message);
      
      // Handle specific errors
      if (result.message.includes('already been submitted')) {
        console.log('Use update endpoint to modify attendance');
      }
      
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to submit attendance');
    return null;
  }
};
```

### Updating Attendance

```typescript
const updateAttendance = async (classId, date, updates, notes = '') => {
  try {
    const response = await fetch('/api/v1/teachers/attendance/update', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        class_id: classId,
        date: date,
        attendance_records: updates.map(update => ({
          student_id: update.studentId,
          status: update.status,
          reason: update.reason || undefined,
          is_excused: update.isExcused || false,
          excuse_note: update.excuseNote || undefined
        })),
        notes: notes
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Attendance updated successfully');
      console.log('Updated statistics:', result.data);
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to update attendance');
    return null;
  }
};
```

### Getting Student Attendance History

```typescript
const fetchStudentAttendanceHistory = async (studentId, year, month) => {
  try {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (month) params.append('month', month.toString());

    const response = await fetch(
      `/api/v1/teachers/attendance/students/${studentId}?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    if (result.success) {
      const { student, period, summary, attendance_records } = result.data;
      
      console.log(`${student.first_name} ${student.last_name}'s Attendance`);
      console.log(`Period: ${period.month_name} ${period.year}`);
      console.log(`Attendance Rate: ${summary.attendance_rate}%`);
      console.log(`Days Present: ${summary.present_count}/${summary.total_days}`);
      
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};
```

---

## UI/UX Recommendations

### 1. Attendance Overview
- **Class Cards:** Show each class with student count, room, and last attendance date
- **Quick Actions:** "Take Attendance" button on each class card
- **Session Indicator:** Highlight current academic session
- **Statistics Badge:** Show overall attendance rate for the current term

### 2. Attendance Marking Interface
- **Date Picker:** Easy date selection with today as default
- **Bulk Actions:** "Mark All Present", "Mark All Absent" quick buttons
- **Student Cards/List:** Show student photo, name, ID
- **Quick Status Toggle:** Tap/click to cycle through statuses
- **Conditional Fields:** Show reason/notes fields only for ABSENT/LATE/EXCUSED
- **Real-time Count:** Show running count of each status type
- **Save Draft:** Auto-save progress locally before submission

### 3. Existing Attendance View
- **Edit Mode:** Allow modifications with visual diff
- **Statistics Display:** Pie chart or bar chart for visual representation
- **Student Filter:** Filter by status (show only absent students, etc.)
- **Excuse Management:** Highlight students needing excuse notes

### 4. Student Attendance History
- **Calendar View:** Month calendar with color-coded days
- **List View:** Chronological list with filters
- **Statistics Cards:** Present days, absent days, attendance rate
- **Trend Graph:** Line graph showing attendance over time
- **Export Option:** PDF or CSV export for reports

### 5. General
- **Loading States:** Skeleton loaders for data fetching
- **Offline Support:** Cache data for offline attendance marking
- **Validation:** Prevent submission without all students marked
- **Confirmation:** Confirm before submitting attendance
- **Success Feedback:** Show statistics immediately after submission

---

## Testing Endpoints

### Using cURL

```bash
# Get session details and classes
curl -X GET "/api/v1/teachers/attendance/getsessiondetailsandclasses" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get students for class
curl -X GET "/api/v1/teachers/attendance/classes/class-uuid-1/students?page=1&limit=30" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Check attendance for date
curl -X GET "/api/v1/teachers/attendance/classes/class-uuid-1/date/2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Submit attendance
curl -X POST "/api/v1/teachers/attendance/submit" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": "class-uuid-1",
    "date": "2024-01-15",
    "session_type": "DAILY",
    "attendance_records": [
      {
        "student_id": "student-uuid-1",
        "status": "PRESENT"
      },
      {
        "student_id": "student-uuid-2",
        "status": "ABSENT",
        "reason": "Sick",
        "is_excused": true
      }
    ]
  }'

# Update attendance
curl -X PATCH "/api/v1/teachers/attendance/update" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": "class-uuid-1",
    "date": "2024-01-15",
    "attendance_records": [
      {
        "student_id": "student-uuid-2",
        "status": "EXCUSED",
        "reason": "Medical appointment",
        "is_excused": true
      }
    ]
  }'

# Get student attendance
curl -X GET "/api/v1/teachers/attendance/students/student-uuid-1?year=2024&month=9" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in all requests
2. **Response Checking:** Always check `success` field before accessing `data`
3. **Error Handling:** Display user-friendly error messages via toasters
4. **Date Format:** Always use YYYY-MM-DD format for dates
5. **All Students Required:** When submitting, include all students in the class
6. **Update vs Submit:** Use POST for first submission, PATCH for updates
7. **Offline Support:** Consider caching for offline attendance marking
8. **Validation:** Validate all students are marked before submission
9. **Statistics Display:** Show attendance statistics visually
10. **Auto-save:** Consider auto-saving draft attendance locally

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 21, 2026

