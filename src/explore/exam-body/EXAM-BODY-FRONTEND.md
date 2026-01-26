# Exam Body Explore - Frontend Contract

**Base URL:** `/api/v1/explore/exam-bodies`  
**Authentication:** Required (JWT Token - School users: students, teachers, school owners)  
**Response Format:** All endpoints return:
```typescript
{
  success: boolean;
  message: string;
  data: any;
}
```

**Important Notes:**
- ✅ All endpoints require authentication (`Authorization: Bearer <token>`)
- ✅ Only **published** assessments are returned
- ✅ **Correct answers are NEVER included** in question responses
- ✅ Only **active** exam bodies, subjects, and years are returned
- ✅ Questions are returned **without** `isCorrect` flags or `correctAnswers`

---

## 1. Get All Exam Bodies

**Endpoint:** `GET /api/v1/explore/exam-bodies`  
**Auth:** Required (JWT Token)

**Description:** Returns all active exam bodies with their subjects and years.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam bodies retrieved successfully",
  "data": [
    {
      "id": "cmktpvfoc0001bdsbilpzay2w",
      "name": "WAEC",
      "fullName": "West African Examinations Council",
      "code": "WAEC",
      "logoUrl": "https://s3.amazonaws.com/.../waec-logo.png",
      "status": "active",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z",
      "subjects": [
        {
          "id": "subject_123",
          "name": "Mathematics",
          "code": "MATH",
          "iconUrl": "https://s3.amazonaws.com/.../math-icon.png",
          "order": 1
        },
        {
          "id": "subject_124",
          "name": "English Language",
          "code": "ENG",
          "iconUrl": "https://s3.amazonaws.com/.../eng-icon.png",
          "order": 2
        }
      ],
      "years": [
        {
          "id": "year_123",
          "year": "2024/2025",
          "order": 1
        },
        {
          "id": "year_124",
          "year": "2023/2024",
          "order": 2
        }
      ]
    },
    {
      "id": "cmktpvfoc0001bdsbilpzay3x",
      "name": "JAMB",
      "fullName": "Joint Admissions and Matriculation Board",
      "code": "JAMB",
      "logoUrl": "https://s3.amazonaws.com/.../jamb-logo.png",
      "status": "active",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z",
      "subjects": [...],
      "years": [...]
    }
  ]
}
```

**TypeScript Type:**

```typescript
interface ExamBody {
  id: string;
  name: string;
  fullName: string;
  code: string;
  logoUrl: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    iconUrl: string | null;
    order: number;
  }>;
  years: Array<{
    id: string;
    year: string;
    order: number;
  }>;
}
```

---

## 2. Get Single Exam Body

**Endpoint:** `GET /api/v1/explore/exam-bodies/:examBodyId`  
**Auth:** Required (JWT Token)

**Description:** Returns a single exam body with its subjects and years by ID.

**Path Parameters:**
- `examBodyId` (string, required) - Exam body ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Exam body retrieved successfully",
  "data": {
    "id": "cmktpvfoc0001bdsbilpzay2w",
    "name": "WAEC",
    "fullName": "West African Examinations Council",
    "code": "WAEC",
    "logoUrl": "https://s3.amazonaws.com/.../waec-logo.png",
    "status": "active",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z",
    "subjects": [
      {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH",
        "iconUrl": "https://s3.amazonaws.com/.../math-icon.png",
        "order": 1
      }
    ],
    "years": [
      {
        "id": "year_123",
        "year": "2024/2025",
        "order": 1
      }
    ]
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Exam body not found",
  "data": null
}
```

---

## 3. Get Subjects for Exam Body

**Endpoint:** `GET /api/v1/explore/exam-bodies/:examBodyId/subjects`  
**Auth:** Required (JWT Token)

**Description:** Returns all active subjects for a specific exam body.

**Path Parameters:**
- `examBodyId` (string, required) - Exam body ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH",
      "iconUrl": "https://s3.amazonaws.com/.../math-icon.png",
      "order": 1
    },
    {
      "id": "subject_124",
      "name": "English Language",
      "code": "ENG",
      "iconUrl": "https://s3.amazonaws.com/.../eng-icon.png",
      "order": 2
    }
  ]
}
```

**TypeScript Type:**

```typescript
interface Subject {
  id: string;
  name: string;
  code: string;
  iconUrl: string | null;
  order: number;
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Exam body not found",
  "data": null
}
```

---

## 4. Get Years for Exam Body

**Endpoint:** `GET /api/v1/explore/exam-bodies/:examBodyId/years`  
**Auth:** Required (JWT Token)

**Description:** Returns all active years for a specific exam body.

**Path Parameters:**
- `examBodyId` (string, required) - Exam body ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Years retrieved successfully",
  "data": [
    {
      "id": "year_123",
      "year": "2024/2025",
      "order": 1
    },
    {
      "id": "year_124",
      "year": "2023/2024",
      "order": 2
    },
    {
      "id": "year_125",
      "year": "2022/2023",
      "order": 3
    }
  ]
}
```

