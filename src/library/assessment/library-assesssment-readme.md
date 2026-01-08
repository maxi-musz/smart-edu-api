# Library Assessment API Documentation

This document provides request and response structures for all Library Assessment endpoints. All endpoints require authentication via JWT token in the `Authorization` header: `Bearer <token>`

**Base URL:** `/library/assessment`

**Response Format:** All responses follow this structure:
```typescript
{
  success: boolean;
  message: string;
  data: T; // Response data (varies by endpoint)
}
```

---

## 1. Create Assessment

**Endpoint:** `POST /library/assessment`

**Request Body:**
```typescript
{
  title: string;                    // Required: Assessment title
  description?: string;             // Optional: Assessment description
  instructions?: string;             // Optional: Instructions for users
  subjectId: string;                 // Required: Library Subject ID
  chapterId?: string;                // Optional: Library Chapter ID
  topicId?: string;                 // Optional: Library Topic ID
  duration?: number;                 // Optional: Duration in minutes (1-300)
  maxAttempts?: number;              // Optional: Max attempts (1-10, default: 1)
  passingScore?: number;             // Optional: Passing score % (0-100, default: 50)
  totalPoints?: number;              // Optional: Total points (default: 100)
  shuffleQuestions?: boolean;        // Optional: Shuffle questions (default: false)
  shuffleOptions?: boolean;          // Optional: Shuffle options (default: false)
  showCorrectAnswers?: boolean;      // Optional: Show correct answers (default: false)
  showFeedback?: boolean;            // Optional: Show feedback (default: true)
  allowReview?: boolean;             // Optional: Allow review (default: true)
  startDate?: string;                // Optional: ISO date string (e.g., "2024-01-15T09:00:00Z")
  endDate?: string;                 // Optional: ISO date string (default: 2 days from now)
  timeLimit?: number;                // Optional: Time limit in seconds (60-18000)
  gradingType?: "AUTOMATIC" | "MANUAL" | "MIXED";  // Optional (default: "AUTOMATIC")
  autoSubmit?: boolean;              // Optional: Auto-submit on time expiry (default: false)
  tags?: string[];                  // Optional: Array of tags
  assessmentType?: string;           // Optional: "CBT" | "ASSIGNMENT" | "EXAM" | "OTHER" | "FORMATIVE" | "SUMMATIVE" | "DIAGNOSTIC" | "BENCHMARK" | "PRACTICE" | "MOCK_EXAM" | "QUIZ" | "TEST" (default: "CBT")
}
```

**Response (201):**
```typescript
{
  success: true;
  message: "Assessment created successfully";
  data: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    assessmentType: string;
    status: "DRAFT";
    duration: number | null;
    timeLimit: number | null;
    maxAttempts: number;
    passingScore: number;
    totalPoints: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showCorrectAnswers: boolean;
    showFeedback: boolean;
    allowReview: boolean;
    startDate: string | null;
    endDate: string | null;
    gradingType: string;
    autoSubmit: boolean;
    tags: string[];
    isPublished: boolean;
    createdAt: string;
    updatedAt: string;
    subject: {
      id: string;
      name: string;
      code: string | null;
    };
    chapter: {
      id: string;
      title: string;
    } | null;
    topic: {
      id: string;
      title: string;
    } | null;
    createdBy: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}
```

---

## 2. Get Assessments by Topic

**Endpoint:** `GET /library/assessment/topic/:topicId`

**URL Parameters:**
- `topicId` (string): The ID of the topic

**Response (200):**
```typescript
{
  success: true;
  message: "Assessments retrieved successfully";
  data: {
    topic: {
      id: string;
      title: string;
      description: string | null;
      subject: {
        id: string;
        name: string;
        code: string | null;
      };
      chapter: {
        id: string;
        title: string;
      } | null;
    };
    assessments: Array<{
      id: string;
      title: string;
      description: string | null;
      instructions: string | null;
      assessmentType: string;
      status: string;
      duration: number | null;
      timeLimit: number | null;
      startDate: string | null;
      endDate: string | null;
      maxAttempts: number;
      totalPoints: number;
      passingScore: number;
      isPublished: boolean;
      publishedAt: string | null;
      isResultReleased: boolean;
      tags: string[];
      order: number | null;
      createdAt: string;
      updatedAt: string;
      createdBy: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
      };
      subject: {
        id: string;
        name: string;
        code: string | null;
      };
      chapter: {
        id: string;
        title: string;
      } | null;
      _count: {
        questions: number;
        attempts: number;
      };
    }>;
    totalCount: number;
  };
}
```

