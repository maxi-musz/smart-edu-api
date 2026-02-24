# Assessment API Documentation

## Get All Assessments

Fetches assessments with pagination, filtering, search, and role-based access control.

### Endpoint

```
GET /assessment
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Role-Based Access

| Role                | Access                                                          |
| ------------------- | --------------------------------------------------------------- |
| **Library Owner**   | All LibraryAssessments in their platform (different table)      |
| **School Director** | All school Assessments in the school                            |
| **School Admin**    | All school Assessments in the school                            |
| **Teacher**         | Only assessments for subjects/topics they teach                 |
| **Student**         | Only published or closed assessments for subjects in their class |

> **Note:** Library owners access `LibraryAssessment` table, while school users access `Assessment` table. The response includes `assessmentContext: 'library'` or `assessmentContext: 'school'` to differentiate.

---

### Query Parameters

| Parameter            | Type    | Required | Default     | Description                                                     |
| -------------------- | ------- | -------- | ----------- | --------------------------------------------------------------- |
| `page`               | number  | No       | `1`         | Page number for pagination (min: 1)                             |
| `limit`              | number  | No       | `20`        | Number of items per page (min: 1, max: 100)                     |
| `search`             | string  | No       | -           | Search term for assessment title or description                 |
| `academic_session_id`| string  | No       | Current     | Filter by academic session ID. Defaults to current active session |
| `term`               | enum    | No       | -           | Filter by academic term: `first`, `second`, `third`             |
| `subject_id`         | string  | No       | -           | Filter by subject ID                                            |
| `topic_id`           | string  | No       | -           | Filter by topic ID                                              |
| `status`             | enum    | No       | -           | Filter by status: `DRAFT`, `PUBLISHED`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `assessment_type`    | enum    | No       | -           | Filter by type: `CBT`, `MANUAL`                                 |
| `is_published`       | boolean | No       | -           | Filter by published state: `true`, `false`                      |
| `created_by`         | string  | No       | -           | Filter by creator user ID (for directors/admins/library owners) |
| `sort_by`            | enum    | No       | `createdAt` | Sort field: `createdAt`, `title`, `start_date`, `end_date`, `status` |
| `sort_order`         | enum    | No       | `desc`      | Sort order: `asc`, `desc`                                       |

> **Library Owner Note:** `academic_session_id` and `term` filters are ignored for library owners since LibraryAssessments are not tied to academic sessions.

---

### Example Request

```bash
GET /assessment?page=1&limit=10&status=PUBLISHED&subject_id=clxyz123&sort_by=createdAt&sort_order=desc
```

---

### Success Response (School Users)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessments fetched successfully",
  "data": {
    "analytics": {
      "all": 25,
      "draft": 10,
      "published": 8,
      "active": 3,
      "closed": 4,
      "archived": 0
    },
    "sessions": [
      {
        "id": "session_abc123",
        "academic_year": "2025/2026",
        "term": "SECOND",
        "start_year": 2025,
        "end_year": 2026,
        "start_date": "2026-01-06T00:00:00.000Z",
        "end_date": "2026-04-15T00:00:00.000Z",
        "is_current": true,
        "status": "active"
      },
      {
        "id": "session_xyz789",
        "academic_year": "2025/2026",
        "term": "FIRST",
        "start_year": 2025,
        "end_year": 2026,
        "start_date": "2025-09-01T00:00:00.000Z",
        "end_date": "2025-12-20T00:00:00.000Z",
        "is_current": false,
        "status": "completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    },
    "assessments": [
      {
        "id": "clxyz123abc",
        "title": "Mathematics Mid-Term Test",
        "description": "Algebra and Geometry assessment",
        "duration": 60,
        "createdAt": "2026-02-20T10:30:00.000Z",
        "updatedAt": "2026-02-21T08:15:00.000Z",
        "topic_id": "topic_abc123",
        "order": 0,
        "academic_session_id": "session_abc123",
        "allow_review": true,
        "auto_submit": true,
        "created_by": "user_xyz789",
        "end_date": "2026-02-25T23:59:59.000Z",
        "grading_type": "AUTOMATIC",
        "instructions": "Answer all questions. No calculators allowed.",
        "is_published": true,
        "is_result_released": false,
        "max_attempts": 1,
        "passing_score": 50.0,
        "can_edit_assessment": true,
        "published_at": "2026-02-21T08:15:00.000Z",
        "result_released_at": null,
        "school_id": "school_abc123",
        "show_correct_answers": false,
        "show_feedback": true,
        "shuffle_options": false,
        "shuffle_questions": false,
        "student_completed_assessment": false,
        "start_date": "2026-02-22T09:00:00.000Z",
        "tags": ["algebra", "geometry", "midterm"],
        "time_limit": 60,
        "total_points": 100.0,
        "status": "PUBLISHED",
        "subject_id": "subject_abc123",
        "assessment_type": "CBT",
        "submissions": null,
        "student_can_view_grading": false,
        "subject": {
          "id": "subject_abc123",
          "name": "Mathematics",
          "code": "MATH101"
        },
        "topic": {
          "id": "topic_abc123",
          "title": "Algebra Fundamentals"
        },
        "createdBy": {
          "id": "user_xyz789",
          "first_name": "John",
          "last_name": "Doe"
        },
        "_count": {
          "questions": 20,
          "attempts": 45
        }
      }
    ]
  }
}
```

---

### Response Fields

#### `analytics`

| Field       | Type   | Description                              |
| ----------- | ------ | ---------------------------------------- |
| `all`       | number | Total count of all assessments           |
| `draft`     | number | Count of assessments with DRAFT status   |
| `published` | number | Count of assessments with PUBLISHED status |
| `active`    | number | Count of assessments with ACTIVE status  |
| `closed`    | number | Count of assessments with CLOSED status  |
| `archived`  | number | Count of assessments with ARCHIVED status |

> **Note:** Analytics counts respect role-based access but ignore any status filter applied.

#### `sessions[]`

Last 5 academic sessions/terms for the school (ordered by most recent first). Useful for filtering assessments by different sessions.

| Field          | Type     | Description                                    |
| -------------- | -------- | ---------------------------------------------- |
| `id`           | string   | Academic session ID                            |
| `academic_year`| string   | Academic year (e.g., "2025/2026")              |
| `term`         | enum     | Academic term: `FIRST`, `SECOND`, `THIRD`      |
| `start_year`   | number   | Starting year of the academic year             |
| `end_year`     | number   | Ending year of the academic year               |
| `start_date`   | datetime | Session start date                             |
| `end_date`     | datetime | Session end date                               |
| `is_current`   | boolean  | Whether this is the current active session     |
| `status`       | enum     | Session status: `active`, `completed`, etc.    |

> **Note:** This field is only returned for school users, not library owners.

#### `pagination`

| Field        | Type   | Description                     |
| ------------ | ------ | ------------------------------- |
| `page`       | number | Current page number             |
| `limit`      | number | Items per page                  |
| `total`      | number | Total number of matching items  |
| `totalPages` | number | Total number of pages           |

#### `assessments[]`

| Field                        | Type           | Nullable | Description                                      |
| ---------------------------- | -------------- | -------- | ------------------------------------------------ |
| `id`                         | string         | No       | Unique assessment ID                             |
| `title`                      | string         | No       | Assessment title                                 |
| `description`                | string         | Yes      | Assessment description                           |
| `duration`                   | number         | Yes      | Duration in minutes                              |
| `createdAt`                  | datetime       | No       | Creation timestamp                               |
| `updatedAt`                  | datetime       | No       | Last update timestamp                            |
| `topic_id`                   | string         | Yes      | Associated topic ID                              |
| `order`                      | number         | No       | Display order                                    |
| `academic_session_id`        | string         | No       | Academic session ID                              |
| `allow_review`               | boolean        | No       | Allow students to review after submission        |
| `auto_submit`                | boolean        | No       | Auto-submit when time expires                    |
| `created_by`                 | string         | No       | Creator user ID                                  |
| `end_date`                   | datetime       | Yes      | Assessment end date/time                         |
| `grading_type`               | enum           | No       | `AUTOMATIC` or `MANUAL`                          |
| `instructions`               | string         | Yes      | Assessment instructions                          |
| `is_published`               | boolean        | No       | Whether assessment is published                  |
| `is_result_released`         | boolean        | No       | Whether results are released to students         |
| `max_attempts`               | number         | No       | Maximum allowed attempts                         |
| `passing_score`              | number         | No       | Minimum passing score (percentage)               |
| `can_edit_assessment`        | boolean        | No       | Whether assessment can still be edited           |
| `published_at`               | datetime       | Yes      | When assessment was published                    |
| `result_released_at`         | datetime       | Yes      | When results were released                       |
| `school_id`                  | string         | No       | School ID                                        |
| `show_correct_answers`       | boolean        | No       | Show correct answers after submission            |
| `show_feedback`              | boolean        | No       | Show feedback after submission                   |
| `shuffle_options`            | boolean        | No       | Randomize answer options                         |
| `shuffle_questions`          | boolean        | No       | Randomize question order                         |
| `student_completed_assessment` | boolean      | No       | Whether any student has completed it             |
| `start_date`                 | datetime       | Yes      | Assessment start date/time                       |
| `tags`                       | string[]       | No       | Assessment tags                                  |
| `time_limit`                 | number         | Yes      | Time limit in minutes                            |
| `total_points`               | number         | No       | Total possible points                            |
| `status`                     | enum           | No       | `DRAFT`, `PUBLISHED`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `subject_id`                 | string         | No       | Subject ID                                       |
| `assessment_type`            | enum           | No       | `CBT` or `MANUAL`                                |
| `submissions`                | json           | Yes      | Submission metadata                              |
| `student_can_view_grading`   | boolean        | No       | Whether students can view grading details        |
| `subject`                    | object         | No       | Subject details (id, name, code)                 |
| `topic`                      | object         | Yes      | Topic details (id, title)                        |
| `createdBy`                  | object         | No       | Creator details (id, first_name, last_name)      |
| `_count.questions`           | number         | No       | Number of questions in assessment                |
| `_count.attempts`            | number         | No       | Number of student attempts                       |

---

### Success Response (Library Owner)

```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": {
    "assessmentContext": "library",
    "analytics": {
      "all": 15,
      "draft": 3,
      "published": 5,
      "active": 4,
      "closed": 2,
      "archived": 1
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2
    },
    "assessments": [
      {
        "id": "lib-assessment-uuid",
        "title": "Library Mathematics Quiz",
        "description": "Basic math concepts",
        "duration": 45,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "topicId": "topic-uuid",
        "order": 1,
        "allowReview": true,
        "autoSubmit": true,
        "createdById": "library-owner-uuid",
        "endDate": "2024-02-15T23:59:59.000Z",
        "gradingType": "AUTOMATIC",
        "instructions": "Complete all questions",
        "isPublished": true,
        "isResultReleased": false,
        "maxAttempts": 3,
        "passingScore": 60,
        "publishedAt": "2024-01-16T08:00:00.000Z",
        "resultReleasedAt": null,
        "platformId": "platform-uuid",
        "showCorrectAnswers": true,
        "showFeedback": true,
        "shuffleOptions": false,
        "shuffleQuestions": false,
        "startDate": "2024-01-20T00:00:00.000Z",
        "tags": ["math", "quiz"],
        "timeLimit": 45,
        "totalPoints": 100,
        "status": "PUBLISHED",
        "subjectId": "subject-uuid",
        "assessmentType": "CBT",
        "studentCanViewGrading": true,
        "subject": {
          "id": "subject-uuid",
          "name": "Mathematics",
          "code": "MATH"
        },
        "topic": {
          "id": "topic-uuid",
          "title": "Algebra Basics"
        },
        "createdBy": {
          "id": "library-owner-uuid",
          "first_name": "John",
          "last_name": "Owner"
        },
        "_count": {
          "questions": 20,
          "attempts": 150
        }
      }
    ]
  }
}
```

> **Note for Library Owner Response:**
> - Uses `platformId` instead of `school_id`
> - Uses `createdById` instead of `created_by`
> - Uses camelCase for most fields (e.g., `topicId`, `subjectId`, `allowReview`)
> - Does not include `academic_session_id` (library assessments are not tied to sessions)
> - Does not include `can_edit_assessment` or `student_completed_assessment` flags

---

### Error Responses

