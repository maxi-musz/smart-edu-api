# Director Results API Documentation

## Overview
This API provides endpoints for school directors to release and view student results. Directors can release results for individual students, specific classes, or the entire school. Results are displayed in a comprehensive table format showing all subjects as columns, with each student's scores, totals, grade, and position.

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

**Example Request:**
```http
POST /api/v1/director/results/release/student/student123?session_id=session123
Authorization: Bearer <your-jwt-token>
```

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

### 3. Release Results for Multiple Students

**POST** `/api/v1/director/results/release/students`

Release results for multiple students by providing an array of student IDs.

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "studentIds": ["student123", "student456", "student789"],
  "sessionId": "session123"
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `studentIds` | string[] | Yes | Array of student IDs (minimum 1) |
| `sessionId` | string | No | Academic session ID (defaults to current active session) |

**Example Request:**
```http
POST /api/v1/director/results/release/students
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "studentIds": ["student123", "student456", "student789"],
  "sessionId": "session123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results released successfully for X students",
  "data": {
    "total_requested": 3,
    "total_found": 3,
    "processed": 3,
    "errors": 0,
    "not_found": [],
    "session": {
      "id": "session123",
      "academic_year": "2024/2025",
      "term": "FIRST_TERM"
    }
  },
  "statusCode": 200
}
```

