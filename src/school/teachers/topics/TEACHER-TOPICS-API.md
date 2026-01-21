# Teacher Topics API Documentation

**Base URL:** `/teachers/topics`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**Audience:** These endpoints are for **teachers** to manage topics within subjects in their school.

**Important:** Topics are organized directly under subjects using an `order` field for sequencing. Topics can contain videos, materials, assignments, assessments, live classes, and library resources.

---

## Table of Contents
1. [Create Topic](#1-create-topic)
2. [Get All Topics](#2-get-all-topics)
3. [Get Topics By Subject](#3-get-topics-by-subject)
4. [Get Topic By ID](#4-get-topic-by-id)
5. [Update Topic](#5-update-topic)
6. [Delete Topic](#6-delete-topic)
7. [Reorder Topics](#7-reorder-topics)
8. [Reorder Single Topic](#8-reorder-single-topic)
9. [Get Topic Content](#9-get-topic-content)
10. [Upload Video Lesson](#10-upload-video-lesson)
11. [Start Video Upload with Progress](#11-start-video-upload-with-progress)
12. [Get Video Upload Progress (SSE)](#12-get-video-upload-progress-sse)
13. [Get Video Upload Status (Polling)](#13-get-video-upload-status-polling)
14. [Upload Material](#14-upload-material)
15. [Start Material Upload with Progress](#15-start-material-upload-with-progress)
16. [Process Material for AI Chat](#16-process-material-for-ai-chat)
17. [Test S3 Connection](#17-test-s3-connection)

---

## IMPORTANT: Response Structure

**ALL ENDPOINTS** follow this exact response format:

```typescript
{
  success: boolean;      // true for success, false for error
  message: string;       // Human-readable message
  data: object | null;   // Response data (object on success, null on error)
}
```

**⚠️ Frontend developers:** Always check the `success` field first before accessing `data`. The `data` field will be `null` when `success` is `false`.

---

## 1. Create Topic

Create a new topic within a subject. The topic order is automatically assigned as the next available position.

**Endpoint:** `POST /teachers/topics`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "title": "Introduction to English Grammar",
  "description": "Basic concepts and fundamentals of English grammar",
  "instructions": "Watch the introduction videos and complete the practice problems",
  "is_active": true,
  "subject_id": "subject-uuid-1",
  "academic_session_id": "session-uuid-1"
}
```

**Request Body Structure:**
```typescript
{
  title: string;                    // Required: Topic title
  description?: string;             // Optional: Topic description
  instructions?: string;            // Optional: Instructions for students
  is_active?: boolean;              // Optional: Whether topic is active (default: true)
  subject_id: string;               // Required: Subject UUID (also accepts subjectId)
  academic_session_id?: string;    // Optional: Academic session UUID (uses current active session if not provided)
}
```

**Example Request:**
```
POST /teachers/topics
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Topic created successfully",
  "data": {
    "id": "topic-uuid-1",
    "title": "Introduction to English Grammar",
    "description": "Basic concepts and fundamentals of English grammar",
    "instructions": "Watch the introduction videos and complete the practice problems",
    "order": 1,
    "is_active": true,
    "subject": {
      "id": "subject-uuid-1",
      "name": "English Language",
      "code": "ENG101",
      "color": "#3B82F6"
    },
    "school": {
      "id": "school-uuid-1",
      "school_name": "Example School"
    },
    "academicSession": {
      "id": "session-uuid-1",
      "academic_year": "2024/2025",
      "term": "first"
    },
    "createdBy": {
      "id": "user-uuid-1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@school.edu.ng"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  },
  "statusCode": 201
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    order: number;
    is_active: boolean;
    subject: {
      id: string;
      name: string;
      code: string | null;
      color: string;
    };
    school: {
      id: string;
      school_name: string;
    };
    academicSession: {
      id: string;
      academic_year: string;
      term: string;
    };
    createdBy: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    createdAt: Date;
    updatedAt: Date;
  };
  statusCode: number;
}
```

**Error Responses:**

**400 Bad Request - Duplicate Title:**
```json
{
  "success": false,
  "message": "Topic with title \"Introduction to English Grammar\" already exists in this subject",
  "data": null
}
```

**404 Not Found - Subject:**
```json
{
  "success": false,
  "message": "Subject not found or does not belong to this school and academic session",
  "data": null
}
```

**404 Not Found - Academic Session:**
```json
{
  "success": false,
  "message": "No active academic session found for this school",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 2. Get All Topics

Get all topics in the school, optionally filtered by subject and academic session.

**Endpoint:** `GET /teachers/topics`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subjectId | string | No | Filter by subject ID |
| academicSessionId | string | No | Filter by academic session ID |

**Example Request:**
```
GET /teachers/topics?subjectId=subject-uuid-1&academicSessionId=session-uuid-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topics retrieved successfully",
  "data": [
    {
      "id": "topic-uuid-1",
      "title": "Introduction to English Grammar",
      "description": "Basic concepts and fundamentals of English grammar",
      "instructions": "Watch the introduction videos and complete the practice problems",
      "order": 1,
      "is_active": true,
      "subject": {
        "id": "subject-uuid-1",
        "name": "English Language",
        "code": "ENG101",
        "color": "#3B82F6"
      },
      "school": {
        "id": "school-uuid-1",
        "school_name": "Example School"
      },
      "academicSession": {
        "id": "session-uuid-1",
        "academic_year": "2024/2025",
        "term": "first"
      },
      "createdBy": {
        "id": "user-uuid-1",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.edu.ng"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: Array<{
    id: string;
    title: string;
    description: string | null;
    instructions: string | null;
    order: number;
    is_active: boolean;
    subject: {
      id: string;
      name: string;
      code: string | null;
      color: string;
    };
    school: {
      id: string;
      school_name: string;
    };
    academicSession: {
      id: string;
      academic_year: string;
      term: string;
    };
    createdBy: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    createdAt: Date;
    updatedAt: Date;
  }>;
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 3. Get Topics By Subject

Get all active topics for a specific subject, ordered by their order field.

**Endpoint:** `GET /teachers/topics/subject/:subjectId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subjectId | string | Yes | Subject UUID |

**Example Request:**
```
GET /teachers/topics/subject/subject-uuid-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topics retrieved successfully",
  "data": [
    {
      "id": "topic-uuid-1",
      "title": "Introduction to English Grammar",
      "description": "Basic concepts and fundamentals of English grammar",
      "instructions": "Watch the introduction videos and complete the practice problems",
      "order": 1,
      "is_active": true,
      "subject": {
        "id": "subject-uuid-1",
        "name": "English Language",
        "code": "ENG101",
        "color": "#3B82F6"
      },
      "school": {
        "id": "school-uuid-1",
        "school_name": "Example School"
      },
      "academicSession": {
        "id": "session-uuid-1",
        "academic_year": "2024/2025",
        "term": "first"
      },
      "createdBy": {
        "id": "user-uuid-1",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@school.edu.ng"
      },
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

**Response Structure:**
Same as [Get All Topics](#2-get-all-topics) response structure.

**Important Notes:**

1. **Active Topics Only:** Only returns topics where `is_active` is `true`
2. **Ordered:** Results are ordered by the `order` field in ascending order
3. **Subject Filter:** Only returns topics for the specified subject

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 4. Get Topic By ID

Get detailed information about a specific topic.

**Endpoint:** `GET /teachers/topics/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Topic UUID |

**Example Request:**
```
GET /teachers/topics/topic-uuid-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topic retrieved successfully",
  "data": {
    "id": "topic-uuid-1",
    "title": "Introduction to English Grammar",
    "description": "Basic concepts and fundamentals of English grammar",
    "instructions": "Watch the introduction videos and complete the practice problems",
    "order": 1,
    "is_active": true,
    "subject": {
      "id": "subject-uuid-1",
      "name": "English Language",
      "code": "ENG101",
      "color": "#3B82F6"
    },
    "school": {
      "id": "school-uuid-1",
      "school_name": "Example School"
    },
    "academicSession": {
      "id": "session-uuid-1",
      "academic_year": "2024/2025",
      "term": "first"
    },
    "createdBy": {
      "id": "user-uuid-1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@school.edu.ng"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response Structure:**
Same as [Get All Topics](#2-get-all-topics) response structure (single object instead of array).

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Topic not found",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 5. Update Topic

Update an existing topic's information.

**Endpoint:** `PATCH /teachers/topics/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Topic UUID |

**Request Body:**
```json
{
  "title": "Advanced English Grammar",
  "description": "Updated description",
  "is_active": true
}
```

**Request Body Structure:**
```typescript
{
  title?: string;          // Optional: Topic title
  description?: string;    // Optional: Topic description
  instructions?: string;  // Optional: Instructions for students
  is_active?: boolean;     // Optional: Whether topic is active
}
```

**Example Request:**
```
PATCH /teachers/topics/topic-uuid-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topic updated successfully",
  "data": {
    "id": "topic-uuid-1",
    "title": "Advanced English Grammar",
    "description": "Updated description",
    "instructions": "Watch the introduction videos and complete the practice problems",
    "order": 1,
    "is_active": true,
    "subject": {
      "id": "subject-uuid-1",
      "name": "English Language",
      "code": "ENG101",
      "color": "#3B82F6"
    },
    "school": {
      "id": "school-uuid-1",
      "school_name": "Example School"
    },
    "academicSession": {
      "id": "session-uuid-1",
      "academic_year": "2024/2025",
      "term": "first"
    },
    "createdBy": {
      "id": "user-uuid-1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@school.edu.ng"
    },
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

**Response Structure:**
Same as [Get Topic By ID](#4-get-topic-by-id) response structure.

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Topic not found",
  "data": null
}
```

**400 Bad Request - Duplicate Title:**
```json
{
  "success": false,
  "message": "Topic with title \"Advanced English Grammar\" already exists in this subject",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 6. Delete Topic

Delete a topic. Topic must not have any associated content (videos, materials, assignments, etc.).

**Endpoint:** `DELETE /teachers/topics/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Topic UUID |

**Example Request:**
```
DELETE /teachers/topics/topic-uuid-1
```

**Success Response (204 No Content):**
```
No response body
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Topic not found",
  "data": null
}
```

**400 Bad Request - Has Content:**
```json
{
  "success": false,
  "message": "Cannot delete topic. It has 5 video(s), 3 material(s), and 2 assignment(s) associated with it.",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 7. Reorder Topics

Reorder multiple topics within a subject by providing an array of topic IDs with their new order positions.

**Endpoint:** `POST /teachers/topics/reorder/:subjectId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subjectId | string | Yes | Subject UUID |

**Request Body:**
```json
{
  "topics": [
    { "id": "topic-uuid-1", "order": 1 },
    { "id": "topic-uuid-2", "order": 2 },
    { "id": "topic-uuid-3", "order": 3 }
  ]
}
```

**Request Body Structure:**
```typescript
{
  topics: Array<{
    id: string;      // Required: Topic UUID
    order: number;   // Required: New order position (minimum: 1)
  }>;
}
```

**Example Request:**
```
POST /teachers/topics/reorder/subject-uuid-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topics reordered successfully",
  "data": null
}
```

**Error Responses:**

**404 Not Found - Subject:**
```json
{
  "success": false,
  "message": "Subject not found",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "No topics found for this subject",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 8. Reorder Single Topic

Reorder a single topic to a new position (useful for drag-and-drop operations).

**Endpoint:** `PATCH /teachers/topics/reorder/:subjectId/:topicId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| subjectId | string | Yes | Subject UUID |
| topicId | string | Yes | Topic UUID to reorder |

**Request Body:**
```json
{
  "newPosition": 3
}
```

**Request Body Structure:**
```typescript
{
  newPosition: number;  // Required: New position (1-based, must be within valid range)
}
```

**Example Request:**
```
PATCH /teachers/topics/reorder/subject-uuid-1/topic-uuid-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topic moved successfully",
  "data": null
}
```

**Error Responses:**

**404 Not Found - Subject:**
```json
{
  "success": false,
  "message": "Subject not found",
  "data": null
}
```

**404 Not Found - Topic:**
```json
{
  "success": false,
  "message": "Topic not found",
  "data": null
}
```

**400 Bad Request - Invalid Position:**
```json
{
  "success": false,
  "message": "New position must be between 1 and 5",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 9. Get Topic Content

Get all content associated with a topic including videos, materials, assignments, assessments, live classes, and library resources.

**Endpoint:** `GET /teachers/topics/:id/content`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Topic UUID |

**Example Request:**
```
GET /teachers/topics/topic-uuid-1/content
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topic content retrieved successfully",
  "data": {
    "topicId": "topic-uuid-1",
    "topicTitle": "Introduction to English Grammar",
    "topicDescription": "Basic concepts and fundamentals of English grammar",
    "topicOrder": 1,
    "contentSummary": {
      "totalVideos": 5,
      "totalMaterials": 3,
      "totalAssignments": 2,
      "totalQuizzes": 1,
      "totalLiveClasses": 1,
      "totalLibraryResources": 2,
      "totalContent": 14
    },
    "videos": [
      {
        "id": "video-uuid-1",
        "title": "Introduction to Grammar",
        "description": "Basic grammar concepts",
        "url": "https://example.com/video.mp4",
        "order": 1,
        "duration": "00:15:30",
        "thumbnail": null,
        "size": "150 MB",
        "views": 120,
        "status": "published",
        "createdAt": "2024-01-16T10:00:00.000Z",
        "updatedAt": "2024-01-16T10:00:00.000Z"
      }
    ],
    "materials": [
      {
        "id": "material-uuid-1",
        "title": "Grammar Worksheet",
        "description": "Practice exercises",
        "url": "https://example.com/worksheet.pdf",
        "size": "2 MB",
        "downloads": 45,
        "status": "published",
        "createdAt": "2024-01-16T11:00:00.000Z",
        "updatedAt": "2024-01-16T11:00:00.000Z"
      }
    ],
    "assignments": [
      {
        "id": "assignment-uuid-1",
        "title": "Grammar Assignment 1",
        "description": "Complete the exercises",
        "dueDate": "2024-02-01T23:59:59.000Z",
        "status": "published",
        "maxScore": 100,
        "timeLimit": 60,
        "createdAt": "2024-01-17T10:00:00.000Z",
        "updatedAt": "2024-01-17T10:00:00.000Z"
      }
    ],
    "assessments": [
      {
        "id": "assessment-uuid-1",
        "title": "Grammar Quiz",
        "description": "Test your knowledge",
        "duration": 30,
        "totalQuestions": 20,
        "passingScore": 70,
        "status": "published",
        "createdAt": "2024-01-18T10:00:00.000Z",
        "updatedAt": "2024-01-18T10:00:00.000Z"
      }
    ],
    "liveClasses": [
      {
        "id": "liveclass-uuid-1",
        "title": "Grammar Live Session",
        "description": "Interactive grammar lesson",
        "meetingUrl": "https://meet.example.com/session-123",
        "startTime": "2024-01-25T14:00:00.000Z",
        "endTime": "2024-01-25T15:00:00.000Z",
        "status": "scheduled",
        "maxParticipants": 30,
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z"
      }
    ],
    "libraryResources": [
      {
        "id": "resource-uuid-1",
        "title": "Grammar Reference Guide",
        "description": "Comprehensive grammar guide",
        "resourceType": "document",
        "url": "https://example.com/guide.pdf",
        "status": "published",
        "format": "pdf",
        "createdAt": "2024-01-19T10:00:00.000Z",
        "updatedAt": "2024-01-19T10:00:00.000Z"
      }
    ],
    "createdAt": "Jan 15, 2024",
    "updatedAt": "Jan 20, 2024"
  }
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    topicId: string;
    topicTitle: string;
    topicDescription: string | null;
    topicOrder: number;
    contentSummary: {
      totalVideos: number;
      totalMaterials: number;
      totalAssignments: number;
      totalQuizzes: number;
      totalLiveClasses: number;
      totalLibraryResources: number;
      totalContent: number;
    };
    videos: Array<{
      id: string;
      title: string;
      description: string | null;
      url: string;
      order: number;
      duration: string | null;
      thumbnail: any | null;
      size: string | null;
      views: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    materials: Array<{
      id: string;
      title: string;
      description: string | null;
      url: string;
      size: string | null;
      downloads: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    assignments: Array<{
      id: string;
      title: string;
      description: string | null;
      dueDate: Date | null;
      status: string;
      maxScore: number | null;
      timeLimit: number | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    assessments: Array<{
      id: string;
      title: string;
      description: string | null;
      duration: number | null;
      totalQuestions: number | null;
      passingScore: number | null;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    liveClasses: Array<{
      id: string;
      title: string;
      description: string | null;
      meetingUrl: string;
      startTime: Date;
      endTime: Date;
      status: string;
      maxParticipants: number | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    libraryResources: Array<{
      id: string;
      title: string;
      description: string | null;
      resourceType: string;
      url: string | null;
      status: string;
      format: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Topic not found",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 10. Upload Video Lesson

Upload a video lesson for a topic. Supports video file and optional thumbnail.

**Endpoint:** `POST /teachers/topics/upload-video`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Video lesson title |
| description | string | No | Video lesson description |
| subject_id | string | Yes | Subject UUID |
| topic_id | string | Yes | Topic UUID |
| video | file | Yes | Video file (MP4, MOV, AVI, etc.) |
| thumbnail | file | No | Thumbnail image (JPG, PNG) |

**Example Request:**
```
POST /teachers/topics/upload-video
Content-Type: multipart/form-data

Form Data:
- title: "Introduction to Algebra Basics"
- description: "Learn the fundamental concepts of algebra"
- subject_id: "subject-uuid-1"
- topic_id: "topic-uuid-1"
- video: [video file]
- thumbnail: [thumbnail image]
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Video lesson uploaded successfully",
  "data": {
    "id": "video-uuid-1",
    "title": "Introduction to Algebra Basics",
    "description": "Learn the fundamental concepts of algebra",
    "url": "https://s3.amazonaws.com/bucket/video.mp4",
    "thumbnail": {
      "secure_url": "https://s3.amazonaws.com/bucket/thumb.jpg",
      "public_id": "thumb_id"
    },
    "size": "150 MB",
    "duration": "00:15:30",
    "status": "published",
    "subject_id": "subject-uuid-1",
    "topic_id": "topic-uuid-1",
    "uploaded_by": "user-uuid-1",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "statusCode": 201
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    thumbnail: any | null;
    size: string;
    duration: string;
    status: string;
    subject_id: string;
    topic_id: string;
    uploaded_by: string;
    createdAt: Date;
    updatedAt: Date;
  };
  statusCode: number;
}
```

**Error Responses:**

**400 Bad Request - Missing Video:**
```json
{
  "success": false,
  "message": "Video file is required",
  "data": null
}
```

**400 Bad Request - Invalid File:**
```json
{
  "success": false,
  "message": "Invalid video file format",
  "data": null
}
```

**404 Not Found - Subject/Topic:**
```json
{
  "success": false,
  "message": "Subject or topic not found",
  "data": null
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "message": "File too large",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 11. Start Video Upload with Progress

Start a video upload session and get a session ID for tracking progress. Use this for large file uploads.

**Endpoint:** `POST /teachers/topics/upload-video/start`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**

Same as [Upload Video Lesson](#10-upload-video-lesson).

**Example Request:**
```
POST /teachers/topics/upload-video/start
```

**Success Response (202):**
```json
{
  "success": true,
  "message": "Upload started",
  "data": {
    "sessionId": "session-uuid-123"
  },
  "statusCode": 202
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    sessionId: string;  // Use this to track upload progress
  };
  statusCode: number;
}
```

**Next Steps:**

After receiving the `sessionId`, use one of these methods to track progress:
- **SSE Stream:** `GET /teachers/topics/upload-progress/:sessionId` (Server-Sent Events)
- **Polling:** `GET /teachers/topics/video-upload-progress/:sessionId` (HTTP polling)

**Error Responses:**

Same as [Upload Video Lesson](#10-upload-video-lesson) error responses.

---

## 12. Get Video Upload Progress (SSE)

Stream video upload progress using Server-Sent Events (SSE). Use this for real-time progress updates.

**Endpoint:** `GET /teachers/topics/upload-progress/:sessionId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Upload session ID from start endpoint |

**Example Request:**
```
GET /teachers/topics/upload-progress/session-uuid-123
Accept: text/event-stream
```

**Success Response (200 - SSE Stream):**
```
data: {"progress": 25, "stage": "uploading", "message": "Uploading video file...", "data": null}

data: {"progress": 50, "stage": "uploading", "message": "Uploading video file...", "data": null}

data: {"progress": 75, "stage": "processing", "message": "Processing video...", "data": null}

data: {"progress": 100, "stage": "completed", "message": "Upload completed successfully", "data": {"videoId": "video-uuid-1"}}
```

**Progress Object Structure:**
```typescript
{
  progress: number;  // 0-100
  stage: 'uploading' | 'processing' | 'completed' | 'error';
  message: string;
  data?: any;        // Video data when completed
  error?: string;    // Error message if stage is 'error'
}
```

**Important Notes:**

1. **SSE Format:** Response is a Server-Sent Events stream
2. **Auto-Complete:** Stream automatically closes when `stage` is `completed` or `error`
3. **Real-time Updates:** Progress updates are sent as they occur

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Upload session not found",
  "data": null
}
```

---

## 13. Get Video Upload Status (Polling)

Get current video upload progress status. Use this for HTTP polling instead of SSE.

**Endpoint:** `GET /teachers/topics/video-upload-progress/:sessionId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| sessionId | string | Yes | Upload session ID from start endpoint |

**Example Request:**
```
GET /teachers/topics/video-upload-progress/session-uuid-123
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Upload status retrieved",
  "data": {
    "progress": 75,
    "stage": "processing",
    "message": "Processing video...",
    "data": null
  },
  "statusCode": 200
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    progress: number;
    stage: 'uploading' | 'processing' | 'completed' | 'error';
    message: string;
    data?: any;
    error?: string;
  };
  statusCode: number;
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Upload session not found",
  "data": null
}
```

---

## 14. Upload Material

Upload a material file (PDF, DOC, DOCX, PPT, PPTX) for a topic.

**Endpoint:** `POST /teachers/topics/upload-material`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Material title |
| description | string | No | Material description |
| subject_id | string | Yes | Subject UUID |
| topic_id | string | Yes | Topic UUID |
| material | file | Yes | Material file (PDF, DOC, DOCX, PPT, PPTX) |

**Example Request:**
```
POST /teachers/topics/upload-material
Content-Type: multipart/form-data

Form Data:
- title: "Grammar Worksheet"
- description: "Practice exercises"
- subject_id: "subject-uuid-1"
- topic_id: "topic-uuid-1"
- material: [PDF file]
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Material uploaded successfully",
  "data": {
    "id": "material-uuid-1",
    "title": "Grammar Worksheet",
    "description": "Practice exercises",
    "url": "https://s3.amazonaws.com/bucket/worksheet.pdf",
    "thumbnail": null,
    "size": "2 MB",
    "fileType": "pdf",
    "originalName": "worksheet.pdf",
    "downloads": 0,
    "status": "published",
    "order": 1,
    "subject_id": "subject-uuid-1",
    "topic_id": "topic-uuid-1",
    "uploaded_by": "user-uuid-1",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  },
  "statusCode": 201
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    title: string;
    description: string | null;
    url: string;
    thumbnail: any | null;
    size: string;
    fileType: string;
    originalName: string;
    downloads: number;
    status: string;
    order: number;
    subject_id: string;
    topic_id: string;
    uploaded_by: string;
    createdAt: Date;
    updatedAt: Date;
  };
  statusCode: number;
}
```

**Error Responses:**

**400 Bad Request - Missing File:**
```json
{
  "success": false,
  "message": "Material file is required",
  "data": null
}
```

**400 Bad Request - Invalid File:**
```json
{
  "success": false,
  "message": "Invalid file format. Supported formats: PDF, DOC, DOCX, PPT, PPTX",
  "data": null
}
```

**404 Not Found - Subject/Topic:**
```json
{
  "success": false,
  "message": "Subject or topic not found",
  "data": null
}
```

**413 Payload Too Large:**
```json
{
  "success": false,
  "message": "File too large",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 15. Start Material Upload with Progress

Start a material upload session and get a session ID for tracking progress.

**Endpoint:** `POST /teachers/topics/upload-material/start`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "multipart/form-data"
}
```

**Form Data:**

Same as [Upload Material](#14-upload-material).

**Example Request:**
```
POST /teachers/topics/upload-material/start
```

**Success Response (202):**
```json
{
  "success": true,
  "message": "Upload started",
  "data": {
    "sessionId": "session-uuid-456"
  },
  "statusCode": 202
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    sessionId: string;  // Use this to track upload progress
  };
  statusCode: number;
}
```

**Note:** Material upload progress can be tracked using the same SSE or polling endpoints as video uploads (replace `video-upload-progress` with `material-upload-progress` if available, or use the same session tracking mechanism).

**Error Responses:**

Same as [Upload Material](#14-upload-material) error responses.

---

## 16. Process Material for AI Chat

Process a PDF material for AI chat by chunking and embedding it. This enables the material to be used in AI chat conversations.

**Endpoint:** `POST /teachers/topics/process-for-chat/:materialId`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| materialId | string | Yes | PDF Material UUID |

**Example Request:**
```
POST /teachers/topics/process-for-chat/material-uuid-1
```

**Success Response (202):**
```json
{
  "success": true,
  "message": "Processing started or already processed",
  "data": null
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: null;
}
```

**Important Notes:**

1. **Asynchronous Processing:** Processing happens in the background
2. **Idempotent:** Safe to call multiple times - won't reprocess if already processed
3. **PDF Only:** Only PDF materials can be processed for AI chat

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Material not found",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Material is not a PDF or cannot be processed",
  "data": null
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 17. Test S3 Connection

Test the AWS S3 connection to verify file upload capabilities.

**Endpoint:** `GET /teachers/topics/test-s3-connection`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /teachers/topics/test-s3-connection
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "S3 connection test completed",
  "data": {
    "connected": true,
    "timestamp": "2024-01-20T10:00:00.000Z",
    "message": "✅ AWS S3 connection successful!"
  }
}
```

**Response Structure:**
```typescript
{
  success: boolean;
  message: string;
  data: {
    connected: boolean;
    timestamp: string;
    message: string;
  };
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "S3 connection test failed",
  "error": "Error message here",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

---

## Common Response Format

**ALL ENDPOINTS** follow this structure:

```typescript
{
  success: boolean;      // true = success, false = error
  message: string;       // Human-readable message
  data: object | null;   // Response data (object when success=true, null when success=false)
  statusCode?: number;   // HTTP status code (optional)
}
```

### Success Response Pattern
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // ... response data here ...
  },
  "statusCode": 200
}
```

### Error Response Pattern
```json
{
  "success": false,
  "message": "Error description here",
  "data": null
}
```

**⚠️ CRITICAL FOR FRONTEND:**
- **Always check `success` field first**
- **Only access `data` when `success === true`**
- **`data` will always be `null` when `success === false`**

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 202 | Accepted - Request accepted for processing (async operations) |
| 204 | No Content - Resource deleted/updated successfully (no response body) |
| 400 | Bad Request - Invalid request data or validation error |
| 401 | Unauthorized - Missing or invalid authentication token |
| 404 | Not Found - Resource not found (topic, subject, material) |
| 413 | Payload Too Large - File size exceeds limit |
| 500 | Internal Server Error - Server error occurred |

---

## Data Types & Enums

### Upload Stage
```typescript
type UploadStage = 'uploading' | 'processing' | 'completed' | 'error';
```

### Content Status
```typescript
type ContentStatus = 'draft' | 'published' | 'archived';
```

### Material File Types
```typescript
type MaterialFileType = 'pdf' | 'doc' | 'docx' | 'ppt' | 'pptx';
```

### Video File Types
```typescript
type VideoFileType = 'mp4' | 'mov' | 'avi' | 'mkv' | 'webm';
```

---

## Example Usage (JavaScript/TypeScript)

### Creating a Topic

```typescript
const createTopic = async (topicData) => {
  try {
    const response = await fetch('/teachers/topics', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(topicData)
    });

    const result = await response.json();
    
    if (result.success) {
      const topic = result.data;
      console.log('Topic created:', topic.title);
      return topic;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};
```

### Uploading Video with Progress Tracking

```typescript
const uploadVideoWithProgress = async (formData) => {
  try {
    // Start upload session
    const startResponse = await fetch('/teachers/topics/upload-video/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const startResult = await startResponse.json();
    
    if (!startResult.success) {
      showToast('error', startResult.message);
      return;
    }

    const sessionId = startResult.data.sessionId;
    
    // Track progress via SSE
    const eventSource = new EventSource(
      `/teachers/topics/upload-progress/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    eventSource.onmessage = (event) => {
      const progress = JSON.parse(event.data);
      console.log(`Upload progress: ${progress.progress}% - ${progress.message}`);
      
      if (progress.stage === 'completed') {
        showToast('success', 'Video uploaded successfully');
        eventSource.close();
      } else if (progress.stage === 'error') {
        showToast('error', progress.error || 'Upload failed');
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to start upload');
  }
};
```

### Getting Topic Content

```typescript
const fetchTopicContent = async (topicId) => {
  try {
    const response = await fetch(`/teachers/topics/${topicId}/content`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { contentSummary, videos, materials, assignments } = result.data;
      console.log('Total content:', contentSummary.totalContent);
      console.log('Videos:', videos.length);
      console.log('Materials:', materials.length);
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
};
```

### Reordering Topics

```typescript
const reorderTopics = async (subjectId, topicOrders) => {
  try {
    const response = await fetch(`/teachers/topics/reorder/${subjectId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ topics: topicOrders })
    });

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Topics reordered successfully');
      return true;
    } else {
      showToast('error', result.message);
      return false;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to reorder topics');
    return false;
  }
};
```

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in all requests
2. **Response Checking:** Always check `success` field before accessing `data`
3. **Error Handling:** Display user-friendly error messages via toasters
4. **File Uploads:** Use FormData for multipart/form-data requests
5. **Progress Tracking:** Use SSE for real-time progress or polling for simpler implementation
6. **File Validation:** Validate file types and sizes on frontend before upload
7. **Loading States:** Show loading indicators during API calls and file uploads
8. **Order Management:** Topics are automatically ordered, but can be manually reordered
9. **Content Management:** Topics can contain multiple types of content (videos, materials, assignments, etc.)
10. **AI Chat Processing:** PDF materials must be processed before they can be used in AI chat

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 20, 2026