#### 400 Bad Request - No Active Session

```json
{
  "success": false,
  "message": "No current academic session found",
  "statusCode": 400
}
```

#### 400 Bad Request - Student Not Assigned to Class

```json
{
  "success": false,
  "message": "Student is not assigned to any class",
  "statusCode": 400
}
```

#### 400 Bad Request - Invalid Query Parameters

```json
{
  "success": false,
  "message": "Bad Request Exception",
  "statusCode": 400,
  "errors": [
    {
      "field": "status",
      "message": "status must be one of the following values: DRAFT, PUBLISHED, ACTIVE, CLOSED, ARCHIVED"
    }
  ]
}
```

#### 401 Unauthorized - Invalid or Missing Token

```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

#### 404 Not Found - User Not Found

```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

#### 404 Not Found - Teacher Not Found

```json
{
  "success": false,
  "message": "Teacher not found",
  "statusCode": 404
}
```

#### 404 Not Found - Student Not Found

```json
{
  "success": false,
  "message": "Student not found",
  "statusCode": 404
}
```

---

### Notes

1. **Default Behavior:** If no `academic_session_id` is provided, the endpoint returns assessments from the current active academic session.

2. **Student Restrictions:** Students can only see assessments with status `PUBLISHED` or `CLOSED` and `is_published: true`.

3. **Teacher Restrictions:** Teachers only see assessments for subjects they are assigned to teach.

4. **Analytics:** The `analytics` object provides counts by status regardless of the `status` filter applied, giving a complete overview within the user's accessible scope.

5. **Empty Results:** When a teacher has no subjects assigned or a student's class has no subjects, an empty assessments array is returned with zero totals.

---

## Get Assessment Details

Fetches complete assessment details including assessment information, questions, and submission attempts.

### Endpoint

```
GET /assessment/:id
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Path Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `id`      | string | Yes      | Assessment ID  |

---

### Role-Based Access

| Role                | Access                                                                |
| ------------------- | --------------------------------------------------------------------- |
| **Library Owner**   | Full access to all assessments in their platform (LibraryAssessment table) |
| **School Director** | Full access to any assessment in the school                           |
| **School Admin**    | Full access to any assessment in the school                           |
| **Teacher**         | Full access to assessments for subjects they teach                    |
| **Student**         | Limited view: own attempts only, questions without answers (unless allowed) |

---

### Example Request

```bash
GET /assessment/clxyz123abc
```

---

### Success Response (Teacher/Director/Admin)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment details retrieved successfully",
  "data": {
    "assessment": {
      "id": "clxyz123abc",
      "title": "Mathematics Mid-Term Test",
      "description": "Algebra and Geometry assessment",
      "duration": 60,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-21T08:15:00.000Z",
      "topic_id": "topic_abc123",
      "order": 0,
      "academic_session_id": "session_abc123",
      "allow_review": true,
      "auto_submit": true,
      "created_by": "user_xyz789",
      "end_date": "2026-02-25T23:59:59.000Z",
      "grading_type": "AUTOMATIC",
      "instructions": "Answer all questions. No calculators allowed.",
      "is_published": true,
      "is_result_released": false,
      "max_attempts": 1,
      "passing_score": 50.0,
      "can_edit_assessment": false,
      "published_at": "2026-02-21T08:15:00.000Z",
      "result_released_at": null,
      "school_id": "school_abc123",
      "show_correct_answers": false,
      "show_feedback": true,
      "shuffle_options": false,
      "shuffle_questions": false,
      "student_completed_assessment": true,
      "start_date": "2026-02-22T09:00:00.000Z",
      "tags": ["algebra", "geometry", "midterm"],
      "time_limit": 60,
      "total_points": 100.0,
      "status": "PUBLISHED",
      "subject_id": "subject_abc123",
      "assessment_type": "CBT",
      "submissions": null,
      "student_can_view_grading": false,
      "subject": {
        "id": "subject_abc123",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "topic": {
        "id": "topic_abc123",
        "title": "Algebra Fundamentals"
      },
      "createdBy": {
        "id": "user_xyz789",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.com"
      },
      "academicSession": {
        "id": "session_abc123",
        "academic_year": "2025-2026",
        "term": "second"
      },
      "_count": {
        "questions": 20,
        "attempts": 45
      }
    },
    "questions": {
      "total": 20,
      "items": [
        {
          "id": "question_abc123",
          "assessment_id": "clxyz123abc",
          "question_text": "What is the value of x in the equation 2x + 5 = 15?",
          "question_type": "MULTIPLE_CHOICE",
          "points": 5,
          "order": 1,
          "is_required": true,
          "difficulty_level": "MEDIUM",
          "explanation": "Subtract 5 from both sides, then divide by 2.",
          "image_url": null,
          "audio_url": null,
          "video_url": null,
          "createdAt": "2026-02-20T10:35:00.000Z",
          "updatedAt": "2026-02-20T10:35:00.000Z",
          "options": [
            {
              "id": "option_1",
              "question_id": "question_abc123",
              "option_text": "5",
              "is_correct": true,
              "order": 1
            },
            {
              "id": "option_2",
              "question_id": "question_abc123",
              "option_text": "10",
              "is_correct": false,
              "order": 2
            },
            {
              "id": "option_3",
              "question_id": "question_abc123",
              "option_text": "7.5",
              "is_correct": false,
              "order": 3
            },
            {
              "id": "option_4",
              "question_id": "question_abc123",
              "option_text": "3",
              "is_correct": false,
              "order": 4
            }
          ],
          "correct_answers": [
            {
              "id": "correct_1",
              "question_id": "question_abc123",
              "answer_text": "5"
            }
          ],
          "_count": {
            "responses": 45
          }
        }
      ]
    },
    "submissions": {
      "summary": {
        "totalStudents": 50,
        "studentsAttempted": 45,
        "studentsNotAttempted": 5,
        "completionRate": 90,
        "classes": [
          {
            "id": "class_abc123",
            "name": "JSS 2A"
          },
          {
            "id": "class_def456",
            "name": "JSS 2B"
          }
        ]
      },
      "students": [
        {
          "student": {
            "id": "student_abc123",
            "user_id": "user_student_1",
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@student.com",
            "display_picture": null,
            "class": {
              "id": "class_abc123",
              "name": "JSS 2A"
            }
          },
          "attempts": [
            {
              "id": "attempt_abc123",
              "attempt_number": 1,
              "status": "GRADED",
              "started_at": "2026-02-22T09:05:00.000Z",
              "submitted_at": "2026-02-22T09:55:00.000Z",
              "time_spent": 3000,
              "total_score": 85,
              "max_score": 100,
              "percentage": 85,
              "passed": true,
              "is_graded": true,
              "graded_at": "2026-02-22T10:00:00.000Z",
              "grade_letter": "A"
            }
          ],
          "totalAttempts": 1,
          "bestScore": 85,
          "passed": true,
          "hasAttempted": true
        },
        {
          "student": {
            "id": "student_def456",
            "user_id": "user_student_2",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@student.com",
            "display_picture": null,
            "class": {
              "id": "class_abc123",
              "name": "JSS 2A"
            }
          },
          "attempts": [],
          "totalAttempts": 0,
          "bestScore": null,
          "passed": false,
          "hasAttempted": false
        }
      ]
    }
  }
}
```

---

### Success Response (Student)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment details retrieved successfully",
  "data": {
    "assessment": {
      "id": "clxyz123abc",
      "title": "Mathematics Mid-Term Test",
      "description": "Algebra and Geometry assessment",
      "duration": 60,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-21T08:15:00.000Z",
      "topic_id": "topic_abc123",
      "order": 0,
      "academic_session_id": "session_abc123",
      "allow_review": true,
      "auto_submit": true,
      "created_by": "user_xyz789",
      "end_date": "2026-02-25T23:59:59.000Z",
      "grading_type": "AUTOMATIC",
      "instructions": "Answer all questions. No calculators allowed.",
      "is_published": true,
      "is_result_released": false,
      "max_attempts": 2,
      "passing_score": 50.0,
      "can_edit_assessment": false,
      "published_at": "2026-02-21T08:15:00.000Z",
      "result_released_at": null,
      "school_id": "school_abc123",
      "show_correct_answers": false,
      "show_feedback": true,
      "shuffle_options": false,
      "shuffle_questions": false,
      "start_date": "2026-02-22T09:00:00.000Z",
      "tags": ["algebra", "geometry", "midterm"],
      "time_limit": 60,
      "total_points": 100.0,
      "status": "PUBLISHED",
      "subject_id": "subject_abc123",
      "assessment_type": "CBT",
      "student_can_view_grading": false,
      "subject": {
        "id": "subject_abc123",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "topic": {
        "id": "topic_abc123",
        "title": "Algebra Fundamentals"
      },
      "createdBy": {
        "id": "user_xyz789",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.com"
      },
      "academicSession": {
        "id": "session_abc123",
        "academic_year": "2025-2026",
        "term": "second"
      },
      "_count": {
        "questions": 20,
        "attempts": 45
      }
    },
    "questions": {
      "total": 20,
      "items": [
        {
          "id": "question_abc123",
          "assessment_id": "clxyz123abc",
          "question_text": "What is the value of x in the equation 2x + 5 = 15?",
          "question_type": "MULTIPLE_CHOICE",
          "points": 5,
          "order": 1,
          "is_required": true,
          "difficulty_level": "MEDIUM",
          "explanation": null,
          "image_url": null,
          "audio_url": null,
          "video_url": null,
          "createdAt": "2026-02-20T10:35:00.000Z",
          "updatedAt": "2026-02-20T10:35:00.000Z",
          "options": [
            {
              "id": "option_1",
              "option_text": "5",
              "order": 1
            },
            {
              "id": "option_2",
              "option_text": "10",
              "order": 2
            },
            {
              "id": "option_3",
              "option_text": "7.5",
              "order": 3
            },
            {
              "id": "option_4",
              "option_text": "3",
              "order": 4
            }
          ]
        }
      ]
    },
    "myProgress": {
      "totalAttempts": 1,
      "maxAttempts": 2,
      "remainingAttempts": 1,
      "canAttempt": true,
      "bestScore": 75,
      "passed": true,
      "attempts": [
        {
          "id": "attempt_abc123",
          "attempt_number": 1,
          "status": "GRADED",
          "started_at": "2026-02-22T09:05:00.000Z",
          "submitted_at": "2026-02-22T09:55:00.000Z",
          "time_spent": 3000,
          "total_score": 75,
          "max_score": 100,
          "percentage": 75,
          "passed": true,
          "is_graded": true,
          "grade_letter": "B"
        }
      ]
    }
  }
}
```

---

### Success Response (Library Owner)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment details retrieved successfully",
  "data": {
    "assessmentContext": "library",
    "assessment": {
      "id": "lib-assessment-uuid",
      "title": "Library Mathematics Quiz",
      "description": "Basic math concepts for all learners",
      "duration": 45,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "topicId": "topic-uuid",
      "order": 1,
      "allowReview": true,
      "autoSubmit": true,
      "createdById": "library-owner-uuid",
      "endDate": "2024-02-15T23:59:59.000Z",
      "gradingType": "AUTOMATIC",
      "instructions": "Complete all questions",
      "isPublished": true,
      "isResultReleased": false,
      "maxAttempts": 3,
      "passingScore": 60,
      "publishedAt": "2024-01-16T08:00:00.000Z",
      "resultReleasedAt": null,
      "platformId": "platform-uuid",
      "showCorrectAnswers": true,
      "showFeedback": true,
      "shuffleOptions": false,
      "shuffleQuestions": false,
      "startDate": "2024-01-20T00:00:00.000Z",
      "tags": ["math", "quiz"],
      "timeLimit": 45,
      "totalPoints": 100,
      "status": "PUBLISHED",
      "subjectId": "subject-uuid",
      "assessmentType": "CBT",
      "studentCanViewGrading": true,
      "subject": {
        "id": "subject-uuid",
        "name": "Mathematics",
        "code": "MATH"
      },
      "topic": {
        "id": "topic-uuid",
        "title": "Algebra Basics"
      },
      "createdBy": {
        "id": "library-owner-uuid",
        "first_name": "John",
        "last_name": "Owner"
      },
      "_count": {
        "questions": 20,
        "attempts": 150
      }
    },
    "questions": {
      "total": 20,
      "items": [
        {
          "id": "lib-question-uuid",
          "assessmentId": "lib-assessment-uuid",
          "questionText": "What is the value of x in 2x + 5 = 15?",
          "questionType": "MULTIPLE_CHOICE",
          "points": 5,
          "order": 1,
          "isRequired": true,
          "difficultyLevel": "MEDIUM",
          "explanation": "Subtract 5 from both sides, then divide by 2.",
          "imageUrl": null,
          "audioUrl": null,
          "videoUrl": null,
          "createdAt": "2024-01-15T10:35:00.000Z",
          "updatedAt": "2024-01-15T10:35:00.000Z",
          "options": [
            {
              "id": "option-1",
              "questionId": "lib-question-uuid",
              "optionText": "5",
              "isCorrect": true,
              "order": 1
            },
            {
              "id": "option-2",
              "questionId": "lib-question-uuid",
              "optionText": "10",
              "isCorrect": false,
              "order": 2
            }
          ],
          "correctAnswers": [
            {
              "id": "correct-1",
              "questionId": "lib-question-uuid",
              "answerText": "5"
            }
          ]
        }
      ]
    },
    "submissions": {
      "summary": {
        "totalStudents": 100,
        "studentsAttempted": 80,
        "studentsNotAttempted": 20,
        "completionRate": 80
      },
      "students": [
        {
          "user": {
            "id": "lib-user-uuid",
            "first_name": "Jane",
            "last_name": "Learner",
            "email": "jane@example.com",
            "display_picture": null
          },
          "attempts": [
            {
              "id": "attempt-uuid",
              "attemptNumber": 1,
              "status": "GRADED",
              "startedAt": "2024-01-20T10:00:00.000Z",
              "submittedAt": "2024-01-20T10:40:00.000Z",
              "timeSpent": 2400,
              "totalScore": 85,
              "maxScore": 100,
              "percentage": 85,
              "passed": true,
              "isGraded": true,
              "gradedAt": "2024-01-20T10:41:00.000Z",
              "gradeLetter": "A"
            }
          ],
          "totalAttempts": 1,
          "bestScore": 85,
          "passed": true,
          "hasAttempted": true
        }
      ]
    }
  }
}
```

