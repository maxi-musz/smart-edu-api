# Access Control API Documentation

API endpoints for the multi-level resource access control system.

**Base URL**: `/api`  
**Authentication**: All endpoints require Bearer token in Authorization header

---

## Response Format

All endpoints return the standard ApiResponse format:

```typescript
{
  "success": boolean,
  "message": string,
  "data": T | null
}
```

---

## Enums

### LibraryResourceType
| Value | Description |
|-------|-------------|
| `ALL` | Entire platform access |
| `SUBJECT` | Subject + all children (topics, videos, materials, assessments) |
| `TOPIC` | Topic + all children |
| `VIDEO` | Single video |
| `MATERIAL` | Single PDF/material |
| `ASSESSMENT` | Single assessment |

### AccessLevel
| Value | Description |
|-------|-------------|
| `FULL` | View, interact, download, take assessments |
| `READ_ONLY` | View only |
| `LIMITED` | Restricted features |

---

# Level 1: Library Access Control

**Auth**: Library owner JWT token

**Subject grant behavior**: When you grant a school access to a **SUBJECT**, all topics, videos, materials, and assessments under that subject are **on by default**. The library owner can then **turn off** individual topics/videos/materials/assessments using **Exclude Resource**; **Include Resource** turns them back on. Explore (school users) only returns resources that are not excluded.

---

## Grant School Access

Grants a school access to library resources.

```
POST /library-access-control/grant
```

**Request Body**:
```json
{
  "schoolId": "string (required)",
  "resourceType": "SUBJECT | TOPIC | VIDEO | MATERIAL | ASSESSMENT | ALL (required)",
  "subjectId": "string (required if resourceType is SUBJECT)",
  "topicId": "string (required if resourceType is TOPIC)",
  "videoId": "string (required if resourceType is VIDEO)",
  "materialId": "string (required if resourceType is MATERIAL)",
  "assessmentId": "string (required if resourceType is ASSESSMENT)",
  "accessLevel": "FULL | READ_ONLY | LIMITED (default: FULL)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "notes": "string (optional)"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Access granted successfully",
  "data": {
    "id": "clxyz123",
    "platformId": "clxyz456",
    "schoolId": "clxyz789",
    "resourceType": "SUBJECT",
    "subjectId": "clxyz012",
    "topicId": null,
    "videoId": null,
    "materialId": null,
    "assessmentId": null,
    "accessLevel": "FULL",
    "grantedById": "clxyz345",
    "grantedAt": "2026-02-01T12:00:00.000Z",
    "expiresAt": null,
    "isActive": true,
    "notes": null,
    "createdAt": "2026-02-01T12:00:00.000Z",
    "updatedAt": "2026-02-01T12:00:00.000Z",
    "school": {
      "id": "clxyz789",
      "school_name": "Adventist Secondary School",
      "school_email": "admin@adventist.edu"
    },
    "subject": {
      "id": "clxyz012",
      "name": "Mathematics",
      "code": "MATH"
    }
  }
}
```

**Error Responses**:
- `400 Bad Request` - Invalid resource IDs or access already exists
- `404 Not Found` - School or resource not found

---

## Bulk Grant Access

Grants multiple schools access to the same resource.

```
POST /library-access-control/grant-bulk
```

**Request Body**:
```json
{
  "schoolIds": ["string array (required)"],
  "resourceType": "SUBJECT | TOPIC | VIDEO | MATERIAL | ASSESSMENT | ALL (required)",
  "subjectId": "string (if applicable)",
  "topicId": "string (if applicable)",
  "videoId": "string (if applicable)",
  "materialId": "string (if applicable)",
  "assessmentId": "string (if applicable)",
  "accessLevel": "FULL | READ_ONLY | LIMITED (default: FULL)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "notes": "string (optional)"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Bulk access granted: 3 successful, 0 failed",
  "data": {
    "successful": 3,
    "failed": 0,
    "total": 3,
    "results": [
      { "schoolId": "school_1", "status": "success", "id": "grant_id_1" },
      { "schoolId": "school_2", "status": "success", "id": "grant_id_2" },
      { "schoolId": "school_3", "status": "success", "id": "grant_id_3" }
    ]
  }
}
```

---

## Update Access Grant

```
PATCH /library-access-control/:id
```

**URL Params**: `id` - Access grant ID

