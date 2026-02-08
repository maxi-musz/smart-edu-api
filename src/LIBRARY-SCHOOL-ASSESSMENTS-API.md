# Library Owner — School Assessments API (Frontend)

**Base URL:** `{host}/api/v1`

All endpoints in this document are for **library owners** managing assessments on behalf of a school. They require **Bearer JWT** (library auth token) and **library owner** (or equivalent) role.

**Base path:** `GET|POST|PATCH|DELETE /api/v1/library/schools/:schoolId/assessments`

The school is always identified by the path parameter **`schoolId`**.

---

## Response format

Success responses follow:

```ts
{
  success: true;
  message: string;
  data?: T;
  length?: number;
  meta?: unknown;
  statusCode: number;
}
```

Error responses (4xx/5xx):

```ts
{
  success: false;
  message: string;
  error?: unknown;
  statusCode: number;
}
```

---

## 1. Create assessment

**`POST /api/v1/library/schools/:schoolId/assessments`**

- **Auth:** Bearer JWT (library)
- **Content-Type:** `application/json`

**Path:**

| Param     | Type   | Description  |
|-----------|--------|--------------|
| `schoolId` | string | School ID (cuid) |

**Request body:** Same shape as teacher create-assessment. All fields of `CreateAssessmentDto` plus optional `created_by_user_id`.

```ts
{
  title: string;                    // required
  subject_id: string;                // required — subject must belong to this school
  topic_id?: string;                 // optional — topic must belong to this school
  description?: string;
  instructions?: string;
  duration?: number;                // minutes, 1–300
  max_attempts?: number;            // 1–10, default 1
  passing_score?: number;           // 0–100, default 50
  total_points?: number;            // default 100
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_correct_answers?: boolean;
  show_feedback?: boolean;
  allow_review?: boolean;
  start_date?: string;              // ISO date-time
  end_date?: string;                // ISO date-time
  time_limit?: number;              // minutes, 1–300
  grading_type?: 'AUTOMATIC' | 'MANUAL' | 'MIXED';
  auto_submit?: boolean;
  tags?: string[];
  assessment_type?: string;         // e.g. 'CBT', 'QUIZ', 'EXAM', etc.
  created_by_user_id?: string;      // optional — user ID to set as creator (e.g. school director); if omitted, backend may use school's first director
}
```

**Response (201):** `data` is the created assessment object (id, title, subject_id, topic_id, school_id, status, created_by, timestamps, etc.).

---

## 2. Get all assessments (by subject)

**`GET /api/v1/library/schools/:schoolId/assessments`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId` — school ID.

**Query:**

| Query             | Type   | Required | Description                          |
|-------------------|--------|----------|--------------------------------------|
| `subject_id`      | string | Yes      | Subject ID (must belong to school)   |
| `status`          | string | No       | Filter by status                     |
| `topic_id`        | string | No       | Filter by topic                      |
| `assessment_type` | string | No       | Filter by type                       |
| `page`            | number | No       | Page for pagination                  |
| `limit`           | number | No       | Items per page                       |

**Response (200):** Success envelope with `data` shape below. Behaviour depends on whether `assessment_type` is provided.

**When `assessment_type` is provided** (e.g. `?assessment_type=CBT`): returns a **paginated list** for that type.

```ts
{
  success: true;
  message: "Assessments retrieved successfully";
  data: {
    pagination: {
      page: number;       // current page (default 1)
      limit: number;     // per page (default 10)
      total: number;    // total items for this type
      totalPages: number;
    };
    assessments: AssessmentItem[];  // array for this type only
    counts: Record<string, number>; // e.g. { CBT: 5, QUIZ: 3 }
  };
  statusCode: number;
}
```

**When `assessment_type` is not provided:** returns **all types grouped by** `assessment_type`.

```ts
{
  success: true;
  message: "Assessments retrieved successfully";
  data: {
    assessments: Record<string, AssessmentItem[]>;  // keys: assessment_type (e.g. "CBT", "QUIZ")
    counts: Record<string, number>;                  // e.g. { CBT: 5, QUIZ: 3, EXAM: 1 }
    total: number;                                   // total across all types
  };
  statusCode: number;
}
```

**`AssessmentItem`** (each item in `assessments` array or in each grouped array):

```ts
{
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  createdAt: string;       // ISO date-time
  updatedAt: string;
  topic_id: string | null;
  order: number;
  academic_session_id: string;
  allow_review: boolean;
  auto_submit: boolean;
  created_by: string;
  end_date: string | null; // ISO date-time
  grading_type: "AUTOMATIC" | "MANUAL" | "MIXED";
  instructions: string | null;
  is_published: boolean;
  is_result_released: boolean;
  max_attempts: number;
  passing_score: number;
  published_at: string | null;
  result_released_at: string | null;
  school_id: string;
  show_correct_answers: boolean;
  show_feedback: boolean;
  shuffle_options: boolean;
  shuffle_questions: boolean;
  start_date: string | null;
  tags: string[];
  time_limit: number | null;
  total_points: number;
  status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "CLOSED" | "ARCHIVED";
  subject_id: string;
  assessment_type: string;  // e.g. "CBT", "QUIZ", "EXAM"
  submissions: unknown | null;
  student_can_view_grading: boolean;
  subject: { id: string; name: string; code: string | null };
  topic: { id: string; title: string } | null;
  _count: { questions: number; attempts: number };
}
```

---

## 3. Get assessment by ID

**`GET /api/v1/library/schools/:schoolId/assessments/:id`**

- **Auth:** Bearer JWT (library)

**Path:**

| Param     | Type   | Description   |
|-----------|--------|---------------|
| `schoolId` | string | School ID     |
| `id`       | string | Assessment ID |

**Response (200):** `data` is the full assessment object.

---

## 4. Update assessment

**`PATCH /api/v1/library/schools/:schoolId/assessments/:id`**

- **Auth:** Bearer JWT (library)
- **Content-Type:** `application/json`

**Path:** `schoolId`, `id` (assessment ID).

**Request body:** Partial assessment fields (same as teacher update). All fields optional.

```ts
{
  title?: string;
  description?: string;
  instructions?: string;
  subject_id?: string;
  topic_id?: string;
  duration?: number;
  max_attempts?: number;
  passing_score?: number;
  total_points?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_correct_answers?: boolean;
  show_feedback?: boolean;
  allow_review?: boolean;
  start_date?: string;
  end_date?: string;
  time_limit?: number;
  grading_type?: 'AUTOMATIC' | 'MANUAL' | 'MIXED';
  auto_submit?: boolean;
  tags?: string[];
  assessment_type?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
}
```

**Response (200):** `data` is the updated assessment.

---

## 5. Delete assessment

**`DELETE /api/v1/library/schools/:schoolId/assessments/:id`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId`, `id` (assessment ID).

