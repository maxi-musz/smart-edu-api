# Library Assessments - Frontend API Reference

Base URL: **`/library-assessment`**  
Server global prefix: **`/api/v1`** (full path: **`/api/v1/library-assessment`**)  
Authentication: **Bearer JWT** required on all endpoints (`LibraryJwtGuard` — library owner session).

Audience: Library owners create and manage assessments for **library platform** content. Data is scoped by **`platformId`** from the JWT. There are **no** academic sessions or class filters. Field names are **camelCase** in JSON (`subjectId`, `questionText`, `imageUrl`, …).

---

## IMPORTANT: Response Structure (Success)

Successful operations use `ResponseHelper.success`. The JSON body looks like:

```json
{
  "success": true,
  "message": "string",
  "data": { "...": "..." },
  "length": null,
  "meta": null,
  "statusCode": 200
}
```

`statusCode` in the body is **200** for these handlers (including creates). Rely on the HTTP status code from the server as well.

---

## IMPORTANT: Response Structure (Error)

Thrown HTTP exceptions (e.g. `BadRequestException`, `NotFoundException`, `ForbiddenException`) typically look like:

```json
{
  "statusCode": 400,
  "message": "Human readable message (string or string[])",
  "error": "Bad Request"
}
```

Validation errors from `ValidationPipe` may return an array in `message`. Always handle non-2xx HTTP responses and read `message`.

---

## Table of Contents

