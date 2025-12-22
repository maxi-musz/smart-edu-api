# Library General Materials API Integration Guide

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Get General Materials Dashboard

**Endpoint:** `GET /api/v1/library/general-materials/dashboard`

### Description
Retrieves comprehensive dashboard statistics for general materials (ebooks/textbooks) on the authenticated library user's platform.  
Access to these materials is **tier-based at the school level** (e.g., free tier, basic, premium) – individual learners do **not** buy books directly.  
Returns high-level statistics including total materials, free vs paid-tier materials, AI-enabled materials, chapters, and school-level activations/revenue.

### Request
No request body required. Only requires authentication token.

### Success Response (200)

```json
{
  "success": true,
  "message": "General materials dashboard retrieved successfully",
  "data": {
    "platform": {
      "id": "platform_123",
      "name": "Access Study",
      "slug": "smart-edu-global-library",
      "status": "active",
      "materialsCount": 150
    },
    "statistics": {
      "overview": {
        "totalMaterials": 150,
        "aiEnabledMaterials": 75,
        "totalChapters": 450
      },
      "byStatus": {
        "published": 130,
        "draft": 15,
        "archived": 5
      }
    },
    "materials": [
      {
        "id": "material_123",
        "title": "Advanced Algebra for Senior Secondary Schools",
        "description": "A comprehensive guide to advanced algebra concepts.",
        "author": "John Doe",
        "isAvailable": true,
        "isAiEnabled": true,
        "status": "published",
        "views": 1500,
        "downloads": 800,
        "thumbnailUrl": "https://bucket.s3.region.amazonaws.com/library/general-materials/thumbnails/platforms/platform_123/thumbnail_123.jpg",
        "thumbnailS3Key": "library/general-materials/thumbnails/platforms/platform_123/thumbnail_123.jpg",
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z",
        "uploadedBy": {
          "id": "user_123",
          "email": "uploader@example.com",
          "first_name": "John",
          "last_name": "Doe"
        }
      },
      {
        "id": "material_456",
        "title": "Introduction to Physics",
        "description": "Basic physics concepts for beginners.",
        "author": "Jane Smith",
        "isAvailable": true,
        "isAiEnabled": false,
        "status": "draft",
        "views": 300,
        "downloads": 50,
        "thumbnailUrl": null,
        "thumbnailS3Key": null,
        "createdAt": "2025-01-02T00:00:00.000Z",
        "updatedAt": "2025-01-02T00:00:00.000Z",
        "uploadedBy": {
          "id": "user_456",
          "email": "jane@example.com",
          "first_name": "Jane",
          "last_name": "Smith"
        }
      }
    ]
  }
}
```

### Response Structure Breakdown

#### Platform Object
- `id`: Platform ID
- `name`: Platform name
- `slug`: Platform slug
- `status`: Platform status (active, inactive, etc.)
- `materialsCount`: Total number of general materials in the platform

#### Statistics Object
- `overview`: Summary statistics
  - `totalMaterials`: Total number of general materials
  - `aiEnabledMaterials`: Number of materials with AI chat enabled
  - `totalChapters`: Total number of chapters across all materials
- `byStatus`: Breakdown by material status
  - `published`: Number of published materials
  - `draft`: Number of draft materials
  - `archived`: Number of archived materials

#### Materials Array
Array of all general materials with the following fields:
- `id`: Material ID
- `title`: Material title
- `description`: Material description (nullable)
- `author`: Author name (nullable)
- `isAvailable`: Whether the material is available
- `isAiEnabled`: Whether AI chat is enabled for this material
- `status`: Material status (published, draft, archived)
- `views`: Number of views
- `downloads`: Number of downloads
- `thumbnailUrl`: Thumbnail image URL (nullable)
- `thumbnailS3Key`: S3 object key for thumbnail (nullable)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `uploadedBy`: Library user who uploaded the material
  - `id`: User ID
  - `email`: User email
  - `first_name`: User first name
  - `last_name`: User last name

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