> **Note for Library Owner Response:**
> - Uses camelCase for most fields (e.g., `topicId`, `subjectId`, `questionText`, `isCorrect`)
> - Uses `platformId` instead of `school_id`
> - Uses `createdById` instead of `created_by`
> - Does not include `academic_session_id` or `academicSession` (library assessments are not tied to sessions)
> - Does not include `can_edit_assessment` or `student_completed_assessment` flags
> - `submissions.students` uses `user` instead of `student` (since library users are not traditional students)

---

### Response Fields

#### `assessment`

Complete assessment object (see Get All Assessments for field descriptions).

Additional fields in details response:

| Field             | Type   | Description                                     |
| ----------------- | ------ | ----------------------------------------------- |
| `academicSession` | object | Academic session details (id, academic_year, term) |

#### `questions` (Teacher/Director/Admin)

| Field         | Type   | Description                          |
| ------------- | ------ | ------------------------------------ |
| `total`       | number | Total number of questions            |
| `items`       | array  | Array of question objects            |

**Question Object:**

| Field              | Type     | Nullable | Description                              |
| ------------------ | -------- | -------- | ---------------------------------------- |
| `id`               | string   | No       | Question ID                              |
| `assessment_id`    | string   | No       | Parent assessment ID                     |
| `question_text`    | string   | No       | Question text                            |
| `question_type`    | enum     | No       | `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`, `FILL_BLANK` |
| `points`           | number   | No       | Points for this question                 |
| `order`            | number   | No       | Question order                           |
| `is_required`      | boolean  | No       | Whether question is required             |
| `difficulty_level` | enum     | Yes      | `EASY`, `MEDIUM`, `HARD`                 |
| `explanation`      | string   | Yes      | Explanation for the answer               |
| `image_url`        | string   | Yes      | Image attachment URL                     |
| `audio_url`        | string   | Yes      | Audio attachment URL                     |
| `video_url`        | string   | Yes      | Video attachment URL                     |
| `options`          | array    | No       | Answer options (for multiple choice)     |
| `correct_answers`  | array    | No       | Correct answer(s)                        |
| `_count.responses` | number   | No       | Number of student responses              |

#### `questions` (Student)

Same as above but:
- `options` array does NOT include `is_correct` field (unless `show_correct_answers` is true AND student has submitted)
- `correct_answers` array is NOT included (unless `show_correct_answers` is true AND student has submitted)
- `explanation` is null (unless allowed)

#### `submissions` (Teacher/Director/Admin only)

| Field                           | Type   | Description                          |
| ------------------------------- | ------ | ------------------------------------ |
| `summary.totalStudents`         | number | Total students in classes with this subject |
| `summary.studentsAttempted`     | number | Students who have attempted          |
| `summary.studentsNotAttempted`  | number | Students who haven't attempted       |
| `summary.completionRate`        | number | Percentage of students who attempted |
| `summary.classes`               | array  | Classes linked to this assessment's subject |
| `students`                      | array  | Array of student submission objects  |

**Student Submission Object:**

| Field           | Type    | Description                             |
| --------------- | ------- | --------------------------------------- |
| `student`       | object  | Student info (id, user_id, name, email, class) |
| `attempts`      | array   | Array of attempt objects                |
| `totalAttempts` | number  | Total attempts by this student          |
| `bestScore`     | number  | Best percentage score (null if no attempts) |
| `passed`        | boolean | Whether student passed (based on best attempt) |
| `hasAttempted`  | boolean | Whether student has attempted           |

#### `myProgress` (Student only)

| Field              | Type    | Description                            |
| ------------------ | ------- | -------------------------------------- |
| `totalAttempts`    | number  | Student's total attempts               |
| `maxAttempts`      | number  | Maximum allowed attempts               |
| `remainingAttempts`| number  | Remaining attempts                     |
| `canAttempt`       | boolean | Whether student can still attempt      |
| `bestScore`        | number  | Student's best percentage score        |
| `passed`           | boolean | Whether student passed                 |
| `attempts`         | array   | Array of student's own attempts        |

---

### Error Responses

#### 400 Bad Request - No Active Session

```json
{
  "success": false,
  "message": "No current academic session found",
  "statusCode": 400
}
```

#### 401 Unauthorized - Invalid or Missing Token

```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

#### 403 Forbidden - Access Denied (Teacher)

```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "statusCode": 403
}
```

#### 403 Forbidden - Access Denied (Student - Subject)

```json
{
  "success": false,
  "message": "You do not have access to this assessment",
  "statusCode": 403
}
```

#### 403 Forbidden - Access Denied (Student - Not Published)

```json
{
  "success": false,
  "message": "This assessment is not available",
  "statusCode": 403
}
```

#### 404 Not Found - Assessment Not Found

```json
{
  "success": false,
  "message": "Assessment not found",
  "statusCode": 404
}
```

#### 404 Not Found - User Not Found

```json
{
  "success": false,
  "message": "User not found",
  "statusCode": 404
}
```

#### 404 Not Found - Teacher Not Found

```json
{
  "success": false,
  "message": "Teacher not found",
  "statusCode": 404
}
```

#### 404 Not Found - Student Not Found

```json
{
  "success": false,
  "message": "Student not found",
  "statusCode": 404
}
```

---

### Notes

1. **Response Structure:** Response varies based on user role - teachers/directors get full submission data, students get only their own progress.

2. **Question Answers:** Students cannot see correct answers unless `show_correct_answers` is enabled on the assessment AND they have submitted at least one attempt.

3. **Submission Data:** Only includes students from classes that have this assessment's subject assigned.

4. **Can Attempt Logic:** Students can attempt if:
   - Assessment status is `PUBLISHED`
   - Assessment `is_published` is true
   - Student has remaining attempts (`totalAttempts < maxAttempts`)
   - Assessment `end_date` hasn't passed (or is null)

5. **Best Score:** Calculated from the attempt with the highest `percentage` value.

---

## Update Assessment

Updates an assessment with partial data (PATCH behavior). Only the fields provided in the request body will be updated.

### Endpoint

```
PATCH /assessment/:id
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Path Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `id`      | string | Yes      | Assessment ID  |

---

### Important Restrictions

1. **Cannot Update Published Assessments:** Assessments with status `PUBLISHED` or `ACTIVE` cannot be updated. To modify a published assessment, first change its status to `DRAFT`.

2. **Students Cannot Update:** Students do not have permission to update assessments.

3. **Status Change Side Effects:**
   - Changing status to `PUBLISHED` or `ACTIVE` will set `is_published=true` and record `published_at` timestamp
   - Changing from `PUBLISHED`/`ACTIVE` to `DRAFT` will set `is_published=false`
   - Cannot publish an assessment with an `end_date` in the past

---

### Role-Based Access

| Role                | Access                                                                |
| ------------------- | --------------------------------------------------------------------- |
| **Library Owner**   | Can update any LibraryAssessment in their platform                    |
| **School Director** | Can update any assessment in the school                               |
| **School Admin**    | Can update any assessment in the school                               |
| **Teacher**         | Can update only assessments they created for subjects they teach      |
| **Student**         | ❌ Cannot update assessments                                          |

---

### Request Body

All fields are optional. Only provided fields will be updated.

| Field                    | Type     | Description                                      |
| ------------------------ | -------- | ------------------------------------------------ |
| `title`                  | string   | Assessment title                                 |
| `description`            | string   | Assessment description                           |
| `instructions`           | string   | Instructions for students                        |
| `subject_id`             | string   | Subject ID (must exist in school/platform)       |
| `topic_id`               | string   | Topic ID (must belong to subject)                |
| `duration`               | number   | Duration in minutes (1-300)                      |
| `max_attempts`           | number   | Maximum attempts allowed (1-10)                  |
| `passing_score`          | number   | Passing score percentage (0-100)                 |
| `total_points`           | number   | Total possible points                            |
| `shuffle_questions`      | boolean  | Whether to shuffle question order                |
| `shuffle_options`        | boolean  | Whether to shuffle answer options                |
| `show_correct_answers`   | boolean  | Show correct answers after submission            |
| `show_feedback`          | boolean  | Show feedback after submission                   |
| `allow_review`           | boolean  | Allow students to review their answers           |
| `start_date`             | datetime | When assessment becomes available                |
| `end_date`               | datetime | When assessment expires                          |
| `time_limit`             | number   | Time limit in minutes (1-300)                    |
| `grading_type`           | enum     | `AUTOMATIC`, `MANUAL`, or `MIXED`                |
| `auto_submit`            | boolean  | Auto-submit when time expires                    |
| `tags`                   | string[] | Tags for categorization                          |
| `assessment_type`        | string   | Type: `CBT`, `QUIZ`, `EXAM`, etc.                |
| `status`                 | enum     | `DRAFT`, `PUBLISHED`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `is_result_released`     | boolean  | Whether results are released to students         |
| `student_can_view_grading` | boolean | Whether students can view grading details      |

---

### Example Request

```bash
PATCH /assessment/clxyz123abc
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Updated Mathematics Quiz",
  "description": "Updated description",
  "passing_score": 70
}
```

---

