# Library Users – Frontend API Reference

Use this document to integrate the **Library Users** feature: endpoints, request payloads, response shapes, and status codes. All endpoints require **Library JWT** (Bearer token).

**Base URL:** `api/v1/library/users`

**Auth:** Send the library access token in the header:
```http
Authorization: Bearer <library_jwt_token>
```

**Response wrapper:** Every successful response has this shape:
```json
{
  "success": true,
  "message": "string",
  "data": { ... }
}
```
Error responses may omit `data` or return a different structure (e.g. validation messages).

---

## Access levels

| Level | Who | Endpoints |
|-------|-----|-----------|
| **Any library user** | Any logged-in library user | `GET /dashboard` |
| **Library owner/manager** | `admin` or `manager` role | `GET /dashboard`, `GET /analytics/upload-analytics`, `GET /available-permissions` |
| **Elevated** | User with `permissionLevel >= 10` or `manage_library_users` in `permissions` | All of the above + `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` |

---

## 1. Dashboard (paginated users + library stats)

**GET** `api/v1/library/users/dashboard`

**Access:** Any library user.

**Query parameters (all optional):**

| Parameter  | Type   | Default   | Description |
|-----------|--------|-----------|-------------|
| `page`    | number | 1         | Page number (1-based). |
| `limit`   | number | 20        | Items per page (1–100). |
| `search`  | string | -         | Search by email, first name, or last name (case-insensitive). |
| `sortBy`  | string | `createdAt` | One of: `createdAt`, `email`, `first_name`, `last_name`, `role`, `status`. |
| `sortOrder` | string | `desc` | `asc` or `desc`. |
| `role`    | string | -         | Filter by role: `admin`, `manager`, `content_creator`, `reviewer`, `viewer`. |
| `status`  | string | -         | Filter by status: `active`, `inactive`, `suspended`. |

**Example:** `GET api/v1/library/users/dashboard?page=1&limit=20&search=jane&sortBy=email&sortOrder=asc&role=content_creator&status=active`

**Status codes:** `200` OK, `401` Unauthorized

