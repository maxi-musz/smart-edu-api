# Student Assessments (Student Module) - Frontend API Reference

Base URL: **`/student-assessment`**  
Server global prefix: **`/api/v1`** (so full path is typically **`/api/v1/student-assessment`**)  
Authentication: **Bearer JWT** (school JWT) required on all endpoints.

Audience: Students can list available assessments, open assessment details, fetch questions to take an assessment, submit answers (with auto-grading for supported types), and view graded attempts when the school allows it.

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

(`statusCode` may be added by your HTTP layer or omitted depending on global interceptors; always use `success` and `data`.)

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

Some errors return extra fields in `data` (see endpoint sections). Always handle `success === false`.

---

## Table of Contents

1. [List Assessments for Student](#1-list-assessments-for-student)
2. [Get Assessment by ID (Student View)](#2-get-assessment-by-id-student-view)
3. [Get Questions for Taking Assessment](#3-get-questions-for-taking-assessment)
4. [Submit Assessment Answers](#4-submit-assessment-answers)
5. [View Graded Answers](#5-view-graded-answers)

---

## Access Rules (Applies to All Endpoints)

- You must be authenticated with a **student** role (`JwtGuard`). Non-students receive access denied.
- Assessments are scoped to the **current academic session** and to **subjects linked to the student’s class** (for list, details, questions, and graded answers).
- Students only see assessments that are **published** (`is_published: true`) and whose status is **`PUBLISHED`**, **`ACTIVE`**, or **`CLOSED`** (list/detail/answers paths).
- Students **cannot** create, update, duplicate, or manage questions or assessment metadata via this module.
- **Taking** an assessment (questions + submit) requires the assessment to be in a state that allows it: **`PUBLISHED` or `ACTIVE`**, not before `start_date`, not after `end_date`, and **under max attempts** (see endpoint 3 and 4).
- **Viewing graded answers** (`GET /:id/answers`) requires **`student_can_view_grading === true`** on the assessment.

---

## Enums Used in Query Params / Payload

### `status` (assessment status)

- `DRAFT`
- `PUBLISHED`
- `ACTIVE`
- `CLOSED`
- `ARCHIVED`

Student listing uses published assessments in `PUBLISHED` / `ACTIVE` / `CLOSED`. When **`is_result_released`** is true, list/detail may expose the row as **`CLOSED`** for display (`displayStatus`).

### `term` (academic term — appears inside `general_info.current_session` context elsewhere in the app)

- `first`
- `second`
- `third`

### `question_type`

- `MULTIPLE_CHOICE` / `MULTIPLE_CHOICE_SINGLE`
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
- `ESSAY` (used in grading paths in this service)

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

### `submission_status` (optional on submit body)

- `COMPLETED`
- `TIMED_OUT`
- `AUTO_SUBMITTED`

### Attempt `status` (in submissions / latest attempt)

- `NOT_STARTED`
- `IN_PROGRESS`
- `SUBMITTED`
- `GRADED`
- `EXPIRED`

---

## Request Object Shapes

### Submit assessment: `SubmitAssessmentDto`

```ts
{
  answers: Array<{
    question_id: string
    question_type?: string
    selected_options?: string[]  // option IDs
    answer?: string               // single option ID; normalized to selected_options
    text_answer?: string          // fill-in, numeric, date, essay, etc.
  }>
  submission_time?: string        // ISO 8601
  time_taken?: number             // seconds
  total_questions?: number
  questions_answered?: number
  questions_skipped?: number
  total_points_possible?: number
  total_points_earned?: number
  submission_status?: string
  device_info?: {
    device_type?: string
    os?: string
    app_version?: string
    browser?: string
  }
}
```

---

## Common Identifiers

- `assessmentId`: assessment UUID (path `:id`)
- `question_id`, option `id`: UUID strings
- `subject_id`: subject UUID (query filter)

---

## 1. List Assessments for Student

Fetch paginated assessments for the authenticated student with filters. Includes pagination, active filters echo, current session summary, per-subject stats, flat assessment list, and assessments grouped by `assessment_type` + `status`.

Endpoint: `GET /student-assessment`

Headers:

```json
{
  "Authorization": "Bearer <token>"
}
```

Query params:

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | number | No | `1` | Page number (min: 1) |
| `limit` | number | No | `10` | Page size (min: 1, max: 100) |
| `search` | string | No | - | Search in title or description (case-insensitive) |
| `assessmentType` | string | No | - | Filter; use `all` or omit for no filter |
| `status` | string | No | - | Filter; use `all` or omit for no filter |
| `subject_id` | string | No | - | Limit to one subject (must be in the student’s class) |

Success Response (200):

```json
{
  "success": true,
  "message": "Assessments fetched successfully",
  "statusCode": 200,
  "data": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 24,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "search": "",
      "assessment_type": "all",
      "status": "all",
      "subject_id": "all"
    },
    "general_info": {
      "current_session": {
        "academic_year": "2025/2026",
        "term": "second"
      }
    },
    "subjects": [
      {
        "id": "subject-uuid",
        "name": "Mathematics",
        "code": "MTH",
        "color": "#3B82F6",
        "description": "Core mathematics",
        "assessment_stats": {
          "total_assessments": 8,
          "attempted": 3,
          "completed": 2,
          "not_attempted": 5
        }
      }
    ],
    "assessments": [
      {
        "id": "assessment-uuid",
        "title": "Algebra Quiz",
        "description": "Week 3 formative",
        "assessment_type": "QUIZ",
        "status": "ACTIVE",
        "duration": 45,
        "total_points": 50,
        "can_edit_assessment": false,
        "is_result_released": false,
        "max_attempts": 2,
        "passing_score": 50,
        "questions_count": 10,
        "subject": {
          "id": "subject-uuid",
          "name": "Mathematics",
          "code": "MTH",
          "color": "#3B82F6"
        },
        "teacher": {
          "id": "teacher-uuid",
          "name": "Jane Doe"
        },
        "due_date": "2026-04-01T23:59:59.000Z",
        "created_at": "2026-03-01T10:00:00.000Z",
        "is_published": true,
        "shuffle_questions": false,
        "shuffle_options": true,
        "submissions": {
          "total_submissions": 120,
          "recent_submissions": [],
          "student_counts": {}
        },
        "student_attempts": {
          "total_attempts": 1,
          "remaining_attempts": 1,
          "has_reached_max": false,
          "latest_attempt": {
            "id": "attempt-uuid",
            "attempt_number": 1,
            "status": "GRADED",
            "total_score": 40,
            "percentage": 80,
            "passed": true,
            "submitted_at": "2026-03-15T14:00:00.000Z"
          }
        },
        "student_can_view_grading": true,
        "performance_summary": {
          "highest_score": 40,
          "highest_percentage": 80,
          "overall_achievable_mark": 50,
          "best_attempt": {
            "id": "attempt-uuid",
            "attempt_number": 1,
            "status": "GRADED",
            "total_score": 40,
            "percentage": 80,
            "passed": true,
            "submitted_at": "2026-03-15T14:00:00.000Z",
            "max_score": 50
          }
        },
        "_count": { "questions": 10 }
      }
    ],
    "grouped_assessments": [
      {
        "assessment_type": "QUIZ",
        "status": "ACTIVE",
        "count": 2,
        "assessments": []
      }
    ]
  }
}
```

Each `grouped_assessments[]` entry’s `assessments` array contains the same formatted assessment objects as in `data.assessments`, grouped by `assessment_type` and displayed `status`.

**Note:** If `student_can_view_grading` is false, `passing_score`, score fields inside `latest_attempt`, and `performance_summary` are suppressed (e.g. `passing_score: null`, `total_score` / `percentage` / `passed` on `latest_attempt` as `null`, `performance_summary: null`).

Error responses (typical `success: false`):

| Message | Typical cause |
|---|---|
| `User not found` | Invalid JWT subject |
| `Access denied. Student role required.` | Not a student |
| `Student not found` | No student row for user |
| `No current academic session found` | School has no current session |
| `Student class not found` | Missing/invalid class |
| `Failed to fetch assessments` | Unexpected server error |

Example error:

```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null,
  "statusCode": 400
}
```

---

## 2. Get Assessment by ID (Student View)

Return metadata for one assessment: subject, teacher, attempt summary, whether grading can be viewed, and question count. Does **not** include full question list.

Endpoint: `GET /student-assessment/:id`

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
    "id": "assessment-uuid",
    "title": "Algebra Quiz",
    "description": "Week 3 formative",
    "assessment_type": "QUIZ",
    "status": "ACTIVE",
    "duration": 45,
    "total_points": 50,
    "max_attempts": 2,
    "passing_score": 50,
    "instructions": "Answer all questions. No calculators.",
    "can_edit_assessment": false,
    "is_result_released": false,
    "is_published": true,
    "shuffle_questions": false,
    "shuffle_options": true,
    "questions_count": 10,
    "subject": {
      "id": "subject-uuid",
      "name": "Mathematics",
      "code": "MTH",
      "color": "#3B82F6"
    },
    "teacher": {
      "id": "teacher-uuid",
      "name": "Jane Doe"
    },
    "start_date": "2026-03-01T00:00:00.000Z",
    "end_date": "2026-04-01T23:59:59.000Z",
    "created_at": "2026-03-01T10:00:00.000Z",
    "student_attempts": {
      "total_attempts": 0,
      "remaining_attempts": 2,
      "has_reached_max": false,
      "latest_attempt": null
    },
    "student_can_view_grading": true,
    "performance_summary": {
      "highest_score": 0,
      "highest_percentage": 0,
      "overall_achievable_mark": 50,
      "best_attempt": null
    }
  }
}
```

Error responses:

| Message | Meaning |
|---|---|
| Same as list for auth/session/class | Context resolution failed |
| `Assessment not found or access denied` | Wrong id, wrong session, not in class subjects, or not visible status |

Example:

```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "data": null,
  "statusCode": 404
}
```

---

## 3. Get Questions for Taking Assessment

Load questions and **options** plus **`correct_answers`** (option id sets) for the client to render and validate client-side before submit. Server still re-grades on submit.

Endpoint: `GET /student-assessment/:id/questions`

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
  "message": "Assessment questions retrieved successfully",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "Algebra Quiz",
      "description": "Week 3 formative",
      "assessment_type": "QUIZ",
      "status": "ACTIVE",
      "duration": 45,
      "total_points": 50,
      "max_attempts": 2,
      "passing_score": 50,
      "instructions": "Answer all questions.",
      "subject": {
        "id": "subject-uuid",
        "name": "Mathematics",
        "code": "MTH",
        "color": "#3B82F6"
      },
      "teacher": {
        "id": "teacher-uuid",
        "name": "Jane Doe"
      },
      "start_date": "2026-03-01T00:00:00.000Z",
      "end_date": "2026-04-01T23:59:59.000Z",
      "created_at": "2026-03-01T10:00:00.000Z",
      "is_published": true,
      "shuffle_questions": false,
      "shuffle_options": true,
      "student_attempts": 0,
      "remaining_attempts": 2
    },
    "questions": [
      {
        "id": "question-uuid",
        "question_text": "What is 2 + 2?",
        "question_image": "https://cdn.example.com/q.png",
        "question_type": "MULTIPLE_CHOICE_SINGLE",
        "points": 5,
        "order": 1,
        "explanation": null,
        "options": [
          {
            "id": "opt-a",
            "text": "3",
            "is_correct": false,
            "order": 1
          },
          {
            "id": "opt-b",
            "text": "4",
            "is_correct": true,
            "order": 2
          }
        ],
        "correct_answers": [
          {
            "id": "ca-uuid",
            "option_ids": ["opt-b"]
          }
        ]
      }
    ],
    "total_questions": 10,
    "total_points": 50,
    "estimated_duration": 45
  }
}
```

Error responses:

| Message | `data` | Meaning |
|---|---|---|
| `Assessment has not started yet` | `null` | `start_date` is in the future |
| `Assessment has closed` | `{ "assessment_closed": true }` or includes `end_date` | Past `end_date` or status `CLOSED` |
| `Maximum attempts reached for this assessment` | `null` | Attempt count ≥ `max_attempts` |
| `Assessment not found or access denied` | `null` | Id/session/subject mismatch |
| Context errors (not student, no session, etc.) | `null` | Same as list |

Closed / expired example:

```json
{
  "success": false,
  "message": "Assessment has closed",
  "data": {
    "assessment_closed": true,
    "end_date": "2026-03-10T23:59:59.000Z"
  },
  "statusCode": 400
}
```

---

## 4. Submit Assessment Answers

Persist one graded attempt. Auto-grading covers **`MULTIPLE_CHOICE` / `MULTIPLE_CHOICE_SINGLE`**, **`TRUE_FALSE`**, **`FILL_IN_BLANK`**, **`NUMERIC`**, **`DATE`** (and related paths in `checkAnswerByType`). Other types may score via fallback logic or zero until manually graded elsewhere.

Endpoint: `POST /student-assessment/:id/submit`

Path param:

- `id`: assessment id

Headers:

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

Body example:

```json
{
  "answers": [
    {
      "question_id": "question-uuid-1",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "selected_options": ["opt-b"]
    },
    {
      "question_id": "question-uuid-2",
      "question_type": "TRUE_FALSE",
      "answer": "opt-true-id"
    },
    {
      "question_id": "question-uuid-3",
      "question_type": "FILL_IN_BLANK",
      "text_answer": "photosynthesis"
    },
    {
      "question_id": "question-uuid-4",
      "question_type": "NUMERIC",
      "text_answer": "3.14"
    },
    {
      "question_id": "question-uuid-5",
      "question_type": "DATE",
      "text_answer": "2026-03-20T00:00:00.000Z"
    }
  ],
  "submission_time": "2026-03-20T15:00:00.000Z",
  "time_taken": 1800,
  "total_questions": 10,
  "questions_answered": 10,
  "questions_skipped": 0,
  "total_points_possible": 50,
  "total_points_earned": 45,
  "submission_status": "COMPLETED",
  "device_info": {
    "device_type": "mobile",
    "os": "iOS 17.2",
    "app_version": "2.5.0",
    "browser": "Safari"
  }
}
```

Success Response (200 or 201 depending on deployment; treat as success when `success: true`):

```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "statusCode": 200,
  "data": {
    "attempt_id": "attempt-uuid",
    "assessment_id": "assessment-uuid",
    "student_id": "user-uuid",
    "total_score": 45,
    "total_points": 50,
    "percentage_score": 90,
    "passed": true,
    "grade": "A",
    "answers": [
      {
        "question_id": "question-uuid-1",
        "question_type": "MULTIPLE_CHOICE_SINGLE",
        "is_correct": true,
        "points_earned": 5,
        "max_points": 5,
        "selected_options": ["opt-b"],
        "text_answer": null
      }
    ],
    "submission_metadata": {
      "total_questions": 10,
      "questions_answered": 10,
      "questions_skipped": 0,
      "total_points_possible": 50,
      "total_points_earned": 45,
      "submission_status": "COMPLETED",
      "device_info": {
        "device_type": "mobile",
        "os": "iOS 17.2",
        "app_version": "2.5.0",
        "browser": "Safari"
      }
    },
    "submitted_at": "2026-03-20T15:00:00.000Z",
    "time_spent": 1800
  }
}
```

**Grading letters** (approximate): A ≥ 80%, B ≥ 70%, C ≥ 60%, D ≥ 50%, E ≥ 40%, else F.

Error responses:

| Message | Meaning |
|---|---|
| `Assessment not found or access denied` | Not published, wrong status, wrong school/session, etc. |
| `Maximum attempts reached for this assessment` | No remaining attempts |
| `Failed to submit assessment` | Server/transaction error |
| Context errors | Not student, no session, etc. |

Example:

```json
{
  "success": false,
  "message": "Maximum attempts reached for this assessment",
  "data": null,
  "statusCode": 400
}
```

---

## 5. View Graded Answers

Return the assessment shell plus **all attempts** for this student with per-question **`user_answer`**, options (with `is_selected`), and **`correct_answers`**. Only available when **`student_can_view_grading`** is enabled on the assessment.

Endpoint: `GET /student-assessment/:id/answers`

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
  "message": "Assessment with answers retrieved successfully",
  "statusCode": 200,
  "data": {
    "assessment": {
      "id": "assessment-uuid",
      "title": "Algebra Quiz",
      "description": "Week 3 formative",
      "assessment_type": "QUIZ",
      "status": "CLOSED",
      "duration": 45,
      "total_points": 50,
      "max_attempts": 2,
      "passing_score": 50,
      "instructions": "Answer all questions.",
      "subject": {
        "id": "subject-uuid",
        "name": "Mathematics",
        "code": "MTH",
        "color": "#3B82F6"
      },
      "teacher": {
        "id": "teacher-uuid",
        "name": "Jane Doe"
      },
      "start_date": "2026-03-01T00:00:00.000Z",
      "end_date": "2026-04-01T23:59:59.000Z",
      "created_at": "2026-03-01T10:00:00.000Z",
      "is_published": true,
      "total_attempts": 1,
      "remaining_attempts": 1
    },
    "submissions": [
      {
        "submission_id": "attempt-uuid",
        "attempt_number": 1,
        "status": "GRADED",
        "total_score": 45,
        "percentage": 90,
        "passed": true,
        "grade_letter": null,
        "time_spent": 1800,
        "started_at": "2026-03-20T14:30:00.000Z",
        "submitted_at": "2026-03-20T15:00:00.000Z",
        "graded_at": "2026-03-20T15:00:01.000Z",
        "is_graded": true,
        "overall_feedback": null,
        "questions": [
          {
            "id": "question-uuid",
            "question_text": "What is 2 + 2?",
            "question_image": "https://cdn.example.com/q.png",
            "question_type": "MULTIPLE_CHOICE_SINGLE",
            "points": 5,
            "order": 1,
            "explanation": null,
            "options": [
              {
                "id": "opt-a",
                "text": "3",
                "is_correct": false,
                "order": 1,
                "is_selected": false
              },
              {
                "id": "opt-b",
                "text": "4",
                "is_correct": true,
                "order": 2,
                "is_selected": true
              }
            ],
            "user_answer": {
              "text_answer": null,
              "numeric_answer": null,
              "date_answer": null,
              "selected_options": [
                {
                  "id": "opt-b",
                  "text": "4",
                  "is_correct": true
                }
              ],
              "is_correct": true,
              "points_earned": 5,
              "answered_at": "2026-03-20T15:00:00.000Z"
            },
            "correct_answers": [
              {
                "id": "ca-uuid",
                "option_ids": ["opt-b"]
              }
            ]
          }
        ],
        "total_questions": 10,
        "questions_answered": 10,
        "questions_correct": 9
      }
    ],
    "total_questions": 10,
    "total_points": 50,
    "estimated_duration": 45,
    "submission_summary": {
      "total_submissions": 1,
      "latest_submission": {
        "submission_id": "attempt-uuid",
        "attempt_number": 1,
        "status": "GRADED",
        "total_score": 45,
        "percentage": 90,
        "passed": true,
        "questions": []
      },
      "best_score": 45,
      "best_percentage": 90,
      "passed_attempts": 1
    }
  }
}
```

`latest_submission` is the full first submission object (same shape as `submissions[0]`, including the complete `questions` array); the snippet above omits nested `questions` for brevity.

Error responses:

| Message | Meaning |
|---|---|
| `Assessment grading is not available for viewing` | `student_can_view_grading` is false |
| `Assessment not found or access denied` | Invalid id or not in student’s subjects / session |
| `Failed to fetch assessment with answers` | Server error |
| Context errors | Not student, no session, etc. |

Example:

```json
{
  "success": false,
  "message": "Assessment grading is not available for viewing",
  "data": null,
  "statusCode": 403
}
```

---

## HTTP status codes

The API may return **200** with `success: false` in the body (common with `ApiResponse`). Do not rely solely on HTTP status; always read **`success`** and **`message`**. Validation errors from Nest may return **400** with a different error shape for malformed JSON or DTO validation failures.