### Success Response (School Users)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment updated successfully",
  "data": {
    "assessment": {
      "id": "clxyz123abc",
      "title": "Updated Mathematics Quiz",
      "description": "Updated description",
      "duration": 60,
      "createdAt": "2026-02-20T10:30:00.000Z",
      "updatedAt": "2026-02-23T14:00:00.000Z",
      "topic_id": "topic_abc123",
      "order": 0,
      "academic_session_id": "session_abc123",
      "allow_review": true,
      "auto_submit": true,
      "created_by": "user_xyz789",
      "end_date": "2026-02-25T23:59:59.000Z",
      "grading_type": "AUTOMATIC",
      "instructions": "Answer all questions",
      "is_published": false,
      "is_result_released": false,
      "max_attempts": 2,
      "passing_score": 70,
      "published_at": null,
      "result_released_at": null,
      "school_id": "school_abc123",
      "show_correct_answers": false,
      "show_feedback": true,
      "shuffle_options": false,
      "shuffle_questions": false,
      "start_date": "2026-02-22T09:00:00.000Z",
      "tags": ["math", "quiz"],
      "time_limit": 60,
      "total_points": 100,
      "status": "DRAFT",
      "subject_id": "subject_abc123",
      "assessment_type": "CBT",
      "student_can_view_grading": false,
      "subject": {
        "id": "subject_abc123",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "topic": {
        "id": "topic_abc123",
        "title": "Algebra Fundamentals"
      },
      "createdBy": {
        "id": "user_xyz789",
        "first_name": "John",
        "last_name": "Doe"
      },
      "_count": {
        "questions": 20,
        "attempts": 0
      }
    },
    "assessmentContext": "school"
  }
}
```

---

### Success Response (Library Owner)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment updated successfully",
  "data": {
    "assessment": {
      "id": "lib-assessment-uuid",
      "title": "Updated Library Quiz",
      "description": "Updated description",
      "duration": 45,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-23T14:00:00.000Z",
      "topicId": "topic-uuid",
      "order": 1,
      "allowReview": true,
      "autoSubmit": true,
      "createdById": "library-owner-uuid",
      "endDate": "2024-02-15T23:59:59.000Z",
      "gradingType": "AUTOMATIC",
      "instructions": "Complete all questions",
      "isPublished": false,
      "isResultReleased": false,
      "maxAttempts": 3,
      "passingScore": 70,
      "publishedAt": null,
      "resultReleasedAt": null,
      "platformId": "platform-uuid",
      "showCorrectAnswers": true,
      "showFeedback": true,
      "shuffleOptions": false,
      "shuffleQuestions": false,
      "startDate": "2024-01-20T00:00:00.000Z",
      "tags": ["math", "quiz"],
      "timeLimit": 45,
      "totalPoints": 100,
      "status": "DRAFT",
      "subjectId": "subject-uuid",
      "assessmentType": "CBT",
      "studentCanViewGrading": true,
      "subject": {
        "id": "subject-uuid",
        "name": "Mathematics",
        "code": "MATH"
      },
      "topic": {
        "id": "topic-uuid",
        "title": "Algebra Basics"
      },
      "createdBy": {
        "id": "library-owner-uuid",
        "first_name": "John",
        "last_name": "Owner"
      },
      "_count": {
        "questions": 15,
        "attempts": 0
      }
    },
    "assessmentContext": "library"
  }
}
```

> **Note for Library Owner Response:**
> - Uses camelCase for most fields (e.g., `topicId`, `subjectId`, `allowReview`)
> - Uses `platformId` instead of `school_id`
> - Uses `createdById` instead of `created_by`
> - Does not include `academic_session_id` (library assessments are not tied to sessions)

---

### Error Responses

#### 400 Bad Request - Cannot Update Published Assessment

```json
{
  "success": false,
  "message": "Cannot update assessment with status \"PUBLISHED\". Change status to DRAFT first to make modifications.",
  "statusCode": 400
}
```

#### 400 Bad Request - Cannot Publish Expired Assessment

```json
{
  "success": false,
  "message": "Cannot publish an assessment that has already expired. Please set an end date in the future first.",
  "statusCode": 400
}
```

#### 403 Forbidden - Students Cannot Update

```json
{
  "success": false,
  "message": "Students cannot update assessments",
  "statusCode": 403
}
```

#### 403 Forbidden - Teacher Does Not Teach Subject

```json
{
  "success": false,
  "message": "You do not teach this subject",
  "statusCode": 403
}
```

#### 404 Not Found - Assessment Not Found

```json
{
  "success": false,
  "message": "Assessment not found or you do not have permission to update it",
  "statusCode": 404
}
```

#### 404 Not Found - Subject Not Found

```json
{
  "success": false,
  "message": "Subject not found in this school",
  "statusCode": 404
}
```

#### 404 Not Found - Topic Not Found

```json
{
  "success": false,
  "message": "Topic not found or does not belong to the specified subject",
  "statusCode": 404
}
```

---

### Notes

1. **PATCH Behavior:** Only fields included in the request body are updated. Omitted fields retain their current values.

2. **Status Workflow:** The typical status progression is:
   - `DRAFT` → `PUBLISHED` or `ACTIVE` → `CLOSED` → `ARCHIVED`
   - You can move back to `DRAFT` from `PUBLISHED`/`ACTIVE` to make changes

3. **Validation:** Changing `subject_id` or `topic_id` triggers validation:
   - Subject must exist in the user's school/platform
   - Topic must belong to the target subject
   - For teachers, they must teach the target subject

4. **Date Validation:** When publishing (changing status to `PUBLISHED` or `ACTIVE`), the `end_date` must be in the future.

---

## Get Assessment Questions (For Taking Assessment)

Fetches assessment questions for a student/user to take the assessment. This endpoint is specifically for students attempting an assessment.

### Endpoint

```
GET /assessment/:id/questions
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Path Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `id`      | string | Yes      | Assessment ID  |

---

### Validation Checks

1. **Assessment Status:** Must be `PUBLISHED` or `ACTIVE`
2. **Date Range:** Current time must be within `start_date` and `end_date`
3. **Attempt Limit:** User must have remaining attempts (`attempts < max_attempts`)
4. **Access Control:**
   - School students: Must be enrolled in a class with the assessment's subject
   - Library users: Must have access to the platform

---

### Role-Based Access

| Role                | Access                                                                |
| ------------------- | --------------------------------------------------------------------- |
| **Library Owner**   | Preview mode: All questions with correct answers (for verification)  |
| **School Director** | Preview mode: All questions with correct answers                      |
| **School Admin**    | Preview mode: All questions with correct answers                      |
| **Teacher**         | Preview mode: Questions with correct answers (for subjects they teach)|
| **Student**         | Take mode: Questions without correct answers (for taking assessment)  |

---

### Success Response (Student Taking Assessment)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment questions retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment_abc123",
      "title": "Mathematics Mid-Term Quiz",
      "description": "Test your algebra skills",
      "instructions": "Answer all questions. You have 60 minutes.",
      "duration": 60,
      "time_limit": 60,
      "total_points": 100,
      "max_attempts": 2,
      "passing_score": 50,
      "auto_submit": true,
      "start_date": "2026-02-20T09:00:00.000Z",
      "end_date": "2026-02-28T23:59:59.000Z",
      "subject": {
        "id": "subject_abc123",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#3B82F6"
      },
      "teacher": {
        "id": "user_xyz789",
        "name": "John Doe"
      }
    },
    "questions": [
      {
        "id": "question_abc123",
        "question_text": "What is the value of x in 2x + 5 = 15?",
        "question_type": "MULTIPLE_CHOICE",
        "points": 5,
        "order": 1,
        "image_url": null,
        "audio_url": null,
        "video_url": null,
        "is_required": true,
        "options": [
          {
            "id": "option_1",
            "text": "5",
            "order": 1
          },
          {
            "id": "option_2",
            "text": "10",
            "order": 2
          },
          {
            "id": "option_3",
            "text": "7.5",
            "order": 3
          },
          {
            "id": "option_4",
            "text": "3",
            "order": 4
          }
        ]
      },
      {
        "id": "question_def456",
        "question_text": "Simplify: 3(x + 2) - 2(x - 1)",
        "question_type": "MULTIPLE_CHOICE",
        "points": 5,
        "order": 2,
        "image_url": null,
        "audio_url": null,
        "video_url": null,
        "is_required": true,
        "options": [
          {
            "id": "option_5",
            "text": "x + 8",
            "order": 1
          },
          {
            "id": "option_6",
            "text": "x + 4",
            "order": 2
          },
          {
            "id": "option_7",
            "text": "5x + 4",
            "order": 3
          },
          {
            "id": "option_8",
            "text": "x + 6",
            "order": 4
          }
        ]
      }
    ],
    "total_questions": 2,
    "student_attempts": 0,
    "remaining_attempts": 2,
    "assessmentContext": "school"
  }
}
```

> **Note:** Correct answers are NOT included in the student response. Options may be shuffled if `shuffle_options` is enabled on the assessment.

---

### Success Response (Teacher/Director Preview)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment questions retrieved successfully (preview mode)",
  "data": {
    "assessment": {
      "id": "assessment_abc123",
      "title": "Mathematics Mid-Term Quiz",
      "description": "Test your algebra skills",
      "instructions": "Answer all questions. You have 60 minutes.",
      "duration": 60,
      "time_limit": 60,
      "total_points": 100,
      "max_attempts": 2,
      "passing_score": 50,
      "status": "DRAFT",
      "is_published": false,
      "start_date": "2026-02-20T09:00:00.000Z",
      "end_date": "2026-02-28T23:59:59.000Z",
      "subject": {
        "id": "subject_abc123",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#3B82F6"
      },
      "teacher": {
        "id": "user_xyz789",
        "name": "John Doe"
      },
      "total_attempts": 45
    },
    "questions": [
      {
        "id": "question_abc123",
        "question_text": "What is the value of x in 2x + 5 = 15?",
        "question_type": "MULTIPLE_CHOICE",
        "points": 5,
        "order": 1,
        "image_url": null,
        "audio_url": null,
        "video_url": null,
        "is_required": true,
        "explanation": "Subtract 5 from both sides, then divide by 2.",
        "difficulty_level": "MEDIUM",
        "options": [
          {
            "id": "option_1",
            "text": "5",
            "is_correct": true,
            "order": 1
          },
          {
            "id": "option_2",
            "text": "10",
            "is_correct": false,
            "order": 2
          },
          {
            "id": "option_3",
            "text": "7.5",
            "is_correct": false,
            "order": 3
          },
          {
            "id": "option_4",
            "text": "3",
            "is_correct": false,
            "order": 4
          }
        ],
        "correct_answers": [
          {
            "id": "correct_1",
            "answer_text": "5",
            "option_ids": ["option_1"]
          }
        ]
      }
    ],
    "total_questions": 1,
    "isPreview": true,
    "assessmentContext": "school"
  }
}
```

> **Note:** Preview mode includes `is_correct` flags on options, `correct_answers`, `explanation`, and `difficulty_level`.

---

### Success Response (Library Owner Preview)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment questions retrieved successfully (preview mode)",
  "data": {
    "assessment": {
      "id": "lib-assessment-uuid",
      "title": "Library Mathematics Quiz",
      "description": "Basic math concepts",
      "instructions": "Complete all questions",
      "duration": 45,
      "timeLimit": 45,
      "totalPoints": 100,
      "maxAttempts": 3,
      "passingScore": 60,
      "status": "DRAFT",
      "isPublished": false,
      "startDate": "2024-01-20T00:00:00.000Z",
      "endDate": "2024-02-15T23:59:59.000Z",
      "subject": {
        "id": "subject-uuid",
        "name": "Mathematics",
        "code": "MATH"
      },
      "createdBy": {
        "id": "library-owner-uuid",
        "name": "John Owner"
      },
      "totalAttempts": 150
    },
    "questions": [
      {
        "id": "lib-question-uuid",
        "question_text": "What is 2 + 2?",
        "question_type": "MULTIPLE_CHOICE",
        "points": 5,
        "order": 1,
        "image_url": null,
        "audio_url": null,
        "video_url": null,
        "is_required": true,
        "explanation": "Basic addition",
        "difficulty_level": "EASY",
        "options": [
          {
            "id": "option-1",
            "text": "4",
            "is_correct": true,
            "order": 1
          },
          {
            "id": "option-2",
            "text": "5",
            "is_correct": false,
            "order": 2
          }
        ],
        "correct_answers": [
          {
            "id": "correct-1",
            "answer_text": "4",
            "option_ids": ["option-1"]
          }
        ]
      }
    ],
    "total_questions": 1,
    "isPreview": true,
    "assessmentContext": "library"
  }
}
```

---

### Error Responses

#### 400 Bad Request - Assessment Not Started

```json
{
  "success": false,
  "message": "Assessment has not started yet",
  "statusCode": 400
}
```

#### 400 Bad Request - Assessment Expired

```json
{
  "success": false,
  "message": "Assessment has expired",
  "statusCode": 400
}
```

#### 400 Bad Request - Student Not in Class

```json
{
  "success": false,
  "message": "Student is not assigned to any class",
  "statusCode": 400
}
```

#### 403 Forbidden - Maximum Attempts Reached

```json
{
  "success": false,
  "message": "Maximum attempts reached for this assessment",
  "statusCode": 403
}
```

#### 404 Not Found - Assessment Not Found