1. [Create Assessment](#1-create-assessment)
2. [List Assessments](#2-list-assessments)
3. [Get Assessment Details](#3-get-assessment-details)
4. [Update Assessment](#4-update-assessment)
5. [Get Assessment Questions (preview with answers)](#5-get-assessment-questions-preview-with-answers)
6. [Submit Assessment](#6-submit-assessment)
7. [Duplicate Assessment](#7-duplicate-assessment)
8. [Add Questions (JSON)](#8-add-questions-json)
9. [Add Question (With Images)](#9-add-question-with-images)
10. [Update Question (JSON)](#10-update-question-json)
11. [Update Question (With Images)](#11-update-question-with-images)
12. [Delete Question](#12-delete-question)

---

## Access Rules (Applies to All Endpoints)

- You must be authenticated as a **library owner** (`LibraryJwtGuard` / library JWT).
- Assessments are limited to the authenticated user’s **platform** (`platformId`).
- **Question mutations** (add / update / delete questions, and add-with-image) are **not** allowed while the assessment status is **`PUBLISHED`** or **`ACTIVE`** (see service checks). Adding questions with images also blocks **`CLOSED`** and **`ARCHIVED`**.
- **Assessment metadata updates** (`PATCH /:id`) are rejected when status is **`PUBLISHED`** or **`ACTIVE`** until moved back to **`DRAFT`** (see service).
- Publishing via status update checks **end date** vs current time (cannot publish an already expired assessment).

---

## Enums Used in Payloads / Responses

### `status` (assessment — maps to `QuizStatus` in DB)

- `DRAFT`
- `PUBLISHED`
- `ACTIVE`
- `CLOSED`
- `ARCHIVED`

### `questionType`

- `MULTIPLE_CHOICE_SINGLE`
- `MULTIPLE_CHOICE_MULTIPLE`
- `SHORT_ANSWER`
- `LONG_ANSWER`
- `TRUE_FALSE`
- `FILL_IN_BLANK`
- `MATCHING`
- `ORDERING`
- `FILE_UPLOAD`
- `NUMERIC`
- `DATE`
- `RATING_SCALE`

### `assessmentType`

- `FORMATIVE`
- `SUMMATIVE`
- `DIAGNOSTIC`
- `BENCHMARK`
- `PRACTICE`
- `MOCK_EXAM`
- `QUIZ`
- `TEST`
- `EXAM`
- `ASSIGNMENT`
- `CBT`
- `OTHER`

*(Library module does not impose school-style CBT/EXAM limits; defaults can still use `CBT` in code.)*

### `gradingType`

- `AUTOMATIC`
- `MANUAL`
- `MIXED`

### `difficultyLevel`

- `EASY`
- `MEDIUM`
- `HARD`
- `EXPERT`

### Attempt `status` (on nested attempt objects where applicable)

- `NOT_STARTED`
- `IN_PROGRESS`
- `SUBMITTED`
- `GRADED`
- `EXPIRED`

---

## Request Object Shapes (DTOs, camelCase)

### `CreateLibraryAssessmentDto` — `POST /`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | string | Yes | |
| `subjectId` | string | Yes | Must belong to your platform |
| `description` | string | No | |
| `instructions` | string | No | |
| `topicId` | string | No | Must belong to `subjectId` |
| `duration` | number | No | Minutes, min 1 |
| `maxAttempts` | number | No | Default 1, min 1 |
| `passingScore` | number | No | 0–100, default 50 |
| `totalPoints` | number | No | Min 0 |
| `shuffleQuestions` | boolean | No | |
| `shuffleOptions` | boolean | No | |
| `showCorrectAnswers` | boolean | No | |
| `showFeedback` | boolean | No | Default true if omitted in logic |
| `allowReview` | boolean | No | Default true if omitted in logic |
| `startDate` | string (ISO date) | No | |
| `endDate` | string (ISO date) | No | Default ~2 days from creation if omitted |
| `timeLimit` | number | No | Seconds |
| `gradingType` | string | No | `GradingType` |
| `autoSubmit` | boolean | No | |
| `tags` | string[] | No | |
| `assessmentType` | string | No | Default `CBT` in service if unset |

### `UpdateLibraryAssessmentDto` — `PATCH /:id`

Extends **partial** `CreateLibraryAssessmentDto` (all create fields optional) plus:

| Field | Type | Notes |
| --- | --- | --- |
| `status` | string | `DRAFT` / `PUBLISHED` / … |
| `isResultReleased` | boolean | |
| `studentCanViewGrading` | boolean | |

### `GetLibraryAssessmentsQueryDto` — `GET /`

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `page` | number | `1` | Min 1 |
| `limit` | number | `20` | 1–100 |
| `search` | string | — | Title / description, case-insensitive |
| `subjectId` | string | — | |
| `topicId` | string | — | |
| `status` | string | — | `QuizStatus` |
| `assessmentType` | string | — | |
| `isPublished` | boolean | — | Query string `true` / `false` parsed |
| `sortBy` | string | `createdAt` | Prisma field on `LibraryAssessment` |
| `sortOrder` | `asc` \| `desc` | `desc` | |

### `SubmitLibraryAssessmentDto` — `POST /:id/submit`

```json
{
  "answers": [
    {
      "questionId": "string (required)",
      "questionType": "string (optional)",
      "selectedOptions": ["option-uuid"],
      "answer": "string (optional; coerced to selectedOptions)",
      "textAnswer": "string (optional)"
    }
  ],
  "submissionTime": "ISO 8601 string (optional)",
  "timeTaken": 0
}
```

`timeTaken` is seconds (number). The service normalizes `answer` into `selectedOptions` when needed.

### `DuplicateLibraryAssessmentDto` — `POST /:id/duplicate`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `newTitle` | string | Yes | 3–200 chars |
| `shuffleQuestions` | boolean | No | |
| `shuffleOptions` | boolean | No | |
| `newDescription` | string | No | Falls back to source description |

### `LibraryQuestionOptionDto` / options in add payload

```ts
{
  optionText: string
  order?: number
  isCorrect: boolean
  imageUrl?: string
  imageS3Key?: string
  imageIndex?: number  // index into uploaded optionImages for with-image route
  audioUrl?: string
}
```

### `LibraryCorrectAnswerDto`

```ts
{
  answerText?: string
  answerNumber?: number
  answerDate?: string
  answerJson?: any
}
```

### `LibraryQuestionDto` — items inside `AddLibraryQuestionsDto.questions`

```ts
{
  questionText: string
  questionType: string
  order?: number
  points?: number
  isRequired?: boolean
  timeLimit?: number
  imageUrl?: string
  imageS3Key?: string
  audioUrl?: string
  videoUrl?: string
  allowMultipleAttempts?: boolean
  showHint?: boolean
  hintText?: string
  minLength?: number
  maxLength?: number
  minValue?: number
  maxValue?: number
  explanation?: string
  difficultyLevel?: string
  options?: LibraryQuestionOptionDto[]
  correctAnswers?: LibraryCorrectAnswerDto[]
}
```

### `AddLibraryQuestionsDto` — `POST /:id/questions`

```json
{
  "questions": [ { "...LibraryQuestionDto...": true } ]
}
```

### `UpdateLibraryQuestionDto` — `PATCH .../questions/:questionId` (+ multipart merge)

All fields optional. If `options` is provided, it must be **non-empty**; supports updating by `id` or creating new options without `id`. If `options` is updated and there are correct MCQ options, correct-answer rows are rebuilt for option-backed correctness. If only `correctAnswers` is sent (without `options`), non-MCQ correct answers are replaced.

Nested option shape: `UpdateLibraryQuestionOptionDto` (`id`, `optionText`, `order`, `isCorrect`, `imageUrl`, `imageS3Key`, `audioUrl`).

Nested correct answer shape: `UpdateLibraryCorrectAnswerDto` (`id`, `answerText`, `answerNumber`, `answerDate`, `answerJson`).

---

## Common Identifiers

- `id` / `assessmentId`: assessment id  
- `questionId`: question id  
- `subjectId`, `topicId`: library subject / topic ids  

---

## 1. Create Assessment

Creates a **`DRAFT`** assessment for the platform.

**Endpoint:** `POST /library-assessment`

**Headers:**

```json
{
  "Authorization": "Bearer <library-jwt>",
  "Content-Type": "application/json"
}
```

**Body:** `CreateLibraryAssessmentDto`

```json
{
  "title": "Algebra practice quiz",
  "description": "Optional",
  "instructions": "Answer all questions.",
  "subjectId": "library-subject-uuid",
  "topicId": "library-topic-uuid",
  "duration": 45,
  "maxAttempts": 2,
  "passingScore": 50,
  "totalPoints": 100,
  "shuffleQuestions": false,
  "shuffleOptions": true,
  "showCorrectAnswers": false,
  "showFeedback": true,
  "allowReview": true,
  "startDate": "2026-03-20T08:00:00.000Z",
  "endDate": "2026-03-27T23:59:59.000Z",
  "timeLimit": 3600,
  "gradingType": "AUTOMATIC",
  "autoSubmit": false,
  "tags": ["algebra", "practice"],
  "assessmentType": "QUIZ"
}
```

**Success (example):**

```json
{
  "success": true,
  "message": "Library assessment created successfully",
  "data": {
    "id": "assessment-uuid",
    "platformId": "platform-uuid",
    "subjectId": "library-subject-uuid",
    "topicId": "library-topic-uuid",
    "createdById": "library-user-uuid",
    "title": "Algebra practice quiz",
    "description": "Optional",
    "instructions": "Answer all questions.",
    "assessmentType": "QUIZ",
    "gradingType": "AUTOMATIC",
    "status": "DRAFT",
    "duration": 45,
    "timeLimit": 3600,
    "startDate": "2026-03-20T08:00:00.000Z",
    "endDate": "2026-03-27T23:59:59.000Z",
    "maxAttempts": 2,
    "allowReview": true,
    "autoSubmit": false,
    "totalPoints": 100,
    "passingScore": 50,
    "showCorrectAnswers": false,
    "showFeedback": true,
    "studentCanViewGrading": true,
    "shuffleQuestions": false,
    "shuffleOptions": true,
    "isPublished": false,
    "publishedAt": null,
    "isResultReleased": false,
    "resultReleasedAt": null,
    "tags": ["algebra", "practice"],
    "order": 0,
    "createdAt": "2026-03-20T10:00:00.000Z",
    "updatedAt": "2026-03-20T10:00:00.000Z",
    "subject": { "id": "library-subject-uuid", "name": "Mathematics", "code": "MATH" },
    "topic": { "id": "library-topic-uuid", "title": "Algebra I" },
    "createdBy": { "id": "library-user-uuid", "first_name": "Jane", "last_name": "Owner" },
    "assessmentContext": "library"
  },
  "statusCode": 200
}
```

**Errors:**

- `404` — Library user not found; subject/topic not found or not on platform  
- `400` — Validation errors  

---

## 2. List Assessments

**Endpoint:** `GET /library-assessment`

**Headers:**

```json
{
  "Authorization": "Bearer <library-jwt>"
}
```

**Query:** `GetLibraryAssessmentsQueryDto` (see table above)

**Success (example):**

```json
{
  "success": true,
  "message": "Library assessments fetched successfully",
  "data": {
    "analytics": {
      "all": 12,
      "draft": 4,
      "published": 3,
      "active": 2,
      "closed": 2,
      "archived": 1
    },
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 12,
      "totalPages": 1
    },
    "assessments": [
      {
        "id": "assessment-uuid",
        "platformId": "platform-uuid",
        "subjectId": "library-subject-uuid",
        "topicId": "library-topic-uuid",
        "createdById": "library-user-uuid",
        "title": "Algebra practice quiz",
        "description": "Optional",
        "instructions": "Answer all questions.",
        "assessmentType": "QUIZ",
        "gradingType": "AUTOMATIC",
        "status": "DRAFT",
        "duration": 45,
        "timeLimit": 3600,
        "startDate": "2026-03-20T08:00:00.000Z",
        "endDate": "2026-03-27T23:59:59.000Z",
        "maxAttempts": 2,
        "allowReview": true,
        "autoSubmit": false,
        "totalPoints": 100,
        "passingScore": 50,
        "showCorrectAnswers": false,
        "showFeedback": true,
        "studentCanViewGrading": true,
        "shuffleQuestions": false,
        "shuffleOptions": true,
        "isPublished": false,
        "publishedAt": null,
        "isResultReleased": false,
        "resultReleasedAt": null,
        "tags": ["algebra", "practice"],
        "order": 0,
        "createdAt": "2026-03-20T10:00:00.000Z",
        "updatedAt": "2026-03-20T10:00:00.000Z",
        "subject": { "id": "library-subject-uuid", "name": "Mathematics", "code": "MATH" },
        "topic": { "id": "library-topic-uuid", "title": "Algebra I" },
        "createdBy": { "id": "library-user-uuid", "first_name": "Jane", "last_name": "Owner" },
        "_count": { "questions": 10, "attempts": 3 }
      }
    ],
    "assessmentContext": "library"
  },
  "statusCode": 200
}
```

**Errors:**

- `404` — Library user not found  

---

## 3. Get Assessment Details

Returns the assessment, full question list (with options and correct answers), and per-user attempt summary for the platform.

**Endpoint:** `GET /library-assessment/:id`

**Path:** `id` — assessment id  

**Success (example, abbreviated):**

```json
{
  "success": true,
  "message": "Library assessment details retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "platformId": "platform-uuid",
      "subjectId": "library-subject-uuid",
      "topicId": "library-topic-uuid",
      "title": "Algebra practice quiz",
      "status": "PUBLISHED",
      "assessmentType": "QUIZ",
      "gradingType": "AUTOMATIC",
      "totalPoints": 100,
      "passingScore": 50,
      "maxAttempts": 2,
      "isPublished": true,
      "publishedAt": "2026-03-21T12:00:00.000Z",
      "subject": { "id": "library-subject-uuid", "name": "Mathematics", "code": "MATH" },
      "topic": { "id": "library-topic-uuid", "title": "Algebra I" },
      "createdBy": {
        "id": "library-user-uuid",
        "first_name": "Jane",
        "last_name": "Owner",
        "email": "owner@example.com"
      },
      "platform": { "id": "platform-uuid", "name": "My Library Platform" },
      "_count": { "questions": 5, "attempts": 8 }
    },
    "questions": {
      "total": 5,
      "items": [
        {
          "id": "question-uuid",
          "assessmentId": "assessment-uuid",
          "questionText": "What is 2 + 2?",
          "questionType": "MULTIPLE_CHOICE_SINGLE",
          "order": 1,
          "points": 5,
          "isRequired": true,
          "timeLimit": null,
          "imageUrl": null,
          "imageS3Key": null,
          "audioUrl": null,
          "videoUrl": null,
          "allowMultipleAttempts": false,
          "showHint": false,
          "hintText": null,
          "minLength": null,
          "maxLength": null,
          "minValue": null,
          "maxValue": null,
          "explanation": null,
          "difficultyLevel": "EASY",
          "createdAt": "2026-03-20T10:00:00.000Z",
          "updatedAt": "2026-03-20T10:00:00.000Z",
          "options": [
            {
              "id": "option-uuid",
              "questionId": "question-uuid",
              "optionText": "4",
              "order": 1,
              "isCorrect": true,
              "imageUrl": null,
              "imageS3Key": null,
              "audioUrl": null,
              "createdAt": "2026-03-20T10:00:00.000Z",
              "updatedAt": "2026-03-20T10:00:00.000Z"
            }
          ],
          "correctAnswers": [
            {
              "id": "correct-uuid",
              "questionId": "question-uuid",
              "answerText": null,
              "answerNumber": null,
              "answerDate": null,
              "optionIds": ["option-uuid"],
              "answerJson": null,
              "createdAt": "2026-03-20T10:00:00.000Z",
              "updatedAt": "2026-03-20T10:00:00.000Z"
            }
          ],
          "_count": { "responses": 12 }
        }
      ]
    },
    "submissions": {
      "summary": {
        "totalUsers": 4,
        "totalAttempts": 8,
        "usersPassed": 3,
        "passRate": 75
      },
      "users": [
        {
          "user": {
            "id": "user-uuid",
            "first_name": "Student",
            "last_name": "One",
            "email": "student@example.com",
            "display_picture": null
          },
          "attempts": [
            {
              "id": "attempt-uuid",
              "attemptNumber": 1,
              "status": "GRADED",
              "startedAt": "2026-03-22T09:00:00.000Z",
              "submittedAt": "2026-03-22T09:45:00.000Z",
              "timeSpent": 2700,
              "totalScore": 80,
              "maxScore": 100,
              "percentage": 80,
              "passed": true,
              "isGraded": true,
              "gradedAt": "2026-03-22T09:45:00.000Z",
              "gradeLetter": "A"
            }
          ],
          "totalAttempts": 1,
          "bestScore": 80,
          "passed": true
        }
      ]
    },
    "assessmentContext": "library"
  },
  "statusCode": 200
}
```

**Errors:**

- `404` — Library user not found; assessment not found for platform  

---

## 4. Update Assessment

**Endpoint:** `PATCH /library-assessment/:id`

**Body:** `UpdateLibraryAssessmentDto` (partial)

```json
{
  "title": "Updated title",
  "status": "PUBLISHED",
  "endDate": "2026-04-01T23:59:59.000Z",
  "isResultReleased": false,
  "studentCanViewGrading": true
}
```

**Success (example):**

```json
{
  "success": true,
  "message": "Assessment updated successfully",
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "Updated title",
      "status": "PUBLISHED",
      "isPublished": true,
      "publishedAt": "2026-03-22T14:00:00.000Z",
      "subject": { "id": "library-subject-uuid", "name": "Mathematics", "code": "MATH" },
      "topic": { "id": "library-topic-uuid", "title": "Algebra I" },
      "createdBy": { "id": "library-user-uuid", "first_name": "Jane", "last_name": "Owner" },
      "_count": { "questions": 10, "attempts": 3 }
    },
    "assessmentContext": "library"
  },
  "statusCode": 200
}
```

**Errors:**

- `400` — Cannot update while `PUBLISHED`/`ACTIVE` without moving to `DRAFT`; cannot publish expired assessment; validation  
- `404` — Assessment / subject / topic not found  

---

## 5. Get Assessment Questions (preview with answers)

Condensed assessment header plus **normalized** questions: options use `{ id, text, isCorrect, order }`; correct answers include `optionIds`.

**Endpoint:** `GET /library-assessment/:id/questions`

**Success (example):**

```json
{
  "success": true,
  "message": "Assessment questions retrieved successfully (preview mode)",
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "Algebra practice quiz",
      "description": "Optional",
      "instructions": "Answer all questions.",
      "duration": 45,
      "timeLimit": 3600,
      "totalPoints": 100,
      "maxAttempts": 2,
      "passingScore": 50,
      "status": "PUBLISHED",
      "isPublished": true,
      "startDate": "2026-03-20T08:00:00.000Z",
      "endDate": "2026-03-27T23:59:59.000Z",
      "subject": { "id": "library-subject-uuid", "name": "Mathematics", "code": "MATH" },
      "createdBy": { "id": "library-user-uuid", "name": "Jane Owner" },
      "totalAttempts": 8
    },
    "questions": [
      {
        "id": "question-uuid",
        "questionText": "What is 2 + 2?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "points": 5,
        "order": 1,
        "imageUrl": null,
        "audioUrl": null,
        "videoUrl": null,
        "isRequired": true,
        "explanation": null,
        "difficultyLevel": "EASY",
        "options": [
          { "id": "option-uuid", "text": "4", "isCorrect": true, "order": 1 }
        ],
        "correctAnswers": [
          { "id": "correct-uuid", "answerText": null, "optionIds": ["option-uuid"] }
        ]
      }
    ],
    "totalQuestions": 1,
    "isPreview": true,
    "assessmentContext": "library"
  },
  "statusCode": 200
}
```

**Errors:**

- `404` — Assessment not found / not available  

---

## 6. Submit Assessment

Submits answers for the current library user; assessment must be **`PUBLISHED`** or **`ACTIVE`**. Enforces `maxAttempts`.

**Endpoint:** `POST /library-assessment/:id/submit`

**Body:** `SubmitLibraryAssessmentDto`

```json
{
  "answers": [
    {
      "questionId": "question-uuid",
      "questionType": "MULTIPLE_CHOICE_SINGLE",
      "selectedOptions": ["option-uuid"]
    },
    {
      "questionId": "question-uuid-2",
      "questionType": "SHORT_ANSWER",
      "textAnswer": "Paris"
    }
  ],
  "submissionTime": "2026-03-22T10:30:00.000Z",
  "timeTaken": 1200
}
```

**Success (example):**

```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "data": {
    "attemptId": "attempt-uuid",
    "assessmentId": "assessment-uuid",
    "totalScore": 85,
    "totalPoints": 100,
    "percentage": 85,
    "passed": true,
    "grade": "A",
    "answers": [
      {
        "questionId": "question-uuid",
        "isCorrect": true,
        "pointsEarned": 5,
        "maxPoints": 5
      }
    ],
    "submittedAt": "2026-03-22T10:30:00.000Z",
    "timeSpent": 1200,
    "attemptNumber": 1,
    "remainingAttempts": 1,
    "assessmentContext": "library"
  },
  "statusCode": 200
}
```

**Errors:**

- `404` — Assessment not found or not `PUBLISHED`/`ACTIVE`  
- `403` — Max attempts reached  

---

## 7. Duplicate Assessment

Creates a new **`DRAFT`** copy; optional shuffle flags.

**Endpoint:** `POST /library-assessment/:id/duplicate`

**Body:** `DuplicateLibraryAssessmentDto`

```json
{
  "newTitle": "Algebra practice quiz (copy)",
  "shuffleQuestions": false,
  "shuffleOptions": true,
  "newDescription": "Optional override"
}
```

**Success (example):**

```json
{
  "success": true,
  "message": "Assessment duplicated successfully",
  "data": {
    "assessment": {
      "id": "new-assessment-uuid",
      "platformId": "platform-uuid",
      "subjectId": "library-subject-uuid",
      "topicId": "library-topic-uuid",
      "title": "Algebra practice quiz (copy)",
      "description": "Optional override",
      "status": "DRAFT",
      "isPublished": false,
      "subject": { "id": "library-subject-uuid", "name": "Mathematics", "code": "MATH" },
      "topic": { "id": "library-topic-uuid", "title": "Algebra I" },
      "createdBy": { "id": "library-user-uuid", "first_name": "Jane", "last_name": "Owner", "email": "owner@example.com" },
      "_count": { "questions": 10 }
    },
    "sourceAssessmentId": "assessment-uuid",
    "shuffleApplied": { "questions": false, "options": true }
  },
  "statusCode": 200
}
```

**Errors:**

- `404` — Assessment not found  

---

## 8. Add Questions (JSON)

**Endpoint:** `POST /library-assessment/:id/questions`

**Body:** `AddLibraryQuestionsDto`

```json
{
  "questions": [
    {
      "questionText": "What is the capital of France?",
      "questionType": "MULTIPLE_CHOICE_SINGLE",
      "order": 1,
      "points": 2,
      "isRequired": true,
      "difficultyLevel": "MEDIUM",
      "options": [
        { "optionText": "Paris", "order": 1, "isCorrect": true },
        { "optionText": "London", "order": 2, "isCorrect": false }
      ]
    }
  ]
}
```

**Success (example):**

```json
{
  "success": true,
  "message": "Questions added successfully",
  "data": {
    "assessmentId": "assessment-uuid",
    "questionsAdded": 1,
    "totalQuestions": 11,
    "questions": [
      {
        "id": "new-question-uuid",
        "assessmentId": "assessment-uuid",
        "questionText": "What is the capital of France?",
        "questionType": "MULTIPLE_CHOICE_SINGLE",
        "order": 1,
        "points": 2,
        "isRequired": true,
        "imageUrl": null,
        "imageS3Key": null,
        "options": [
          {
            "id": "option-uuid-a",
            "questionId": "new-question-uuid",
            "optionText": "Paris",
            "order": 1,
            "isCorrect": true,
            "imageUrl": null,
            "imageS3Key": null,
            "audioUrl": null,
            "createdAt": "2026-03-20T10:00:00.000Z",
            "updatedAt": "2026-03-20T10:00:00.000Z"
          }
        ],
        "correctAnswers": [
          {
            "id": "correct-uuid",
            "questionId": "new-question-uuid",
            "answerText": null,
            "answerNumber": null,
            "answerDate": null,
            "optionIds": ["option-uuid-a"],
            "answerJson": null,
            "createdAt": "2026-03-20T10:00:00.000Z",
            "updatedAt": "2026-03-20T10:00:00.000Z"
          }
        ],
        "createdAt": "2026-03-20T10:00:00.000Z",
        "updatedAt": "2026-03-20T10:00:00.000Z"
      }
    ]
  },
  "statusCode": 200
}
```

**Errors:**

- `400` — Assessment `PUBLISHED` / `ACTIVE` (or invalid payload)  
- `404` — Assessment not found  

---

## 9. Add Question (With Images)

**Endpoint:** `POST /library-assessment/:id/questions/with-image`  
**Content-Type:** `multipart/form-data`

**Files**

- `questionImage` (max 1) — question image  
- `optionImages` (max 10) — option images  

**Form fields**

- `questionData` (string, **required**) — stringified JSON of a single `LibraryQuestionDto`  

**Mapping:** each `optionImages[i]` is applied to the option where `options[].imageIndex === i`. Allowed image MIME types: JPEG, PNG, GIF, WEBP; max **5MB** per file.

**Success:** Same shape as [Add Questions (JSON)](#8-add-questions-json) (`questions` array length 1).

**Errors:**

- `400` — Invalid JSON in `questionData`; image type/size; cannot add in `PUBLISHED` / `ACTIVE` / `CLOSED` / `ARCHIVED`  
- `404` — Assessment not found / no access  

---

## 10. Update Question (JSON)

**Endpoint:** `PATCH /library-assessment/:id/questions/:questionId`

**Body:** `UpdateLibraryQuestionDto`

```json
{
  "questionText": "Updated wording",
  "points": 3,
  "options": [
    { "id": "existing-option-uuid", "optionText": "Paris", "isCorrect": true, "order": 1 }
  ]
}
```

**Success (example):**

```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "assessmentId": "assessment-uuid",
    "question": {
      "id": "question-uuid",
      "assessmentId": "assessment-uuid",
      "questionText": "Updated wording",
      "questionType": "MULTIPLE_CHOICE_SINGLE",
      "order": 1,
      "points": 3,
      "isRequired": true,
      "options": [
        {
          "id": "option-uuid",
          "questionId": "question-uuid",
          "optionText": "Paris",
          "order": 1,
          "isCorrect": true,
          "imageUrl": null,
          "imageS3Key": null,
          "audioUrl": null,
          "createdAt": "2026-03-20T10:00:00.000Z",
          "updatedAt": "2026-03-20T10:00:00.000Z"
        }
      ],
      "correctAnswers": [
        {
          "id": "correct-uuid",
          "questionId": "question-uuid",
          "answerText": null,
          "answerNumber": null,
          "answerDate": null,
          "optionIds": ["option-uuid"],
          "answerJson": null,
          "createdAt": "2026-03-20T10:00:00.000Z",
          "updatedAt": "2026-03-20T10:00:00.000Z"
        }
      ],
      "createdAt": "2026-03-20T10:00:00.000Z",
      "updatedAt": "2026-03-22T11:00:00.000Z"
    }
  },
  "statusCode": 200
}
```

**Errors:**

- `400` — Status `PUBLISHED` / `ACTIVE`; empty `options` when provided; validation  
- `404` — Not found  

---

## 11. Update Question (With Images)

**Endpoint:** `PATCH /library-assessment/:id/questions/:questionId/with-image`  
**Content-Type:** `multipart/form-data`

**Files**

- `questionImage` (max 1) — new question image (uploaded first; service sets `imageUrl` / `imageS3Key` on the update DTO)  
- `optionImages` (max 10) — new option images  

**Non-file fields**

The handler binds multipart text fields to `UpdateLibraryQuestionDto`. Nested arrays (`options`, `correctAnswers`) may need to be sent as **stringified JSON** in each field name your client uses, depending on how the browser/Nest parses multipart (verify with your integration).

The controller also reads **`optionImageUpdates`** from the body object (array of `{ optionId, oldS3Key? }`), aligned by index with **`optionImages`**. Counts of `optionImageUpdates` and `optionImages` must match when both are used.

> **Note:** Global `ValidationPipe` uses `whitelist: true`. Only properties declared on `UpdateLibraryQuestionDto` are kept; if `optionImageUpdates` is stripped before the controller runs, option image replacement may not apply until the DTO exposes that field (or parsing is adjusted).

**Success:** Same as [Update Question (JSON)](#10-update-question-json).

**Errors:**

- `400` — Image validation; mismatch between `optionImageUpdates` and `optionImages`; status restrictions  
- `404` — Not found  

---

## 12. Delete Question

**Endpoint:** `DELETE /library-assessment/:id/questions/:questionId`

**Success (example):**

```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": {
    "assessmentId": "assessment-uuid",
    "deletedQuestionId": "question-uuid",
    "message": "Question and all associated media have been removed"
  },
  "statusCode": 200
}
```

**Errors:**

- `400` — Status `PUBLISHED` / `ACTIVE`  
- `404` — Assessment or question not found  

---

## Standard HTTP status summary

| Code | Typical cases |
| --- | --- |
| `200` | Success |
| `400` | Validation, bad input, business rule (e.g. locked assessment) |
| `401` | Missing/invalid JWT |
| `403` | Forbidden (e.g. max attempts) |
| `404` | Resource not found / wrong platform |
| `500` | Server error |

---

## Grading notes (submit)

Server grading supports MCQ-style (`selectedOptions` vs `correctAnswers[0].optionIds`), `FILL_IN_BLANK` / `SHORT_ANSWER` text match, `NUMERIC`, and `DATE`. Types like `ESSAY` are not auto-marked as correct in the private helper. Use `questionType` on answers where relevant for numeric/date parsing from `textAnswer`.
