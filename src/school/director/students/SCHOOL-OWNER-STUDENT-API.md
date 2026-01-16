# School Owner/Director - Student Management API Documentation

**Base URL:** `/director/students`

**Authentication:** All endpoints require Bearer token authentication (JWT)

---

## Table of Contents
1. [Get Students Dashboard](#1-get-students-dashboard)
2. [Add Existing Student to Class](#2-add-existing-student-to-class)
3. [Enroll New Student](#3-enroll-new-student)
4. [Get Available Classes](#4-get-available-classes)
5. [Update Student](#5-update-student)

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

## 1. Get Students Dashboard

Get comprehensive students dashboard with filters, pagination, sorting, and performance metrics.

**Endpoint:** `GET /director/students/dashboard`

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
| search | string | No | - | Search by name or email |
| status | string | No | - | Filter by status (active, inactive, suspended) |
| class_id | string | No | - | Filter by class ID |
| classId | string | No | - | Alternative parameter for class ID (both work) |
| sort_by | string | No | createdAt | Sort by field (name, createdAt, cgpa, position) |
| sort_order | string | No | desc | Sort order (asc, desc) |

**Example Request:**
```
GET /director/students/dashboard?page=1&limit=10&search=jane&class_id=class-uuid&status=active&sort_by=cgpa&sort_order=desc
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Students dashboard fetched successfully",
  "data": {
    "dashboardStats": {
      "totalStudents": 150,
      "activeStudents": 140,
      "inactiveStudents": 5,
      "suspendedStudents": 5,
      "enrolledInClass": 145,
      "notEnrolled": 5,
      "averageCGPA": 3.2,
      "topPerformers": 15
    },
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "totalPages": 15,
      "hasNext": true,
      "hasPrev": false
    },
    "students": [
      {
        "id": "user-uuid-1",
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane.smith@school.edu.ng",
        "phone_number": "+2348012345678",
        "gender": "female",
        "status": "active",
        "display_picture": "https://example.com/photo.jpg",
        "role": "student",
        "school_id": "school-uuid",
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z",
        "student": {
          "id": "student-record-uuid",
          "student_id": "smh/2024/001",
          "admission_number": "STD/2024/001",
          "date_of_birth": "2008-05-15T00:00:00Z",
          "guardian_name": "John Smith",
          "guardian_phone": "+2348012345678",
          "guardian_email": "guardian@example.com",
          "address": "123 Student Street, Lagos",
          "current_class_id": "class-uuid-1",
          "current_class": {
            "id": "class-uuid-1",
            "name": "JSS 1A",
            "classId": "JSS1A"
          }
        },
        "student_id": "smh/2024/001",
        "current_class": "JSS 1A",
        "next_class": "Mathematics",
        "next_class_time": "10:00",
        "next_class_teacher": "Mr. John Doe",
        "performance": {
          "cgpa": 3.5,
          "term_average": 85.5,
          "improvement_rate": 5.2,
          "attendance_rate": 0,
          "position": 3
        }
      }
    ],
    "availableClasses": [
      {
        "id": "class-uuid-1",
        "name": "JSS 1A",
        "class_teacher": {
          "id": "teacher-uuid-1",
          "name": "John Doe",
          "email": "john.doe@school.edu.ng",
          "display_picture": "https://..."
        },
        "student_count": 30,
        "subject_count": 10
      }
    ],
    "appliedFilters": {
      "search": "jane",
      "status": "active",
      "class_id": "class-uuid",
      "sort_by": "cgpa",
      "sort_order": "desc"
    }
  }
}
```

**Response Structure Breakdown:**

```typescript
// Root level
{
  success: boolean;
  message: string;
  data: {
    dashboardStats: {
      totalStudents: number;
      activeStudents: number;
      inactiveStudents: number;
      suspendedStudents: number;
      enrolledInClass: number;
      notEnrolled: number;
      averageCGPA: number;
      topPerformers: number;
    };
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    students: Array<{
      // User fields
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      gender: string;
      status: string;
      display_picture: string | null;
      role: string;
      school_id: string;
      createdAt: string;
      updatedAt: string;
      
      // Student relation
      student: {
        id: string;
        student_id: string;
        admission_number: string | null;
        date_of_birth: string | null;
        guardian_name: string | null;
        guardian_phone: string | null;
        guardian_email: string | null;
        address: string | null;
        current_class_id: string | null;
        current_class: {
          id: string;
          name: string;
          classId: string;
        } | null;
      };
      
      // Computed fields
      student_id: string;
      current_class: string;
      next_class: string;
      next_class_time: string | null;
      next_class_teacher: string | null;
      performance: {
        cgpa: number;
        term_average: number;
        improvement_rate: number;
        attendance_rate: number;
        position: number;
      };
    }>;
    availableClasses: Array<{
      id: string;
      name: string;
      class_teacher: {
        id: string;
        name: string;
        email: string;
        display_picture: string | null;
      } | null;
      student_count: number;
      subject_count: number;
    }>;
    appliedFilters: {
      search: string | null;
      status: string | null;
      class_id: string | null;
      sort_by: string;
      sort_order: string;
    };
  };
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
  "message": "Error fetching students dashboard",
  "data": null
}
```

---

## 2. Add Existing Student to Class

Add an existing student (already in the system) to a specific class.

**Endpoint:** `POST /director/students/enroll-student`

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
| student_id | string | Yes | User ID of the student |
| class_id | string | Yes | Class ID to add student to |

**Example Request:**
```json
{
  "student_id": "user-uuid-1",
  "class_id": "class-uuid-1"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Student Jane Smith added to class JSS 1A successfully",
  "data": {
    "student": {
      "id": "user-uuid-1",
      "name": "Jane Smith",
      "email": "jane.smith@school.edu.ng"
    },
    "class": {
      "id": "class-uuid-1",
      "name": "JSS 1A"
    },
    "enrolled_class": {
      "id": "class-uuid-1",
      "name": "JSS 1A"
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
    student: {
      id: string;
      name: string;
      email: string;
    };
    class: {
      id: string;
      name: string;
    };
    enrolled_class: {
      id: string;
      name: string;
    };
  };
}
```

**Error Responses:**

**400 Bad Request - Missing Fields:**
```json
{
  "success": false,
  "message": "Student ID and Class ID are required",
  "data": null
}
```

**403 Forbidden - Not Managing Class:**
```json
{
  "success": false,
  "message": "You can only add students to classes you manage",
  "data": null
}
```

**404 Not Found - Student Not Found:**
```json
{
  "success": false,
  "message": "Student not found or does not belong to your school",
  "data": null
}
```

**409 Conflict - Already Enrolled:**
```json
{
  "success": false,
  "message": "Student is already enrolled in this class",
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
  "message": "Failed to add student to class",
  "data": null
}
```

---

## 3. Enroll New Student

Create a completely new student account and optionally enroll them in a class.

**Endpoint:** `POST /director/students/enroll-new-student`

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
| first_name | string | Yes | Student's first name |
| last_name | string | Yes | Student's last name |
| email | string | Yes | Valid email address |
| phone_number | string | Yes | Phone number |
| gender | string | Yes | Gender (male, female, other) |
| class_id | string | Yes | Class ID to enroll student in |
| display_picture | string | No | Profile picture URL |
| date_of_birth | string | No | Date of birth (YYYY-MM-DD) |
| admission_number | string | No | Admission number |
| guardian_name | string | No | Guardian's full name |
| guardian_phone | string | No | Guardian's phone number |
| guardian_email | string | No | Guardian's email address |
| address | string | No | Student's address |
| emergency_contact | string | No | Emergency contact number |
| blood_group | string | No | Blood group (e.g., O+, A+) |
| medical_conditions | string | No | Any medical conditions |
| allergies | string | No | Any allergies |
| previous_school | string | No | Previous school attended |
| academic_level | string | No | Academic level (e.g., JSS 2) |
| parent_id | string | No | Parent user ID if exists |
| password | string | No | Custom password (auto-generated if not provided) |

**Example Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane.smith@school.edu.ng",
  "phone_number": "+2348012345678",
  "gender": "female",
  "class_id": "class-uuid-1",
  "display_picture": "https://example.com/photo.jpg",
  "date_of_birth": "2008-05-15",
  "admission_number": "STD/2024/001",
  "guardian_name": "John Smith",
  "guardian_phone": "+2348012345678",
  "guardian_email": "guardian@example.com",
  "address": "123 Student Street, Lagos",
  "emergency_contact": "+2348012345678",
  "blood_group": "O+",
  "medical_conditions": "None",
  "allergies": "None",
  "previous_school": "Primary School ABC",
  "academic_level": "JSS 1",
  "password": "CustomPassword123"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "data": {
    "student": {
      "id": "student-record-uuid",
      "user_id": "user-uuid-1",
      "student_id": "smh/2024/001",
      "name": "Jane Smith",
      "email": "jane.smith@school.edu.ng",
      "class": "JSS 1A",
      "generatedPassword": "AutoGen123"
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
    student: {
      id: string;              // Student record ID
      user_id: string;         // User account ID
      student_id: string;      // Generated student ID (smh/2024/001)
      name: string;            // Full name
      email: string;           // Email address
      class: string | null;    // Class name or null if no class
      generatedPassword?: string;  // Only present if password was auto-generated
    };
  };
}
```

**Important Notes:**

1. **Auto-Generated Password:** If no password is provided, one will be auto-generated and returned in the response. Store this securely.
2. **Student ID Format:** Automatically generated in format `smh/YYYY/###` (e.g., `smh/2024/001`)
3. **Email Notifications:** Three emails are sent automatically:
   - Welcome email to student with login credentials
   - Notification to school directors
   - Notification to class teacher (if class has a teacher)
4. **Class Optional:** Student can be enrolled without a class by providing an empty or null `class_id`

**Error Responses:**

**400 Bad Request - Missing Required Fields:**
```json
{
  "success": false,
  "message": "Missing required fields",
  "data": null
}
```

**400 Bad Request - Invalid User Data:**
```json
{
  "success": false,
  "message": "User not found or invalid school data",
  "data": null
}
```

**409 Conflict - Duplicate Email:**
```json
{
  "success": false,
  "message": "A student with this email already exists",
  "data": null
}
```

**404 Not Found - Class Not Found:**
```json
{
  "success": false,
  "message": "Specified class not found or access denied",
  "data": null
}
```

**404 Not Found - No Academic Session:**
```json
{
  "success": false,
  "message": "No current academic session found for the school",
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
  "message": "Failed to enroll new student",
  "data": null
}
```

**500 Internal Server Error - Transaction Failed:**
```json
{
  "success": false,
  "message": "Failed to create student: <specific error message>",
  "data": null
}
```

---

## 4. Get Available Classes

Get list of all available classes for student enrollment.

**Endpoint:** `GET /director/students/available-classes`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /director/students/available-classes
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Available classes fetched successfully",
  "data": {
    "classes": [
      {
        "id": "class-uuid-1",
        "name": "JSS 1A",
        "class_teacher": {
          "id": "teacher-uuid-1",
          "name": "John Doe",
          "email": "john.doe@school.edu.ng",
          "display_picture": "https://example.com/photo.jpg"
        },
        "student_count": 30,
        "subject_count": 10
      },
      {
        "id": "class-uuid-2",
        "name": "JSS 1B",
        "class_teacher": null,
        "student_count": 28,
        "subject_count": 10
      }
    ],
    "summary": {
      "total_classes": 12,
      "total_students": 350,
      "average_students_per_class": 29,
      "classes_with_teachers": 10,
      "classes_without_teachers": 2
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
    classes: Array<{
      id: string;
      name: string;
      class_teacher: {
        id: string;
        name: string;
        email: string;
        display_picture: string | null;
      } | null;
      student_count: number;
      subject_count: number;
    }>;
    summary: {
      total_classes: number;
      total_students: number;
      average_students_per_class: number;
      classes_with_teachers: number;
      classes_without_teachers: number;
    };
  };
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
  "message": "Failed to fetch available classes",
  "data": null
}
```

---

## 5. Update Student

Update existing student information.

**Endpoint:** `PATCH /director/students/:studentId`

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
| studentId | string | Yes | Student ID (can be student record ID or user ID) |

**Request Body:**

All fields are optional. Only provide fields you want to update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| first_name | string | No | Student's first name |
| last_name | string | No | Student's last name |
| email | string | No | Valid email address |
| phone_number | string | No | Phone number |
| gender | string | No | Gender (male, female, other) |
| display_picture | string | No | Profile picture URL |
| date_of_birth | string | No | Date of birth (YYYY-MM-DD) |
| admission_number | string | No | Admission number |
| guardian_name | string | No | Guardian's full name |
| guardian_phone | string | No | Guardian's phone number |
| guardian_email | string | No | Guardian's email address |
| address | string | No | Student's address |
| emergency_contact | string | No | Emergency contact number |
| blood_group | string | No | Blood group |
| medical_conditions | string | No | Medical conditions |
| allergies | string | No | Allergies |
| previous_school | string | No | Previous school |
| academic_level | string | No | Academic level |
| parent_id | string | No | Parent user ID |
| class_id | string | No | Transfer student to different class |
| status | string | No | Student status (active, inactive, suspended) |

**Example Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Johnson",
  "phone_number": "+2348087654321",
  "guardian_name": "Robert Johnson",
  "guardian_phone": "+2348087654321",
  "class_id": "new-class-uuid",
  "status": "active"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Student updated successfully",
  "data": {
    "student": {
      "id": "student-record-uuid",
      "user_id": "user-uuid-1",
      "student_id": "smh/2024/001",
      "admission_number": "STD/2024/001",
      "first_name": "Jane",
      "last_name": "Johnson",
      "email": "jane.smith@school.edu.ng",
      "phone_number": "+2348087654321",
      "gender": "female",
      "display_picture": "https://...",
      "status": "active",
      "date_of_birth": "2008-05-15T00:00:00Z",
      "guardian_name": "Robert Johnson",
      "guardian_phone": "+2348087654321",
      "guardian_email": "guardian@example.com",
      "address": "123 Student Street, Lagos",
      "current_class_id": "new-class-uuid",
      "current_class": {
        "id": "new-class-uuid",
        "name": "JSS 2A"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:20:00Z"
    },
    "changes": {
      "updatedFields": ["first_name", "last_name", "phone_number", "guardian_name", "guardian_phone", "class"],
      "previousClass": {
        "id": "old-class-uuid",
        "name": "JSS 1A"
      },
      "newClass": {
        "id": "new-class-uuid",
        "name": "JSS 2A"
      }
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
    student: {
      // Student record fields
      id: string;
      user_id: string;
      student_id: string;
      admission_number: string | null;
      
      // User fields
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      gender: string;
      display_picture: string | null;
      status: string;
      
      // Additional student info
      date_of_birth: string | null;
      guardian_name: string | null;
      guardian_phone: string | null;
      guardian_email: string | null;
      address: string | null;
      emergency_contact: string | null;
      blood_group: string | null;
      medical_conditions: string | null;
      allergies: string | null;
      previous_school: string | null;
      academic_level: string | null;
      
      // Class info
      current_class_id: string | null;
      current_class: {
        id: string;
        name: string;
      } | null;
      
      // Timestamps
      createdAt: string;
      updatedAt: string;
    };
    changes: {
      updatedFields: string[];
      previousClass?: {
        id: string;
        name: string;
      };
      newClass?: {
        id: string;
        name: string;
      };
    };
  };
}
```

**Important Notes:**

1. **Student ID Parameter:** The `studentId` parameter can accept either:
   - Student record ID (primary)
   - User ID (fallback)
   
2. **Class Transfer:** When updating `class_id`, the student will be transferred to the new class. The response includes both previous and new class information.

3. **Partial Updates:** Only fields included in the request body will be updated. Omitted fields remain unchanged.

**Error Responses:**

**400 Bad Request - Invalid User:**
```json
{
  "success": false,
  "message": "User not found or invalid school data",
  "data": null
}
```

**403 Forbidden - Wrong School:**
```json
{
  "success": false,
  "message": "Student does not belong to your school",
  "data": null
}
```

**404 Not Found - Student Not Found:**
```json
{
  "success": false,
  "message": "Student not found",
  "data": null
}
```

**404 Not Found - Class Not Found:**
```json
{
  "success": false,
  "message": "Specified class not found or does not belong to this school",
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
  "message": "Failed to update student",
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
| 400 | Bad Request - Invalid request data or missing required fields |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Not authorized to access this resource |
| 404 | Not Found - Requested resource not found |
| 409 | Conflict - Resource already exists (duplicate email, already enrolled) |
| 500 | Internal Server Error - Server error occurred |

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
type SortBy = 'name' | 'createdAt' | 'cgpa' | 'position';
```

### Sort Order Options
```typescript
type SortOrder = 'asc' | 'desc';
```

---

## Business Logic Notes

### 1. Student ID Generation
- Format: `smh/YYYY/###` (e.g., `smh/2024/001`)
- Automatically generated and unique
- Year is current year
- Number auto-increments

### 2. Password Management
- If no password provided, one is auto-generated
- Auto-generated passwords are returned in the response
- Manual passwords are not returned
- Password format: Strong password with letters, numbers, and special characters

### 3. Email Notifications
When a new student is enrolled, three emails are sent:
- **Student Welcome Email:** Includes login credentials and class information
- **Director Notification:** Notifies school administrators
- **Class Teacher Notification:** Notifies the class teacher (if class has one)

### 4. Performance Metrics
The dashboard calculates:
- **CGPA:** Cumulative Grade Point Average (0-4 scale)
- **Term Average:** Current term average percentage
- **Improvement Rate:** Percentage change from previous term
- **Position:** Rank in current class
- **Attendance Rate:** Currently returns 0 (not yet implemented)

### 5. Class Management
- Students can be enrolled without a class
- Students can be transferred between classes
- Class teacher must exist to manage class assignments
- Available classes are always returned for easy enrollment

### 6. Search Functionality
Search works across:
- First name (case-insensitive)
- Last name (case-insensitive)
- Email (case-insensitive)

---

## Example Usage (JavaScript/TypeScript)

### Fetching Students Dashboard

```typescript
const fetchStudentsDashboard = async (filters) => {
  try {
    const params = new URLSearchParams({
      page: filters.page || '1',
      limit: filters.limit || '10',
      ...(filters.search && { search: filters.search }),
      ...(filters.status && { status: filters.status }),
      ...(filters.class_id && { class_id: filters.class_id }),
      sort_by: filters.sort_by || 'createdAt',
      sort_order: filters.sort_order || 'desc'
    });

    const response = await fetch(
      `/director/students/dashboard?${params}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();
    
    // ALWAYS check success field first
    if (result.success) {
      // Access data safely
      console.log('Dashboard Stats:', result.data.dashboardStats);
      console.log('Students:', result.data.students);
      console.log('Pagination:', result.data.pagination);
      return result.data;
    } else {
      // Handle error
      showToast('error', result.message);
      console.error('Error:', result.message);
      // data is null here, don't try to access it
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to fetch students');
    return null;
  }
};
```

### Enrolling a New Student

```typescript
const enrollNewStudent = async (studentData) => {
  try {
    const response = await fetch('/director/students/enroll-new-student', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: studentData.firstName,
        last_name: studentData.lastName,
        email: studentData.email,
        phone_number: studentData.phoneNumber,
        gender: studentData.gender,
        class_id: studentData.classId,
        display_picture: studentData.displayPicture,
        date_of_birth: studentData.dateOfBirth,
        guardian_name: studentData.guardianName,
        guardian_phone: studentData.guardianPhone,
        guardian_email: studentData.guardianEmail,
        address: studentData.address,
        // ... other optional fields
      })
    });

    const result = await response.json();
    
    // Check success field
    if (result.success) {
      showToast('success', result.message);
      
      // Check if password was auto-generated
      if (result.data.student.generatedPassword) {
        // Store or display the password securely
        console.log('Generated Password:', result.data.student.generatedPassword);
        // Maybe show a modal with the credentials
        showCredentialsModal({
          email: result.data.student.email,
          password: result.data.student.generatedPassword
        });
      }
      
      return result.data.student;
    } else {
      // Show error message
      showToast('error', result.message);
      console.error('Enrollment failed:', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to enroll student');
    return null;
  }
};
```

### Updating a Student

```typescript
const updateStudent = async (studentId, updates) => {
  try {
    const response = await fetch(`/director/students/${studentId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        first_name: updates.firstName,
        last_name: updates.lastName,
        phone_number: updates.phoneNumber,
        guardian_name: updates.guardianName,
        class_id: updates.classId,
        // ... only include fields being updated
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Student updated successfully');
      
      // Check if class was changed
      if (result.data.changes.previousClass && result.data.changes.newClass) {
        console.log(`Student transferred from ${result.data.changes.previousClass.name} to ${result.data.changes.newClass.name}`);
      }
      
      return result.data.student;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to update student');
    return null;
  }
};
```

### Fetching Available Classes

```typescript
const fetchAvailableClasses = async () => {
  try {
    const response = await fetch('/director/students/available-classes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      // Format for dropdown/select component
      const classOptions = result.data.classes.map(cls => ({
        value: cls.id,
        label: cls.name,
        teacher: cls.class_teacher?.name || 'No teacher',
        studentCount: cls.student_count
      }));
      
      return classOptions;
    } else {
      showToast('error', result.message);
      return [];
    }
  } catch (error) {
    console.error('Network error:', error);
    return [];
  }
};
```

---

## Error Handling Best Practices

### 1. Always Check Success Field

```typescript
// ✅ CORRECT
const result = await response.json();
if (result.success) {
  // Access result.data
  console.log(result.data);
} else {
  // Handle error - data is null
  console.error(result.message);
}

// ❌ WRONG - Don't access data without checking success
const result = await response.json();
console.log(result.data.students); // May be null!
```

### 2. Handle All Error Cases

```typescript
const fetchStudents = async () => {
  try {
    const response = await fetch('/director/students/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      // Handle API error
      switch (response.status) {
        case 401:
          redirectToLogin();
          break;
        case 403:
          showToast('error', 'Access denied');
          break;
        case 404:
          showToast('error', 'Resource not found');
          break;
        default:
          showToast('error', result.message);
      }
      return null;
    }
  } catch (error) {
    // Handle network error
    console.error('Network error:', error);
    showToast('error', 'Network error. Please check your connection.');
    return null;
  }
};
```

### 3. TypeScript Type Guards

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiResponse<T> & { success: true; data: T } {
  return response.success === true;
}

// Usage
const result = await fetchStudents();
if (isSuccessResponse(result)) {
  // TypeScript knows data is not null here
  console.log(result.data.students);
}
```

---

## Testing Endpoints

### Using cURL

```bash
# Get students dashboard
curl -X GET "/director/students/dashboard?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Enroll new student
curl -X POST "/director/students/enroll-new-student" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "jane.smith@school.edu.ng",
    "phone_number": "+2348012345678",
    "gender": "female",
    "class_id": "class-uuid-here"
  }'

# Update student
curl -X PATCH "/director/students/student-uuid-here" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Johnson",
    "class_id": "new-class-uuid"
  }'

# Get available classes
curl -X GET "/director/students/available-classes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## UI/UX Recommendations

1. **Dashboard Cards:** Display key metrics (total students, active, CGPA, etc.) in cards
2. **Student List:** Use table or card view with filtering and sorting
3. **Search:** Real-time search with debouncing (300-500ms)
4. **Performance Badges:** Color-code performance metrics (green for good, red for needs attention)
5. **Class Filter:** Dropdown to filter by class with student counts
6. **Enrollment Form:** Multi-step form for better UX (basic info → guardian info → medical info)
7. **Generated Passwords:** Show in a modal with copy-to-clipboard functionality
8. **Loading States:** Skeleton loaders for better perceived performance
9. **Empty States:** Helpful messages when no students exist
10. **Bulk Actions:** Consider bulk enrollment from CSV/Excel

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in all requests
2. **Pagination:** Implement infinite scroll or pagination controls
3. **Search Debouncing:** Add 300-500ms debounce to search input
4. **Response Checking:** Always check `success` field before accessing `data`
5. **Error Handling:** Display user-friendly error messages via toasters
6. **Password Storage:** Store auto-generated passwords securely or display once
7. **Performance Metrics:** Format numbers nicely (2 decimal places for CGPA)
8. **Date Formatting:** Convert ISO dates to user-friendly format
9. **Class Transfer:** Show confirmation modal before transferring classes
10. **Guardian Info:** Consider accordion/collapse for less critical fields

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 16, 2026

