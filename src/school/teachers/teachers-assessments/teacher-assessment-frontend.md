# Teacher Assessments (Teacher Module) - Frontend API Reference

Base URL: **`/teachers-assessments`**  
Server global prefix: **`/api/v1`** (so full path is typically **`/api/v1/teachers-assessments`**)  
Authentication: **Bearer JWT** required on all endpoints.

Audience: Teachers can list, preview, and manage (create/update/duplicate) assessments they are allowed to teach, including managing questions and media.

---
## IMPORTANT: Response Structure (Success)

All endpoints return a wrapper object on success:

```json
{
  "success": true,
  "message": "string",
  "data": { "...": "..." },
  "statusCode": 200
}
```

---
## IMPORTANT: Response Structure (Error)

When an endpoint fails, the response is typically:

```json
{
  "success": false,
  "message": "string",
  "data": null,
  "statusCode": 400
}
```

Always handle `success === false`.

---
## Table of Contents

1. [Get All Teacher Assessments](#1-get-all-teacher-assessments)
2. [Get Assessment by ID (Teacher View)](#2-get-assessment-by-id-teacher-view)
3. [Get Assessment Questions (Teacher Preview)](#3-get-assessment-questions-teacher-preview)
4. [Duplicate Assessment](#4-duplicate-assessment)
5. [Add Questions (No Images)](#5-add-questions-no-images)
6. [Add Question (With Images)](#6-add-question-with-images)
7. [Update Question (JSON)](#7-update-question-json)
8. [Update Question (With Images)](#8-update-question-with-images)
9. [Delete Question](#9-delete-question)
10. [Update Assessment (Metadata)](#10-update-assessment-metadata)

---
## Access Rules (Applies to All Endpoints)

- You must be authenticated as a teacher (`JwtGuard`).
- The teacher can only access assessments for the subject(s) they are assigned to teach.
- Some endpoints (like modifying assessment/questions) are restricted by assessment status; adding/updating/deleting questions is blocked when the assessment is `PUBLISHED` or `ACTIVE` (and other statuses depending on the specific operation).

---
## Enums Used in Query Params / Payload

### `status` (assessment status)
- `DRAFT`
- `PUBLISHED`
- `ACTIVE`
- `CLOSED`
- `ARCHIVED`

### `term` (academic term)
- `first`
- `second`
- `third`

### `question_type`
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

### `assessment_type`
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

### `grading_type`
- `AUTOMATIC`
- `MANUAL`
- `MIXED`

### `difficulty_level`
- `EASY`
- `MEDIUM`
- `HARD`
- `EXPERT`

---
## Request Object Shapes

### Question Object: `QuestionDto` (used in `POST /:id/questions` and image version)

```ts
{
  // required
  question_text: string
  question_type: string

  // optional
  order?: number
  points?: number
  is_required?: boolean
  time_limit?: number
  image_url?: string
  image_s3_key?: string
  audio_url?: string
  video_url?: string

  allow_multiple_attempts?: boolean
  show_hint?: boolean
  hint_text?: string
  min_length?: number
  max_length?: number
  min_value?: number
  max_value?: number
  explanation?: string
  difficulty_level?: string

  // for MCQ / TRUE_FALSE
  options?: Array<{
    option_text: string
    order?: number
    is_correct: boolean

    // can be provided for non-image endpoint
    image_url?: string
    image_s3_key?: string

    // used only for image upload mapping
    // index must match the position of the uploaded file in `optionImages`
    imageIndex?: number

    audio_url?: string
  }>

  // for non-MCQ question types
  correct_answers?: Array<{
    answer_text?: string
    answer_number?: number
    answer_date?: string
    answer_json?: any
  }>
}
```

### Duplicate Assessment: `DuplicateAssessmentDto`

```json
{
  "new_title": "string",
  "shuffle_questions": "boolean (optional)",
  "shuffle_options": "boolean (optional)",
  "new_description": "string (optional)"
}
```

### Add Questions Payload: `AddQuestionsDto`

```json
{
  "questions": [
    { "...QuestionDto...": true }
  ]
}
```

### Update Assessment: `UpdateAssessmentDto`

All fields are optional (PATCH semantics). It supports:
- full metadata fields from `CreateNewAssessmentDto`
- `status`
- `is_result_released`
- `student_can_view_grading`

Use the field list in the section below (Update Assessment).

### Update Question Payload: `UpdateQuestionDto`

```ts
{
  // all optional
  question_text?: string
  question_type?: string
  order?: number
  points?: number
  is_required?: boolean
  time_limit?: number

  image_url?: string
  image_s3_key?: string
  audio_url?: string
  video_url?: string

  allow_multiple_attempts?: boolean
  show_hint?: boolean
  hint_text?: string
  min_length?: number
  max_length?: number
  min_value?: number
  max_value?: number
  explanation?: string
  difficulty_level?: string

  // Optional smart-merge lists:
  // - Options: update existing by `id`, create when `id` is omitted
  // - Unmentioned options are kept
  options?: Array<{
    id?: string
    option_text?: string
    order?: number
    is_correct?: boolean
    image_url?: string
    image_s3_key?: string
    audio_url?: string
  }>

  // Correct answers smart-merge:
  correct_answers?: Array<{
    id?: string
    answer_text?: string
    answer_number?: number
    answer_date?: string
    answer_json?: any
  }>
}
```

---
## Common Identifiers

- `assessmentId`: assessment UUID/id string
- `questionId`: question UUID/id string
- `subject_id`, `topic_id`: subject/topic UUID/id strings

---
## 1. Get All Teacher Assessments

Fetch all assessments available to the authenticated teacher with filtering and pagination.

Endpoint: `GET /teachers-assessments`

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Query Params:

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | number | No | `1` | Page number (min: 1) |
| `limit` | number | No | `20` | Items per page (min: 1, max: 100) |
| `search` | string | No | - | Search by `title` or `description` |
| `academic_session_id` | string | No | current | Academic session filter (defaults to current if omitted) |
| `term` | enum | No | - | `first` / `second` / `third` (works with current session lookup) |
| `subject_id` | string | No | - | Subject filter |
| `topic_id` | string | No | - | Topic filter |
| `status` | enum | No | - | `DRAFT` / `PUBLISHED` / `ACTIVE` / `CLOSED` / `ARCHIVED` |
| `assessment_type` | enum | No | - | `assessment_type` filter |
| `is_published` | boolean | No | - | Published state filter |
| `created_by` | string | No | - | Creator filter (admin/director use; teacher module still accepts it) |
| `sort_by` | string | No | `createdAt` | `createdAt` / `title` / `start_date` / `end_date` / `status` |
| `sort_order` | string | No | `desc` | `asc` or `desc` |

Success Response (200):
```json
{
  "success": true,
  "message": "Assessments fetched successfully",
  "statusCode": 200,
  "data": {
    "analytics": {
      "all": 0,
      "draft": 0,
      "published": 0,
      "active": 0,
      "closed": 0,
      "archived": 0
    },
    "sessions": [
      {
        "id": "academic-session-uuid",
        "academic_year": "string",
        "term": "first",
        "start_year": 2025,
        "end_year": 2026,
        "start_date": "2026-01-01T00:00:00.000Z",
        "end_date": "2026-03-31T23:59:59.000Z",
        "is_current": true,
        "status": "active"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    },
    "assessments": [
      {
        "id": "assessment-uuid",
        "title": "string",
        "description": "string or null",
        "duration": 0,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z",
        "topic_id": "topic-uuid or null",
        "order": 0,
        "academic_session_id": "session-uuid",
        "allow_review": true,
        "auto_submit": true,
        "created_by": "teacher-uuid",
        "end_date": "2026-02-01T00:00:00.000Z or null",
        "grading_type": "AUTOMATIC | MANUAL | MIXED",
        "instructions": "string or null",
        "is_published": false,
        "is_result_released": false,
        "max_attempts": 1,
        "passing_score": 50,
        "can_edit_assessment": true,
        "published_at": "DateTime or null",
        "result_released_at": "DateTime or null",
        "school_id": "school-uuid",
        "show_correct_answers": false,
        "show_feedback": true,
        "shuffle_options": false,
        "shuffle_questions": false,
        "student_completed_assessment": false,
        "start_date": "DateTime or null",
        "tags": ["string"],
        "time_limit": 0,
        "total_points": 100,
        "status": "DRAFT | PUBLISHED | ACTIVE | CLOSED | ARCHIVED",
        "subject_id": "subject-uuid",
        "assessment_type": "AssessmentType",
        "submissions": {},
        "student_can_view_grading": false,

        "subject": {
          "id": "subject-uuid",
          "name": "string",
          "code": "string"
        },
        "topic": {
          "id": "topic-uuid",
          "title": "string"
        },
        "createdBy": {
          "id": "teacher-uuid",
          "first_name": "string",
          "last_name": "string"
        },
        "_count": {
          "questions": 0,
          "attempts": 0
        }
      }
    ]
  }
}
```

Error Responses:
- `400` Bad Request (invalid query/auth context, missing current session)
- `404` Not Found (teacher record not found)

Example Error:
```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null,
  "statusCode": 400
}
```

---
## 2. Get Assessment by ID (Teacher View)

Endpoint: `GET /teachers-assessments/:id`

Path param:
- `id`: assessment id

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Success Response (200):
```json
{
  "success": true,
  "message": "Assessment details retrieved successfully",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "string",
      "description": "string or null",
      "duration": 0,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "topic_id": "topic-uuid or null",
      "order": 0,
      "academic_session_id": "session-uuid",
      "allow_review": true,
      "auto_submit": true,
      "created_by": "teacher-uuid",
      "end_date": "DateTime or null",
      "grading_type": "AUTOMATIC | MANUAL | MIXED",
      "instructions": "string or null",
      "is_published": false,
      "is_result_released": false,
      "max_attempts": 1,
      "passing_score": 50,
      "can_edit_assessment": true,
      "published_at": "DateTime or null",
      "result_released_at": "DateTime or null",
      "school_id": "school-uuid",
      "show_correct_answers": false,
      "show_feedback": true,
      "shuffle_options": false,
      "shuffle_questions": false,
      "student_completed_assessment": false,
      "start_date": "DateTime or null",
      "tags": ["string"],
      "time_limit": 0,
      "total_points": 100,
      "status": "DRAFT | PUBLISHED | ACTIVE | CLOSED | ARCHIVED",
      "subject_id": "subject-uuid",
        "assessment_type": "AssessmentType",
      "submissions": {},
      "student_can_view_grading": false,

      "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
      "topic": { "id": "topic-uuid", "title": "string" },
      "createdBy": { "id": "teacher-uuid", "first_name": "string", "last_name": "string", "email": "string" },
      "academicSession": { "id": "session-uuid", "academic_year": "string", "term": "first" },
      "_count": { "questions": 0, "attempts": 0 }
    },
    "questions": {
      "total": 0,
      "items": [
        {
          "id": "question-uuid",
          "assessment_id": "assessment-uuid",
          "question_text": "string",
          "question_type": "QuestionType",
          "order": 1,
          "points": 1,
          "is_required": true,
          "time_limit": 0,
          "image_url": "string or null",
          "image_s3_key": "string or null",
          "audio_url": "string or null",
          "video_url": "string or null",
          "allow_multiple_attempts": false,
          "show_hint": false,
          "hint_text": "string or null",
          "min_length": 0,
          "max_length": 0,
          "min_value": 0,
          "max_value": 0,
          "explanation": "string or null",
          "difficulty_level": "EASY | MEDIUM | HARD | EXPERT",
          "createdAt": "DateTime",
          "updatedAt": "DateTime",

          "_count": { "responses": 0 },

          "options": [
            {
              "id": "option-uuid",
              "question_id": "question-uuid",
              "option_text": "string",
              "order": 1,
              "is_correct": true,
              "image_url": "string or null",
              "image_s3_key": "string or null",
              "audio_url": "string or null",
              "createdAt": "DateTime",
              "updatedAt": "DateTime"
            }
          ],
          "correct_answers": [
            {
              "id": "correct-uuid",
              "question_id": "question-uuid",
              "answer_text": "string or null",
              "answer_number": 0,
              "answer_date": "DateTime or null",
              "option_ids": ["option-uuid"],
              "answer_json": {},
              "createdAt": "DateTime",
              "updatedAt": "DateTime"
            }
          ]
        }
      ]
    },
    "submissions": {
      "summary": {
        "totalStudents": 0,
        "studentsAttempted": 0,
        "studentsNotAttempted": 0,
        "completionRate": 0,
        "classes": [
          { "id": "class-uuid", "name": "JSS 1A" }
        ]
      },
      "students": [
        {
          "student": {
            "id": "student-uuid",
            "user_id": "user-uuid",
            "first_name": "string",
            "last_name": "string",
            "email": "string",
            "display_picture": "string or null",
            "class": { "id": "class-uuid", "name": "string" }
          },
          "attempts": [
            {
              "id": "attempt-uuid",
              "attempt_number": 1,
              "status": "NOT_STARTED | IN_PROGRESS | SUBMITTED | GRADED | EXPIRED",
              "started_at": "DateTime or null",
              "submitted_at": "DateTime or null",
              "time_spent": 0,
              "total_score": 0,
              "max_score": 0,
              "percentage": 0,
              "passed": false,
              "is_graded": false,
              "graded_at": "DateTime or null",
              "grade_letter": "string or null"
            }
          ],
          "totalAttempts": 0,
          "bestScore": 0,
          "passed": false,
          "hasAttempted": true
        }
      ]
    }
  }
}
```

Error Responses:
- `400` invalid auth/context (e.g. missing current session)
- `403` forbidden (teacher has no access to this assessment)
- `404` not found (teacher/assessment not found)

---
## 3. Get Assessment Questions (Teacher Preview)

Endpoint: `GET /teachers-assessments/:id/questions`

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Success Response (200):
```json
{
  "success": true,
  "message": "Assessment questions retrieved successfully (preview mode)",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "string",
      "description": "string or null",
      "instructions": "string or null",
      "duration": 0,
      "time_limit": 0,
      "total_points": 100,
      "max_attempts": 1,
      "passing_score": 50,
      "status": "DRAFT | PUBLISHED | ACTIVE | CLOSED | ARCHIVED",
      "is_published": false,
      "start_date": "DateTime or null",
      "end_date": "DateTime or null",

      "subject": {
        "id": "subject-uuid",
        "name": "string",
        "code": "string",
        "color": "string or null"
      },
      "teacher": {
        "id": "teacher-uuid",
        "name": "First Last"
      },
      "total_attempts": 0
    },
    "questions": [
      {
        "id": "question-uuid",
        "question_text": "string",
      "question_type": "QuestionType",
        "points": 1,
        "order": 1,
        "image_url": "string or null",
        "audio_url": "string or null",
        "video_url": "string or null",
        "is_required": true,
        "explanation": "string or null",
        "difficulty_level": "EASY | MEDIUM | HARD | EXPERT",

        "options": [
          {
            "id": "option-uuid",
            "text": "string",
            "is_correct": true,
            "order": 1
          }
        ],
        "correct_answers": [
          {
            "id": "correct-uuid",
            "answer_text": "string or null",
            "option_ids": ["option-uuid"]
          }
        ]
      }
    ],
    "total_questions": 0,
    "isPreview": true,
    "assessmentContext": "school"
  }
}
```

Error Responses:
- `400` invalid auth/context
- `403` forbidden (teacher has no access)
- `404` not found

---
## 4. Duplicate Assessment

Duplicates an assessment for the authenticated teacher and creates the new one in `DRAFT` status.

Endpoint: `POST /teachers-assessments/:id/duplicate`

Path param:
- `id`: source assessment id

Headers:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

Body: `DuplicateAssessmentDto`
```json
{
  "new_title": "Mathematics Test - Week 2",
  "shuffle_questions": false,
  "shuffle_options": false,
  "new_description": "optional new description"
}
```

Success Response (201):
```json
{
  "success": true,
  "message": "Assessment duplicated successfully",
  "statusCode": 201,
  "data": {
    "assessment": {
      "id": "new-assessment-uuid",
      "title": "Mathematics Test - Week 2",
      "description": "string or null",
      "duration": 0,
      "createdAt": "DateTime",
      "updatedAt": "DateTime",
      "topic_id": "topic-uuid or null",
      "order": 0,
      "academic_session_id": "session-uuid",
      "allow_review": true,
      "auto_submit": true,
      "created_by": "teacher-uuid",
      "end_date": "DateTime or null",
      "grading_type": "AUTOMATIC | MANUAL | MIXED",
      "instructions": "string or null",
      "is_published": false,
      "is_result_released": false,
      "max_attempts": 1,
      "passing_score": 50,
      "can_edit_assessment": true,
      "published_at": "DateTime or null",
      "result_released_at": "DateTime or null",
      "school_id": "school-uuid",
      "show_correct_answers": false,
      "show_feedback": true,
      "shuffle_options": false,
      "shuffle_questions": false,
      "student_completed_assessment": false,
      "start_date": "DateTime or null",
      "tags": ["string"],
      "time_limit": 0,
      "total_points": 100,
      "status": "DRAFT | PUBLISHED | ACTIVE | CLOSED | ARCHIVED",
      "subject_id": "subject-uuid",
      "assessment_type": "AssessmentType",
      "submissions": {},
      "student_can_view_grading": false,

      "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
      "topic": { "id": "topic-uuid", "title": "string" },
      "createdBy": { "id": "teacher-uuid", "first_name": "string", "last_name": "string" },
      "_count": { "questions": 0 }
    },
    "source_assessment_id": "assessment-uuid (the :id)",
    "shuffle_applied": {
      "questions": false,
      "options": false
    }
  }
}
```

Error Responses:
- `400` missing/invalid academic session
- `403` forbidden (teacher does not teach that subject)
- `404` not found

---
## 5. Add Questions (No Images)

Adds a batch of questions to an assessment (no media upload in this endpoint).

Endpoint: `POST /teachers-assessments/:id/questions`

Path param:
- `id`: assessment id

Headers:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

Body: `AddQuestionsDto`
```json
{
  "questions": [
    {
      "question_text": "What is the capital of France?",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "order": 1,
      "points": 1,
      "is_required": true,
      "time_limit": 30,
      "image_url": "optional",
      "audio_url": "optional",
      "video_url": "optional",
      "allow_multiple_attempts": false,
      "show_hint": false,
      "hint_text": "optional",
      "min_length": null,
      "max_length": null,
      "min_value": null,
      "max_value": null,
      "explanation": "optional",
      "difficulty_level": "MEDIUM",
      "options": [
        {
          "option_text": "Paris",
          "order": 1,
          "is_correct": true
        }
      ],
      "correct_answers": [
        {
          "answer_text": null,
          "answer_number": null,
          "answer_date": null,
          "answer_json": {}
        }
      ]
    }
  ]
}
```

Success Response (201):
```json
{
  "success": true,
  "message": "Questions added successfully",
  "statusCode": 201,
  "data": {
    "assessment_id": "assessment-uuid",
    "questions_added": 1,
    "total_questions": 10,
    "questions": [
      {
        "id": "question-uuid",
        "assessment_id": "assessment-uuid",
        "question_text": "string",
        "question_type": "QuestionType",
        "order": 1,
        "points": 1,
        "is_required": true,
        "time_limit": 30,
        "image_url": "string or null",
        "image_s3_key": "string or null",
        "audio_url": "string or null",
        "video_url": "string or null",
        "allow_multiple_attempts": false,
        "show_hint": false,
        "hint_text": "string or null",
        "min_length": 1,
        "max_length": 500,
        "min_value": 0,
        "max_value": 100,
        "explanation": "string or null",
        "difficulty_level": "MEDIUM",
        "createdAt": "DateTime",
        "updatedAt": "DateTime",
        "options": [
          {
            "id": "option-uuid",
            "question_id": "question-uuid",
            "option_text": "string",
            "order": 1,
            "is_correct": true,
            "image_url": "string or null",
            "image_s3_key": "string or null",
            "audio_url": "string or null",
            "createdAt": "DateTime",
            "updatedAt": "DateTime"
          }
        ],
        "correct_answers": [
          {
            "id": "correct-uuid",
            "question_id": "question-uuid",
            "answer_text": "string or null",
            "answer_number": 0,
            "answer_date": "DateTime or null",
            "option_ids": ["option-uuid"],
            "answer_json": {},
            "createdAt": "DateTime",
            "updatedAt": "DateTime"
          }
        ]
      }
    ]
  }
}
```

Error Responses:
- `400` cannot modify status / invalid payload
- `403` forbidden
- `404` not found

---
## 6. Add Question (With Images)

Creates a single question with optional question image and up to 10 option images.

Endpoint: `POST /teachers-assessments/:id/questions/with-image`

Headers:
- `Authorization: Bearer <token>`
- Content-Type: `multipart/form-data`

Multipart Form Fields:

Files:
- `image` (max 1): question image
- `optionImages` (max 10): images for options

Form Fields:
- `questionData` (string, required): stringified JSON of `QuestionDto`

Important mapping rule:
- Inside `questionData.options[]`, each option must include `imageIndex` indicating which uploaded file maps to it.
- The server matches: `questionData.options.find(opt => opt.imageIndex === i)` where `i` is the index of the uploaded `optionImages` array.

Success Response (201):
Same shape as `Add Questions (No Images)` (see section 5). The `questions[]` returned are the newly created full question objects.

Error Responses:
- `400` invalid JSON/image constraints
- `403` forbidden
- `404` not found

---
## 7. Update Question (JSON)

Updates a single question using JSON (smart merge behavior for options/correct answers).

Endpoint: `PATCH /teachers-assessments/:id/questions/:questionId`

Headers:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

Path params:
- `id`: assessment id
- `questionId`: question id

Body: `UpdateQuestionDto` (all fields optional; smart merge)

Success Response (200):
```json
{
  "success": true,
  "message": "Question updated successfully",
  "statusCode": 200,
  "data": {
    "assessment_id": "assessment-uuid",
    "question": {
      "id": "question-uuid",
      "assessment_id": "assessment-uuid",
      "question_text": "string or updated",
      "question_type": "QuestionType",
      "order": 1,
      "points": 1,
      "is_required": true,
      "time_limit": 30,
      "image_url": "string or null",
      "image_s3_key": "string or null",
      "audio_url": "string or null",
      "video_url": "string or null",
      "allow_multiple_attempts": false,
      "show_hint": false,
      "hint_text": "string or null",
      "min_length": 1,
      "max_length": 500,
      "min_value": 0,
      "max_value": 100,
      "explanation": "string or null",
      "difficulty_level": "MEDIUM",
      "createdAt": "DateTime",
      "updatedAt": "DateTime",
      "options": [
        {
          "id": "option-uuid",
          "question_id": "question-uuid",
          "option_text": "string",
          "order": 1,
          "is_correct": true,
          "image_url": "string or null",
          "image_s3_key": "string or null",
          "audio_url": "string or null",
          "createdAt": "DateTime",
          "updatedAt": "DateTime"
        }
      ],
      "correct_answers": [
        {
          "id": "correct-uuid",
          "question_id": "question-uuid",
          "answer_text": "string or null",
          "answer_number": 0,
          "answer_date": "DateTime or null",
          "option_ids": ["option-uuid"],
          "answer_json": {},
          "createdAt": "DateTime",
          "updatedAt": "DateTime"
        }
      ]
    }
  }
}
```

Error Responses:
- `400` invalid payload / cannot update in published/active assessments
- `403` forbidden
- `404` not found

---
## 8. Update Question (With Images)

Updates a single question and/or its image media using multipart upload.

Endpoint: `PATCH /teachers-assessments/:id/questions/:questionId/with-image`

Headers:
- `Authorization: Bearer <token>`
- Content-Type: `multipart/form-data`

Multipart Form Fields:

Files:
- `newQuestionImage` (max 1): optional replacement image for question
- `newOptionImages` (max 10): optional replacement images for options

Form Fields:
- `questionData` (string, required): stringified JSON of `UpdateQuestionDto`
- `oldQuestionImageS3Key` (string, optional): server deletes the old question image from storage
- `optionImageUpdates` (string, optional): stringified JSON array (example): `[{ "optionId": "option-uuid", "oldS3Key"?: "string" }]`

Update rules:
- If `newOptionImages` is provided and `optionImageUpdates` is provided, their counts must match.
- For each `optionImageUpdates[i]`, the server assigns `newOptionImages[i]` to `optionId`.
- The server updates `options[].image_url` and `options[].image_s3_key` on the parsed `questionData` (creating an option entry in DTO if not already present).

Success Response (200):
Same shape as section 7 (`question` object inside `data`).

Error Responses:
- `400` invalid/mismatched JSON/files or assessment status restrictions
- `403` forbidden
- `404` not found

---
## 9. Delete Question

Permanently removes a question from an assessment, including associated media and related option/correct answer data.

Endpoint: `DELETE /teachers-assessments/:id/questions/:questionId`

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Path params:
- `id`: assessment id
- `questionId`: question id

Success Response (200):
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "statusCode": 200,
  "data": {
    "assessment_id": "assessment-uuid",
    "deleted_question_id": "question-uuid",
    "message": "Question and all associated media have been removed"
  }
}
```

Error Responses:
- `400` deletion blocked by assessment status / invalid operation
- `403` forbidden
- `404` not found

---
## 10. Update Assessment (Metadata)

Updates assessment metadata (PATCH semantics). You can change fields like dates, status, grading settings, etc.

Endpoint: `PATCH /teachers-assessments/:id`

Path param:
- `id`: assessment id

Headers:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

Body: `UpdateAssessmentDto` (all optional; send only fields you want to change)

Field list:
| Field | Type | Description |
|---|---|---|
| `title` | string | Assessment title |
| `description` | string | Assessment description |
| `instructions` | string | Instructions for students |
| `subject_id` | string | Subject ID (must be a subject the teacher teaches) |
| `topic_id` | string | Optional topic ID |
| `duration` | number | Duration in minutes |
| `max_attempts` | number | Max attempts per student |
| `passing_score` | number | Passing score percentage |
| `total_points` | number | Total possible points |
| `shuffle_questions` | boolean | Shuffle question order |
| `shuffle_options` | boolean | Shuffle option order |
| `show_correct_answers` | boolean | Show correct answers |
| `show_feedback` | boolean | Show feedback after submission |
| `allow_review` | boolean | Allow review |
| `start_date` | string | ISO 8601 date-time |
| `end_date` | string | ISO 8601 date-time |
| `time_limit` | number | Time limit in minutes |
| `grading_type` | string | `AUTOMATIC | MANUAL | MIXED` |
| `auto_submit` | boolean | Auto-submit when time expires |
| `tags` | string[] | Tags |
| `assessment_type` | string | `AssessmentType` |
| `status` | string | `DRAFT | PUBLISHED | ACTIVE | CLOSED | ARCHIVED` |
| `is_result_released` | boolean | Whether results were released |
| `student_can_view_grading` | boolean | Whether student can view grading details |

Success Response (200):
```json
{
  "success": true,
  "message": "Assessment updated successfully",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "string",
      "description": "string or null",
      "duration": 0,
      "createdAt": "DateTime",
      "updatedAt": "DateTime",
      "topic_id": "topic-uuid or null",
      "order": 0,
      "academic_session_id": "session-uuid",
      "allow_review": true,
      "auto_submit": true,
      "created_by": "teacher-uuid",
      "end_date": "DateTime or null",
      "grading_type": "AUTOMATIC | MANUAL | MIXED",
      "instructions": "string or null",
      "is_published": false,
      "is_result_released": false,
      "max_attempts": 1,
      "passing_score": 50,
      "can_edit_assessment": true,
      "published_at": "DateTime or null",
      "result_released_at": "DateTime or null",
      "school_id": "school-uuid",
      "show_correct_answers": false,
      "show_feedback": true,
      "shuffle_options": false,
      "shuffle_questions": false,
      "student_completed_assessment": false,
      "start_date": "DateTime or null",
      "tags": ["string"],
      "time_limit": 0,
      "total_points": 100,
      "status": "DRAFT | PUBLISHED | ACTIVE | CLOSED | ARCHIVED",
      "subject_id": "subject-uuid",
      "assessment_type": "AssessmentType",
      "submissions": {},
      "student_can_view_grading": false,

      "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
      "topic": { "id": "topic-uuid", "title": "string" },
      "createdBy": { "id": "teacher-uuid", "first_name": "string", "last_name": "string" },
      "_count": { "questions": 0, "attempts": 0 }
    },
    "assessmentContext": "school"
  }
}
```

Error Responses:
- `400` cannot update published/active assessments or invalid input
- `403` forbidden
- `404` not found

