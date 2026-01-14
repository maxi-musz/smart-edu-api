# Exam Body API Documentation

## Overview
Complete API for Nigerian Exam Bodies (WAEC, JAMB, NECO) past questions system.

**Base URL:** `https://your-api-domain.com/api/v1`  
**Authentication:** Bearer JWT Token (where required)  
**Content-Type:** `application/json` (except file uploads: `multipart/form-data`)

---

## Developer Endpoints (Admin/Content Creation)

### 1. Exam Bodies

#### Create Exam Body
```
POST /developer/exam-bodies
Auth: Required
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Short name (e.g., "WAEC") |
| fullName | string | Yes | Full official name |
| icon | file | Yes | Icon image (max 2MB, JPEG/PNG/GIF/WEBP/SVG) |
| description | string | No | Description |
| websiteUrl | string | No | Official website |
| status | string | No | "active", "inactive", "archived" (default: "active") |

**Note:** `code` is auto-generated from `name` by the backend (e.g., "WAEC" → "WAEC", "National Exam Council" → "NATIONAL_EXAM_COUNCIL")

**Response (201):**
```json
{
  "success": true,
  "message": "Exam body created successfully",
  "data": {
    "id": "exambody_123",
    "name": "WAEC",
    "fullName": "West African Examinations Council",
    "code": "WAEC",
    "description": "...",
    "logoUrl": "https://s3.amazonaws.com/exam-bodies/icons/WAEC_1234567890_icon.png",
    "websiteUrl": "https://www.waecgh.org",
    "status": "active",
    "createdAt": "2026-01-14T10:00:00.000Z",
    "updatedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

#### Get All Exam Bodies
```
GET /developer/exam-bodies
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Exam bodies retrieved successfully",
  "data": [
    {
      "id": "exambody_123",
      "name": "WAEC",
      "fullName": "West African Examinations Council",
      "code": "WAEC",
      "logoUrl": "https://...",
      "status": "active"
    }
  ]
}
```

#### Get Single Exam Body
```
GET /developer/exam-bodies/:id
Auth: Required
```

#### Update Exam Body
```
PATCH /developer/exam-bodies/:id
Auth: Required
Content-Type: multipart/form-data
```

**Request Body (Form Data - All Optional):**
Same fields as create, but all are optional including icon.

#### Delete Exam Body
```
DELETE /developer/exam-bodies/:id
Auth: Required
```

---

### 2. Subjects

#### Create Subject
```
POST /developer/exam-bodies/:examBodyId/subjects
Auth: Required
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Subject name (e.g., "Mathematics") |
| icon | file | No | Subject icon (max 2MB) |
| description | string | No | Description |
| order | number | No | Display order (default: 0) |

**Note:** `code` is auto-generated from `name` by the backend (e.g., "Mathematics" → "MATHEMATICS", "English Language" → "ENGLISH_LANGUAGE")

**Response (201):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "id": "subject_123",
    "examBodyId": "exambody_123",
    "name": "Mathematics",
    "code": "MATHEMATICS",
    "description": "...",
    "iconUrl": "https://s3.amazonaws.com/...",
    "order": 1,
    "status": "active",
    "examBody": {
      "id": "exambody_123",
      "name": "WAEC"
    }
  }
}
```

#### Get All Subjects for Exam Body
```
GET /developer/exam-bodies/:examBodyId/subjects
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": [
    {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATHEMATICS",
      "iconUrl": "https://...",
      "order": 1,
      "_count": {
        "assessments": 5
      }
    }
  ]
}
```

#### Update Subject
```
PATCH /developer/exam-bodies/:examBodyId/subjects/:id
Auth: Required
Content-Type: multipart/form-data
```

#### Delete Subject
```
DELETE /developer/exam-bodies/:examBodyId/subjects/:id
Auth: Required
```

---

### 3. Years

#### Create Year
```
POST /developer/exam-bodies/:examBodyId/years
Auth: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "year": "2024/2025",
  "description": "First Session",
  "startDate": "2024-05-01T00:00:00.000Z",
  "endDate": "2024-07-31T00:00:00.000Z",
  "order": 1
}
```

**Required Fields:** `year`  
**Optional Fields:** `description`, `startDate`, `endDate`, `order`

**Response (201):**
```json
{
  "success": true,
  "message": "Year created successfully",
  "data": {
    "id": "year_123",
    "examBodyId": "exambody_123",
    "year": "2024/2025",
    "description": "First Session",
    "startDate": "2024-05-01T00:00:00.000Z",
    "endDate": "2024-07-31T00:00:00.000Z",
    "order": 1,
    "status": "active",
    "examBody": {
      "id": "exambody_123",
      "name": "WAEC"
    }
  }
}
```

#### Get All Years for Exam Body
```
GET /developer/exam-bodies/:examBodyId/years
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Years retrieved successfully",
  "data": [
    {
      "id": "year_123",
      "year": "2024/2025",
      "description": "First Session",
      "order": 1,
      "_count": {
        "assessments": 10
      }
    }
  ]
}
```

#### Update Year
```
PATCH /developer/exam-bodies/:examBodyId/years/:id
Auth: Required
```

#### Delete Year
```
DELETE /developer/exam-bodies/:examBodyId/years/:id
Auth: Required
```

---

### 4. Assessments (Past Questions)

#### Create Assessment
```
POST /developer/exam-bodies/:examBodyId/assessments?subjectId=xxx&yearId=xxx
Auth: Required
Content-Type: application/json
```

**Query Parameters:**
- `subjectId` (required)
- `yearId` (required)

**Request Body:**
```json
{
  "title": "WAEC Mathematics 2024/2025",
  "description": "Past questions for WAEC Mathematics",
  "instructions": "Read all questions carefully",
  "duration": 120,
  "passingScore": 50,
  "maxAttempts": 999,
  "shuffleQuestions": true,
  "shuffleOptions": true,
  "showCorrectAnswers": true,
  "showFeedback": true,
  "showExplanation": true,
  "assessmentType": "CBT"
}
```

**Required Fields:** `title`  
**Optional Fields:** All others

**Response (201):**
```json
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "id": "assessment_123",
    "examBodyId": "exambody_123",
    "subjectId": "subject_123",
    "yearId": "year_123",
    "title": "WAEC Mathematics 2024/2025",
    "duration": 120,
    "totalPoints": 0,
    "passingScore": 50,
    "maxAttempts": 999,
    "isPublished": false,
    "examBody": { "id": "...", "name": "WAEC" },
    "subject": { "id": "...", "name": "Mathematics" },
    "year": { "id": "...", "year": "2024/2025" }
  }
}
```

#### Get All Assessments
```
GET /developer/exam-bodies/:examBodyId/assessments?subjectId=xxx&yearId=xxx
Auth: Required
```

**Query Parameters (Optional):**
- `subjectId` - Filter by subject
- `yearId` - Filter by year

**Response (200):**
```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": [
    {
      "id": "assessment_123",
      "title": "WAEC Mathematics 2024/2025",
      "totalPoints": 100,
      "isPublished": true,
      "_count": {
        "questions": 50,
        "attempts": 150
      }
    }
  ]
}
```

#### Get Single Assessment
```
GET /developer/exam-bodies/:examBodyId/assessments/:id
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Assessment retrieved successfully",
  "data": {
    "id": "assessment_123",
    "title": "WAEC Mathematics 2024/2025",
    "questions": [
      {
        "id": "question_123",
        "questionText": "What is 2 + 2?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "points": 2,
        "order": 1,
        "options": [
          {
            "id": "option_a",
            "optionText": "3",
            "order": 1,
            "isCorrect": false
          },
          {
            "id": "option_b",
            "optionText": "4",
            "order": 2,
            "isCorrect": true
          }
        ],
        "correctAnswers": [
          {
            "id": "correct_123",
            "optionIds": ["option_b"]
          }
        ]
      }
    ]
  }
}
```

#### Update Assessment
```
PATCH /developer/exam-bodies/:examBodyId/assessments/:id
Auth: Required
```

#### Delete Assessment
```
DELETE /developer/exam-bodies/:examBodyId/assessments/:id
Auth: Required
```

#### Publish Assessment
```
PATCH /developer/exam-bodies/:examBodyId/assessments/:id/publish
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Assessment published successfully",
  "data": {
    "id": "assessment_123",
    "isPublished": true,
    "publishedAt": "2026-01-14T10:00:00.000Z"
  }
}
```

#### Unpublish Assessment
```
PATCH /developer/exam-bodies/:examBodyId/assessments/:id/unpublish
Auth: Required
```

---

### 5. Questions

#### Add Question to Assessment
```
POST /developer/exam-bodies/:examBodyId/assessments/:id/questions
Auth: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "questionText": "What is 2 + 2?",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 2,
  "order": 1,
  "explanation": "Addition is a basic arithmetic operation",
  "options": [
    {
      "optionText": "3",
      "order": 1,
      "isCorrect": false
    },
    {
      "optionText": "4",
      "order": 2,
      "isCorrect": true
    },
    {
      "optionText": "5",
      "order": 3,
      "isCorrect": false
    }
  ]
}
```

**Question Types:**
- `MULTIPLE_CHOICE_SINGLE`
- `MULTIPLE_CHOICE_MULTIPLE`
- `TRUE_FALSE`
- `SHORT_ANSWER`
- `FILL_IN_BLANK`
- `LONG_ANSWER`
- `NUMERIC`
- `DATE`

**Required Fields:** `questionText`, `questionType`  
**Optional Fields:** `points` (default: 1), `order`, `explanation`, `options`

**Response (201):**
```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "question": {
      "id": "question_123",
      "questionText": "What is 2 + 2?",
      "questionType": "MULTIPLE_CHOICE_SINGLE",
      "points": 2,
      "order": 1
    },
    "options": [
      {
        "id": "option_a",
        "optionText": "3",
        "isCorrect": false
      },
      {
        "id": "option_b",
        "optionText": "4",
        "isCorrect": true
      }
    ],
    "correctAnswers": [
      {
        "id": "correct_123",
        "optionIds": ["option_b"]
      }
    ]
  }
}
```

#### Get All Questions for Assessment
```
GET /developer/exam-bodies/:examBodyId/assessments/:id/questions
Auth: Required
```

#### Delete Question
```
DELETE /developer/exam-bodies/:examBodyId/assessments/questions/:questionId
Auth: Required
```

---

## Public Endpoints (Users/Students)

### 1. Browse Exam Bodies

#### Get All Exam Bodies with Subjects & Years
```
GET /exam-practice/exam-bodies
Auth: Not Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Exam bodies retrieved successfully",
  "data": [
    {
      "id": "exambody_123",
      "name": "WAEC",
      "fullName": "West African Examinations Council",
      "code": "WAEC",
      "logoUrl": "https://s3.amazonaws.com/...",
      "status": "active",
      "subjects": [
        {
          "id": "subject_123",
          "name": "Mathematics",
          "code": "MATHEMATICS",
          "iconUrl": "https://...",
          "order": 1
        },
        {
          "id": "subject_456",
          "name": "English Language",
          "code": "ENGLISH_LANGUAGE",
          "iconUrl": "https://...",
          "order": 2
        }
      ],
      "years": [
        {
          "id": "year_123",
          "year": "2024/2025",
          "description": "First Session",
          "order": 1
        },
        {
          "id": "year_456",
          "year": "2022/2023",
          "description": "Second Session",
          "order": 2
        }
      ]
    }
  ]
}
```

---

### 2. Browse Assessments

#### Get Assessments by Filters
```
GET /exam-practice/assessments?examBodyId=xxx&subjectId=xxx&yearId=xxx
Auth: Not Required
```

**Query Parameters:**
- `examBodyId` (required)
- `subjectId` (optional)
- `yearId` (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": [
    {
      "id": "assessment_123",
      "title": "WAEC Mathematics 2024/2025",
      "description": "...",
      "duration": 120,
      "totalPoints": 100,
      "passingScore": 50,
      "isPublished": true,
      "examBody": {
        "id": "exambody_123",
        "name": "WAEC",
        "logoUrl": "https://..."
      },
      "subject": {
        "id": "subject_123",
        "name": "Mathematics",
        "iconUrl": "https://..."
      },
      "year": {
        "id": "year_123",
        "year": "2024/2025"
      },
      "_count": {
        "questions": 50
      }
    }
  ]
}
```

---

### 3. Take Assessment

#### Get Assessment Details (with user progress)
```
GET /exam-practice/assessments/:assessmentId
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Assessment details retrieved successfully",
  "data": {
    "id": "assessment_123",
    "title": "WAEC Mathematics 2024/2025",
    "description": "Past questions for WAEC Mathematics",
    "instructions": "Read all questions carefully",
    "duration": 120,
    "totalPoints": 100,
    "passingScore": 50,
    "maxAttempts": 999,
    "showCorrectAnswers": true,
    "showFeedback": true,
    "showExplanation": true,
    "examBody": {
      "id": "exambody_123",
      "name": "WAEC",
      "logoUrl": "https://..."
    },
    "subject": {
      "id": "subject_123",
      "name": "Mathematics"
    },
    "year": {
      "id": "year_123",
      "year": "2024/2025"
    },
    "_count": {
      "questions": 50
    },
    "attemptsTaken": 2,
    "attemptsRemaining": 997,
    "previousAttempts": [
      {
        "id": "attempt_123",
        "attemptNumber": 1,
        "totalScore": 75,
        "maxScore": 100,
        "percentage": 75,
        "passed": true,
        "submittedAt": "2026-01-10T10:00:00.000Z"
      },
      {
        "id": "attempt_456",
        "attemptNumber": 2,
        "totalScore": 85,
        "maxScore": 100,
        "percentage": 85,
        "passed": true,
        "submittedAt": "2026-01-12T15:30:00.000Z"
      }
    ],
    "canAttempt": true
  }
}
```

---

#### Get Questions for Assessment
```
GET /exam-practice/assessments/:assessmentId/questions
Auth: Required
```

**Response (200):**
```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "assessmentId": "assessment_123",
    "title": "WAEC Mathematics 2024/2025",
    "questions": [
      {
        "id": "question_123",
        "questionText": "What is 2 + 2?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "order": 1,
        "points": 2,
        "isRequired": true,
        "imageUrl": null,
        "audioUrl": null,
        "videoUrl": null,
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
            "order": 2
          },
          {
            "id": "option_c",
            "optionText": "5",
            "order": 3
          }
        ]
      }
    ],
    "attemptsRemaining": 997
  }
}
```

**Note:** Questions and options may be shuffled based on assessment settings. Correct answers are NOT included.

---

#### Submit Assessment
```
POST /exam-practice/assessments/:assessmentId/submit
Auth: Required
Content-Type: application/json
```

**Request Body:**
```json
{
  "responses": [
    {
      "questionId": "question_123",
      "selectedOptions": ["option_b"]
    },
    {
      "questionId": "question_456",
      "selectedOptions": ["option_x", "option_z"]
    },
    {
      "questionId": "question_789",
      "textAnswer": "Paris"
    },
    {
      "questionId": "question_101",
      "numericAnswer": 42
    }
  ],
  "startedAt": "2026-01-14T10:00:00.000Z",
  "timeSpent": 1800
}
```

**Response Fields for Each Question:**
- `selectedOptions` - Array of option IDs (for MCQ, True/False)
- `textAnswer` - String (for Short Answer, Fill in Blank)
- `numericAnswer` - Number (for Numeric questions)
- `dateAnswer` - ISO Date string (for Date questions)

**Response (200):**
```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "data": {
    "attempt": {
      "id": "attempt_789",
      "attemptNumber": 3,
      "totalScore": 85,
      "maxScore": 100,
      "percentage": 85,
      "passed": true
    },
    "results": {
      "totalQuestions": 50,
      "correctAnswers": 43,
      "incorrectAnswers": 7,
      "passed": true
    },
    "responses": [
      {
        "questionId": "question_123",
        "questionText": "What is 2 + 2?",
        "isCorrect": true,
        "pointsEarned": 2,
        "correctAnswer": "option_b",
        "explanation": "2 + 2 equals 4"
      },
      {
        "questionId": "question_456",
        "questionText": "Select all prime numbers",
        "isCorrect": false,
        "pointsEarned": 0,
        "correctAnswer": ["option_x", "option_y"],
        "explanation": "Prime numbers are divisible only by 1 and themselves"
      }
    ],
    "feedback": {
      "attemptsRemaining": 996
    }
  }
}
```

**Note:** 
- `correctAnswer` and `explanation` are only included if `showCorrectAnswers` and `showExplanation` are enabled
- Auto-grading works for: MCQ, True/False, Short Answer, Numeric, Date questions
- Other question types may require manual grading

---

## Data Models

### ExamBody
```typescript
{
  id: string
  name: string              // "WAEC", "JAMB"
  fullName: string          // "West African Examinations Council"
  code: string              // Auto-generated from name
  description?: string
  logoUrl?: string
  websiteUrl?: string
  status: "active" | "inactive" | "archived"
  createdAt: string
  updatedAt: string
}
```

### ExamBodySubject
```typescript
{
  id: string
  examBodyId: string
  name: string              // "Mathematics"
  code: string              // Auto-generated from name
  description?: string
  iconUrl?: string
  order: number
  status: "active" | "inactive" | "archived"
}
```

### ExamBodyYear
```typescript
{
  id: string
  examBodyId: string
  year: string              // "2024/2025"
  description?: string      // "First Session"
  startDate?: string
  endDate?: string
  order: number
  status: "active" | "inactive" | "archived"
}
```

### ExamBodyAssessment
```typescript
{
  id: string
  examBodyId: string
  subjectId: string
  yearId: string
  title: string
  description?: string
  instructions?: string
  assessmentType: "CBT" | "PAPER"
  duration?: number         // Minutes
  totalPoints: number
  passingScore: number      // Percentage (0-100)
  maxAttempts: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  showCorrectAnswers: boolean
  showFeedback: boolean
  showExplanation: boolean
  status: "active" | "inactive" | "archived"
  isPublished: boolean
  publishedAt?: string
}
```

### Question
```typescript
{
  id: string
  assessmentId: string
  questionText: string
  questionType: "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTIPLE" | 
                "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER" | 
                "FILL_IN_BLANK" | "NUMERIC" | "DATE"
  points: number
  order: number
  isRequired: boolean
  explanation?: string
  imageUrl?: string
  audioUrl?: string
  videoUrl?: string
  options: Option[]
}
```

### Option
```typescript
{
  id: string
  questionId: string
  optionText: string
  order: number
  isCorrect: boolean        // Only visible to admins
  imageUrl?: string
  audioUrl?: string
}
```

---

## User Flow Examples

### Flow 1: Student Taking WAEC Mathematics Past Questions

```
1. Browse Exam Bodies
   GET /exam-practice/exam-bodies
   → See WAEC with all subjects and years

