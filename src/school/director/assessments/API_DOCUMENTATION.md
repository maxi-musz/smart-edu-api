# Director Assessments API Documentation

## Overview
This API provides endpoints for school directors to view and manage all assessments created by teachers in their school.

---

## Endpoint 1: Get Assessment Dashboard

### Request

**Endpoint:** `GET /api/v1/director/assessments/dashboard`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 10) | `10` |
| `status` | string | No | Filter by status | `PUBLISHED`, `DRAFT`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `assessment_type` | string | No | Filter by assessment type | `CBT`, `EXAM`, `ASSIGNMENT`, `QUIZ`, `TEST`, etc. |
| `subject_id` | string | No | Filter by subject ID | `cmiu6cj2r000tmkxn2d0w5eju` |
| `class_id` | string | No | Filter by class ID | `class123` |

**Example Request:**
```http
GET /api/v1/director/assessments/dashboard?page=1&limit=10&status=PUBLISHED&assessment_type=EXAM
Authorization: Bearer <your-jwt-token>
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Assessment dashboard retrieved successfully",
  "data": {
    "academic_sessions": [
      {
        "id": "session123",
        "academic_year": "2024/2025",
        "term": "FIRST_TERM",
        "start_date": "2024-09-01T00:00:00.000Z",
        "end_date": "2024-12-20T00:00:00.000Z",
        "status": "active",
        "is_current": true,
        "_count": {
          "assessments": 45
        }
      },
      {
        "id": "session456",
        "academic_year": "2023/2024",
        "term": "THIRD_TERM",
        "start_date": "2024-04-01T00:00:00.000Z",
        "end_date": "2024-07-31T00:00:00.000Z",
        "status": "completed",
        "is_current": false,
        "_count": {
          "assessments": 38
        }
      }
    ],
    "subjects": [
      {
        "id": "subject123",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#3B82F6",
        "description": "Basic Mathematics",
        "class": {
          "id": "class123",
          "name": "Grade 10A"
        },
        "academic_session": {
          "id": "session123",
          "academic_year": "2024/2025",
          "term": "FIRST_TERM",
          "is_current": true
        },
        "teachers_in_charge": [
          {
            "id": "teacher123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@school.com",
            "display_picture": {
              "url": "https://example.com/image.jpg",
              "key": "s3-key"
            }
          }
        ],
        "student_count": 35,
        "total_assessments": 12,
        "total_topics": 8,
        "assessment_counts": {
          "CBT": 5,
          "EXAM": 2,
          "ASSIGNMENT": 3,
          "QUIZ": 1,
          "TEST": 1,
          "FORMATIVE": 0,
          "SUMMATIVE": 0,
          "OTHER": 0
        },
        "status": "active"
      },
      {
        "id": "subject456",
        "name": "English Language",
        "code": "ENG101",
        "color": "#EF4444",
        "description": "English Language and Literature",
        "class": null,
        "academic_session": {
          "id": "session123",
          "academic_year": "2024/2025",
          "term": "FIRST_TERM",
          "is_current": true
        },
        "teachers_in_charge": [
          {
            "id": "teacher456",
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@school.com",
            "display_picture": null
          }
        ],
        "student_count": 42,
        "total_assessments": 8,
        "total_topics": 6,
        "assessment_counts": {
          "CBT": 3,
          "EXAM": 1,
          "ASSIGNMENT": 2,
          "QUIZ": 2,
          "TEST": 0,
          "FORMATIVE": 0,
          "SUMMATIVE": 0,
          "OTHER": 0
        },
        "status": "active"
      }
    ],
    "classes": [
      {
        "id": "class123",
        "name": "Grade 10A",
        "classTeacher": {
          "id": "teacher789",
          "first_name": "Michael",
          "last_name": "Johnson",
          "email": "michael.johnson@school.com",
          "display_picture": {
            "url": "https://example.com/image2.jpg",
            "key": "s3-key-2"
          }
        },
        "academic_session": {
          "id": "session123",
          "academic_year": "2024/2025",
          "term": "FIRST_TERM",
          "is_current": true
        },
        "student_count": 35,
        "subject_count": 8,
        "schedule_count": 15
      },
      {
        "id": "class456",
        "name": "Grade 10B",
        "classTeacher": null,
        "academic_session": {
          "id": "session123",
          "academic_year": "2024/2025",
          "term": "FIRST_TERM",
          "is_current": true
        },
        "student_count": 32,
        "subject_count": 8,
        "schedule_count": 15
      }
    ],
    "assessments": {
      "EXAM": [
        {
          "id": "assessment123",
          "title": "First Term Mathematics Examination",
          "description": "Comprehensive examination covering all topics",
          "assessment_type": "EXAM",
          "status": "PUBLISHED",
          "is_published": true,
          "is_result_released": false,
          "total_points": 100,
          "passing_score": 50,
          "created_at": "2024-10-15T10:30:00.000Z",
          "updated_at": "2024-10-15T10:30:00.000Z",
          "subject": {
            "id": "subject123",
            "name": "Mathematics",
            "code": "MATH101"
          },
          "topic": {
            "id": "topic123",
            "title": "Algebra"
          },
          "created_by": {
            "id": "user123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@school.com"
          },
          "question_count": 25,
          "attempt_count": 30
        }
      ],
      "CBT": [
        {
          "id": "assessment456",
          "title": "Mathematics Quiz 1",
          "description": "Quick assessment on basic concepts",
          "assessment_type": "CBT",
          "status": "ACTIVE",
          "is_published": true,
          "is_result_released": true,
          "total_points": 50,
          "passing_score": 25,
          "created_at": "2024-10-10T08:00:00.000Z",
          "updated_at": "2024-10-10T08:00:00.000Z",
          "subject": {
            "id": "subject123",
            "name": "Mathematics",
            "code": "MATH101"
          },
          "topic": {
            "id": "topic456",
            "title": "Geometry"
          },
          "created_by": {
            "id": "user123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@school.com"
          },
          "question_count": 10,
          "attempt_count": 35
        }
      ],
      "ASSIGNMENT": [
        {
          "id": "assessment789",
          "title": "Algebra Problem Set",
          "description": "Solve the following algebraic equations",
          "assessment_type": "ASSIGNMENT",
          "status": "CLOSED",
          "is_published": true,
          "is_result_released": true,
          "total_points": 30,
          "passing_score": 15,
          "created_at": "2024-10-05T09:00:00.000Z",
          "updated_at": "2024-10-12T17:00:00.000Z",
          "subject": {
            "id": "subject123",
            "name": "Mathematics",
            "code": "MATH101"
          },
          "topic": {
            "id": "topic123",
            "title": "Algebra"
          },
          "created_by": {
            "id": "user123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@school.com"
          },
          "question_count": 5,
          "attempt_count": 28
        }
      ]
    },
    "assessment_counts": {
      "EXAM": 5,
      "CBT": 12,
      "ASSIGNMENT": 8,
      "QUIZ": 3,
      "TEST": 2,
      "FORMATIVE": 1,
      "SUMMATIVE": 0,
      "OTHER": 0
    },
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 31,
      "totalPages": 4,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "statusCode": 200
}
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Director role required.",
  "error": null,
  "statusCode": 403
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve dashboard: <error message>",
  "error": null,
  "statusCode": 500
}
```

