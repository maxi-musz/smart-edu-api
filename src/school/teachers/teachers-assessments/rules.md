first endpoint to create is the endpoint to fetch all assesssments for a teacher 

### Query Parameters


| Parameter             | Type    | Required | Default     | Description                                                            |
| --------------------- | ------- | -------- | ----------- | ---------------------------------------------------------------------- |
| `page`                | number  | No       | `1`         | Page number for pagination (min: 1)                                    |
| `limit`               | number  | No       | `20`        | Number of items per page (min: 1, max: 100)                            |
| `search`              | string  | No       | -           | Search term for assessment title or description                        |
| `academic_session_id` | string  | No       | Current     | Filter by academic session ID. Defaults to current active session      |
| `term`                | enum    | No       | -           | Filter by academic term: `first`, `second`, `third`                    |
| `subject_id`          | string  | No       | -           | Filter by subject ID                                                   |
| `topic_id`            | string  | No       | -           | Filter by topic ID                                                     |
| `status`              | enum    | No       | -           | Filter by status: `DRAFT`, `PUBLISHED`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `assessment_type`     | enum    | No       | -           | Filter by type: `CBT`, `MANUAL`                                        |
| `is_published`        | boolean | No       | -           | Filter by published state: `true`, `false`                             |
|                       |         |          |             |                                                                        |
| `sort_by`             | enum    | No       | `createdAt` | Sort field: `createdAt`, `title`, `start_date`, `end_date`, `status`   |
| `sort_order`          | enum    | No       | `desc`      | Sort order: `asc`, `desc`                                              |


### Example Request

```bash
GET /assessment?page=1&limit=10&status=PUBLISHED&subject_id=clxyz123&sort_by=createdAt&sort_order=desc
```

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


| Field       | Type   | Description                                |
| ----------- | ------ | ------------------------------------------ |
| `all`       | number | Total count of all assessments             |
| `draft`     | number | Count of assessments with DRAFT status     |
| `published` | number | Count of assessments with PUBLISHED status |
| `active`    | number | Count of assessments with ACTIVE status    |
| `closed`    | number | Count of assessments with CLOSED status    |
| `archived`  | number | Count of assessments with ARCHIVED status  |


#### `sessions[]`

Last 5 academic sessions/terms for the school (ordered by most recent first). Useful for filtering assessments by different sessions.


| Field           | Type     | Description                                 |
| --------------- | -------- | ------------------------------------------- |
| `id`            | string   | Academic session ID                         |
| `academic_year` | string   | Academic year (e.g., "2025/2026")           |
| `term`          | enum     | Academic term: `FIRST`, `SECOND`, `THIRD`   |
| `start_year`    | number   | Starting year of the academic year          |
| `end_year`      | number   | Ending year of the academic year            |
| `start_date`    | datetime | Session start date                          |
| `end_date`      | datetime | Session end date                            |
| `is_current`    | boolean  | Whether this is the current active session  |
| `status`        | enum     | Session status: `active`, `completed`, etc. |

#### `pagination`


| Field        | Type   | Description                    |
| ------------ | ------ | ------------------------------ |
| `page`       | number | Current page number            |
| `limit`      | number | Items per page                 |
| `total`      | number | Total number of matching items |
| `totalPages` | number | Total number of pages          |


#### `assessments[]`


| Field                          | Type     | Nullable | Description                                          |
| ------------------------------ | -------- | -------- | ---------------------------------------------------- |
| `id`                           | string   | No       | Unique assessment ID                                 |
| `title`                        | string   | No       | Assessment title                                     |
| `description`                  | string   | Yes      | Assessment description                               |
| `duration`                     | number   | Yes      | Duration in minutes                                  |
| `createdAt`                    | datetime | No       | Creation timestamp                                   |
| `updatedAt`                    | datetime | No       | Last update timestamp                                |
| `topic_id`                     | string   | Yes      | Associated topic ID                                  |
| `order`                        | number   | No       | Display order                                        |
| `academic_session_id`          | string   | No       | Academic session ID                                  |
| `allow_review`                 | boolean  | No       | Allow students to review after submission            |
| `auto_submit`                  | boolean  | No       | Auto-submit when time expires                        |
| `created_by`                   | string   | No       | Creator user ID                                      |
| `end_date`                     | datetime | Yes      | Assessment end date/time                             |
| `grading_type`                 | enum     | No       | `AUTOMATIC` or `MANUAL`                              |
| `instructions`                 | string   | Yes      | Assessment instructions                              |
| `is_published`                 | boolean  | No       | Whether assessment is published                      |
| `is_result_released`           | boolean  | No       | Whether results are released to students             |
| `max_attempts`                 | number   | No       | Maximum allowed attempts                             |
| `passing_score`                | number   | No       | Minimum passing score (percentage)                   |
| `can_edit_assessment`          | boolean  | No       | Whether assessment can still be edited               |
| `published_at`                 | datetime | Yes      | When assessment was published                        |
| `result_released_at`           | datetime | Yes      | When results were released                           |
| `school_id`                    | string   | No       | School ID                                            |
| `show_correct_answers`         | boolean  | No       | Show correct answers after submission                |
| `show_feedback`                | boolean  | No       | Show feedback after submission                       |
| `shuffle_options`              | boolean  | No       | Randomize answer options                             |
| `shuffle_questions`            | boolean  | No       | Randomize question order                             |
| `student_completed_assessment` | boolean  | No       | Whether any student has completed it                 |
| `start_date`                   | datetime | Yes      | Assessment start date/time                           |
| `tags`                         | string[] | No       | Assessment tags                                      |
| `time_limit`                   | number   | Yes      | Time limit in minutes                                |
| `total_points`                 | number   | No       | Total possible points                                |
| `status`                       | enum     | No       | `DRAFT`, `PUBLISHED`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `subject_id`                   | string   | No       | Subject ID                                           |
| `assessment_type`              | enum     | No       | `CBT` or `MANUAL`                                    |
| `submissions`                  | json     | Yes      | Submission metadata                                  |
| `student_can_view_grading`     | boolean  | No       | Whether students can view grading details            |
| `subject`                      | object   | No       | Subject details (id, name, code)                     |
| `topic`                        | object   | Yes      | Topic details (id, title)                            |
| `createdBy`                    | object   | No       | Creator details (id, first_name, last_name)          |
| `_count.questions`             | number   | No       | Number of questions in assessment                    |
| `_count.attempts`              | number   | No       | Number of student attempts                           |


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
### Notes

1. **Default Behavior:** If no `academic_session_id` is provided, the endpoint returns assessments from the current active academic session.

2. **Teacher Restrictions:** Teachers only see assessments for subjects they are assigned to teach.

4. **Analytics:** The `analytics` object provides counts by status regardless of the `status` filter applied, giving a complete overview

5. **Empty Results:** When a teacher has no subjects assigned an empty assessments array is returned with zero totals.

---