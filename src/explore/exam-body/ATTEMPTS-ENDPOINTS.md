# Exam Body Assessment Attempts - Complete Endpoint Documentation

## 1. Get All Attempts for User

**Endpoint:** `GET /api/v1/explore/exam-bodies/attempts`  
**Auth:** Required (JWT Token)

**Query Parameters:**
- `assessmentId` (string, optional) - Filter attempts by specific assessment ID

**Examples:**
- Get all attempts: `GET /api/v1/explore/exam-bodies/attempts`
- Get attempts for specific assessment: `GET /api/v1/explore/exam-bodies/attempts?assessmentId=cmktry9fc000026sbbx67fw9y`

**Success Response (200):**

```json
{
  "success": true,
  "message": "Attempts retrieved successfully",
  "data": [
    {
      "id": "attempt_123",
      "assessmentId": "cmktry9fc000026sbbx67fw9y",
      "userId": "user_123",
      "attemptNumber": 1,
      "status": "GRADED",
      "startedAt": "2026-01-14T15:00:00.000Z",
      "submittedAt": "2026-01-14T15:30:00.000Z",
      "timeSpent": 1800,
      "totalScore": 8,
      "maxScore": 10,
      "percentage": 80,
      "passed": true,
      "isGraded": true,
      "gradedAt": "2026-01-14T15:30:00.000Z",
      "createdAt": "2026-01-14T15:00:00.000Z",
      "updatedAt": "2026-01-14T15:30:00.000Z",
      "assessment": {
        "id": "cmktry9fc000026sbbx67fw9y",
        "title": "WAEC Mathematics 2024/2025 Practice",
        "description": "Comprehensive practice questions for WAEC Mathematics",
        "maxAttempts": 3,
        "subject": {
          "id": "subject_123",
          "name": "Mathematics",
          "code": "MATH"
        },
        "year": {
          "id": "year_123",
          "year": "2024/2025"
        }
      }
    },
    {
      "id": "attempt_124",
      "assessmentId": "cmktry9fc000026sbbx67fw9y",
      "userId": "user_123",
      "attemptNumber": 2,
      "status": "GRADED",
      "startedAt": "2026-01-15T10:00:00.000Z",
      "submittedAt": "2026-01-15T10:25:00.000Z",
      "timeSpent": 1500,
      "totalScore": 9,
      "maxScore": 10,
      "percentage": 90,
      "passed": true,
      "isGraded": true,
      "gradedAt": "2026-01-15T10:25:00.000Z",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-15T10:25:00.000Z",
      "assessment": {
        "id": "cmktry9fc000026sbbx67fw9y",
        "title": "WAEC Mathematics 2024/2025 Practice",
        "description": "Comprehensive practice questions for WAEC Mathematics",
        "maxAttempts": 3,
        "subject": {
          "id": "subject_123",
          "name": "Mathematics",
          "code": "MATH"
        },
        "year": {
          "id": "year_123",
          "year": "2024/2025"
        }
      }
    }
  ]
}
```

**TypeScript Type:**

```typescript
interface Attempt {
  id: string;
  assessmentId: string;
  userId: string;
  attemptNumber: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';
  startedAt: string | null;
  submittedAt: string | null;
  timeSpent: number | null; // Time in seconds
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  isGraded: boolean;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assessment: {
    id: string;
    title: string;
    description: string | null;
    maxAttempts: number | null;
    subject: {
      id: string;
      name: string;
      code: string;
    };
    year: {
      id: string;
      year: string;
    };
  };
}
```

---

## 2. Get Single Attempt Results (Complete Details)

**Endpoint:** `GET /api/v1/explore/exam-bodies/attempts/:attemptId`  
**Auth:** Required (JWT Token)

**Path Parameters:**
- `attemptId` (string, required) - Attempt ID

**Description:** Returns complete submission details including all questions, user's selected answers, correct answers, scores, and time spent.

**Success Response (200):**

