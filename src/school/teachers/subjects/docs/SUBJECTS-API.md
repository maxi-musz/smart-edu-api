# Subjects API Documentation

## Overview
This API provides endpoints for managing subjects in the school system. Teachers can create, read, update, and delete subjects, as well as manage teacher assignments to subjects.

**Base Path:** `/teachers/subjects`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**API Tag:** `Teachers - Subjects`

---

## Endpoints

### 1. Create a Subject

**POST** `/teachers/subjects`

Creates a new subject in the school system.

#### Request Body
- See `CreateSubjectDto` for full schema

#### Responses
- **201 Created** - Subject created successfully
  - Returns: `SubjectResponseDto`
- **400 Bad Request** - Invalid request data
- **404 Not Found** - Academic session not found

---

### 2. Get All Subjects

**GET** `/teachers/subjects`

Retrieves all subjects for a school with support for pagination, filtering, and search.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 10 | Items per page (max: 100) |
| `search` | string | No | - | Search in name, code, or description |
| `academicSessionId` | string | No | - | Filter by academic session ID |
| `color` | string | No | - | Filter by subject color (e.g., #FF5733) |
| `isActive` | boolean | No | - | Filter by active status |
| `sortBy` | string | No | - | Sort field (name, code, createdAt, updatedAt) |
| `sortOrder` | string | No | - | Sort order (asc, desc) |

#### Example Query
```
GET /teachers/subjects?page=1&limit=10&search=math&sortBy=name&sortOrder=asc
```

#### Responses
- **200 OK** - Subjects retrieved successfully
  - Returns: `PaginatedSubjectsResponseDto`

---

### 3. Get Subject by ID

**GET** `/teachers/subjects/:id`

Retrieves a single subject by its ID.

#### Path Parameters
- `id` (string) - Subject ID

#### Responses
- **200 OK** - Subject retrieved successfully
  - Returns: `SubjectResponseDto`
- **404 Not Found** - Subject not found

---

### 4. Get Comprehensive Subject Data

**GET** `/teachers/subjects/:id/comprehensive`

Retrieves detailed subject information including paginated topics with their associated videos and materials, plus comprehensive statistics.

#### Path Parameters
- `id` (string) - Subject ID

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for topics |
| `limit` | number | No | 10 | Topics per page (max: 100) |
| `search` | string | No | - | Search in topic title or description |
| `status` | string | No | - | Filter by topic status |
| `type` | string | No | - | Filter by content type |
| `orderBy` | string | No | - | Order topics by field |
| `orderDirection` | string | No | - | Sort order (asc, desc) |

#### Example Query
```
GET /teachers/subjects/abc123/comprehensive?page=1&limit=10&search=grammar&status=active
```

#### Responses
- **200 OK** - Comprehensive subject data retrieved successfully
  - Returns: `ComprehensiveSubjectResponseDto`
- **404 Not Found** - Subject not found

---

### 5. Update a Subject

**PATCH** `/teachers/subjects/:id`

Updates an existing subject.

#### Path Parameters
- `id` (string) - Subject ID

#### Request Body
- See `UpdateSubjectDto` for full schema

#### Responses
- **200 OK** - Subject updated successfully
  - Returns: `SubjectResponseDto`
- **400 Bad Request** - Invalid request data
- **404 Not Found** - Subject not found

---

### 6. Delete a Subject

**DELETE** `/teachers/subjects/:id`

Deletes a subject from the system.

#### Path Parameters
- `id` (string) - Subject ID

#### Responses
- **204 No Content** - Subject deleted successfully
- **400 Bad Request** - Cannot delete subject with topics
- **404 Not Found** - Subject not found

---

### 7. Assign Teacher to Subject

**POST** `/teachers/subjects/:id/assign-teacher`

Assigns a teacher to a specific subject.

#### Path Parameters
- `id` (string) - Subject ID

#### Request Body
```json
{
  "teacherId": "string"
}
```

#### Responses
- **200 OK** - Teacher assigned successfully
- **404 Not Found** - Subject or teacher not found

---

### 8. Remove Teacher from Subject

**DELETE** `/teachers/subjects/:id/remove-teacher`

Removes a teacher assignment from a subject.

#### Path Parameters
- `id` (string) - Subject ID

#### Request Body
```json
{
  "teacherId": "string"
}
```

#### Responses
- **204 No Content** - Teacher removed successfully

---

### 9. Get Teachers for Subject

**GET** `/teachers/subjects/:id/teachers`

Retrieves all teachers assigned to a specific subject.

#### Path Parameters
- `id` (string) - Subject ID

#### Responses
- **200 OK** - Teachers retrieved successfully
  - Returns: Array of teacher objects

---

## DTOs (Data Transfer Objects)

### CreateSubjectDto
Used for creating a new subject. Contains fields for subject details including name, code, description, academic session, color, etc.

### UpdateSubjectDto
Used for updating an existing subject. Contains partial fields from CreateSubjectDto.

### SubjectResponseDto
Standard response format for single subject data.

### PaginatedSubjectsResponseDto
Response format for paginated list of subjects including:
- `data`: Array of subjects
- `meta`: Pagination metadata (total, page, limit, etc.)

### QuerySubjectsDto
Query parameters for filtering and searching subjects.

### ComprehensiveSubjectQueryDto
Query parameters for the comprehensive subject endpoint with topic filtering.

### ComprehensiveSubjectResponseDto
Detailed response including:
- Subject information
- Paginated topics with videos and materials
- Statistics (total topics, videos, materials, etc.)

---

## Authentication

All endpoints require JWT authentication via Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

The authenticated user's `school_id` and `id` are automatically extracted from the JWT token and used for authorization.

---

## Error Responses

All endpoints may return the following standard error responses:

- **401 Unauthorized** - Missing or invalid authentication token
- **403 Forbidden** - User doesn't have permission to access the resource
- **500 Internal Server Error** - Server-side error

Error responses follow the standard format:
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

---

## Notes

1. All endpoints are scoped to the authenticated user's school
2. Pagination defaults to page 1 with 10 items per page
3. Maximum limit for pagination is 100 items per page
4. Search is case-insensitive and searches across multiple fields
5. Deleting a subject with associated topics will fail - topics must be removed first
6. Subject colors should be provided in hex format (e.g., #FF5733)