---

## 3. Get Assessment by ID

**Endpoint:** `GET /library/assessment/:id`

**URL Parameters:**
- `id` (string): The assessment ID

**Response (200):**
```typescript
{
  success: true;
  message: "Assessment retrieved successfully";
  data: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    assessmentType: string;
    status: string;
    duration: number | null;
    timeLimit: number | null;
    maxAttempts: number;
    passingScore: number;
    totalPoints: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showCorrectAnswers: boolean;
    showFeedback: boolean;
    allowReview: boolean;
    startDate: string | null;
    endDate: string | null;
    gradingType: string;
    autoSubmit: boolean;
    tags: string[];
    isPublished: boolean;
    publishedAt: string | null;
    isResultReleased: boolean;
    resultReleasedAt: string | null;
    createdAt: string;
    updatedAt: string;
    subject: {
      id: string;
      name: string;
      code: string | null;
    };
    chapter: {
      id: string;
      title: string;
    } | null;
    topic: {
      id: string;
      title: string;
    } | null;
    createdBy: {
      id: string;
      first_name: string;
      last_name: string;
    };
    questions: Array<{
      id: string;
      questionText: string;
      questionType: string;
      order: number;
      points: number;
      isRequired: boolean;
      timeLimit: number | null;
      imageUrl: string | null;
      audioUrl: string | null;
      videoUrl: string | null;
      allowMultipleAttempts: boolean;
      showHint: boolean;
      hintText: string | null;
      minLength: number | null;
      maxLength: number | null;
      minValue: number | null;
      maxValue: number | null;
      explanation: string | null;
      difficultyLevel: string;
      createdAt: string;
      updatedAt: string;
      options: Array<{
        id: string;
        optionText: string;
        order: number;
        isCorrect: boolean;
        imageUrl: string | null;
        audioUrl: string | null;
      }>;
      correctAnswers: Array<{
        id: string;
        answerText: string | null;
        answerNumber: number | null;
        answerDate: string | null;
        optionIds: string[];
        answerJson: any;
      }>;
      _count: {
        responses: number;
      };
    }>;
    _count: {
      attempts: number;
    };
  };
}
```

---

## 4. Get Assessment Questions

**Endpoint:** `GET /library/assessment/:id/questions`

**URL Parameters:**
- `id` (string): The assessment ID

**Response (200):**
```typescript
{
  success: true;
  message: "Assessment questions retrieved successfully";
  data: {
    assessment: {
      id: string;
      title: string;
      description: string | null;
      assessmentType: string;
      status: string;
      totalPoints: number;
      duration: number | null;
      subject: {
        id: string;
        name: string;
        code: string | null;
      };
      topic: {
        id: string;
        title: string;
      } | null;
    };
    questions: Array<{
      id: string;
      questionText: string;
      questionType: string;
      order: number;
      points: number;
      isRequired: boolean;
      timeLimit: number | null;
      imageUrl: string | null;
      audioUrl: string | null;
      videoUrl: string | null;
      allowMultipleAttempts: boolean;
      showHint: boolean;
      hintText: string | null;
      minLength: number | null;
      maxLength: number | null;
      minValue: number | null;
      maxValue: number | null;
      explanation: string | null;
      difficultyLevel: string;
      createdAt: string;
      updatedAt: string;
      options: Array<{
        id: string;
        optionText: string;
        order: number;
        isCorrect: boolean;
        imageUrl: string | null;
        audioUrl: string | null;
      }>;
      correctAnswers: Array<{
        id: string;
        answerText: string | null;
        answerNumber: number | null;
        answerDate: string | null;
        optionIds: string[];
        answerJson: any;
      }>;
      totalResponses: number;
    }>;
    totalQuestions: number;
    totalPoints: number;
  };
}
```

