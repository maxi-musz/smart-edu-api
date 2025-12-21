# Library Content Upload API Integration Guide

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

# Video Upload

## 1. Start Video Upload

**Endpoint:** `POST /api/v1/library/content/upload-video/start`

### Request (multipart/form-data)
- `topicId`: string (required) - Library topic ID
- `subjectId`: string (required) - Library subject ID
- `title`: string (required, max 200 chars) - Video title
- `description`: string (optional, max 2000 chars) - Video description
- `video`: file (required) - Video file (MP4, max 500MB)
- `thumbnail`: file (optional) - Thumbnail image (JPEG, PNG, GIF, WEBP)

### Example Request (multipart/form-data)
```
topicId: cmjbnj4zw0002vlevol2u657f
subjectId: subject_123
title: Introduction to Variables
description: Learn about variables and their usage
video: [binary file]
thumbnail: [binary file]
```

### Success Response (202)
```json
{
  "success": true,
  "message": "Video upload started successfully",
  "data": {
    "sessionId": "upload_session_1234567890_abc123",
    "progressEndpoint": "/api/v1/library/content/upload-progress/upload_session_1234567890_abc123"
  }
}
```

### Error Responses
- **400**: Bad request - Invalid file, file too large, or validation error
- **401**: Unauthorized - Invalid or missing token
- **404**: Topic not found or does not belong to user's platform
- **500**: Internal server error

---

## 2. Track Video Upload Progress

### SSE Stream (Recommended)
**Endpoint:** `GET /api/v1/library/content/upload-progress/:sessionId`

Returns Server-Sent Events stream with real-time progress updates.

### Polling (Alternative)
**Endpoint:** `GET /api/v1/library/content/upload-progress/:sessionId/poll`

### Progress Response
```json
{
  "success": true,
  "message": "Upload progress retrieved",
  "data": {
    "sessionId": "upload_session_1234567890_abc123",
    "progress": 45,
    "stage": "uploading",
    "message": "Uploading to cloud storage...",
    "bytesUploaded": 22500000,
    "totalBytes": 50000000,
    "estimatedTimeRemaining": 30,
    "error": null,
    "materialId": null
  }
}
```

### Progress Stages
- `validating`: Validating file and checking permissions
- `uploading`: Uploading file to cloud storage
- `processing`: Processing video (if needed)
- `saving`: Saving to database
- `completed`: Upload completed successfully
- `error`: Upload failed

---

# Material Upload

## 3. Start Material Upload

**Endpoint:** `POST /api/v1/library/content/upload-material/start`

### Request (multipart/form-data)
- `topicId`: string (required) - Library topic ID
- `subjectId`: string (required) - Library subject ID
- `title`: string (required, max 200 chars) - Material title
- `description`: string (optional, max 2000 chars) - Material description
- `material`: file (required) - Material file (PDF, DOC, DOCX, PPT, PPTX, max 300MB)

### Example Request (multipart/form-data)
```
topicId: cmjbnj4zw0002vlevol2u657f
subjectId: subject_123
title: Algebra Study Guide
description: Comprehensive guide covering all algebra concepts
material: [binary file]
```

### Success Response (202)
```json
{
  "success": true,
  "message": "Material upload started successfully",
  "data": {
    "sessionId": "upload_session_1234567890_abc123",
    "progressEndpoint": "/api/v1/library/content/upload-progress/upload_session_1234567890_abc123"
  }
}
```

### Error Responses
- **400**: Bad request - Invalid file type, file too large, or validation error
- **401**: Unauthorized - Invalid or missing token
- **404**: Topic not found or does not belong to user's platform
- **500**: Internal server error

---

## 4. Track Material Upload Progress

Uses the same progress endpoints as video upload:
- **SSE:** `GET /api/v1/library/content/upload-progress/:sessionId`
- **Polling:** `GET /api/v1/library/content/upload-progress/:sessionId/poll`

---

# Link Creation

## 5. Create Link

**Endpoint:** `POST /api/v1/library/content/create-link`

### Request Payload
```json
{
  "topicId": "string (required)",
  "subjectId": "string (required)",
  "chapterId": "string (optional)",
  "title": "string (required, max 200 chars)",
  "url": "string (required, valid URL)",
  "description": "string (optional, max 2000 chars)",
  "linkType": "string (optional, max 50 chars)"
}
```

### Example Request
```json
{
  "topicId": "cmjbnj4zw0002vlevol2u657f",
  "subjectId": "subject_123",
  "chapterId": "chapter_123",
  "title": "Khan Academy - Algebra Basics",
  "url": "https://www.khanacademy.org/math/algebra",
  "description": "External resource for learning algebra basics",
  "linkType": "tutorial"
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Link created successfully",
  "data": {
    "id": "link_123",
    "platformId": "platform_123",
    "subjectId": "subject_123",
    "chapterId": "chapter_123",
    "topicId": "topic_123",
    "uploadedById": "user_123",
    "title": "Khan Academy - Algebra Basics",
    "description": "External resource for learning algebra basics",
    "url": "https://www.khanacademy.org/math/algebra",
    "linkType": "tutorial",
    "domain": "www.khanacademy.org",
    "thumbnailUrl": null,
    "status": "published",
    "order": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "topic": {
      "id": "topic_123",
      "title": "Introduction to Variables"
    },
    "subject": {
      "id": "subject_123",
      "name": "Mathematics"
    },
    "chapter": {
      "id": "chapter_123",
      "title": "Chapter 1: Algebra Basics"
    }
  }
}
```

### Error Responses
- **400**: Bad request - Invalid URL or validation error
- **401**: Unauthorized - Invalid or missing token
- **404**: Topic not found or does not belong to user's platform
- **500**: Internal server error

---

## Validation Rules

### Video Upload
- File type: MP4
- Max size: 500MB
- Thumbnail: Optional, JPEG/PNG/GIF/WEBP
- Title: Required, max 200 characters
- Description: Optional, max 2000 characters

### Material Upload
- File types: PDF, DOC, DOCX, PPT, PPTX
- Max size: 300MB
- Title: Required, max 200 characters
- Description: Optional, max 2000 characters

### Link Creation
- URL: Required, must be valid URL format
- Title: Required, max 200 characters
- Description: Optional, max 2000 characters
- Link type: Optional, max 50 characters (e.g., "article", "video", "reference", "tutorial", "documentation")

---

## Notes

### Upload Flow
1. Call `/start` endpoint → Returns `sessionId` immediately (202 Accepted)
2. Upload happens in background
3. Track progress via SSE stream or polling
4. On completion, `materialId` is included in progress response

### Progress Tracking
- **SSE (Recommended)**: Real-time updates via Server-Sent Events
- **Polling**: Check progress periodically (every 1-2 seconds)

### Error Handling
- If upload fails, check `error` field in progress response
- Failed uploads automatically clean up uploaded files
- Database operations are transactional with rollback on failure

### File Storage
- Videos: `library/videos/platforms/{platformId}/subjects/{subjectId}/topics/{topicId}/`
- Materials: `library/materials/platforms/{platformId}/subjects/{subjectId}/topics/{topicId}/`
- Thumbnails: `library/video-thumbnails/platforms/{platformId}/subjects/{subjectId}/topics/{topicId}/`

### Platform Scoping
- All content is scoped to the authenticated user's platform
- Topics and subjects must belong to the user's platform
- Cross-platform access is not allowed

