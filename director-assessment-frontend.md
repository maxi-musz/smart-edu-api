# Director Assessments (Director Module) - Frontend API Reference

Base URL: **`/director-assessment`**  
Server global prefix: **`/api/v1`** (so full path is typically **`/api/v1/director-assessment`**)  
Authentication: **Bearer JWT** (school JWT) required on all endpoints.

Audience: School directors/owners can view **all assessments in their school** (no subject restriction), manage metadata (update, duplicate), manage questions and media, and inspect student attempts/submissions. **Assessments are created by teachers** — there is no “create assessment” route on this controller.

---
## IMPORTANT: Response Structure (Success)

Most endpoints return a wrapper object on success:

```json
{
  "success": true,
  "message": "string",
  "data": { "...": "..." },
  "statusCode": 200,
  "length": null,
  "meta": null
}
```

`length` and `meta` may be omitted or populated depending on the handler.

For **`POST`** routes, the **HTTP** response code may be **`201 Created`** (Nest default) even when `data.statusCode` in the JSON body is **`200`** — always rely on `success` and the body payload for app logic.

---
## IMPORTANT: Response Structure (Error)

**Thrown HTTP exceptions** (e.g. `400`, `403`, `404`) typically follow Nest’s exception format (message + statusCode).

**`ResponseHelper.error`** returns:

```json
{
  "success": false,
  "message": "string",
  "error": null,
  "statusCode": 400
}
```

Always handle `success === false` when using helpers that return this shape.

---
## Table of Contents

