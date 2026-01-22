# Library General Materials API Integration Guide

## Table of Contents
1. [Authentication](#authentication)
2. [Get All Library Classes](#1-get-all-library-classes)
3. [Get General Materials Dashboard](#2-get-general-materials-dashboard)
4. [Get All General Materials](#3-get-all-general-materials)
5. [Get Single General Material by ID](#4-get-single-general-material-by-id)
6. [Get Chapters for a Material](#5-get-chapters-for-a-material)
7. [Create General Material](#6-create-general-material)
8. [Start General Material Upload (with Progress)](#7-start-general-material-upload-with-progress)
9. [Track Upload Progress](#8-track-upload-progress)
10. [Create Chapter with File Upload (Recommended)](#9-create-chapter-with-file-upload-recommended)
11. [Create General Material Chapter (Without File)](#10-create-general-material-chapter-without-file)
12. [Upload File for Existing Chapter](#11-upload-file-for-existing-chapter)

---

## Authentication

All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

**Base URL:** `/api/v1/library/general-materials`

---

## 1. Get All Library Classes

**Endpoint:** `GET /api/v1/library/general-materials/classes`

### Description
Retrieves all available library classes for dropdown selection when creating a new general material. Classes are ordered by their `order` field (ascending).

### Request
No request body required. Only requires authentication token.

### Example Request
```
GET /api/v1/library/general-materials/classes
Authorization: Bearer <token>
```

### Success Response (200)

```json
{
  "success": true,
  "message": "Library classes retrieved successfully",
  "data": [
    {
      "id": "class_123",
      "name": "JSS 1",
      "order": 1,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "class_456",
      "name": "JSS 2",
      "order": 2,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "id": "class_789",
      "name": "SSS 1",
      "order": 3,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Response Structure Breakdown

#### Classes Array
Array of library class objects, each containing:
- `id`: Class ID (use this in `classIds` array when creating materials)
- `name`: Class name (e.g., "JSS 1", "SSS 1")
- `order`: Display order (ascending)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **500**: Internal server error

### Notes
- Use this endpoint to populate a dropdown/select component when creating a new general material
- One material can be linked to multiple classes (many-to-many relationship)
- Pass an array of class IDs in the `classIds` field when creating a material

---

## 2. Get General Materials Dashboard

**Endpoint:** `GET /api/v1/library/general-materials/dashboard`

### Description
Retrieves comprehensive dashboard statistics for general materials (ebooks/textbooks) on the authenticated library user's platform. Returns high-level statistics including total materials, AI-enabled materials, chapters, and recent materials with their associated classes.

### Request
No request body required. Only requires authentication token.

### Example Request
```
GET /api/v1/library/general-materials/dashboard
Authorization: Bearer <token>
```

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
        },
        "classes": [
          {
            "id": "class_123",
            "name": "SSS 1",
            "order": 3
          },
          {
            "id": "class_456",
            "name": "SSS 2",
            "order": 4
          }
        ]
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
        },
        "classes": []
      }
    ],
    "libraryClasses": [
      {
        "id": "class_123",
        "name": "JSS 1",
        "order": 1,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      },
      {
        "id": "class_456",
        "name": "JSS 2",
        "order": 2,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
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
Array of recent general materials (up to 20, ordered by creation date descending), each containing:
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
- `classes`: **Array of classes this material belongs to (can be empty)**
  - `id`: Class ID
  - `name`: Class name
  - `order`: Class order

#### Library Classes Array
Array of all available library classes (for reference), each containing:
- `id`: Class ID
- `name`: Class name
- `order`: Display order
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

---

## 3. Get All General Materials

**Endpoint:** `GET /api/v1/library/general-materials/all`

### Description
Retrieves a paginated list of all general materials for the authenticated library user's platform. Supports professional filtering, search, and pagination. Each material includes its associated classes array.

### Query Parameters
All query parameters are optional:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (minimum: 1) |
| `limit` | number | 20 | Items per page (minimum: 1, maximum: 100) |
| `search` | string | - | Search term to match against title, author, description, or publisher (case-insensitive) |
| `isAiEnabled` | boolean | - | Filter by AI-enabled materials (true) or non-AI materials (false) |
| `classId` | string | - | Filter by single library class ID |
| `classIds` | string[] | - | Filter by multiple library class IDs (array) - materials that belong to ANY of these classes |
| `subjectId` | string | - | Filter by library subject ID |

### Example Requests

**Basic pagination:**
```
GET /api/v1/library/general-materials/all?page=1&limit=20
Authorization: Bearer <token>
```

**With search:**
```
GET /api/v1/library/general-materials/all?page=1&limit=20&search=algebra
Authorization: Bearer <token>
```

**Filter by AI-enabled:**
```
GET /api/v1/library/general-materials/all?isAiEnabled=true
Authorization: Bearer <token>
```

**Filter by single class:**
```
GET /api/v1/library/general-materials/all?classId=class_123
Authorization: Bearer <token>
```

**Filter by multiple classes:**
```
GET /api/v1/library/general-materials/all?classIds[]=class_123&classIds[]=class_456
Authorization: Bearer <token>
```

**Combined filters:**
```
GET /api/v1/library/general-materials/all?page=1&limit=20&search=algebra&isAiEnabled=true&classIds[]=class_123&classIds[]=class_456
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
        "classes": [
          {
            "id": "class_123",
            "name": "SSS 1",
            "order": 3
          },
          {
            "id": "class_456",
            "name": "SSS 2",
            "order": 4
          }
        ],
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
        "classes": [],
        "subject": null,
        "uploadedBy": {
          "id": "user_456",
          "email": "jane@example.com",
          "first_name": "Jane",
          "last_name": "Smith"
        }
      }
    ],
    "libraryClasses": [
      {
        "id": "class_123",
        "name": "JSS 1",
        "order": 1,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
      },
      {
        "id": "class_456",
        "name": "JSS 2",
        "order": 2,
        "createdAt": "2025-01-01T00:00:00.000Z",
        "updatedAt": "2025-01-01T00:00:00.000Z"
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
- `isAvailable`: Whether the material is available
- `isAiEnabled`: Whether AI chat is enabled for this material
- `status`: Material status (published, draft, archived)
- `views`: Number of views
- `downloads`: Number of downloads
- `thumbnailUrl`: Thumbnail image URL (nullable)
- `thumbnailS3Key`: S3 object key for thumbnail (nullable)
- `chapterCount`: Number of chapters in this material
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `classes`: **Array of classes this material belongs to (can be empty array)**
  - `id`: Class ID
  - `name`: Class name
  - `order`: Class order
- `subject`: Associated library subject (nullable)
  - `id`: Subject ID
  - `name`: Subject name
  - `code`: Subject code
- `uploadedBy`: Library user who uploaded the material
  - `id`: User ID
  - `email`: User email
  - `first_name`: User first name
  - `last_name`: User last name

#### Library Classes Array
Array of all available library classes (for reference/filtering UI), each containing:
- `id`: Class ID
- `name`: Class name
- `order`: Display order
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

#### Meta Object
- `totalItems`: Total number of materials matching the query
- `totalPages`: Total number of pages
- `currentPage`: Current page number
- `limit`: Items per page

### Error Responses
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

### Notes
- Materials are ordered by `createdAt` (descending - newest first)
- When filtering by `classIds` array, materials that belong to ANY of the specified classes will be returned
- The `classes` array can be empty if a material is not linked to any classes
- Use `libraryClasses` array to build filter UI components

---

## 4. Get Single General Material by ID

**Endpoint:** `GET /api/v1/library/general-materials/:materialId`

### Description
Retrieves detailed information for a specific general material, including all its chapters, chapter files, and associated classes.

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
    "classes": [
      {
        "id": "class_123",
        "name": "SSS 1",
        "order": 3
      },
      {
        "id": "class_456",
        "name": "SSS 2",
        "order": 4
      }
    ],
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
        "isAiEnabled": true,
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
        "isAiEnabled": true,
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
- `classes`: **Array of classes this material belongs to (can be empty array)**
  - `id`: Class ID
  - `name`: Class name
  - `order`: Class order
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
  - `isAiEnabled`: Whether AI chat is enabled for this chapter
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
- The `classes` array can be empty if the material is not linked to any classes

---

## 5. Get Chapters for a Material

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
      "isAiEnabled": true,
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
      "isAiEnabled": true,
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
- `isAiEnabled`: Whether AI chat is enabled for this chapter
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

## 6. Create General Material

**Endpoint:** `POST /api/v1/library/general-materials`

### Description
Creates a new general material (ebook/textbook) for the authenticated library user's platform in **one step**. Uploads the full material file to cloud storage and stores its metadata in the database. Supports linking to multiple classes (many-to-many relationship).

> **Note:** This endpoint does **not** provide progress tracking. For large files and better UX, prefer `POST /upload/start` + progress endpoints (see section 7).

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
| `classIds` | string[] | No | **Array of library class IDs** - one material can be linked to multiple classes |

### Example Request (multipart/form-data)

**Using FormData (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('thumbnail', thumbnailBlob);
formData.append('title', 'Advanced Algebra for Senior Secondary Schools');
formData.append('description', 'A comprehensive guide to advanced algebra concepts.');
formData.append('author', 'John Doe');
formData.append('isbn', '978-3-16-148410-0');
formData.append('publisher', 'Smart Edu Publishing');
formData.append('classIds[]', 'class_123');
formData.append('classIds[]', 'class_456');

fetch('/api/v1/library/general-materials', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});
```

**Using cURL:**
```bash
curl -X POST \
  https://api.example.com/api/v1/library/general-materials \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@material.pdf' \
  -F 'thumbnail=@thumbnail.jpg' \
  -F 'title=Advanced Algebra for Senior Secondary Schools' \
  -F 'description=A comprehensive guide to advanced algebra concepts.' \
  -F 'author=John Doe' \
  -F 'isbn=978-3-16-148410-0' \
  -F 'publisher=Smart Edu Publishing' \
  -F 'classIds[]=class_123' \
  -F 'classIds[]=class_456'
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
    "isAiEnabled": false,
    "status": "draft",
    "views": 0,
    "downloads": 0,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "uploadedBy": {
      "id": "user_123",
      "email": "uploader@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "classes": [
      {
        "id": "class_123",
        "name": "SSS 1",
        "order": 3
      },
      {
        "id": "class_456",
        "name": "SSS 2",
        "order": 4
      }
    ],
    "pdfMaterialId": "pdf_material_123"
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
- `thumbnailS3Key`: S3 object key for thumbnail (nullable)
- `isAvailable`: Whether the material is available
- `isAiEnabled`: Whether AI chat is enabled (default: false)
- `status`: Material status (default: "draft")
- `views`: Number of views (default: 0)
- `downloads`: Number of downloads (default: 0)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `uploadedBy`: Library user who uploaded the material
  - `id`: User ID
  - `email`: User email
  - `first_name`: User first name
  - `last_name`: User last name
- `classes`: **Array of classes this material is linked to (can be empty array)**
  - `id`: Class ID
  - `name`: Class name
  - `order`: Class order
- `pdfMaterialId`: ID of the corresponding PDFMaterial record (for backward compatibility)

### Error Responses
- **400**: Bad request - Validation error, missing file, invalid file type/size, or invalid class IDs
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

### Notes
- File upload supports: PDF, DOC, DOCX, PPT, PPTX, and other document formats
- Maximum file size: 300MB
- Maximum thumbnail size: 5MB
- `classIds` is an array - you can link one material to multiple classes
- If `classIds` is provided, all class IDs must exist in the database
- If any class ID is invalid, the request will fail with a 400 error listing the invalid IDs
- The material is created with status "draft" by default
- Use the "Get All Library Classes" endpoint to fetch available classes for the dropdown

---

## 7. Start General Material Upload (with Progress)

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
| `classIds` | string[] | No | **Array of library class IDs** - one material can be linked to multiple classes |

### Example Request
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
classIds[]: class_123
classIds[]: class_456
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
- **400**: Bad request - Invalid file, file too large, validation error, or invalid class IDs
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found or platform not found
- **500**: Internal server error

---

## 8. Track Upload Progress

You can track upload progress using **SSE (recommended)** or **polling**.

### 8.1 SSE Stream (Recommended)

**Endpoint:** `GET /api/v1/library/general-materials/upload-progress/:sessionId`

Returns a Server-Sent Events (SSE) stream with real-time progress updates.

**Example (JavaScript):**
```javascript
const eventSource = new EventSource(
  `/api/v1/library/general-materials/upload-progress/${sessionId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

eventSource.onmessage = (event) => {
  const progress = JSON.parse(event.data);
  console.log(`Progress: ${progress.progress}%`);
  console.log(`Stage: ${progress.stage}`);
  
  if (progress.stage === 'completed') {
    console.log(`Material ID: ${progress.materialId}`);
    eventSource.close();
  } else if (progress.stage === 'error') {
    console.error(`Error: ${progress.error}`);
    eventSource.close();
  }
};
```

### 8.2 Polling (Alternative)

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

### Progress Response Fields
- `sessionId`: Upload session ID
- `progress`: Progress percentage (0-100)
- `stage`: Current upload stage
- `message`: Human-readable status message
- `bytesUploaded`: Number of bytes uploaded so far
- `totalBytes`: Total file size in bytes
- `estimatedTimeRemaining`: Estimated time remaining in seconds
- `error`: Error message (null if no error)
- `materialId`: Material ID (only present when `stage` is "completed")

---

## 9. Create Chapter with File Upload (Recommended)

**Endpoint:** `POST /api/v1/library/general-materials/:materialId/chapters/with-file`

### Description
Creates a new chapter under a general material **and uploads a file** in a single multipart request. This is the **recommended endpoint** for creating chapters with files, as it combines both operations into one step. The file is automatically processed for AI chat if enabled (default: true).

**Key Features:**
- Creates chapter and uploads file in one request
- Automatically processes file for AI chat (if material has AI enabled)
- Sets chapter `isAiEnabled` and `isProcessed` to `true` after successful AI processing
- Returns complete chapter with file information

### Request Parameters
- `materialId` (path parameter): The ID of the general material

### Request
**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | File to upload (PDF, DOC, DOCX, PPT, PPTX, etc. - max 300MB) |
| `title` | string | Yes | Title of the chapter (max 200 characters) |
| `description` | string | No | Description of the chapter (max 2000 characters) |
| `pageStart` | number | No | Starting page number in the full material (minimum: 1) |
| `pageEnd` | number | No | Ending page number in the full material (minimum: 1) |
| `isAiEnabled` | boolean | No | Whether AI chat is enabled for this chapter (default: false). Note: Material must have `isAiEnabled=true` |
| `fileTitle` | string | No | Optional title/name for the file (defaults to original filename, max 200 characters) |
| `fileDescription` | string | No | Optional description of the file content (max 2000 characters) |
| `fileType` | string | No | Optional file type (PDF, DOC, PPT, VIDEO, NOTE). Auto-detected from extension if not provided |
| `fileOrder` | number | No | Optional order/sequence number for the file (default: 1, minimum: 1) |
| `enableAiChat` | boolean | No | Enable AI chat processing for this file (default: true). Requires material to have AI chat enabled |

### Example Request

**Using FormData (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('title', 'Chapter 1: Introduction to Algebra');
formData.append('description', 'This chapter introduces basic algebraic concepts.');
formData.append('pageStart', '1');
formData.append('pageEnd', '20');
formData.append('isAiEnabled', 'true');
formData.append('fileTitle', 'Chapter 1 - Introduction PDF');
formData.append('enableAiChat', 'true');

fetch('/api/v1/library/general-materials/material_123/chapters/with-file', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <token>'
  },
  body: formData
});
```

**Using cURL:**
```bash
curl -X POST \
  https://api.example.com/api/v1/library/general-materials/material_123/chapters/with-file \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@chapter1.pdf' \
  -F 'title=Chapter 1: Introduction to Algebra' \
  -F 'description=This chapter introduces basic algebraic concepts.' \
  -F 'pageStart=1' \
  -F 'pageEnd=20' \
  -F 'isAiEnabled=true' \
  -F 'fileTitle=Chapter 1 - Introduction PDF' \
  -F 'enableAiChat=true'
```

### Success Response (201)

```json
{
  "success": true,
  "message": "Chapter with file created successfully",
  "data": {
    "id": "chapter_123",
    "materialId": "material_123",
    "platformId": "platform_123",
    "title": "Chapter 1: Introduction to Algebra",
    "description": "This chapter introduces basic algebraic concepts.",
    "pageStart": 1,
    "pageEnd": 20,
    "order": 1,
    "isAiEnabled": true,
    "isProcessed": true,
    "chunkCount": 15,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "files": [
      {
        "id": "file_123",
        "fileName": "chapter1.pdf",
        "fileType": "PDF",
        "url": "https://s3.amazonaws.com/bucket/library/general-materials/chapters/platform_123/material_123/chapter_123/file_abc123.pdf",
        "sizeBytes": 2048576,
        "title": "Chapter 1 - Introduction PDF",
        "description": null,
        "order": 1,
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    ]
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
- `isAiEnabled`: Whether AI chat is enabled for this chapter (set to `true` if AI processing succeeded)
- `isProcessed`: Whether the chapter has been processed for AI (set to `true` if AI processing succeeded)
- `chunkCount`: Number of AI chunks created for this chapter (0 if not processed)
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `files`: Array of files attached to this chapter
  - `id`: File ID
  - `fileName`: Original filename
  - `fileType`: Type of file (PDF, DOC, PPT, VIDEO, NOTE)
  - `url`: Public or signed URL to access the file
  - `sizeBytes`: File size in bytes
  - `title`: Title/name for the file (nullable)
  - `description`: Description of the file content (nullable)
  - `order`: Order/sequence number within the chapter
  - `createdAt`: Creation timestamp

### Error Responses
- **400**: Bad request - Validation error, missing file, invalid file type/size, or material doesn't have AI enabled when `enableAiChat=true`
- **401**: Unauthorized - Invalid or missing token
- **404**: Library user not found, material not found, or material does not belong to user's platform
- **500**: Internal server error

### Notes
- **AI Processing:** If `enableAiChat` is `true` (default) and the material has `isAiEnabled=true`, the file is automatically processed for AI chat:
  - Text is extracted from the file
  - Content is chunked for better context understanding
  - Embeddings are generated
  - Chunks are stored in Pinecone vector database
  - Chapter is updated with `isAiEnabled: true` and `isProcessed: true`
- Chapter `order` is automatically assigned based on the highest existing order + 1
- If no chapters exist for the material, the first chapter will have `order: 1`
- File `order` defaults to 1 if not provided
- `fileType` is auto-detected from the file extension if not provided
- If AI processing fails, the chapter and file are still created (error is logged but doesn't fail the request)
- The material must belong to the authenticated user's platform
- **This is the recommended endpoint** for creating chapters with files

---

## 10. Create General Material Chapter (Without File)

**Endpoint:** `POST /api/v1/library/general-materials/:materialId/chapters`

### Description
Creates a new chapter under a general material **without uploading a file**. Use this endpoint if you want to create a chapter first and upload files later, or if the chapter doesn't need a file. For creating a chapter with a file in one step, use the **"Create Chapter with File Upload"** endpoint above.

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
    "isAiEnabled": false,
    "isProcessed": false,
    "chunkCount": 0,
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
- `isAiEnabled`: Whether AI chat is enabled for this chapter (default: false)
- `isProcessed`: Whether the chapter has been processed for AI (default: false)
- `chunkCount`: Number of AI chunks created for this chapter (default: 0)
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
- **For creating a chapter with a file in one step, use the "Create Chapter with File Upload" endpoint above**

---

## 11. Upload File for Existing Chapter

**Endpoint:** `POST /api/v1/library/general-materials/:materialId/chapters/:chapterId/files`

### Description
Uploads a file (PDF, DOC, PPT, etc.) to an **existing chapter**. A chapter can have multiple files. Files are automatically ordered sequentially if order is not provided. This allows chapters to have supplementary materials, separate PDFs, or additional resources beyond the main material file.

**Use this endpoint when:**
- You've already created a chapter and want to add a file to it
- You want to add additional files to an existing chapter
- You created a chapter without a file and now want to upload one

**Note:** If you're creating a new chapter with a file, use the **"Create Chapter with File Upload"** endpoint instead (section 9).

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
- **AI Processing:** If `enableAiChat` is `true` (default) and the material has `isAiEnabled=true`, the file is **fully processed for AI chat**:
  - Text is extracted from the file
  - Content is chunked for better context understanding
  - Embeddings are generated
  - Chunks are stored in Pinecone vector database
  - Chapter is updated with `isAiEnabled: true` and `isProcessed: true`
- File `order` is automatically assigned based on the highest existing order + 1 if not provided
- If no files exist for the chapter, the first file will have `order: 1`
- Files are ordered sequentially (1, 2, 3, ...) within each chapter
- `fileType` is auto-detected from the file extension if not provided
- Supported file types: PDF, DOC, DOCX, PPT, PPTX, and other document formats
- Maximum file size: 300MB
- Files are uploaded to cloud storage (S3/Cloudinary based on environment configuration)
- If database save fails, the uploaded file is automatically deleted from cloud storage (transactional rollback)
- If AI processing fails, the file is still created but the chapter's AI status may not be updated
- The chapter and material must belong to the authenticated user's platform
- A chapter can have multiple files, allowing for supplementary materials or separate resources
- **For creating a new chapter with a file in one step, use the "Create Chapter with File Upload" endpoint (section 9)**

---

## General Notes

### Platform Scoping
- All general materials are scoped to the authenticated user's platform
- Only materials belonging to the user's platform are returned
- Cross-platform access is not allowed

### Many-to-Many Class Relationship
- One general material can be linked to **multiple classes** (many-to-many relationship)
- Use the `classIds` array when creating a material (e.g., `classIds[]=class_123&classIds[]=class_456`)
- The `classes` array in responses can be empty if a material is not linked to any classes
- Use the "Get All Library Classes" endpoint to fetch available classes for dropdown selection

### Ordering
- Materials in "Get All" endpoint: Ordered by `createdAt` (descending - newest first)
- Chapters: Automatically ordered sequentially (1, 2, 3, ...) based on creation order
- Files within chapters: Ordered by `order` (ascending)

### File Upload
- Supported file types: PDF, DOC, DOCX, PPT, PPTX, and other document formats
- Maximum file size: 300MB
- Maximum thumbnail size: 5MB
- Files are uploaded to cloud storage (S3/Cloudinary based on environment configuration)
- The full material file is stored for offline download capability
- Chapters can have multiple files attached (see "Upload File for Chapter" endpoint)
- Chapter files are separate from the main material file and allow for supplementary resources

### AI Chat Integration
- Materials with `isAiEnabled: true` can be used for AI chat conversations
- Chapters help break down the material for better AI context understanding
- Chapter page ranges (`pageStart`, `pageEnd`) are used for precise AI chunking
- Individual chapters can also have `isAiEnabled: true` for granular AI control
- **When a chapter file is uploaded (via "Create Chapter with File" or "Upload File for Chapter" endpoints):**
  - If `enableAiChat` is `true` (default) and the material has `isAiEnabled: true`, the file is **fully processed for AI chat**
  - Text is extracted from the file
  - Content is chunked for better context understanding
  - Embeddings are generated and stored in Pinecone vector database
  - Chapter is automatically updated with `isAiEnabled: true` and `isProcessed: true`
  - The processed chunks are immediately available for AI chat conversations

### Status Management
- Materials can have status: `draft`, `published`, or `archived`
- Only published materials are typically visible to end users
- Draft materials are for internal review/editing
- Archived materials are hidden but not deleted

### Filtering and Search
- Search works across: title, author, description, and publisher fields (case-insensitive)
- Filtering by `classIds` array returns materials that belong to **ANY** of the specified classes
- All filters can be combined for advanced querying
- Pagination is always applied (default: page 1, limit 20)

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "data": null
}
```

### Common HTTP Status Codes
- **200**: Success (GET requests)
- **201**: Created (POST requests - resource created)
- **202**: Accepted (POST requests - async operation started)
- **400**: Bad Request - Validation error or invalid input
- **401**: Unauthorized - Invalid or missing authentication token
- **404**: Not Found - Resource not found or doesn't belong to user's platform
- **500**: Internal Server Error - Server-side error

---

## Support

For questions or issues, please contact the development team or refer to the main API documentation.