**Request Body**:
```json
{
  "accessLevel": "FULL | READ_ONLY | LIMITED (optional)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "isActive": "boolean (optional)",
  "notes": "string (optional)"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Access updated successfully",
  "data": {
    "id": "clxyz123",
    "accessLevel": "READ_ONLY",
    "expiresAt": "2026-12-31T23:59:59.000Z",
    "isActive": true,
    "notes": "Extended access",
    "updatedAt": "2026-02-01T15:00:00.000Z",
    "school": {
      "id": "clxyz789",
      "school_name": "Adventist Secondary School"
    }
  }
}
```

---

## Revoke Access

```
DELETE /library-access-control/:id
```

**URL Params**: `id` - Access grant ID

**Request Body** (optional):
```json
{
  "reason": "string (optional)"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Access revoked successfully",
  "data": {
    "id": "clxyz123",
    "isActive": false,
    "notes": "REVOKED: Subscription ended"
  }
}
```

---

## Exclude Resource (Turn Off)

When a school has **subject** access, all topics/videos/materials/assessments under that subject are visible by default. Use this endpoint to **turn off** a specific topic, video, material, or assessment so it is no longer visible in explore for that school.

```
POST /library-access-control/exclude
```

**Request Body**:
```json
{
  "schoolId": "string (required)",
  "resourceType": "TOPIC | VIDEO | MATERIAL | ASSESSMENT (required)",
  "topicId": "string (required if resourceType is TOPIC)",
  "videoId": "string (required if resourceType is VIDEO)",
  "materialId": "string (required if resourceType is MATERIAL)",
  "assessmentId": "string (required if resourceType is ASSESSMENT)"
}
```

**Example – turn off a topic**:
```json
{
  "schoolId": "cmkmmz8730003obvl2coasnmj",
  "resourceType": "TOPIC",
  "topicId": "cmkvcq736000129vl30m4btxg"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Resource excluded successfully",
  "data": {
    "id": "clxyz123",
    "platformId": "clxyz456",
    "schoolId": "clxyz789",
    "resourceType": "TOPIC",
    "topicId": "clxyz012",
    "subjectId": null,
    "videoId": null,
    "materialId": null,
    "assessmentId": null,
    "isActive": false,
    "notes": "Excluded (turned off) by library owner",
    "createdAt": "2026-02-01T12:00:00.000Z",
    "updatedAt": "2026-02-01T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400 Bad Request` - Missing resource ID for the given `resourceType` (e.g. `topicId` required when `resourceType` is `TOPIC`)
- `404 Not Found` - Resource not found in your platform

---

## Include Resource (Turn On)

Removes an exclusion so the resource is visible again under the subject grant. Call this when the library owner toggles a topic/video/material/assessment **on** again.

```
POST /library-access-control/include
```

**Request Body**: Same as Exclude Resource.
```json
{
  "schoolId": "string (required)",
  "resourceType": "TOPIC | VIDEO | MATERIAL | ASSESSMENT (required)",
  "topicId": "string (required if resourceType is TOPIC)",
  "videoId": "string (required if resourceType is VIDEO)",
  "materialId": "string (required if resourceType is MATERIAL)",
  "assessmentId": "string (required if resourceType is ASSESSMENT)"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Resource included successfully",
  "data": {
    "id": "clxyz123",
    "removed": true
  }
}
```

If the resource was not excluded, the API still returns success:
```json
{
  "success": true,
  "message": "Resource was not excluded",
  "data": null
}
```

---

## Get Schools With Access

```
GET /library-access-control/schools
```

**Query Params**:
| Param | Type | Description |
|-------|------|-------------|
| `resourceType` | string | Filter by resource type |
| `subjectId` | string | Filter by subject |
| `isActive` | boolean | Filter by active status |
| `search` | string | Search school name/email |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Schools retrieved successfully",
  "data": {
    "items": [
      {
        "id": "grant_id",
        "platformId": "platform_id",
        "schoolId": "school_id",
        "resourceType": "SUBJECT",
        "accessLevel": "FULL",
        "grantedAt": "2026-02-01T12:00:00.000Z",
        "expiresAt": null,
        "isActive": true,
        "school": {
          "id": "school_id",
          "school_name": "Adventist Secondary School",
          "school_email": "admin@adventist.edu",
          "status": "approved"
        },
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH"
        }
      }
    ],
    "meta": {
      "totalItems": 25,
      "totalPages": 2,
      "currentPage": 1,
      "limit": 20
    }
  }
}
```

---

## Get School Access Details

```
GET /library-access-control/schools/:schoolId
```

**URL Params**: `schoolId` - School ID

**Query Params**:
| Param | Type | Description |
|-------|------|-------------|
| `resourceType` | string | Filter by resource type |
| `accessLevel` | string | Filter by access level |
| `isActive` | boolean | Filter by active status |
| `includeExpired` | boolean | Include expired grants (default: false) |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "School access details retrieved successfully",
  "data": {
    "school": {
      "id": "school_id",
      "school_name": "Adventist Secondary School",
      "school_email": "admin@adventist.edu",
      "status": "approved"
    },
    "accessGrants": [
      {
        "id": "grant_id",
        "resourceType": "SUBJECT",
        "accessLevel": "FULL",
        "grantedAt": "2026-02-01T12:00:00.000Z",
        "expiresAt": null,
        "isActive": true,
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH",
          "description": "Secondary school mathematics"
        },
        "grantedBy": {
          "id": "user_id",
          "email": "admin@library.com",
          "first_name": "John",
          "last_name": "Admin"
        }
      }
    ],
    "summary": {
      "total": 5,
      "active": 5,
      "expired": 0,
      "byResourceType": {
        "SUBJECT": 3,
        "TOPIC": 2
      }
    }
  }
}
```