---

## 2. Get All General Materials

**Endpoint:** `GET /api/v1/library/general-materials/all`

### Description
Retrieves a paginated list of all general materials for the authenticated library user's platform.  
Materials are unlocked based on the **school's subscription tier** (e.g., basic, premium). End users never pay directly; they only see what their school tier allows.  
Supports search, AI-enabled filters, and class/subject categorization.

### Query Parameters
All query parameters are optional:

- `page` (number, default: 1): Page number (minimum: 1)
- `limit` (number, default: 20): Items per page (minimum: 1, maximum: 100)
- `search` (string): Search term to match against title, author, description, or publisher (case-insensitive)
- `isAiEnabled` (boolean): Filter by AI-enabled materials (true) or non-AI materials (false)
- `classId` (string): Filter by library class ID
- `subjectId` (string): Filter by library subject ID

### Example Request
```
GET /api/v1/library/general-materials/all?page=1&limit=20&search=algebra&isAiEnabled=true
Authorization: Bearer <token>
```

### Success Response (200)

```json
{
  "success": true,
  "message": "General materials retrieved successfully",
  "data": {
    "items": [
      {
        "id": "material_123",
        "title": "Advanced Algebra for Senior Secondary Schools",
        "description": "A comprehensive guide to advanced algebra concepts.",
        "author": "John Doe",
        "isAvailable": true,
        "isAiEnabled": true,
        "status": "published",
        "views": 1500,
        "downloads": 800,
        "thumbnailUrl": "https://s3.amazonaws.com/bucket/library/general-materials/thumbnails/platforms/platform_123/thumbnail_abc123.jpg",
        "thumbnailS3Key": "library/general-materials/thumbnails/platforms/platform_123/thumbnail_abc123.jpg",
        "chapterCount": 5,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z",
        "class": {
          "id": "class_123",
          "name": "SSS 1"
        },
        "subject": {
          "id": "subject_123",
          "name": "Mathematics",
          "code": "MATH"
        },
        "uploadedBy": {
          "id": "user_123",
          "email": "uploader@example.com",
          "first_name": "John",
          "last_name": "Doe"
        }
      },
      {
        "id": "material_456",
        "title": "Introduction to Physics",
        "description": "Basic physics concepts for beginners.",
        "author": "Jane Smith",
        "isAvailable": true,
        "isAiEnabled": false,
        "status": "published",
        "views": 3000,
        "downloads": 2500,
        "thumbnailUrl": null,
        "thumbnailS3Key": null,
        "chapterCount": 8,
        "createdAt": "2025-01-02T00:00:00.000Z",
        "updatedAt": "2025-01-02T00:00:00.000Z",
        "class": null,
        "subject": null,
        "uploadedBy": {
          "id": "user_456",
          "email": "jane@example.com",
          "first_name": "Jane",
          "last_name": "Smith"
        }
      }
    ],
    "meta": {
      "totalItems": 150,
      "totalPages": 8,
      "currentPage": 1,
      "limit": 20
    }
  }
}
```

### Response Structure Breakdown

#### Items Array
Each material object contains:
- `id`: Material ID
- `title`: Material title
- `description`: Material description (nullable)
- `author`: Author name (nullable)
- `isAvailable`: Whether the material is available for schools to include in any tier (visibility/inventory)
- `isAiEnabled`: Whether AI chat is enabled for this material
- `status`: Material status (published, draft, archived)
- `views`: Number of views
- `downloads`: Number of downloads
- `thumbnailUrl`: Thumbnail image URL (nullable)
- `thumbnailS3Key`: S3 object key for thumbnail (nullable)
- `chapterCount`: Number of chapters in this material
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `class`: Associated library class (nullable)
  - `id`: Class ID
  - `name`: Class name