**Response (200):** Success message; no body required.

---

## 6. Publish assessment

**`POST /api/v1/library/schools/:schoolId/assessments/:id/publish`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId`, `id` (assessment ID).

**Response (200):** Success message; `data` may contain updated assessment.

---

## 7. Unpublish assessment

**`POST /api/v1/library/schools/:schoolId/assessments/:id/unpublish`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId`, `id` (assessment ID).

**Response (200):** Success message.

---

## 8. Release assessment results

**`POST /api/v1/library/schools/:schoolId/assessments/:id/release-results`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId`, `id` (assessment ID).

**Response (200):** Success message.

---

## 9. Get assessments by topic

**`GET /api/v1/library/schools/:schoolId/assessments/topic/:topicId`**

- **Auth:** Bearer JWT (library)

**Path:**

| Param     | Type   | Description   |
|-----------|--------|---------------|
| `schoolId` | string | School ID     |
| `topicId`  | string | Topic ID      |

**Response (200):** `data` is list of assessments for that topic.

---

## 10. Get assessment attempts

**`GET /api/v1/library/schools/:schoolId/assessments/:id/attempts`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId`, `id` (assessment ID).

**Response (200):** `data` is list of student attempts for this assessment.

---

## 11. Get student submission for assessment

**`GET /api/v1/library/schools/:schoolId/assessments/:id/attempts/:studentId`**

- **Auth:** Bearer JWT (library)

**Path:**

| Param      | Type   | Description        |
|------------|--------|--------------------|
| `schoolId` | string | School ID          |
| `id`       | string | Assessment ID      |
| `studentId`| string | Student record ID  |

**Response (200):** `data` is the submission/attempt for that student.

---

## 12. Get assessment questions

**`GET /api/v1/library/schools/:schoolId/assessments/:id/questions`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId`, `id` (assessment ID).

**Response (200):** `data` is list of questions (with options and correct_answers as applicable).

---

## 13. Add question (no image)

**`POST /api/v1/library/schools/:schoolId/assessments/:id/questions`**

- **Auth:** Bearer JWT (library)
- **Content-Type:** `application/json`

**Path:** `schoolId`, `id` (assessment ID).

**Request body:** Same as teacher create-question.

```ts
{
  question_text: string;            // required
  question_type: string;            // required — e.g. 'MULTIPLE_CHOICE_SINGLE', 'MULTIPLE_CHOICE_MULTIPLE', 'SHORT_ANSWER', 'TRUE_FALSE', etc.
  order?: number;
  points?: number;
  is_required?: boolean;
  time_limit?: number;              // seconds
  image_url?: string;
  image_s3_key?: string;
  audio_url?: string;
  video_url?: string;
  allow_multiple_attempts?: boolean;
  show_hint?: boolean;
  hint_text?: string;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  explanation?: string;
  difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
  options?: Array<{
    option_text: string;
    order: number;
    is_correct: boolean;
    image_url?: string;
    audio_url?: string;
  }>;
  correct_answers?: Array<{
    answer_text?: string;
    answer_number?: number;
    answer_date?: string;
    option_ids?: string[];
    answer_json?: object;
  }>;
}
```

**Response (201):** `data` is the created question (with id, options, correct_answers, etc.).

---

## 14. Add question with image (multipart)

**`POST /api/v1/library/schools/:schoolId/assessments/:id/questions/with-image`**

- **Auth:** Bearer JWT (library)
- **Content-Type:** `multipart/form-data`

**Path:** `schoolId`, `id` (assessment ID).

**Request (form data):**

| Field         | Type   | Required | Description                                  |
|---------------|--------|----------|----------------------------------------------|
| `questionData`| string | Yes      | JSON string of question data (same shape as §13) |
| `image`       | File   | No       | Image file (JPEG, PNG, GIF, WEBP; max 5MB)   |

**Example (JavaScript):**

```js
const formData = new FormData();
formData.append('questionData', JSON.stringify({
  question_text: "What shape is shown in the image?",
  question_type: "MULTIPLE_CHOICE_SINGLE",
  points: 2,
  difficulty_level: "EASY",
  options: [
    { option_text: "Triangle", order: 1, is_correct: true },
    { option_text: "Square", order: 2, is_correct: false }
  ]
}));
formData.append('image', imageFile);