---

# Level 2: School Access Control

**Auth**: School director/admin JWT token

## Get Available Resources

Gets library resources available to the school (granted by library owners).

```
GET /school-access-control/available-resources
```

**Query Params**:
| Param | Type | Description |
|-------|------|-------------|
| `resourceType` | string | Filter by resource type |
| `subjectId` | string | Filter by subject |
| `isActive` | boolean | Filter by active status |
| `search` | string | Search query |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Available resources retrieved successfully",
  "data": {
    "items": [
      {
        "id": "library_grant_id",
        "resourceType": "SUBJECT",
        "accessLevel": "FULL",
        "expiresAt": null,
        "isActive": true,
        "platform": {
          "id": "platform_id",
          "name": "EduContent Library",
          "slug": "educontent"
        },
        "subject": {
          "id": "subject_id",
          "name": "Mathematics",
          "code": "MATH",
          "description": "Secondary mathematics",
          "thumbnailUrl": "https://..."
        }
      }
    ],
    "meta": {
      "totalItems": 10,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 20
    }
  }
}
```

---

## Grant User/Role/Class Access

```
POST /school-access-control/grant
```

**Request Body**:
```json
{
  "libraryResourceAccessId": "string (required) - ID from available-resources",
  "userId": "string (optional) - specific user",
  "roleType": "student | teacher | school_director | school_admin | parent | ict_staff (optional)",
  "classId": "string (optional) - all students in class",
  "resourceType": "SUBJECT | TOPIC | VIDEO | MATERIAL | ASSESSMENT | ALL (required)",
  "subjectId": "string (optional)",
  "topicId": "string (optional)",
  "videoId": "string (optional)",
  "materialId": "string (optional)",
  "assessmentId": "string (optional)",
  "accessLevel": "FULL | READ_ONLY | LIMITED (default: READ_ONLY)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "notes": "string (optional)"
}
```

**Note**: At least one of `userId`, `roleType`, or `classId` must be provided.

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Access granted successfully",
  "data": {
    "id": "school_grant_id",
    "schoolId": "school_id",
    "libraryResourceAccessId": "library_grant_id",
    "userId": null,
    "roleType": "student",
    "classId": null,
    "resourceType": "SUBJECT",
    "accessLevel": "READ_ONLY",
    "grantedById": "director_id",
    "grantedAt": "2026-02-01T12:00:00.000Z",
    "expiresAt": null,
    "isActive": true,
    "createdAt": "2026-02-01T12:00:00.000Z"
  }
}
```

---

## Bulk Grant Access

```
POST /school-access-control/grant-bulk
```

**Request Body**:
```json
{
  "libraryResourceAccessId": "string (required)",
  "userIds": ["string array (optional)"],
  "classIds": ["string array (optional)"],
  "resourceType": "SUBJECT | TOPIC | VIDEO | MATERIAL | ASSESSMENT | ALL (required)",
  "subjectId": "string (optional)",
  "accessLevel": "FULL | READ_ONLY | LIMITED (default: READ_ONLY)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "notes": "string (optional)"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Bulk access granted: 5 successful, 0 failed",
  "data": {
    "successful": 5,
    "failed": 0,
    "total": 5,
    "results": [
      { "userId": "user_1", "status": "success", "id": "grant_1" },
      { "userId": "user_2", "status": "success", "id": "grant_2" },
      { "classId": "class_1", "status": "success", "id": "grant_3" }
    ]
  }
}
```

---

## Update School Access Grant

```
PATCH /school-access-control/:id
```

**URL Params**: `id` - School access grant ID