**TypeScript Type:**

```typescript
interface Year {
  id: string;
  year: string;
  order: number;
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Exam body not found",
  "data": null
}
```

---

## 5. Get Published Assessments

**Endpoint:** `GET /api/v1/explore/exam-bodies/:examBodyId/assessments`  
**Auth:** Required (JWT Token)

**Description:** Returns all published assessments for an exam body. Optionally filter by `subjectId` and/or `yearId`.

**Path Parameters:**
- `examBodyId` (string, required) - Exam body ID

**Query Parameters:**
- `subjectId` (string, optional) - Filter by subject ID
- `yearId` (string, optional) - Filter by year ID

**Example Requests:**
- Get all assessments: `GET /api/v1/explore/exam-bodies/waec_id/assessments`
- Filter by subject: `GET /api/v1/explore/exam-bodies/waec_id/assessments?subjectId=math_id`
- Filter by subject and year: `GET /api/v1/explore/exam-bodies/waec_id/assessments?subjectId=math_id&yearId=2024_id`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": [
    {
      "id": "assessment_123",
      "examBodyId": "cmktpvfoc0001bdsbilpzay2w",
      "subjectId": "subject_123",
      "yearId": "year_123",
      "title": "WAEC Mathematics 2024/2025 Practice",
      "description": "Comprehensive practice questions for WAEC Mathematics",
      "duration": 120,
      "maxAttempts": 3,
      "assessmentType": "EXAM",
      "isPublished": true,
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z",
      "subject": {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH",
        "iconUrl": "https://s3.amazonaws.com/.../math-icon.png"
      },
      "year": {
        "id": "year_123",
        "year": "2024/2025"
      }
    },
    {
      "id": "assessment_124",
      "examBodyId": "cmktpvfoc0001bdsbilpzay2w",
      "subjectId": "subject_124",
      "yearId": "year_123",
      "title": "WAEC English Language 2024/2025 Practice",
      "description": "Practice questions for WAEC English Language",
      "duration": 90,
      "maxAttempts": null,
      "assessmentType": "EXAM",
      "isPublished": true,
      "createdAt": "2026-01-14T10:00:00.000Z",
      "updatedAt": "2026-01-14T10:00:00.000Z",
      "subject": {
        "id": "subject_124",
        "name": "English Language",
        "code": "ENG",
        "iconUrl": "https://s3.amazonaws.com/.../eng-icon.png"
      },
      "year": {
        "id": "year_123",
        "year": "2024/2025"
      }
    }
  ]
}
```

**TypeScript Type:**

```typescript
interface Assessment {
  id: string;
  examBodyId: string;
  subjectId: string;
  yearId: string;
  title: string;
  description: string | null;
  duration: number | null;
  maxAttempts: number | null; // null means unlimited attempts
  assessmentType: 'EXAM' | 'CBT';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  subject: {
    id: string;
    name: string;
    code: string;
    iconUrl: string | null;
  };
  year: {
    id: string;
    year: string;
  };
}
```

**Error Responses:**

**404 - Exam body not found:**
```json
{
  "success": false,
  "message": "Exam body not found",
  "data": null
}
```

**404 - Subject not found:**
```json
{
  "success": false,
  "message": "Subject not found",
  "data": null
}
```

**404 - Year not found:**
```json
{
  "success": false,
  "message": "Year not found",
  "data": null
}
```

---

## 6. Get Questions for Assessment (WITHOUT ANSWERS)

**Endpoint:** `GET /api/v1/explore/exam-bodies/:examBodyId/assessments/:assessmentId/questions`  
**Auth:** Required (JWT Token)

**Description:** Returns all questions for a published assessment. **IMPORTANT: Correct answers are NOT included.**

**Path Parameters:**
- `examBodyId` (string, required) - Exam body ID
- `assessmentId` (string, required) - Assessment ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment_123",
      "title": "WAEC Mathematics 2024/2025 Practice",
      "description": "Comprehensive practice questions for WAEC Mathematics",
      "maxAttempts": 3,
      "duration": 120
    },
    "questions": [
      {
        "id": "question_123",
        "assessmentId": "assessment_123",
        "questionText": "What is 2 + 2?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "points": 2,
        "order": 1,
        "isRequired": true,
        "imageUrl": null,
        "audioUrl": null,
        "videoUrl": null,
        "explanation": null,
        "createdAt": "2026-01-14T10:00:00.000Z",
        "updatedAt": "2026-01-14T10:00:00.000Z",
        "options": [
          {
            "id": "option_a",
            "optionText": "3",
            "order": 1,
            "imageUrl": null,
            "audioUrl": null
          },
          {
            "id": "option_b",
            "optionText": "4",
            "order": 2,
            "imageUrl": null,
            "audioUrl": null
          },
          {
            "id": "option_c",
            "optionText": "5",
            "order": 3,
            "imageUrl": null,
            "audioUrl": null
          }
        ]
      },
      {
        "id": "question_124",
        "assessmentId": "assessment_123",
        "questionText": "What shape is shown in the image?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "points": 3,
        "order": 2,
        "isRequired": true,
        "imageUrl": "https://s3.amazonaws.com/.../question_124_image.jpg",
        "audioUrl": null,
        "videoUrl": null,
        "explanation": null,
        "createdAt": "2026-01-14T10:00:00.000Z",
        "updatedAt": "2026-01-14T10:00:00.000Z",
        "options": [
          {
            "id": "option_d",
            "optionText": "Circle",
            "order": 1,
            "imageUrl": null,
            "audioUrl": null
          },
          {
            "id": "option_e",
            "optionText": "Triangle",
            "order": 2,
            "imageUrl": null,
            "audioUrl": null
          },
          {
            "id": "option_f",
            "optionText": "Square",
            "order": 3,
            "imageUrl": null,
            "audioUrl": null
          }
        ]
      }
    ]
  }
}
```