- `subject`: Associated library subject (nullable)
  - `id`: Subject ID
  - `name`: Subject name
  - `code`: Subject code
- `uploadedBy`: Library user who uploaded the material
  - `id`: User ID
  - `email`: User email
  - `first_name`: User first name
  - `last_name`: User last name

#### Meta Object
- `totalItems`: Total number of materials matching the query
- `totalPages`: Total number of pages
- `currentPage`: Current page number
- `limit`: Items per page

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

---

## 3. Get Single General Material by ID

**Endpoint:** `GET /api/v1/library/general-materials/:materialId`

### Description
Retrieves detailed information for a specific general material, including all its chapters and chapter files. This endpoint is useful for displaying a material's full details on a detail page.

### Request Parameters
- `materialId` (path parameter): The ID of the general material

### Example Request
```
GET /api/v1/library/general-materials/material_123
Authorization: Bearer <token>
```

### Success Response (200)

```json
{
  "success": true,
  "message": "General material retrieved successfully",
  "data": {
    "id": "material_123",
    "title": "Advanced Algebra for Senior Secondary Schools",
    "description": "A comprehensive guide to advanced algebra concepts.",
    "author": "John Doe",
    "isbn": "978-3-16-148410-0",
    "publisher": "Smart Edu Publishing",
    "materialType": "PDF",
    "url": "https://bucket.s3.region.amazonaws.com/library/general-materials/platforms/platform_123/material_123.pdf",
    "s3Key": "library/general-materials/platforms/platform_123/material_123.pdf",
    "sizeBytes": 52428800,
    "pageCount": null,
    "thumbnailUrl": "https://bucket.s3.region.amazonaws.com/library/general-materials/thumbnails/platforms/platform_123/thumbnail_123.jpg",
    "thumbnailS3Key": "library/general-materials/thumbnails/platforms/platform_123/thumbnail_123.jpg",
    "isAvailable": true,
    "isAiEnabled": true,
    "status": "published",
    "views": 1500,
    "downloads": 800,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "class": {
      "id": "class_123",
      "name": "SSS 1"
    },
    "subject": {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH"
    },
    "uploadedBy": {
      "id": "user_123",
      "email": "uploader@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "chapters": [
      {
        "id": "chapter_123",
        "title": "Chapter 1: Introduction to Algebra",
        "description": "This chapter introduces basic algebraic concepts.",
        "pageStart": 1,
        "pageEnd": 20,
        "order": 1,
        "isProcessed": false,
        "chunkCount": 0,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z",
        "files": [
          {
            "id": "file_123",
            "fileName": "chapter1-intro.pdf",
            "fileType": "PDF",
            "url": "https://s3.amazonaws.com/bucket/library/general-materials/chapters/platform_123/material_123/chapter_123/file_abc123.pdf",
            "sizeBytes": 2048576,
            "title": "Chapter 1 - Introduction PDF",
            "description": "Introduction to algebra concepts",
            "order": 1,
            "createdAt": "2025-01-01T00:00:00.000Z"
          }
        ]
      },
      {
        "id": "chapter_456",
        "title": "Chapter 2: Linear Equations",
        "description": "Understanding linear equations and their solutions.",
        "pageStart": 21,
        "pageEnd": 45,
        "order": 2,
        "isProcessed": true,
        "chunkCount": 15,
        "createdAt": "2025-01-02T00:00:00.000Z",
        "updatedAt": "2025-01-02T00:00:00.000Z",
        "files": []
      }
    ]
  }
}
```

### Response Structure Breakdown

