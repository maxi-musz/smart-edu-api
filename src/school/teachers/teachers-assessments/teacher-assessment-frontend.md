# Teacher Assessments (Teacher Module) - Frontend API Reference

Base URL: **`/teachers-assessments`**  
Server global prefix: **`/api/v1`** (so full path is typically **`/api/v1/teachers-assessments`**)  
Authentication: **Bearer JWT** required on all endpoints.

Audience: Teachers can **create** assessments (`POST /teachers-assessments`), list, preview, and manage (update/duplicate) assessments for subjects they are assigned to teach, including managing questions and media.

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

**Create assessment** (`POST /teachers-assessments`) uses HTTP **`201 Created`**. The JSON body may still show `statusCode: 200` inside `ResponseHelper.success` — treat HTTP status and `success` as authoritative.

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
2. [Create Assessment](#2-create-assessment)
3. [Get Assessment by ID (Teacher View)](#3-get-assessment-by-id-teacher-view)
4. [Get Assessment Questions (Teacher Preview)](#4-get-assessment-questions-teacher-preview)
5. [Duplicate Assessment](#5-duplicate-assessment)
6. [Add Questions (No Images)](#6-add-questions-no-images)
7. [Add Question (With Images)](#7-add-question-with-images)
8. [Update Question (JSON)](#8-update-question-json)
9. [Update Question (With Images)](#9-update-question-with-images)
10. [Delete Question](#10-delete-question)
11. [Update Assessment (Metadata)](#11-update-assessment-metadata)
12. [Bulk question import (Excel)](#12-bulk-question-import-excel)
    - [12a — Download Excel template](#12a-download-template) — `GET /teachers-assessments/:id/bulk-questions/template`
    - [12b — Upload workbook](#12b-upload-filled-workbook) — `POST /teachers-assessments/:id/bulk-questions/upload`

---
## Access Rules (Applies to All Endpoints)

- You must be authenticated as a teacher (`JwtGuard`).
- The teacher can only access or **create** assessments for the subject(s) they are assigned to teach (`teacher.subjectsTeaching`). Creating with a `subject_id` outside that list returns **`403`**.
- Some endpoints (like modifying assessment/questions) are restricted by assessment status; adding/updating/deleting questions is blocked when the assessment is `PUBLISHED` or `ACTIVE` (and other statuses depending on the specific operation). **Bulk Excel import** uses the same rules as **Add Questions**: only when the assessment is editable (not `PUBLISHED` / `ACTIVE` for adding questions).

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

### Create Assessment: `CreateNewAssessmentDto`

Used by **`POST /teachers-assessments`**. Required: **`title`**, **`subject_id`** (must be a subject you teach). Optional: **`academic_session_id`** (defaults to school current session), **`topic_id`** (must match subject + school + that session), timing/flags, **`assessment_type`**, etc. — see `create-new-assessment.dto.ts` in the repo for the full list.

### Add Questions Payload: `AddQuestionsDto`

```json
{
  "questions": [
    { "...QuestionDto...": true }
  ]
}
```

### Bulk import (Excel)

There is **no JSON body** for upload: use **multipart** field `excel_file`. The **Questions** sheet uses **human-readable** column titles (e.g. **Question text**, **Question type**); the server normalizes them to internal field names. **Difficulty** is not collected — every imported question is saved as **EASY**. **Explanation** is not in the template. Details: [section 12](#12-bulk-question-import-excel) and **How_to_use** in the workbook.

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
- `subject_id`, `topic_id`, `academic_session_id`: UUID strings where applicable

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
## 2. Create Assessment

Creates a **`DRAFT`**, unpublished assessment. **`school_id`** and **`created_by`** are set from the JWT.

Endpoint: **`POST /teachers-assessments`**  
HTTP status: **`201 Created`**

Headers:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

Body: **`CreateNewAssessmentDto`**

| Field | Required | Notes |
|---|---|---|
| `title` | Yes | |
| `subject_id` | Yes | Must belong to the school **and** appear in the teacher’s **`subjectsTeaching`** |
| `academic_session_id` | No | Must belong to the same school; if omitted, the school’s **current** session is used |
| `topic_id` | No | If set, must match **subject**, **school**, and the **resolved academic session** |
| `assessment_type` | No | Prisma `AssessmentType`; default **`CBT`**. Invalid value → **`400`** |
| Other metadata | No | Same as director create (`duration`, `grading_type`, `tags`, dates, booleans, etc.) |

**Rules (same family as director/school create)**

- Per **subject** + **academic session**: at most **2** × **`CBT`** and **1** × **`EXAM`**.
- If **`end_date`** is omitted, server sets a default (**now + 2 days**).

Success (**201**): `data.assessment` with `subject`, `topic`, `createdBy`, `_count` (questions/attempts).

Errors:

- **`400`** — bad auth context, session missing/invalid, invalid `assessment_type`, or CBT/EXAM cap
- **`403`** — `subject_id` not in the teacher’s teaching assignments
- **`404`** — teacher record, subject in school, or topic not found

---
## 3. Get Assessment by ID (Teacher View)

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
## 4. Get Assessment Questions (Teacher Preview)

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
## 5. Duplicate Assessment

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
## 6. Add Questions (No Images)

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
## 7. Add Question (With Images)

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
Same shape as `Add Questions (No Images)` (see section 6). The `questions[]` returned are the newly created full question objects.

Error Responses:
- `400` invalid JSON/image constraints
- `403` forbidden
- `404` not found

---
## 8. Update Question (JSON)

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
## 9. Update Question (With Images)

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
Same shape as section 8 (`question` object inside `data`).

Error Responses:
- `400` invalid/mismatched JSON/files or assessment status restrictions
- `403` forbidden
- `404` not found

---
## 10. Delete Question

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
## 11. Update Assessment (Metadata)

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

---
## 12. Bulk question import (Excel)

**Bulk question import** allows teachers to add **many questions at once** from a spreadsheet instead of entering each question manually in the UI (or calling the JSON batch API for every row).

### Atomicity (all pass or all fail — no partial imports)

The backend never applies “30 saved, 20 failed.” Behaviour is **all-or-nothing** in two layers:

1. **Sheet validation (before any database write)**  
   Every non-empty row is checked. If **any** row is invalid, the API returns **`400`** with `data.errors` and **zero** questions are inserted.

2. **Database (single transaction)**  
   If validation passes, all questions (plus their options, correct-answer rows, and the assessment **`total_points`** update) are written inside **one** Prisma transaction. If anything fails during that write (constraint, unexpected error, etc.), the transaction **rolls back** — the assessment is left as if the bulk upload never ran (no half-imported batch).

Same **single-transaction** behaviour applies to **`POST /teachers-assessments/:id/questions`** (JSON batch add) when adding multiple questions in one request.

There are **two** endpoints (with global prefix **`/api/v1`**):

| Step | Method | Path |
|------|--------|------|
| Download template | `GET` | `/api/v1/teachers-assessments/:id/bulk-questions/template` |
| Upload filled file | `POST` | `/api/v1/teachers-assessments/:id/bulk-questions/upload` |

### When to show this in the UI

- Show an **“Import from Excel”** (or **“Bulk upload”**) entry on the **assessment questions** screen when:
  - the teacher can edit that assessment, and
  - **`status` is not `PUBLISHED` or `ACTIVE`** (same gate as section 6 — if “Add question” is disabled, hide or disable bulk import too).
- Optional copy: explain that **images are not supported** in the spreadsheet (teachers can add images later via section 7 / 9).

### 12a. Download template

**Endpoint:** `GET /teachers-assessments/:id/bulk-questions/template`

**Path param:** `id` — assessment id (used for **access control**; the file content is generic).

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response:** binary Excel (not JSON).

| Item | Value |
|------|--------|
| Content-Type | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Content-Disposition | `attachment; filename="teacher-assessment-bulk-questions-template.xlsx"` (browsers usually use this as the default save name) |

**Workbook behaviour (for UI copy / support docs):**

| Sheet | Purpose |
|-------|---------|
| **Questions** | Row 1 uses **plain-English** column titles (see § “Column reference”). Headers are **locked** (worksheet protected, **no password**). Rows **2–5000** are for data. **Frozen** header. **Dropdown:** **Question type** only. **Validation:** **Points** (whole number 0–1000 or blank); **Correct answer date** (date or blank). **Up to four** options (**Option 1**–**Option 4**). **No difficulty or explanation columns** — backend stores **EASY** for every bulk-imported question. |
| **How_to_use** | Read-only instructions (protected). Teachers can select/copy text; they should not need to unprotect. |
| **\_Lists** | **Very hidden** — holds allowed values for dropdowns. Teachers do not see this tab; warn support **not to delete** it or dropdowns break. |

**Compatibility note:** Microsoft Excel applies protection and validation as intended. **Google Sheets**, **Numbers**, or “Save as CSV” may drop protection/dropdowns — recommend **Excel** or **Excel-compatible** editors for the canonical template.

**UI behaviour:**
- Trigger download with `fetch`/`axios` **`responseType: 'blob'`** (or open in a new window only if your auth layer supports it — prefer blob + programmatic save for Bearer tokens).
- Suggested button label: **“Download Excel template”**.

**Error responses:** `400` (invalid auth context), `403` (subject not taught), `404` (assessment not found), `401` if unauthenticated.

---

### 12b. Upload filled workbook

**Endpoint:** `POST /teachers-assessments/:id/bulk-questions/upload`

**Path param:** `id` — assessment id.

**Headers:**
- `Authorization: Bearer <token>`
- Do **not** set `Content-Type` manually when using `FormData` — the client must send **`multipart/form-data`** with a boundary.

**Body:** `multipart/form-data` with one part:
| Field | Type | Required |
|-------|------|----------|
| `excel_file` | file (`.xlsx` or `.xls`) | yes |

**Constraints (for UI hints):**
- Max file size **15 MB**.
- Allowed types: standard Excel MIME types (`.xlsx` / `.xls`).

**UI behaviour:**
- File picker: `accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"` (adjust for your platform).
- Show **progress / loading** while uploading; large files may take several seconds.
- On success, **refresh** the questions list (same data as after section 6 — new questions appear in order).

**Success response:** Same wrapper as other endpoints (`success`, `message`, `data`, `statusCode`). `data` matches **section 6** success (`assessment_id`, `questions_added`, `total_questions`, `questions`) **plus**:
```json
{
  "bulk_rows_parsed": 120,
  "bulk_rows_skipped_empty": 3
}
```
- **`bulk_rows_parsed`**: number of non-empty question rows that were imported in this request.
- **`bulk_rows_skipped_empty`**: rows skipped because **Question text** was empty (e.g. blank rows at the bottom of the sheet).

**Error responses:**
- `400` — bad file type, unreadable workbook, no data sheet, or **validation failed** (see below).
- `403` / `404` — same as section 6.

**Validation failure (`400`) — important for UI**

When row validation fails, the API returns a structured payload (shape may be nested depending on your HTTP client and global exception filter). Handle **`data.errors`**: an array of:

```json
{
  "row": 14,
  "message": "MULTIPLE_CHOICE_SINGLE requires exactly one correct option index."
}
```

- **`row`** is the **Excel row number** (row `2` = first data row under the header).
- Show a **table or list** of row + message so the user can fix the sheet and re-upload.

Example body fragment:

```json
{
  "success": false,
  "message": "Bulk upload validation failed. Fix the listed rows and try again.",
  "data": {
    "errors": [
      { "row": 5, "message": "Need at least two options for this question type." },
      { "row": 14, "message": "correct_answer_text is required for this question type." }
    ],
    "rows_skipped_empty": 2
  },
  "statusCode": 400
}
```

---

### Workbook structure

| Sheet | Purpose |
|-------|---------|
| **Questions** | Header row + data rows (preferred name; if renamed, the server uses the **first sheet**). |
| **How_to_use** | Human-readable column guide (safe to hide from users; do not delete on the template). |

Keep the **downloaded** header row wording when possible. The API accepts the template titles and also **legacy** snake_case headers (`question_text`, etc.) if someone merges old sheets.

### Column reference (`Questions` sheet)

| Excel column title | Required | Description |
|--------------------|----------|-------------|
| **Question text** | Yes | Question stem (plain text). |
| **Question type** | Yes | Dropdown / one of bulk-supported `QuestionType` values (e.g. `MULTIPLE_CHOICE_SINGLE`). |
| **Points** | No | Defaults to **1** if empty. |
| **Option 1** … **Option 4** | For MCQ / TRUE_FALSE | Up to four answers, left to right; unused cells blank. More than four options: use the app or JSON. |
| **Correct option indices** | For MCQ / TRUE_FALSE | **1-based** (1–4), e.g. `2` or `1,3`. **`A`–`D`** = options 1–4. **TRUE_FALSE** with blank options: **`TRUE`** / **`FALSE`** or `1` / `2`. |
| **Correct answer text** | For text types | `SHORT_ANSWER`, `LONG_ANSWER`, `FILL_IN_BLANK`. |
| **Correct answer number** | For `NUMERIC` | Numeric correct value. |
| **Correct answer date** | For `DATE` | Date (validated in Excel when using the template). |

**Not in the template:** difficulty and explanation. **All** bulk-imported questions are stored with **`difficulty_level`: EASY**. Add explanations later in the app if needed.

### Supported `question_type` values in bulk import

| Supported | Notes |
|-----------|--------|
| `MULTIPLE_CHOICE_SINGLE` | Exactly **one** correct index. |
| `MULTIPLE_CHOICE_MULTIPLE` | At least one correct index. |
| `TRUE_FALSE` | Use **Option 1** / **Option 2**, or leave all four option cells blank — server uses **True** / **False**. |
| `SHORT_ANSWER`, `LONG_ANSWER`, `FILL_IN_BLANK` | Use `correct_answer_text`. |
| `NUMERIC` | Use `correct_answer_number`. |
| `DATE` | Use `correct_answer_date`. |

**Not supported** in bulk (row error if used): `MATCHING`, `ORDERING`, `FILE_UPLOAD`, `RATING_SCALE`.

### Frontend implementation checklist

1. **Gating:** Hide or disable import when assessment status blocks edits (`PUBLISHED` / `ACTIVE` for question add).
2. **Template:** `GET` template with auth → save blob as `.xlsx`.
3. **Upload:** `FormData` + `append('excel_file', file)` → `POST` upload URL.
4. **Success:** Toast + invalidate/refetch `GET .../questions` (section 4); optionally show counts from `bulk_rows_parsed` / `questions_added`.
5. **Validation errors:** Render `data.errors` with **Excel row** numbers; link to help text (“Row numbers match Excel”).
6. **Empty template row:** Teachers can delete sample rows or overwrite them; trailing blank rows are ignored.

---