**⚠️ IMPORTANT - What's NOT Included:**
- ❌ `isCorrect` flag in options
- ❌ `correctAnswers` array
- ❌ Any indication of which option is correct

**TypeScript Type:**

```typescript
interface QuestionResponse {
  assessment: {
    id: string;
    title: string;
    description: string | null;
    maxAttempts: number | null;
    duration: number | null;
  };
  questions: Array<{
    id: string;
    assessmentId: string;
    questionText: string;
    questionType: string;
    points: number;
    order: number;
    isRequired: boolean;
    imageUrl: string | null;
    audioUrl: string | null;
    videoUrl: string | null;
    explanation: string | null;
    createdAt: string;
    updatedAt: string;
    options: Array<{
      id: string;
      optionText: string;
      order: number;
      imageUrl: string | null;
      audioUrl: string | null;
      // NOTE: isCorrect is NOT included
    }>;
    // NOTE: correctAnswers is NOT included
  }>;
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Assessment not found or not published",
  "data": null
}
```

---

## Frontend Implementation Examples

### Example 1: Fetch All Exam Bodies

```typescript
const fetchExamBodies = async (token: string) => {
  const response = await fetch('/api/v1/explore/exam-bodies', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  
  if (result.success) {
    return result.data; // Array of ExamBody
  }
  
  throw new Error(result.message);
};
```

### Example 2: Get Assessments with Filters