---

## Endpoint 2: Get All Assessments

### Request

**Endpoint:** `GET /api/v1/director/assessments`

**Authentication:** Required (Bearer Token)

**Query Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Filter by status | `PUBLISHED`, `DRAFT`, `ACTIVE`, `CLOSED`, `ARCHIVED` |
| `subject_id` | string | No | Filter by subject ID | `subject123` |
| `topic_id` | string | No | Filter by topic ID | `topic123` |
| `assessment_type` | string | No | Filter by assessment type | `CBT`, `EXAM`, `ASSIGNMENT`, etc. |
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 10) | `10` |

**Example Request:**
```http
GET /api/v1/director/assessments?subject_id=subject123&assessment_type=EXAM&page=1&limit=10
Authorization: Bearer <your-jwt-token>
```

### Success Response (200 OK)

#### When `assessment_type` is NOT specified (returns all grouped by type):

```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": {
    "assessments": {
      "EXAM": [
        {
          "id": "assessment123",
          "title": "First Term Mathematics Examination",
          "description": "Comprehensive examination",
          "assessment_type": "EXAM",
          "status": "PUBLISHED",
          "is_published": true,
          "is_result_released": false,
          "total_points": 100,
          "passing_score": 50,
          "createdAt": "2024-10-15T10:30:00.000Z",
          "updatedAt": "2024-10-15T10:30:00.000Z",
          "subject": {
            "id": "subject123",
            "name": "Mathematics",
            "code": "MATH101"
          },
          "topic": {
            "id": "topic123",
            "title": "Algebra"
          },
          "createdBy": {
            "id": "user123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@school.com"
          },
          "_count": {
            "questions": 25,
            "attempts": 30
          }
        }
      ],
      "CBT": [
        {
          "id": "assessment456",
          "title": "Mathematics Quiz 1",
          "description": "Quick assessment",
          "assessment_type": "CBT",
          "status": "ACTIVE",
          "is_published": true,
          "is_result_released": true,
          "total_points": 50,
          "passing_score": 25,
          "createdAt": "2024-10-10T08:00:00.000Z",
          "updatedAt": "2024-10-10T08:00:00.000Z",
          "subject": {
            "id": "subject123",
            "name": "Mathematics",
            "code": "MATH101"
          },
          "topic": {
            "id": "topic456",
            "title": "Geometry"
          },
          "createdBy": {
            "id": "user123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@school.com"
          },
          "_count": {
            "questions": 10,
            "attempts": 35
          }
        }
      ]
    },
    "counts": {
      "EXAM": 5,
      "CBT": 12,
      "ASSIGNMENT": 8,
      "QUIZ": 3,
      "TEST": 2
    },
    "total": 30
  },
  "statusCode": 200
}
```