```json
{
  "success": true,
  "message": "Attempt results retrieved successfully",
  "data": {
    "attempt": {
      "id": "attempt_123",
      "attemptNumber": 1,
      "status": "GRADED",
      "startedAt": "2026-01-14T15:00:00.000Z",
      "submittedAt": "2026-01-14T15:30:00.000Z",
      "timeSpent": 1800,
      "totalScore": 8,
      "maxScore": 10,
      "percentage": 80,
      "passed": true,
      "createdAt": "2026-01-14T15:00:00.000Z"
    },
    "assessment": {
      "id": "cmktry9fc000026sbbx67fw9y",
      "title": "WAEC Mathematics 2024/2025 Practice",
      "description": "Comprehensive practice questions for WAEC Mathematics",
      "maxAttempts": 3,
      "subject": {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH"
      },
      "year": {
        "id": "year_123",
        "year": "2024/2025"
      }
    },
    "questions": [
      {
        "questionId": "question_123",
        "questionText": "What is 2 + 2?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "points": 2,
        "order": 1,
        "imageUrl": null,
        "audioUrl": null,
        "videoUrl": null,
        "explanation": "Addition is a basic arithmetic operation",
        "userAnswer": {
          "selectedOptions": ["option_b"],
          "textAnswer": null,
          "numericAnswer": null,
          "dateAnswer": null,
          "fileUrls": []
        },
        "correctAnswer": {
          "id": "correct_123",
          "answerText": null,
          "answerNumber": null,
          "answerDate": null,
          "optionIds": ["option_b"],
          "answerJson": null
        },
        "options": [
          {
            "id": "option_a",
            "optionText": "3",
            "order": 1,
            "isCorrect": false,
            "imageUrl": null,
            "audioUrl": null
          },
          {
            "id": "option_b",
            "optionText": "4",
            "order": 2,
            "isCorrect": true,
            "imageUrl": null,
            "audioUrl": null
          },
          {
            "id": "option_c",
            "optionText": "5",
            "order": 3,
            "isCorrect": false,
            "imageUrl": null,
            "audioUrl": null
          }
        ],
        "isCorrect": true,
        "pointsEarned": 2,
        "maxPoints": 2,
        "feedback": null
      },
      {
        "questionId": "question_124",
        "questionText": "What shape is shown in the image?",
        "questionType": "SHORT_ANSWER",
        "points": 3,
        "order": 2,
        "imageUrl": "https://s3.amazonaws.com/.../question_124_image.jpg",
        "audioUrl": null,
        "videoUrl": null,
        "explanation": "This is a triangle",
        "userAnswer": {
          "selectedOptions": [],
          "textAnswer": "Triangle",
          "numericAnswer": null,
          "dateAnswer": null,
          "fileUrls": []
        },
        "correctAnswer": {
          "id": "correct_124",
          "answerText": "Triangle",
          "answerNumber": null,
          "answerDate": null,
          "optionIds": [],
          "answerJson": null
        },
        "options": [],
        "isCorrect": true,
        "pointsEarned": 3,
        "maxPoints": 3,
        "feedback": null
      },
      {
        "questionId": "question_125",
        "questionText": "What is 6 × 7?",
        "questionType": "NUMERIC",
        "points": 5,
        "order": 3,
        "imageUrl": null,
        "audioUrl": null,
        "videoUrl": null,
        "explanation": "Multiplication of 6 and 7 equals 42",
        "userAnswer": {
          "selectedOptions": [],
          "textAnswer": null,
          "numericAnswer": 40,
          "dateAnswer": null,
          "fileUrls": []
        },
        "correctAnswer": {
          "id": "correct_125",
          "answerText": null,
          "answerNumber": 42,
          "answerDate": null,
          "optionIds": [],
          "answerJson": null
        },
        "options": [],
        "isCorrect": false,
        "pointsEarned": 0,
        "maxPoints": 5,
        "feedback": null
      }
    ],
    "results": {
      "totalQuestions": 3,
      "correctAnswers": 2,
      "incorrectAnswers": 1,
      "unanswered": 0,
      "totalScore": 8,
      "maxScore": 10,
      "percentage": 80,
      "passed": true,
      "grade": "B"
    }
  }
}
```

**TypeScript Type:**

```typescript
interface AttemptResultsResponse {
  attempt: {
    id: string;
    attemptNumber: number;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';
    startedAt: string | null;
    submittedAt: string | null;
    timeSpent: number | null; // Time in seconds
    totalScore: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    createdAt: string;
  };
  assessment: {
    id: string;
    title: string;
    description: string | null;
    maxAttempts: number | null;
    subject: {
      id: string;
      name: string;
      code: string;
    };
    year: {
      id: string;
      year: string;
    };
  };
  questions: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    points: number;
    order: number;
    imageUrl: string | null;
    audioUrl: string | null;
    videoUrl: string | null;
    explanation: string | null;
    userAnswer: {
      selectedOptions: string[];
      textAnswer: string | null;
      numericAnswer: number | null;
      dateAnswer: string | null;
      fileUrls: string[];
    };
    correctAnswer: {
      id: string;
      answerText: string | null;
      answerNumber: number | null;
      answerDate: string | null;
      optionIds: string[];
      answerJson: any | null;
    } | null;
    options: Array<{
      id: string;
      optionText: string;
      order: number;
      isCorrect: boolean;
      imageUrl: string | null;
      audioUrl: string | null;
    }>;
    isCorrect: boolean | null;
    pointsEarned: number;
    maxPoints: number;
    feedback: string | null;
  }>;
  results: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unanswered: number;
    totalScore: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    grade: string; // A+, A, B, C, D, F
  };
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

## 3. Submit Assessment

**Endpoint:** `POST /api/v1/explore/exam-bodies/:examBodyId/assessments/:assessmentId/submit`  
**Auth:** Required (JWT Token)

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
    }
  ],
  "timeSpent": 75
}
```

**Success Response (200):**
Returns the same structure as "Get Single Attempt Results" above, with the attempt ID that can be used to fetch detailed results later.

---

## Frontend Implementation Examples

### Get All Attempts

```typescript
const fetchUserAttempts = async (token: string, assessmentId?: string) => {
  const url = assessmentId
    ? `/api/v1/explore/exam-bodies/attempts?assessmentId=${assessmentId}`
    : '/api/v1/explore/exam-bodies/attempts';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  
  if (result.success) {
    return result.data; // Array of Attempt
  }
  
  throw new Error(result.message);
};
```

### Get Single Attempt Details

```typescript
const fetchAttemptDetails = async (token: string, attemptId: string) => {
  const response = await fetch(
    `/api/v1/explore/exam-bodies/attempts/${attemptId}`,
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
    // result.data contains:
    // - attempt: attempt metadata and time spent
    // - assessment: assessment details
    // - questions: all questions with user answers and correct answers
    // - results: summary statistics
    return result.data;
  }
  
  throw new Error(result.message);
};
```

---

## Key Points

1. **Time Spent:** Always in **seconds** (not minutes)
2. **Correct Answers:** Always included in the single attempt details endpoint
3. **User Answers:** Shows exactly what the user selected/entered
4. **Options:** Include `isCorrect` flag so you can highlight correct/incorrect options
5. **Grading:** All questions are automatically graded upon submission
6. **Results:** Include letter grade (A+, A, B, C, D, F) based on percentage