```typescript
const fetchAssessments = async (
  token: string,
  examBodyId: string,
  subjectId?: string,
  yearId?: string
) => {
  const params = new URLSearchParams();
  if (subjectId) params.append('subjectId', subjectId);
  if (yearId) params.append('yearId', yearId);

  const url = `/api/v1/explore/exam-bodies/${examBodyId}/assessments?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  
  if (result.success) {
    return result.data; // Array of Assessment
  }
  
  throw new Error(result.message);
};
```

### Example 3: Get Questions for Practice

```typescript
const fetchQuestions = async (
  token: string,
  examBodyId: string,
  assessmentId: string
) => {
  const response = await fetch(
    `/api/v1/explore/exam-bodies/${examBodyId}/assessments/${assessmentId}/questions`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();
  
  if (result.success) {
    // result.data contains { assessment, questions }
    // Questions do NOT include correct answers
    return result.data;
  }
  
  throw new Error(result.message);
};
```

### Example 4: Complete Flow - Select Exam Body, Subject, Year, and Practice

```typescript
// Step 1: Get all exam bodies
const examBodies = await fetchExamBodies(token);
// User selects: WAEC

// Step 2: Get subjects for selected exam body
const subjects = await fetch(
  `/api/v1/explore/exam-bodies/${selectedExamBodyId}/subjects`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json()).then(r => r.data);
// User selects: Mathematics

// Step 3: Get years for selected exam body
const years = await fetch(
  `/api/v1/explore/exam-bodies/${selectedExamBodyId}/years`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json()).then(r => r.data);
// User selects: 2024/2025

// Step 4: Get assessments with filters
const assessments = await fetchAssessments(
  token,
  selectedExamBodyId,
  selectedSubjectId,
  selectedYearId
);
// User selects: "WAEC Mathematics 2024/2025 Practice"

// Step 5: Get questions for practice
const { assessment, questions } = await fetchQuestions(
  token,
  selectedExamBodyId,
  selectedAssessmentId
);
// Display questions to user (answers are hidden)
```

---

## Error Handling

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Important Security Notes

1. **Authentication Required:** All endpoints require a valid JWT token
2. **No Answers Exposed:** Questions never include correct answers or `isCorrect` flags
3. **Published Only:** Only published assessments are accessible
4. **Active Only:** Only active exam bodies, subjects, and years are returned
5. **Platform Scoped:** Assessments are scoped to the library platform that created them, but all published assessments are visible to all school users

---

## Question Types

The `questionType` field can be one of:
- `MULTIPLE_CHOICE_SINGLE` - Single correct answer
- `MULTIPLE_CHOICE_MULTIPLE` - Multiple correct answers
- `TRUE_FALSE` - True/False question
- `SHORT_ANSWER` - Text input answer
- `ESSAY` - Long form answer
- `FILL_IN_BLANK` - Fill in the blank
- `MATCHING` - Matching pairs
- `ORDERING` - Order items correctly

---

## Notes on maxAttempts

- If `maxAttempts` is `null`, the assessment allows **unlimited attempts**
- If `maxAttempts` is a number (e.g., `3`), the user can attempt the assessment up to that many times
- The frontend should track attempts and prevent further attempts if the limit is reached

---

## Notes on duration

- If `duration` is `null`, there is **no time limit**
- If `duration` is a number (e.g., `120`), it represents the time limit in **minutes**
- The frontend should implement a timer and auto-submit when time expires

---

## 7. Submit Assessment

**Endpoint:** `POST /api/v1/explore/exam-bodies/:examBodyId/assessments/:assessmentId/submit`  
**Auth:** Required (JWT Token)

**Description:** Submits an assessment for automatic grading. Results are released immediately. Multiple attempts are allowed based on `maxAttempts` setting.

**Path Parameters:**
- `examBodyId` (string, required) - Exam body ID
- `assessmentId` (string, required) - Assessment ID

**Request Body:**

```json
{
  "responses": [
    {
      "questionId": "question_123",
      "selectedOptions": ["option_b"],
      "timeSpent": 45
    },
    {
      "questionId": "question_124",
      "textAnswer": "Triangle",
      "timeSpent": 30
    },
    {
      "questionId": "question_125",
      "numericAnswer": 42,
      "timeSpent": 20
    }
  ],
  "timeSpent": 95
}
```

**TypeScript Type:**

```typescript
interface SubmitExamBodyAssessmentDto {
  responses: Array<{
    questionId: string;
    textAnswer?: string;
    numericAnswer?: number;
    dateAnswer?: string; // ISO date string
    selectedOptions?: string[]; // For multiple choice
    fileUrls?: string[]; // For file upload questions
    timeSpent?: number; // Time spent on this question in seconds
  }>;
  timeSpent?: number; // Total time spent on assessment in seconds
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "data": {
    "attempt": {
      "id": "attempt_123",
      "attemptNumber": 1,
      "status": "COMPLETED",
      "submittedAt": "2026-01-14T15:30:00.000Z",
      "timeSpent": 95,
      "totalScore": 8,
      "maxScore": 10,
      "percentage": 80,
      "passed": true
    },
    "results": {
      "totalQuestions": 3,
      "correctAnswers": 2,
      "incorrectAnswers": 1,
      "totalScore": 8,
      "maxScore": 10,
      "percentage": 80,
      "passed": true,
      "grade": "B"
    },
    "responses": [
      {
        "questionId": "question_123",
        "questionText": "What is 2 + 2?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "maxPoints": 2,
        "isCorrect": true,
        "pointsEarned": 2,
        "feedback": null,
        "explanation": "Addition is a basic arithmetic operation",
        "correctAnswer": "option_b",
        "selectedAnswer": "option_b"
      },
      {
        "questionId": "question_124",
        "questionText": "What shape is shown?",
        "questionType": "SHORT_ANSWER",
        "maxPoints": 3,
        "isCorrect": true,
        "pointsEarned": 3,
        "feedback": null,
        "explanation": "This is a triangle",
        "correctAnswer": "Triangle",
        "selectedAnswer": "Triangle"
      },
      {
        "questionId": "question_125",
        "questionText": "What is 6 × 7?",
        "questionType": "NUMERIC",
        "maxPoints": 5,
        "isCorrect": false,
        "pointsEarned": 0,
        "feedback": null,
        "explanation": "Multiplication of 6 and 7 equals 42",
        "correctAnswer": 42,
        "selectedAnswer": 40
      }
    ],
    "feedback": {
      "message": "🎉 Congratulations! You passed the assessment.",
      "attemptsRemaining": 2
    }
  }
}
```

**Error Responses:**

**403 - No attempts remaining:**
```json
{
  "success": false,
  "message": "No attempts remaining for this assessment",
  "data": null
}
```

**404 - Assessment not found:**
```json
{
  "success": false,
  "message": "Assessment not found or not published",
  "data": null
}
```

**Notes:**
- ✅ Results are **automatically released** immediately after submission
- ✅ All questions are **automatically graded** (no manual grading required)
- ✅ Multiple attempts are allowed (based on `maxAttempts` setting)
- ✅ If `maxAttempts` is `null`, unlimited attempts are allowed
- ✅ `attemptsRemaining` will be `null` if unlimited attempts are allowed

---

## 8. Get Attempt Results

**Endpoint:** `GET /api/v1/explore/exam-bodies/attempts/:attemptId`  
**Auth:** Required (JWT Token)

**Description:** Retrieves detailed results for a specific assessment attempt. Only the user who submitted the attempt can access it.

**Path Parameters:**
- `attemptId` (string, required) - Attempt ID (returned from submit endpoint)

**Success Response (200):**

```json
{
  "success": true,
  "message": "Attempt results retrieved successfully",
  "data": {
    "attempt": {
      "id": "attempt_123",
      "attemptNumber": 1,
      "status": "COMPLETED",
      "submittedAt": "2026-01-14T15:30:00.000Z",
      "timeSpent": 95,
      "totalScore": 8,
      "maxScore": 10,
      "percentage": 80,
      "passed": true
    },
    "assessment": {
      "id": "assessment_123",
      "title": "WAEC Mathematics 2024/2025 Practice",
      "description": "Comprehensive practice questions",
      "maxAttempts": 3
    },
    "responses": [
      {
        "questionId": "question_123",
        "questionText": "What is 2 + 2?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "isCorrect": true,
        "pointsEarned": 2,
        "maxPoints": 2,
        "feedback": null,
        "explanation": "Addition is a basic arithmetic operation",
        "selectedOptions": ["option_b"],
        "textAnswer": null,
        "numericAnswer": null,
        "dateAnswer": null
      }
    ],
    "results": {
      "totalQuestions": 3,
      "correctAnswers": 2,
      "incorrectAnswers": 1,
      "totalScore": 8,
      "maxScore": 10,
      "percentage": 80,
      "passed": true,
      "grade": "B"
    }
  }
}
```

**Error Responses:**

**403 - Access denied:**
```json
{
  "success": false,
  "message": "You do not have access to this attempt",
  "data": null
}
```

**404 - Attempt not found:**
```json
{
  "success": false,
  "message": "Attempt not found",
  "data": null
}
```

---

## Complete Flow Example

```typescript
// Step 1: Get all exam bodies
const examBodies = await fetchExamBodies(token);
// User selects: WAEC

// Step 2: Get subjects
const subjects = await fetch(
  `/api/v1/explore/exam-bodies/${examBodyId}/subjects`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json()).then(r => r.data);
// User selects: Mathematics

// Step 3: Get years
const years = await fetch(
  `/api/v1/explore/exam-bodies/${examBodyId}/years`,
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json()).then(r => r.data);
// User selects: 2024/2025

// Step 4: Get assessments
const assessments = await fetchAssessments(
  token,
  examBodyId,
  subjectId,
  yearId
);
// User selects: "WAEC Mathematics 2024/2025 Practice"

// Step 5: Get questions for practice
const { assessment, questions } = await fetchQuestions(
  token,
  examBodyId,
  assessmentId
);
// User answers questions...

// Step 6: Submit assessment
const submissionResult = await fetch(
  `/api/v1/explore/exam-bodies/${examBodyId}/assessments/${assessmentId}/submit`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      responses: userResponses, // Array of QuestionResponseDto
      timeSpent: totalTimeSpent,
    }),
  }
).then(r => r.json());

if (submissionResult.success) {
  // Results are immediately available
  const attemptId = submissionResult.data.attempt.id;
  const score = submissionResult.data.results.percentage;
  const grade = submissionResult.data.results.grade;
  
  // Step 7: Get detailed results (optional, already in submission response)
  const detailedResults = await fetch(
    `/api/v1/explore/exam-bodies/attempts/${attemptId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  ).then(r => r.json()).then(r => r.data);
}
```
