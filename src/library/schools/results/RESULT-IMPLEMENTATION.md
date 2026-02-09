# Library School Results API – Frontend Implementation

**Base path:** `/api/v1/library/schools/:schoolId/results`  
**Auth:** Library JWT (Bearer `library-jwt`). Library owner role required.

---

## 1. Release results (whole school)

- **Method:** `POST`
- **Path:** `/api/v1/library/schools/:schoolId/results/release`
- **Params:**
  - Path: `schoolId` (string)
  - Query: none
  - Body: none

**Success (200):**

```json
{
  "success": true,
  "message": "Results released successfully for {n} students",
  "data": {
    "total_students": number,
    "processed": number,
    "errors": number,
    "session": {
      "id": string,
      "academic_year": string,
      "term": string
    }
  }
}
```

**Error (4xx/5xx):** `{ "success": false, "message": string, "data": null }` or `{ "success": false, "message": string, "error": null, "statusCode": number }`

---

## 2. Release results for one student

- **Method:** `POST`
- **Path:** `/api/v1/library/schools/:schoolId/results/release/student/:studentId`
- **Params:**
  - Path: `schoolId` (string), `studentId` (string)
  - Query: `session_id` (string, optional)
  - Body: none

**Success (200):**

```json
{
  "success": true,
  "message": "Results released successfully for student",
  "data": {
    "student_id": string,
    "session": {
      "id": string,
      "academic_year": string,
      "term": string
    }
  },
  "statusCode": 200
}
```

---

## 3. Release results for a class

- **Method:** `POST`
- **Path:** `/api/v1/library/schools/:schoolId/results/release/class/:classId`
- **Params:**
  - Path: `schoolId` (string), `classId` (string)
  - Query: `session_id` (string, optional)
  - Body: none

**Success (200):**

```json
{
  "success": true,
  "message": "Results released successfully for {n} students in class",
  "data": {
    "class_id": string,
    "total_students": number,
    "processed": number,
    "errors": number,
    "session": {
      "id": string,
      "academic_year": string,
      "term": string
    }
  },
  "statusCode": 200
}
```

---

## 4. Release results for multiple students (by IDs)

- **Method:** `POST`
- **Path:** `/api/v1/library/schools/:schoolId/results/release/students`
- **Params:**
  - Path: `schoolId` (string)
  - Query: none
  - Body:

```json
{
  "studentIds": ["string", "..."],
  "sessionId": "string (optional)"
}
```

**Success (200):**

```json
{
  "success": true,
  "message": "Results released successfully for {n} students",
  "data": {
    "total_requested": number,
    "total_found": number,
    "processed": number,
    "errors": number,
    "not_found": ["string"] | undefined,
    "session": {
      "id": string,
      "academic_year": string,
      "term": string
    }
  },
  "statusCode": 200
}
```

---

## 5. Unrelease results (whole school)

- **Method:** `POST`
- **Path:** `/api/v1/library/schools/:schoolId/results/unrelease`
- **Params:**
  - Path: `schoolId` (string)
  - Query: `session_id` (string, optional)
  - Body: none

**Success (200):**

```json
{
  "success": true,
  "message": "Results unreleased successfully for {n} students",
  "data": {
    "total_updated": number,
    "session": {
      "id": string,
      "academic_year": string,
      "term": string
    }
  },
  "statusCode": 200
}
```

---

## 6. Unrelease results for one student

- **Method:** `POST`
- **Path:** `/api/v1/library/schools/:schoolId/results/unrelease/student/:studentId`
- **Params:**
  - Path: `schoolId` (string), `studentId` (string)
  - Query: `session_id` (string, optional)
  - Body: none

**Success (200):**

```json
{
  "success": true,
  "message": "Results unreleased successfully for student",
  "data": {
    "student_id": string,
    "session": {
      "id": string,
      "academic_year": string,
      "term": string
    }
  },
  "statusCode": 200
}
```

---

## 7. Unrelease results for multiple students (by IDs)

- **Method:** `POST`
- **Path:** `/api/v1/library/schools/:schoolId/results/unrelease/students`
- **Params:**
  - Path: `schoolId` (string)
  - Query: none
  - Body:

```json
{
  "studentIds": ["string", "..."],
  "sessionId": "string (optional)"
}
```

