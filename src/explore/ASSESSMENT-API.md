# Explore Assessment API

## Authentication
All endpoints require JWT authentication.
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. GET `/explore/assessments/:assessmentId`
Get assessment details with user progress.

**Path Parameters:**
- `assessmentId` (string, required) - Assessment ID

**Response:**
```json
{
  "success": true,
  "message": "Assessment retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment_123",
      "title": "Mathematics Chapter 1 Assessment",
      "description": "Test your understanding of algebraic expressions",
      "instructions": "Answer all questions within the time limit",
      "assessmentType": "CBT",
      "gradingType": "AUTOMATIC",
      "status": "ACTIVE",
      "duration": 30,
      "timeLimit": 1800,
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-12-31T23:59:59.000Z",
      "maxAttempts": 3,
      "allowReview": true,
      "totalPoints": 100,
      "passingScore": 70,
      "showCorrectAnswers": false,
      "showFeedback": true,
      "studentCanViewGrading": true,
      "shuffleQuestions": true,
      "shuffleOptions": true,
      "isPublished": true,
      "publishedAt": "2025-01-01T00:00:00.000Z",
      "tags": ["algebra", "mathematics"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "subject": {
        "id": "subject_123",
        "name": "Mathematics",
        "code": "MATH",
        "color": "#3B82F6",
        "thumbnailUrl": "https://..."
      },
      "chapter": {
        "id": "chapter_123",
        "title": "Introduction to Algebra",
        "order": 1
      },
      "topic": {
        "id": "topic_123",
        "title": "Algebraic Expressions",
        "description": "Learn about algebraic expressions"
      },
      "platform": {
        "id": "platform_123",
        "name": "Access Study",
        "slug": "access-study"
      },
      "questionsCount": 20
    },
    "userProgress": {
      "attemptsTaken": 1,
      "attemptsRemaining": 2,
      "maxAttempts": 3,
      "canTakeAssessment": true,
      "latestAttempt": {
        "id": "attempt_123",
        "attemptNumber": 1,
        "status": "SUBMITTED",
        "startedAt": "2025-01-09T10:00:00.000Z",
        "submittedAt": "2025-01-09T10:25:00.000Z",
        "totalScore": 75,
        "percentage": 75,
        "passed": true,
        "isGraded": true,
        "createdAt": "2025-01-09T10:00:00.000Z"
      }
    },
    "attempts": [
      {
        "id": "attempt_123",
        "attemptNumber": 1,
        "status": "SUBMITTED",
        "startedAt": "2025-01-09T10:00:00.000Z",
        "submittedAt": "2025-01-09T10:25:00.000Z",
        "totalScore": 75,
        "percentage": 75,
        "passed": true,
        "isGraded": true,
        "createdAt": "2025-01-09T10:00:00.000Z"
      }
    ]
  }
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (assessment not started or ended)
- `404` - Not found (assessment doesn't exist or not published)

---

### 2. GET `/explore/assessments/:assessmentId/questions`
Get all questions for an assessment.

**Path Parameters:**
- `assessmentId` (string, required) - Assessment ID

**Response:**
```json
{
  "success": true,
  "message": "Assessment questions retrieved successfully",
  "data": {
    "assessmentId": "assessment_123",
    "assessmentTitle": "Mathematics Chapter 1 Assessment",
    "questions": [
      {
        "id": "question_123",
        "questionText": "What is the value of x in 2x + 5 = 15?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "order": 1,
        "points": 5,
        "isRequired": true,
        "timeLimit": null,
        "imageUrl": null,
        "audioUrl": null,
        "videoUrl": null,
        "showHint": true,
        "hintText": "Subtract 5 from both sides first",
        "minLength": null,
        "maxLength": null,
        "minValue": null,
        "maxValue": null,
        "difficultyLevel": "MEDIUM",
        "options": [
          {
            "id": "option_1",
            "optionText": "5",
            "order": 1,
            "imageUrl": null,
            "audioUrl": null
          },
          {
            "id": "option_2",
            "optionText": "10",
            "order": 2,
            "imageUrl": null,
            "audioUrl": null
          },
          {
            "id": "option_3",
            "optionText": "7",
            "order": 3,
            "imageUrl": null,
            "audioUrl": null
          }
        ]
      }
    ],
    "totalQuestions": 20,
    "totalPoints": 100,
    "showCorrectAnswers": false
  }
}
```

**Notes:**
- Questions/options may be shuffled based on assessment settings
- Correct answers are NOT included (only shown after submission if enabled)
- Explanations are NOT included (only shown after submission)

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no attempts remaining)
- `404` - Not found (assessment doesn't exist)

---

### 3. POST `/explore/assessments/:assessmentId/submit`
Submit assessment answers for automatic grading.

**Path Parameters:**
- `assessmentId` (string, required) - Assessment ID

**Request Body:**
```json
{
  "responses": [
    {
      "questionId": "question_123",
      "selectedOptions": ["option_2"],
      "timeSpent": 45
    },
    {
      "questionId": "question_124",
      "textAnswer": "Paris",
      "timeSpent": 30
    },
    {
      "questionId": "question_125",
      "numericAnswer": 42,
      "timeSpent": 20
    }
  ],
  "timeSpent": 1250
}
```

**Response Fields:**

| Field | Description |
|-------|-------------|
| `selectedOptions` | Array of option IDs (for multiple choice) |
| `textAnswer` | Text answer (for short/long answer, fill in blank) |
| `numericAnswer` | Number (for numeric questions) |
| `dateAnswer` | ISO date string (for date questions) |
| `fileUrls` | Array of uploaded file URLs (for file upload) |
| `timeSpent` | Seconds spent on question (optional) |

**Response:**
```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "data": {
    "attempt": {
      "id": "attempt_123",
      "attemptNumber": 1,
      "status": "SUBMITTED",
      "submittedAt": "2025-01-09T10:25:00.000Z",
      "timeSpent": 1250,
      "totalScore": 75,
      "maxScore": 100,
      "percentage": 75,
      "passed": true
    },
    "results": {
      "totalQuestions": 20,
      "correctAnswers": 15,
      "incorrectAnswers": 5,
      "totalScore": 75,
      "maxScore": 100,
      "percentage": 75,
      "passingScore": 70,
      "passed": true,
      "grade": "C"
    },
    "responses": [
      {
        "questionId": "question_123",
        "questionText": "What is the capital of France?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "selectedOptions": ["option_2"],
        "isCorrect": true,
        "pointsEarned": 5,
        "maxPoints": 5,
        "correctAnswer": "option_2",
        "selectedAnswer": "option_2",
        "explanation": "Paris is the capital and largest city of France.",
        "timeSpent": 45
      }
    ],
    "feedback": {
      "message": "🎉 Congratulations! You passed the assessment.",
      "attemptsRemaining": 2
    }
  }
}
```

**Grading Logic:**

**Automatically Graded:**
- `MULTIPLE_CHOICE_SINGLE` - Exact match with correct option
- `MULTIPLE_CHOICE_MULTIPLE` - All correct options selected, no extras
- `TRUE_FALSE` - Boolean match
- `SHORT_ANSWER` / `FILL_IN_BLANK` - Case-insensitive exact match
- `NUMERIC` - Exact number match
- `DATE` - Exact date match

**Requires Manual Grading:**
- `LONG_ANSWER` - Essay responses
- `FILE_UPLOAD` - Uploaded files
- `MATCHING` - Matching pairs
- `ORDERING` - Sequence ordering
- `RATING_SCALE` - Subjective ratings

**Status Codes:**
- `200` - Success (submitted and graded)
- `400` - Bad Request (invalid responses)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no attempts remaining)
- `404` - Not found (assessment doesn't exist)

---

## Frontend Usage

### Get Assessment Details
```javascript
const getAssessment = async (assessmentId) => {
  const response = await fetch(
    `https://api.example.com/api/v1/explore/assessments/${assessmentId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  
  // Check if user can take assessment
  if (data.data.userProgress.canTakeAssessment) {
    console.log('User can take assessment');
  } else {
    console.log('No attempts remaining');
  }
  
  return data.data;
};
```

### Get Assessment Questions
```javascript
const getQuestions = async (assessmentId) => {
  const response = await fetch(
    `https://api.example.com/api/v1/explore/assessments/${assessmentId}/questions`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const data = await response.json();
  return data.data.questions;
};
```

### Submit Assessment
```javascript
const submitAssessment = async (assessmentId, responses, timeSpent) => {
  const response = await fetch(
    `https://api.example.com/api/v1/explore/assessments/${assessmentId}/submit`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        responses: responses,
        timeSpent: timeSpent
      })
    }
  );
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('No attempts remaining');
    }
    throw new Error('Failed to submit assessment');
  }
  
  const data = await response.json();
  return data.data;
};