#### When `assessment_type` IS specified (returns paginated single type):

```json
{
  "success": true,
  "message": "Assessments retrieved successfully",
  "data": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    },
    "assessments": [
      {
        "id": "assessment123",
        "title": "First Term Mathematics Examination",
        "description": "Comprehensive examination",
        "assessment_type": "EXAM",
        "status": "PUBLISHED",
        "is_published": true,
        "is_result_released": false,
        "total_points": 100,
        "passing_score": 50,
        "createdAt": "2024-10-15T10:30:00.000Z",
        "updatedAt": "2024-10-15T10:30:00.000Z",
        "subject": {
          "id": "subject123",
          "name": "Mathematics",
          "code": "MATH101"
        },
        "topic": {
          "id": "topic123",
          "title": "Algebra"
        },
        "createdBy": {
          "id": "user123",
          "first_name": "John",
          "last_name": "Doe",
          "email": "john.doe@school.com"
        },
        "_count": {
          "questions": 25,
          "attempts": 30
        }
      }
    ],
    "counts": {
      "EXAM": 5
    }
  },
  "statusCode": 200
}
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Director role required.",
  "error": null,
  "statusCode": 403
}
```

#### 404 Not Found (when no current session)
```json
{
  "success": false,
  "message": "Current academic session not found",
  "error": null,
  "statusCode": 404
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve assessments: <error message>",
  "error": null,
  "statusCode": 500
}
```

---

## Endpoint 3: Get Assessment Attempts/Details

### Request

**Endpoint:** `GET /api/v1/director/assessments/:assessmentId/attempts`

**Authentication:** Required (Bearer Token)

**Path Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `assessmentId` | string | Yes | ID of the assessment | `assessment123` |