---

## 5. Upload Question Image

**Endpoint:** `POST /library/assessment/:id/questions/upload-image`

**Content-Type:** `multipart/form-data`

**URL Parameters:**
- `id` (string): The assessment ID

**Request Body (Form Data):**
- `image` (File): Image file (JPEG, PNG, GIF, WEBP, max 5MB)

**Response (201):**
```typescript
{
  success: true;
  message: "Image uploaded successfully";
  data: {
    imageUrl: string;      // Full URL to the uploaded image
    imageS3Key: string;   // S3 key for the image (use this or imageUrl when creating question)
  };
}
```

---

## 6. Create Question

**Endpoint:** `POST /library/assessment/:id/questions`

**URL Parameters:**
- `id` (string): The assessment ID

**Request Body:**
```typescript
{
  questionText: string;              // Required: The question text
  questionType: string;              // Required: "MULTIPLE_CHOICE_SINGLE" | "MULTIPLE_CHOICE_MULTIPLE" | "SHORT_ANSWER" | "LONG_ANSWER" | "TRUE_FALSE" | "FILL_IN_BLANK" | "MATCHING" | "ORDERING" | "FILE_UPLOAD" | "NUMERIC" | "DATE" | "RATING_SCALE"
  order?: number;                    // Optional: Question order (auto-assigned if not provided)
  points?: number;                   // Optional: Points for this question (default: 1.0, min: 0.1)
  isRequired?: boolean;              // Optional: Is required (default: true)
  timeLimit?: number;                // Optional: Time limit in seconds (min: 10)
  imageUrl?: string;                 // Optional: Image URL (from upload-image endpoint)
  imageS3Key?: string;               // Optional: S3 key (from upload-image endpoint, auto-extracted from URL if not provided)
  audioUrl?: string;                 // Optional: Audio URL
  videoUrl?: string;                 // Optional: Video URL
  allowMultipleAttempts?: boolean;   // Optional: Allow multiple attempts (default: false)
  showHint?: boolean;                // Optional: Show hint (default: false)
  hintText?: string;                 // Optional: Hint text
  minLength?: number;               // Optional: Min length for text answers (min: 1)
  maxLength?: number;                // Optional: Max length for text answers (min: 1)
  minValue?: number;                 // Optional: Min value for numeric answers
  maxValue?: number;                 // Optional: Max value for numeric answers
  explanation?: string;              // Optional: Explanation for correct answer
  difficultyLevel?: "EASY" | "MEDIUM" | "HARD" | "EXPERT";  // Optional (default: "MEDIUM")
  options?: Array<{                   // Optional: For multiple choice questions
    optionText: string;              // Required: Option text
    order: number;                   // Required: Option order (min: 1)
    isCorrect: boolean;              // Required: Is this option correct
    imageUrl?: string;              // Optional: Image URL for option
    audioUrl?: string;              // Optional: Audio URL for option
  }>;
  correctAnswers?: Array<{          // Optional: Correct answers
    answerText?: string;            // Optional: Text answer
    answerNumber?: number;          // Optional: Numeric answer
    answerDate?: string;            // Optional: Date answer (ISO string)
    optionIds?: string[];          // Optional: Array of correct option IDs
    answerJson?: any;               // Optional: Complex answer data (for matching, ordering, etc.)
  }>;
}
```

**Response (201):**
```typescript
{
  success: true;
  message: "Question created successfully";
  data: {
    question: {
      id: string;
      questionText: string;
      questionType: string;
      order: number;
      points: number;
      isRequired: boolean;
      timeLimit: number | null;
      imageUrl: string | null;
      audioUrl: string | null;
      videoUrl: string | null;
      allowMultipleAttempts: boolean;
      showHint: boolean;
      hintText: string | null;
      minLength: number | null;
      maxLength: number | null;
      minValue: number | null;
      maxValue: number | null;
      explanation: string | null;
      difficultyLevel: string;
      createdAt: string;
      updatedAt: string;
    };
    options: Array<{
      id: string;
      optionText: string;
      order: number;
      isCorrect: boolean;
      imageUrl: string | null;
      audioUrl: string | null;
    }>;
    correctAnswers: Array<{
      id: string;
      answerText: string | null;
      answerNumber: number | null;
      answerDate: string | null;
      optionIds: string[];
      answerJson: any;
    }>;
    assessment: {
      id: string;
      title: string;
      totalPoints: number;
    };
  };
}
```

