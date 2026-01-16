# School Owner/Director - Teacher Management API Documentation

**Base URL:** `/api/v1/director/teachers`

**Authentication:** All endpoints require Bearer token authentication (JWT)

---

## Table of Contents
1. [Get Teachers Dashboard](#1-get-teachers-dashboard)
2. [Get Classes and Subjects](#2-get-classes-and-subjects)
3. [Add New Teacher](#3-add-new-teacher)
4. [Get Teacher By ID](#4-get-teacher-by-id)
5. [Update Teacher](#5-update-teacher)
6. [Delete Teacher](#6-delete-teacher)
7. [Get All Teachers](#7-get-all-teachers)
8. [Assign Subjects to Teacher](#8-assign-subjects-to-teacher)
9. [Assign Class to Teacher](#9-assign-class-to-teacher)
10. [Get Teacher Classes and Subjects](#10-get-teacher-classes-and-subjects)

---

## 1. Get Teachers Dashboard

Get comprehensive teachers dashboard with filters, pagination, and sorting.

**Endpoint:** `GET /api/v1/director/teachers/dashboard`

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
| limit | number | No | 10 | Number of items per page |
| search | string | No | - | Search by name, email, or phone number |
| status | string | No | - | Filter by status (active, inactive, suspended) |
| gender | string | No | - | Filter by gender (male, female, other) |
| class_id | string | No | - | Filter by class ID |
| sort_by | string | No | createdAt | Sort by field (name, createdAt, status) |
| sort_order | string | No | desc | Sort order (asc, desc) |

**Example Request:**
```
GET /api/v1/director/teachers/dashboard?page=1&limit=10&search=John&status=active&sort_by=name&sort_order=asc
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher dashboard fetched successfully",
  "data": {
    "dashboardStats": {
      "totalTeachers": 25,
      "activeTeachers": 20,
      "inactiveTeachers": 3,
      "suspendedTeachers": 2,
      "maleTeachers": 15,
      "femaleTeachers": 10,
      "classTeachers": 12,
      "subjectTeachers": 25
    },
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    },
    "teachers": [
      {
        "id": "teacher-id-1",
        "teacherId": "TCH-001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@email.com",
        "phone_number": "08012345678",
        "gender": "male",
        "status": "active",
        "display_picture": "https://...",
        "subjects": [
          {
            "id": "subject-id-1",
            "name": "Mathematics",
            "description": "Core Mathematics"
          }
        ],
        "classes": [
          {
            "id": "class-id-1",
            "name": "JSS 1A"
          }
        ],
        "isClassTeacher": true,
        "classManagingDetails": {
          "id": "class-id-1",
          "name": "JSS 1A",
          "studentCount": 30
        },
        "currentClass": {
          "classId": "class-id-1",
          "className": "JSS 1A",
          "subjectName": "Mathematics",
          "startTime": "09:00",
          "endTime": "10:00"
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "appliedFilters": {
      "search": "John",
      "status": "active",
      "gender": null,
      "class_id": null,
      "sort_by": "name",
      "sort_order": "asc"
    }
  }
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "An error occurred while fetching dashboard",
  "data": null
}
```

---

## 2. Get Classes and Subjects

Get all available classes and subjects for teacher creation/assignment.

**Endpoint:** `GET /api/v1/director/teachers/classes-subjects`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Classes and subjects fetched successfully",
  "data": {
    "totalClasses": 12,
    "totalSubjects": 10,
    "classes": [
      {
        "id": "class-id-1",
        "name": "JSS 1A",
        "hasClassTeacher": true,
        "classTeacher": "John Doe"
      },
      {
        "id": "class-id-2",
        "name": "JSS 1B",
        "hasClassTeacher": false,
        "classTeacher": null
      }
    ],
    "subjects": [
      {
        "id": "subject-id-1",
        "name": "Mathematics",
        "description": "Core Mathematics"
      },
      {
        "id": "subject-id-2",
        "name": "English Language",
        "description": "English Language and Literature"
      }
    ]
  }
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error fetching classes and subjects",
  "data": null
}
```

---

## 3. Add New Teacher

Create a new teacher account with optional subject and class assignments.

**Endpoint:** `POST /api/v1/director/teachers`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| first_name | string | Yes | Teacher's first name |
| last_name | string | Yes | Teacher's last name |
| email | string | Yes | Valid email address |
| phone_number | string | Yes | Phone number |
| gender | string | Yes | Gender (male, female, other) |
| display_picture | string | No | Profile picture URL |
| status | string | No | Status (active, inactive) - defaults to active |
| password | string | No | Custom password (auto-generated if not provided) |
| subjectsTeaching | string[] | No | Array of subject IDs |
| classesManaging | string[] | No | Array of class IDs |

**Example Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@email.com",
  "phone_number": "08012345678",
  "gender": "male",
  "display_picture": "https://example.com/photo.jpg",
  "status": "active",
  "password": "SecurePassword123!",
  "subjectsTeaching": ["subject-id-1", "subject-id-2"],
  "classesManaging": ["class-id-1"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Teacher enrolled successfully! Credentials sent to john.doe@email.com",
  "data": {
    "teacher": {
      "id": "teacher-id-1",
      "teacherId": "TCH-001",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@email.com",
      "phone_number": "08012345678",
      "gender": "male",
      "display_picture": "https://example.com/photo.jpg",
      "status": "active",
      "school_id": "school-id-1",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "credentials": {
      "email": "john.doe@email.com",
      "password": "SecurePassword123!",
      "loginUrl": "https://app.smartedu.com/login"
    },
    "assignments": {
      "subjects": [
        {
          "id": "subject-id-1",
          "name": "Mathematics"
        }
      ],
      "classes": [
        {
          "id": "class-id-1",
          "name": "JSS 1A"
        }
      ]
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Missing required fields",
  "data": null
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "A teacher with this email already exists",
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to enroll teacher",
  "data": null
}
```

---

## 4. Get Teacher By ID

Retrieve detailed information about a specific teacher.

**Endpoint:** `GET /api/v1/director/teachers/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Teacher ID |

**Example Request:**
```
GET /api/v1/director/teachers/teacher-id-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher details retrieved successfully",
  "data": {
    "id": "teacher-id-1",
    "teacherId": "TCH-001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@email.com",
    "phone_number": "08012345678",
    "gender": "male",
    "display_picture": "https://...",
    "status": "active",
    "school_id": "school-id-1",
    "subjectsTeaching": [
      {
        "id": "assignment-id-1",
        "subject": {
          "id": "subject-id-1",
          "name": "Mathematics",
          "description": "Core Mathematics"
        }
      }
    ],
    "classesManaging": [
      {
        "id": "class-id-1",
        "name": "JSS 1A",
        "classTeacherId": "teacher-id-1"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error fetching teacher",
  "data": null
}
```

---

## 5. Update Teacher

Update teacher information and assignments.

**Endpoint:** `PATCH /api/v1/director/teachers/:id`

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
| id | string | Yes | Teacher ID |

**Request Body:**

All fields are optional. Only provide fields you want to update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| first_name | string | No | Teacher's first name |
| last_name | string | No | Teacher's last name |
| email | string | No | Valid email address |
| phone_number | string | No | Phone number |
| display_picture | string | No | Profile picture URL |
| status | string | No | Status (active, inactive, suspended) |
| password | string | No | New password |
| subjectsTeaching | string[] | No | Array of subject IDs (replaces existing) |
| classesManaging | string[] | No | Array of class IDs (replaces existing) |

**Example Request:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "phone_number": "08087654321",
  "status": "active",
  "subjectsTeaching": ["subject-id-1", "subject-id-3"],
  "classesManaging": ["class-id-1", "class-id-2"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher updated successfully",
  "data": {
    "teacher": {
      "id": "teacher-id-1",
      "teacherId": "TCH-001",
      "first_name": "John",
      "last_name": "Smith",
      "email": "john.doe@email.com",
      "phone_number": "08087654321",
      "gender": "male",
      "display_picture": "https://...",
      "status": "active",
      "school_id": "school-id-1",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:20:00Z"
    },
    "changes": {
      "updatedFields": ["first_name", "last_name", "phone_number", "subjects", "classes"],
      "addedSubjects": [
        {
          "id": "subject-id-3",
          "name": "Physics"
        }
      ],
      "removedSubjects": [
        {
          "id": "subject-id-2",
          "name": "Chemistry"
        }
      ],
      "addedClasses": [
        {
          "id": "class-id-2",
          "name": "JSS 2A"
        }
      ],
      "removedClasses": []
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid update data",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found or access denied",
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to update teacher",
  "data": null
}
```

---

## 6. Delete Teacher

Soft delete a teacher (changes status to inactive).

**Endpoint:** `DELETE /api/v1/director/teachers/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Teacher ID |

**Example Request:**
```
DELETE /api/v1/director/teachers/teacher-id-1
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher deleted successfully",
  "data": null
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error deleting teacher",
  "data": null
}
```

---

## 7. Get All Teachers

Get paginated list of all teachers.

**Endpoint:** `GET /api/v1/director/teachers`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number |
| limit | number | No | 10 | Items per page |
| status | string | No | - | Filter by status (active, inactive, suspended) |

**Example Request:**
```
GET /api/v1/director/teachers?page=1&limit=20&status=active
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teachers fetched successfully",
  "data": {
    "teachers": [
      {
        "id": "teacher-id-1",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@email.com",
        "phone_number": "08012345678",
        "status": "active",
        "subjectsTeaching": [
          {
            "subject": {
              "id": "subject-id-1",
              "name": "Mathematics"
            }
          }
        ],
        "classesManaging": [
          {
            "id": "class-id-1",
            "name": "JSS 1A"
          }
        ]
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 20,
      "totalPages": 2
    }
  }
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error fetching teachers",
  "data": null
}
```

---

## 8. Assign Subjects to Teacher

Assign multiple subjects to a teacher.

**Endpoint:** `POST /api/v1/director/teachers/:id/subjects`

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
| id | string | Yes | Teacher ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| subjectIds | string[] | Yes | Array of subject IDs to assign |

**Example Request:**
```json
{
  "subjectIds": ["subject-id-1", "subject-id-2", "subject-id-3"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subjects assigned successfully",
  "data": {
    "teacherId": "teacher-id-1",
    "teacherName": "John Doe",
    "assignedSubjects": [
      {
        "id": "subject-id-1",
        "name": "Mathematics"
      },
      {
        "id": "subject-id-2",
        "name": "Physics"
      },
      {
        "id": "subject-id-3",
        "name": "Chemistry"
      }
    ],
    "totalSubjects": 3
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Subject IDs are required",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error assigning subjects",
  "data": null
}
```

---

## 9. Assign Class to Teacher

Assign a class to a teacher (make them class teacher).

**Endpoint:** `POST /api/v1/director/teachers/:id/class`

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
| id | string | Yes | Teacher ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| classId | string | Yes | Class ID to assign |

**Example Request:**
```json
{
  "classId": "class-id-1"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Class assigned successfully",
  "data": {
    "teacherId": "teacher-id-1",
    "teacherName": "John Doe",
    "assignedClass": {
      "id": "class-id-1",
      "name": "JSS 1A",
      "studentCount": 30
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Class ID is required",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "This class already has a class teacher assigned",
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error assigning class",
  "data": null
}
```

---

## 10. Get Teacher Classes and Subjects

Get all classes and subjects assigned to a specific teacher.

**Endpoint:** `GET /api/v1/director/teachers/:id/classes-subjects`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Teacher ID |

**Example Request:**
```
GET /api/v1/director/teachers/teacher-id-1/classes-subjects
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Teacher classes and subjects fetched successfully",
  "data": {
    "teacherId": "teacher-id-1",
    "teacherName": "John Doe",
    "classes": [
      {
        "id": "class-id-1",
        "name": "JSS 1A",
        "isClassTeacher": true,
        "studentCount": 30
      },
      {
        "id": "class-id-2",
        "name": "JSS 1B",
        "isClassTeacher": false,
        "studentCount": 28
      }
    ],
    "subjects": [
      {
        "id": "subject-id-1",
        "name": "Mathematics",
        "description": "Core Mathematics",
        "classesTeaching": [
          {
            "id": "class-id-1",
            "name": "JSS 1A"
          },
          {
            "id": "class-id-2",
            "name": "JSS 1B"
          }
        ]
      }
    ],
    "totalClasses": 2,
    "totalSubjects": 1
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
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

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Error fetching teacher assignments",
  "data": null
}
```

---

## Common Response Format

All endpoints follow this response structure:

```typescript
{
  success: boolean;      // Indicates if request was successful
  message: string;       // Human-readable message
  data: any | null;      // Response data or null on error
}
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Missing or invalid token |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server error |

---

## Data Types & Enums

### Gender Enum
```typescript
type Gender = 'male' | 'female' | 'other';
```

### Status Enum
```typescript
type UserStatus = 'active' | 'inactive' | 'suspended';
```

### Sort By Options
```typescript
type SortBy = 'name' | 'createdAt' | 'status';
```

### Sort Order Options
```typescript
type SortOrder = 'asc' | 'desc';
```

---

## Notes for Frontend Implementation

1. **Authentication**: Always include the Bearer token in the Authorization header
2. **Pagination**: All list endpoints support pagination with `page` and `limit` parameters
3. **Error Handling**: Check the `success` field to determine if the request was successful
4. **Notifications**: Use toaster notifications for success/error messages (as per project preference)
5. **Date Formats**: All dates are in ISO 8601 format (e.g., "2024-01-15T10:30:00Z")
6. **Soft Delete**: The delete endpoint performs a soft delete (status set to inactive)
7. **Auto-Generated Passwords**: If no password is provided when creating a teacher, one will be auto-generated
8. **Email Notifications**: Teachers receive onboarding emails with credentials upon creation
9. **Current Class**: The dashboard endpoint includes current ongoing class information based on the schedule

---

## Example Usage (JavaScript/TypeScript)

### Fetching Teachers Dashboard

```typescript
const fetchTeachersDashboard = async (filters) => {
  const params = new URLSearchParams({
    page: filters.page || '1',
    limit: filters.limit || '10',
    ...(filters.search && { search: filters.search }),
    ...(filters.status && { status: filters.status }),
    ...(filters.gender && { gender: filters.gender }),
    ...(filters.class_id && { class_id: filters.class_id }),
    sort_by: filters.sort_by || 'createdAt',
    sort_order: filters.sort_order || 'desc'
  });

  const response = await fetch(
    `/api/v1/director/teachers/dashboard?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const result = await response.json();
  
  if (result.success) {
    // Handle success
    console.log(result.data);
  } else {
    // Handle error
    console.error(result.message);
  }
};
```

### Adding a New Teacher

```typescript
const addNewTeacher = async (teacherData) => {
  const response = await fetch('/api/v1/director/teachers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      first_name: teacherData.firstName,
      last_name: teacherData.lastName,
      email: teacherData.email,
      phone_number: teacherData.phoneNumber,
      gender: teacherData.gender,
      display_picture: teacherData.displayPicture,
      subjectsTeaching: teacherData.subjectIds,
      classesManaging: teacherData.classIds
    })
  });

  const result = await response.json();
  
  if (result.success) {
    // Show success notification
    showToast('success', result.message);
    return result.data;
  } else {
    // Show error notification
    showToast('error', result.message);
    throw new Error(result.message);
  }
};
```

### Updating a Teacher

```typescript
const updateTeacher = async (teacherId, updates) => {
  const response = await fetch(`/api/v1/director/teachers/${teacherId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  const result = await response.json();
  
  if (result.success) {
    showToast('success', 'Teacher updated successfully');
    return result.data;
  } else {
    showToast('error', result.message);
    throw new Error(result.message);
  }
};
```

---

## Testing Endpoints

You can test these endpoints using tools like Postman or cURL:

```bash
# Example: Get teachers dashboard
curl -X GET "http://localhost:3000/api/v1/director/teachers/dashboard?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Example: Add new teacher
curl -X POST "http://localhost:3000/api/v1/director/teachers" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@email.com",
    "phone_number": "08012345678",
    "gender": "male"
  }'
```

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 16, 2026

