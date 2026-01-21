# Explore API Documentation

**Base URL:** `/api/v1/explore`

**Response Format:** All endpoints return:
```typescript
{
  success: boolean;
  message: string;
  data: any;
}
```

---

## 1. Get Explore Data

Get initial explore page data including classes, subjects, and recent videos.

**Endpoint:** `GET /api/v1/explore/`

**Authentication:** Not required

**Response:**
```json
{
  "success": true,
  "message": "Explore data retrieved successfully",
  "data": {
    "classes": [
      {
        "id": "class_uuid",
        "name": "JSS 1",
        "order": 1,
        "subjectsCount": 5
      }
    ],
    "subjects": [
      {
        "id": "subject_uuid",
        "name": "Mathematics",
        "code": "MATH",
        "description": "Advanced mathematics",
        "color": "#3B82F6",
        "thumbnailUrl": "https://...",
        "thumbnailKey": "library/subjects/...",
        "videosCount": 10,
        "topicsCount": 8,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "platform": {
          "id": "platform_uuid",
          "name": "Access Study",
          "slug": "smart-edu-global-library",
          "description": "...",
          "status": "active"
        },
        "class": {
          "id": "class_uuid",
          "name": "JSS 1",
          "order": 1
        }
      }
    ],
    "recentVideos": [
      {
        "id": "video_uuid",
        "title": "Algebra Basics",
        "description": "...",
        "videoUrl": "https://...",
        "thumbnailUrl": "https://...",
        "durationSeconds": 600,
        "sizeBytes": 52428800,
        "views": 250,
        "order": 1,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "topic": {
          "id": "topic_uuid",
          "title": "Introduction to Variables",
          "description": "...",
          "order": 1
        },
        "subject": {
          "id": "subject_uuid",
          "name": "Mathematics",
          "code": "MATH",
          "color": "#3B82F6",
          "thumbnailUrl": "https://...",
          "thumbnailKey": "library/subjects/..."
        },
        "platform": {
          "id": "platform_uuid",
          "name": "Access Study",
          "slug": "smart-edu-global-library",
          "description": "...",
          "status": "active"
        }
      }
    ],
    "statistics": {
      "totalClasses": 10,
      "totalSubjects": 50,
      "totalVideos": 20
    }
  }
}
```

---

## 2. Get Subjects

Get paginated list of subjects with optional filtering.