**Response when some students not found:**
```json
{
  "success": true,
  "message": "Results released successfully for X students",
  "data": {
    "total_requested": 5,
    "total_found": 3,
    "processed": 3,
    "errors": 0,
    "not_found": ["student999", "student888"],
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
- `400` - Bad request - Invalid input or no assessments found
- `401` - Unauthorized
- `403` - Forbidden - Director role required
- `404` - No students found with provided IDs

---

### 4. Release Results for Class

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

**Example Request:**
```http
POST /api/v1/director/results/release/class/class123?session_id=session123
Authorization: Bearer <your-jwt-token>
```

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

### 5. Get Results Dashboard

**GET** `/api/v1/director/results/dashboard`

Get results dashboard data with sessions, classes, subjects, and paginated results.

**Authentication:** Required (Bearer Token)

### Request

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `session_id` | string | No | Academic session ID (defaults to current active session) | `session123` |
| `class_id` | string | No | Class ID (defaults to first class) | `class123` |
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 10) | `10` |

**Note:** There is **NO default subject selection**. The endpoint returns results for all subjects in the selected class.

**Example Request:**
```http
GET /api/v1/director/results/dashboard?session_id=session123&class_id=class123&page=1&limit=10
Authorization: Bearer <your-jwt-token>
```

### Success Response (200 OK)

#### When Results Are Available

```json
{
  "success": true,
  "message": "Results dashboard retrieved successfully",
  "data": {
    "academic_sessions": [
      {
        "id": "session123",
        "academic_year": "2024/2025",
        "term": "FIRST_TERM",
        "start_date": "2024-09-01T00:00:00.000Z",
        "end_date": "2024-12-20T00:00:00.000Z",
        "status": "active",
        "is_current": true,
        "_count": {
          "results": 150
        }
      }
    ],
    "current_session": {
      "id": "session123",
      "academic_year": "2024/2025",
      "term": "FIRST_TERM",
      "status": "active",
      "is_current": true
    },
    "classes": [
      {
        "id": "class123",
        "name": "Grade 10A",
        "classTeacher": {
          "id": "teacher123",
          "first_name": "John",
          "last_name": "Doe",
          "email": "john.doe@school.com"
        },
        "student_count": 35,
        "subject_count": 8
      }
    ],
    "subjects": [
      {
        "id": "subject123",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#3B82F6",
        "description": "Basic Mathematics"
      },
      {
        "id": "subject456",
        "name": "English Language",
        "code": "ENG101",
        "color": "#EF4444",
        "description": "English Language and Literature"
      },
      {
        "id": "subject789",
        "name": "Physics",
        "code": "PHY101",
        "color": "#10B981",
        "description": "Physics Fundamentals"
      }
    ],
    "selected_filters": {
      "sessionId": "session123",
      "classId": "class123",
      "subjectId": null
    },
    "total_students_in_class": 35,
    "results": [
      {
        "student": {
          "id": "student123",
          "userId": "user456",
          "studentNumber": "STU001",
          "firstName": "Alice",
          "lastName": "Johnson",
          "email": "alice.johnson@school.com",
          "displayPicture": {
            "url": "https://example.com/image.jpg",
            "key": "s3-key"
          }
        },
        "subjectScores": {
          "subject123": {
            "subjectId": "subject123",
            "subjectName": "Mathematics",
            "subjectCode": "MATH101",
            "obtained": 85,
            "obtainable": 100,
            "percentage": 85,
            "grade": "A"
          },
          "subject456": {
            "subjectId": "subject456",
            "subjectName": "English Language",
            "subjectCode": "ENG101",
            "obtained": 72,
            "obtainable": 100,
            "percentage": 72,
            "grade": "A"
          },
          "subject789": {
            "subjectId": "subject789",
            "subjectName": "Physics",
            "subjectCode": "PHY101",
            "obtained": 65,
            "obtainable": 100,
            "percentage": 65,
            "grade": "B"
          }
        },
        "totalObtained": 222,
        "totalObtainable": 300,
        "percentage": 74,
        "grade": "A",
        "position": 1,
        "isReleased": true
      },
      {
        "student": {
          "id": "student456",
          "userId": "user789",
          "studentNumber": "STU002",
          "firstName": "Bob",
          "lastName": "Smith",
          "email": "bob.smith@school.com",
          "displayPicture": null
        },
        "subjectScores": {
          "subject123": {
            "subjectId": "subject123",
            "subjectName": "Mathematics",
            "subjectCode": "MATH101",
            "obtained": 78,
            "obtainable": 100,
            "percentage": 78,
            "grade": "A"
          },
          "subject456": {
            "subjectId": "subject456",
            "subjectName": "English Language",
            "subjectCode": "ENG101",
            "obtained": 68,
            "obtainable": 100,
            "percentage": 68,
            "grade": "B"
          },
          "subject789": {
            "subjectId": "subject789",
            "subjectName": "Physics",
            "subjectCode": "PHY101",
            "obtained": 55,
            "obtainable": 100,
            "percentage": 55,
            "grade": "C"
          }
        },
        "totalObtained": 201,
        "totalObtainable": 300,
        "percentage": 67,
        "grade": "B",
        "position": 2,
        "isReleased": true
      },
      {
        "student": {
          "id": "student789",
          "userId": "user012",
          "studentNumber": "STU003",
          "firstName": "Charlie",
          "lastName": "Brown",
          "email": "charlie.brown@school.com",
          "displayPicture": null
        },
        "subjectScores": {
          "subject123": {
            "subjectId": "subject123",
            "subjectName": "Mathematics",
            "subjectCode": "MATH101",
            "obtained": 0,
            "obtainable": 100,
            "percentage": 0,
            "grade": "F"
          },
          "subject456": {
            "subjectId": "subject456",
            "subjectName": "English Language",
            "subjectCode": "ENG101",
            "obtained": 0,
            "obtainable": 100,
            "percentage": 0,
            "grade": "F"
          },
          "subject789": {
            "subjectId": "subject789",
            "subjectName": "Physics",
            "subjectCode": "PHY101",
            "obtained": 0,
            "obtainable": 100,
            "percentage": 0,
            "grade": "F"
          }
        },
        "totalObtained": 0,
        "totalObtainable": 300,
        "percentage": 0,
        "grade": "F",
        "position": 35,
        "isReleased": false
      }
    ],
    "result_message": null,
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 35,
      "totalPages": 4,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "statusCode": 200
}
```

#### When No Results Are Available

```json
{
  "success": true,
  "message": "Results dashboard retrieved successfully",
  "data": {
    "academic_sessions": [
      {
        "id": "session123",
        "academic_year": "2024/2025",
        "term": "FIRST_TERM",
        "start_date": "2024-09-01T00:00:00.000Z",
        "end_date": "2024-12-20T00:00:00.000Z",
        "status": "active",
        "is_current": true,
        "_count": {
          "results": 0
        }
      }
    ],
    "current_session": {
      "id": "session123",
      "academic_year": "2024/2025",
      "term": "FIRST_TERM",
      "status": "active",
      "is_current": true
    },
    "classes": [
      {
        "id": "class123",
        "name": "Grade 10A",
        "classTeacher": {
          "id": "teacher123",
          "first_name": "John",
          "last_name": "Doe",
          "email": "john.doe@school.com"
        },
        "student_count": 35,
        "subject_count": 8
      }
    ],
    "subjects": [],
    "selected_filters": {
      "sessionId": "session123",
      "classId": "class123",
      "subjectId": null
    },
    "total_students_in_class": 35,
    "results": null,
    "result_message": "No result released for this term",
    "pagination": null
  },
  "statusCode": 200
}
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Director role required.",
  "error": null,
  "statusCode": 403
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve results dashboard: <error message>",
  "error": null,
  "statusCode": 500
}
```

---

## TypeScript Interfaces

```typescript
// Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
}

