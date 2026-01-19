# Teacher Results API Documentation

**Base URL:** `/teachers/results`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**Audience:** These endpoints are for **teachers** to view released student results for classes they manage.

---

## Table of Contents
1. [Get Results Main Page](#1-get-results-main-page)
2. [TypeScript Interfaces](#typescript-interfaces)
3. [Important Notes](#important-notes)

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

## 1. Get Results Main Page

Get all released results for classes managed by the teacher. Shows students' subject-wise and overall results that have been computed and released by the school director.

**Endpoint:** `GET /teachers/results/main-page`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| sessionId | string | No | Current session | Academic session ID to filter by |
| term | string | No | - | Term to filter by (used with sessionId) |
| page | number | No | 1 | Page number for students pagination |
| limit | number | No | 30 | Page size for students pagination |

**Term Values:**
- `first`
- `second`
- `third`

**Example Requests:**

```
GET /teachers/results/main-page
GET /teachers/results/main-page?sessionId=session-uuid-1&term=first
GET /teachers/results/main-page?page=2&limit=50
GET /teachers/results/main-page?sessionId=session-uuid-1&page=1&limit=30
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Result main page data retrieved successfully",
  "data": {
    "current_session": {
      "id": "session-uuid-1",
      "academic_year": "2024/2025",
      "term": "first"
    },
    "sessions": [
      {
        "id": "session-uuid-1",
        "academic_year": "2024/2025",
        "term": "first",
        "is_current": true
      },
      {
        "id": "session-uuid-2",
        "academic_year": "2024/2025",
        "term": "second",
        "is_current": false
      },
      {
        "id": "session-uuid-3",
        "academic_year": "2023/2024",
        "term": "third",
        "is_current": false
      }
    ],
    "classes": [
      {
        "id": "class-uuid-1",
        "name": "JSS 1A",
        "classId": "1",
        "subjects": [
          {
            "id": "subject-uuid-1",
            "name": "Mathematics",
            "code": "MATH101",
            "color": "#FF5733"
          },
          {
            "id": "subject-uuid-2",
            "name": "English Language",
            "code": "ENG101",
            "color": "#3498DB"
          },
          {
            "id": "subject-uuid-3",
            "name": "Basic Science",
            "code": "SCI101",
            "color": "#2ECC71"
          }
        ],
        "students": [
          {
            "student_id": "student-uuid-1",
            "student_name": "John Doe",
            "roll_number": "smh/2024/001",
            "display_picture": "https://s3.amazonaws.com/bucket/students/john.jpg",
            "total_ca_score": 112.5,
            "total_exam_score": 225.0,
            "total_score": 337.5,
            "total_max_score": 400,
            "overall_percentage": 84.38,
            "overall_grade": "A",
            "class_position": 3,
            "total_students": 30,
            "subjects": [
              {
                "subject_id": "subject-uuid-1",
                "subject_name": "Mathematics",
                "subject_code": "MATH101",
                "ca_score": 38,
                "exam_score": 75,
                "total_score": 113,
                "total_max_score": 130,
                "percentage": 86.92,
                "grade": "A"
              },
              {
                "subject_id": "subject-uuid-2",
                "subject_name": "English Language",
                "subject_code": "ENG101",
                "ca_score": 35,
                "exam_score": 70,
                "total_score": 105,
                "total_max_score": 130,
                "percentage": 80.77,
                "grade": "B"
              },
              {
                "subject_id": "subject-uuid-3",
                "subject_name": "Basic Science",
                "subject_code": "SCI101",
                "ca_score": 39.5,
                "exam_score": 80,
                "total_score": 119.5,
                "total_max_score": 140,
                "percentage": 85.36,
                "grade": "A"
              }
            ]
          },
          {
            "student_id": "student-uuid-2",
            "student_name": "Jane Smith",
            "roll_number": "smh/2024/002",
            "display_picture": "https://s3.amazonaws.com/bucket/students/jane.jpg",
            "total_ca_score": 125.0,
            "total_exam_score": 250.0,
            "total_score": 375.0,
            "total_max_score": 400,
            "overall_percentage": 93.75,
            "overall_grade": "A",
            "class_position": 1,
            "total_students": 30,
            "subjects": [
              {
                "subject_id": "subject-uuid-1",
                "subject_name": "Mathematics",
                "subject_code": "MATH101",
                "ca_score": 40,
                "exam_score": 85,
                "total_score": 125,
                "total_max_score": 130,
                "percentage": 96.15,
                "grade": "A"
              },
              {
                "subject_id": "subject-uuid-2",
                "subject_name": "English Language",
                "subject_code": "ENG101",
                "ca_score": 40,
                "exam_score": 82,
                "total_score": 122,
                "total_max_score": 130,
                "percentage": 93.85,
                "grade": "A"
              },
              {
                "subject_id": "subject-uuid-3",
                "subject_name": "Basic Science",
                "subject_code": "SCI101",
                "ca_score": 45,
                "exam_score": 83,
                "total_score": 128,
                "total_max_score": 140,
                "percentage": 91.43,
                "grade": "A"
              }
            ]
          },
          {
            "student_id": "student-uuid-3",
            "student_name": "Michael Johnson",
            "roll_number": "smh/2024/003",
            "display_picture": null,
            "total_ca_score": null,
            "total_exam_score": null,
            "total_score": null,
            "total_max_score": null,
            "overall_percentage": null,
            "overall_grade": null,
            "class_position": null,
            "total_students": 30,
            "subjects": []
          }
        ],
        "page": 1,
        "limit": 30,
        "total_students": 30
      },
      {
        "id": "class-uuid-2",
        "name": "JSS 2B",
        "classId": "2",
        "subjects": [
          {
            "id": "subject-uuid-4",
            "name": "Mathematics",
            "code": "MATH201",
            "color": "#FF5733"
          },
          {
            "id": "subject-uuid-5",
            "name": "English Language",
            "code": "ENG201",
            "color": "#3498DB"
          }
        ],
        "students": [],
        "page": 1,
        "limit": 30,
        "total_students": 28
      }
    ],
    "page": 1,
    "limit": 30
  }
}
```

---

## TypeScript Interfaces

### Main Response

```typescript
interface GetResultsMainPageResponse {
  success: boolean;
  message: string;
  data: {
    // Current active session
    current_session: {
      id: string;
      academic_year: string;        // Format: "YYYY/YYYY"
      term: string;                 // "first" | "second" | "third"
    };

    // Available sessions for filtering
    sessions: Array<{
      id: string;
      academic_year: string;
      term: string;
      is_current: boolean;
    }>;

    // Classes managed by teacher with results
    classes: Array<{
      id: string;
      name: string;                 // e.g., "JSS 1A"
      classId: string;              // Short ID, e.g., "1"
      
      // All subjects offered in this class
      subjects: Array<{
        id: string;
        name: string;
        code: string;
        color: string;              // Hex color code
      }>;

      // Students in this class with their results
      students: Array<{
        student_id: string;
        student_name: string;
        roll_number: string;
        display_picture: string | null;

        // Overall scores (null if not released)
        total_ca_score: number | null;
        total_exam_score: number | null;
        total_score: number | null;
        total_max_score: number | null;
        overall_percentage: number | null;
        overall_grade: string | null;    // "A", "B", "C", "D", "E", "F"
        class_position: number | null;
        total_students: number;

        // Subject-wise results
        subjects: Array<{
          subject_id: string;
          subject_name: string;
          subject_code: string;
          ca_score: number | null;
          exam_score: number | null;
          total_score: number;
          total_max_score: number;
          percentage: number;
          grade: string;                  // "A", "B", "C", "D", "E", "F"
        }>;
      }>;

      // Pagination for this class
      page: number;
      limit: number;
      total_students: number;           // Total students (unpaginated)
    }>;

    // Pagination parameters
    page: number;
    limit: number;
  };
}
```

### Grade Scale

```typescript
// Grade calculation (based on percentage)
type Grade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

// Grade thresholds
const gradeThresholds = {
  A: 90,  // 90% and above
  B: 80,  // 80-89%
  C: 70,  // 70-79%
  D: 60,  // 60-69%
  E: 50,  // 50-59%
  F: 0    // Below 50%
};
```

---

## Important Notes

### 1. Results Visibility

**Only Released Results:**
- Teachers can **ONLY** see results that have been **released by the school director**
- Unreleased results will not appear
- Students without released results will have `null` values for all score fields

**Released Indicator:**
- Field: `released_by_school_admin: true` in database
- This is controlled by the director, not the teacher

### 2. Class Management

**Classes Shown:**
- Only classes where teacher is the **class teacher** (`classTeacherId` matches)
- Teacher must be managing the class for the selected academic session
- Empty array if teacher has no classes assigned

### 3. Session Filtering

**Default Behavior:**
- If no `sessionId` provided → Uses **current session** (`is_current: true`)
- If `sessionId` provided → Uses that specific session
- If `term` provided → Must be used with `sessionId`

**Available Sessions:**
- `sessions` array contains all available sessions for dropdown/filtering
- Ordered by current first, then by creation date descending

### 4. Pagination

**Per-Class Pagination:**
- `page` and `limit` apply to **each class's student list**
- `total_students` shows total students in class (unpaginated)
- Default: `page=1, limit=30`

**Example:**
- Class has 100 students
- Request: `page=2&limit=30`
- Returns: Students 31-60
- `total_students`: 100

### 5. Subject Results

**Subjects Array:**
- Shows ALL subjects offered in the class
- `subjects` at class level = all subjects
- `subjects` at student level = student's individual results

**Empty Student Subjects:**
- If `subjects: []` → Student has no released results
- Check for empty array to show "No results released" message

### 6. Score Calculations

**Total Scores:**
- `total_ca_score`: Sum of CA scores across all subjects
- `total_exam_score`: Sum of exam scores across all subjects
- `total_score`: `total_ca_score + total_exam_score`
- `total_max_score`: Sum of max scores across all subjects
- `overall_percentage`: `(total_score / total_max_score) * 100`

**Per Subject:**
- `ca_score`: Continuous Assessment score (can be null)
- `exam_score`: Exam score (can be null)
- `total_score`: `ca_score + exam_score`
- `percentage`: `(total_score / total_max_score) * 100`

### 7. Class Position

**Ranking:**
- `class_position`: Student's rank in the class (1 = top)
- Based on `overall_percentage`
- `null` if results not released or if position not computed
- `total_students`: Total students in the class for context

### 8. Display Picture

**Can be null:**
- Check for null before displaying
- Provide default avatar/placeholder
- Format: Full S3 URL or null

### 9. Null Handling

**All null if not released:**
```typescript
{
  total_ca_score: null,
  total_exam_score: null,
  total_score: null,
  total_max_score: null,
  overall_percentage: null,
  overall_grade: null,
  class_position: null,
  subjects: []  // Empty array
}
```

**Frontend should:**
- Check for null values
- Display "Results not released" or similar message
- Don't show scores/grades for unreleased results

### 10. Subject Color

**Use for UI:**
- Each subject has a `color` field (hex code)
- Use for badges, cards, or charts
- Provides visual distinction between subjects

---

## Error Responses

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**404 Not Found - No Academic Session:**
```json
{
  "success": false,
  "message": "No academic session found",
  "data": null
}
```

**404 Not Found - No Classes:**
```json
{
  "success": false,
  "message": "No classes assigned to teacher",
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to fetch result main page data",
  "data": null
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Results retrieved successfully |
| 401 | Unauthorized - Invalid or missing authentication token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Teacher, session, or classes not found |
| 500 | Internal Server Error - Server error occurred |

---

## Example Usage (JavaScript/TypeScript)

### Fetching Results Main Page

```typescript
const fetchResultsMainPage = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.sessionId) params.append('sessionId', filters.sessionId);
    if (filters.term) params.append('term', filters.term);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const response = await fetch(
      `/teachers/results/main-page${params.toString() ? '?' + params : ''}`,
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
      const { current_session, sessions, classes } = result.data;
      
      console.log('Current Session:', current_session);
      console.log('Available Sessions:', sessions.length);
      console.log('Classes:', classes.length);
      
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching results:', error);
    showToast('error', 'Failed to load results');
    return null;
  }
};

// Usage examples
const results = await fetchResultsMainPage();
const filteredResults = await fetchResultsMainPage({ 
  sessionId: 'session-uuid-1', 
  term: 'first',
  page: 1,
  limit: 50
});
```

### Building Results UI

```typescript
const buildResultsUI = (data) => {
  const { current_session, sessions, classes } = data;
  
  // Session Selector
  const sessionOptions = sessions.map(s => ({
    value: s.id,
    label: `${s.academic_year} - ${s.term}`,
    isCurrent: s.is_current
  }));
  
  // Classes with Results
  classes.forEach(classItem => {
    console.log(`\n=== ${classItem.name} ===`);
    console.log(`Subjects: ${classItem.subjects.length}`);
    console.log(`Students: ${classItem.students.length} (Total: ${classItem.total_students})`);
    
    // Display subjects
    classItem.subjects.forEach(subject => {
      console.log(`  - ${subject.name} (${subject.code})`);
    });
    
    // Display students with results
    classItem.students.forEach(student => {
      if (student.overall_percentage !== null) {
        console.log(`\n${student.student_name} (${student.roll_number})`);
        console.log(`  Overall: ${student.overall_percentage}% - Grade ${student.overall_grade}`);
        console.log(`  Position: ${student.class_position}/${student.total_students}`);
        
        // Subject breakdown
        student.subjects.forEach(subject => {
          console.log(`  ${subject.subject_name}: ${subject.total_score}/${subject.total_max_score} (${subject.percentage}% - ${subject.grade})`);
        });
      } else {
        console.log(`\n${student.student_name}: Results not released`);
      }
    });
  });
  
  return { sessionOptions, classes };
};
```

### Filtering Students by Performance

```typescript
const analyzeClassPerformance = (classData) => {
  const students = classData.students;
  
  // Students with released results
  const releasedResults = students.filter(s => s.overall_percentage !== null);
  const pendingResults = students.filter(s => s.overall_percentage === null);
  
  // Performance categories
  const excellent = releasedResults.filter(s => s.overall_percentage >= 90);
  const veryGood = releasedResults.filter(s => s.overall_percentage >= 80 && s.overall_percentage < 90);
  const good = releasedResults.filter(s => s.overall_percentage >= 70 && s.overall_percentage < 80);
  const pass = releasedResults.filter(s => s.overall_percentage >= 50 && s.overall_percentage < 70);
  const fail = releasedResults.filter(s => s.overall_percentage < 50);
  
  // Calculate averages
  const avgScore = releasedResults.length > 0
    ? releasedResults.reduce((sum, s) => sum + s.overall_percentage, 0) / releasedResults.length
    : 0;
  
  return {
    total: students.length,
    released: releasedResults.length,
    pending: pendingResults.length,
    excellent: excellent.length,
    veryGood: veryGood.length,
    good: good.length,
    pass: pass.length,
    fail: fail.length,
    averageScore: avgScore.toFixed(2)
  };
};
```

### Pagination Handler

```typescript
const handlePagination = async (classId, page, limit) => {
  const results = await fetchResultsMainPage({ page, limit });
  
  if (results) {
    const classData = results.classes.find(c => c.id === classId);
    
    if (classData) {
      const totalPages = Math.ceil(classData.total_students / classData.limit);
      const hasNext = classData.page < totalPages;
      const hasPrev = classData.page > 1;
      
      return {
        students: classData.students,
        pagination: {
          current: classData.page,
          total: totalPages,
          hasNext,
          hasPrev,
          totalStudents: classData.total_students
        }
      };
    }
  }
  
  return null;
};
```

### Subject Performance Analysis

```typescript
const analyzeSubjectPerformance = (classData) => {
  const subjectStats = {};
  
  // Initialize stats for each subject
  classData.subjects.forEach(subject => {
    subjectStats[subject.id] = {
      name: subject.name,
      code: subject.code,
      color: subject.color,
      totalStudents: 0,
      scores: [],
      averageScore: 0,
      highestScore: 0,
      lowestScore: 100,
      passCount: 0,
      failCount: 0
    };
  });
  
  // Collect scores
  classData.students.forEach(student => {
    student.subjects.forEach(subject => {
      const stats = subjectStats[subject.subject_id];
      if (stats) {
        stats.totalStudents++;
        stats.scores.push(subject.percentage);
        stats.highestScore = Math.max(stats.highestScore, subject.percentage);
        stats.lowestScore = Math.min(stats.lowestScore, subject.percentage);
        
        if (subject.percentage >= 50) {
          stats.passCount++;
        } else {
          stats.failCount++;
        }
      }
    });
  });
  
  // Calculate averages
  Object.values(subjectStats).forEach(stats => {
    if (stats.scores.length > 0) {
      stats.averageScore = stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length;
    }
  });
  
  return subjectStats;
};
```

---

## UI/UX Recommendations

### 1. Session Selector
- **Dropdown:** Show all available sessions
- **Current Badge:** Highlight current session
- **Format:** "2024/2025 - First Term"
- **Auto-select:** Default to current session

### 2. Class Tabs/Accordion
- **Tab per class:** "JSS 1A", "JSS 2B", etc.
- **Student count:** Show total students per class
- **Badge:** Show number of released results

### 3. Results Table/Cards

**Table Columns:**
- Photo
- Student Name & Roll Number
- Overall Score & Percentage
- Grade
- Position
- Subject-wise scores (expandable)

**Empty State:**
- "Results not released yet" for students with null scores
- Gray out or use different styling

### 4. Pagination
- **Show:** "Showing 1-30 of 120 students"
- **Controls:** Previous, Next, Page numbers
- **Per Page:** Allow changing limit (10, 30, 50, 100)

### 5. Performance Indicators

**Overall:**
- Progress bar for average class performance
- Color-coded grades (A=green, F=red)
- Position badge

**Per Subject:**
- Mini progress bars
- Color from subject.color field
- Grade badge

### 6. Filters & Search
- **Search:** By student name or roll number
- **Filter by Grade:** A, B, C, D, E, F
- **Filter by Subject:** Show specific subject results
- **Sort:** By name, score, position

### 7. Analytics Dashboard
- **Class Average:** Overall percentage
- **Pass Rate:** Percentage of students passing
- **Grade Distribution:** Pie chart or bar chart
- **Top Performers:** List of top 5 students
- **Subject Comparison:** Compare subject averages

### 8. Export Options
- **PDF:** Generate result sheets
- **Excel:** Export to spreadsheet
- **Print:** Print-friendly view

### 9. Loading States
- **Skeleton loader:** For tables
- **Shimmer effect:** For cards
- **Progress indicator:** During fetch

### 10. Responsive Design
- **Mobile:** Card view with swipe
- **Tablet:** Grid of cards
- **Desktop:** Full table view

---

## Testing Endpoint

### Using cURL

```bash
# Get results for current session
curl -X GET "/teachers/results/main-page" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get results for specific session
curl -X GET "/teachers/results/main-page?sessionId=session-uuid-1&term=first" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get with pagination
curl -X GET "/teachers/results/main-page?page=2&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Notes for Frontend Implementation

1. **Results are Read-Only:** Teachers can only view, not edit results
2. **Director Controls Release:** Results only appear after director releases them
3. **Multiple Classes:** Teacher may manage multiple classes
4. **Pagination Per Class:** Each class has its own student pagination
5. **Null Checks:** Always check for null before displaying scores
6. **Empty Arrays:** Check `subjects.length` to determine if results are released
7. **Session Filtering:** Provide dropdown to switch between sessions
8. **Color Coding:** Use `subject.color` for consistent UI
9. **Position Display:** Show as "3/30" (position/total)
10. **Grade Scale:** Display grade legend (A=90+, B=80-89, etc.)

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 19, 2026