```json
{
  "success": false,
  "message": "Assessment not found or not available",
  "statusCode": 404
}
```

#### 404 Not Found - Student Not Found

```json
{
  "success": false,
  "message": "Student not found",
  "statusCode": 404
}
```

---

### Notes

1. **Question Shuffling:** If `shuffle_questions` is enabled on the assessment, questions are returned in random order.

2. **Option Shuffling:** If `shuffle_options` is enabled on the assessment, options within each question are returned in random order.

3. **Correct Answers Hidden:** For students taking the assessment, correct answers are never included in the response. Only preview mode (teachers/directors/admins/owners) includes correct answer information.

4. **Auto-Close on Expiry:** If a student tries to fetch questions for an assessment whose `end_date` has passed, the assessment status is automatically updated to `CLOSED`.

5. **Assessment Types:** This endpoint works for all assessment types (`CBT`, `QUIZ`, `EXAM`, etc.).

---

## Submit Assessment

Submits student/user answers for an assessment and auto-grades where possible.

### Endpoint

```
POST /assessment/:id/submit
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Path Parameters

| Parameter | Type   | Required | Description    |
| --------- | ------ | -------- | -------------- |
| `id`      | string | Yes      | Assessment ID  |

---

### Validation Checks

1. **Assessment Status:** Must be `PUBLISHED` or `ACTIVE`
2. **Attempt Limit:** User must have remaining attempts (`attempts < max_attempts`)
3. **Access Control:**
   - School students: Must be enrolled in a class with the assessment's subject
   - Library users: Must have access to the platform
4. **Role Restriction:** Only students (and library owners for testing) can submit

---

### Role-Based Access

| Role                | Access                                                |
| ------------------- | ----------------------------------------------------- |
| **Library Owner**   | Can submit (for testing their own assessments)        |
| **School Director** | ❌ Cannot submit assessments                          |
| **School Admin**    | ❌ Cannot submit assessments                          |
| **Teacher**         | ❌ Cannot submit assessments                          |
| **Student**         | ✅ Can submit assessments for subjects in their class |

---

### Request Body

| Field                  | Type     | Required | Description                                      |
| ---------------------- | -------- | -------- | ------------------------------------------------ |
| `answers`              | array    | Yes      | Array of answer objects                          |
| `answers[].question_id`| string   | Yes      | Question ID                                      |
| `answers[].question_type`| string | No       | Question type                                   |
| `answers[].selected_options`| string[] | No  | Selected option IDs (for multiple choice)       |
| `answers[].answer`     | string   | No       | Single answer (alternative to selected_options)  |
| `answers[].text_answer`| string   | No       | Text answer (for essay, fill-in-blank)          |
| `submission_time`      | datetime | No       | Submission timestamp (ISO string)                |
| `time_taken`           | number   | No       | Time taken in seconds                            |
| `total_questions`      | number   | No       | Total questions (metadata)                       |
| `questions_answered`   | number   | No       | Questions answered (metadata)                    |
| `questions_skipped`    | number   | No       | Questions skipped (metadata)                     |
| `submission_status`    | string   | No       | `COMPLETED`, `TIMED_OUT`, `AUTO_SUBMITTED`       |
| `device_info`          | object   | No       | Device tracking info                             |

---

### Example Request

```bash
POST /assessment/clxyz123abc/submit
Content-Type: application/json
Authorization: Bearer <token>

{
  "answers": [
    {
      "question_id": "question_abc123",
      "question_type": "MULTIPLE_CHOICE",
      "selected_options": ["option_1"]
    },
    {
      "question_id": "question_def456",
      "question_type": "FILL_IN_BLANK",
      "text_answer": "42"
    },
    {
      "question_id": "question_ghi789",
      "question_type": "TRUE_FALSE",
      "answer": "option_true"
    }
  ],
  "submission_time": "2026-02-23T14:30:00.000Z",
  "time_taken": 1800,
  "total_questions": 3,
  "questions_answered": 3,
  "questions_skipped": 0,
  "submission_status": "COMPLETED",
  "device_info": {
    "device_type": "mobile",
    "os": "iOS 17.2",
    "app_version": "2.5.0"
  }
}
```

---

### Success Response (School Student)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "data": {
    "attempt_id": "attempt_abc123",
    "assessment_id": "clxyz123abc",
    "total_score": 85,
    "total_points": 100,
    "percentage": 85,
    "passed": true,
    "grade": "A",
    "answers": [
      {
        "question_id": "question_abc123",
        "is_correct": true,
        "points_earned": 5,
        "max_points": 5
      },
      {
        "question_id": "question_def456",
        "is_correct": true,
        "points_earned": 10,
        "max_points": 10
      },
      {
        "question_id": "question_ghi789",
        "is_correct": false,
        "points_earned": 0,
        "max_points": 5
      }
    ],
    "submission_metadata": {
      "total_questions": 3,
      "questions_answered": 3,
      "questions_skipped": 0,
      "submission_status": "COMPLETED",
      "device_info": {
        "device_type": "mobile",
        "os": "iOS 17.2",
        "app_version": "2.5.0"
      }
    },
    "submitted_at": "2026-02-23T14:30:00.000Z",
    "time_spent": 1800,
    "attempt_number": 1,
    "remaining_attempts": 1,
    "assessmentContext": "school"
  }
}
```

---

### Success Response (Library User)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "data": {
    "attempt_id": "lib-attempt-uuid",
    "assessment_id": "lib-assessment-uuid",
    "total_score": 90,
    "total_points": 100,
    "percentage": 90,
    "passed": true,
    "grade": "A",
    "answers": [
      {
        "question_id": "lib-question-1",
        "is_correct": true,
        "points_earned": 10,
        "max_points": 10
      }
    ],
    "submission_metadata": {
      "total_questions": 10,
      "questions_answered": 10,
      "questions_skipped": 0,
      "submission_status": "COMPLETED",
      "device_info": null
    },
    "submitted_at": "2024-01-23T14:30:00.000Z",
    "time_spent": 1200,
    "attempt_number": 1,
    "remaining_attempts": 2,
    "assessmentContext": "library"
  }
}
```

---

### Error Responses

#### 400 Bad Request - No Current Session

```json
{
  "success": false,
  "message": "No current academic session found",
  "statusCode": 400
}
```

#### 403 Forbidden - Maximum Attempts Reached

```json
{
  "success": false,
  "message": "Maximum attempts reached for this assessment",
  "statusCode": 403
}
```

#### 403 Forbidden - Non-Student Attempting to Submit

```json
{
  "success": false,
  "message": "Only students can submit assessments",
  "statusCode": 403
}
```

#### 404 Not Found - Assessment Not Found

```json
{
  "success": false,
  "message": "Assessment not found or not available",
  "statusCode": 404
}
```

#### 404 Not Found - Student Not Found

```json
{
  "success": false,
  "message": "Student not found",
  "statusCode": 404
}
```

---

### Auto-Grading Logic

| Question Type          | Grading Method                                      |
| ---------------------- | --------------------------------------------------- |
| `MULTIPLE_CHOICE`      | Compare selected option IDs with correct option IDs |
| `MULTIPLE_CHOICE_SINGLE`| Compare single selected option with correct option |
| `TRUE_FALSE`           | Compare selected option with correct option         |
| `FILL_IN_BLANK`        | Case-insensitive text comparison                    |
| `SHORT_ANSWER`         | Case-insensitive text comparison                    |
| `NUMERIC`              | Tolerance-based comparison (±0.01)                  |
| `DATE`                 | Exact date match                                    |
| `ESSAY`                | Returns `is_correct: false` (requires manual review)|

---

### Grade Scale

| Percentage | Grade |
| ---------- | ----- |
| 80-100%    | A     |
| 70-79%     | B     |
| 60-69%     | C     |
| 50-59%     | D     |
| 40-49%     | E     |
| < 40%      | F     |

---

### Notes

1. **Answer Format Flexibility:** The endpoint accepts both `selected_options` (array) and `answer` (single string). If `answer` is provided without `selected_options`, it will be converted to `selected_options: [answer]`.

2. **Question Type Detection:** If `question_type` is not provided in the answer, it will be retrieved from the question record.

3. **Score Recalculation:** Even if `total_points_earned` is provided by the frontend, the backend recalculates the score for accuracy.

4. **Essay Grading:** Essays require manual grading. They will initially be marked as incorrect with 0 points. Teachers/admins can grade them manually later.

5. **Attempt Tracking:** Each submission creates a new attempt record. The attempt number is automatically incremented.

6. **Remaining Attempts:** The response includes `remaining_attempts` so the frontend can display how many attempts are left.

---

## Duplicate Assessment

Creates a copy of an existing assessment with a new title. Useful for teachers who want to reuse questions from previous assessments or create variations with shuffled content.

### Endpoint

```
POST /assessment/:id/duplicate
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Role-Based Access

| Role                | Access                                                    |
| ------------------- | --------------------------------------------------------- |
| **Library Owner**   | Can duplicate any LibraryAssessment in their platform     |
| **School Director** | Can duplicate any assessment in their school              |
| **School Admin**    | Can duplicate any assessment in their school              |
| **Teacher**         | Can duplicate assessments for subjects they teach         |
| **Student**         | ❌ Cannot duplicate assessments                           |

---

### Path Parameters

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `id`      | string | Yes      | Source Assessment ID to duplicate |

---

### Request Body

```json
{
  "new_title": "Mathematics Test - Week 2",
  "shuffle_questions": true,
  "shuffle_options": true,
  "new_description": "Updated version of the mathematics test"
}
```

### Body Parameters

| Field              | Type    | Required | Default | Description                                          |
| ------------------ | ------- | -------- | ------- | ---------------------------------------------------- |
| `new_title`        | string  | Yes      | -       | Title for the new duplicated assessment (3-200 chars) |
| `shuffle_questions`| boolean | No       | `false` | Randomizes question order in the new assessment      |
| `shuffle_options`  | boolean | No       | `false` | Randomizes option order within each question         |
| `new_description`  | string  | No       | -       | Optional new description. If omitted, copies from source |

---

### What Gets Copied

| Component              | Copied? | Notes                                              |
| ---------------------- | ------- | -------------------------------------------------- |
| Assessment metadata    | ✅      | Title, instructions, duration, passing score, etc. |
| Questions              | ✅      | All question properties including media URLs       |
| Question options       | ✅      | All options with is_correct flags                  |
| Correct answers        | ✅      | Option IDs are remapped to new option IDs          |
| Hints & explanations   | ✅      | Preserved for each question                        |
| Status                 | ❌      | Always set to `DRAFT`                              |
| is_published           | ❌      | Always set to `false`                              |
| start_date / end_date  | ❌      | Reset to `null` - user must set new dates          |
| Attempts & submissions | ❌      | Not copied - starts fresh                          |

---

### Shuffle Behavior

#### `shuffle_questions: true`
- Questions are randomly reordered in the new assessment
- New `order` values are assigned (1, 2, 3, ...)
- The shuffled order is saved permanently in the new assessment

#### `shuffle_options: true`
- Options within each question are randomly reordered
- New `order` values are assigned to options
- The shuffled order is saved permanently

#### Combined Shuffling
When both are `true`, both questions AND options are shuffled, creating a significantly different assessment variant.

---

### Success Response (201)

```json
{
  "success": true,
  "message": "Assessment duplicated successfully",
  "data": {
    "assessment": {
      "id": "clx456abc...",
      "title": "Mathematics Test - Week 2",
      "description": "Updated version of the mathematics test",
      "status": "DRAFT",
      "is_published": false,
      "start_date": null,
      "end_date": null,
      "duration": 60,
      "total_points": 100,
      "passing_score": 50,
      "shuffle_questions": true,
      "shuffle_options": true,
      "created_at": "2026-02-23T10:30:00.000Z",
      "subject": {
        "id": "clx...",
        "name": "Mathematics",
        "code": "MATH"
      },
      "topic": {
        "id": "clx...",
        "title": "Algebra"
      },
      "createdBy": {
        "id": "clx...",
        "first_name": "John",
        "last_name": "Doe"
      },
      "_count": {
        "questions": 20
      }
    },
    "source_assessment_id": "clx123abc...",
    "shuffle_applied": {
      "questions": true,
      "options": true
    }
  }
}
```

---

### Error Responses