**Example Request:**
```http
GET /api/v1/director/assessments/assessment123/attempts
Authorization: Bearer <your-jwt-token>
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Assessment attempts retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment123",
      "title": "First Term Mathematics Examination",
      "subject": {
        "id": "subject123",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "topic": {
        "id": "topic123",
        "title": "Algebra"
      },
      "totalPoints": 100,
      "passingScore": 50,
      "createdBy": {
        "id": "user123",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.com"
      }
    },
    "statistics": {
      "totalStudents": 35,
      "studentsAttempted": 30,
      "studentsNotAttempted": 5,
      "totalAttempts": 32,
      "averageScore": 72.5,
      "completionRate": 85.71
    },
    "classes": [
      {
        "className": "Grade 10A",
        "totalStudents": 20,
        "studentsAttempted": 18,
        "studentsNotAttempted": 2
      },
      {
        "className": "Grade 10B",
        "totalStudents": 15,
        "studentsAttempted": 12,
        "studentsNotAttempted": 3
      }
    ],
    "students": [
      {
        "studentId": "student123",
        "userId": "user456",
        "studentNumber": "STU001",
        "firstName": "Alice",
        "lastName": "Johnson",
        "email": "alice.johnson@school.com",
        "displayPicture": {
          "url": "https://example.com/image.jpg",
          "key": "s3-key"
        },
        "className": "Grade 10A",
        "classId": "class123",
        "hasAttempted": true,
        "attemptCount": 2,
        "latestAttempt": {
          "id": "attempt123",
          "attemptNumber": 2,
          "status": "SUBMITTED",
          "startedAt": "2024-10-15T10:00:00.000Z",
          "submittedAt": "2024-10-15T10:45:00.000Z",
          "timeSpent": 2700,
          "totalScore": 85,
          "maxScore": 100,
          "percentage": 85,
          "passed": true,
          "isGraded": true,
          "gradedAt": "2024-10-15T11:00:00.000Z",
          "gradeLetter": "B",
          "overallFeedback": "Good work!",
          "createdAt": "2024-10-15T10:00:00.000Z"
        },
        "allAttempts": [
          {
            "id": "attempt123",
            "attemptNumber": 2,
            "status": "SUBMITTED",
            "startedAt": "2024-10-15T10:00:00.000Z",
            "submittedAt": "2024-10-15T10:45:00.000Z",
            "timeSpent": 2700,
            "totalScore": 85,
            "maxScore": 100,
            "percentage": 85,
            "passed": true,
            "isGraded": true,
            "gradedAt": "2024-10-15T11:00:00.000Z",
            "gradeLetter": "B",
            "overallFeedback": "Good work!",
            "createdAt": "2024-10-15T10:00:00.000Z"
          },
          {
            "id": "attempt456",
            "attemptNumber": 1,
            "status": "SUBMITTED",
            "startedAt": "2024-10-14T09:00:00.000Z",
            "submittedAt": "2024-10-14T09:50:00.000Z",
            "timeSpent": 3000,
            "totalScore": 75,
            "maxScore": 100,
            "percentage": 75,
            "passed": true,
            "isGraded": true,
            "gradedAt": "2024-10-14T10:00:00.000Z",
            "gradeLetter": "C",
            "overallFeedback": null,
            "createdAt": "2024-10-14T09:00:00.000Z"
          }
        ]
      },
      {
        "studentId": "student456",
        "userId": "user789",
        "studentNumber": "STU002",
        "firstName": "Bob",
        "lastName": "Smith",
        "email": "bob.smith@school.com",
        "displayPicture": null,
        "className": "Grade 10A",
        "classId": "class123",
        "hasAttempted": false,
        "attemptCount": 0,
        "latestAttempt": null,
        "allAttempts": []
      }
    ]
  },
  "statusCode": 200
}
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Director role required.",
  "error": null,
  "statusCode": 403
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "error": null,
  "statusCode": 404
}
```

#### 404 Not Found (No Current Session)
```json
{
  "success": false,
  "message": "Current academic session not found",
  "error": null,
  "statusCode": 404
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve assessment attempts: <error message>",
  "error": null,
  "statusCode": 500
}
```

---

## Endpoint 4: Get Student Submission

### Request

**Endpoint:** `GET /api/v1/director/assessments/:assessmentId/students/:studentId/submission`

**Authentication:** Required (Bearer Token)

**Path Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `assessmentId` | string | Yes | ID of the assessment | `assessment123` |
| `studentId` | string | Yes | ID of the student (Student record id, not user_id) | `student123` |

