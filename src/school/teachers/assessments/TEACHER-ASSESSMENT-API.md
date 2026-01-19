# Teacher Assessment API Documentation

**Base URL:** `/teachers/assessments`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**Audience:** These endpoints are for **teachers** to create, manage, and grade assessments (CBT quizzes, exams, tests, assignments).

---

## Table of Contents
1. [Create Assessment](#1-create-assessment)
2. [Get All Assessments](#2-get-all-assessments)
3. [Get Assessment by ID](#3-get-assessment-by-ID)
4. [Update Assessment](#4-update-assessment)
5. [Delete Assessment](#5-delete-assessment)
6. [Publish Assessment](#6-publish-assessment)
7. [Unpublish Assessment](#7-unpublish-assessment)
8. [Release Results](#8-release-results)
9. [Get Topic Assessments](#9-get-topic-assessments)
10. [Get Assessment Questions](#10-get-assessment-questions)
11. [Upload Question Image](#11-upload-question-image)
12. [Create Question](#12-create-question)
13. [Update Question](#13-update-question)
14. [Delete Question Image](#14-delete-question-image)
15. [Delete Question](#15-delete-question)
16. [Get Assessment Attempts](#16-get-assessment-attempts)
17. [Get Student Submission](#17-get-student-submission)

---

## IMPORTANT: Response Structure

**ALL ENDPOINTS** follow this exact response format:

```typescript
{
  success: boolean;      // true for success, false for error
  message: string;       // Human-readable message
  data: object | null;   // Response data (object on success, null on error)
  statusCode?: number;   // HTTP status code
}
```

**⚠️ Frontend developers:** Always check the `success` field first before accessing `data`. The `data` field will be `null` when `success` is `false`.

---

## 1. Create Assessment

Create a new assessment (CBT quiz, exam, test, assignment).

**Endpoint:** `POST /teachers/assessments`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| title | string | Yes | - | Assessment title |
| description | string | No | - | Assessment description |
| instructions | string | No | - | Instructions for students |
| subject_id | string | Yes | - | Subject ID |
| topic_id | string | No | - | Topic ID (optional) |
| duration | number | No | - | Duration in minutes (1-300) |
| max_attempts | number | No | 1 | Max attempts allowed (1-10) |
| passing_score | number | No | 50 | Passing score percentage (0-100) |
| total_points | number | No | 100 | Total possible points |
| shuffle_questions | boolean | No | false | Shuffle question order |
| shuffle_options | boolean | No | false | Shuffle option order |
| show_correct_answers | boolean | No | false | Show correct answers after submission |
| show_feedback | boolean | No | true | Show feedback after submission |
| allow_review | boolean | No | true | Allow answer review |
| start_date | string | No | - | Start date/time (ISO 8601) |
| end_date | string | No | - | End date/time (ISO 8601) |
| time_limit | number | No | - | Time limit in minutes (1-300) |
| grading_type | string | No | AUTOMATIC | Grading type |
| auto_submit | boolean | No | false | Auto-submit when time expires |
| tags | string[] | No | - | Tags for categorization |
| assessment_type | string | No | CBT | Assessment type |

**Grading Type Values:**
- `AUTOMATIC` - Auto-graded (default)
- `MANUAL` - Manual grading
- `MIXED` - Combination of auto and manual

**Assessment Type Values:**
- `CBT` (default)
- `ASSIGNMENT`
- `EXAM`
- `QUIZ`
- `TEST`
- `FORMATIVE`
- `SUMMATIVE`
- `DIAGNOSTIC`
- `BENCHMARK`
- `PRACTICE`
- `MOCK_EXAM`
- `OTHER`

**Example Request:**
```json
{
  "title": "Mathematics Chapter 1 Quiz",
  "description": "Test your understanding of basic algebra",
  "instructions": "Answer all questions carefully. You have 30 minutes.",
  "subject_id": "subject-uuid-1",
  "topic_id": "topic-uuid-1",
  "duration": 30,
  "max_attempts": 2,
  "passing_score": 60,
  "total_points": 100,
  "shuffle_questions": true,
  "shuffle_options": false,
  "show_correct_answers": true,
  "show_feedback": true,
  "allow_review": true,
  "start_date": "2024-01-20T09:00:00Z",
  "end_date": "2024-01-25T23:59:59Z",
  "time_limit": 30,
  "grading_type": "AUTOMATIC",
  "auto_submit": true,
  "tags": ["algebra", "chapter1"],
  "assessment_type": "CBT"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Assessment created successfully",
  "data": {
    "id": "assessment-uuid-1",
    "title": "Mathematics Chapter 1 Quiz",
    "description": "Test your understanding of basic algebra",
    "instructions": "Answer all questions carefully. You have 30 minutes.",
    "subject_id": "subject-uuid-1",
    "topic_id": "topic-uuid-1",
    "duration": 30,
    "max_attempts": 2,
    "passing_score": 60,
    "total_points": 100,
    "shuffle_questions": true,
    "shuffle_options": false,
    "show_correct_answers": true,
    "show_feedback": true,
    "allow_review": true,
    "start_date": "2024-01-20T09:00:00.000Z",
    "end_date": "2024-01-25T23:59:59.000Z",
    "time_limit": 30,
    "grading_type": "AUTOMATIC",
    "auto_submit": true,
    "tags": ["algebra", "chapter1"],
    "assessment_type": "CBT",
    "status": "DRAFT",
    "created_by": "user-uuid-1",
    "school_id": "school-uuid-1",
    "academic_session_id": "session-uuid-1",
    "is_result_released": false,
    "created_at": "2024-01-16T10:30:00.000Z",
    "updated_at": "2024-01-16T10:30:00.000Z"
  },
  "statusCode": 201
}
```

**Error Responses:**

**400 Bad Request - Invalid Data:**
```json
{
  "success": false,
  "message": "Invalid data provided",
  "data": null
}
```

**403 Forbidden - No Access to Subject:**
```json
{
  "success": false,
  "message": "You do not have access to this subject",
  "data": null
}
```

**404 Not Found - Topic Not Found:**
```json
{
  "success": false,
  "message": "Topic not found",
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

---

## 2. Get All Assessments

Get all assessments created by the teacher with filtering and pagination.

**Endpoint:** `GET /teachers/assessments`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| subject_id | string | **Yes** | - | Subject ID (required) |
| status | string | No | - | Filter by status |
| topic_id | string | No | - | Filter by topic |
| assessment_type | string | No | - | Filter by assessment type |
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |

**Status Values:**
- `DRAFT`
- `PUBLISHED`
- `ACTIVE`
- `CLOSED`
- `ARCHIVED`

**Assessment Type Values:**
Same as create endpoint (CBT, ASSIGNMENT, EXAM, etc.)

**Example Request:**
```
GET /teachers/assessments?subject_id=subject-uuid-1&status=PUBLISHED&page=1&limit=10
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": {
    "assessments": [
      {
        "id": "assessment-uuid-1",
        "title": "Mathematics Chapter 1 Quiz",
        "description": "Test your understanding of basic algebra",
        "subject_id": "subject-uuid-1",
        "topic_id": "topic-uuid-1",
        "duration": 30,
        "max_attempts": 2,
        "passing_score": 60,
        "total_points": 100,
        "status": "PUBLISHED",
        "assessment_type": "CBT",
        "start_date": "2024-01-20T09:00:00.000Z",
        "end_date": "2024-01-25T23:59:59.000Z",
        "is_result_released": false,
        "created_at": "2024-01-16T10:30:00.000Z",
        "updated_at": "2024-01-16T10:30:00.000Z",
        "_count": {
          "questions": 10,
          "attempts": 25
        },
        "subject": {
          "id": "subject-uuid-1",
          "name": "Mathematics",
          "code": "MATH101"
        },
        "topic": {
          "id": "topic-uuid-1",
          "title": "Algebra Basics"
        }
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2,
      "hasNext": true,
      "hasPrevious": false
    }
  },
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request - Missing subject_id:**
```json
{
  "success": false,
  "message": "subject_id is required",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Invalid access",
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

---

## 3. Get Assessment by ID

Get a specific assessment with full details.

**Endpoint:** `GET /teachers/assessments/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Example Request:**
```
GET /teachers/assessments/assessment-uuid-1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment retrieved successfully",
  "data": {
    "id": "assessment-uuid-1",
    "title": "Mathematics Chapter 1 Quiz",
    "description": "Test your understanding of basic algebra",
    "instructions": "Answer all questions carefully.",
    "subject_id": "subject-uuid-1",
    "topic_id": "topic-uuid-1",
    "duration": 30,
    "max_attempts": 2,
    "passing_score": 60,
    "total_points": 100,
    "shuffle_questions": true,
    "shuffle_options": false,
    "show_correct_answers": true,
    "show_feedback": true,
    "allow_review": true,
    "start_date": "2024-01-20T09:00:00.000Z",
    "end_date": "2024-01-25T23:59:59.000Z",
    "time_limit": 30,
    "grading_type": "AUTOMATIC",
    "auto_submit": true,
    "tags": ["algebra", "chapter1"],
    "assessment_type": "CBT",
    "status": "PUBLISHED",
    "created_by": "user-uuid-1",
    "school_id": "school-uuid-1",
    "academic_session_id": "session-uuid-1",
    "is_result_released": false,
    "created_at": "2024-01-16T10:30:00.000Z",
    "updated_at": "2024-01-16T10:30:00.000Z",
    "subject": {
      "id": "subject-uuid-1",
      "name": "Mathematics",
      "code": "MATH101"
    },
    "topic": {
      "id": "topic-uuid-1",
      "title": "Algebra Basics"
    },
    "_count": {
      "questions": 10,
      "attempts": 25
    }
  },
  "statusCode": 200
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
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

---

## 4. Update Assessment

Update an existing assessment.

**Endpoint:** `PATCH /teachers/assessments/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Request Body:**

All fields are optional. Only provide fields you want to update. Same fields as create endpoint, plus:

| Field | Type | Description |
|-------|------|-------------|
| status | string | Assessment status (DRAFT, PUBLISHED, ACTIVE, CLOSED, ARCHIVED) |

**Example Request:**
```json
{
  "title": "Mathematics Chapter 1 Quiz - Updated",
  "duration": 45,
  "passing_score": 65,
  "status": "PUBLISHED"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment updated successfully",
  "data": {
    "id": "assessment-uuid-1",
    "title": "Mathematics Chapter 1 Quiz - Updated",
    "duration": 45,
    "passing_score": 65,
    "status": "PUBLISHED",
    "updated_at": "2024-01-16T11:00:00.000Z"
    // ... other fields
  },
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid data",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## 5. Delete Assessment

Delete an assessment.

**Endpoint:** `DELETE /teachers/assessments/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Example Request:**
```
DELETE /teachers/assessments/assessment-uuid-1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment deleted successfully",
  "data": null,
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request - Has Attempts:**
```json
{
  "success": false,
  "message": "Cannot delete assessment with student attempts",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

---

## 6. Publish Assessment

Publish an assessment to make it available to students.

**Endpoint:** `POST /teachers/assessments/:id/publish`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Example Request:**
```
POST /teachers/assessments/assessment-uuid-1/publish
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment published successfully",
  "data": {
    "id": "assessment-uuid-1",
    "title": "Mathematics Chapter 1 Quiz",
    "status": "PUBLISHED",
    "updated_at": "2024-01-16T11:00:00.000Z"
    // ... other fields
  },
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request - No Questions:**
```json
{
  "success": false,
  "message": "Cannot publish assessment without questions",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

---

## 7. Unpublish Assessment

Unpublish an assessment to make it unavailable to students.

**Endpoint:** `POST /teachers/assessments/:id/unpublish`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Example Request:**
```
POST /teachers/assessments/assessment-uuid-1/unpublish
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment unpublished successfully",
  "data": {
    "id": "assessment-uuid-1",
    "title": "Mathematics Chapter 1 Quiz",
    "status": "DRAFT",
    "updated_at": "2024-01-16T11:00:00.000Z"
    // ... other fields
  },
  "statusCode": 200
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

---

## 8. Release Results

Release assessment results and close the assessment.

**Endpoint:** `POST /teachers/assessments/:id/release-results`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Example Request:**
```
POST /teachers/assessments/assessment-uuid-1/release-results
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment results released successfully",
  "data": {
    "id": "assessment-uuid-1",
    "title": "Mathematics Chapter 1 Quiz",
    "status": "CLOSED",
    "is_result_released": true,
    "updated_at": "2024-01-16T11:00:00.000Z"
    // ... other fields
  },
  "statusCode": 200
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## 9. Get Topic Assessments

Get all assessments for a specific topic.

**Endpoint:** `GET /teachers/assessments/topic/:topicId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| topicId | string | Yes | Topic ID |

**Example Request:**
```
GET /teachers/assessments/topic/topic-uuid-1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Topic assessments retrieved successfully",
  "data": [
    {
      "id": "assessment-uuid-1",
      "title": "Mathematics Chapter 1 Quiz",
      "description": "Test your understanding of basic algebra",
      "status": "PUBLISHED",
      "assessment_type": "CBT",
      "total_points": 100,
      "passing_score": 60,
      "duration": 30,
      "start_date": "2024-01-20T09:00:00.000Z",
      "end_date": "2024-01-25T23:59:59.000Z",
      "is_result_released": false,
      "created_at": "2024-01-16T10:30:00.000Z",
      "topic": {
        "id": "topic-uuid-1",
        "title": "Algebra Basics",
        "subject": {
          "id": "subject-uuid-1",
          "name": "Mathematics"
        }
      },
      "_count": {
        "questions": 10,
        "attempts": 25
      }
    }
  ],
  "statusCode": 200
}
```

**Error Responses:**

**403 Forbidden - No Access to Topic:**
```json
{
  "success": false,
  "message": "You do not have access to this topic",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Topic not found",
  "data": null
}
```

---

## 10. Get Assessment Questions

Get all questions for a specific assessment.

**Endpoint:** `GET /teachers/assessments/:id/questions`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Example Request:**
```
GET /teachers/assessments/assessment-uuid-1/questions
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment-uuid-1",
      "title": "Mathematics Chapter 1 Quiz",
      "subject": {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "topic": {
        "id": "topic-uuid-1",
        "title": "Algebra Basics"
      }
    },
    "questions": [
      {
        "id": "question-uuid-1",
        "question_text": "What is the solution to 2x + 5 = 13?",
        "question_type": "MULTIPLE_CHOICE_SINGLE",
        "order": 1,
        "points": 2,
        "is_required": true,
        "time_limit": 60,
        "image_url": null,
        "image_s3_key": null,
        "audio_url": null,
        "video_url": null,
        "allow_multiple_attempts": false,
        "show_hint": false,
        "hint_text": null,
        "min_length": null,
        "max_length": null,
        "min_value": null,
        "max_value": null,
        "explanation": "Subtract 5 from both sides, then divide by 2",
        "difficulty_level": "EASY",
        "created_at": "2024-01-16T10:35:00.000Z",
        "options": [
          {
            "id": "option-uuid-1",
            "option_text": "x = 4",
            "order": 1,
            "is_correct": true,
            "image_url": null,
            "audio_url": null
          },
          {
            "id": "option-uuid-2",
            "option_text": "x = 8",
            "order": 2,
            "is_correct": false,
            "image_url": null,
            "audio_url": null
          },
          {
            "id": "option-uuid-3",
            "option_text": "x = 6",
            "order": 3,
            "is_correct": false,
            "image_url": null,
            "audio_url": null
          }
        ],
        "correct_answers": [
          {
            "id": "answer-uuid-1",
            "answer_text": null,
            "answer_number": null,
            "answer_date": null,
            "option_ids": ["option-uuid-1"],
            "answer_json": null
          }
        ]
      }
    ],
    "total_questions": 10,
    "total_points": 20
  },
  "statusCode": 200
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or you do not have access to it",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## 11. Upload Question Image

Upload an image for a question before creating the question.

**Endpoint:** `POST /teachers/assessments/:id/questions/upload-image`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| image | file | Yes | Image file (JPEG, PNG, GIF, WEBP, max 5MB) |

**Example Request:**
```bash
POST /teachers/assessments/assessment-uuid-1/questions/upload-image
Content-Type: multipart/form-data

image: [binary file data]
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "image_url": "https://s3.amazonaws.com/bucket/assessment-images/schools/school123/assessments/assess123/question_1705408200_image.jpg",
    "image_s3_key": "assessment-images/schools/school123/assessments/assess123/question_1705408200_image.jpg"
  },
  "statusCode": 201
}
```

**Important Notes:**

1. **Use Before Creating Question:** Upload the image first, then use the returned `image_url` and `image_s3_key` when creating the question
2. **Supported Formats:** JPEG, PNG, GIF, WEBP
3. **Max Size:** 5MB
4. **Storage:** Images are stored in AWS S3

**Error Responses:**

**400 Bad Request - Invalid File:**
```json
{
  "success": false,
  "message": "Invalid image file",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## 12. Create Question

Add a new question to an assessment.

**Endpoint:** `POST /teachers/assessments/:id/questions`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| question_text | string | Yes | - | Question text |
| question_type | string | Yes | - | Type of question |
| order | number | No | Auto | Question order |
| points | number | No | 1.0 | Points for this question |
| is_required | boolean | No | true | Whether question is required |
| time_limit | number | No | - | Time limit in seconds |
| image_url | string | No | - | Image URL (from upload endpoint) |
| image_s3_key | string | No | - | S3 key (from upload endpoint) |
| audio_url | string | No | - | Audio URL |
| video_url | string | No | - | Video URL |
| allow_multiple_attempts | boolean | No | false | Allow multiple attempts |
| show_hint | boolean | No | false | Show hint |
| hint_text | string | No | - | Hint text |
| min_length | number | No | - | Min length for text answers |
| max_length | number | No | - | Max length for text answers |
| min_value | number | No | - | Min value for numeric answers |
| max_value | number | No | - | Max value for numeric answers |
| explanation | string | No | - | Explanation for correct answer |
| difficulty_level | string | No | MEDIUM | Difficulty level |
| options | array | No | - | Options (for multiple choice) |
| correct_answers | array | No | - | Correct answers |

**Question Type Values:**
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

**Difficulty Level Values:**
- `EASY`
- `MEDIUM`
- `HARD`
- `EXPERT`

**Option Structure:**
```typescript
{
  option_text: string;
  order: number;
  is_correct: boolean;
  image_url?: string;
  audio_url?: string;
}
```

**Correct Answer Structure:**
```typescript
{
  answer_text?: string;          // For text-based questions
  answer_number?: number;        // For numeric questions
  answer_date?: string;          // For date questions
  option_ids?: string[];         // For multiple choice
  answer_json?: any;             // For complex answers (matching, ordering)
}
```

**Example Request (Multiple Choice):**
```json
{
  "question_text": "What is the solution to 2x + 5 = 13?",
  "question_type": "MULTIPLE_CHOICE_SINGLE",
  "order": 1,
  "points": 2,
  "is_required": true,
  "time_limit": 60,
  "explanation": "Subtract 5 from both sides, then divide by 2",
  "difficulty_level": "EASY",
  "options": [
    {
      "option_text": "x = 4",
      "order": 1,
      "is_correct": true
    },
    {
      "option_text": "x = 8",
      "order": 2,
      "is_correct": false
    },
    {
      "option_text": "x = 6",
      "order": 3,
      "is_correct": false
    }
  ]
}
```

**Example Request (Short Answer):**
```json
{
  "question_text": "Define photosynthesis in your own words.",
  "question_type": "SHORT_ANSWER",
  "points": 5,
  "min_length": 50,
  "max_length": 200,
  "explanation": "Photosynthesis is the process by which plants convert sunlight into energy.",
  "difficulty_level": "MEDIUM"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "id": "question-uuid-1",
    "assessment_id": "assessment-uuid-1",
    "question_text": "What is the solution to 2x + 5 = 13?",
    "question_type": "MULTIPLE_CHOICE_SINGLE",
    "order": 1,
    "points": 2,
    "is_required": true,
    "time_limit": 60,
    "explanation": "Subtract 5 from both sides, then divide by 2",
    "difficulty_level": "EASY",
    "created_at": "2024-01-16T10:35:00.000Z",
    "options": [
      {
        "id": "option-uuid-1",
        "option_text": "x = 4",
        "order": 1,
        "is_correct": true
      },
      {
        "id": "option-uuid-2",
        "option_text": "x = 8",
        "order": 2,
        "is_correct": false
      },
      {
        "id": "option-uuid-3",
        "option_text": "x = 6",
        "order": 3,
        "is_correct": false
      }
    ]
  },
  "statusCode": 201
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid question data",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## 13. Update Question

Update a specific question in an assessment.

**Endpoint:** `PATCH /teachers/assessments/:assessmentId/questions/:questionId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| assessmentId | string | Yes | Assessment ID |
| questionId | string | Yes | Question ID |

**Request Body:**

All fields are optional. Only provide fields you want to update. Same fields as create question, plus optional image file.

**Form Data:**

| Field | Type | Description |
|-------|------|-------------|
| question_text | string | Updated question text |
| question_type | string | Updated question type |
| points | number | Updated points |
| image | file | New image file (optional) |
| ... | ... | Any other question fields |

**Example Request:**
```json
{
  "question_text": "What is the solution to 3x + 5 = 14?",
  "points": 3,
  "explanation": "Subtract 5 from both sides, then divide by 3"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "id": "question-uuid-1",
    "question_text": "What is the solution to 3x + 5 = 14?",
    "points": 3,
    "explanation": "Subtract 5 from both sides, then divide by 3",
    "updated_at": "2024-01-16T11:00:00.000Z"
    // ... other fields
  },
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid question data",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment or question not found or access denied",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## 14. Delete Question Image

Delete the image for a specific question.

**Endpoint:** `DELETE /teachers/assessments/:assessmentId/questions/:questionId/image`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| assessmentId | string | Yes | Assessment ID |
| questionId | string | Yes | Question ID |

**Example Request:**
```
DELETE /teachers/assessments/assessment-uuid-1/questions/question-uuid-1/image
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Question image deleted successfully",
  "data": null,
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request - No Image:**
```json
{
  "success": false,
  "message": "Question does not have an image",
  "data": null
}
```

**400 Bad Request - Assessment Closed:**
```json
{
  "success": false,
  "message": "Cannot delete image from closed assessment",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment or question not found or access denied",
  "data": null
}
```

---

## 15. Delete Question

Delete a specific question from an assessment.

**Endpoint:** `DELETE /teachers/assessments/:assessmentId/questions/:questionId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| assessmentId | string | Yes | Assessment ID |
| questionId | string | Yes | Question ID |

**Example Request:**
```
DELETE /teachers/assessments/assessment-uuid-1/questions/question-uuid-1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": null,
  "statusCode": 200
}
```

**Error Responses:**

**400 Bad Request - Has Responses:**
```json
{
  "success": false,
  "message": "Cannot delete question with student responses",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment or question not found or access denied",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## 16. Get Assessment Attempts

Get all students and their attempts for an assessment.

**Endpoint:** `GET /teachers/assessments/:id/attempts`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |

**Example Request:**
```
GET /teachers/assessments/assessment-uuid-1/attempts
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Assessment attempts retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment-uuid-1",
      "title": "Mathematics Chapter 1 Quiz",
      "total_points": 100,
      "passing_score": 60,
      "max_attempts": 2,
      "subject": {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "topic": {
        "id": "topic-uuid-1",
        "title": "Algebra Basics"
      }
    },
    "students": [
      {
        "student": {
          "id": "student-uuid-1",
          "student_id": "smh/2024/001",
          "user": {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@school.edu.ng",
            "display_picture": "https://example.com/photo.jpg"
          }
        },
        "attempts": [
          {
            "id": "attempt-uuid-1",
            "attempt_number": 1,
            "score": 85,
            "percentage": 85,
            "status": "COMPLETED",
            "started_at": "2024-01-20T10:00:00.000Z",
            "submitted_at": "2024-01-20T10:25:00.000Z",
            "time_taken": 1500,
            "is_passed": true
          }
        ],
        "best_score": 85,
        "attempts_count": 1,
        "has_passed": true
      },
      {
        "student": {
          "id": "student-uuid-2",
          "student_id": "smh/2024/002",
          "user": {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@school.edu.ng",
            "display_picture": "https://example.com/photo2.jpg"
          }
        },
        "attempts": [],
        "best_score": null,
        "attempts_count": 0,
        "has_passed": false
      }
    ],
    "statistics": {
      "total_students": 30,
      "attempted_count": 25,
      "not_attempted_count": 5,
      "passed_count": 20,
      "failed_count": 5,
      "average_score": 75.5,
      "highest_score": 98,
      "lowest_score": 45
    }
  },
  "statusCode": 200
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## 17. Get Student Submission

Get a specific student's submission for an assessment.

**Endpoint:** `GET /teachers/assessments/:id/attempts/:studentId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Assessment ID |
| studentId | string | Yes | Student ID (Student.id, not User.id) |

**Example Request:**
```
GET /teachers/assessments/assessment-uuid-1/attempts/student-uuid-1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Student submission retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment-uuid-1",
      "title": "Mathematics Chapter 1 Quiz",
      "total_points": 100
    },
    "student": {
      "id": "student-uuid-1",
      "student_id": "smh/2024/001",
      "user": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.edu.ng",
        "display_picture": "https://example.com/photo.jpg"
      }
    },
    "attempts": [
      {
        "id": "attempt-uuid-1",
        "attempt_number": 1,
        "score": 85,
        "percentage": 85,
        "status": "COMPLETED",
        "started_at": "2024-01-20T10:00:00.000Z",
        "submitted_at": "2024-01-20T10:25:00.000Z",
        "time_taken": 1500,
        "is_passed": true,
        "responses": [
          {
            "id": "response-uuid-1",
            "question_id": "question-uuid-1",
            "question_text": "What is the solution to 2x + 5 = 13?",
            "question_type": "MULTIPLE_CHOICE_SINGLE",
            "question_points": 2,
            "selected_option_ids": ["option-uuid-1"],
            "answer_text": null,
            "is_correct": true,
            "points_awarded": 2,
            "feedback": null
          },
          {
            "id": "response-uuid-2",
            "question_id": "question-uuid-2",
            "question_text": "Solve for y: y - 3 = 7",
            "question_type": "SHORT_ANSWER",
            "question_points": 3,
            "selected_option_ids": null,
            "answer_text": "y = 10",
            "is_correct": true,
            "points_awarded": 3,
            "feedback": "Correct!"
          }
        ]
      }
    ],
    "best_attempt": {
      "attempt_number": 1,
      "score": 85,
      "percentage": 85
    }
  },
  "statusCode": 200
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Assessment or student not found or access denied",
  "data": null
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "data": null
}
```

---

## Common Response Format

**ALL ENDPOINTS** follow this structure:

```typescript
{
  success: boolean;        // true = success, false = error
  message: string;         // Human-readable message
  data: object | null;     // Response data (object when success=true, null when success=false)
  statusCode?: number;     // HTTP status code (optional)
}
```

### Success Response Pattern
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // ... response data here ...
  },
  "statusCode": 200
}
```

### Error Response Pattern
```json
{
  "success": false,
  "message": "Error description here",
  "data": null
}
```

**⚠️ CRITICAL FOR FRONTEND:**
- **Always check `success` field first**
- **Only access `data` when `success === true`**
- **`data` will always be `null` when `success === false`**

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data or validation error |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Not authorized to access this resource |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error occurred |

---

## Data Types & Enums

### Assessment Status
```typescript
enum AssessmentStatus {
  DRAFT = 'DRAFT',           // Not published yet
  PUBLISHED = 'PUBLISHED',   // Published and available
  ACTIVE = 'ACTIVE',         // Currently active
  CLOSED = 'CLOSED',         // Closed, results released
  ARCHIVED = 'ARCHIVED'      // Archived
}
```

### Assessment Type
```typescript
enum AssessmentType {
  CBT = 'CBT',
  ASSIGNMENT = 'ASSIGNMENT',
  EXAM = 'EXAM',
  QUIZ = 'QUIZ',
  TEST = 'TEST',
  FORMATIVE = 'FORMATIVE',
  SUMMATIVE = 'SUMMATIVE',
  DIAGNOSTIC = 'DIAGNOSTIC',
  BENCHMARK = 'BENCHMARK',
  PRACTICE = 'PRACTICE',
  MOCK_EXAM = 'MOCK_EXAM',
  OTHER = 'OTHER'
}
```

### Question Type
```typescript
enum QuestionType {
  MULTIPLE_CHOICE_SINGLE = 'MULTIPLE_CHOICE_SINGLE',
  MULTIPLE_CHOICE_MULTIPLE = 'MULTIPLE_CHOICE_MULTIPLE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  LONG_ANSWER = 'LONG_ANSWER',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_BLANK = 'FILL_IN_BLANK',
  MATCHING = 'MATCHING',
  ORDERING = 'ORDERING',
  FILE_UPLOAD = 'FILE_UPLOAD',
  NUMERIC = 'NUMERIC',
  DATE = 'DATE',
  RATING_SCALE = 'RATING_SCALE'
}
```

### Difficulty Level
```typescript
enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT'
}
```

### Grading Type
```typescript
enum GradingType {
  AUTOMATIC = 'AUTOMATIC',   // Auto-graded
  MANUAL = 'MANUAL',         // Manual grading
  MIXED = 'MIXED'            // Both auto and manual
}
```

---

## Business Logic Notes

### 1. Assessment Lifecycle

**Draft → Published → Active → Closed**

1. **DRAFT**: Assessment is being created, questions can be added/edited/deleted
2. **PUBLISHED**: Assessment is available to students, limited editing
3. **ACTIVE**: Students are currently taking the assessment
4. **CLOSED**: Assessment has ended, results are released

### 2. Publishing Requirements

**To publish an assessment:**
- Must have at least 1 question
- Assessment details must be complete

**Cannot publish if:**
- No questions added
- Assessment is already published

### 3. Question Management

**Adding Questions:**
- Questions can be added only to DRAFT or PUBLISHED assessments
- Order is auto-assigned if not provided
- Images must be uploaded first using the upload endpoint

**Editing Questions:**
- Questions can be edited only if no student has submitted responses
- Once students start answering, questions become read-only

**Deleting Questions:**
- Questions can only be deleted if no students have responded
- Deleting a question with responses is not allowed

### 4. Image Handling

**Upload Flow:**
1. Upload image using `/upload-image` endpoint
2. Receive `image_url` and `image_s3_key` in response
3. Use these values when creating/updating the question

**Image Storage:**
- Images stored in AWS S3
- Format: `assessment-images/schools/{school_id}/assessments/{assessment_id}/question_{timestamp}_image.{ext}`
- Supported formats: JPEG, PNG, GIF, WEBP
- Max size: 5MB

### 5. Student Attempts

**Attempt Limits:**
- Controlled by `max_attempts` field (1-10)
- Students can retake until limit reached
- Best score is tracked

**Attempt Status:**
- `STARTED`: Student has opened the assessment
- `IN_PROGRESS`: Student is actively taking it
- `COMPLETED`: Student has submitted
- `ABANDONED`: Student left without submitting

### 6. Results Release

**Before Release:**
- Students can see their score but not correct answers
- Teacher can view all submissions

**After Release:**
- Students can see correct answers (if enabled)
- Assessment status changes to CLOSED
- No more attempts allowed

### 7. Access Control

**Teacher Access:**
- Teachers can only manage assessments they created
- Must have access to the subject
- Must have access to the topic (if specified)

**Validation:**
- Subject ID is always required
- Topic ID is optional
- Teacher must teach the subject

---

## Example Usage (JavaScript/TypeScript)

### Creating an Assessment

```typescript
const createAssessment = async (assessmentData) => {
  try {
    const response = await fetch('/teachers/assessments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: assessmentData.title,
        description: assessmentData.description,
        subject_id: assessmentData.subjectId,
        topic_id: assessmentData.topicId,
        duration: assessmentData.duration,
        passing_score: assessmentData.passingScore,
        assessment_type: 'CBT',
        grading_type: 'AUTOMATIC',
        shuffle_questions: true,
        show_correct_answers: false,  // Don't show until released
        start_date: assessmentData.startDate,
        end_date: assessmentData.endDate
      })
    });

    const result = await response.json();
    
    if (result.success) {
      const assessmentId = result.data.id;
      console.log('Assessment created:', assessmentId);
      showToast('success', 'Assessment created successfully');
      return assessmentId;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error creating assessment:', error);
    showToast('error', 'Failed to create assessment');
    return null;
  }
};
```

### Fetching Assessments with Filters

```typescript
const fetchAssessments = async (subjectId, filters = {}) => {
  try {
    const params = new URLSearchParams({
      subject_id: subjectId,
      page: filters.page || 1,
      limit: filters.limit || 10
    });

    if (filters.status) params.append('status', filters.status);
    if (filters.topicId) params.append('topic_id', filters.topicId);
    if (filters.assessmentType) params.append('assessment_type', filters.assessmentType);

    const response = await fetch(`/teachers/assessments?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { assessments, pagination } = result.data;
      console.log('Assessments:', assessments);
      console.log('Total:', pagination.total);
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return null;
  }
};
```

### Adding a Question with Image

```typescript
const addQuestionWithImage = async (assessmentId, questionData, imageFile) => {
  try {
    let imageUrl = null;
    let imageS3Key = null;

    // Step 1: Upload image if provided
    if (imageFile) {
      const formData = new FormData();
      formData.append('image', imageFile);

      const uploadResponse = await fetch(
        `/teachers/assessments/${assessmentId}/questions/upload-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      const uploadResult = await uploadResponse.json();
      
      if (uploadResult.success) {
        imageUrl = uploadResult.data.image_url;
        imageS3Key = uploadResult.data.image_s3_key;
        console.log('Image uploaded:', imageUrl);
      } else {
        showToast('error', 'Failed to upload image');
        return null;
      }
    }

    // Step 2: Create question with image URL
    const response = await fetch(
      `/teachers/assessments/${assessmentId}/questions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_text: questionData.questionText,
          question_type: questionData.questionType,
          points: questionData.points,
          difficulty_level: questionData.difficultyLevel,
          image_url: imageUrl,
          image_s3_key: imageS3Key,
          explanation: questionData.explanation,
          options: questionData.options,  // For multiple choice
          correct_answers: questionData.correctAnswers
        })
      }
    );

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Question added successfully');
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error adding question:', error);
    showToast('error', 'Failed to add question');
    return null;
  }
};
```

### Publishing an Assessment

```typescript
const publishAssessment = async (assessmentId) => {
  try {
    const response = await fetch(
      `/teachers/assessments/${assessmentId}/publish`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Assessment published successfully');
      console.log('Published assessment:', result.data);
      return true;
    } else {
      showToast('error', result.message);
      
      // Handle specific errors
      if (result.message.includes('without questions')) {
        showToast('warning', 'Please add questions before publishing');
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error publishing assessment:', error);
    showToast('error', 'Failed to publish assessment');
    return false;
  }
};
```

### Getting Assessment Attempts

```typescript
const getAssessmentAttempts = async (assessmentId) => {
  try {
    const response = await fetch(
      `/teachers/assessments/${assessmentId}/attempts`,
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
      const { assessment, students, statistics } = result.data;
      
      console.log('Assessment:', assessment.title);
      console.log('Statistics:', statistics);
      console.log('Students with attempts:', students.length);
      
      // Display statistics
      console.log(`Average Score: ${statistics.average_score}%`);
      console.log(`Pass Rate: ${(statistics.passed_count / statistics.total_students * 100).toFixed(2)}%`);
      
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Error fetching attempts:', error);
    return null;
  }
};
```

### Releasing Results

```typescript
const releaseResults = async (assessmentId) => {
  try {
    // Confirm before releasing
    const confirmed = confirm(
      'Are you sure you want to release results? This will close the assessment and students will see their scores and correct answers.'
    );
    
    if (!confirmed) return false;

    const response = await fetch(
      `/teachers/assessments/${assessmentId}/release-results`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Results released successfully');
      console.log('Assessment closed:', result.data);
      return true;
    } else {
      showToast('error', result.message);
      return false;
    }
  } catch (error) {
    console.error('Error releasing results:', error);
    showToast('error', 'Failed to release results');
    return false;
  }
};
```

---

## UI/UX Recommendations

### 1. Assessment Creation Flow
- **Multi-step Form:** Break creation into steps (Details → Questions → Settings → Review)
- **Save Draft:** Auto-save drafts periodically
- **Preview:** Show preview before publishing
- **Templates:** Provide assessment templates

### 2. Question Builder
- **Question Type Selector:** Visual selector for question types
- **Image Upload:** Drag-and-drop image upload
- **Rich Text Editor:** For question text and explanations
- **Option Management:** Easy add/remove/reorder options
- **Preview:** Live preview of question

### 3. Assessment Management Dashboard
- **Status Badges:** Visual status indicators
- **Quick Actions:** Publish, Edit, Delete, View Attempts
- **Filters:** By status, type, topic, date
- **Search:** Search by title
- **Statistics Cards:** Total assessments, active, completed

### 4. Student Attempts View
- **Table View:** List of students with attempt counts and scores
- **Filter Options:** Show only attempted, not attempted, passed, failed
- **Individual View:** Click to see detailed submission
- **Export:** Export results to CSV/PDF
- **Statistics:** Visual charts for class performance

### 5. Results Release
- **Confirmation Dialog:** Confirm before releasing (irreversible)
- **Preview:** Show what students will see
- **Bulk Actions:** Release results for multiple assessments

### 6. General
- **Loading States:** Skeleton loaders for data fetching
- **Error Handling:** Clear error messages with retry options
- **Validation:** Real-time validation for forms
- **Success Feedback:** Toast notifications for actions
- **Help Text:** Tooltips and help text for fields

---

## Testing Endpoints

### Using cURL

```bash
# Create assessment
curl -X POST "/teachers/assessments" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Math Quiz",
    "subject_id": "subject-uuid-1",
    "duration": 30,
    "passing_score": 60
  }'

# Get all assessments
curl -X GET "/teachers/assessments?subject_id=subject-uuid-1&status=PUBLISHED" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get assessment by ID
curl -X GET "/teachers/assessments/assessment-uuid-1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Upload question image
curl -X POST "/teachers/assessments/assessment-uuid-1/questions/upload-image" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "image=@/path/to/image.jpg"

# Create question
curl -X POST "/teachers/assessments/assessment-uuid-1/questions" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "question_text": "What is 2 + 2?",
    "question_type": "MULTIPLE_CHOICE_SINGLE",
    "points": 1,
    "options": [
      {"option_text": "3", "order": 1, "is_correct": false},
      {"option_text": "4", "order": 2, "is_correct": true}
    ]
  }'

# Publish assessment
curl -X POST "/teachers/assessments/assessment-uuid-1/publish" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get assessment attempts
curl -X GET "/teachers/assessments/assessment-uuid-1/attempts" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Release results
curl -X POST "/teachers/assessments/assessment-uuid-1/release-results" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in all requests
2. **Response Checking:** Always check `success` field before accessing `data`
3. **Error Handling:** Display user-friendly error messages via toasters
4. **Image Upload:** Two-step process: upload image first, then create question
5. **Subject ID Required:** Always provide subject_id when fetching assessments
6. **Publishing:** Ensure questions are added before publishing
7. **Results Release:** Cannot be undone, confirm with user first
8. **Question Deletion:** Only possible if no student responses exist
9. **Auto-save:** Consider auto-saving drafts periodically
10. **Validation:** Validate all forms before submission

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 16, 2026