#### 400 Bad Request - Invalid Data
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "new_title",
      "message": "new_title must be between 3 and 200 characters"
    }
  ]
}
```

#### 400 Bad Request - No Active Session (School)
```json
{
  "success": false,
  "message": "No current academic session found"
}
```

#### 403 Forbidden - Student Attempt
```json
{
  "success": false,
  "message": "Students cannot duplicate assessments"
}
```

#### 403 Forbidden - Teacher Access Denied
```json
{
  "success": false,
  "message": "You do not have access to duplicate this assessment"
}
```

#### 404 Not Found - Assessment Not Found
```json
{
  "success": false,
  "message": "Assessment not found"
}
```

---

### Use Cases

1. **Reuse Questions:** Teacher created a great test last term and wants to use the same questions this term with a new title.

2. **Create Variants:** Teacher wants multiple versions of the same test with shuffled questions/options to prevent cheating.

3. **Quick Setup:** Instead of manually entering 50 questions again, duplicate an existing assessment and modify as needed.

4. **Template-Based Creation:** Use a "master" assessment as a template and create variations for different classes.

---

### Notes

1. **Draft Status:** The new assessment is always created with `DRAFT` status. The user must publish it separately after reviewing.

2. **Date Reset:** `start_date` and `end_date` are reset to `null`. The user must set new dates before publishing.

3. **New Session:** For school assessments, the duplicated assessment belongs to the current academic session.

4. **Option ID Remapping:** When options are copied, new IDs are generated. The `correct_answers` table references are automatically updated to point to the new option IDs.

---

## Add Questions to an Assessment

Adds one or more questions (with options and correct answers) to an existing assessment. Supports bulk creation via JSON body.

### Endpoint

```
POST /assessment/:id/questions
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Role-Based Access

| Role                | Access                                                    |
| ------------------- | --------------------------------------------------------- |
| **Library Owner**   | Can add questions to their platform assessments           |
| **School Director** | Can add questions to any assessment in their school       |
| **School Admin**    | Can add questions to any assessment in their school       |
| **Teacher**         | Can add questions to their own assessments only           |
| **Student**         | ❌ Cannot add questions                                   |

---

### Restrictions

- Cannot add questions to assessments with status: `PUBLISHED`, `ACTIVE`, `CLOSED`, or `ARCHIVED`
- Assessment must be in `DRAFT` status to accept new questions
- At least one question is required in the request body

---

### Request Body

```json
{
  "questions": [
    {
      "question_text": "What is the capital of France?",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "points": 5.0,
      "order": 1,
      "is_required": true,
      "time_limit": 30,
      "difficulty_level": "MEDIUM",
      "explanation": "Paris is the capital and largest city of France.",
      "image_url": "https://example.com/question-image.png",
      "image_s3_key": "assessment-images/schools/xxx/assessments/yyy/question_123.png",
      "audio_url": "https://example.com/audio.mp3",
      "video_url": "https://example.com/video.mp4",
      "show_hint": true,
      "hint_text": "Think about European capitals",
      "options": [
        { "option_text": "London", "is_correct": false, "order": 1 },
        { "option_text": "Paris", "is_correct": true, "order": 2 },
        { "option_text": "Berlin", "is_correct": false, "order": 3 },
        { "option_text": "Madrid", "is_correct": false, "order": 4 }
      ]
    }
  ]
}
```

---

### Question Types Supported

| Question Type              | Options Required | Correct Answers Field | Description                                  |
| -------------------------- | ---------------- | --------------------- | -------------------------------------------- |
| `MULTIPLE_CHOICE_SINGLE`   | ✅ Yes           | Auto from `is_correct` | Single correct option                        |
| `MULTIPLE_CHOICE_MULTIPLE` | ✅ Yes           | Auto from `is_correct` | Multiple correct options                     |
| `TRUE_FALSE`               | ✅ Yes (2 only)  | Auto from `is_correct` | Two options: True and False                  |
| `SHORT_ANSWER`             | ❌ No            | `correct_answers[]`    | Brief text response                          |
| `LONG_ANSWER` / `ESSAY`    | ❌ No            | Optional               | Extended text (manual grading)               |
| `FILL_IN_BLANK`            | ❌ No            | `correct_answers[].answer_text` | Exact text match (case-insensitive) |
| `NUMERIC`                  | ❌ No            | `correct_answers[].answer_number` | Number with tolerance (±0.01)    |
| `DATE`                     | ❌ No            | `correct_answers[].answer_date`   | Date comparison                  |
| `MATCHING` / `ORDERING`    | ❌ No            | `correct_answers[].answer_json`   | Complex JSON structure           |

---

### Question Fields Reference

| Field                    | Type    | Required | Default  | Description                                                 |
| ------------------------ | ------- | -------- | -------- | ----------------------------------------------------------- |
| `question_text`          | string  | ✅       | -        | The question text displayed to users                        |
| `question_type`          | enum    | ✅       | -        | One of the question types above                             |
| `order`                  | number  | No       | Auto     | Display order (auto-appended after last if not provided)    |
| `points`                 | number  | No       | `1.0`    | Points awarded for correct answer                           |
| `is_required`            | boolean | No       | `true`   | Whether the question must be answered                       |
| `time_limit`             | number  | No       | -        | Time limit in seconds for this question                     |
| `difficulty_level`       | enum    | No       | `MEDIUM` | `EASY`, `MEDIUM`, `HARD`, `EXPERT`                          |
| `image_url`              | string  | No       | -        | Image URL displayed with the question                       |
| `image_s3_key`           | string  | No       | -        | S3 key for the question image (for cleanup)                 |
| `audio_url`              | string  | No       | -        | Audio URL to play with the question                         |
| `video_url`              | string  | No       | -        | Video URL to display with the question                      |
| `explanation`            | string  | No       | -        | Explanation shown after answering (max 2000 chars)          |
| `show_hint`              | boolean | No       | `false`  | Whether to show a hint                                      |
| `hint_text`              | string  | No       | -        | Hint text (max 1000 chars)                                  |
| `allow_multiple_attempts`| boolean | No       | `false`  | Whether the student can retry this question                 |
| `min_length`             | number  | No       | -        | Min text length (for SHORT_ANSWER/LONG_ANSWER)              |
| `max_length`             | number  | No       | -        | Max text length (for SHORT_ANSWER/LONG_ANSWER)              |
| `min_value`              | number  | No       | -        | Min numeric value (for NUMERIC)                             |
| `max_value`              | number  | No       | -        | Max numeric value (for NUMERIC)                             |
| `options`                | array   | No       | -        | Array of `QuestionOptionDto` (for MCQ/TRUE_FALSE)           |
| `correct_answers`        | array   | No       | -        | Array of `CorrectAnswerDto` (for non-MCQ types)             |

---

### Option Fields Reference

| Field          | Type    | Required | Default | Description                                     |
| -------------- | ------- | -------- | ------- | ----------------------------------------------- |
| `option_text`  | string  | ✅       | -       | The option text displayed to users              |
| `is_correct`   | boolean | ✅       | -       | Whether this is a correct answer                |
| `order`        | number  | No       | Auto    | Display order (auto-assigned if not provided)   |
| `image_url`    | string  | No       | -       | Image URL displayed with the option             |
| `image_s3_key` | string  | No       | -       | S3 key for the option image (for cleanup)       |
| `audio_url`    | string  | No       | -       | Audio URL for the option                        |

---

### Correct Answer Fields Reference

| Field          | Type   | Required | Description                                     |
| -------------- | ------ | -------- | ----------------------------------------------- |
| `answer_text`  | string | No       | Text answer (for FILL_IN_BLANK, SHORT_ANSWER)   |
| `answer_number`| number | No       | Numeric answer (for NUMERIC)                    |
| `answer_date`  | string | No       | Date answer ISO string (for DATE)               |
| `answer_json`  | object | No       | JSON answer (for MATCHING, ORDERING)            |

---

### Auto-Behaviors

1. **Auto-Ordering:** If `order` is not provided, questions are appended after the last existing question (e.g., if 5 questions exist, the new one gets order 6).

2. **Auto Correct Answer Records:** For MCQ/TRUE_FALSE types, a `correct_answer` record is automatically created linking all options marked `is_correct: true`.

3. **Total Points Recalculation:** The assessment's `total_points` is automatically recalculated after adding questions.

---

### Example: Multiple Choice Question

```json
{
  "questions": [
    {
      "question_text": "What is 2 + 2?",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "points": 2.0,
      "options": [
        { "option_text": "3", "is_correct": false },
        { "option_text": "4", "is_correct": true },
        { "option_text": "5", "is_correct": false }
      ]
    }
  ]
}
```

### Example: True/False Question

```json
{
  "questions": [
    {
      "question_text": "The Earth is flat.",
      "question_type": "TRUE_FALSE",
      "points": 1.0,
      "options": [
        { "option_text": "True", "is_correct": false },
        { "option_text": "False", "is_correct": true }
      ]
    }
  ]
}
```

### Example: Fill in the Blank

```json
{
  "questions": [
    {
      "question_text": "The process by which plants make food is called ___.",
      "question_type": "FILL_IN_BLANK",
      "points": 3.0,
      "correct_answers": [
        { "answer_text": "Photosynthesis" }
      ]
    }
  ]
}
```

### Example: Numeric Question

```json
{
  "questions": [
    {
      "question_text": "What is the square root of 144?",
      "question_type": "NUMERIC",
      "points": 2.0,
      "min_value": 0,
      "max_value": 1000,
      "correct_answers": [
        { "answer_number": 12 }
      ]
    }
  ]
}
```

### Example: Batch (Multiple Questions at Once)

```json
{
  "questions": [
    {
      "question_text": "What is the capital of Nigeria?",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "points": 2.0,
      "options": [
        { "option_text": "Lagos", "is_correct": false },
        { "option_text": "Abuja", "is_correct": true },
        { "option_text": "Kano", "is_correct": false }
      ]
    },
    {
      "question_text": "Water boils at 100°C at sea level.",
      "question_type": "TRUE_FALSE",
      "points": 1.0,
      "options": [
        { "option_text": "True", "is_correct": true },
        { "option_text": "False", "is_correct": false }
      ]
    },
    {
      "question_text": "Explain the process of mitosis.",
      "question_type": "ESSAY",
      "points": 10.0,
      "min_length": 50,
      "max_length": 2000
    }
  ]
}
```

---

### Success Response (201)

```json
{
  "success": true,
  "message": "Questions added successfully",
  "data": {
    "assessment_id": "clx123abc...",
    "questions_added": 3,
    "total_questions": 8,
    "questions": [
      {
        "id": "clxq1...",
        "question_text": "What is the capital of Nigeria?",
        "question_type": "MULTIPLE_CHOICE_SINGLE",
        "order": 6,
        "points": 2.0,
        "options": [
          { "id": "clxo1...", "option_text": "Lagos", "is_correct": false },
          { "id": "clxo2...", "option_text": "Abuja", "is_correct": true },
          { "id": "clxo3...", "option_text": "Kano", "is_correct": false }
        ],
        "correct_answers": [
          { "id": "clxa1...", "option_ids": ["clxo2..."] }
        ]
      }
    ]
  }
}
```

---

### Error Responses

#### 400 Bad Request - Assessment Status
```json
{
  "success": false,
  "message": "Cannot add questions to a published or active assessment. Change status to DRAFT first."
}
```

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "questions.0.question_text",
      "message": "question_text must be a string and is required"
    }
  ]
}
```

#### 403 Forbidden - Student Attempt
```json
{
  "success": false,
  "message": "Students cannot add questions to assessments"
}
```

#### 403 Forbidden - Teacher Access Denied
```json
{
  "success": false,
  "message": "You do not have access to this assessment"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Assessment not found"
}
```

---

## Add Question with Images (Atomic)

Creates a single question with optional image uploads for the **question itself** and/or its **options** — all in one atomic multipart request. If any step fails, all uploaded images are automatically cleaned up from S3.

### Endpoint

```
POST /assessment/:id/questions/with-image
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Content Type

```
Content-Type: multipart/form-data
```

> **Important:** This endpoint uses `multipart/form-data`, NOT `application/json`. The question data is sent as a JSON string in the `questionData` field.

---

### Role-Based Access

