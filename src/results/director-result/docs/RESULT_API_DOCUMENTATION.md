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

### 5. Unrelease Results for Whole School

**POST** `/api/v1/director/results/unrelease`

Unrelease results for all students in the current academic session. Sets `released_by_school_admin` to `false`. Results remain in the database but students cannot view them.

**Authentication:** Required (Bearer Token)

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | No | Academic session ID (defaults to current active session) |

**Example Request:**
```http
POST /api/v1/director/results/unrelease?session_id=session123
Authorization: Bearer <your-jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results unreleased successfully for X students",
  "data": {
    "total_updated": 150,
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
- `404` - No current session found

---

### 6. Unrelease Results for Single Student

**POST** `/api/v1/director/results/unrelease/student/:studentId`

Unrelease results for a specific student. Sets `released_by_school_admin` to `false`.

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
POST /api/v1/director/results/unrelease/student/student123?session_id=session123
Authorization: Bearer <your-jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results unreleased successfully for student",
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
- `404` - Result not found

---

### 7. Unrelease Results for Multiple Students

**POST** `/api/v1/director/results/unrelease/students`

Unrelease results for multiple students by providing an array of student IDs.

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
POST /api/v1/director/results/unrelease/students
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
  "message": "Results unreleased successfully for X students",
  "data": {
    "total_requested": 3,
    "total_updated": 3,
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
- `400` - Bad request - Invalid input
- `401` - Unauthorized
- `403` - Forbidden - Director role required

---

### 8. Unrelease Results for Class

**POST** `/api/v1/director/results/unrelease/class/:classId`

Unrelease results for all students in a specific class.

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
POST /api/v1/director/results/unrelease/class/class123?session_id=session123
Authorization: Bearer <your-jwt-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Results unreleased successfully for X students in class",
  "data": {
    "class_id": "class123",
    "total_students": 35,
    "updated": 35,
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

### 9. Get Results Dashboard

**GET** `/api/v1/director/results/dashboard`  
**GET** `/api/v1/director/results/fetch-result-dashboard` (identical response)

Returns the director results preview: **last 10** academic sessions, **all teaching classes** (ordered by `display_order`, graduates sink excluded), subjects for the selected class with **CBT + EXAM** assessment slots, and **paginated** students with per-assessment **obtained / max** (or `null` obtained → UI shows **—**). Does **not** require assessment result release or closed status; directors see scores as soon as attempts exist.

**Authentication:** Required (Bearer Token, `school_director`)

### Request — query parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | No | Defaults to current active session, else latest session |
| `class_id` | string | No | Defaults to first teaching class by `display_order` |
| `page` | number | No | Page (default `1`) |
| `limit` | number | No | Page size (default `10`) |
| `search` | string | No | Case-insensitive match on first name, last name, `student_id`, `admission_number` |
| `q` | string | No | Alias for `search` |
| `student_status` | string | No | `active` \| `suspended` \| `inactive` (default `active`) |

### Success response — `data` shape

- **`academic_sessions`**: up to **10** rows, sorted with current first then `start_year` / `term` descending.
- **`current_session`**: preferred “active” session summary for UI (may differ from `session_id` when user picks an older term).
- **`classes`**: includes `display_order`; excludes `is_graduates` classes.
- **`subjects`**: for the selected session + class, each item includes **`assessments`**: ordered **CBT** (by `order`, then `createdAt`) then **EXAM** (by `createdAt`). Use this for column headers.
- **`results`**: array of rows; each **`subjectScores[subjectId]`** contains:
  - **`caAssessments`**: `{ assessmentId, title, order, obtained: number \| null, max }[]` (CBT only)
  - **`exams`**: `{ assessmentId, title, obtained: number \| null, max }[]`
  - **`caTotalObtained`**, **`caTotalMax`**, **`examTotalObtained`**, **`examTotalMax`**, **`subjectTotalObtained`**, **`subjectTotalMax`**, **`percentage`**, **`grade`**, **`hasAssessments`**
- **`total_students_in_class`**: count matching filters (search + status), not just the current page.
- **`result_message`**: optional human-readable note (e.g. no subjects, no students).
- **`pagination`**: present when session + class are resolved.

**Example:**

```http
GET /api/v1/director/results/fetch-result-dashboard?session_id=session123&class_id=class123&page=1&limit=10&search=ada
Authorization: Bearer <your-jwt-token>
```

### Error Responses

#### 404 Not Found
Invalid `session_id` or `class_id` for this school.

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
  subjects: SubjectWithAssessments[];
  selected_filters: {
    sessionId: string | null;
    classId: string | null;
    search: string | null;
    studentStatus: string;
  };
  total_students_in_class: number;
  results: StudentResult[];
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
  display_order: number;
  classTeacher: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  student_count: number;
  subject_count: number;
}

interface SubjectWithAssessments {
  id: string;
  name: string;
  code: string | null;
  color: string;
  description: string | null;
  assessments: Array<{
    id: string;
    title: string;
    assessment_type: 'CBT' | 'EXAM';
    order: number;
    total_points: number;
  }>;
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
    displayPicture: Record<string, unknown> | null;
  };
  subjectScores: {
    [subjectId: string]: {
      subjectId: string;
      subjectName: string;
      subjectCode: string | null;
      caAssessments: Array<{
        assessmentId: string;
        title: string;
        order: number;
        obtained: number | null;
        max: number;
      }>;
      exams: Array<{
        assessmentId: string;
        title: string;
        obtained: number | null;
        max: number;
      }>;
      caTotalObtained: number;
      caTotalMax: number;
      examTotalObtained: number;
      examTotalMax: number;
      subjectTotalObtained: number;
      subjectTotalMax: number;
      percentage: number | null;
      grade: string | null;
      hasAssessments: boolean;
    };
  };
  totalObtained: number;
  totalObtainable: number;
  percentage: number;
  grade: string;
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

## Default Behavior (dashboard)

1. **Session**: If `session_id` is omitted, uses the current active session (`is_current` + `active`), else the latest session by `start_year` / `term`.

2. **Class**: If `class_id` is omitted, uses the first **teaching** class by **`display_order`** (graduates sink excluded).

3. **Subjects**: All subjects linked to the class for that session; each lists **CBT** then **EXAM** assessments in `subjects[].assessments`.

4. **Students**: Paginated (`page` / `limit`), ordered by last name then first name. **`total_students_in_class`** respects `search` and `student_status`.

5. **Scores**: Best attempt per student per assessment (`SUBMITTED` / `GRADED`). Missing attempt → `obtained: null` (show **—**). Directors see scores **without** requiring `is_result_released` or `CLOSED` on the assessment.

---

## Notes for Frontend (dashboard)

1. **Authentication**: JWT Bearer token; director role only.

2. **Pagination**: Use `pagination` and keep `session_id` / `class_id` / `search` stable when changing page.

3. **Matrix layout**: First column = student (name + school ID). Each subject column can list **CA (CBT)** lines then **Exam** lines using `subjectScores[subjectId].caAssessments` and `.exams`; show `obtained/max` or **—** when `obtained` is `null`.

4. **`result_message`**: Show when set (e.g. no subjects). `results` may still be an empty array.

5. **Subject order**: Use the `subjects` array order for columns.

6. **Alias route**: `GET /director/results/fetch-result-dashboard` matches `GET /director/results/dashboard`.

---

## Usage Example

### Initial load
```http
GET /api/v1/director/results/fetch-result-dashboard
Authorization: Bearer <token>
```

### Class + pagination + search
```http
GET /api/v1/director/results/dashboard?class_id=class123&page=2&limit=20&search=john
Authorization: Bearer <token>
```

---

## Table structure (illustrative)

| Student | Subject: Math (CA1, CA2, Exam, …) | Subject: English (…) | … | Totals |
|---------|-----------------------------------|------------------------|---|--------|
| Name + ID | Stacked scores `obtained/max` or — | … | … | Row `totalObtained` / `totalObtainable` |

**Note:** Column count follows `subjects`. Use `hasAssessments` and per-line `obtained` to render **—** where there is no score yet.

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

6. **Unrelease Functionality**: Directors can also unrelease results (set `released_by_school_admin` to `false`) at the same four levels. When results are unreleased:
   - The result data remains in the database (not deleted)
   - Students cannot view the results (`released_by_school_admin: false`)
   - Directors can re-release them later by calling the release endpoints again
   - This is useful for schools that want to temporarily hide results (e.g., after 24 hours)

7. **Student Visibility**: Students can only view results where `released_by_school_admin: true`. Results that are unreleased or never released will not appear in the student's results view.

8. **Push Notifications**: 
   - When results are **released**, push notifications are automatically sent to all affected students
   - When results are **unreleased**, push notifications are automatically sent to all affected students
   - Notification title: "📊 Results Released" or "🔒 Results Unreleased"
   - Notification includes academic year, term, and deep link to results screen
   - Notifications are sent asynchronously and won't block the release/unrelease operation