2. Select WAEC → Mathematics → 2024/2025
   GET /exam-practice/assessments?examBodyId=xxx&subjectId=xxx&yearId=xxx
   → See available assessments

3. View Assessment Details
   GET /exam-practice/assessments/:id
   → See questions count, previous attempts, can attempt

4. Start Assessment
   GET /exam-practice/assessments/:id/questions
   → Get all questions (shuffled if enabled)

5. Submit Answers
   POST /exam-practice/assessments/:id/submit
   → Get immediate results, score, correct answers

6. Retry (unlimited times)
   Repeat steps 4-5
```

### Flow 2: Admin Creating Past Questions

```
1. Create Exam Body (WAEC)
   POST /developer/exam-bodies
   → Upload icon, set name (code auto-generated)

2. Create Subjects
   POST /developer/exam-bodies/:id/subjects
   → Create Mathematics, English (codes auto-generated)

3. Create Years
   POST /developer/exam-bodies/:id/years
   → Create 2024/2025, 2022/2023, etc.

4. Create Assessment
   POST /developer/exam-bodies/:id/assessments?subjectId=xxx&yearId=xxx
   → Link to subject + year

5. Add Questions (from hard copy book)
   POST /developer/exam-bodies/:id/assessments/:id/questions
   → Add 50 questions with options
   → Mark correct answers with isCorrect: true