**Success (200):**

```json
{
  "success": true,
  "message": "Results unreleased successfully for {n} students",
  "data": {
    "total_requested": number,
    "total_updated": number,
    "session": {
      "id": string,
      "academic_year": string,
      "term": string
    }
  },
  "statusCode": 200
}
```

---

## 8. Unrelease results for a class

- **Method:** `POST`
- **Path:** `/api/v1/library/schools/:schoolId/results/unrelease/class/:classId`
- **Params:**
  - Path: `schoolId` (string), `classId` (string)
  - Query: `session_id` (string, optional)
  - Body: none

**Success (200):**

```json
{
  "success": true,
  "message": "Results unreleased successfully for {n} students in class",
  "data": {
    "class_id": string,
    "total_students": number,
    "updated": number,
    "session": {
      "id": string,
      "academic_year": string,
      "term": string
    }
  },
  "statusCode": 200
}
```

---

## 9. Get results dashboard

- **Method:** `GET`
- **Path:** `/api/v1/library/schools/:schoolId/results/dashboard`
- **Params:**
  - Path: `schoolId` (string)
  - Query: `session_id` (string, optional), `class_id` (string, optional), `subject_id` (string, optional), `page` (number, optional), `limit` (number, optional)
  - Body: none

**Success (200):**

```json
{
  "success": true,
  "message": "Results dashboard retrieved successfully",
  "data": {
    "academic_sessions": [
      {
        "id": string,
        "academic_year": string,
        "term": string,
        "start_date": string,
        "end_date": string,
        "status": string,
        "is_current": boolean,
        "_count": { "results": number }
      }
    ],
    "current_session": {
      "id": string,
      "academic_year": string,
      "term": string,
      "status": string,
      "is_current": boolean
    } | null,
    "classes": [
      {
        "id": string,
        "name": string,
        "classTeacher": {
          "id": string,
          "first_name": string,
          "last_name": string,
          "email": string
        } | null,
        "student_count": number,
        "subject_count": number
      }
    ],
    "subjects": [
      {
        "id": string,
        "name": string,
        "code": string,
        "color": string | null,
        "description": string | null
      }
    ],
    "selected_filters": {
      "sessionId": string | null,
      "classId": string | null,
      "subjectId": null
    },
    "total_students_in_class": number,
    "results": [
      {
        "student": {
          "id": string,
          "userId": string,
          "studentNumber": string,
          "firstName": string,
          "lastName": string,
          "email": string,
          "displayPicture": string | null
        },
        "subjectScores": {
          "[subjectId]": {
            "subjectId": string,
            "subjectName": string,
            "subjectCode": string,
            "obtained": number | null,
            "obtainable": number | null,
            "percentage": number | null,
            "grade": string | null,
            "isAvailable": boolean
          }
        },
        "totalObtained": number,
        "totalObtainable": number,
        "percentage": number,
        "grade": string,
        "position": number,
        "isReleased": boolean
      }
    ] | null,
    "result_message": string | null,
    "pagination": {
      "page": number,
      "limit": number,
      "total": number,
      "totalPages": number,
      "hasNext": boolean,
      "hasPrev": boolean
    } | null
  },
  "statusCode": 200
}
```

When there are no results for the selected filters, `results` is `null`, `pagination` is `null`, and `result_message` explains (e.g. "No students found in this class", "No subjects found for this class", "Please select a class to view results").

---

## Quick reference

| Action | Method | Path (relative to base) |
|--------|--------|-------------------------|
| Release whole school | POST | `/release` |
| Release one student | POST | `/release/student/:studentId` |
| Release class | POST | `/release/class/:classId` |
| Release students by IDs | POST | `/release/students` |
| Unrelease whole school | POST | `/unrelease` |
| Unrelease one student | POST | `/unrelease/student/:studentId` |
| Unrelease students by IDs | POST | `/unrelease/students` |
| Unrelease class | POST | `/unrelease/class/:classId` |
| Dashboard | GET | `/dashboard` |

**Query params used:** `session_id` (release/unrelease), `session_id`, `class_id`, `subject_id`, `page`, `limit` (dashboard).  
**Body payload (release/students, unrelease/students):** `{ "studentIds": string[], "sessionId"?: string }`