#### Material Object
- `id`: Material ID
- `title`: Material title
- `description`: Material description (nullable)
- `author`: Author name (nullable)
- `isbn`: ISBN (nullable)
- `publisher`: Publisher name (nullable)
- `materialType`: Type of material (e.g., "PDF")
- `url`: Full URL to the material file in cloud storage
- `s3Key`: S3 object key for the material file
- `sizeBytes`: File size in bytes (nullable)
- `pageCount`: Number of pages (nullable)
- `thumbnailUrl`: Thumbnail image URL (nullable)
- `thumbnailS3Key`: S3 object key for thumbnail (nullable)
- `isAvailable`: Whether the material is available
- `isAiEnabled`: Whether AI chat is enabled for this material
- `status`: Material status (published, draft, archived)
- `views`: Number of views
- `downloads`: Number of downloads
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `class`: Associated library class (nullable)
  - `id`: Class ID
  - `name`: Class name
- `subject`: Associated library subject (nullable)
  - `id`: Subject ID
  - `name`: Subject name
  - `code`: Subject code
- `uploadedBy`: Library user who uploaded the material
  - `id`: User ID
  - `email`: User email
  - `first_name`: User first name
  - `last_name`: User last name
- `chapters`: Array of all chapters for this material (ordered by `order` ascending)
  - `id`: Chapter ID
  - `title`: Chapter title
  - `description`: Chapter description (nullable)
  - `pageStart`: Starting page number (nullable)
  - `pageEnd`: Ending page number (nullable)
  - `order`: Chapter order
  - `isProcessed`: Whether the chapter has been processed for AI
  - `chunkCount`: Number of AI chunks created for this chapter
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp
  - `files`: Array of files attached to this chapter (ordered by `order` ascending)
    - `id`: File ID
    - `fileName`: Original filename
    - `fileType`: Type of file (PDF, DOC, PPT, VIDEO, NOTE)
    - `url`: Public or signed URL to access the file
    - `sizeBytes`: File size in bytes (nullable)
    - `title`: Title/name for the file (nullable)
    - `description`: Description of the file content (nullable)
    - `order`: Order/sequence number within the chapter
    - `createdAt`: Creation timestamp

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found, material not found, or material does not belong to user's platform
- **500**: Internal server error

### Notes
- This endpoint returns the complete material details including all chapters and their files
- Chapters are ordered by `order` (ascending)
- Files within each chapter are also ordered by `order` (ascending)
- The material must belong to the authenticated user's platform

---

## 4. Get Chapters for a Material

**Endpoint:** `GET /api/v1/library/general-materials/:materialId/chapters`

### Description
Retrieves all chapters for a specific general material, including their associated files. This endpoint is useful when you only need chapter information without the full material details.

### Request Parameters
- `materialId` (path parameter): The ID of the general material

### Example Request
```
GET /api/v1/library/general-materials/material_123/chapters
Authorization: Bearer <token>
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Material chapters retrieved successfully",
  "data": [
    {
      "id": "chapter_123",
      "title": "Chapter 1: Introduction to Algebra",
      "description": "This chapter introduces basic algebraic concepts.",
      "pageStart": 1,
      "pageEnd": 20,
      "order": 1,
      "isProcessed": false,
      "chunkCount": 0,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "files": [
        {
          "id": "file_123",
          "fileName": "chapter1-intro.pdf",
          "fileType": "PDF",
          "url": "https://s3.amazonaws.com/bucket/library/general-materials/chapters/platform_123/material_123/chapter_123/file_abc123.pdf",
          "sizeBytes": 2048576,
          "title": "Chapter 1 - Introduction PDF",
          "description": "Introduction to algebra concepts",
          "order": 1,
          "createdAt": "2025-01-01T00:00:00.000Z"
        }
      ]
    },
    {
      "id": "chapter_456",
      "title": "Chapter 2: Linear Equations",
      "description": "Understanding linear equations and their solutions.",
      "pageStart": 21,
      "pageEnd": 45,
      "order": 2,
      "isProcessed": true,
      "chunkCount": 15,
      "createdAt": "2025-01-02T00:00:00.000Z",
      "updatedAt": "2025-01-02T00:00:00.000Z",
      "files": []
    }
  ]
}
```

### Response Structure Breakdown