6. Publish Assessment
   PATCH /developer/exam-bodies/:id/assessments/:id/publish
   → Make available to students
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error, missing fields) |
| 401 | Unauthorized (no token or invalid token) |
| 403 | Forbidden (no attempts remaining) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (duplicate name/code) |
| 500 | Internal Server Error |

---

## Important Notes

### Auto-Generated Fields
- ✅ **`code`:** Auto-generated from `name` (e.g., "WAEC" → "WAEC", "English Language" → "ENGLISH_LANGUAGE")
- ✅ Unique constraint enforced by backend
- ✅ Frontend should NOT send `code` field

### Authentication
- ✅ **Browse assessments:** No auth required
- ✅ **Take assessments:** Auth required (JWT token)
- ✅ **Create/manage content:** Auth required (admin/developer only)

### Attempts
- Default: 999 attempts (configurable per assessment)
- All attempts are recorded and can be viewed in assessment details
- Users can practice unlimited times

### Grading
- Automatic for: MCQ, True/False, Short Answer, Numeric, Date
- Manual grading needed for: Long Answer, File Upload, Matching, Ordering

### Question Shuffling
- If `shuffleQuestions: true` → Questions appear in random order
- If `shuffleOptions: true` → Options appear in random order
- Shuffling happens server-side on every request

### Correct Answers
- Never sent to frontend before submission
- Only shown after submission if `showCorrectAnswers: true`
- Explanations only shown if `showExplanation: true`

---

**Last Updated:** January 14, 2026  
**API Version:** v1