**Request Body**:
```json
{
  "accessLevel": "FULL | READ_ONLY | LIMITED (optional)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "isActive": "boolean (optional)",
  "notes": "string (optional)"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Access updated successfully",
  "data": {
    "id": "grant_id",
    "accessLevel": "FULL",
    "expiresAt": "2026-06-30T23:59:59.000Z",
    "isActive": true,
    "updatedAt": "2026-02-01T15:00:00.000Z"
  }
}
```

---

## Revoke School Access

```
DELETE /school-access-control/:id
```

**URL Params**: `id` - School access grant ID

**Request Body** (optional):
```json
{
  "reason": "string (optional)"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Access revoked successfully",
  "data": {
    "id": "grant_id",
    "isActive": false,
    "notes": "REVOKED: End of term"
  }
}
```

---

## Get User's Accessible Resources

```
GET /school-access-control/users/:userId/resources
```

**URL Params**: `userId` - User ID

**Query Params**:
| Param | Type | Description |
|-------|------|-------------|
| `resourceType` | string | Filter by resource type |
| `accessLevel` | string | Filter by access level |
| `includeExpired` | boolean | Include expired access (default: false) |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "User resources retrieved successfully",
  "data": {
    "user": {
      "id": "user_id",
      "email": "student@school.edu",
      "first_name": "John",
      "last_name": "Doe",
      "role": "student"
    },
    "accessGrants": [
      {
        "id": "grant_id",
        "resourceType": "SUBJECT",
        "accessLevel": "READ_ONLY",
        "grantedAt": "2026-02-01T12:00:00.000Z",
        "libraryResourceAccess": {
          "subject": {
            "id": "subject_id",
            "name": "Mathematics",
            "description": "Secondary mathematics",
            "thumbnailUrl": "https://..."
          }
        }
      }
    ],
    "summary": {
      "total": 3,
      "byResourceType": { "SUBJECT": 2, "TOPIC": 1 },
      "byAccessLevel": { "READ_ONLY": 2, "FULL": 1 }
    }
  }
}
```

---

# Level 3: Teacher Access Control

**Auth**: Teacher JWT token

## Get Teacher's Available Resources

Gets resources the teacher can manage (granted to teachers by school).

```
GET /school-access-control/teacher/available-resources
```

**Query Params**:
| Param | Type | Description |
|-------|------|-------------|
| `resourceType` | string | Filter by resource type |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Available resources retrieved successfully",
  "data": {
    "items": [
      {
        "id": "school_grant_id",
        "resourceType": "SUBJECT",
        "accessLevel": "FULL",
        "libraryResourceAccess": {
          "subject": {
            "id": "subject_id",
            "name": "Mathematics",
            "description": "Secondary mathematics",
            "thumbnailUrl": "https://..."
          },
          "topic": null,
          "video": null
        }
      }
    ],
    "meta": {
      "totalItems": 5,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 20
    }
  }
}
```

---

## Grant Student/Class Access

```
POST /school-access-control/teacher/grant
```

**Request Body**:
```json
{
  "schoolResourceAccessId": "string (required) - ID from teacher's available-resources",
  "studentId": "string (optional) - specific student",
  "classId": "string (optional) - entire class",
  "resourceType": "SUBJECT | TOPIC | VIDEO | MATERIAL | ASSESSMENT | ALL (required)",
  "subjectId": "string (optional)",
  "topicId": "string (optional)",
  "videoId": "string (optional)",
  "materialId": "string (optional)",
  "assessmentId": "string (optional)",
  "accessLevel": "FULL | READ_ONLY | LIMITED (default: READ_ONLY)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "notes": "string (optional)"
}
```