**Example Request:**
```http
GET /api/v1/director/assessments/assessment123/students/student123/submission
Authorization: Bearer <your-jwt-token>
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Student submission retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment123",
      "title": "First Term Mathematics Examination",
      "subject": {
        "id": "subject123",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "topic": {
        "id": "topic123",
        "title": "Algebra"
      },
      "totalPoints": 100,
      "passingScore": 50,
      "createdBy": {
        "id": "user123",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.com"
      }
    },
    "student": {
      "id": "student123",
      "userId": "user456",
      "studentNumber": "STU001",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@school.com",
      "displayPicture": {
        "url": "https://example.com/image.jpg",
        "key": "s3-key"
      },
      "className": "Grade 10A",
      "classId": "class123"
    },
    "attempts": [
      {
        "id": "attempt123",
        "attemptNumber": 2,
        "status": "SUBMITTED",
        "startedAt": "2024-10-15T10:00:00.000Z",
        "submittedAt": "2024-10-15T10:45:00.000Z",
        "timeSpent": 2700,
        "totalScore": 85,
        "maxScore": 100,
        "percentage": 85,
        "passed": true,
        "isGraded": true,
        "gradedAt": "2024-10-15T11:00:00.000Z",
        "gradedBy": "user789",
        "gradeLetter": "B",
        "overallFeedback": "Good work! Keep it up.",
        "createdAt": "2024-10-15T10:00:00.000Z",
        "responses": [
          {
            "id": "response123",
            "question": {
              "id": "question123",
              "questionText": "What is 2 + 2?",
              "questionType": "MULTIPLE_CHOICE_SINGLE",
              "points": 5,
              "order": 1,
              "imageUrl": null,
              "options": [
                {
                  "id": "option123",
                  "option_text": "3",
                  "is_correct": false,
                  "order": 1
                },
                {
                  "id": "option124",
                  "option_text": "4",
                  "is_correct": true,
                  "order": 2
                },
                {
                  "id": "option125",
                  "option_text": "5",
                  "is_correct": false,
                  "order": 3
                }
              ]
            },
            "textAnswer": null,
            "numericAnswer": null,
            "dateAnswer": null,
            "selectedOptions": [
              {
                "id": "option124",
                "option_text": "4",
                "is_correct": true,
                "order": 2
              }
            ],
            "fileUrls": [],
            "isCorrect": true,
            "pointsEarned": 5,
            "maxPoints": 5,
            "timeSpent": 30,
            "feedback": null,
            "isGraded": true,
            "createdAt": "2024-10-15T10:00:30.000Z"
          },
          {
            "id": "response124",
            "question": {
              "id": "question124",
              "questionText": "Solve for x: 2x + 5 = 15",
              "questionType": "SHORT_ANSWER",
              "points": 10,
              "order": 2,
              "imageUrl": null,
              "options": []
            },
            "textAnswer": "x = 5",
            "numericAnswer": null,
            "dateAnswer": null,
            "selectedOptions": [],
            "fileUrls": [],
            "isCorrect": true,
            "pointsEarned": 10,
            "maxPoints": 10,
            "timeSpent": 120,
            "feedback": "Correct!",
            "isGraded": true,
            "createdAt": "2024-10-15T10:02:30.000Z"
          }
        ]
      },
      {
        "id": "attempt456",
        "attemptNumber": 1,
        "status": "SUBMITTED",
        "startedAt": "2024-10-14T09:00:00.000Z",
        "submittedAt": "2024-10-14T09:50:00.000Z",
        "timeSpent": 3000,
        "totalScore": 75,
        "maxScore": 100,
        "percentage": 75,
        "passed": true,
        "isGraded": true,
        "gradedAt": "2024-10-14T10:00:00.000Z",
        "gradedBy": "user789",
        "gradeLetter": "C",
        "overallFeedback": null,
        "createdAt": "2024-10-14T09:00:00.000Z",
        "responses": [
          {
            "id": "response456",
            "question": {
              "id": "question123",
              "questionText": "What is 2 + 2?",
              "questionType": "MULTIPLE_CHOICE_SINGLE",
              "points": 5,
              "order": 1,
              "imageUrl": null,
              "options": [
                {
                  "id": "option123",
                  "option_text": "3",
                  "is_correct": false,
                  "order": 1
                },
                {
                  "id": "option124",
                  "option_text": "4",
                  "is_correct": true,
                  "order": 2
                }
              ]
            },
            "textAnswer": null,
            "numericAnswer": null,
            "dateAnswer": null,
            "selectedOptions": [
              {
                "id": "option123",
                "option_text": "3",
                "is_correct": false,
                "order": 1
              }
            ],
            "fileUrls": [],
            "isCorrect": false,
            "pointsEarned": 0,
            "maxPoints": 5,
            "timeSpent": 25,
            "feedback": null,
            "isGraded": true,
            "createdAt": "2024-10-14T09:00:25.000Z"
          }
        ]
      }
    ],
    "hasAttempted": true,
    "attemptCount": 2,
    "latestAttempt": {
      "id": "attempt123",
      "attemptNumber": 2,
      "status": "SUBMITTED",
      "startedAt": "2024-10-15T10:00:00.000Z",
      "submittedAt": "2024-10-15T10:45:00.000Z",
      "timeSpent": 2700,
      "totalScore": 85,
      "maxScore": 100,
      "percentage": 85,
      "passed": true,
      "isGraded": true,
      "gradedAt": "2024-10-15T11:00:00.000Z",
      "gradedBy": "user789",
      "gradeLetter": "B",
      "overallFeedback": "Good work! Keep it up.",
      "createdAt": "2024-10-15T10:00:00.000Z",
      "responses": [
        {
          "id": "response123",
          "question": {
            "id": "question123",
            "questionText": "What is 2 + 2?",
            "questionType": "MULTIPLE_CHOICE_SINGLE",
            "points": 5,
            "order": 1,
            "imageUrl": null,
            "options": [
              {
                "id": "option124",
                "option_text": "4",
                "is_correct": true,
                "order": 2
              }
            ]
          },
          "selectedOptions": [
            {
              "id": "option124",
              "option_text": "4",
              "is_correct": true,
              "order": 2
            }
          ],
          "isCorrect": true,
          "pointsEarned": 5,
          "maxPoints": 5
        }
      ]
    }
  },
  "statusCode": 200
}
```