#### Chapters Array
Array of chapter objects, each containing:
- `id`: Chapter ID
- `title`: Chapter title
- `description`: Chapter description (nullable)
- `pageStart`: Starting page number in the full material (nullable)
- `pageEnd`: Ending page number in the full material (nullable)
- `order`: Chapter order (automatically assigned, increments by 1)
- `isProcessed`: Whether the chapter has been processed for AI
- `chunkCount`: Number of AI chunks created for this chapter
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `files`: Array of files attached to this chapter (ordered by `order` ascending)
  - `id`: File ID
  - `fileName`: Original filename
  - `fileType`: Type of file (PDF, DOC, PPT, VIDEO, NOTE)
  - `url`: Public or signed URL to access the file
  - `sizeBytes`: File size in bytes (nullable)
  - `title`: Title/name for the file (nullable)
  - `description`: Description of the file content (nullable)
  - `order`: Order/sequence number within the chapter
  - `createdAt`: Creation timestamp

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found, material not found, or material does not belong to user's platform
- **500**: Internal server error

### Notes
- Chapters are ordered by `order` (ascending)
- Files within each chapter are also ordered by `order` (ascending)
- The material must belong to the authenticated user's platform
- Use this endpoint when you only need chapter information without full material details

---

## 5. Start General Material Upload (with Progress Tracking)

**Endpoint:** `POST /api/v1/library/general-materials/upload/start`

### Description
Starts a general material upload session and returns a `sessionId`. The upload runs in the background, and you can track progress using the upload progress endpoints (SSE or polling).

This is the **recommended flow** for uploading large general materials so the UI can show real-time progress.

### Request
**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Full material file (PDF, DOC, PPT, etc. - max 300MB) |
| `thumbnail` | File | No | Optional thumbnail image (JPEG, PNG, GIF, WEBP - max 5MB) |
| `title` | string | Yes | Title of the material (max 200 characters) |
| `description` | string | No | Description of the material (max 2000 characters) |
| `author` | string | No | Author name (max 150 characters) |
| `isbn` | string | No | ISBN of the material (max 50 characters) |
| `publisher` | string | No | Publisher name (max 150 characters) |
| `classId` | string | No | Optional library class ID for categorization |
| `subjectId` | string | No | Optional library subject ID for categorization |
| `isAiEnabled` | boolean | No | Whether AI chat is enabled for this material (default: false) |

### Example Request (multipart/form-data)
```
POST /api/v1/library/general-materials/upload/start
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary file data]
thumbnail: [binary image data]
title: Advanced Algebra for Senior Secondary Schools
description: A comprehensive guide to advanced algebra concepts.
author: John Doe
isbn: 978-3-16-148410-0
publisher: Smart Edu Publishing
classId: class_123
subjectId: subject_123
isAiEnabled: true
```

### Success Response (202)

```json
{
  "success": true,
  "message": "General material upload started successfully",
  "data": {
    "sessionId": "upload_session_1234567890_abc123",
    "progressEndpoint": "/api/v1/library/general-materials/upload-progress/upload_session_1234567890_abc123"
  }
}
```

### Error Responses
- **400**: Bad request - Invalid file, file too large, or validation error
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

---

## 6. Track General Material Upload Progress

You can track upload progress using **SSE (recommended)** or **polling**, similar to the `content` module.

### 4.1 SSE Stream (Recommended)

**Endpoint:** `GET /api/v1/library/general-materials/upload-progress/:sessionId`

Returns a Server-Sent Events (SSE) stream with real-time progress updates.

### 4.2 Polling (Alternative)

**Endpoint:** `GET /api/v1/library/general-materials/upload-progress/:sessionId/poll`

### Progress Response (Polling)

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
- `processing`: Processing material (if needed)
- `saving`: Saving to database
- `completed`: Upload completed successfully
- `error`: Upload failed

---

