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