1. [Dashboard Analytics](#1-dashboard-analytics)
2. [List All Assessments](#2-list-all-assessments)
3. [Get Assessment by ID (Details + Submission Summary)](#3-get-assessment-by-id-details--submission-summary)
4. [Update Assessment (Metadata)](#4-update-assessment-metadata)
5. [Get Assessment Questions (Director Preview)](#5-get-assessment-questions-director-preview)
6. [Duplicate Assessment](#6-duplicate-assessment)
7. [Add Questions (No Images)](#7-add-questions-no-images)
8. [Add Question (With Images)](#8-add-question-with-images)
9. [Update Question (JSON)](#9-update-question-json)
10. [Update Question (With Images)](#10-update-question-with-images)
11. [Delete Question](#11-delete-question)
12. [List Student Attempts](#12-list-student-attempts)
13. [View Student Submission](#13-view-student-submission)

---
## Access Rules (Applies to All Endpoints)

- You must be authenticated with **`school_director`** role (`JwtGuard`). Requests without this role receive **`403`** (`Access denied. Director role required.`).
- Directors can access **any assessment belonging to their `school_id`** — there is **no** “must teach this subject” restriction (unlike the teacher module).
- **Cannot create** new assessments via this module (creation is done by teachers elsewhere).
- Can **update**, **duplicate**, **add / update / delete** questions.
- **Cannot** add, update, or delete questions when the assessment status is **`PUBLISHED`** or **`ACTIVE`** (change status to **`DRAFT`** / allowed demotion first).
- **Updating assessment metadata** while status is **`PUBLISHED`** or **`ACTIVE`** is restricted: only a **status-only** change that **demotes** to **`DRAFT`**, **`CLOSED`**, or **`ARCHIVED`** is allowed until the assessment is editable again; otherwise you get a **`400`** explaining that you must move to **`DRAFT`** first.

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

### Attempt `status` (where applicable)
- `NOT_STARTED`
- `IN_PROGRESS`
- `SUBMITTED`
- `GRADED`
- `EXPIRED`

---
## Request Object Shapes

### Question Object: `QuestionDto` (used in `POST /:id/questions` and multipart `questionData`)

Sub-DTOs: **`QuestionOptionDto`**, **`CorrectAnswerDto`**.

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

  // MCQ / TRUE_FALSE — QuestionOptionDto[]
  options?: Array<{
    option_text: string
    order?: number
    is_correct: boolean
    image_url?: string
    image_s3_key?: string
    imageIndex?: number  // index into multipart optionImages
    audio_url?: string
  }>

  // non-MCQ — CorrectAnswerDto[]
  correct_answers?: Array<{
    answer_text?: string
    answer_number?: number
    answer_date?: string
    answer_json?: any
  }>
}
```

### `DuplicateAssessmentDto`

```json
{
  "new_title": "string (3–200 chars, required)",
  "shuffle_questions": "boolean (optional)",
  "shuffle_options": "boolean (optional)",
  "new_description": "string (optional, max 2000)"
}
```

### `AddQuestionsDto`

```json
{
  "questions": [ { "...QuestionDto...": true } ]
}
```

`questions` must have **at least one** item.

### `UpdateAssessmentDto`

Extends **`PartialType(CreateAssessmentDto)`** plus director-only fields. All fields optional (PATCH semantics).

**From `CreateAssessmentDto` (optional on update):**

| Field | Type | Notes |
|---|---|---|
| `title` | string | |
| `description` | string | |
| `instructions` | string | |
| `subject_id` | string | Must exist in **this school** (director is not limited to a subset of subjects) |
| `topic_id` | string | Must belong to the effective subject |
| `duration` | number | 1–300 (minutes) |
| `max_attempts` | number | 1–10 |
| `passing_score` | number | 0–100 |
| `total_points` | number | ≥ 1 |
| `shuffle_questions` | boolean | |
| `shuffle_options` | boolean | |
| `show_correct_answers` | boolean | |
| `show_feedback` | boolean | |
| `allow_review` | boolean | |
| `start_date` | string | ISO 8601 |
| `end_date` | string | ISO 8601 |
| `time_limit` | number | 1–300 (minutes) |
| `grading_type` | `AUTOMATIC` \| `MANUAL` \| `MIXED` | |
| `auto_submit` | boolean | |
| `tags` | string[] | |
| `assessment_type` | string | See `assessment_type` enum |

**Additional on `UpdateAssessmentDto`:**

| Field | Type |
|---|---|
| `status` | `DRAFT` \| `PUBLISHED` \| `ACTIVE` \| `CLOSED` \| `ARCHIVED` |
| `is_result_released` | boolean |
| `student_can_view_grading` | boolean |

The service also applies `start_date` / `end_date` when provided and enforces publish rules (e.g. cannot publish with zero questions; future end date when publishing).

### `UpdateQuestionDto` (sub-DTOs: `UpdateQuestionOptionDto`, `UpdateCorrectAnswerDto`)

```ts
{
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

  // Smart merge: update by `id`, create when `id` omitted; options not listed are kept
  options?: UpdateQuestionOptionDto[]

  // When `options` is NOT provided: replaces correct_answers for non-MCQ flows
  correct_answers?: UpdateCorrectAnswerDto[]
}
```

**`UpdateQuestionOptionDto`:**

```ts
{
  id?: string
  option_text?: string
  order?: number
  is_correct?: boolean
  image_url?: string
  image_s3_key?: string
  audio_url?: string
}
```

**`UpdateCorrectAnswerDto`:**

```ts
{
  id?: string
  answer_text?: string
  answer_number?: number
  answer_date?: string
  answer_json?: any
}
```

---
## Common Identifiers

- `assessmentId` / `id`: assessment UUID
- `questionId`: question UUID
- `studentId`: **student record id** (not necessarily `user_id`)
- `subject_id`, `topic_id`, `academic_session_id`: UUID strings

---
## 1. Dashboard Analytics

Returns academic sessions, subjects (with per-type assessment counts), classes, and assessments **grouped by `assessment_type`**, plus pagination for the assessment list slice.

Endpoint: **`GET /director-assessment/dashboard`**

Headers:
```json
{
  "Authorization": "Bearer <token>"
}
```

Query params:

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | number | No | `1` | Page index |
| `limit` | number | No | `10` | Page size |
| `status` | enum | No | - | Same as assessment `status` |
| `assessment_type` | enum | No | - | Filter by type |
| `subject_id` | string | No | - | Limit assessments to a subject |
| `class_id` | string | No | - | Restricts assessments to subjects linked to this class |

Success Response (200):
```json
{
  "success": true,
  "message": "Assessment dashboard retrieved successfully",
  "statusCode": 200,
  "data": {
    "academic_sessions": [
      {
        "id": "session-uuid",
        "academic_year": "string",
        "term": "first",
        "start_date": "2026-01-01T00:00:00.000Z",
        "end_date": "2026-03-31T23:59:59.000Z",
        "status": "active",
        "is_current": true,
        "_count": { "assessments": 0 }
      }
    ],
    "subjects": [
      {
        "id": "subject-uuid",
        "name": "string",
        "code": "string",
        "color": "string or null",
        "description": "string or null",
        "class": { "id": "class-uuid", "name": "string" },
        "academic_session": { "id": "session-uuid", "academic_year": "string", "term": "first", "is_current": true },
        "teachers_in_charge": [
          {
            "id": "teacher-uuid",
            "first_name": "string",
            "last_name": "string",
            "email": "string",
            "display_picture": "string or null"
          }
        ],
        "student_count": 0,
        "total_assessments": 0,
        "total_topics": 0,
        "assessment_counts": {
          "CBT": 0,
          "EXAM": 0,
          "ASSIGNMENT": 0,
          "QUIZ": 0,
          "TEST": 0,
          "FORMATIVE": 0,
          "SUMMATIVE": 0,
          "OTHER": 0
        },
        "status": "active | inactive"
      }
    ],
    "classes": [
      {
        "id": "class-uuid",
        "name": "string",
        "classTeacher": {
          "id": "teacher-uuid",
          "first_name": "string",
          "last_name": "string",
          "email": "string",
          "display_picture": "string or null"
        },
        "academic_session": { "id": "session-uuid", "academic_year": "string", "term": "first", "is_current": true },
        "student_count": 0,
        "subject_count": 0,
        "schedule_count": 0
      }
    ],
    "assessments": {
      "CBT": [
        {
          "id": "assessment-uuid",
          "title": "string",
          "description": "string or null",
          "assessment_type": "CBT",
          "status": "DRAFT",
          "is_published": false,
          "is_result_released": false,
          "total_points": 100,
          "passing_score": 50,
          "created_at": "2026-01-01T00:00:00.000Z",
          "updated_at": "2026-01-01T00:00:00.000Z",
          "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
          "topic": { "id": "topic-uuid", "title": "string" },
          "created_by": { "id": "user-uuid", "first_name": "string", "last_name": "string", "email": "string" },
          "question_count": 0,
          "attempt_count": 0
        }
      ]
    },
    "assessment_counts": {
      "CBT": 0,
      "QUIZ": 0
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 0,
      "totalPages": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

Error Responses:
- **`403`** — Not a director
- **`500`** — `ResponseHelper.error` (e.g. unexpected failure; message explains)

Example `ResponseHelper.error` (500):
```json
{
  "success": false,
  "message": "Failed to retrieve dashboard: ...",
  "error": null,
  "statusCode": 500
}
```

---
## 2. List All Assessments

Endpoint: **`GET /director-assessment`**

Query: **`GetAssessmentsQueryDto`**

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | number | No | `1` | Min 1 |
| `limit` | number | No | `20` | 1–100 |
| `search` | string | No | - | Title/description (case-insensitive) |
| `academic_session_id` | string | No | current | Defaults to **current** session for the school |
| `term` | enum | No | - | `first` / `second` / `third` (used when resolving session) |
| `subject_id` | string | No | - | Optional filter (director still has global access) |
| `topic_id` | string | No | - | |
| `status` | enum | No | - | Assessment status |
| `assessment_type` | enum | No | - | |
| `is_published` | boolean | No | - | Query string `true`/`false` coerced |
| `created_by` | string | No | - | Filter by creator user id (e.g. teacher) |
| `sort_by` | string | No | `createdAt` | `createdAt` / `title` / `start_date` / `end_date` / `status` |
| `sort_order` | string | No | `desc` | `asc` or `desc` |

Headers:
```json
{ "Authorization": "Bearer <token>" }
```

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
        "id": "session-uuid",
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
        "created_by": "creator-user-uuid",
        "end_date": "2026-02-01T00:00:00.000Z",
        "grading_type": "AUTOMATIC",
        "instructions": "string or null",
        "is_published": false,
        "is_result_released": false,
        "max_attempts": 1,
        "passing_score": 50,
        "can_edit_assessment": true,
        "published_at": null,
        "result_released_at": null,
        "school_id": "school-uuid",
        "show_correct_answers": false,
        "show_feedback": true,
        "shuffle_options": false,
        "shuffle_questions": false,
        "student_completed_assessment": false,
        "start_date": null,
        "tags": [],
        "time_limit": 0,
        "total_points": 100,
        "status": "DRAFT",
        "subject_id": "subject-uuid",
        "assessment_type": "CBT",
        "submissions": {},
        "student_can_view_grading": false,
        "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
        "topic": { "id": "topic-uuid", "title": "string" },
        "createdBy": { "id": "user-uuid", "first_name": "string", "last_name": "string" },
        "_count": { "questions": 0, "attempts": 0 }
      }
    ]
  }
}
```

Error Responses:
- **`400`** — e.g. `Invalid director authentication data`, `No current academic session found`
- **`403`** — Not a director

---
## 3. Get Assessment by ID (Details + Submission Summary)

Endpoint: **`GET /director-assessment/:id`**

Path: `id` — assessment id

Headers:
```json
{ "Authorization": "Bearer <token>" }
```

Success Response (200): Full **`assessment`**, nested **`questions`** (`total` + `items` with options, `correct_answers`, `_count.responses`), and **`submissions`** with **`summary`** (totals, completion rate, classes) and per-student **`students`** rows (aligned with teacher module shape).

```json
{
  "success": true,
  "message": "Assessment details retrieved successfully",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "string",
      "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
      "topic": { "id": "topic-uuid", "title": "string" },
      "createdBy": { "id": "user-uuid", "first_name": "string", "last_name": "string", "email": "string" },
      "academicSession": { "id": "session-uuid", "academic_year": "string", "term": "first" },
      "_count": { "questions": 0, "attempts": 0 }
    },
    "questions": {
      "total": 0,
      "items": []
    },
    "submissions": {
      "summary": {
        "totalStudents": 0,
        "studentsAttempted": 0,
        "studentsNotAttempted": 0,
        "completionRate": 0,
        "classes": [{ "id": "class-uuid", "name": "JSS 1A" }]
      },
      "students": [
        {
          "student": {
            "id": "student-uuid",
            "user_id": "user-uuid",
            "first_name": "string",
            "last_name": "string",
            "email": "string",
            "display_picture": null,
            "class": { "id": "class-uuid", "name": "string" }
          },
          "attempts": [
            {
              "id": "attempt-uuid",
              "attempt_number": 1,
              "status": "SUBMITTED",
              "started_at": "2026-01-01T00:00:00.000Z",
              "submitted_at": "2026-01-01T00:30:00.000Z",
              "time_spent": 1800,
              "total_score": 80,
              "max_score": 100,
              "percentage": 80,
              "passed": true,
              "is_graded": true,
              "graded_at": "2026-01-01T00:35:00.000Z",
              "grade_letter": "A"
            }
          ],
          "totalAttempts": 1,
          "bestScore": 80,
          "passed": true,
          "hasAttempted": true
        }
      ]
    }
  }
}
```

Error Responses:
- **`400`** — Invalid auth payload / no current session
- **`403`** — Not a director
- **`404`** — Assessment not found for this school

---
## 4. Update Assessment (Metadata)

Endpoint: **`PATCH /director-assessment/:id`**

Body: **`UpdateAssessmentDto`**

Headers:
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

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
      "description": null,
      "duration": 30,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "topic_id": null,
      "order": 0,
      "academic_session_id": "session-uuid",
      "allow_review": true,
      "auto_submit": false,
      "created_by": "creator-uuid",
      "end_date": null,
      "grading_type": "AUTOMATIC",
      "instructions": null,
      "is_published": false,
      "is_result_released": false,
      "max_attempts": 1,
      "passing_score": 50,
      "can_edit_assessment": true,
      "published_at": null,
      "result_released_at": null,
      "school_id": "school-uuid",
      "show_correct_answers": false,
      "show_feedback": true,
      "shuffle_options": false,
      "shuffle_questions": false,
      "student_completed_assessment": false,
      "start_date": null,
      "tags": [],
      "time_limit": null,
      "total_points": 100,
      "status": "DRAFT",
      "subject_id": "subject-uuid",
      "assessment_type": "CBT",
      "submissions": {},
      "student_can_view_grading": false,
      "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
      "topic": { "id": "topic-uuid", "title": "string" },
      "createdBy": { "id": "user-uuid", "first_name": "string", "last_name": "string" },
      "_count": { "questions": 10, "attempts": 3 }
    },
    "assessmentContext": "school"
  }
}
```

Error Responses:
- **`400`** — Cannot edit while `PUBLISHED`/`ACTIVE` (except allowed status demotion), validation, publish with no questions, expired end date when publishing, etc.
- **`403`** — Not a director
- **`404`** — Assessment or subject/topic not found

---
## 5. Get Assessment Questions (Director Preview)

Endpoint: **`GET /director-assessment/:id/questions`**

Returns preview-friendly question payloads **including correct answers**.

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
      "description": null,
      "instructions": null,
      "duration": 30,
      "time_limit": null,
      "total_points": 100,
      "max_attempts": 1,
      "passing_score": 50,
      "status": "DRAFT",
      "is_published": false,
      "start_date": null,
      "end_date": null,
      "subject": {
        "id": "subject-uuid",
        "name": "string",
        "code": "string",
        "color": "#3366FF"
      },
      "teacher": {
        "id": "creator-uuid",
        "name": "Jane Teacher"
      },
      "total_attempts": 0
    },
    "questions": [
      {
        "id": "question-uuid",
        "question_text": "string",
        "question_type": "MULTIPLE_CHOICE_SINGLE",
        "points": 1,
        "order": 1,
        "image_url": null,
        "audio_url": null,
        "video_url": null,
        "is_required": true,
        "explanation": null,
        "difficulty_level": "MEDIUM",
        "options": [
          { "id": "option-uuid", "text": "Paris", "is_correct": true, "order": 1 }
        ],
        "correct_answers": [
          { "id": "ca-uuid", "answer_text": null, "option_ids": ["option-uuid"] }
        ]
      }
    ],
    "total_questions": 1,
    "isPreview": true,
    "assessmentContext": "school"
  }
}
```

Error Responses:
- **`400`** — Invalid director auth
- **`403`** — Not a director
- **`404`** — Assessment not found / no access

---
## 6. Duplicate Assessment

Endpoint: **`POST /director-assessment/:id/duplicate`**

Body: **`DuplicateAssessmentDto`**

The new assessment is created in **`DRAFT`** for the **current** academic session; `created_by` is the director’s user id.

Success Response (200) — *JSON `statusCode` is 200 via `ResponseHelper.success`*:
```json
{
  "success": true,
  "message": "Assessment duplicated successfully",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "new-assessment-uuid",
      "title": "Mathematics Test - Week 2",
      "description": "string or null",
      "status": "DRAFT",
      "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
      "topic": { "id": "topic-uuid", "title": "string" },
      "createdBy": { "id": "director-user-uuid", "first_name": "string", "last_name": "string" },
      "_count": { "questions": 5 }
    },
    "source_assessment_id": "original-assessment-uuid",
    "shuffle_applied": {
      "questions": false,
      "options": false
    }
  }
}
```

Error Responses:
- **`400`** — No current academic session / invalid auth
- **`403`** — Not a director
- **`404`** — Assessment not found

---
## 7. Add Questions (No Images)

Endpoint: **`POST /director-assessment/:id/questions`**

Body: **`AddQuestionsDto`**

Blocked when assessment status is **`PUBLISHED`** or **`ACTIVE`**.

Success Response (200):
```json
{
  "success": true,
  "message": "Questions added successfully",
  "statusCode": 200,
  "data": {
    "assessment_id": "assessment-uuid",
    "questions_added": 1,
    "total_questions": 11,
    "questions": [
      {
        "id": "question-uuid",
        "assessment_id": "assessment-uuid",
        "question_text": "What is the capital of France?",
        "question_type": "MULTIPLE_CHOICE_SINGLE",
        "order": 11,
        "points": 1,
        "is_required": true,
        "options": [],
        "correct_answers": []
      }
    ]
  }
}
```

Error Responses:
- **`400`** — Cannot modify published/active assessment; invalid payload
- **`403`** — Not a director
- **`404`** — Assessment not found

---
## 8. Add Question (With Images)

Endpoint: **`POST /director-assessment/:id/questions/with-image`**

Headers: `Authorization`, `Content-Type: multipart/form-data`

**Files**
- `image` (max 1) — question image  
- `optionImages` (max 10) — option images  

**Fields**
- `questionData` (string, **required**) — stringified **`QuestionDto`** JSON  

Mapping: each `optionImages[i]` is applied to the option where `imageIndex === i`.

Image rules: JPEG, PNG, GIF, WEBP; max **5MB** each (enforced in service / controller paths).

Success Response (200): Same **`data` shape as section 7** (batch of one).

Error Responses:
- **`400`** — Invalid JSON, invalid image, or assessment not editable
- **`403`** / **`404`** — As above

---
## 9. Update Question (JSON)

Endpoint: **`PATCH /director-assessment/:id/questions/:questionId`**

Body: **`UpdateQuestionDto`** — smart merge for **`options`** and conditional replacement for **`correct_answers`** when `options` is omitted (non-MCQ flows).

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
      "question_text": "string",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "order": 1,
      "points": 2,
      "options": [],
      "correct_answers": []
    }
  }
}
```

Error Responses:
- **`400`** — e.g. cannot edit in `PUBLISHED`/`ACTIVE`; `options` empty array when provided; invalid option id
- **`403`** — Not a director
- **`404`** — Assessment or question not found

---
## 10. Update Question (With Images)

Endpoint: **`PATCH /director-assessment/:id/questions/:questionId/with-image`**

**Files**
- `newQuestionImage` (max 1)  
- `newOptionImages` (max 10)  

**Fields**
- `questionData` (string, **required**) — stringified **`UpdateQuestionDto`**
- `oldQuestionImageS3Key` (optional) — merged into DTO as `image_s3_key` for delete/replace semantics
- `optionImageUpdates` (optional) — stringified JSON: `[{ "optionId": "uuid", "oldS3Key": "key-or-omit" }]`

Rules:
- If `newOptionImages` is provided with `optionImageUpdates`, **array lengths must match**.
- Controller validates MIME types and 5MB max for uploaded images.

Success Response (200): Same as **section 9**.

---
## 11. Delete Question

Endpoint: **`DELETE /director-assessment/:id/questions/:questionId`**

Blocked for **`PUBLISHED`** / **`ACTIVE`**.

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
- **`400`** — Cannot delete while published/active
- **`403`** — Not a director
- **`404`** — Not found

---
## 12. List Student Attempts

Endpoint: **`GET /director-assessment/:id/attempts`**

Scopes attempts to the **current** academic session and students in classes that take the assessment’s subject.

Success Response (200):
```json
{
  "success": true,
  "message": "Assessment attempts retrieved successfully",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "string",
      "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
      "topic": { "id": "topic-uuid", "title": "string" },
      "totalPoints": 100,
      "passingScore": 50,
      "createdBy": {
        "id": "user-uuid",
        "first_name": "string",
        "last_name": "string",
        "email": "string"
      }
    },
    "statistics": {
      "totalStudents": 40,
      "studentsAttempted": 25,
      "studentsNotAttempted": 15,
      "totalAttempts": 30,
      "averageScore": 72.5,
      "completionRate": 62.5
    },
    "classes": [
      {
        "className": "JSS 1A",
        "totalStudents": 20,
        "studentsAttempted": 12,
        "studentsNotAttempted": 8
      }
    ],
    "students": [
      {
        "studentId": "student-record-uuid",
        "userId": "user-uuid",
        "studentNumber": "STU-001",
        "firstName": "Ada",
        "lastName": "Lovelace",
        "email": "ada@school.test",
        "displayPicture": null,
        "className": "JSS 1A",
        "classId": "class-uuid",
        "hasAttempted": true,
        "attemptCount": 1,
        "latestAttempt": {
          "id": "attempt-uuid",
          "attemptNumber": 1,
          "status": "SUBMITTED",
          "startedAt": "2026-01-01T10:00:00.000Z",
          "submittedAt": "2026-01-01T10:45:00.000Z",
          "timeSpent": 2700,
          "totalScore": 80,
          "maxScore": 100,
          "percentage": 80,
          "passed": true,
          "isGraded": true,
          "gradedAt": "2026-01-01T11:00:00.000Z",
          "gradeLetter": "A",
          "overallFeedback": "Great work",
          "createdAt": "2026-01-01T10:00:00.000Z"
        },
        "allAttempts": []
      }
    ]
  }
}
```

When no classes are linked to the subject, `students` may be empty and counts zero — still **`200`** with a simplified payload.

Error Responses:
- **`403`** — Not a director
- **`404`** — Via `ResponseHelper.error` when assessment or current session is missing (`success: false` in body)
- **`500`** — Wrapped server error

Example `ResponseHelper.error` for missing assessment:
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "error": null,
  "statusCode": 404
}
```

---
## 13. View Student Submission

Endpoint: **`GET /director-assessment/:id/students/:studentId/submission`**

- `studentId` = **student table id** (matches `student.id` in listing responses).

Success Response (200) when the student has attempts:
```json
{
  "success": true,
  "message": "Student submission retrieved successfully",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "string",
      "subject": { "id": "subject-uuid", "name": "string", "code": "string" },
      "topic": { "id": "topic-uuid", "title": "string" },
      "totalPoints": 100,
      "passingScore": 50,
      "createdBy": { "id": "user-uuid", "first_name": "string", "last_name": "string", "email": "string" }
    },
    "student": {
      "id": "student-uuid",
      "userId": "user-uuid",
      "studentNumber": "STU-001",
      "firstName": "Ada",
      "lastName": "Lovelace",
      "email": "ada@school.test",
      "displayPicture": null,
      "className": "JSS 1A",
      "classId": "class-uuid"
    },
    "attempts": [
      {
        "id": "attempt-uuid",
        "attemptNumber": 1,
        "status": "GRADED",
        "startedAt": "2026-01-01T10:00:00.000Z",
        "submittedAt": "2026-01-01T10:45:00.000Z",
        "timeSpent": 2700,
        "totalScore": 80,
        "maxScore": 100,
        "percentage": 80,
        "passed": true,
        "isGraded": true,
        "gradedAt": "2026-01-01T11:00:00.000Z",
        "gradedBy": "grader-user-uuid",
        "gradeLetter": "A",
        "overallFeedback": "Nice job",
        "createdAt": "2026-01-01T10:00:00.000Z",
        "responses": [
          {
            "id": "response-uuid",
            "question": {
              "id": "question-uuid",
              "questionText": "Capital of France?",
              "questionType": "MULTIPLE_CHOICE_SINGLE",
              "points": 1,
              "order": 1,
              "imageUrl": null,
              "options": [
                { "id": "opt-1", "option_text": "Paris", "is_correct": true, "order": 1 }
              ]
            },
            "textAnswer": null,
            "numericAnswer": null,
            "dateAnswer": null,
            "selectedOptions": [
              { "id": "opt-1", "option_text": "Paris", "is_correct": true, "order": 1 }
            ],
            "fileUrls": [],
            "isCorrect": true,
            "pointsEarned": 1,
            "maxPoints": 1,
            "timeSpent": 30,
            "feedback": null,
            "isGraded": true,
            "createdAt": "2026-01-01T10:05:00.000Z"
          }
        ]
      }
    ],
    "hasAttempted": true,
    "attemptCount": 1,
    "latestAttempt": {}
  }
}
```

When the student has **no** attempts, `attempts` is `[]`, `hasAttempted` is `false`, and `latestAttempt` is omitted or `null` depending on branch — still **`200`**.

Error Responses:
- **`403`** — Not a director
- **`404`** — `ResponseHelper.error` for missing assessment, student, or current session

---
## Standard Error Examples (HTTP exceptions)

```json
{
  "statusCode": 403,
  "message": "Access denied. Director role required.",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 400,
  "message": "Cannot add questions to a PUBLISHED assessment. Change the status to DRAFT or CLOSED first.",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 404,
  "message": "Assessment not found",
  "error": "Not Found"
}
```

---

## Key Difference vs Teacher Module

| Topic | Teacher module | Director module |
|---|---|---|
| Scope | Assessments for subjects the teacher teaches | **All assessments in the school** (`school_id`) |
| Create assessment | Yes (teacher flow) | **No** on this controller |
| JWT | Teacher context | **School director** context (`school_director`) |
