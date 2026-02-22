# Assessment Edit API – Frontend Reference

Base URL: **`/api/v1/teachers/assessments`**  
Auth: **Bearer token** (teacher JWT) required on all requests.

---

## 1. Update assessment (metadata)

**Endpoint:** `PATCH /api/v1/teachers/assessments/:id`

**Path param:** `id` – assessment ID.

**Body:** JSON. All fields are **optional**; send only what you want to change.

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Assessment title |
| `description` | string | Description |
| `instructions` | string | Instructions for students |
| `subject_id` | string | Subject ID (must belong to teacher’s school) |
| `topic_id` | string | Topic ID (optional, must belong to subject) |
| `duration` | number | Duration in minutes (1–300) |
| `max_attempts` | number | Max attempts per student (1–10) |
| `passing_score` | number | Passing score % (0–100) |
| `total_points` | number | Total possible points (≥ 1) |
| `shuffle_questions` | boolean | Shuffle question order |
| `shuffle_options` | boolean | Shuffle option order |
| `show_correct_answers` | boolean | Show correct answers after submission |
| `show_feedback` | boolean | Show feedback after submission |
| `allow_review` | boolean | Allow students to review answers |
| `start_date` | string | ISO 8601 date-time (e.g. `2024-01-15T09:00:00Z`) |
| `end_date` | string | ISO 8601 date-time |
| `time_limit` | number | Time limit in minutes (1–300) |
| `grading_type` | string | `AUTOMATIC` \| `MANUAL` \| `MIXED` |
| `auto_submit` | boolean | Auto-submit when time expires |
| `tags` | string[] | Tags for categorisation |
| `assessment_type` | string | One of: `CBT`, `ASSIGNMENT`, `EXAM`, `OTHER`, `FORMATIVE`, `SUMMATIVE`, `DIAGNOSTIC`, `BENCHMARK`, `PRACTICE`, `MOCK_EXAM`, `QUIZ`, `TEST` |
| `status` | string | `DRAFT` \| `PUBLISHED` \| `ACTIVE` \| `CLOSED` \| `ARCHIVED` |

**Example request body:**

```json
{
  "title": "Mathematics Quiz - Chapter 1 (Updated)",
  "description": "Revised algebra concepts",
  "duration": 45,
  "passing_score": 70,
  "start_date": "2024-02-01T08:00:00Z",
  "end_date": "2024-02-15T23:59:59Z",
  "status": "PUBLISHED"
}
```

**Response (200):** `{ success, message, data: { ...assessment } }`

**Errors:** `400` invalid data, `403` forbidden, `404` assessment not found.

---

## 2. Update a question

**Endpoint:** `PATCH /api/v1/teachers/assessments/:assessmentId/questions/:questionId`

**Path params:**  
- `assessmentId` – assessment ID  
- `questionId` – question ID  

**Content-Type:**  
- **`application/json`** – question fields only  
- **`multipart/form-data`** – question fields + optional `image` file for question image  

**Body (all fields optional):**

| Field | Type | Description |
|-------|------|-------------|
| `question_text` | string | Question text |
| `question_type` | string | See [Question types](#question-types) below |
| `order` | number | Order in assessment (≥ 1) |
| `points` | number | Points for this question (≥ 0.1) |
| `is_required` | boolean | Whether question is required |
| `time_limit` | number | Time limit for this question in seconds (≥ 10) |
| `image_url` | string | Image URL (or `null`/`""` to remove image) |
| `audio_url` | string | Audio URL |
| `video_url` | string | Video URL |
| `allow_multiple_attempts` | boolean | Allow multiple attempts for this question |
| `show_hint` | boolean | Show hint |
| `hint_text` | string | Hint text |
| `min_length` | number | Min length for text answers (≥ 1) |
| `max_length` | number | Max length for text answers (≥ 1) |
| `min_value` | number | Min value for numeric answers |
| `max_value` | number | Max value for numeric answers |
| `explanation` | string | Explanation for correct answer |
| `difficulty_level` | string | `EASY` \| `MEDIUM` \| `HARD` \| `EXPERT` |
| `options` | array | **Replaces all options.** See [Option object](#option-object) below |
| `correct_answers` | array | **Replaces all correct answers.** See [Correct answer object](#correct-answer-object) below |

**Question types:**  
`MULTIPLE_CHOICE_SINGLE`, `MULTIPLE_CHOICE_MULTIPLE`, `SHORT_ANSWER`, `LONG_ANSWER`, `TRUE_FALSE`, `FILL_IN_BLANK`, `MATCHING`, `ORDERING`, `FILE_UPLOAD`, `NUMERIC`, `DATE`, `RATING_SCALE`

**Option object (when sending `options`):**

| Field | Type | Required |
|-------|------|----------|
| `id` | string | Optional (for existing options) |
| `option_text` | string | Yes |
| `order` | number | Yes (≥ 1) |
| `is_correct` | boolean | Yes |
| `image_url` | string | No |
| `audio_url` | string | No |

**Correct answer object (when sending `correct_answers`):**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Optional (for existing answers) |
| `answer_text` | string | For text questions |
| `answer_number` | number | For numeric questions |
| `answer_date` | string | ISO date for date questions |
| `option_ids` | string[] | Option IDs for multiple choice |
| `answer_json` | object | For matching/ordering etc. |

**Example JSON body (no image):**

```json
{
  "question_text": "What is the capital of France?",
  "points": 2,
  "explanation": "Paris is the capital and largest city of France.",
  "options": [
    { "option_text": "Paris", "order": 1, "is_correct": true },
    { "option_text": "Lyon", "order": 2, "is_correct": false }
  ],
  "correct_answers": [
    { "option_ids": ["<option-id-of-paris>"] }
  ]
}
```

**Example with image (multipart/form-data):**  
- Send question fields as form fields (e.g. `question_text`, `points`, …).  
- Send `image` as file.  
- If you need to send nested JSON (e.g. `options`, `correct_answers`), stringify and send as a single form field (e.g. `questionData` or the same keys as above depending on backend expectation).

**Response (200):** `{ success, message, data: { question, options, correctAnswers } }`

**Errors:** `400` invalid data or assessment closed/archived, `403` forbidden, `404` assessment or question not found.

**Note:** Questions cannot be edited if the assessment is **CLOSED** or **ARCHIVED**.

---

## 3. Delete question image

**Endpoint:** `DELETE /api/v1/teachers/assessments/:assessmentId/questions/:questionId/image`

Removes the image from the question. No body.

**Response (200):** Success message.

**Errors:** `400` if question has no image or assessment is closed, `403`, `404`.

---

## 4. Delete a question

**Endpoint:** `DELETE /api/v1/teachers/assessments/:assessmentId/questions/:questionId`

Permanently removes the question. No body.

**Response (200):** Success message.

**Errors:** `400` if question has student responses, `403`, `404`.

---

## Quick reference

| Action | Method | Endpoint |
|--------|--------|----------|
| Update assessment | `PATCH` | `/api/v1/teachers/assessments/:id` |
| Update question | `PATCH` | `/api/v1/teachers/assessments/:assessmentId/questions/:questionId` |
| Remove question image | `DELETE` | `/api/v1/teachers/assessments/:assessmentId/questions/:questionId/image` |
| Delete question | `DELETE` | `/api/v1/teachers/assessments/:assessmentId/questions/:questionId` |

All endpoints require **Bearer &lt;teacher JWT&gt;** in the `Authorization` header.