// Results Dashboard Response
interface ResultsDashboardResponse {
  academic_sessions: AcademicSession[];
  current_session: {
    id: string;
    academic_year: string;
    term: string;
    status: string;
    is_current: boolean;
  } | null;
  classes: Class[];
  subjects: Subject[];
  selected_filters: {
    sessionId: string | null;
    classId: string | null;
    subjectId: null; // Always null - no default subject selection
  };
  total_students_in_class: number;
  results: StudentResult[] | null;
  result_message: string | null;
  pagination: Pagination | null;
}

// Academic Session
interface AcademicSession {
  id: string;
  academic_year: string;
  term: 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  is_current: boolean;
  _count: {
    results: number;
  };
}

// Class
interface Class {
  id: string;
  name: string;
  classTeacher: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  student_count: number;
  subject_count: number;
}

// Subject
interface Subject {
  id: string;
  name: string;
  code: string | null;
  color: string;
  description: string | null;
}

// Student Result (Table Row)
interface StudentResult {
  student: {
    id: string;
    userId: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    displayPicture: {
      url: string;
      key: string;
    } | null;
  };
  subjectScores: {
    [subjectId: string]: {
      subjectId: string;
      subjectName: string;
      subjectCode: string | null;
      obtained: number;
      obtainable: number;
      percentage: number;
      grade: 'A' | 'B' | 'C' | 'D' | 'F';
    };
  };
  totalObtained: number;
  totalObtainable: number;
  percentage: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  position: number;
  isReleased: boolean; // True if results are released by admin for this term
}

// Pagination
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

---

## Grade Calculation

Grades are calculated based on the percentage score:

- **A**: 70% and above
- **B**: 60% - 69%
- **C**: 50% - 59%
- **D**: 40% - 49%
- **F**: Below 40%

This applies to both individual subject grades and overall grade.

---

## Default Behavior

1. **Session Selection**: If no `session_id` is provided, defaults to the current active session (where `is_current: true` and `status: 'active'`).

2. **Class Selection**: If no `class_id` is provided, defaults to the first class (alphabetically by name).

3. **Subject Selection**: **NO default subject selection**. The endpoint returns results for **all subjects** in the selected class.

4. **Results Display**: 
   - Returns all students in the selected class
   - Shows scores for each subject in the `subjectScores` object
   - Each subject score includes: obtained, obtainable, percentage, and grade
   - Calculates totals across all subjects
   - Calculates overall percentage and grade
   - Students are sorted by `totalObtained` (descending) and assigned positions

5. **Position Calculation**: Positions are calculated based on `totalObtained` score. Students with the same score get consecutive positions (1, 2, 3, etc.).

6. **Score Calculation**: 
   - For each subject, scores are calculated from CBT and EXAM assessments
   - CBT scores are summed (if multiple CBTs exist)
   - Exam score is added (only one exam per term per subject)
   - If a student hasn't taken an assessment, the score is `0`
   - If no assessments exist for a subject, all scores are `0`

---

## Notes for Frontend

1. **Authentication**: All endpoints require JWT Bearer token in the Authorization header.

2. **Base URL**: Use your API base URL (e.g., `https://your-api.com/api/v1`).

3. **Pagination**: Results are paginated. Use the `pagination` object to implement pagination controls.

4. **Active Session**: The `current_session` object helps identify which session/term is currently active. The `academic_sessions` array is sorted with active sessions first.

5. **Table Display Structure**: 
   - **Column 1**: S/N (Serial Number)
   - **Column 2**: Student Name (or Student Info)
   - **Columns 3-N**: One column for each subject (dynamically generated from `subjects` array)
     - Display: `obtained / obtainable` (e.g., "85/100")
     - Optionally show percentage and grade
   - **Second to Last Column**: Total Obtainable
   - **Second to Last Column**: Total Obtained
   - **Second to Last Column**: Overall Percentage
   - **Second to Last Column**: Overall Grade
   - **Last Column**: Position

