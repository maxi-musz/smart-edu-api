# Teacher Subjects API Documentation

**Base URL:** `/teachers/subjects`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**Audience:** These endpoints are for **teachers** to manage subjects in their school.

**Important:** The school subjects system uses a two-level hierarchy:
- **Subject** → **Topics** (direct relationship)
- There is no chapter level between subjects and topics
- Topics are organized using an `order` field for sequencing within each subject

---

## Table of Contents
1. [Create Subject](#1-create-subject)
2. [Get All Subjects](#2-get-all-subjects)
3. [Get Subject By ID](#3-get-subject-by-id)
4. [Get Comprehensive Subject By ID](#4-get-comprehensive-subject-by-id)
5. [Update Subject](#5-update-subject)
6. [Delete Subject](#6-delete-subject)
7. [Assign Teacher to Subject](#7-assign-teacher-to-subject)
8. [Remove Teacher from Subject](#8-remove-teacher-from-subject)
9. [Get Teachers for Subject](#9-get-teachers-for-subject)

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

## 1. Create Subject

Create a new subject for the school in the specified academic session.

**Endpoint:** `POST /teachers/subjects`

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
  "name": "Mathematics",
  "code": "MATH101",
  "color": "#3B82F6",
  "description": "Advanced mathematics including algebra, calculus, and geometry",
  "thumbnail": {
    "secure_url": "https://example.com/image.jpg",
    "public_id": "image_id"
  },
  "academic_session_id": "clx1234567890abcdef"
}
```

**Request Body Structure:**
```typescript
{
  name: string;                    // Required: Subject name
  code?: string;                   // Optional: Subject code (e.g., MATH101)
  color?: string;                  // Optional: Hex color (default: #3B82F6)
  description?: string;            // Optional: Subject description
  thumbnail?: any;                // Optional: Thumbnail image object
  academic_session_id: string;    // Required: Academic session UUID
}
```

**Example Request:**
```
POST /teachers/subjects
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "id": "subject-uuid-1",
    "name": "Mathematics",
    "code": "MATH101",
    "color": "#3B82F6",
    "description": "Advanced mathematics including algebra, calculus, and geometry",
    "thumbnail": {
      "secure_url": "https://example.com/image.jpg",
      "public_id": "image_id"
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
    "topics": [],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    name: string;
    code: string | null;
    color: string;
    description: string | null;
    thumbnail: any | null;
    school: {
      id: string;
      school_name: string;
    };
    academicSession: {
      id: string;
      academic_year: string;
      term: string;
    };
    topics: Array<{
      id: string;
      title: string;
      description?: string;
      order: number;
      is_active: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

**Error Responses:**

**400 Bad Request - Duplicate Code:**
```json
{
  "success": false,
  "message": "Subject with code MATH101 already exists in this academic session",
  "data": null
}
```

**404 Not Found - Academic Session:**
```json
{
  "success": false,
  "message": "Academic session not found",
  "data": null
}
```

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
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

## 2. Get All Subjects

Get paginated list of **subjects assigned to the authenticated teacher** with filtering and sorting options.

**Endpoint:** `GET /teachers/subjects`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 10 | Number of items per page (max: 100) |
| search | string | No | - | Search by subject name, code, or description |
| academicSessionId | string | No | - | Filter by academic session ID |
| color | string | No | - | Filter by subject color |
| isActive | boolean | No | - | Filter by active status |
| sortBy | string | No | name | Sort field (name, code, createdAt, updatedAt) |
| sortOrder | string | No | asc | Sort order (asc, desc) |

**Example Request:**
```
GET /teachers/subjects?page=1&limit=10&search=math&sortBy=name&sortOrder=asc
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Successfully retrieved 2 subjects",
  "data": {
    "data": [
      {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#3B82F6",
        "description": "Advanced mathematics",
        "thumbnail": null,
        "school": {
          "id": "school-uuid-1",
          "school_name": "Example School"
        },
        "academicSession": {
          "id": "session-uuid-1",
          "academic_year": "2024/2025",
          "term": "first"
        },
        "topics": [
          {
            "id": "topic-uuid-1",
            "title": "Algebra Basics",
            "order": 1,
            "is_active": true
          }
        ],
        "createdAt": "2024-01-15T10:00:00.000Z",
        "updatedAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    data: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string;
      description: string | null;
      thumbnail: any | null;
      school: {
        id: string;
        school_name: string;
      };
      academicSession: {
        id: string;
        academic_year: string;
        term: string;
      };
      topics: Array<{
        id: string;
        title: string;
        order: number;
        is_active: boolean;
      }>;
      createdAt: Date;
      updatedAt: Date;
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}
```

**Important Notes:**

1. **Teacher's Subjects Only:** This endpoint returns only subjects assigned to the authenticated teacher via the TeacherSubject relationship.
2. **Filtering:** Use query parameters to filter by academic session, search term, color, or active status.
3. **Pagination:** Results are paginated with configurable page size (max 100 items per page).

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to fetch subjects",
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

## 3. Get Subject By ID

Get detailed information about a specific subject including all topics.

**Endpoint:** `GET /teachers/subjects/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Subject UUID |

**Example Request:**
```
GET /teachers/subjects/subject-uuid-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subject retrieved successfully",
  "data": {
    "id": "subject-uuid-1",
    "name": "Mathematics",
    "code": "MATH101",
    "color": "#3B82F6",
    "description": "Advanced mathematics including algebra, calculus, and geometry",
    "thumbnail": {
      "secure_url": "https://example.com/image.jpg",
      "public_id": "image_id"
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
    "topics": [
      {
        "id": "topic-uuid-1",
        "title": "Algebra Basics",
        "description": "Introduction to algebraic expressions",
        "order": 1,
        "is_active": true,
        "createdAt": "2024-01-16T10:00:00.000Z",
        "updatedAt": "2024-01-16T10:00:00.000Z"
      },
      {
        "id": "topic-uuid-2",
        "title": "Calculus Fundamentals",
        "description": "Basic calculus concepts",
        "order": 2,
        "is_active": true,
        "createdAt": "2024-01-17T10:00:00.000Z",
        "updatedAt": "2024-01-17T10:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    name: string;
    code: string | null;
    color: string;
    description: string | null;
    thumbnail: any | null;
    school: {
      id: string;
      school_name: string;
    };
    academicSession: {
      id: string;
      academic_year: string;
      term: string;
    };
    topics: Array<{
      id: string;
      title: string;
      description: string | null;
      order: number;
      is_active: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Subject not found",
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

## 4. Get Comprehensive Subject By ID

Get comprehensive subject information including paginated topics with videos and materials, statistics, and filters.

**Note:** The school subjects system uses a two-level hierarchy: **Subject → Topics** (direct relationship). There is no chapter level between subjects and topics. Topics are organized directly under subjects using an `order` field for sequencing.

**Endpoint:** `GET /teachers/subjects/:id/comprehensive`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Subject UUID |

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for topics pagination |
| limit | number | No | 10 | Number of topics per page (max: 100) |
| search | string | No | - | Search by topic title or description |
| status | string | No | - | Filter by status (active, inactive, draft) |
| type | string | No | all | Filter by content type (all, videos, materials, mixed) |
| orderBy | string | No | order | Sort field (order, title, createdAt, updatedAt) |
| orderDirection | string | No | asc | Sort order (asc, desc) |

**Example Request:**
```
GET /teachers/subjects/subject-uuid-1/comprehensive?page=1&limit=10&search=algebra&status=active&orderBy=order&orderDirection=asc
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subject and topics fetched successfully",
  "data": {
    "subject": {
      "id": "subject-uuid-1",
      "name": "Mathematics",
      "description": "Advanced mathematics including algebra, calculus, and geometry",
      "thumbnail": "https://example.com/image.jpg",
      "code": "MATH101",
      "color": "#3B82F6",
      "status": "active",
      "totalTopics": 5,
      "totalVideos": 15,
      "totalMaterials": 8,
      "totalStudents": 25,
      "progress": 65,
      "classes": ["jss2"],
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    "topics": [
      {
        "id": "topic-uuid-1",
        "title": "Algebra Basics",
        "description": "Introduction to algebraic expressions",
        "order": 1,
        "status": "active",
        "videos": [
          {
            "id": "video-uuid-1",
            "title": "Introduction to Algebra",
            "duration": "00:15",
            "thumbnail": "https://example.com/thumb.jpg",
            "url": "https://example.com/video.mp4",
            "uploadedAt": "2024-01-16T10:00:00.000Z",
            "size": "50 MB",
            "views": 120,
            "status": "published"
          }
        ],
        "materials": [
          {
            "id": "material-uuid-1",
            "title": "Algebra Worksheet",
            "type": "pdf",
            "size": "2 MB",
            "url": "https://example.com/worksheet.pdf",
            "uploadedAt": "2024-01-16T11:00:00.000Z",
            "downloads": 45,
            "status": "published"
          }
        ],
        "instructions": "Complete the assigned materials and videos.",
        "createdAt": "2024-01-16T10:00:00.000Z",
        "updatedAt": "2024-01-16T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "filters": {
      "search": "algebra",
      "status": "active",
      "type": "all",
      "orderBy": "order",
      "orderDirection": "asc"
    },
    "stats": {
      "totalTopics": 5,
      "totalVideos": 15,
      "totalMaterials": 8,
      "totalStudents": 25,
      "completedTopics": 3,
      "inProgressTopics": 2,
      "notStartedTopics": 0
    }
  }
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    subject: {
      id: string;
      name: string;
      description: string;
      thumbnail: string;
      code: string;
      color: string;
      status: string;
      totalTopics: number;
      totalVideos: number;
      totalMaterials: number;
      totalStudents: number;
      progress: number;
      classes: string[];
      createdAt: Date;
      updatedAt: Date;
    };
    topics: Array<{
      id: string;
      title: string;
      description: string;
      order: number;
      status: string;
      videos: Array<{
        id: string;
        title: string;
        duration: string;
        thumbnail: string;
        url: string;
        uploadedAt: Date;
        size: string;
        views: number;
        status: string;
      }>;
      materials: Array<{
        id: string;
        title: string;
        type: string;
        size: string;
        url: string;
        uploadedAt: Date;
        downloads: number;
        status: string;
      }>;
      instructions: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    filters: {
      search: string;
      status: string;
      type: string;
      orderBy: string;
      orderDirection: string;
    };
    stats: {
      totalTopics: number;
      totalVideos: number;
      totalMaterials: number;
      totalStudents: number;
      completedTopics: number;
      inProgressTopics: number;
      notStartedTopics: number;
    };
  };
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Subject not found",
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

## 5. Update Subject

Update an existing subject's information.

**Endpoint:** `PATCH /teachers/subjects/:id`

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
| id | string | Yes | Subject UUID |

**Request Body:**
```json
{
  "name": "Advanced Mathematics",
  "code": "MATH201",
  "color": "#FF5733",
  "description": "Updated description",
  "thumbnail": {
    "secure_url": "https://example.com/new-image.jpg",
    "public_id": "new_image_id"
  }
}
```

**Request Body Structure:**
```typescript
{
  name?: string;          // Optional: Subject name
  code?: string;          // Optional: Subject code
  color?: string;         // Optional: Hex color
  description?: string;   // Optional: Subject description
  thumbnail?: any;        // Optional: Thumbnail image object
}
```

**Example Request:**
```
PATCH /teachers/subjects/subject-uuid-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {
    "id": "subject-uuid-1",
    "name": "Advanced Mathematics",
    "code": "MATH201",
    "color": "#FF5733",
    "description": "Updated description",
    "thumbnail": {
      "secure_url": "https://example.com/new-image.jpg",
      "public_id": "new_image_id"
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
    "topics": [],
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

**Response Structure:**
```typescript
{
  success: true;
  message: string;
  data: {
    id: string;
    name: string;
    code: string | null;
    color: string;
    description: string | null;
    thumbnail: any | null;
    school: {
      id: string;
      school_name: string;
    };
    academicSession: {
      id: string;
      academic_year: string;
      term: string;
    };
    topics: Array<{
      id: string;
      title: string;
      description?: string;
      order: number;
      is_active: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  };
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Subject not found",
  "data": null
}
```

**400 Bad Request - Duplicate Code:**
```json
{
  "success": false,
  "message": "Subject with code MATH201 already exists in this academic session",
  "data": null
}
```

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
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

## 6. Delete Subject

Delete a subject. Subject must not have any associated topics.

**Endpoint:** `DELETE /teachers/subjects/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Subject UUID |

**Example Request:**
```
DELETE /teachers/subjects/subject-uuid-1
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
  "message": "Subject not found",
  "data": null
}
```

**400 Bad Request - Has Topics:**
```json
{
  "success": false,
  "message": "Cannot delete subject. It has 5 topic(s) associated with it.",
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

## 7. Assign Teacher to Subject

Assign a teacher to teach a subject.

**Endpoint:** `POST /teachers/subjects/:id/assign-teacher`

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
| id | string | Yes | Subject UUID |

**Request Body:**
```json
{
  "teacherId": "teacher-uuid-1"
}
```

**Request Body Structure:**
```typescript
{
  teacherId: string;  // Required: Teacher UUID
}
```

**Example Request:**
```
POST /teachers/subjects/subject-uuid-1/assign-teacher
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher assigned to subject successfully",
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

**404 Not Found - Teacher:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
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

## 8. Remove Teacher from Subject

Remove a teacher from teaching a subject.

**Endpoint:** `DELETE /teachers/subjects/:id/remove-teacher`

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
| id | string | Yes | Subject UUID |

**Request Body:**
```json
{
  "teacherId": "teacher-uuid-1"
}
```

**Request Body Structure:**
```typescript
{
  teacherId: string;  // Required: Teacher UUID
}
```

**Example Request:**
```
DELETE /teachers/subjects/subject-uuid-1/remove-teacher
```

**Success Response (204 No Content):**
```
No response body
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to remove teacher from subject",
  "data": null
}
```

---

## 9. Get Teachers for Subject

Get list of all teachers assigned to teach a specific subject.

**Endpoint:** `GET /teachers/subjects/:id/teachers`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Subject UUID |

**Example Request:**
```
GET /teachers/subjects/subject-uuid-1/teachers
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teachers retrieved successfully",
  "data": [
    {
      "id": "teacher-uuid-1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@school.edu.ng",
      "teacher_id": "tch/2024/001",
      "employee_number": "EMP001",
      "qualification": "B.Sc Mathematics",
      "specialization": "Pure Mathematics",
      "years_of_experience": 5,
      "department": "Mathematics",
      "is_class_teacher": true,
      "status": "active"
    },
    {
      "id": "teacher-uuid-2",
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.smith@school.edu.ng",
      "teacher_id": "tch/2024/002",
      "employee_number": "EMP002",
      "qualification": "M.Sc Mathematics",
      "specialization": "Applied Mathematics",
      "years_of_experience": 8,
      "department": "Mathematics",
      "is_class_teacher": false,
      "status": "active"
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
    first_name: string;
    last_name: string;
    email: string;
    teacher_id: string;
    employee_number: string | null;
    qualification: string | null;
    specialization: string | null;
    years_of_experience: number | null;
    department: string | null;
    is_class_teacher: boolean;
    status: string;
  }>;
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to fetch teachers for subject",
  "data": null
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
}
```

### Success Response Pattern
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // ... response data here ...
  }
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
| 204 | No Content - Resource deleted/updated successfully (no response body) |
| 400 | Bad Request - Invalid request data or validation error |
| 401 | Unauthorized - Missing or invalid authentication token |
| 404 | Not Found - Resource not found (subject, teacher, academic session) |
| 500 | Internal Server Error - Server error occurred |

---

## Data Types & Enums

### Sort Options
```typescript
type SortBy = 'name' | 'code' | 'createdAt' | 'updatedAt' | 'order' | 'title';
type SortOrder = 'asc' | 'desc';
```

### Topic Status
```typescript
type TopicStatus = 'active' | 'inactive' | 'draft';
```

### Content Type Filter
```typescript
type ContentType = 'all' | 'videos' | 'materials' | 'mixed';
```

### Teacher Status
```typescript
type TeacherStatus = 'active' | 'inactive' | 'suspended';
```

---

## Example Usage (JavaScript/TypeScript)

### Creating a Subject

```typescript
const createSubject = async (subjectData) => {
  try {
    const response = await fetch('/teachers/subjects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subjectData)
    });

    const result = await response.json();
    
    if (result.success) {
      const subject = result.data;
      console.log('Subject created:', subject.name);
      return subject;
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

### Getting All Subjects with Pagination

```typescript
const fetchSubjects = async (filters) => {
  try {
    const params = new URLSearchParams({
      page: filters.page || '1',
      limit: filters.limit || '10',
      ...(filters.search && { search: filters.search }),
      ...(filters.academicSessionId && { academicSessionId: filters.academicSessionId }),
      sortBy: filters.sortBy || 'name',
      sortOrder: filters.sortOrder || 'asc'
    });

    const response = await fetch(`/teachers/subjects?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { data, meta } = result.data;
      console.log('Subjects:', data);
      console.log('Pagination:', meta);
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

### Getting Comprehensive Subject Data

```typescript
const fetchComprehensiveSubject = async (subjectId, filters) => {
  try {
    const params = new URLSearchParams({
      page: filters.page || '1',
      limit: filters.limit || '10',
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      type: filters.type || 'all',
      orderBy: filters.orderBy || 'order',
      orderDirection: filters.orderDirection || 'asc'
    });

    const response = await fetch(`/teachers/subjects/${subjectId}/comprehensive?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { subject, topics, pagination, stats } = result.data;
      console.log('Subject:', subject.name);
      console.log('Topics:', topics.length);
      console.log('Stats:', stats);
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

### Assigning Teacher to Subject

```typescript
const assignTeacher = async (subjectId, teacherId) => {
  try {
    const response = await fetch(`/teachers/subjects/${subjectId}/assign-teacher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ teacherId })
    });

    const result = await response.json();
    
    if (result.success) {
      showToast('success', result.message);
      return true;
    } else {
      showToast('error', result.message);
      return false;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to assign teacher');
    return false;
  }
};
```

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in all requests
2. **Response Checking:** Always check `success` field before accessing `data`
3. **Error Handling:** Display user-friendly error messages via toasters
4. **Pagination:** Implement pagination controls for list endpoints
5. **Search Debouncing:** Add 300-500ms debounce to search inputs
6. **Color Usage:** Use subject colors consistently across all views
7. **Loading States:** Show loading indicators during API calls
8. **Validation:** Validate required fields before submitting forms
9. **Delete Confirmation:** Show confirmation dialog before deleting subjects
10. **Empty State Handling:** Handle cases where no subjects or teachers are found

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 20, 2026