**Response (200):**
```json
{
  "success": true,
  "message": "Library users dashboard retrieved successfully",
  "data": {
    "library": {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "status": "string"
    },
    "summary": {
      "totalUsers": 0,
      "byRole": {
        "admin": 0,
        "manager": 0,
        "content_creator": 0,
        "reviewer": 0,
        "viewer": 0
      },
      "byStatus": {
        "active": 0,
        "inactive": 0,
        "suspended": 0
      }
    },
    "contentStats": {
      "subjects": 0,
      "topics": 0,
      "videos": 0,
      "materials": 0,
      "assessments": 0,
      "generalMaterials": 0
    },
    "schoolsWithAccess": 0,
    "users": [
      {
        "id": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "phone_number": "string | null",
        "role": "string",
        "userType": "string",
        "status": "string",
        "permissions": ["string"],
        "permissionLevel": "number | null",
        "createdAt": "string (ISO date)",
        "updatedAt": "string (ISO date)",
        "_count": {
          "uploadedVideos": 0,
          "uploadedMaterials": 0,
          "uploadedAssignments": 0,
          "uploadedLinks": 0,
          "uploadedGeneralMaterials": 0,
          "createdAssessments": 0
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

---

## 2. List library users (manage/upload roles only)

**GET** `api/v1/library/users`

**Access:** Elevated (permissionLevel >= 10 or `manage_library_users`).

**Query parameters:** None.

**Status codes:** `200` OK, `401` Unauthorized, `403` Forbidden

**Response (200):**
```json
{
  "success": true,
  "message": "Library users retrieved successfully",
  "data": [
    {
      "id": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "phone_number": "string | null",
      "role": "string",
      "userType": "string",
      "permissions": ["string"],
      "permissionLevel": "number | null",
      "status": "string",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)",
      "_count": {
        "uploadedVideos": 0,
        "uploadedMaterials": 0,
        "uploadedAssignments": 0,
        "uploadedLinks": 0,
        "uploadedGeneralMaterials": 0,
        "createdAssessments": 0
      }
    }
  ]
}
```

---

## 3. Upload analytics

**GET** `api/v1/library/users/analytics/upload-analytics`

**Access:** Library owner/manager (`admin` or `manager`).

**Query parameters:** None.

**Status codes:** `200` OK, `401` Unauthorized, `403` Forbidden

**Response (200):**
```json
{
  "success": true,
  "message": "Upload analytics retrieved successfully",
  "data": {
    "uploadersCount": 0,
    "byType": {
      "videos": 0,
      "materials": 0,
      "assignments": 0,
      "links": 0,
      "generalMaterials": 0,
      "assessments": 0
    },
    "uploadsByUser": [
      {
        "id": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "role": "string",
        "counts": {
          "uploadedVideos": 0,
          "uploadedMaterials": 0,
          "uploadedAssignments": 0,
          "uploadedLinks": 0,
          "uploadedGeneralMaterials": 0,
          "createdAssessments": 0
        }
      }
    ],
    "recentUploads": [
      {
        "resourceType": "video | material | assignment | link | general_material | assessment",
        "resourceId": "string",
        "title": "string | undefined",
        "uploadedBy": {
          "id": "string",
          "email": "string",
          "first_name": "string",
          "last_name": "string"
        },
        "createdAt": "string (ISO date)"
      }
    ]
  }
}
```

---

## 4. Available permissions (catalog)

**GET** `api/v1/library/users/available-permissions`

**Access:** Library owner/manager (`admin` or `manager`).

**Query parameters:** None.

**Status codes:** `200` OK, `401` Unauthorized, `403` Forbidden

**Response (200):**
```json
{
  "success": true,
  "message": "Available permissions retrieved successfully",
  "data": [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "description": "string | null"
    }
  ]
}
```

Use `data[].code` when sending `permissions` in create/update payloads (e.g. `["manage_library_users", "view_analytics"]`).

---

## 5. Get one library user (full profile + uploads)

**GET** `api/v1/library/users/:id`

**Access:** Elevated.

**Path parameters:** `id` – library user ID.

**Status codes:** `200` OK, `401` Unauthorized, `403` Forbidden, `404` Not Found

Returns the full library user profile plus the library they belong to, counts for all content types, and detailed lists of uploads (videos, materials, assignments, links, general materials, chapter files) and assessments they created—each with topic and subject where applicable.

**Response (200):**
```json
{
  "success": true,
  "message": "Library user retrieved successfully",
  "data": {
    "profile": {
      "id": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "phone_number": "string | null",
      "role": "string",
      "userType": "string",
      "permissions": ["string"],
      "permissionLevel": "number | null",
      "status": "string",
      "platformId": "string",
      "createdAt": "string (ISO date)",
      "updatedAt": "string (ISO date)",
      "displayPicture": null
    },
    "library": {
      "id": "string",
      "name": "string",
      "slug": "string",
      "description": "string | null",
      "status": "string"
    },
    "counts": {
      "uploadedVideos": 0,
      "uploadedMaterials": 0,
      "uploadedAssignments": 0,
      "uploadedLinks": 0,
      "uploadedGeneralMaterials": 0,
      "uploadedChapterFiles": 0,
      "createdAssessments": 0,
      "comments": 0,
      "libraryResourceAccessGrants": 0
    },
    "uploads": {
      "videos": [
        {
          "id": "string",
          "title": "string",
          "description": "string | null",
          "videoUrl": "string",
          "thumbnailUrl": "string | null",
          "durationSeconds": "number | null",
          "sizeBytes": "number | null",
          "views": 0,
          "status": "string",
          "order": 0,
          "createdAt": "string (ISO date)",
          "updatedAt": "string (ISO date)",
          "topic": { "id": "string", "title": "string", "subject": { "id": "string", "name": "string", "code": "string | null" } },
          "subject": { "id": "string", "name": "string", "code": "string | null" }
        }
      ],
      "materials": [
        {
          "id": "string",
          "title": "string",
          "description": "string | null",
          "materialType": "string",
          "url": "string",
          "sizeBytes": "number | null",
          "pageCount": "number | null",
          "status": "string",
          "order": 0,
          "createdAt": "string (ISO date)",
          "updatedAt": "string (ISO date)",
          "topic": { "id": "string", "title": "string", "subject": { "id": "string", "name": "string", "code": "string | null" } },
          "subject": { "id": "string", "name": "string", "code": "string | null" }
        }
      ],
      "assignments": [
        {
          "id": "string",
          "title": "string",
          "description": "string | null",
          "assignmentType": "string",
          "instructions": "string | null",
          "attachmentUrl": "string | null",
          "dueDate": "string (ISO date) | null",
          "maxScore": 0,
          "status": "string",
          "order": 0,
          "createdAt": "string (ISO date)",
          "updatedAt": "string (ISO date)",
          "topic": { "id": "string", "title": "string", "subject": { "id": "string", "name": "string", "code": "string | null" } },
          "subject": { "id": "string", "name": "string", "code": "string | null" }
        }
      ],
      "links": [
        {
          "id": "string",
          "title": "string",
          "description": "string | null",
          "url": "string",
          "linkType": "string | null",
          "thumbnailUrl": "string | null",
          "domain": "string | null",
          "status": "string",
          "order": 0,
          "createdAt": "string (ISO date)",
          "updatedAt": "string (ISO date)",
          "topic": { "id": "string", "title": "string", "subject": { "id": "string", "name": "string", "code": "string | null" } },
          "subject": { "id": "string", "name": "string", "code": "string | null" }
        }
      ],
      "generalMaterials": [
        {
          "id": "string",
          "title": "string",
          "description": "string | null",
          "author": "string | null",
          "materialType": "string",
          "url": "string",
          "sizeBytes": "number | null",
          "pageCount": "number | null",
          "thumbnailUrl": "string | null",
          "isFree": false,
          "isAvailable": false,
          "processingStatus": "string",
          "createdAt": "string (ISO date)",
          "updatedAt": "string (ISO date)",
          "subject": { "id": "string", "name": "string", "code": "string | null" } | null
        }
      ],
      "chapterFiles": [
        {
          "id": "string",
          "fileName": "string",
          "fileType": "string",
          "url": "string",
          "title": "string | null",
          "order": 0,
          "createdAt": "string (ISO date)"
        }
      ]
    },
    "createdAssessments": [
      {
        "id": "string",
        "title": "string",
        "description": "string | null",
        "instructions": "string | null",
        "assessmentType": "string",
        "gradingType": "string",
        "status": "string",
        "duration": "number | null",
        "timeLimit": "number | null",
        "maxAttempts": 0,
        "totalPoints": 0,
        "passingScore": 0,
        "createdAt": "string (ISO date)",
        "updatedAt": "string (ISO date)",
        "subject": { "id": "string", "name": "string", "code": "string | null" },
        "topic": { "id": "string", "title": "string" } | null
      }
    ]
  }
}
```

---

## 6. Create library user

**POST** `api/v1/library/users`

**Access:** Elevated.

**Request body (JSON):**

| Field            | Type     | Required | Description |
|------------------|----------|----------|-------------|
| `email`          | string   | Yes      | Unique email (used for login). |
| `password`       | string   | No       | Min 8 chars. If omitted, a strong password is generated and sent to the new user (and creator) by email. |
| `first_name`     | string   | Yes      | First name. |
| `last_name`      | string   | Yes      | Last name. |
| `phone_number`   | string   | No       | Phone number. |
| `role`           | string   | No       | One of: `admin`, `manager`, `content_creator`, `reviewer`, `viewer`. Default: `content_creator`. |
| `userType`       | string   | No       | One of: `libraryresourceowner`, `librarymanager`, `contentcreator`, `reviewer`, `viewer`. Default: `contentcreator`. |
| `permissions`    | string[] | No       | Permission codes from available-permissions (e.g. `["view_analytics", "manage_library_users"]`). Default: `[]`. |
| `permissionLevel`| number   | No       | 0–100. Optional elevated level (e.g. 10). |

**Example payload:**
```json
{
  "email": "creator@library.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "phone_number": "+2348012345678",
  "role": "content_creator",
  "userType": "contentcreator",
  "permissions": ["view_analytics"],
  "permissionLevel": null
}
```

**Status codes:** `201` Created, `400` Bad Request (e.g. email already exists), `401` Unauthorized, `403` Forbidden

**Response (201):**
```json
{
  "success": true,
  "message": "Library user created successfully",
  "data": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string | null",
    "role": "string",
    "userType": "string",
    "permissions": ["string"],
    "permissionLevel": "number | null",
    "status": "string",
    "createdAt": "string (ISO date)"
  }
}
```
Password is never returned. If it was auto-generated, the new user and the creator receive it by email.

---

## 7. Update library user

**PATCH** `api/v1/library/users/:id`

**Access:** Elevated.

**Path parameters:** `id` – library user ID.

**Request body (JSON):** All fields optional. Only send fields to update.

| Field            | Type     | Description |
|------------------|----------|-------------|
| `email`          | string   | New email (must be unique). |
| `password`       | string   | New password (min 8 chars). Omit to keep current. |
| `first_name`     | string   | First name. |
| `last_name`      | string   | Last name. |
| `phone_number`   | string   | Phone number. |
| `role`           | string   | One of: `admin`, `manager`, `content_creator`, `reviewer`, `viewer`. |
| `userType`       | string   | One of: `libraryresourceowner`, `librarymanager`, `contentcreator`, `reviewer`, `viewer`. |
| `permissions`    | string[] | Replaces existing permissions (e.g. `["view_analytics"]`). |
| `permissionLevel`| number   | 0–100. |

**Example payload:**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "role": "manager",
  "permissions": ["view_analytics", "manage_library_users"]
}
```