### Response When Student Hasn't Attempted

```json
{
  "success": true,
  "message": "Student submission retrieved successfully",
  "data": {
    "assessment": {
      "id": "assessment123",
      "title": "First Term Mathematics Examination",
      "subject": {
        "id": "subject123",
        "name": "Mathematics",
        "code": "MATH101"
      },
      "topic": {
        "id": "topic123",
        "title": "Algebra"
      },
      "totalPoints": 100,
      "passingScore": 50,
      "createdBy": {
        "id": "user123",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.com"
      }
    },
    "student": {
      "id": "student123",
      "userId": "user456",
      "studentNumber": "STU001",
      "firstName": "Alice",
      "lastName": "Johnson",
      "email": "alice.johnson@school.com",
      "displayPicture": null,
      "className": "Grade 10A",
      "classId": "class123"
    },
    "attempts": [],
    "hasAttempted": false
  },
  "statusCode": 200
}
```

### Error Responses

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Director role required.",
  "error": null,
  "statusCode": 403
}
```

#### 404 Not Found (Assessment)
```json
{
  "success": false,
  "message": "Assessment not found or access denied",
  "error": null,
  "statusCode": 404
}
```

#### 404 Not Found (Student)
```json
{
  "success": false,
  "message": "Student not found",
  "error": null,
  "statusCode": 404
}
```

#### 404 Not Found (No Current Session)
```json
{
  "success": false,
  "message": "Current academic session not found",
  "error": null,
  "statusCode": 404
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to retrieve student submission: <error message>",
  "error": null,
  "statusCode": 500
}
```

---

## TypeScript Interfaces

```typescript
// Response wrapper
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  length?: number;
  meta?: any;
}

// Dashboard Response
interface DashboardResponse {
  academic_sessions: AcademicSession[];
  subjects: Subject[];
  classes: Class[];
  assessments: Record<string, Assessment[]>;
  assessment_counts: Record<string, number>;
  pagination: Pagination;
}

// Academic Session
interface AcademicSession {
  id: string;
  academic_year: string;
  term: 'FIRST_TERM' | 'SECOND_TERM' | 'THIRD_TERM';
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'upcoming';
  is_current: boolean;
  _count: {
    assessments: number;
  };
}