// Usage Example
const responses = [
  {
    questionId: 'question_123',
    selectedOptions: ['option_2'],
    timeSpent: 45
  },
  {
    questionId: 'question_124',
    textAnswer: 'Paris',
    timeSpent: 30
  }
];

const result = await submitAssessment('assessment_123', responses, 1250);

if (result.results.passed) {
  console.log('Passed! Score:', result.results.percentage + '%');
} else {
  console.log('Failed. Try again!');
}
```

---

## Assessment Flow

```
1. User clicks "Take Assessment"
   GET /explore/assessments/:id
   → Check if user can take (attempts remaining)
   → Show assessment details and rules

2. User clicks "Start Assessment"
   GET /explore/assessments/:id/questions
   → Fetch all questions
   → Display questions one by one or all at once
   → User answers questions
   → Track time spent

3. User clicks "Submit Assessment"
   POST /explore/assessments/:id/submit
   → Submit all answers with time spent
   → Automatic grading (for supported question types)
   → Get immediate results
   → View score, correct answers (if enabled)
   → See remaining attempts
```

---

## Question Types

| Type | Description |
|------|-------------|
| `MULTIPLE_CHOICE_SINGLE` | Single correct answer |
| `MULTIPLE_CHOICE_MULTIPLE` | Multiple correct answers |
| `SHORT_ANSWER` | Text input (short) |
| `LONG_ANSWER` | Text area (essay) |
| `TRUE_FALSE` | Boolean choice |
| `FILL_IN_BLANK` | Fill in missing text |
| `MATCHING` | Match items |
| `ORDERING` | Order items correctly |
| `FILE_UPLOAD` | Upload file as answer |
| `NUMERIC` | Numeric input |
| `DATE` | Date picker |
| `RATING_SCALE` | Rating (1-5, etc.) |

---

## Important Notes

### Multiple Attempts
- Assessments support multiple attempts (default: 1)
- `maxAttempts` defines how many times a user can take the assessment
- `attemptsTaken` / `attemptsRemaining` tracks user progress
- Once all attempts are used, no more questions can be fetched

### Shuffling
- `shuffleQuestions: true` → Questions appear in random order
- `shuffleOptions: true` → Options appear in random order
- Shuffling happens server-side for fairness

### Security
- Correct answers are NEVER sent to frontend before submission
- Question explanations are NEVER sent before submission
- Only published and active assessments are accessible
- All grading happens server-side (cannot be tampered with)

### Grading
- Automatic grading for objective questions (multiple choice, numeric, etc.)
- Manual grading required for subjective questions (essays, file uploads)
- Partial credit NOT supported (all or nothing per question)
- Case-insensitive text matching for short answers
- Grade scale: A (90+), B (80+), C (70+), D (60+), F (<60)

### Response Display
- If `showCorrectAnswers: true` → Full response details with correct answers
- If `showCorrectAnswers: false` → Only isCorrect flag, no correct answers shown
- If `showFeedback: true` → Question explanations included
- If `showFeedback: false` → No explanations shown

### Date Validation
- `startDate` → Assessment not accessible before this date
- `endDate` → Assessment not accessible after this date
- Both are optional (null = no restriction)

---

**Base URL:** `https://api.example.com/api/v1`  
**Last Updated:** January 9, 2026