**Status codes:** `200` OK, `400` Bad Request (e.g. email already in use), `401` Unauthorized, `403` Forbidden, `404` Not Found

**Response (200):**
```json
{
  "success": true,
  "message": "Library user updated successfully",
  "data": {
    "id": "string",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "phone_number": "string | null",
    "role": "string",
    "userType": "string",
    "permissions": ["string"],
    "permissionLevel": "number | null",
    "status": "string",
    "updatedAt": "string (ISO date)"
  }
}
```

---

## 8. Delete library user

**DELETE** `api/v1/library/users/:id`

**Access:** Elevated.

**Path parameters:** `id` – library user ID.

**Status codes:** `200` OK, `401` Unauthorized, `403` Forbidden, `404` Not Found

**Response (200):**
```json
{
  "success": true,
  "message": "Library user removed successfully",
  "data": null
}
```

---

## Enums reference

**Role:** `admin` | `manager` | `content_creator` | `reviewer` | `viewer`  
**User type:** `libraryresourceowner` | `librarymanager` | `contentcreator` | `reviewer` | `viewer`  
**Status:** `active` | `inactive` | `suspended`  
**Dashboard sortBy:** `createdAt` | `email` | `first_name` | `last_name` | `role` | `status`  
**Sort order:** `asc` | `desc`