---

## 7. Update Question

**Endpoint:** `PATCH /library/assessment/:assessmentId/questions/:questionId`

**Content-Type:** `multipart/form-data` (if uploading new image) or `application/json`

**URL Parameters:**
- `assessmentId` (string): The assessment ID
- `questionId` (string): The question ID

**Request Body:**
Same structure as Create Question, but all fields are optional. If `options` or `correctAnswers` are provided, they completely replace existing ones.

**Form Data (if uploading image):**
- `image` (File): Optional new image file (replaces existing image)

**Response (200):**
Same structure as Create Question response.

---

## 8. Delete Question Image

**Endpoint:** `DELETE /library/assessment/:assessmentId/questions/:questionId/image`

**URL Parameters:**
- `assessmentId` (string): The assessment ID
- `questionId` (string): The question ID

**Response (200):**
```typescript
{
  success: true;
  message: "Question image deleted successfully";
  data: {
    question_id: string;
    image_deleted: true;
  };
}
```

---

## 9. Delete Question

**Endpoint:** `DELETE /library/assessment/:assessmentId/questions/:questionId`

**URL Parameters:**
- `assessmentId` (string): The assessment ID
- `questionId` (string): The question ID

**Response (200):**
```typescript
{
  success: true;
  message: "Question deleted successfully";
  data: {
    deleted_question: {
      id: string;
      question_text: string;
      order: number;
      points: number;
    };
    assessment: {
      id: string;
      title: string;
      total_points: number;
    };
  };
}
```

---

## 10. Update Assessment

**Endpoint:** `PATCH /library/assessment/:id`

**URL Parameters:**
- `id` (string): The assessment ID

**Request Body:**
Same structure as Create Assessment, but all fields are optional. Additionally:
```typescript
{
  status?: "DRAFT" | "PUBLISHED" | "ACTIVE" | "CLOSED" | "ARCHIVED";  // Optional: Assessment status
  // ... all other fields from Create Assessment are optional
}
```

**Response (200):**
Same structure as Create Assessment response.

---

## 11. Delete Assessment

**Endpoint:** `DELETE /library/assessment/:id`

**URL Parameters:**
- `id` (string): The assessment ID

**Response (200):**
```typescript
{
  success: true;
  message: "Assessment deleted successfully";
  data: null;
}
```

---

## 12. Publish Assessment

**Endpoint:** `POST /library/assessment/:id/publish`

**URL Parameters:**
- `id` (string): The assessment ID

**Response (200):**
```typescript
{
  success: true;
  message: "Assessment published successfully";
  data: {
    // Same structure as Get Assessment by ID response
  };
}
```

---

## 13. Unpublish Assessment

**Endpoint:** `POST /library/assessment/:id/unpublish`

**URL Parameters:**
- `id` (string): The assessment ID

**Response (200):**
```typescript
{
  success: true;
  message: "Assessment unpublished successfully";
  data: {
    // Same structure as Get Assessment by ID response
  };
}
```

---

## 14. Release Assessment Results

**Endpoint:** `POST /library/assessment/:id/release-results`

**URL Parameters:**
- `id` (string): The assessment ID

**Response (200):**
```typescript
{
  success: true;
  message: "Assessment results released successfully. Assessment has been closed.";
  data: {
    // Same structure as Get Assessment by ID response
    // status will be "CLOSED"
    // isResultReleased will be true
    // resultReleasedAt will be set
  };
}
```

---

## 15. Get Assessment Analytics

**Endpoint:** `GET /library/assessment/analytics/:assessmentId`

**URL Parameters:**
- `assessmentId` (string): The assessment ID