**Note**: Either `studentId` or `classId` must be provided.

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Access granted successfully",
  "data": {
    "id": "teacher_grant_id",
    "teacherId": "teacher_user_id",
    "schoolId": "school_id",
    "schoolResourceAccessId": "school_grant_id",
    "studentId": null,
    "classId": "class_id",
    "resourceType": "TOPIC",
    "accessLevel": "FULL",
    "grantedAt": "2026-02-01T12:00:00.000Z",
    "expiresAt": "2026-06-30T23:59:59.000Z",
    "isActive": true,
    "class": {
      "id": "class_id",
      "name": "Grade 10A"
    }
  }
}
```

---

## Bulk Grant Student Access

```
POST /school-access-control/teacher/grant-bulk
```

**Request Body**:
```json
{
  "schoolResourceAccessId": "string (required)",
  "studentIds": ["string array (optional)"],
  "classIds": ["string array (optional)"],
  "resourceType": "SUBJECT | TOPIC | VIDEO | MATERIAL | ASSESSMENT | ALL (required)",
  "topicId": "string (optional)",
  "accessLevel": "FULL | READ_ONLY | LIMITED (default: READ_ONLY)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "notes": "string (optional)"
}
```

**Response** `201 Created`:
```json
{
  "success": true,
  "message": "Bulk access granted: 10 successful, 0 failed",
  "data": {
    "successful": 10,
    "failed": 0,
    "total": 10,
    "results": [
      { "studentId": "student_1", "status": "success", "id": "grant_1" },
      { "classId": "class_1", "status": "success", "id": "grant_2" }
    ]
  }
}
```

---

## Update Teacher Access Grant

```
PATCH /school-access-control/teacher/:id
```

**URL Params**: `id` - Teacher access grant ID

**Request Body**:
```json
{
  "accessLevel": "FULL | READ_ONLY | LIMITED (optional)",
  "expiresAt": "ISO 8601 datetime string (optional)",
  "isActive": "boolean (optional)",
  "notes": "string (optional)"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Access updated successfully",
  "data": {
    "id": "grant_id",
    "accessLevel": "FULL",
    "expiresAt": "2026-06-30T23:59:59.000Z",
    "isActive": true,
    "updatedAt": "2026-02-01T15:00:00.000Z"
  }
}
```

---

## Revoke Teacher Access

```
DELETE /school-access-control/teacher/:id
```

**URL Params**: `id` - Teacher access grant ID

**Request Body** (optional):
```json
{
  "reason": "string (optional)"
}
```

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Access revoked successfully",
  "data": {
    "id": "grant_id",
    "isActive": false,
    "notes": "REVOKED: Student transferred"
  }
}
```

---

## Get Student's Accessible Resources

```
GET /school-access-control/teacher/students/:studentId/resources
```

**URL Params**: `studentId` - Student user ID

**Query Params**:
| Param | Type | Description |
|-------|------|-------------|
| `resourceType` | string | Filter by resource type |
| `accessLevel` | string | Filter by access level |
| `includeExpired` | boolean | Include expired access (default: false) |

**Response** `200 OK`:
```json
{
  "success": true,
  "message": "Student resources retrieved successfully",
  "data": {
    "student": {
      "id": "student_id",
      "email": "student@school.edu",
      "first_name": "John",
      "last_name": "Doe"
    },
    "accessGrants": [
      {
        "id": "grant_id",
        "resourceType": "TOPIC",
        "accessLevel": "FULL",
        "grantedAt": "2026-02-01T12:00:00.000Z",
        "expiresAt": "2026-06-30T23:59:59.000Z",
        "schoolResourceAccess": {
          "libraryResourceAccess": {
            "topic": {
              "id": "topic_id",
              "title": "Algebra Basics",
              "description": "Introduction to algebra"
            }
          }
        }
      }
    ],
    "summary": {
      "total": 2,
      "byResourceType": { "TOPIC": 1, "VIDEO": 1 }
    }
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Must specify at least one of: userId, roleType, or classId",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid or expired token",
  "data": null
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Only school directors and admins can manage access",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "School not found",
  "data": null
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to grant access",
  "data": null
}
```

---

## Endpoint Summary

### Library Access Control (Level 1)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/library-access-control/grant` | Grant school access |
| `POST` | `/library-access-control/grant-bulk` | Bulk grant to schools |
| `PATCH` | `/library-access-control/:id` | Update access |
| `DELETE` | `/library-access-control/:id` | Revoke access |
| `POST` | `/library-access-control/exclude` | Exclude resource (turn off) under subject grant |
| `POST` | `/library-access-control/include` | Include resource (turn on) again |
| `GET` | `/library-access-control/schools` | List schools with access |
| `GET` | `/library-access-control/schools/:schoolId` | School access details |

### School Access Control (Level 2)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/school-access-control/available-resources` | Get available resources |
| `POST` | `/school-access-control/grant` | Grant user/role/class access |
| `POST` | `/school-access-control/grant-bulk` | Bulk grant |
| `PATCH` | `/school-access-control/:id` | Update access |
| `DELETE` | `/school-access-control/:id` | Revoke access |
| `GET` | `/school-access-control/users/:userId/resources` | User's resources |

### Teacher Access Control (Level 3)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/school-access-control/teacher/available-resources` | Teacher's resources |
| `POST` | `/school-access-control/teacher/grant` | Grant student access |
| `POST` | `/school-access-control/teacher/grant-bulk` | Bulk grant |
| `PATCH` | `/school-access-control/teacher/:id` | Update access |
| `DELETE` | `/school-access-control/teacher/:id` | Revoke access |
| `GET` | `/school-access-control/teacher/students/:studentId/resources` | Student's resources |