| Role                | Access                                                    |
| ------------------- | --------------------------------------------------------- |
| **Library Owner**   | Can add questions to their platform assessments           |
| **School Director** | Can add questions to any assessment in their school       |
| **School Admin**    | Can add questions to any assessment in their school       |
| **Teacher**         | Can add questions to their own assessments only           |
| **Student**         | ❌ Cannot add questions                                   |

---

### Restrictions

- Cannot add questions to assessments with status: `PUBLISHED`, `ACTIVE`, `CLOSED`, or `ARCHIVED`
- Image file types allowed: `JPEG`, `PNG`, `GIF`, `WEBP`
- Max image file size: **5MB** per image
- Max option images: **10** per request

---

### Form Data Fields

| Field           | Type     | Required | Description                                                                          |
| --------------- | -------- | -------- | ------------------------------------------------------------------------------------ |
| `questionData`  | string   | ✅       | JSON string containing the question data (same structure as `/questions` body)       |
| `image`         | file     | No       | Image file for the **question** itself                                               |
| `optionImages`  | file[]   | No       | Image files for **options**, matched by `imageIndex` in the options array            |

---

### How Option Image Matching Works

Option images are matched to their corresponding options using the `imageIndex` field:

1. You upload N files under the `optionImages` field — they receive indices 0, 1, 2, ...
2. In your `questionData` JSON, each option that should receive an image specifies `"imageIndex": N` matching the file's index
3. The service uploads each file, then injects the resulting `image_url` and `image_s3_key` into the matching option

```
optionImages[0] → matches option with "imageIndex": 0
optionImages[1] → matches option with "imageIndex": 1
...
```

---

### Example: cURL Request

```bash
curl -X POST "https://api.example.com/assessment/clx123abc/questions/with-image" \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/question-diagram.png" \
  -F "optionImages=@/path/to/option-a-image.jpg" \
  -F "optionImages=@/path/to/option-b-image.jpg" \
  -F 'questionData={
    "question_text": "Which animal is shown in each option?",
    "question_type": "MULTIPLE_CHOICE_SINGLE",
    "points": 5,
    "difficulty_level": "EASY",
    "options": [
      { "option_text": "A dog", "is_correct": false, "imageIndex": 0 },
      { "option_text": "A cat", "is_correct": true, "imageIndex": 1 },
      { "option_text": "A bird", "is_correct": false }
    ]
  }'
```

In this example:
- `image` → uploaded as the **question image** (the diagram)
- `optionImages[0]` → matched to option "A dog" (which has `"imageIndex": 0`)
- `optionImages[1]` → matched to option "A cat" (which has `"imageIndex": 1`)
- Option "A bird" has no `imageIndex`, so it gets no image

---

### Example: Question Image Only (No Option Images)

```bash
curl -X POST "https://api.example.com/assessment/clx123abc/questions/with-image" \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/chart.png" \
  -F 'questionData={
    "question_text": "Based on the chart above, what was the highest value?",
    "question_type": "NUMERIC",
    "points": 3,
    "correct_answers": [
      { "answer_number": 95 }
    ]
  }'
```

---

### Example: Option Images Only (No Question Image)

```bash
curl -X POST "https://api.example.com/assessment/clx123abc/questions/with-image" \
  -H "Authorization: Bearer <token>" \
  -F "optionImages=@/path/to/flag-nigeria.png" \
  -F "optionImages=@/path/to/flag-ghana.png" \
  -F "optionImages=@/path/to/flag-kenya.png" \
  -F 'questionData={
    "question_text": "Which flag belongs to Nigeria?",
    "question_type": "MULTIPLE_CHOICE_SINGLE",
    "points": 2,
    "options": [
      { "option_text": "Flag A", "is_correct": true, "imageIndex": 0 },
      { "option_text": "Flag B", "is_correct": false, "imageIndex": 1 },
      { "option_text": "Flag C", "is_correct": false, "imageIndex": 2 }
    ]
  }'
```

---

### Example: No Images (JSON-Only via Multipart)

You can also use this endpoint without any images — just send `questionData` alone:

```bash
curl -X POST "https://api.example.com/assessment/clx123abc/questions/with-image" \
  -H "Authorization: Bearer <token>" \
  -F 'questionData={
    "question_text": "What is 5 × 7?",
    "question_type": "NUMERIC",
    "points": 1,
    "correct_answers": [
      { "answer_number": 35 }
    ]
  }'
```

> **Tip:** If you don't need images at all, prefer using `POST /assessment/:id/questions` (JSON body) instead for simplicity.

---

### S3 Storage Paths

Images are stored in organized S3 folders:

| User Type        | Path Pattern                                                                    |
| ---------------- | ------------------------------------------------------------------------------- |
| **School users** | `assessment-images/schools/{schoolId}/assessments/{assessmentId}/question_*.png` |
| **School users** | `assessment-images/schools/{schoolId}/assessments/{assessmentId}/option_*.png`   |
| **Library owner**| `assessment-images/platforms/{platformId}/assessments/{assessmentId}/question_*.png` |
| **Library owner**| `assessment-images/platforms/{platformId}/assessments/{assessmentId}/option_*.png`   |

---

### Atomic Guarantee & Rollback

This endpoint guarantees **no orphaned files** on S3:

1. All images (question + options) are uploaded to S3 first
2. The question is created in the database with all image URLs
3. **If database creation fails**, ALL previously uploaded images are deleted from S3

```
Upload question image ──► Upload option images ──► Create question in DB
                                                         │
                                                    ❌ FAILS?
                                                         │
                                                  Delete ALL uploaded
                                                  images from S3
```

This is why we chose a single atomic endpoint instead of a separate "upload image" endpoint — it prevents orphaned images that would accumulate in S3 when users upload images but never complete the question creation.

---

### Success Response (201)

```json
{
  "success": true,
  "message": "Questions added successfully",
  "data": {
    "assessment_id": "clx123abc...",
    "questions_added": 1,
    "total_questions": 6,
    "questions": [
      {
        "id": "clxq1...",
        "question_text": "Which animal is shown in each option?",
        "question_type": "MULTIPLE_CHOICE_SINGLE",
        "order": 6,
        "points": 5.0,
        "image_url": "https://s3.amazonaws.com/.../question_1708700000_diagram.png",
        "image_s3_key": "assessment-images/schools/xxx/assessments/yyy/question_1708700000_diagram.png",
        "options": [
          {
            "id": "clxo1...",
            "option_text": "A dog",
            "is_correct": false,
            "image_url": "https://s3.amazonaws.com/.../option_1708700001_0_dog.jpg",
            "image_s3_key": "assessment-images/schools/xxx/assessments/yyy/option_1708700001_0_dog.jpg"
          },
          {
            "id": "clxo2...",
            "option_text": "A cat",
            "is_correct": true,
            "image_url": "https://s3.amazonaws.com/.../option_1708700001_1_cat.jpg",
            "image_s3_key": "assessment-images/schools/xxx/assessments/yyy/option_1708700001_1_cat.jpg"
          },
          {
            "id": "clxo3...",
            "option_text": "A bird",
            "is_correct": false,
            "image_url": null,
            "image_s3_key": null
          }
        ],
        "correct_answers": [
          { "id": "clxa1...", "option_ids": ["clxo2..."] }
        ]
      }
    ]
  }
}
```

---

### Error Responses

#### 400 Bad Request - Invalid JSON
```json
{
  "success": false,
  "message": "Invalid JSON in questionData field"
}
```

#### 400 Bad Request - Invalid Image Type
```json
{
  "success": false,
  "message": "Invalid image file type: photo.bmp. Allowed: JPEG, PNG, GIF, WEBP"
}
```

#### 400 Bad Request - Image Too Large
```json
{
  "success": false,
  "message": "Image file large-photo.png exceeds 5MB limit"
}
```

#### 400 Bad Request - Assessment Status
```json
{
  "success": false,
  "message": "Cannot add questions to a published, active, closed, or archived assessment"
}
```

#### 403 Forbidden - Student Attempt
```json
{
  "success": false,
  "message": "Students cannot add questions to assessments"
}
```

#### 403 Forbidden - Teacher Access Denied
```json
{
  "success": false,
  "message": "You do not have access to this assessment"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Assessment not found or you do not have access to it"
}
```

---

### Frontend Integration Notes

#### Using `FormData` in JavaScript/TypeScript

```typescript
const formData = new FormData();

// Question image (optional)
formData.append('image', questionImageFile);

// Option images (optional) - order matters!
formData.append('optionImages', optionAImageFile);  // index 0
formData.append('optionImages', optionBImageFile);  // index 1

// Question data as JSON string
formData.append('questionData', JSON.stringify({
  question_text: "Which animal is shown?",
  question_type: "MULTIPLE_CHOICE_SINGLE",
  points: 5,
  options: [
    { option_text: "A dog", is_correct: false, imageIndex: 0 },
    { option_text: "A cat", is_correct: true, imageIndex: 1 },
    { option_text: "A bird", is_correct: false },
  ],
}));

const response = await fetch(`/assessment/${assessmentId}/questions/with-image`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData,
  // Do NOT set Content-Type — the browser sets it with the boundary
});
```

#### Using Axios

```typescript
const formData = new FormData();
formData.append('image', questionImageFile);
formData.append('optionImages', optionAImage);
formData.append('optionImages', optionBImage);
formData.append('questionData', JSON.stringify(questionData));

const { data } = await axios.post(
  `/assessment/${assessmentId}/questions/with-image`,
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  }
);
```

---

### When to Use Which Endpoint

| Scenario                                         | Endpoint                                    |
| ------------------------------------------------ | ------------------------------------------- |
| Adding questions with **no images**              | `POST /assessment/:id/questions` (JSON)     |
| Adding questions with **pre-existing image URLs** | `POST /assessment/:id/questions` (JSON)    |
| Adding a question with **new image uploads**     | `POST /assessment/:id/questions/with-image` |
| Adding a question with **option images**         | `POST /assessment/:id/questions/with-image` |
| **Batch** adding multiple questions (no images)  | `POST /assessment/:id/questions` (JSON)     |

5. **Media URLs:** Media URLs (images, audio, video) are copied as-is. They still point to the original files in storage.

---

## Update a Question in an Assessment

Updates a single question in an assessment. Supports updating question fields, media, options, and correct answers.

### Endpoint

