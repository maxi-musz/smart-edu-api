# Library CBT Assessment API Documentation

## Overview
This document provides complete API documentation for Library CBT (Computer-Based Test) Assessments. These endpoints allow library owners to create, manage, and publish CBT assessments for their platform users.

**Base URL**: `/library/assessment/cbt`  
**Authentication**: Bearer Token (Library JWT)  
**Content-Type**: `application/json` (except for image upload which uses `multipart/form-data`)

---

## Table of Contents
1. [Create CBT Assessment](#1-create-cbt-assessment)
2. [Upload Question Image](#2-upload-question-image)
3. [Create Question](#3-create-question)
4. [Get CBT Questions](#4-get-cbt-questions)
5. [Update Question](#5-update-question)
6. [Delete Question Image](#6-delete-question-image)
7. [Delete Question](#7-delete-question)
8. [Update CBT](#8-update-cbt)
9. [Delete CBT](#9-delete-cbt)
10. [Publish CBT](#10-publish-cbt)
11. [Unpublish CBT](#11-unpublish-cbt)
12. [Get CBT by ID](#12-get-cbt-by-id)

---

## 1. Create CBT Assessment

Create a new Computer-Based Test assessment.

**Endpoint**: `POST /library/assessment/cbt`

### Request Body

```typescript
interface CreateCBTRequest {
  // Required fields
  title: string;                    // Title of the CBT
  subjectId: string;                // Library Subject ID

  // Optional fields
  description?: string;             // Description of the CBT
  instructions?: string;            // Instructions for users
  chapterId?: string;               // Chapter ID (for chapter-level CBT)
  topicId?: string;                 // Topic ID (for topic-level CBT)
  duration?: number;                // Duration in minutes (1-300)
  timeLimit?: number;               // Time limit in seconds (60-18000)
  startDate?: string;               // ISO date string (e.g., "2025-01-15T09:00:00Z")
  endDate?: string;                 // ISO date string
  maxAttempts?: number;             // Max attempts per user (1-10, default: 1)
  passingScore?: number;            // Passing score percentage (0-100, default: 50)
  totalPoints?: number;             // Total points (min: 1, default: 100)
  shuffleQuestions?: boolean;       // Shuffle question order (default: false)
  shuffleOptions?: boolean;         // Shuffle option order (default: false)
  showCorrectAnswers?: boolean;     // Show correct answers after submission (default: false)
  showFeedback?: boolean;           // Show feedback/explanation (default: true)
  studentCanViewGrading?: boolean;  // Allow users to view grading (default: true)
  allowReview?: boolean;            // Allow review after submission (default: true)
  gradingType?: 'AUTOMATIC' | 'MANUAL' | 'MIXED';  // Default: AUTOMATIC
  autoSubmit?: boolean;             // Auto-submit on time expiry (default: false)
  tags?: string[];                  // Tags for categorization
  order?: number;                   // Display order (default: 0)
}
```

### Example Request

```json
{
  "title": "Algebra Basics CBT",
  "description": "Test your understanding of algebra fundamentals",
  "instructions": "Answer all questions carefully. You have 30 minutes.",
  "subjectId": "cmjb9sub123",
  "topicId": "cmjb9topic456",
  "duration": 30,
  "maxAttempts": 3,
  "passingScore": 50,
  "totalPoints": 100,
  "shuffleQuestions": true,
  "shuffleOptions": false,
  "showCorrectAnswers": true,
  "showFeedback": true,
  "allowReview": true,
  "gradingType": "AUTOMATIC",
  "autoSubmit": true,
  "tags": ["algebra", "mathematics", "basics"]
}
```

### Response

```typescript
interface CreateCBTResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    assessmentType: 'CBT';
    gradingType: string;
    status: 'DRAFT';
    isPublished: false;
    publishedAt: null;
    // ... all other fields from request
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
    };
  };
  statusCode: 201;
}
```

---

## 2. Upload Question Image

Upload an image for a question (must be done BEFORE creating the question).

**Endpoint**: `POST /library/assessment/cbt/:id/questions/upload-image`  
**Content-Type**: `multipart/form-data`

### Request

- **URL Parameter**: `id` (CBT assessment ID)
- **Form Data**: `image` (image file)
  - Supported formats: JPEG, PNG, GIF, WEBP
  - Max size: 5MB

### Example (using FormData)

```typescript
const formData = new FormData();
formData.append('image', imageFile); // imageFile is a File object

const response = await fetch('/library/assessment/cbt/cmjb9cbt123/questions/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

### Response

```typescript
interface UploadImageResponse {
  success: boolean;
  message: string;
  data: {
    imageUrl: string;        // Full S3 URL
    imageS3Key: string;      // S3 key for reference
  };
  statusCode: 201;
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Question image uploaded successfully",
  "data": {
    "imageUrl": "https://s3.amazonaws.com/bucket/library-assessment-images/platforms/123/assessments/456/question_1736339267_image.jpg",
    "imageS3Key": "library-assessment-images/platforms/123/assessments/456/question_1736339267_image.jpg"
  },
  "statusCode": 201
}
```

---

## 3. Create Question

Add a new question to a CBT assessment.

**Endpoint**: `POST /library/assessment/cbt/:id/questions`

### Question Types

```typescript
type QuestionType =
  | 'MULTIPLE_CHOICE_SINGLE'    // Single correct answer
  | 'MULTIPLE_CHOICE_MULTIPLE'  // Multiple correct answers
  | 'TRUE_FALSE'                // True/False question
  | 'SHORT_ANSWER'              // Short text answer
  | 'LONG_ANSWER'               // Long text answer
  | 'FILL_IN_BLANK'             // Fill in the blank
  | 'MATCHING'                  // Match pairs
  | 'ORDERING'                  // Order items
  | 'FILE_UPLOAD'               // Upload a file
  | 'NUMERIC'                   // Numeric answer
  | 'DATE'                      // Date answer
  | 'RATING_SCALE';             // Rating scale
```

### Request Body

```typescript
interface CreateQuestionRequest {
  // Required fields
  questionText: string;                           // Question text/prompt
  questionType: QuestionType;                     // Type of question

  // Optional fields
  order?: number;                                 // Order/position (auto-assigned if not provided)
  points?: number;                                // Points (default: 1.0, min: 0.1)
  isRequired?: boolean;                           // Is required (default: true)
  timeLimit?: number;                             // Time limit in seconds (min: 10)
  
  // Media URLs (use imageUrl from upload-image endpoint)
  imageUrl?: string;                              // Question image URL
  imageS3Key?: string;                            // S3 key from upload-image
  audioUrl?: string;                              // Audio URL
  videoUrl?: string;                              // Video URL
  
  // Hints and explanations
  allowMultipleAttempts?: boolean;                // Allow multiple attempts (default: false)
  showHint?: boolean;                             // Show hint (default: false)
  hintText?: string;                              // Hint text
  explanation?: string;                           // Explanation for correct answer
  
  // Text constraints (for text-based questions)
  minLength?: number;                             // Min length (characters)
  maxLength?: number;                             // Max length (characters)
  
  // Numeric constraints (for numeric questions)
  minValue?: number;                              // Min value
  maxValue?: number;                              // Max value
  
  // Difficulty
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';  // Default: MEDIUM
  
  // Options (for multiple choice and true/false)
  options?: Array<{
    optionText: string;                           // Option text
    order: number;                                // Option order
    isCorrect: boolean;                           // Is this option correct?
    imageUrl?: string;                            // Option image URL
    audioUrl?: string;                            // Option audio URL
  }>;
  
  // Alternative way to specify correct answers
  correctAnswers?: Array<{
    answerText?: string;                          // For text answers
    answerNumber?: number;                        // For numeric answers
    answerDate?: string;                          // For date answers (ISO string)
    optionIds?: string[];                         // For multiple choice (option IDs)
    answerJson?: any;                             // For complex answers (matching, ordering)
  }>;
}
```

### Example Request (Multiple Choice Single)

```json
{
  "questionText": "What is the capital of France?",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 2,
  "isRequired": true,
  "explanation": "Paris is the capital and largest city of France.",
  "difficultyLevel": "EASY",
  "options": [
    { "optionText": "Paris", "order": 1, "isCorrect": true },
    { "optionText": "London", "order": 2, "isCorrect": false },
    { "optionText": "Berlin", "order": 3, "isCorrect": false },
    { "optionText": "Madrid", "order": 4, "isCorrect": false }
  ]
}
```

### Example Request (True/False)

```json
{
  "questionText": "The Earth is flat.",
  "questionType": "TRUE_FALSE",
  "points": 1,
  "explanation": "The Earth is approximately spherical in shape.",
  "difficultyLevel": "EASY",
  "options": [
    { "optionText": "True", "order": 1, "isCorrect": false },
    { "optionText": "False", "order": 2, "isCorrect": true }
  ]
}
```

### Example Request (With Image)

```json
{
  "questionText": "Identify the shape shown in the image:",
  "questionType": "MULTIPLE_CHOICE_SINGLE",
  "points": 2,
  "imageUrl": "https://s3.amazonaws.com/bucket/library-assessment-images/.../question_image.jpg",
  "imageS3Key": "library-assessment-images/.../question_image.jpg",
  "options": [
    { "optionText": "Circle", "order": 1, "isCorrect": false },
    { "optionText": "Square", "order": 2, "isCorrect": true },
    { "optionText": "Triangle", "order": 3, "isCorrect": false }
  ]
}
```

### Example Request (Short Answer)

```json
{
  "questionText": "What is the chemical formula for water?",
  "questionType": "SHORT_ANSWER",
  "points": 1,
  "minLength": 2,
  "maxLength": 10,
  "explanation": "Water is H2O - two hydrogen atoms bonded to one oxygen atom.",
  "correctAnswers": [
    { "answerText": "H2O" },
    { "answerText": "h2o" }
  ]
}
```

### Response

```typescript
interface CreateQuestionResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    questionText: string;
    questionType: string;
    order: number;
    points: number;
    isRequired: boolean;
    // ... all other fields
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
      answerJson: any | null;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  statusCode: 201;
}
```

---

## 4. Get CBT Questions

Retrieve all questions for a CBT assessment.

**Endpoint**: `GET /library/assessment/cbt/:id/questions`

### Request

- **URL Parameter**: `id` (CBT assessment ID)

### Response

```typescript
interface GetQuestionsResponse {
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    questionText: string;
    questionType: string;
    order: number;
    points: number;
    // ... all question fields
    options: Array<{
      id: string;
      optionText: string;
      order: number;
      isCorrect: boolean;  // Visible to library owners
      imageUrl: string | null;
      audioUrl: string | null;
    }>;
    correctAnswers: Array<{
      id: string;
      answerText: string | null;
      answerNumber: number | null;
      answerDate: string | null;
      optionIds: string[];
      answerJson: any | null;
    }>;
  }>;
  statusCode: 200;
}
```

---

## 5. Update Question

Update an existing question in a CBT.

**Endpoint**: `PATCH /library/assessment/cbt/:assessmentId/questions/:questionId`  
**Content-Type**: `multipart/form-data` (if uploading image) or `application/json`

### Request Body

All fields are optional - only provide fields you want to update.

```typescript
interface UpdateQuestionRequest {
  questionText?: string;
  questionType?: QuestionType;
  order?: number;
  points?: number;
  isRequired?: boolean;
  timeLimit?: number;
  imageUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
  allowMultipleAttempts?: boolean;
  showHint?: boolean;
  hintText?: string;
  explanation?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  difficultyLevel?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  
  // Options array completely replaces existing options
  options?: Array<{
    id?: string;              // Provide ID for existing options
    optionText: string;
    order: number;
    isCorrect: boolean;
    imageUrl?: string;
    audioUrl?: string;
  }>;
  
  // CorrectAnswers array completely replaces existing answers
  correctAnswers?: Array<{
    id?: string;              // Provide ID for existing answers
    answerText?: string;
    answerNumber?: number;
    answerDate?: string;
    optionIds?: string[];
    answerJson?: any;
  }>;
}
```

### Example Request (Update Question Text and Points)

```json
{
  "questionText": "What is the capital city of France?",
  "points": 3
}
```

### Example Request (Update Options)

```json
{
  "options": [
    { "id": "opt123", "optionText": "Paris", "order": 1, "isCorrect": true },
    { "optionText": "Rome", "order": 2, "isCorrect": false },
    { "optionText": "Madrid", "order": 3, "isCorrect": false }
  ]
}
```

### Response

Same structure as Create Question response.

---

## 6. Delete Question Image

Delete the image from a question.

**Endpoint**: `DELETE /library/assessment/cbt/:assessmentId/questions/:questionId/image`

### Request

- **URL Parameters**: 
  - `assessmentId` (CBT assessment ID)
  - `questionId` (Question ID)

### Response

```typescript
interface DeleteImageResponse {
  success: boolean;
  message: string;
  data: any;
  statusCode: 200;
}
```

---

## 7. Delete Question

Delete a question from a CBT.

**Endpoint**: `DELETE /library/assessment/cbt/:assessmentId/questions/:questionId`

### Request

- **URL Parameters**: 
  - `assessmentId` (CBT assessment ID)
  - `questionId` (Question ID)

### Response

```typescript
interface DeleteQuestionResponse {
  success: boolean;
  message: string;
  data: any;
  statusCode: 200;
}
```

**Note**: Questions cannot be deleted if the CBT has user attempts.

---

## 8. Update CBT

Update a CBT assessment.

**Endpoint**: `PATCH /library/assessment/cbt/:id`

### Request Body

All fields are optional - only provide fields you want to update.

```typescript
interface UpdateCBTRequest {
  title?: string;
  description?: string;
  instructions?: string;
  duration?: number;
  timeLimit?: number;
  startDate?: string;
  endDate?: string;
  maxAttempts?: number;
  passingScore?: number;
  totalPoints?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswers?: boolean;
  showFeedback?: boolean;
  studentCanViewGrading?: boolean;
  allowReview?: boolean;
  gradingType?: 'AUTOMATIC' | 'MANUAL' | 'MIXED';
  autoSubmit?: boolean;
  tags?: string[];
  order?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
}
```

### Example Request

```json
{
  "title": "Algebra Basics CBT - Updated",
  "duration": 45,
  "passingScore": 60
}
```

### Response

Returns the updated CBT assessment object.

---

## 9. Delete CBT

Delete a CBT assessment.

**Endpoint**: `DELETE /library/assessment/cbt/:id`

### Request

- **URL Parameter**: `id` (CBT assessment ID)

### Response

```typescript
interface DeleteCBTResponse {
  success: boolean;
  message: string;
  data: any;
  statusCode: 200;
}
```

**Note**: CBTs cannot be deleted if they have user attempts. Archive instead.

---

## 10. Publish CBT

Publish a CBT to make it available to users.

**Endpoint**: `POST /library/assessment/cbt/:id/publish`

### Request

- **URL Parameter**: `id` (CBT assessment ID)

### Response

```typescript
interface PublishCBTResponse {
  success: boolean;
  message: string;
  data: {
    // Updated CBT with isPublished: true and publishedAt timestamp
  };
  statusCode: 200;
}
```

**Note**: CBT must have at least one question before publishing.

---

## 11. Unpublish CBT

Unpublish a CBT to hide it from users.

**Endpoint**: `POST /library/assessment/cbt/:id/unpublish`

### Request

- **URL Parameter**: `id` (CBT assessment ID)

### Response

```typescript
interface UnpublishCBTResponse {
  success: boolean;
  message: string;
  data: {
    // Updated CBT with isPublished: false
  };
  statusCode: 200;
}
```

---

## 12. Get CBT by ID

Retrieve a specific CBT assessment.

**Endpoint**: `GET /library/assessment/cbt/:id`

### Request

- **URL Parameter**: `id` (CBT assessment ID)

### Response

```typescript
interface GetCBTResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    assessmentType: 'CBT';
    gradingType: string;
    status: string;
    duration: number | null;
    timeLimit: number | null;
    startDate: string | null;
    endDate: string | null;
    maxAttempts: number;
    passingScore: number;
    totalPoints: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    showCorrectAnswers: boolean;
    showFeedback: boolean;
    studentCanViewGrading: boolean;
    allowReview: boolean;
    autoSubmit: boolean;
    tags: string[];
    order: number;
    isPublished: boolean;
    publishedAt: string | null;
    isResultReleased: boolean;
    resultReleasedAt: string | null;
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
    topic: {
      id: string;
      title: string;
    } | null;
    _count: {
      questions: number;
      attempts: number;
    };
  };
  statusCode: 200;
}
```

---

## Status Flow

```
DRAFT → PUBLISHED → ACTIVE → CLOSED → ARCHIVED
  ↑         ↓
  └─────────┘ (unpublish)
```

- **DRAFT**: Initial state, not visible to users
- **PUBLISHED**: Visible to users, can be attempted
- **ACTIVE**: Currently active/ongoing
- **CLOSED**: Ended, no new attempts allowed
- **ARCHIVED**: Archived for record-keeping

---

## Error Responses

All endpoints return errors in this format:

```typescript
interface ErrorResponse {
  success: false;
  message: string;
  statusCode: 400 | 401 | 404 | 500;
}
```

### Common Error Codes

- **400**: Bad Request - Invalid data
- **401**: Unauthorized - Missing/invalid token
- **404**: Not Found - Resource not found or access denied
- **500**: Internal Server Error

---

## Important Notes

### Authentication
- All endpoints require Bearer token authentication
- Token must be a valid Library JWT token
- Include in header: `Authorization: Bearer <token>`

### Image Upload Workflow
1. Upload image using `/cbt/:id/questions/upload-image`
2. Get `imageUrl` and `imageS3Key` from response
3. Use these values when creating/updating question

### Question Types
- **Multiple Choice (Single/Multiple)**: Requires `options` array
- **True/False**: Special case of multiple choice with 2 options
- **Text Answers**: Can have `minLength`/`maxLength` constraints
- **Numeric**: Can have `minValue`/`maxValue` constraints

### Deletion Restrictions
- Questions cannot be deleted if CBT has user attempts
- CBT cannot be deleted if it has user attempts
- Use archiving for CBTs that have been used

### Publishing Requirements
- CBT must have at least one question before publishing
- Once published, CBT becomes visible to platform users
- Unpublishing hides the CBT but preserves all data

---

## TypeScript Types Summary

```typescript
// Main CBT Type
interface CBT {
  id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  assessmentType: 'CBT';
  gradingType: 'AUTOMATIC' | 'MANUAL' | 'MIXED';
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  duration: number | null;
  timeLimit: number | null;
  startDate: string | null;
  endDate: string | null;
  maxAttempts: number;
  passingScore: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswers: boolean;
  showFeedback: boolean;
  studentCanViewGrading: boolean;
  allowReview: boolean;
  autoSubmit: boolean;
  tags: string[];
  order: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Question Type
interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
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
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  options: Option[];
  correctAnswers: CorrectAnswer[];
  createdAt: string;
  updatedAt: string;
}

// Option Type
interface Option {
  id: string;
  optionText: string;
  order: number;
  isCorrect: boolean;
  imageUrl: string | null;
  audioUrl: string | null;
}

// Correct Answer Type
interface CorrectAnswer {
  id: string;
  answerText: string | null;
  answerNumber: number | null;
  answerDate: string | null;
  optionIds: string[];
  answerJson: any | null;
}
```

---

## Example: Complete CBT Creation Flow

```typescript
// 1. Create CBT
const createCBTResponse = await fetch('/library/assessment/cbt', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Algebra Quiz',
    subjectId: 'cmjb9sub123',
    topicId: 'cmjb9topic456',
    duration: 30,
    maxAttempts: 3,
  }),
});
const cbt = await createCBTResponse.json();
const cbtId = cbt.data.id;

// 2. Upload image for question 1
const imageFormData = new FormData();
imageFormData.append('image', questionImageFile);

const imageResponse = await fetch(`/library/assessment/cbt/${cbtId}/questions/upload-image`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: imageFormData,
});
const imageData = await imageResponse.json();

// 3. Create question 1 with image
await fetch(`/library/assessment/cbt/${cbtId}/questions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    questionText: 'Solve for x: 2x + 5 = 15',
    questionType: 'MULTIPLE_CHOICE_SINGLE',
    points: 2,
    imageUrl: imageData.data.imageUrl,
    imageS3Key: imageData.data.imageS3Key,
    options: [
      { optionText: 'x = 5', order: 1, isCorrect: true },
      { optionText: 'x = 10', order: 2, isCorrect: false },
      { optionText: 'x = 7.5', order: 3, isCorrect: false },
    ],
  }),
});

// 4. Create question 2 (no image)
await fetch(`/library/assessment/cbt/${cbtId}/questions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    questionText: 'Is 2 + 2 = 4?',
    questionType: 'TRUE_FALSE',
    points: 1,
    options: [
      { optionText: 'True', order: 1, isCorrect: true },
      { optionText: 'False', order: 2, isCorrect: false },
    ],
  }),
});

// 5. Publish CBT
await fetch(`/library/assessment/cbt/${cbtId}/publish`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
});

console.log('CBT created and published successfully!');
```

---

For any questions or issues, please contact the backend development team.