// Subject
interface Subject {
  id: string;
  name: string;
  code: string | null;
  color: string;
  description: string | null;
  class: {
    id: string;
    name: string;
  } | null;
  academic_session: {
    id: string;
    academic_year: string;
    term: string;
    is_current: boolean;
  };
  teachers_in_charge: Teacher[];
  student_count: number;
  total_assessments: number;
  total_topics: number;
  assessment_counts: {
    CBT: number;
    EXAM: number;
    ASSIGNMENT: number;
    QUIZ: number;
    TEST: number;
    FORMATIVE: number;
    SUMMATIVE: number;
    OTHER: number;
  };
  status: 'active' | 'inactive';
}

// Teacher
interface Teacher {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  display_picture: {
    url: string;
    key: string;
  } | null;
}

// Class
interface Class {
  id: string;
  name: string;
  classTeacher: Teacher | null;
  academic_session: {
    id: string;
    academic_year: string;
    term: string;
    is_current: boolean;
  };
  student_count: number;
  subject_count: number;
  schedule_count: number;
}

// Assessment
interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: 'CBT' | 'EXAM' | 'ASSIGNMENT' | 'QUIZ' | 'TEST' | 'FORMATIVE' | 'SUMMATIVE' | 'DIAGNOSTIC' | 'BENCHMARK' | 'PRACTICE' | 'MOCK_EXAM' | 'OTHER';
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED';
  is_published: boolean;
  is_result_released: boolean;
  total_points: number;
  passing_score: number;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
  };
  topic: {
    id: string;
    title: string;
  } | null;
  created_by: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  question_count?: number;
  attempt_count?: number;
  _count?: {
    questions: number;
    attempts: number;
  };
}