**Endpoint:** `GET /api/v1/explore/subjects`

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classId` | string | No | Filter by class ID |
| `search` | string | No | Search in name, description, or code |
| `page` | number | No | Page number (default: 1, min: 1) |
| `limit` | number | No | Items per page (default: 20, min: 1, max: 100) |

**Example Request:**
```
GET /api/v1/explore/subjects?classId=class_123&search=math&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Subjects retrieved successfully",
  "data": {
    "meta": {
      "totalItems": 50,
      "totalPages": 3,
      "currentPage": 1,
      "limit": 20
    },
    "items": [
      {
        "id": "subject_uuid",
        "name": "Mathematics",
        "code": "MATH",
        "description": "Advanced mathematics",
        "color": "#3B82F6",
        "thumbnailUrl": "https://...",
        "thumbnailKey": "library/subjects/...",
        "videosCount": 10,
        "topicsCount": 8,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "platform": {
          "id": "platform_uuid",
          "name": "Access Study",
          "slug": "smart-edu-global-library",
          "description": "...",
          "status": "active"
        },
        "class": {
          "id": "class_uuid",
          "name": "JSS 1",
          "order": 1
        }
      }
    ]
  }
}
```

---

## 3. Get Videos

Get paginated list of videos with optional filtering.

**Endpoint:** `GET /api/v1/explore/videos`

**Authentication:** Not required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `classId` | string | No | Filter by class ID |
| `subjectId` | string | No | Filter by subject ID |
| `topicId` | string | No | Filter by topic ID |
| `search` | string | No | Search in title or description |
| `page` | number | No | Page number (default: 1, min: 1) |
| `limit` | number | No | Items per page (default: 20, min: 1, max: 100) |

**Example Request:**
```
GET /api/v1/explore/videos?subjectId=subject_123&page=1&limit=20
```

**Response:**
```json
{
  "success": true,
  "message": "Videos retrieved successfully",
  "data": {
    "items": [
      {
        "id": "video_uuid",
        "title": "Algebra Basics",
        "description": "...",
        "videoUrl": "https://...",
        "thumbnailUrl": "https://...",
        "durationSeconds": 600,
        "sizeBytes": 52428800,
        "views": 250,
        "order": 1,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "topic": {
          "id": "topic_uuid",
          "title": "Introduction to Variables",
          "description": "...",
          "order": 1
        },
        "subject": {
          "id": "subject_uuid",
          "name": "Mathematics",
          "code": "MATH",
          "color": "#3B82F6",
          "thumbnailUrl": "https://...",
          "thumbnailKey": "library/subjects/..."
        },
        "platform": {
          "id": "platform_uuid",
          "name": "Access Study",
          "slug": "smart-edu-global-library",
          "description": "...",
          "status": "active"
        }
      }
    ],
    "meta": {
      "totalItems": 100,
      "totalPages": 5,
      "currentPage": 1,
      "limit": 20
    }
  }
}
```

---

## 4. Get Topics by Subject

Get all topics and their resources (videos, materials, assessments) for a specific subject. If user is authenticated, includes their assessment submissions.

**Endpoint:** `GET /api/v1/explore/topics/:subjectId`

**Authentication:** Optional (Bearer token) - If authenticated, includes user's assessment submissions

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `subjectId` | string | Yes | Subject ID |

**Example Request:**
```
GET /api/v1/explore/topics/subject_uuid_123
Authorization: Bearer <token> (optional)
```

**Response:**
```json
{
  "success": true,
  "message": "Subject resources retrieved successfully",
  "data": {
    "subject": {
      "id": "subject_uuid",
      "name": "Mathematics",
      "code": "MATH",
      "description": "Advanced mathematics",
      "color": "#3B82F6",
      "thumbnailUrl": "https://...",
      "thumbnailKey": "library/subjects/...",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z",
      "platform": {
        "id": "platform_uuid",
        "name": "Access Study",
        "slug": "smart-edu-global-library",
        "description": "...",
        "status": "active"
      },
      "class": {
        "id": "class_uuid",
        "name": "JSS 1",
        "order": 1
      }
    },
    "topics": [
      {
        "id": "topic_uuid",
        "title": "Introduction to Variables",
        "description": "...",
        "order": 1,
        "is_active": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z",
        "videos": [
          {
            "id": "video_uuid",
            "title": "Variables Explained",
            "description": "...",
            "videoUrl": "https://...",
            "thumbnailUrl": "https://...",
            "durationSeconds": 600,
            "sizeBytes": 52428800,
            "views": 250,
            "order": 1,
            "status": "published",
            "createdAt": "2024-01-15T10:30:00.000Z",
            "updatedAt": "2024-01-15T10:30:00.000Z",
            "uploadedBy": {
              "id": "user_uuid",
              "email": "teacher@example.com",
              "first_name": "John",
              "last_name": "Doe"
            }
          }
        ],
        "materials": [
          {
            "id": "material_uuid",
            "title": "Variables Study Guide",
            "description": "...",
            "url": "https://...",
            "s3Key": "library/materials/...",
            "materialType": "PDF",
            "sizeBytes": 5242880,
            "pageCount": 15,
            "status": "published",
            "order": 1,
            "createdAt": "2024-01-15T10:30:00.000Z",
            "updatedAt": "2024-01-15T10:30:00.000Z",
            "uploadedBy": {
              "id": "user_uuid",
              "email": "teacher@example.com",
              "first_name": "John",
              "last_name": "Doe"
            }
          }
        ],
        "assessments": [
          {
            "id": "assessment_uuid",
            "title": "Variables Quiz",
            "description": "...",
            "duration": 30,
            "passingScore": 60,
            "status": "ACTIVE",
            "createdAt": "2024-01-15T10:30:00.000Z",
            "updatedAt": "2024-01-15T10:30:00.000Z",
            "questionsCount": 10
          }
        ],
        "submissions": [
          {
            "id": "attempt_uuid",
            "assessmentId": "assessment_uuid",
            "assessmentTitle": "Variables Quiz",
            "attemptNumber": 1,
            "status": "completed",
            "dateTaken": "Wed, Jan 15 2025",
            "totalQuestions": 10,
            "maxScore": 10,
            "userScore": 8,
            "percentage": 80,
            "passed": true,
            "timeSpent": 1200,
            "passingScore": 60
          }
        ],
        "statistics": {
          "videosCount": 2,
          "materialsCount": 3,
          "assessmentsCount": 1,
          "totalViews": 500,
          "totalDuration": 1200,
          "totalVideoSize": 104857600,
          "totalMaterialSize": 15728640,
          "totalSize": 120586240,
          "totalQuestions": 10
        }
      }
    ],
    "statistics": {
      "topicsCount": 5,
      "videosCount": 10,
      "materialsCount": 15,
      "assessmentsCount": 3,
      "totalViews": 2500,
      "totalDuration": 6000,
      "totalSize": 524288000,
      "totalQuestions": 30
    }
  }
}
```

**Note:** The `submissions` array is only included if the user is authenticated. For unauthenticated requests, it will be an empty array.

---

## 5. Play Video

Get video details for playback with unique view tracking (YouTube-style). Each user is counted only once per video.

**Endpoint:** `GET /api/v1/explore/videos/:videoId/play`

**Authentication:** Required (Bearer token)

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoId` | string | Yes | Video ID |

**Example Request:**
```
GET /api/v1/explore/videos/video_uuid_123/play
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Video retrieved for playback",
  "data": {
    "id": "video_uuid",
    "title": "Algebra Basics",
    "description": "...",
    "videoUrl": "https://...",
    "thumbnailUrl": "https://...",
    "durationSeconds": 600,
    "sizeBytes": 52428800,
    "views": 251,
    "order": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "topic": {
      "id": "topic_uuid",
      "title": "Introduction to Variables",
      "description": "..."
    },
    "subject": {
      "id": "subject_uuid",
      "name": "Mathematics",
      "code": "MATH",
      "color": "#3B82F6",
      "thumbnailUrl": "https://..."
    },
    "platform": {
      "id": "platform_uuid",
      "name": "Access Study",
      "slug": "smart-edu-global-library",
      "description": "..."
    },
    "hasViewedBefore": false,
    "viewedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note:** 
- View count increments only on first play per user
- `hasViewedBefore` indicates if user has watched this video before
- `viewedAt` shows when the view was recorded (current time for new views, original time for repeat views)

---

## Error Responses

All endpoints may return these error responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "data": null
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null
}
```
