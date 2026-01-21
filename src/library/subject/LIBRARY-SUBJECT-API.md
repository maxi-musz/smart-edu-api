# Library Subject API Documentation

**Base URL:** `/api/v1/library/subject`

**Authentication:** All endpoints require Bearer token authentication (JWT) via `LibraryJwtGuard`

**Audience:** These endpoints are for **library owners** to manage subjects, topics, and content in their library platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Content Structure](#content-structure)
3. [Authentication](#authentication)
4. [Subject Management](#subject-management)
   - [Create Subject](#1-create-subject)
   - [Update Subject](#2-update-subject)
   - [Update Subject Thumbnail](#3-update-subject-thumbnail)
5. [Topic Management](#topic-management)
   - [Create Topic](#4-create-topic)
   - [Update Topic](#5-update-topic)
   - [Get Topic Materials](#6-get-topic-materials)
6. [Content Management](#content-management)
   - [Upload Video](#7-upload-video)
   - [Upload Material](#8-upload-material)
   - [Create Link](#9-create-link)
   - [Update Video](#10-update-video)
   - [Delete Content](#11-delete-content)
7. [Integration Flow](#integration-flow)
8. [Error Responses](#error-responses)

---

## Overview

The Library Subject API provides a simplified two-level hierarchy for organizing educational content:

```
Subject → Topic → Content
```

**Key Features:**
- **Simplified Structure**: No chapters - subjects contain topics directly
- **Flexible Content**: Topics can contain videos, materials (PDFs, DOCs, PPTs), and external links
- **Progress Tracking**: Video and material uploads support real-time progress tracking via SSE
- **Platform Isolation**: All content is scoped to the library owner's platform

---

## Content Structure

The library content structure follows this hierarchy:

```
Library Platform
└── Class (e.g., "Grade 10", "JSS 1")
    └── Subject (e.g., "Mathematics", "English")
        └── Topic (e.g., "Introduction to Variables", "Grammar Basics")
            ├── Videos (MP4 files)
            ├── Materials (PDF, DOC, DOCX, PPT, PPTX)
            ├── Links (External resources)
            └── Assessments (CBT quizzes)
```

**Important Notes:**
- **No Chapters**: The chapter level has been removed for simplicity
- **Direct Relationship**: Topics belong directly to subjects
- **Ordering**: Topics use an `order` field for sequencing within each subject
- **Content Types**: Each topic can contain multiple types of content simultaneously

---

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

The token must be issued for a `LibraryResourceUser` account.

---

## Subject Management

### 1. Create Subject

Create a new subject under a library class.

**Endpoint:** `POST /api/v1/library/subject/createsubject`

**Content-Type:** `multipart/form-data`

**Request Body:**
```typescript
{
  classId: string;           // Required: Library class ID
  name: string;              // Required: Subject name (max 200 chars)
  code?: string;             // Optional: Subject code (max 20 chars, must be unique in platform)
  color?: string;            // Optional: Hex color (default: #3B82F6)
  description?: string;       // Optional: Subject description (max 1000 chars)
  thumbnail?: File;           // Optional: Thumbnail image (JPEG, PNG, GIF, WEBP - max 5MB)
}
```

**Example Request (cURL):**
```bash
curl -X POST "https://api.example.com/api/v1/library/subject/createsubject" \
  -H "Authorization: Bearer <token>" \
  -F "classId=cmjbnj4zw0002vlevol2u657f" \
  -F "name=Mathematics" \
  -F "code=MATH" \
  -F "color=#3B82F6" \
  -F "description=Advanced mathematics including algebra, calculus, and geometry" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

**Example Request (FormData - JavaScript):**
```javascript
const formData = new FormData();
formData.append('classId', 'cmjbnj4zw0002vlevol2u657f');
formData.append('name', 'Mathematics');
formData.append('code', 'MATH');
formData.append('color', '#3B82F6');
formData.append('description', 'Advanced mathematics including algebra, calculus, and geometry');

// Optional thumbnail
if (thumbnailFile) {
  formData.append('thumbnail', thumbnailFile);
}

const response = await fetch('https://api.example.com/api/v1/library/subject/createsubject', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "id": "subject-uuid-1",
    "platformId": "platform-uuid-1",
    "classId": "class-uuid-1",
    "name": "Mathematics",
    "code": "MATH",
    "color": "#3B82F6",
    "description": "Advanced mathematics including algebra, calculus, and geometry",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/library/subjects/thumbnails/1234567890_thumbnail.jpg",
    "thumbnailKey": "library/subjects/thumbnails/1234567890_thumbnail.jpg",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "class": {
      "id": "class-uuid-1",
      "name": "Grade 10",
      "order": 10
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid data, duplicate code, invalid file type/size
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Class not found or library user not found
- **500 Internal Server Error**: Server error

---

### 2. Update Subject

Update subject details (name, code, color, description).

**Endpoint:** `PATCH /api/v1/library/subject/updatesubject/:subjectId`

**Content-Type:** `application/json`

**Path Parameters:**
- `subjectId` (string, required): Subject ID

**Request Body:**
```typescript
{
  name?: string;             // Optional: Subject name (max 200 chars)
  code?: string;             // Optional: Subject code (max 20 chars, must be unique in platform)
  color?: string;            // Optional: Hex color
  description?: string;       // Optional: Subject description (max 1000 chars)
}
```

**Example Request:**
```bash
curl -X PATCH "https://api.example.com/api/v1/library/subject/updatesubject/subject-uuid-1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Mathematics",
    "code": "MATH101",
    "color": "#FF5733",
    "description": "Updated description"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {
    "id": "subject-uuid-1",
    "name": "Advanced Mathematics",
    "code": "MATH101",
    "color": "#FF5733",
    "description": "Updated description",
    "class": {
      "id": "class-uuid-1",
      "name": "Grade 10",
      "order": 10
    }
  }
}
```

---

### 3. Update Subject Thumbnail

Update only the subject thumbnail image.

**Endpoint:** `PATCH /api/v1/library/subject/updatesubjectthumbnail/:subjectId`

**Content-Type:** `multipart/form-data`

**Path Parameters:**
- `subjectId` (string, required): Subject ID

**Request Body:**
```typescript
{
  thumbnail: File;  // Required: Thumbnail image (JPEG, PNG, GIF, WEBP - max 5MB)
}
```

**Example Request:**
```bash
curl -X PATCH "https://api.example.com/api/v1/library/subject/updatesubjectthumbnail/subject-uuid-1" \
  -H "Authorization: Bearer <token>" \
  -F "thumbnail=@/path/to/new-thumbnail.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subject thumbnail updated successfully",
  "data": {
    "id": "subject-uuid-1",
    "thumbnailUrl": "https://s3.amazonaws.com/bucket/library/subjects/thumbnails/1234567890_new_thumbnail.jpg",
    "thumbnailKey": "library/subjects/thumbnails/1234567890_new_thumbnail.jpg"
  }
}
```

---

## Topic Management

### 4. Create Topic

Create a new topic under a subject. Topics are the organizational unit that contains all content.

**Endpoint:** `POST /api/v1/library/subject/topic/createtopic`

**Content-Type:** `application/json`

**Request Body:**
```typescript
{
  subjectId: string;         // Required: Library subject ID
  title: string;             // Required: Topic title (max 200 chars)
  description?: string;       // Optional: Topic description (max 2000 chars)
  order?: number;            // Optional: Order/sequence number (default: auto-incremented)
  is_active?: boolean;       // Optional: Whether topic is active (default: true)
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/v1/library/subject/topic/createtopic" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "subject-uuid-1",
    "title": "Introduction to Variables",
    "description": "Learn about variables, their types, and how to use them in algebraic expressions",
    "order": 1,
    "is_active": true
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Topic created successfully",
  "data": {
    "id": "topic-uuid-1",
    "platformId": "platform-uuid-1",
    "subjectId": "subject-uuid-1",
    "title": "Introduction to Variables",
    "description": "Learn about variables, their types, and how to use them in algebraic expressions",
    "order": 1,
    "is_active": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "subject": {
      "id": "subject-uuid-1",
      "name": "Mathematics",
      "code": "MATH",
      "class": {
        "id": "class-uuid-1",
        "name": "Grade 10"
      }
    }
  }
}
```

**Error Responses:**
- **400 Bad Request**: Invalid data or validation error
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Subject not found or does not belong to user's platform
- **500 Internal Server Error**: Server error

---

### 5. Update Topic

Update topic details (title, description, order, is_active).

**Endpoint:** `PATCH /api/v1/library/subject/topic/updatetopic/:topicId`

**Content-Type:** `application/json`

**Path Parameters:**
- `topicId` (string, required): Topic ID

**Request Body:**
```typescript
{
  title?: string;            // Optional: Topic title (max 200 chars)
  description?: string;      // Optional: Topic description (max 2000 chars)
  order?: number;            // Optional: Order/sequence number
  is_active?: boolean;       // Optional: Whether topic is active
}
```

**Example Request:**
```bash
curl -X PATCH "https://api.example.com/api/v1/library/subject/topic/updatetopic/topic-uuid-1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Variables and Functions",
    "description": "Updated description",
    "order": 2
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topic updated successfully",
  "data": {
    "id": "topic-uuid-1",
    "title": "Advanced Variables and Functions",
    "description": "Updated description",
    "order": 2,
    "subject": {
      "id": "subject-uuid-1",
      "name": "Mathematics",
      "code": "MATH"
    }
  }
}
```

---

### 6. Get Topic Materials

Retrieve all content associated with a topic, including videos, materials, links, assignments, comments, and CBT assessments.

**Endpoint:** `GET /api/v1/library/subject/topic/getmaterials/:topicId`

**Path Parameters:**
- `topicId` (string, required): Topic ID

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/v1/library/subject/topic/getmaterials/topic-uuid-1" \
  -H "Authorization: Bearer <token>"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Topic materials retrieved successfully",
  "data": {
    "topic": {
      "id": "topic-uuid-1",
      "title": "Introduction to Variables",
      "description": "Learn about variables, their types, and how to use them",
      "order": 1,
      "is_active": true,
      "subject": {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH",
        "class": {
          "id": "class-uuid-1",
          "name": "Grade 10"
        }
      }
    },
    "statistics": {
      "totalVideos": 5,
      "totalMaterials": 3,
      "totalLinks": 2,
      "totalAssignments": 1,
      "totalComments": 8,
      "totalCbts": 2,
      "totalContent": 13,
      "totalVideoViews": 1250,
      "totalVideoDuration": 3600,
      "totalVideoDurationFormatted": "01:00:00",
      "totalVideoSize": 524288000,
      "totalVideoSizeFormatted": "500.00 MB",
      "totalMaterialSize": 10485760,
      "totalMaterialSizeFormatted": "10.00 MB",
      "materialTypeBreakdown": {
        "PDF": 2,
        "DOC": 1
      },
      "assignmentTypeBreakdown": {
        "HOMEWORK": 1
      },
      "linkTypeBreakdown": {
        "tutorial": 1,
        "article": 1
      },
      "topLevelComments": 5,
      "totalReplies": 3,
      "editedComments": 1,
      "totalCbtQuestions": 20,
      "totalCbtAttempts": 45,
      "publishedCbts": 2,
      "totalContentSize": 534773760,
      "totalContentSizeFormatted": "510.00 MB"
    },
    "content": {
      "videos": [
        {
          "id": "video-uuid-1",
          "title": "Variables Explained",
          "description": "Introduction to variables",
          "videoUrl": "https://s3.amazonaws.com/bucket/videos/video1.mp4",
          "thumbnailUrl": "https://s3.amazonaws.com/bucket/thumbnails/thumb1.jpg",
          "durationSeconds": 600,
          "sizeBytes": 52428800,
          "views": 250,
          "order": 1,
          "status": "published",
          "uploadedBy": {
            "id": "user-uuid-1",
            "email": "teacher@example.com",
            "first_name": "John",
            "last_name": "Doe"
          }
        }
      ],
      "materials": [
        {
          "id": "material-uuid-1",
          "title": "Variables Study Guide",
          "description": "Comprehensive guide to variables",
          "materialType": "PDF",
          "url": "https://s3.amazonaws.com/bucket/materials/guide.pdf",
          "sizeBytes": 5242880,
          "pageCount": 15,
          "order": 1,
          "status": "published",
          "uploadedBy": {
            "id": "user-uuid-1",
            "email": "teacher@example.com",
            "first_name": "John",
            "last_name": "Doe"
          }
        }
      ],
      "links": [
        {
          "id": "link-uuid-1",
          "title": "Khan Academy - Variables",
          "description": "External resource for learning variables",
          "url": "https://www.khanacademy.org/math/algebra/variables",
          "linkType": "tutorial",
          "domain": "khanacademy.org",
          "order": 1,
          "status": "published"
        }
      ],
      "assignments": [],
      "comments": [],
      "cbts": []
    }
  }
}
```

---

## Content Management

### 7. Upload Video

Upload a video lesson to a topic. Supports progress tracking via SSE.

**Endpoint:** `POST /api/v1/library/content/upload-video/start`

**Content-Type:** `multipart/form-data`

**Request Body:**
```typescript
{
  topicId: string;           // Required: Library topic ID
  subjectId: string;         // Required: Library subject ID (for validation)
  title: string;             // Required: Video title (max 200 chars)
  description?: string;       // Optional: Video description (max 2000 chars)
  video: File;               // Required: Video file (MP4, max 500MB)
  thumbnail?: File;           // Optional: Thumbnail image (JPEG, PNG, GIF, WEBP)
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/v1/library/content/upload-video/start" \
  -H "Authorization: Bearer <token>" \
  -F "topicId=topic-uuid-1" \
  -F "subjectId=subject-uuid-1" \
  -F "title=Introduction to Variables" \
  -F "description=Learn about variables in this comprehensive video" \
  -F "video=@/path/to/video.mp4" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

**Success Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Video upload started",
  "data": {
    "sessionId": "session-uuid-123",
    "progressEndpoint": "/api/v1/library/content/upload-progress/session-uuid-123"
  }
}
```

**Track Upload Progress:**

**SSE Endpoint:** `GET /api/v1/library/content/upload-progress/:sessionId`
```javascript
const eventSource = new EventSource(
  `https://api.example.com/api/v1/library/content/upload-progress/${sessionId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`Upload progress: ${progress.percentage}%`);
  
  if (progress.status === 'completed') {
    console.log('Upload completed!', progress.video);
    eventSource.close();
  }
  
  if (progress.status === 'failed') {
    console.error('Upload failed:', progress.error);
    eventSource.close();
  }
};
```

**Polling Endpoint:** `GET /api/v1/library/content/upload-progress/:sessionId/poll`
```javascript
const checkProgress = async () => {
  const response = await fetch(
    `https://api.example.com/api/v1/library/content/upload-progress/${sessionId}/poll`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  const progress = await response.json();
  console.log(`Progress: ${progress.data.percentage}%`);
  
  if (progress.data.status === 'completed') {
    console.log('Upload completed!', progress.data.video);
  } else if (progress.data.status === 'uploading') {
    setTimeout(checkProgress, 1000); // Poll every second
  }
};
```

**Video File Requirements:**
- **Format**: MP4 (H.264 codec recommended)
- **Max Size**: 500MB
- **Duration**: Auto-extracted from video file

**Thumbnail Requirements:**
- **Formats**: JPEG, PNG, GIF, WEBP
- **Max Size**: 5MB
- **Recommended**: 1280x720 or 16:9 aspect ratio

---

### 8. Upload Material

Upload a material file (PDF, DOC, DOCX, PPT, PPTX) to a topic. Supports progress tracking via SSE.

**Endpoint:** `POST /api/v1/library/content/upload-material/start`

**Content-Type:** `multipart/form-data`

**Request Body:**
```typescript
{
  topicId: string;           // Required: Library topic ID
  subjectId: string;         // Required: Library subject ID (for validation)
  title: string;             // Required: Material title (max 200 chars)
  description?: string;      // Optional: Material description (max 2000 chars)
  material: File;            // Required: Material file (PDF, DOC, DOCX, PPT, PPTX - max 300MB)
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/v1/library/content/upload-material/start" \
  -H "Authorization: Bearer <token>" \
  -F "topicId=topic-uuid-1" \
  -F "subjectId=subject-uuid-1" \
  -F "title=Algebra Study Guide" \
  -F "description=Comprehensive guide covering all algebra concepts" \
  -F "material=@/path/to/guide.pdf"
```

**Success Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Material upload started",
  "data": {
    "sessionId": "session-uuid-456",
    "progressEndpoint": "/api/v1/library/content/upload-progress/session-uuid-456"
  }
}
```

**Track Upload Progress:**
Same as video upload - use the `sessionId` with the progress endpoints.

**Material File Requirements:**
- **Formats**: PDF, DOC, DOCX, PPT, PPTX
- **Max Size**: 300MB
- **Page Count**: Auto-extracted for PDFs

---

### 9. Create Link

Add an external link/resource to a topic.

**Endpoint:** `POST /api/v1/library/content/create-link`

**Content-Type:** `application/json`

**Request Body:**
```typescript
{
  topicId: string;           // Required: Library topic ID
  subjectId: string;         // Required: Library subject ID (for validation)
  title: string;             // Required: Link title (max 200 chars)
  url: string;               // Required: Valid URL
  description?: string;      // Optional: Link description (max 2000 chars)
  linkType?: string;         // Optional: Type of link (max 50 chars)
                            // Examples: "tutorial", "article", "reference", "documentation"
}
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/v1/library/content/create-link" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "topicId": "topic-uuid-1",
    "subjectId": "subject-uuid-1",
    "title": "Khan Academy - Algebra Basics",
    "url": "https://www.khanacademy.org/math/algebra",
    "description": "External resource for learning algebra basics",
    "linkType": "tutorial"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Link created successfully",
  "data": {
    "id": "link-uuid-1",
    "platformId": "platform-uuid-1",
    "subjectId": "subject-uuid-1",
    "topicId": "topic-uuid-1",
    "title": "Khan Academy - Algebra Basics",
    "description": "External resource for learning algebra basics",
    "url": "https://www.khanacademy.org/math/algebra",
    "linkType": "tutorial",
    "domain": "khanacademy.org",
    "order": 1,
    "status": "published",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "topic": {
      "id": "topic-uuid-1",
      "title": "Introduction to Variables"
    },
    "subject": {
      "id": "subject-uuid-1",
      "name": "Mathematics"
    }
  }
}
```

---

### 10. Update Video

Update video details (title, description).

**Endpoint:** `PATCH /api/v1/library/content/video/:videoId/update`

**Content-Type:** `application/json`

**Path Parameters:**
- `videoId` (string, required): Video ID

**Request Body:**
```typescript
{
  title?: string;            // Optional: Video title (max 200 chars)
  description?: string;       // Optional: Video description (max 2000 chars)
}
```

**Example Request:**
```bash
curl -X PATCH "https://api.example.com/api/v1/library/content/video/video-uuid-1/update" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Video Title",
    "description": "Updated description"
  }'
```

---

### 11. Delete Content

Delete videos, materials, links, or assignments from a topic.

**Endpoints:**
- `DELETE /api/v1/library/content/video/:videoId` - Delete video
- `DELETE /api/v1/library/content/material/:materialId` - Delete material
- `DELETE /api/v1/library/content/link/:linkId` - Delete link
- `DELETE /api/v1/library/content/assignment/:assignmentId` - Delete assignment

**Example Request:**
```bash
curl -X DELETE "https://api.example.com/api/v1/library/content/video/video-uuid-1" \
  -H "Authorization: Bearer <token>"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Video deleted successfully",
  "data": null
}
```

**Note:** Deleting content automatically reorders remaining items in the topic to close gaps.

---

## Integration Flow

### Complete Workflow: Creating Subject → Topic → Content

Here's the recommended flow for library owners to create and populate content:

#### Step 1: Create Subject
```javascript
// 1. Create a subject
const createSubject = async () => {
  const formData = new FormData();
  formData.append('classId', 'class-uuid-1');
  formData.append('name', 'Mathematics');
  formData.append('code', 'MATH');
  formData.append('color', '#3B82F6');
  if (thumbnailFile) {
    formData.append('thumbnail', thumbnailFile);
  }

  const response = await fetch('/api/v1/library/subject/createsubject', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const result = await response.json();
  return result.data; // Contains subject with id
};
```

#### Step 2: Create Topic
```javascript
// 2. Create a topic under the subject
const createTopic = async (subjectId) => {
  const response = await fetch('/api/v1/library/subject/topic/createtopic', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subjectId: subjectId,
      title: 'Introduction to Variables',
      description: 'Learn about variables and their usage',
      order: 1
    })
  });

  const result = await response.json();
  return result.data; // Contains topic with id
};
```

#### Step 3: Upload Content
```javascript
// 3a. Upload video with progress tracking
const uploadVideo = async (topicId, subjectId, videoFile, thumbnailFile) => {
  const formData = new FormData();
  formData.append('topicId', topicId);
  formData.append('subjectId', subjectId);
  formData.append('title', 'Variables Explained');
  formData.append('description', 'Introduction to variables');
  formData.append('video', videoFile);
  if (thumbnailFile) {
    formData.append('thumbnail', thumbnailFile);
  }

  const response = await fetch('/api/v1/library/content/upload-video/start', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const result = await response.json();
  const sessionId = result.data.sessionId;

  // Track progress via SSE
  const eventSource = new EventSource(
    `/api/v1/library/content/upload-progress/${sessionId}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );

  eventSource.onmessage = (event) => {
    const progress = JSON.parse(event.data);
    updateProgressBar(progress.percentage);
    
    if (progress.status === 'completed') {
      console.log('Video uploaded:', progress.video);
      eventSource.close();
    }
  };

  return sessionId;
};

// 3b. Upload material
const uploadMaterial = async (topicId, subjectId, materialFile) => {
  const formData = new FormData();
  formData.append('topicId', topicId);
  formData.append('subjectId', subjectId);
  formData.append('title', 'Study Guide');
  formData.append('material', materialFile);

  const response = await fetch('/api/v1/library/content/upload-material/start', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const result = await response.json();
  return result.data.sessionId;
};

// 3c. Create link
const createLink = async (topicId, subjectId) => {
  const response = await fetch('/api/v1/library/content/create-link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      topicId: topicId,
      subjectId: subjectId,
      title: 'Khan Academy - Variables',
      url: 'https://www.khanacademy.org/math/algebra/variables',
      linkType: 'tutorial'
    })
  });

  const result = await response.json();
  return result.data;
};
```

#### Step 4: Get All Topic Materials
```javascript
// 4. Retrieve all content for a topic
const getTopicMaterials = async (topicId) => {
  const response = await fetch(
    `/api/v1/library/subject/topic/getmaterials/${topicId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

  const result = await response.json();
  return result.data; // Contains topic, statistics, and all content
};
```

### Complete Example Flow
```javascript
// Complete workflow
const createCompleteContent = async () => {
  try {
    // Step 1: Create subject
    const subject = await createSubject();
    console.log('Subject created:', subject.id);

    // Step 2: Create topic
    const topic = await createTopic(subject.id);
    console.log('Topic created:', topic.id);

    // Step 3: Upload content
    const videoSessionId = await uploadVideo(
      topic.id,
      subject.id,
      videoFile,
      thumbnailFile
    );
    console.log('Video upload started:', videoSessionId);

    const materialSessionId = await uploadMaterial(
      topic.id,
      subject.id,
      pdfFile
    );
    console.log('Material upload started:', materialSessionId);

    await createLink(topic.id, subject.id);
    console.log('Link created');

    // Step 4: Get all materials
    const materials = await getTopicMaterials(topic.id);
    console.log('Topic materials:', materials);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Common Error Codes

**400 Bad Request:**
- Invalid request data
- Validation errors
- Duplicate subject code
- Invalid file type or size
- Missing required fields

**401 Unauthorized:**
- Missing or invalid JWT token
- Token expired
- Invalid authentication

**404 Not Found:**
- Subject not found
- Topic not found
- Class not found
- Library user not found
- Content item not found

**500 Internal Server Error:**
- Server-side errors
- Database errors
- Storage service errors

### Example Error Response
```json
{
  "success": false,
  "message": "Subject code 'MATH' already exists in your platform",
  "data": null
}
```

---

## Best Practices

### 1. **Subject Organization**
- Use clear, descriptive subject names
- Assign unique codes for easy identification
- Use consistent color coding across subjects
- Add meaningful descriptions

### 2. **Topic Management**
- Create topics in logical order using the `order` field
- Use descriptive titles that clearly indicate content
- Keep descriptions concise but informative
- Deactivate topics instead of deleting when content is outdated

### 3. **Content Upload**
- Always track upload progress for large files
- Provide meaningful titles and descriptions
- Use appropriate thumbnails for videos
- Organize content logically within topics

### 4. **Error Handling**
- Always check the `success` field before accessing `data`
- Handle network errors gracefully
- Implement retry logic for failed uploads
- Show user-friendly error messages

### 5. **Performance**
- Use pagination when fetching large lists
- Implement caching for frequently accessed data
- Monitor upload progress to provide user feedback
- Optimize file sizes before upload

---

## API Response Format

**All endpoints** follow this exact response format:

```typescript
{
  success: boolean;      // true for success, false for error
  message: string;       // Human-readable message
  data: object | null;   // Response data (object on success, null on error)
}
```

**⚠️ Frontend developers:** Always check the `success` field first before accessing `data`. The `data` field will be `null` when `success` is `false`.

---

## Summary

The Library Subject API provides a streamlined way to organize educational content:

1. **Create Subjects** under library classes
2. **Create Topics** directly under subjects (no chapters)
3. **Upload Content** (videos, materials, links) to topics
4. **Manage Content** with update and delete operations
5. **Track Progress** for large file uploads

The simplified structure (Subject → Topic → Content) makes it easy for library owners to organize and manage their educational resources without the complexity of an intermediate chapter level.