// Pagination
interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Assessment Attempts Response
interface AssessmentAttemptsResponse {
  assessment: {
    id: string;
    title: string;
    subject: {
      id: string;
      name: string;
      code: string | null;
    };
    topic: {
      id: string;
      title: string;
    } | null;
    totalPoints: number;
    passingScore: number;
    createdBy: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  statistics: {
    totalStudents: number;
    studentsAttempted: number;
    studentsNotAttempted: number;
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
  };
  classes: Array<{
    className: string;
    totalStudents: number;
    studentsAttempted: number;
    studentsNotAttempted: number;
  }>;
  students: Array<{
    studentId: string;
    userId: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    displayPicture: {
      url: string;
      key: string;
    } | null;
    className: string;
    classId: string | null;
    hasAttempted: boolean;
    attemptCount: number;
    latestAttempt: {
      id: string;
      attemptNumber: number;
      status: string;
      startedAt: string | null;
      submittedAt: string | null;
      timeSpent: number | null;
      totalScore: number;
      maxScore: number;
      percentage: number;
      passed: boolean;
      isGraded: boolean;
      gradedAt: string | null;
      gradeLetter: string | null;
      overallFeedback: string | null;
      createdAt: string;
    } | null;
    allAttempts: Array<{
      id: string;
      attemptNumber: number;
      status: string;
      startedAt: string | null;
      submittedAt: string | null;
      timeSpent: number | null;
      totalScore: number;
      maxScore: number;
      percentage: number;
      passed: boolean;
      isGraded: boolean;
      gradedAt: string | null;
      gradeLetter: string | null;
      overallFeedback: string | null;
      createdAt: string;
    }>;
  }>;
}

// Student Submission Response
interface StudentSubmissionResponse {
  assessment: {
    id: string;
    title: string;
    subject: {
      id: string;
      name: string;
      code: string | null;
    };
    topic: {
      id: string;
      title: string;
    } | null;
    totalPoints: number;
    passingScore: number;
    createdBy: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  student: {
    id: string;
    userId: string;
    studentNumber: string;
    firstName: string;
    lastName: string;
    email: string;
    displayPicture: {
      url: string;
      key: string;
    } | null;
    className: string;
    classId: string | null;
  };
  attempts: Array<{
    id: string;
    attemptNumber: number;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
    timeSpent: number | null;
    totalScore: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    isGraded: boolean;
    gradedAt: string | null;
    gradedBy: string | null;
    gradeLetter: string | null;
    overallFeedback: string | null;
    createdAt: string;
    responses: Array<{
      id: string;
      question: {
        id: string;
        questionText: string;
        questionType: string;
        points: number;
        order: number;
        imageUrl: string | null;
        options: Array<{
          id: string;
          option_text: string;
          is_correct: boolean;
          order: number;
        }>;
      };
      textAnswer: string | null;
      numericAnswer: number | null;
      dateAnswer: string | null;
      selectedOptions: Array<{
        id: string;
        option_text: string;
        is_correct: boolean;
        order: number;
      }>;
      fileUrls: string[];
      isCorrect: boolean | null;
      pointsEarned: number;
      maxPoints: number;
      timeSpent: number | null;
      feedback: string | null;
      isGraded: boolean;
      createdAt: string;
    }>;
  }>;
  hasAttempted: boolean;
  attemptCount?: number;
  latestAttempt?: {
    id: string;
    attemptNumber: number;
    status: string;
    startedAt: string | null;
    submittedAt: string | null;
    timeSpent: number | null;
    totalScore: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    isGraded: boolean;
    gradedAt: string | null;
    gradedBy: string | null;
    gradeLetter: string | null;
    overallFeedback: string | null;
    createdAt: string;
    responses: Array<{
      id: string;
      question: {
        id: string;
        questionText: string;
        questionType: string;
        points: number;
        order: number;
        imageUrl: string | null;
        options: Array<{
          id: string;
          option_text: string;
          is_correct: boolean;
          order: number;
        }>;
      };
      textAnswer: string | null;
      numericAnswer: number | null;
      dateAnswer: string | null;
      selectedOptions: Array<{
        id: string;
        option_text: string;
        is_correct: boolean;
        order: number;
      }>;
      fileUrls: string[];
      isCorrect: boolean | null;
      pointsEarned: number;
      maxPoints: number;
      timeSpent: number | null;
      feedback: string | null;
      isGraded: boolean;
      createdAt: string;
    }>;
  } | null;
}
```

---

## Assessment Type Enum Values

- `CBT` - Computer-Based Test
- `EXAM` - Examination
- `ASSIGNMENT` - Assignment
- `QUIZ` - Quiz
- `TEST` - Test
- `FORMATIVE` - Formative Assessment
- `SUMMATIVE` - Summative Assessment
- `DIAGNOSTIC` - Diagnostic Assessment
- `BENCHMARK` - Benchmark Assessment
- `PRACTICE` - Practice Assessment
- `MOCK_EXAM` - Mock Examination
- `OTHER` - Other

## Status Enum Values

- `DRAFT` - Draft (not published)
- `PUBLISHED` - Published
- `ACTIVE` - Currently active
- `CLOSED` - Closed/completed
- `ARCHIVED` - Archived

## Term Enum Values

- `FIRST_TERM` - First Term
- `SECOND_TERM` - Second Term
- `THIRD_TERM` - Third Term

---

## Notes for Frontend

1. **Authentication**: All endpoints require JWT Bearer token in the Authorization header
2. **Base URL**: Use your API base URL (e.g., `https://your-api.com/api/v1`)
3. **Pagination**: When `assessment_type` is specified in the dashboard endpoint, pagination applies. Otherwise, all assessments are returned grouped by type.
4. **Current Session**: The dashboard and assessment attempts endpoints automatically filter data by the current academic session when available.
5. **Empty Arrays**: If no assessments exist for a type, the key will still be present in the response with an empty array.
6. **Display Picture**: Can be `null` or an object with `url` and `key` properties.
7. **Date Format**: All dates are in ISO 8601 format (UTC).
8. **Assessment Attempts**: The `latestAttempt` is the most recent attempt (sorted by `submitted_at` desc). If a student hasn't attempted, `latestAttempt` will be `null` and `allAttempts` will be an empty array.
9. **Student Filtering**: Students are filtered by classes that have the assessment's subject. Only active students in the current session are included.
10. **Statistics**: `completionRate` is calculated as `(studentsAttempted / totalStudents) * 100` and rounded to 2 decimal places.
11. **Student Submission**: The `studentId` parameter should be the Student record ID (not the user_id). All attempts are returned with full question details and student responses, including selected options, text answers, and file uploads.
12. **Question Responses**: Each response includes the full question details, all available options (with correct answers marked), and the student's selected options/answers. This allows for detailed review of student submissions.
13. **Multiple Attempts**: If a student has multiple attempts, all are returned sorted by `submitted_at` descending. The `latestAttempt` is the first item in the attempts array.