## 7. Create General Material (Single-Step Upload)

**Endpoint:** `POST /api/v1/library/general-materials`

**Endpoint:** `POST /api/v1/library/general-materials`

### Description
Creates a new general material (ebook/textbook) for the authenticated library user's platform in **one step**. Uploads the full material file to cloud storage and stores its metadata in the database. Supports class/subject categorization and AI enablement.

> Note: This endpoint does **not** provide progress tracking. For large files and better UX, prefer `POST /upload/start` + progress endpoints above.

### Request
**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Full material file (PDF, DOC, PPT, etc. - max 300MB) |
| `thumbnail` | File | No | Optional thumbnail image (JPEG, PNG, GIF, WEBP - max 5MB) |
| `title` | string | Yes | Title of the material (max 200 characters) |
| `description` | string | No | Description of the material (max 2000 characters) |
| `author` | string | No | Author name (max 150 characters) |
| `isbn` | string | No | ISBN of the material (max 50 characters) |
| `publisher` | string | No | Publisher name (max 150 characters) |
| `classId` | string | No | Optional library class ID for categorization |
| `subjectId` | string | No | Optional library subject ID for categorization |
| `isAiEnabled` | boolean | No | Whether AI chat is enabled for this material (default: false) |

### Example Request (multipart/form-data)
```
POST /api/v1/library/general-materials
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary file data]
thumbnail: [binary image data]
title: Advanced Algebra for Senior Secondary Schools
description: A comprehensive guide to advanced algebra concepts.
author: John Doe
isbn: 978-3-16-148410-0
publisher: Smart Edu Publishing
classId: class_123
subjectId: subject_123
isAiEnabled: true
```

### Success Response (201)