**Response (200):**
```typescript
{
  success: true;
  message: "Assessment analytics retrieved successfully";
  data: {
    assessment: {
      id: string;
      title: string;
      totalPoints: number;
      passingScore: number;
    };
    statistics: {
      totalAttempts: number;
      submittedAttempts: number;
      averageScore: number;
      passRate: number;
      passedCount: number;
      failedCount: number;
    };
    users: Array<{
      userId: string;
      email: string;
      firstName: string;
      lastName: string;
      displayPicture: string | null;
      attemptCount: number;
      latestAttempt: {
        id: string;
        attemptNumber: number;
        status: string;
        startedAt: string | null;
        submittedAt: string | null;
        timeSpent: number | null;
        totalScore: number;
        maxScore: number;
        percentage: number;
        passed: boolean;
        isGraded: boolean;
        gradedAt: string | null;
        gradeLetter: string | null;
        overallFeedback: string | null;
      } | null;
      bestScore: number | null;
      averageScore: number | null;
    }>;
  };
}
```

---

## 16. Get User Assessment History

**Endpoint:** `GET /library/assessment/user-history/:userId`

**URL Parameters:**
- `userId` (string): The user ID

**Response (200):**
```typescript
{
  success: true;
  message: "User assessment history retrieved successfully";
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      displayPicture: string | null;
    };
    statistics: {
      totalAttempts: number;
      submittedAttempts: number;
      uniqueAssessments: number;
      averageScore: number;
      passRate: number;
      passedCount: number;
      failedCount: number;
    };
    attempts: Array<{
      id: string;
      assessmentId: string;
      assessmentTitle: string;
      attemptNumber: number;
      status: string;
      startedAt: string | null;
      submittedAt: string | null;
      timeSpent: number | null;
      totalScore: number;
      maxScore: number;
      percentage: number;
      passed: boolean;
      isGraded: boolean;
      gradedAt: string | null;
      gradeLetter: string | null;
      overallFeedback: string | null;
      createdAt: string;
    }>;
  };
}
```

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```typescript
{
  success: false;
  message: string;  // Error description
  statusCode: 400;
}
```

**401 Unauthorized:**
```typescript
{
  success: false;
  message: "Unauthorized - invalid or missing JWT token";
  statusCode: 401;
}
```

**404 Not Found:**
```typescript
{
  success: false;
  message: string;  // e.g., "Assessment not found or access denied"
  statusCode: 404;
}
```

**500 Internal Server Error:**
```typescript
{
  success: false;
  message: string;  // Error description
  statusCode: 500;
}
```

---

## Notes

1. **Authentication:** All endpoints require a valid JWT token in the `Authorization` header as `Bearer <token>`

2. **Image Upload:** When creating a question with an image:
   - First call `POST /library/assessment/:id/questions/upload-image` to upload the image
   - Use the returned `imageUrl` or `imageS3Key` in the `createQuestion` request

3. **Question Order:** If `order` is not provided when creating a question, it will be auto-assigned as the next available order number

4. **Assessment Status Flow:**
   - Created assessments start in `DRAFT` status
   - Use `POST /library/assessment/:id/publish` to publish (changes to `ACTIVE` or `PUBLISHED`)
   - Use `POST /library/assessment/:id/unpublish` to unpublish (changes back to `DRAFT`)
   - Use `POST /library/assessment/:id/release-results` to release results and close (changes to `CLOSED`)

5. **Question Types:** Supported question types include:
   - `MULTIPLE_CHOICE_SINGLE`: Single correct answer
   - `MULTIPLE_CHOICE_MULTIPLE`: Multiple correct answers
   - `SHORT_ANSWER`: Short text answer
   - `LONG_ANSWER`: Long text answer
   - `TRUE_FALSE`: True/False question
   - `FILL_IN_BLANK`: Fill in the blank
   - `MATCHING`: Matching question
   - `ORDERING`: Ordering question
   - `FILE_UPLOAD`: File upload question
   - `NUMERIC`: Numeric answer
   - `DATE`: Date answer
   - `RATING_SCALE`: Rating scale question

6. **Deletion Restrictions:**
   - Questions with user responses cannot be deleted
   - Assessments with user attempts cannot be deleted