```
PATCH /assessment/:id/questions/:questionId
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Role-Based Access

| Role                | Access                                                    |
| ------------------- | --------------------------------------------------------- |
| **Library Owner**   | Can update questions in their platform assessments        |
| **School Director** | Can update questions in any assessment in their school    |
| **School Admin**    | Can update questions in any assessment in their school    |
| **Teacher**         | Can update questions in their own assessments only        |
| **Student**         | ❌ Cannot update questions                                |

---

### Restrictions

- Cannot update questions in assessments with status: `PUBLISHED` or `ACTIVE`
- Assessment must be in `DRAFT` (or `CLOSED`) status to accept updates

---

### Smart Merge Behavior for Options

The endpoint uses **smart merge logic** for options:

1. **To UPDATE an existing option:** Include the `id` field. Only fields you provide will be updated (images preserved if not provided).
2. **To CREATE a new option:** Omit the `id` field. Must include `option_text` and `is_correct`.
3. **Options NOT in the array:** Are left unchanged (not deleted).

This allows you to:
- Update just the text of one option without affecting images
- Add new options without touching existing ones
- Update multiple options selectively

---

### Request Body

All fields are optional. Only provided fields will be updated.

#### Example 1: Update Option Text Only (Preserves Images)

```json
{
  "options": [
    { 
      "id": "existing-option-id-1",
      "option_text": "Updated text only"
      // Image URLs are preserved automatically
    }
  ]
}
```

#### Example 2: Update Option Image Only

```json
{
  "options": [
    { 
      "id": "existing-option-id-1",
      "image_url": "https://example.com/new-image.png",
      "image_s3_key": "assessment-images/.../new_image.png"
      // option_text and is_correct are preserved automatically
    }
  ]
}
```

#### Example 3: Update Multiple Fields

```json
{
  "question_text": "What is the capital of France?",
  "points": 4,
  "difficulty_level": "EASY",
  "options": [
    { 
      "id": "existing-option-id-1",
      "option_text": "Paris", 
      "is_correct": true 
    },
    { 
      "id": "existing-option-id-2",
      "option_text": "London", 
      "is_correct": false 
    }
  ]
}
```

#### Example 4: Add New Option (No `id`)

```json
{
  "options": [
    { 
      "option_text": "Madrid",
      "is_correct": false,
      "order": 4
      // No id = creates new option
    }
  ]
}
```

#### Example 5: Update Question Text Only

```json
{
  "question_text": "Updated question text",
  "explanation": "Updated explanation"
  // Options and images remain unchanged
}
```

---

### Success Response (200)

```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "assessment_id": "clx123abc...",
    "question": {
      "id": "clxq1...",
      "question_text": "What is the capital of France?",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "points": 4,
      "order": 2,
      "options": [
        { "id": "clxo1...", "option_text": "Paris", "is_correct": true },
        { "id": "clxo2...", "option_text": "London", "is_correct": false }
      ],
      "correct_answers": [
        { "id": "clxa1...", "option_ids": ["clxo1..."] }
      ]
    }
  }
}
```

---

### Error Responses

#### 400 Bad Request - Assessment Status
```json
{
  "success": false,
  "message": "Cannot update questions in a PUBLISHED assessment. Change the status to DRAFT first."
}
```

#### 400 Bad Request - Invalid Options
```json
{
  "success": false,
  "message": "Each option must include option_text"
}
```

#### 403 Forbidden - Student Attempt
```json
{
  "success": false,
  "message": "Students cannot update questions"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Question not found"
}
```

---

### Notes

1. **PATCH Behavior:** Only fields included in the request body are updated. Omitted fields retain their current values.

2. **Smart Merge for Options:** 
   - Options with `id`: Updated (only provided fields change)
   - Options without `id`: Created as new options
   - Options not in array: Left unchanged
   - This preserves images/data unless explicitly replaced

3. **Option Requirements:**
   - **Updating existing option:** Only `id` is required; other fields are optional
   - **Creating new option:** Must include `option_text` and `is_correct`

4. **Correct Answers:** For MCQ/TRUE_FALSE, correct answers are automatically rebuilt from `options[].is_correct`.

5. **Media Cleanup:** If you update `image_url` with a new S3 key, the old image is automatically deleted from storage.

6. **Partial Updates:** You can update just one option without affecting others. Send only the options you want to change.

---

## Update a Question with Image Uploads

Updates a question with new image file uploads (multipart/form-data). Handles uploading new images, deleting old images from S3, and updating the question atomically.

### Endpoint

```
PATCH /assessment/:id/questions/:questionId/with-image
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Content Type

```
Content-Type: multipart/form-data
```

> **Important:** This endpoint uses `multipart/form-data` for file uploads, NOT `application/json`.

---

### Role-Based Access

| Role                | Access                                                    |
| ------------------- | --------------------------------------------------------- |
| **Library Owner**   | Can update questions in their platform assessments        |
| **School Director** | Can update questions in any assessment in their school    |
| **School Admin**    | Can update questions in any assessment in their school    |
| **Teacher**         | Can update questions in their own assessments only        |
| **Student**         | ❌ Cannot update questions                                |

---

### Restrictions

- Cannot update questions in assessments with status: `PUBLISHED` or `ACTIVE`
- Image file types allowed: `JPEG`, `PNG`, `GIF`, `WEBP`
- Max image file size: **5MB** per image
- Atomicity: If upload fails, all changes are rolled back (including S3 deletions)

---

### Form Data Fields

| Field                     | Type     | Required | Description                                                                 |
| ------------------------- | -------- | -------- | --------------------------------------------------------------------------- |
| `questionData`            | string   | Yes      | JSON string with update data (same structure as regular PATCH)              |
| `oldQuestionImageS3Key`   | string   | No       | S3 key of old question image to delete                                      |
| `newQuestionImage`        | file     | No       | New question image file                                                     |
| `optionImageUpdates`      | string   | No       | JSON array of `{ optionId, oldS3Key }` for options to update                |
| `newOptionImages`         | file[]   | No       | New option image files (matched by index to `optionImageUpdates`)           |

---

### How It Works

1. **Delete Old Images:** Old images are deleted from S3 using the provided S3 keys
2. **Upload New Images:** New image files are uploaded to S3
3. **Update Question:** Question is updated with new image URLs
4. **Rollback on Failure:** If any step fails, all uploaded images are deleted from S3

### Option Image Matching

Option images are matched to options using the `optionImageUpdates` array:

```json
[
  { "optionId": "option-id-1", "oldS3Key": "old-s3-key-1" },
  { "optionId": "option-id-2", "oldS3Key": "old-s3-key-2" }
]
```

- `optionImageUpdates[0]` → `newOptionImages[0]` → updates option with `optionId: "option-id-1"`
- `optionImageUpdates[1]` → `newOptionImages[1]` → updates option with `optionId: "option-id-2"`

---

### Example: Update Question Image Only

```bash
curl -X PATCH "https://api.example.com/assessment/clx123/questions/clxq456/with-image" \
  -H "Authorization: Bearer <token>" \
  -F 'questionData={"question_text":"Updated question text"}' \
  -F "oldQuestionImageS3Key=assessment-images/schools/xxx/assessments/yyy/question_old.png" \
  -F "newQuestionImage=@/path/to/new-question-image.png"
```

---

### Example: Update Option Image Only

```bash
curl -X PATCH "https://api.example.com/assessment/clx123/questions/clxq456/with-image" \
  -H "Authorization: Bearer <token>" \
  -F 'questionData={}' \
  -F 'optionImageUpdates=[{"optionId":"opt-1","oldS3Key":"old-key-1"}]' \
  -F "newOptionImages=@/path/to/new-option-image.jpg"
```

---

### Example: Update Multiple Option Images

```bash
curl -X PATCH "https://api.example.com/assessment/clx123/questions/clxq456/with-image" \
  -H "Authorization: Bearer <token>" \
  -F 'questionData={"question_text":"Which flag is correct?"}' \
  -F 'optionImageUpdates=[
    {"optionId":"opt-1","oldS3Key":"old-flag-1.png"},
    {"optionId":"opt-2","oldS3Key":"old-flag-2.png"}
  ]' \
  -F "newOptionImages=@/path/to/new-flag-1.png" \
  -F "newOptionImages=@/path/to/new-flag-2.png"
```

---

### Example: Update Both Question and Option Images

```bash
curl -X PATCH "https://api.example.com/assessment/clx123/questions/clxq456/with-image" \
  -H "Authorization: Bearer <token>" \
  -F 'questionData={"question_text":"Updated question","points":5}' \
  -F "oldQuestionImageS3Key=old-question-key.png" \
  -F "newQuestionImage=@/path/to/new-question.png" \
  -F 'optionImageUpdates=[{"optionId":"opt-1","oldS3Key":"old-opt.png"}]' \
  -F "newOptionImages=@/path/to/new-option.png"
```

---

### Success Response (200)

```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "assessment_id": "clx123abc...",
    "question": {
      "id": "clxq1...",
      "question_text": "Updated question text",
      "question_type": "MULTIPLE_CHOICE_SINGLE",
      "points": 5,
      "order": 2,
      "image_url": "https://s3.amazonaws.com/.../question_1708700000_new.png",
      "image_s3_key": "assessment-images/schools/xxx/assessments/yyy/question_1708700000_new.png",
      "options": [
        {
          "id": "clxo1...",
          "option_text": "Option A",
          "is_correct": true,
          "image_url": "https://s3.amazonaws.com/.../option_1708700001_0_new.jpg",
          "image_s3_key": "assessment-images/schools/xxx/assessments/yyy/option_1708700001_0_new.jpg"
        },
        {
          "id": "clxo2...",
          "option_text": "Option B",
          "is_correct": false,
          "image_url": "https://existing-option-image.com/unchanged.png",
          "image_s3_key": "assessment-images/.../option_unchanged.png"
        }
      ],
      "correct_answers": [
        { "id": "clxa1...", "option_ids": ["clxo1..."] }
      ]
    }
  }
}
```

---

### Error Responses

#### 400 Bad Request - Missing questionData
```json
{
  "success": false,
  "message": "questionData field is required"
}
```

#### 400 Bad Request - Invalid JSON
```json
{
  "success": false,
  "message": "Invalid JSON in questionData field"
}
```

#### 400 Bad Request - Invalid Image Type
```json
{
  "success": false,
  "message": "Invalid image file type: photo.bmp. Allowed: JPEG, PNG, GIF, WEBP"
}
```

#### 400 Bad Request - Image Too Large
```json
{
  "success": false,
  "message": "Image file large-photo.png exceeds 5MB limit"
}
```

#### 400 Bad Request - Mismatch Error
```json
{
  "success": false,
  "message": "Mismatch between optionImageUpdates and newOptionImages count"
}
```

#### 400 Bad Request - Assessment Status
```json
{
  "success": false,
  "message": "Cannot update questions in a PUBLISHED assessment. Change the status to DRAFT first."
}
```

#### 403 Forbidden - Student Attempt
```json
{
  "success": false,
  "message": "Students cannot update questions"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Question not found"
}
```

---

### Frontend Integration (TypeScript)

```typescript
const formData = new FormData();

// Question data
formData.append('questionData', JSON.stringify({
  question_text: 'Updated question',
  points: 5,
}));

// Update question image
if (newQuestionImageFile) {
  formData.append('oldQuestionImageS3Key', existingQuestion.image_s3_key);
  formData.append('newQuestionImage', newQuestionImageFile);
}

// Update option images
if (optionImageUpdates.length > 0) {
  formData.append('optionImageUpdates', JSON.stringify([
    { optionId: 'opt-1', oldS3Key: 'old-key-1' },
    { optionId: 'opt-2', oldS3Key: 'old-key-2' },
  ]));
  
  optionImageFiles.forEach(file => {
    formData.append('newOptionImages', file);
  });
}

const response = await fetch(
  `/assessment/${assessmentId}/questions/${questionId}/with-image`,
  {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
    // Do NOT set Content-Type — browser sets it with boundary
  }
);
```

---

### Notes

1. **Atomicity:** All image operations are atomic. If the database update fails, all newly uploaded images are automatically deleted from S3.

2. **Old Image Cleanup:** Old images are deleted from S3 before new images are uploaded, ensuring no orphaned files.

3. **S3 Storage Paths:**
   - School: `assessment-images/schools/{schoolId}/assessments/{assessmentId}/`
   - Library: `assessment-images/platforms/{platformId}/assessments/{assessmentId}/`

4. **File Naming:** Uploaded files are sanitized and timestamped: `question_1708700000_sanitized_filename.png`

5. **Rollback Mechanism:** If any error occurs during the update, all uploaded images are deleted from S3, preventing orphaned files.

6. **Use Cases:**
   - Update question image without changing text
   - Update option images without changing option text
   - Replace low-quality images with high-quality versions
   - Fix incorrect images in options

---

## Delete a Question from an Assessment

Deletes a single question from an assessment. Also removes its options, correct answers, responses, and media.

### Endpoint

```
DELETE /assessment/:id/questions/:questionId
```

### Authorization

```
Bearer <token>
```

Accepts both school JWT (`jwt1`) and library JWT (`library-jwt`) tokens.

---

### Role-Based Access

| Role                | Access                                                    |
| ------------------- | --------------------------------------------------------- |
| **Library Owner**   | Can delete questions from their platform assessments      |
| **School Director** | Can delete questions from any assessment in their school  |
| **School Admin**    | Can delete questions from any assessment in their school  |
| **Teacher**         | Can delete questions from their own assessments only      |
| **Student**         | ❌ Cannot delete questions                                |

---

### Restrictions

- Cannot delete questions from assessments with status: `PUBLISHED` or `ACTIVE`

---

### Success Response (200)

```json
{
  "success": true,
  "message": "Question deleted successfully",
  "data": {
    "assessment_id": "clx123abc...",
    "deleted_question_id": "clxq1...",
    "message": "Question and all associated media have been removed"
  }
}
```

---

### Error Responses

#### 400 Bad Request - Assessment Status
```json
{
  "success": false,
  "message": "Cannot delete questions from a PUBLISHED assessment. Change the status to DRAFT first."
}
```

#### 403 Forbidden - Student Attempt
```json
{
  "success": false,
  "message": "Students cannot delete questions"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Question not found"
}
```

---

### Notes

1. **Cascade Cleanup:** Options, correct answers, and responses for the question are deleted automatically.
2. **Media Cleanup:** Any question/option images are removed from storage.