```json
{
  "success": true,
  "message": "General material created successfully",
  "data": {
    "id": "material_123",
    "platformId": "platform_123",
    "uploadedById": "user_123",
    "title": "Advanced Algebra for Senior Secondary Schools",
    "description": "A comprehensive guide to advanced algebra concepts.",
    "author": "John Doe",
    "isbn": "978-3-16-148410-0",
    "publisher": "Smart Edu Publishing",
    "materialType": "PDF",
    "url": "https://bucket.s3.region.amazonaws.com/library/general-materials/platforms/platform_123/material_123.pdf",
    "s3Key": "library/general-materials/platforms/platform_123/material_123.pdf",
    "sizeBytes": 52428800,
    "pageCount": null,
    "thumbnailUrl": "https://bucket.s3.region.amazonaws.com/library/general-materials/thumbnails/platforms/platform_123/thumbnail_123.jpg",
    "thumbnailS3Key": "library/general-materials/thumbnails/platforms/platform_123/thumbnail_123.jpg",
    "isAvailable": true,
    "classId": "class_123",
    "subjectId": "subject_123",
    "isAiEnabled": true,
    "status": "draft",
    "views": 0,
    "downloads": 0,
    "salesCount": 0,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Response Structure Breakdown

#### Material Object
- `id`: Material ID
- `platformId`: Platform ID
- `uploadedById`: ID of the library user who uploaded the material
- `title`: Material title
- `description`: Material description (nullable)
- `author`: Author name (nullable)
- `isbn`: ISBN (nullable)
- `publisher`: Publisher name (nullable)
- `materialType`: Type of material (e.g., "PDF")
- `url`: Full URL to the material file in cloud storage
- `s3Key`: S3 object key for the material file
- `sizeBytes`: File size in bytes
- `pageCount`: Number of pages (nullable, typically set later)
- `thumbnailUrl`: Thumbnail image URL (nullable)
-- `thumbnailS3Key`: S3 object key for thumbnail (nullable)
-- `isAvailable`: Whether the material is available
- `classId`: Associated class ID (nullable)
- `subjectId`: Associated subject ID (nullable)
- `isAiEnabled`: Whether AI chat is enabled
- `status`: Material status (draft, published, archived)
- `views`: Number of views (default: 0)
- `downloads`: Number of downloads (default: 0)
- `salesCount`: Number of completed purchases (default: 0)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Error Responses
- **400**: Bad request - Validation error, missing file, or invalid file type/size
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

### Notes
- File upload supports: PDF, DOC, DOCX, PPT, PPTX, and other document formats
- Maximum file size: 300MB

---

## 8. Create General Material Chapter

**Endpoint:** `POST /api/v1/library/general-materials/:materialId/chapters`

### Description
Creates a new chapter under a general material with automatic incremental ordering. Chapters can optionally specify page ranges (pageStart/pageEnd) within the full material for AI chunking and context understanding.

### Request Parameters
- `materialId` (path parameter): The ID of the general material

### Request Body

```json
{
  "title": "Chapter 1: Introduction to Algebra",
  "description": "This chapter introduces basic algebraic concepts.",
  "pageStart": 1,
  "pageEnd": 20
}
```

**Request Body Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Title of the chapter (max 200 characters) |
| `description` | string | No | Description of the chapter (max 2000 characters) |
| `pageStart` | number | No | Starting page number in the full material (minimum: 1) |
| `pageEnd` | number | No | Ending page number in the full material (minimum: 1) |

### Example Request
```
POST /api/v1/library/general-materials/material_123/chapters
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Chapter 1: Introduction to Algebra",
  "description": "This chapter introduces basic algebraic concepts.",
  "pageStart": 1,
  "pageEnd": 20
}
```

### Success Response (201)

```json
{
  "success": true,
  "message": "General material chapter created successfully",
  "data": {
    "id": "chapter_123",
    "materialId": "material_123",
    "platformId": "platform_123",
    "title": "Chapter 1: Introduction to Algebra",
    "description": "This chapter introduces basic algebraic concepts.",
    "pageStart": 1,
    "pageEnd": 20,
    "order": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Response Structure Breakdown

#### Chapter Object
- `id`: Chapter ID
- `materialId`: ID of the parent general material
- `platformId`: Platform ID
- `title`: Chapter title
- `description`: Chapter description (nullable)
- `pageStart`: Starting page number in the full material (nullable)
- `pageEnd`: Ending page number in the full material (nullable)
- `order`: Chapter order (automatically assigned, increments by 1)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Error Responses
- **400**: Bad request - Validation error
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found, material not found, or material does not belong to user's platform
- **500**: Internal server error

### Notes
- Chapter `order` is automatically assigned based on the highest existing order + 1
- If no chapters exist for the material, the first chapter will have `order: 1`
- Chapters are ordered sequentially (1, 2, 3, ...) and cannot be manually set
- `pageStart` and `pageEnd` are optional and used for AI chunking context
- The material must belong to the authenticated user's platform

---

## 9. Upload File for Chapter

**Endpoint:** `POST /api/v1/library/general-materials/:materialId/chapters/:chapterId/files`

### Description
Uploads a file (PDF, DOC, PPT, etc.) to a specific chapter. A chapter can have multiple files. Files are automatically ordered sequentially if order is not provided. This allows chapters to have supplementary materials, separate PDFs, or additional resources beyond the main material file.

### Request Parameters
- `materialId` (path parameter): The ID of the general material
- `chapterId` (path parameter): The ID of the chapter

### Request
**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | File to upload (PDF, DOC, DOCX, PPT, PPTX, etc. - max 300MB) |
| `title` | string | No | Optional title/name for the file (defaults to original filename, max 200 characters) |
| `description` | string | No | Optional description of the file content (max 2000 characters) |
| `fileType` | string | No | Optional file type (PDF, DOC, PPT, VIDEO, NOTE). Auto-detected from extension if not provided |
| `order` | number | No | Optional order/sequence number (auto-assigned if not provided, minimum: 1) |

### Example Request
```
POST /api/v1/library/general-materials/material_123/chapters/chapter_456/files
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [binary file data]
title: Chapter 1 - Introduction PDF
description: Introduction to algebra concepts
fileType: PDF
order: 1
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Chapter file uploaded successfully",
  "data": {
    "id": "file_123",
    "chapterId": "chapter_456",
    "platformId": "platform_123",
    "uploadedById": "user_123",
    "fileName": "chapter1-intro.pdf",
    "fileType": "PDF",
    "url": "https://s3.amazonaws.com/bucket/library/general-materials/chapters/platform_123/material_123/chapter_456/file_abc123.pdf",
    "s3Key": "library/general-materials/chapters/platform_123/material_123/chapter_456/file_abc123.pdf",
    "sizeBytes": 2048576,
    "pageCount": null,
    "title": "Chapter 1 - Introduction PDF",
    "description": "Introduction to algebra concepts",
    "order": 1,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "uploadedBy": {
      "id": "user_123",
      "email": "uploader@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

### Response Structure Breakdown

#### Chapter File Object
- `id`: File ID
- `chapterId`: ID of the parent chapter
- `platformId`: Platform ID
- `uploadedById`: ID of the library user who uploaded the file
- `fileName`: Original filename
- `fileType`: Type of file (PDF, DOC, PPT, VIDEO, NOTE)
- `url`: Public or signed URL to access the file
- `s3Key`: S3 object key (nullable)
- `sizeBytes`: File size in bytes (nullable)
- `pageCount`: Number of pages (nullable, typically for PDFs)
- `title`: Title/name for the file (nullable)
- `description`: Description of the file content (nullable)
- `order`: Order/sequence number within the chapter
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `uploadedBy`: Library user who uploaded the file
  - `id`: User ID
  - `email`: User email
  - `first_name`: User first name
  - `last_name`: User last name

### Error Responses
- **400**: Bad request - Validation error, missing file, or invalid file type/size
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found, material not found, chapter not found, or does not belong to user's platform
- **500**: Internal server error

### Notes
- File `order` is automatically assigned based on the highest existing order + 1 if not provided
- If no files exist for the chapter, the first file will have `order: 1`
- Files are ordered sequentially (1, 2, 3, ...) within each chapter
- `fileType` is auto-detected from the file extension if not provided
- Supported file types: PDF, DOC, DOCX, PPT, PPTX, and other document formats
- Maximum file size: 300MB
- Files are uploaded to cloud storage (S3/Cloudinary based on environment configuration)
- If database save fails, the uploaded file is automatically deleted from cloud storage (transactional rollback)
- The chapter and material must belong to the authenticated user's platform
- A chapter can have multiple files, allowing for supplementary materials or separate resources

---

## Notes

### Platform Scoping
- All general materials are scoped to the authenticated user's platform
- Only materials belonging to the user's platform are returned
- Cross-platform access is not allowed

### Ordering
- Materials in "Get All" endpoint: Ordered by `createdAt` (descending - newest first)
- Chapters: Automatically ordered sequentially (1, 2, 3, ...) based on creation order

### File Upload
- Supported file types: PDF, DOC, DOCX, PPT, PPTX, and other document formats
- Maximum file size: 300MB
- Files are uploaded to cloud storage (S3/Cloudinary based on environment configuration)
- The full material file is stored for offline download capability
- Chapters can have multiple files attached (see "Upload File for Chapter" endpoint)
- Chapter files are separate from the main material file and allow for supplementary resources

### AI Chat Integration
- Materials with `isAiEnabled: true` can be used for AI chat conversations
- Chapters help break down the material for better AI context understanding
- Chapter page ranges (`pageStart`, `pageEnd`) are used for precise AI chunking

### Status Management
- Materials can have status: `draft`, `published`, or `archived`
- Only published materials are typically visible to end users
- Draft materials are for internal review/editing
- Archived materials are hidden but not deleted

