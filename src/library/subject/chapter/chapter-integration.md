# Chapter & Topic API Integration Guide

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

# Chapter Endpoints

## 1. Create Chapter

**Endpoint:** `POST /api/v1/library/subject/chapter/createchapter`

### Request Payload
```json
{
  "subjectId": "string (required)",
  "title": "string (required, max 200 chars)",
  "description": "string (optional, max 2000 chars)",
  "order": "number (optional, min 1, defaults to next sequential)",
  "is_active": "boolean (optional, defaults to true)"
}
```

### Example Request
```json
{
  "subjectId": "cmjbnj4zw0002vlevol2u657f",
  "title": "Chapter 1: Algebra Basics",
  "description": "Introduction to algebraic concepts including variables, equations, and basic operations",
  "order": 1,
  "is_active": true
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Chapter created successfully",
  "data": {
    "id": "chapter_123",
    "platformId": "platform_123",
    "subjectId": "subject_123",
    "title": "Chapter 1: Algebra Basics",
    "description": "Introduction to algebraic concepts including variables, equations, and basic operations",
    "order": 1,
    "is_active": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "subject": {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH",
      "class": {
        "id": "class_123",
        "name": "JSS 1"
      }
    }
  }
}
```

### Error Responses
- **400**: Validation error or bad request
- **401**: Unauthorized - invalid or missing token
- **404**: Subject not found or does not belong to user's platform
- **500**: Internal server error

---

## 2. Update Chapter

**Endpoint:** `PATCH /api/v1/library/subject/chapter/updatechapter/:chapterId`

### URL Parameter
- `chapterId`: string (required) - Chapter ID

### Request Payload
All fields are optional (partial update):
```json
{
  "title": "string (optional, max 200 chars)",
  "description": "string (optional, max 2000 chars)",
  "order": "number (optional, min 1)",
  "is_active": "boolean (optional)"
}
```

### Example Request
```json
{
  "title": "Chapter 1: Advanced Algebra",
  "description": "Updated description",
  "order": 2,
  "is_active": false
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Chapter updated successfully",
  "data": {
    "id": "chapter_123",
    "platformId": "platform_123",
    "subjectId": "subject_123",
    "title": "Chapter 1: Advanced Algebra",
    "description": "Updated description",
    "order": 2,
    "is_active": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T01:00:00.000Z",
    "subject": {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH",
      "class": {
        "id": "class_123",
        "name": "JSS 1"
      }
    }
  }
}
```

### Error Responses
- **400**: Validation error or bad request
- **401**: Unauthorized - invalid or missing token
- **404**: Chapter not found or does not belong to user's platform
- **500**: Internal server error

---

## Validation Rules

### CreateChapterDto
- `subjectId`: Required, must be valid subject ID belonging to user's platform
- `title`: Required, string, max 200 characters
- `description`: Optional, string, max 2000 characters
- `order`: Optional, integer, minimum 1 (auto-assigned if not provided)
- `is_active`: Optional, boolean (defaults to true)

### UpdateChapterDto
- All fields optional
- Same validation rules as CreateChapterDto for each field

---

---

# Topic Endpoints

## 3. Create Topic

**Endpoint:** `POST /api/v1/library/subject/chapter/topic/createtopic`

### Request Payload
```json
{
  "chapterId": "string (required)",
  "subjectId": "string (required, must match chapter's subject)",
  "title": "string (required, max 200 chars)",
  "description": "string (optional, max 2000 chars)",
  "order": "number (optional, min 1, defaults to next sequential)",
  "is_active": "boolean (optional, defaults to true)"
}
```

### Example Request
```json
{
  "chapterId": "cmjbnj4zw0002vlevol2u657f",
  "subjectId": "subject_123",
  "title": "Introduction to Variables",
  "description": "Learn about variables, their types, and how to use them in algebraic expressions",
  "order": 1,
  "is_active": true
}
```

### Success Response (201)
```json
{
  "success": true,
  "message": "Topic created successfully",
  "data": {
    "id": "topic_123",
    "platformId": "platform_123",
    "subjectId": "subject_123",
    "chapterId": "chapter_123",
    "title": "Introduction to Variables",
    "description": "Learn about variables, their types, and how to use them in algebraic expressions",
    "order": 1,
    "is_active": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "chapter": {
      "id": "chapter_123",
      "title": "Chapter 1: Algebra Basics",
      "order": 1
    },
    "subject": {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH",
      "class": {
        "id": "class_123",
        "name": "JSS 1"
      }
    }
  }
}
```

### Error Responses
- **400**: Validation error, bad request, or subject ID mismatch
- **401**: Unauthorized - invalid or missing token
- **404**: Chapter not found, subject not found, or does not belong to user's platform
- **500**: Internal server error

---

## 4. Update Topic

**Endpoint:** `PATCH /api/v1/library/subject/chapter/topic/updatetopic/:topicId`

### URL Parameter
- `topicId`: string (required) - Topic ID

### Request Payload
All fields are optional (partial update):
```json
{
  "title": "string (optional, max 200 chars)",
  "description": "string (optional, max 2000 chars)",
  "order": "number (optional, min 1)",
  "is_active": "boolean (optional)"
}
```

### Example Request
```json
{
  "title": "Advanced Variables",
  "description": "Updated description",
  "order": 2,
  "is_active": false
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Topic updated successfully",
  "data": {
    "id": "topic_123",
    "platformId": "platform_123",
    "subjectId": "subject_123",
    "chapterId": "chapter_123",
    "title": "Advanced Variables",
    "description": "Updated description",
    "order": 2,
    "is_active": false,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T01:00:00.000Z",
    "chapter": {
      "id": "chapter_123",
      "title": "Chapter 1: Algebra Basics",
      "order": 1
    },
    "subject": {
      "id": "subject_123",
      "name": "Mathematics",
      "code": "MATH",
      "class": {
        "id": "class_123",
        "name": "JSS 1"
      }
    }
  }
}
```

### Error Responses
- **400**: Validation error or bad request
- **401**: Unauthorized - invalid or missing token
- **404**: Topic not found or does not belong to user's platform
- **500**: Internal server error

---

## Validation Rules

### CreateTopicDto
- `chapterId`: Required, must be valid chapter ID belonging to user's platform
- `subjectId`: Required, must match the chapter's subject ID
- `title`: Required, string, max 200 characters
- `description`: Optional, string, max 2000 characters
- `order`: Optional, integer, minimum 1 (auto-assigned if not provided)
- `is_active`: Optional, boolean (defaults to true)

### UpdateTopicDto
- All fields optional
- Same validation rules as CreateTopicDto for each field

---

## Notes

### Chapter Notes
- Subject must belong to the authenticated user's platform
- If `order` is not provided during creation, it auto-assigns the next sequential number
- Chapter operations are scoped to the authenticated user's platform
- All timestamps are in ISO 8601 format

### Topic Notes
- Chapter must belong to the authenticated user's platform
- Subject ID must match the chapter's subject ID
- If `order` is not provided during creation, it auto-assigns the next sequential number
- Topic operations are scoped to the authenticated user's platform
- All timestamps are in ISO 8601 format