await fetch(`/api/v1/library/schools/${schoolId}/assessments/${assessmentId}/questions/with-image`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${libraryToken}` },
  body: formData
});
```

**Response (201):** `data` is the created question (image URL/key set by backend).

---

## 15. Update question

**`PATCH /api/v1/library/schools/:schoolId/assessments/:assessmentId/questions/:questionId`**

- **Auth:** Bearer JWT (library)
- **Content-Type:** `application/json` or `multipart/form-data` if sending a new image

**Path:**

| Param         | Type   | Description   |
|---------------|--------|---------------|
| `schoolId`    | string | School ID     |
| `assessmentId`| string | Assessment ID |
| `questionId` | string | Question ID   |

**Request body:** Partial question fields (same shape as update-question DTO). All fields optional. If uploading a new image, use multipart with an `image` file field.

```ts
{
  question_text?: string;
  question_type?: string;
  order?: number;
  points?: number;
  is_required?: boolean;
  time_limit?: number;
  image_url?: string;
  audio_url?: string;
  video_url?: string;
  show_hint?: boolean;
  hint_text?: string;
  explanation?: string;
  difficulty_level?: string;
  options?: Array<{ id?: string; option_text: string; order: number; is_correct: boolean; image_url?: string; audio_url?: string }>;
  correct_answers?: Array<{ id?: string; answer_text?: string; answer_number?: number; option_ids?: string[]; answer_json?: object }>;
}
```

**Response (200):** `data` is the updated question.

---

## 16. Delete question image

**`DELETE /api/v1/library/schools/:schoolId/assessments/:assessmentId/questions/:questionId/image`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId`, `assessmentId`, `questionId`.

**Response (200):** Success message; question’s image reference is cleared.

---

## 17. Delete question

**`DELETE /api/v1/library/schools/:schoolId/assessments/:assessmentId/questions/:questionId`**

- **Auth:** Bearer JWT (library)

**Path:** `schoolId`, `assessmentId`, `questionId`.

**Response (200):** Success message.

---

## Summary table

| Method | Path (relative to `/api/v1/library/schools/:schoolId/assessments`) | Description |
|--------|---------------------------------------------------------------------|-------------|
| POST   | `` (base) | Create assessment |
| GET    | `` (base) | Get all (query: `subject_id` required, optional filters) |
| GET    | `/:id` | Get by ID |
| PATCH  | `/:id` | Update assessment |
| DELETE | `/:id` | Delete assessment |
| POST   | `/:id/publish` | Publish |
| POST   | `/:id/unpublish` | Unpublish |
| POST   | `/:id/release-results` | Release results |
| GET    | `/topic/:topicId` | Get by topic |
| GET    | `/:id/attempts` | Get attempts |
| GET    | `/:id/attempts/:studentId` | Get student submission |
| GET    | `/:id/questions` | Get questions |
| POST   | `/:id/questions` | Add question (JSON) |
| POST   | `/:id/questions/with-image` | Add question with image (multipart) |
| PATCH  | `/:assessmentId/questions/:questionId` | Update question |
| DELETE | `/:assessmentId/questions/:questionId/image` | Delete question image |
| DELETE | `/:assessmentId/questions/:questionId` | Delete question |

---

## Notes for frontend

1. **Auth:** Use the **library** JWT (not the school/teacher token). Header: `Authorization: Bearer <library_token>`.
2. **School scope:** Every URL includes `schoolId`; the backend ensures the assessment and related resources belong to that school.
3. **Creator (create assessment):** Optional `created_by_user_id` in the create body lets you attribute the assessment to a school user (e.g. director); if omitted, backend may default to the school’s first director.
4. **Question with image:** Prefer the single-request endpoint `POST .../questions/with-image` (form: `questionData` + `image`) so the backend can create the question and upload the image in one step and avoid orphaned files.
5. **Not available for library:** The teacher-only “upload question image only” (upload image first, then create question with URL) is **not** exposed for library owners; use “add question with image” instead.
