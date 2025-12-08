# Student Results API Documentation

## Overview
This endpoint allows students to retrieve their academic results for a specific academic session/term. Results are only returned if they have been released by the school director/administrator.

---

## Endpoint

**GET** `/api/v1/students/results`

**Base URL:** Your API base URL (e.g., `https://api.example.com`)

---

## Authentication

**Required:** Yes (Bearer Token)

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

**Role Required:** `student`

---

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `session_id` | string | No | Academic session ID. If not provided, defaults to the current active session |
| `term_id` | string | No | Term ID (deprecated - term is part of the session, this parameter is ignored) |

### Example Requests

**Get results for current session:**
```
GET /api/v1/students/results
```

**Get results for specific session:**
```
GET /api/v1/students/results?session_id=cmiu4ti1y0004mkcywi8w62s2
```

---

## Response Structure

### Success Response (200 OK)

**When results are found and released:**

```json
{
  "success": true,
  "message": "Student results retrieved successfully",
  "data": {
    "current_session": {
      "id": "cmiu4ti1y0004mkcywi8w62s2",
      "academic_year": "2025/2026",
      "term": "first"
    },
    "subjects": [
      {
        "subject_id": "cmiu6cj2r000tmkxn2d0w5eju",
        "subject_code": "JSS1",
        "subject_name": "history",
        "ca_score": null,
        "exam_score": 2,
        "total_score": 2,
        "total_max_score": 4,
        "percentage": 50,
        "grade": "E",
        "class_analysis": {
          "total_students": 2,
          "student_position": 1
        }
      }
    ]
  },
  "statusCode": 200
}
```

### Success Response (200 OK) - Results Not Released

**When results haven't been released yet:**

```json
{
  "success": false,
  "message": "Results not yet released for this session. Please contact your school administrator.",
  "data": {
    "current_session": {
      "id": "cmiu4ti1y0004mkcywi8w62s2",
      "academic_year": "2025/2026",
      "term": "first"
    },
    "subjects": []
  },
  "statusCode": 200
}
```

### Success Response (200 OK) - Results Released But No Subjects

**When results are released but no subject data is available:**

```json
{
  "success": false,
  "message": "Results have been released but no subject data is available. This may occur if no assessment attempts were found. Please contact your school administrator.",
  "data": {
    "current_session": {
      "id": "cmiu4ti1y0004mkcywi8w62s2",
      "academic_year": "2025/2026",
      "term": "first"
    },
    "subjects": [],
    "result_id": "cmiwbbt090001mk5o366ycp6c",
    "released_at": "2025-12-07T22:47:16.377Z"
  },
  "statusCode": 200
}
```

### Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null,
  "statusCode": 401
}
```

**403 Forbidden (Not a student):**
```json
{
  "success": false,
  "message": "Access denied. Student role required.",
  "data": null,
  "statusCode": 403
}
```

**404 Not Found (Student not found):**
```json
{
  "success": false,
  "message": "Student not found",
  "data": null,
  "statusCode": 404
}
```

**400 Bad Request (No current session):**
```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null,
  "statusCode": 400
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to fetch student results",
  "data": null,
  "statusCode": 500
}
```

---

## Response Field Descriptions

### Root Level
- `success` (boolean): Indicates if the request was successful
- `message` (string): Human-readable message describing the result
- `data` (object | null): Response data (null on error)
- `statusCode` (number): HTTP status code

### Data Object

#### `current_session`
- `id` (string): Academic session ID
- `academic_year` (string): Academic year (e.g., "2025/2026")
- `term` (string): Term name (e.g., "first", "second", "third")

#### `subjects` (array)
Array of subject results. Each subject object contains:

- `subject_id` (string): Unique identifier for the subject
- `subject_code` (string): Subject code (e.g., "JSS1", "MATH101")
- `subject_name` (string): Full name of the subject (e.g., "history", "Mathematics")
- `ca_score` (number | null): Continuous Assessment score. `null` if no CA assessments were taken
- `exam_score` (number | null): Examination score. `null` if no exam was taken
- `total_score` (number): Sum of CA and Exam scores
- `total_max_score` (number): Maximum possible score (sum of CA and Exam max scores)
- `percentage` (number): Percentage score (rounded to 2 decimal places)
- `grade` (string): Letter grade (A, B, C, D, E, or F)
- `class_analysis` (object):
  - `total_students` (number): Total number of active students in the class
  - `student_position` (number): Student's position/rank in the class (1 = first place)

#### Additional Fields (when results released but no subjects)
- `result_id` (string): ID of the result record
- `released_at` (string): ISO 8601 timestamp when results were released

---

## Grade Scale

Grades are calculated based on percentage:
- **A**: 90% and above
- **B**: 80% - 89%
- **C**: 70% - 79%
- **D**: 60% - 69%
- **E**: 50% - 59%
- **F**: Below 50%

---

## Important Notes

1. **Results Must Be Released**: Results are only visible after they have been released by a school director/administrator. The `released_by_school_admin` flag must be `true`.

2. **Session Default**: If `session_id` is not provided, the system automatically uses the current active academic session.

3. **Empty Subjects Array**: If results are released but `subjects` is empty, it means:
   - No assessment attempts were found when results were released
   - Assessment attempts had incorrect status (should be 'GRADED' or 'SUBMITTED')
   - Student hasn't taken any assessments yet

4. **Subject Sorting**: Subjects are automatically sorted alphabetically by `subject_name`.

5. **Class Position**: Position is calculated based on `overall_percentage` in descending order (1 = highest score).

6. **Total Students**: The `total_students` count reflects the actual number of active students enrolled in the class, not just those with results.

---

## Example Usage

### JavaScript/TypeScript (Fetch API)

```typescript
async function getStudentResults(sessionId?: string) {
  const url = sessionId 
    ? `/api/v1/students/results?session_id=${sessionId}`
    : '/api/v1/students/results';
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${yourJwtToken}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data;
}
```

### cURL

```bash
# Get current session results
curl -X GET "https://api.example.com/api/v1/students/results" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Get specific session results
curl -X GET "https://api.example.com/api/v1/students/results?session_id=cmiu4ti1y0004mkcywi8w62s2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Axios

```typescript
import axios from 'axios';

const getStudentResults = async (sessionId?: string) => {
  try {
    const params = sessionId ? { session_id: sessionId } : {};
    const response = await axios.get('/api/v1/students/results', {
      headers: {
        'Authorization': `Bearer ${yourJwtToken}`
      },
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching results:', error);
    throw error;
  }
};
```

---

## Frontend Implementation Tips

1. **Handle Empty States**: Check if `subjects` array is empty and display appropriate messages:
   - If `success: false` and message mentions "not yet released" → Show "Results pending release"
   - If `success: false` and message mentions "no subject data" → Show "No assessment data available"

2. **Display Class Position**: Show position as "1st", "2nd", "3rd", etc. using the `student_position` field.

3. **Grade Display**: Use the `grade` field to display letter grades with appropriate styling (e.g., green for A, red for F).

4. **Percentage Formatting**: Display `percentage` with 2 decimal places (e.g., "85.50%").

5. **Session Selection**: If your app allows session selection, use the `session_id` query parameter to fetch results for different sessions.

6. **Loading States**: Show loading indicators while fetching results, as the endpoint may take time to process.

7. **Error Handling**: Always check the `success` field before accessing `data.subjects` to avoid runtime errors.

---

## Related Endpoints

- **Get Student Dashboard**: `GET /api/v1/students/dashboard`
- **Get Student Subjects**: `GET /api/v1/students/subjects`
- **Get Student Attendance**: `GET /api/v1/students/attendance`

---

## Support

If you encounter issues:
1. Verify the JWT token is valid and not expired
2. Ensure the user has the `student` role
3. Check that results have been released by the school administrator
4. Verify the academic session exists and is active
5. Contact your school administrator if results are missing