6. **Subject Scores**: 
   - The `subjectScores` object uses subject IDs as keys
   - Iterate through the `subjects` array to maintain column order
   - For each subject, check if it exists in `subjectScores[subject.id]`
   - If a subject doesn't have a score entry, display "0/0" or "N/A"

7. **Score Display Format**: 
   - Subject scores: `obtained / obtainable` (e.g., "85/100")
   - Total scores: `totalObtained / totalObtainable` (e.g., "222/300")
   - Percentage: Display as percentage with % sign (e.g., "74%")
   - Grade: Display the letter grade (A, B, C, D, F)

8. **Position**: `position` indicates the student's rank in the class based on total obtained score. Lower number = better rank (1 = first position).

9. **Total Students**: `total_students_in_class` shows the total number of students in the selected class. This helps calculate percentage ranks.

10. **Default Filters**: On initial load, the frontend should call the endpoint without filters to get the default view (current session, first class, all subjects).

11. **Filtering**: Users can change filters by passing different `session_id` and `class_id` values. The endpoint will return results for all subjects in the selected class.

12. **No Results Message**: When `result_message` is not null, display this message to the user. The `results` field will be `null` in this case.

13. **Date Format**: All dates are in ISO 8601 format (UTC).

14. **Display Picture**: Can be `null` or an object with `url` and `key` properties.

15. **Subject Order**: Subjects are ordered alphabetically by name. Use the `subjects` array order to maintain consistent column ordering in the table.

16. **Result Release Status**: Each student result includes an `isReleased` boolean field that indicates whether results have been released by the school admin for the current term. Use this field to:
    - Disable selection/checkbox for students whose results are already released
    - Show visual indicators (e.g., badge, icon) for released results
    - Prevent duplicate releases for the same student/term combination

---

## Usage Example

### Initial Load (Default View)
```http
GET /api/v1/director/results/dashboard
Authorization: Bearer <token>
```
Returns: Current active session, first class, all subjects with all students and their scores

### Filter by Specific Class
```http
GET /api/v1/director/results/dashboard?class_id=class456
Authorization: Bearer <token>
```
Returns: Results for the specified class with all subjects

### Pagination
```http
GET /api/v1/director/results/dashboard?class_id=class123&page=2&limit=20
Authorization: Bearer <token>
```
Returns: Second page with 20 students per page

---

## Table Structure Example

The frontend should display results in a table format like this:

| S/N | Student Name | Mathematics | English | Physics | Total Obtainable | Total Obtained | Percentage | Grade | Position | Released |
|-----|--------------|-------------|---------|---------|------------------|----------------|------------|-------|----------|----------|
| 1 | Alice Johnson | 85/100 (A) | 72/100 (A) | 65/100 (B) | 300 | 222 | 74% | A | 1 | ✅ Yes |
| 2 | Bob Smith | 78/100 (A) | 68/100 (B) | 55/100 (C) | 300 | 201 | 67% | B | 2 | ✅ Yes |
| 3 | Charlie Brown | 0/100 (F) | 0/100 (F) | 0/100 (F) | 300 | 0 | 0% | F | 35 | ❌ No |

**Note**: 
- The number of subject columns is dynamic based on how many subjects exist for the class
- Subject columns should be ordered according to the `subjects` array
- Each subject column can show: score (obtained/obtainable), percentage, and/or grade
- If a student hasn't taken assessments for a subject, show 0/obtainable or N/A
- The `isReleased` field can be used to:
  - Disable checkboxes/selection for students with `isReleased: true`
  - Show visual indicators (badge, icon, or different row styling)
  - Prevent duplicate result releases

---

## Result Release Notes

1. **Result Release Flag**: When results are released by the director, the `released_by_school_admin` flag is set to `true`. Only results with this flag can be viewed by students on their dashboard.

2. **Batch Processing**: The whole school release operation processes students in batches (50 students at a time) to avoid system overload.

3. **Session Default**: If no `session_id` is provided, the system uses the current active session (where `is_current: true` and `status: 'active'`).

4. **Class Positions**: After releasing results, class positions are automatically calculated for all students based on their total obtained scores.

5. **Release Scope**: Directors can release results at four levels:
   - **Single Student**: Release results for one specific student
   - **Multiple Students**: Release results for an array of specific student IDs
   - **Class**: Release results for all students in a specific class
   - **Whole School**: Release results for all students in the current session

6. **Student Visibility**: Students can only view results that have been explicitly released by the school admin/director. Results that haven't been released will not appear in the student's results view.
