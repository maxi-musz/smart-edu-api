# School Owner/Director - Subject Management API Documentation

**Base URL:** `/api/v1/director/subjects`

**Authentication:** All endpoints require Bearer token authentication (JWT)

---

## Table of Contents
1. [Get All Subjects](#1-get-all-subjects)
2. [Create Subject](#2-create-subject)
3. [Edit Subject](#3-edit-subject)
4. [Get Available Teachers and Classes](#4-get-available-teachers-and-classes)

---

## 1. Get All Subjects

Get all subjects with pagination, search, filtering, and optional grouping by class.

**Endpoint:** `GET /api/v1/director/subjects/fetch-all-subjects`

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
| search | string | No | - | Search by subject name, code, or description |
| classId | string | No | - | Filter by specific class ID |
| groupByClass | boolean | No | false | Group subjects by class (true/false) |

**Example Requests:**

```
# Regular paginated list
GET /api/v1/director/subjects/fetch-all-subjects?page=1&limit=10&search=math

# Grouped by class
GET /api/v1/director/subjects/fetch-all-subjects?groupByClass=true

# Filter by specific class
GET /api/v1/director/subjects/fetch-all-subjects?classId=class-id-1&page=1&limit=20
```

**Success Response (200) - Regular Paginated:**
```json
{
  "success": true,
  "message": "Found 8 subjects",
  "data": {
    "pagination": {
      "total": 8,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    },
    "filters": {
      "search": "math",
      "classId": null
    },
    "subjects": [
      {
        "id": "subject-id-1",
        "name": "mathematics",
        "code": "MATH101",
        "color": "#FF5733",
        "description": "advanced mathematics",
        "class": {
          "id": "class-id-1",
          "name": "JSS 1A"
        },
        "teachers": [
          {
            "id": "teacher-id-1",
            "name": "John Doe",
            "email": "john.doe@email.com"
          }
        ]
      },
      {
        "id": "subject-id-2",
        "name": "further mathematics",
        "code": "MATH102",
        "color": "#3498DB",
        "description": "advanced calculus and algebra",
        "class": {
          "id": "class-id-2",
          "name": "JSS 2A"
        },
        "teachers": []
      }
    ],
    "availableClasses": [
      {
        "id": "class-id-1",
        "name": "JSS 1A",
        "class_teacher": {
          "id": "teacher-id-1",
          "name": "John Doe",
          "email": "john.doe@email.com"
        },
        "student_count": 30,
        "subject_count": 10
      },
      {
        "id": "class-id-2",
        "name": "JSS 1B",
        "class_teacher": null,
        "student_count": 28,
        "subject_count": 8
      }
    ]
  }
}
```

**Success Response (200) - Grouped By Class:**
```json
{
  "success": true,
  "message": "Found subjects grouped by class",
  "data": {
    "groupedByClass": true,
    "totalClasses": 3,
    "totalSubjects": 15,
    "classes": [
      {
        "classId": "class-id-1",
        "className": "JSS 1A",
        "subjectsCount": 8,
        "subjects": [
          {
            "id": "subject-id-1",
            "name": "mathematics",
            "code": "MATH101",
            "color": "#FF5733",
            "description": "advanced mathematics",
            "teachers": [
              {
                "id": "teacher-id-1",
                "name": "John Doe",
                "email": "john.doe@email.com"
              }
            ]
          },
          {
            "id": "subject-id-2",
            "name": "english language",
            "code": "ENG101",
            "color": "#2ECC71",
            "description": "english grammar and composition",
            "teachers": [
              {
                "id": "teacher-id-2",
                "name": "Jane Smith",
                "email": "jane.smith@email.com"
              }
            ]
          }
        ]
      },
      {
        "classId": "class-id-2",
        "className": "JSS 1B",
        "subjectsCount": 7,
        "subjects": [
          {
            "id": "subject-id-3",
            "name": "biology",
            "code": "BIO101",
            "color": "#27AE60",
            "description": "introduction to biology",
            "teachers": []
          }
        ]
      }
    ],
    "availableClasses": [
      {
        "id": "class-id-1",
        "name": "JSS 1A",
        "class_teacher": {
          "id": "teacher-id-1",
          "name": "John Doe",
          "email": "john.doe@email.com"
        },
        "student_count": 30,
        "subject_count": 8
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
  "message": "Error fetching subjects",
  "data": null
}
```

---

## 2. Create Subject

Create a new subject with optional class and teacher assignment.

**Endpoint:** `POST /api/v1/director/subjects/create-subject`

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
| subject_name | string | Yes | Name of the subject |
| code | string | No | Subject code (e.g., MATH101) |
| description | string | No | Subject description |
| color | string | No | Hex color code (e.g., #FF5733) |
| class_taking_it | string | No | Class ID that takes this subject |
| teacher_taking_it | string | No | Teacher ID assigned to this subject |

**Example Request:**
```json
{
  "subject_name": "Mathematics",
  "code": "MATH101",
  "description": "Advanced mathematics for junior secondary students",
  "color": "#FF5733",
  "class_taking_it": "class-id-1",
  "teacher_taking_it": "teacher-id-1"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "data": {
    "subject": {
      "id": "subject-id-1",
      "name": "mathematics",
      "code": "MATH101",
      "color": "#FF5733",
      "description": "advanced mathematics for junior secondary students",
      "schoolId": "school-id-1",
      "classId": "class-id-1",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    "assignedClass": {
      "id": "class-id-1",
      "name": "JSS 1A"
    },
    "assignedTeacher": {
      "id": "teacher-id-1",
      "name": "John Doe",
      "email": "john.doe@email.com"
    },
    "emailSent": true
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Required Fields:**
```json
{
  "success": false,
  "message": "Missing required fields",
  "data": null
}
```

**400 Bad Request - School Not Found:**
```json
{
  "success": false,
  "message": "School does not exist",
  "data": null
}
```

**409 Conflict - Duplicate Subject Code:**
```json
{
  "success": false,
  "message": "Subject with code MATH101 already exists in this school",
  "data": null
}
```

**404 Not Found - Class Not Found:**
```json
{
  "success": false,
  "message": "Specified class not found",
  "data": null
}
```

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Specified teacher not found or is not a teacher",
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
  "message": "Failed to create subject",
  "data": null
}
```

---

## 3. Edit Subject

Update an existing subject's information.

**Endpoint:** `PATCH /api/v1/director/subjects/:id`

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
| id | string | Yes | Subject ID |

**Request Body:**

All fields are optional. Only provide fields you want to update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| subject_name | string | No | Name of the subject |
| code | string | No | Subject code (e.g., MATH101) |
| description | string | No | Subject description |
| color | string | No | Hex color code (e.g., #FF5733) |
| class_taking_it | string | No | Class ID that takes this subject |
| teachers_taking_it | string[] | No | Array of teacher IDs (replaces existing) |

**Example Request:**
```json
{
  "subject_name": "Advanced Mathematics",
  "code": "MATH102",
  "color": "#3498DB",
  "description": "Updated description for advanced mathematics",
  "class_taking_it": "class-id-2",
  "teachers_taking_it": ["teacher-id-1", "teacher-id-2"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subject updated successfully",
  "data": {
    "subject": {
      "id": "subject-id-1",
      "name": "advanced mathematics",
      "code": "MATH102",
      "color": "#3498DB",
      "description": "updated description for advanced mathematics",
      "schoolId": "school-id-1",
      "classId": "class-id-2",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-16T14:20:00Z"
    },
    "changes": {
      "updatedFields": ["subject_name", "code", "color", "description", "class", "teachers"],
      "class": {
        "previous": {
          "id": "class-id-1",
          "name": "JSS 1A"
        },
        "current": {
          "id": "class-id-2",
          "name": "JSS 2A"
        }
      },
      "teachers": {
        "added": [
          {
            "id": "teacher-id-2",
            "name": "Jane Smith",
            "email": "jane.smith@email.com"
          }
        ],
        "removed": [],
        "current": [
          {
            "id": "teacher-id-1",
            "name": "John Doe",
            "email": "john.doe@email.com"
          },
          {
            "id": "teacher-id-2",
            "name": "Jane Smith",
            "email": "jane.smith@email.com"
          }
        ]
      }
    },
    "emailsSent": {
      "addedTeachers": 1,
      "removedTeachers": 0
    }
  }
}
```

**Error Responses:**

**400 Bad Request - Invalid Data:**
```json
{
  "success": false,
  "message": "Invalid update data",
  "data": null
}
```

**400 Bad Request - School Not Found:**
```json
{
  "success": false,
  "message": "School does not exist",
  "data": null
}
```

**404 Not Found - Subject Not Found:**
```json
{
  "success": false,
  "message": "Subject not found",
  "data": null
}
```

**409 Conflict - Duplicate Subject Code:**
```json
{
  "success": false,
  "message": "Subject with code MATH102 already exists in this school",
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

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher with ID teacher-id-3 not found or does not belong to this school",
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
  "message": "Failed to update subject",
  "data": null
}
```

---

## 4. Get Available Teachers and Classes

Get list of all available teachers and classes for subject assignment.

**Endpoint:** `GET /api/v1/director/subjects/available-teachers-classes`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /api/v1/director/subjects/available-teachers-classes
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Available teachers and classes fetched successfully",
  "data": {
    "teachers": [
      {
        "id": "teacher-id-1",
        "name": "John Doe",
        "display_picture": "https://example.com/photo1.jpg"
      },
      {
        "id": "teacher-id-2",
        "name": "Jane Smith",
        "display_picture": "https://example.com/photo2.jpg"
      },
      {
        "id": "teacher-id-3",
        "name": "Bob Johnson",
        "display_picture": null
      }
    ],
    "classes": [
      {
        "id": "class-id-1",
        "name": "JSS 1A"
      },
      {
        "id": "class-id-2",
        "name": "JSS 1B"
      },
      {
        "id": "class-id-3",
        "name": "JSS 2A"
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
  "message": "Failed to fetch available teachers and classes",
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
| 409 | Conflict - Resource already exists (duplicate code) |
| 500 | Internal Server Error - Server error |

---

## Data Types & Validation

### Subject Name
- Type: `string`
- Required: Yes (for create)
- Validation: Non-empty string
- Note: Automatically converted to lowercase

### Subject Code
- Type: `string`
- Required: No
- Validation: Must be unique within the school
- Note: Automatically converted to uppercase
- Example: `MATH101`, `ENG202`

### Color
- Type: `string`
- Required: No
- Validation: Must be a valid hex color code
- Format: `#RRGGBB`
- Examples: `#FF5733`, `#3498DB`, `#2ECC71`

### Description
- Type: `string`
- Required: No
- Note: Automatically converted to lowercase

### Class ID
- Type: `string`
- Required: No
- Validation: Must be a valid class ID that exists in the school

### Teacher ID
- Type: `string` or `string[]` (for edit)
- Required: No
- Validation: Must be valid teacher ID(s) that exist in the school and have teacher role

---

## Business Logic Notes

1. **Subject Names and Descriptions**: All subject names and descriptions are automatically converted to lowercase for consistency.

2. **Subject Codes**: Subject codes are automatically converted to uppercase and must be unique within a school.

3. **Class Assignment**: When assigning a subject to a class, the system verifies that the class exists and belongs to the same school.

4. **Teacher Assignment**: 
   - When creating a subject, you can assign a single teacher
   - When editing a subject, you can assign multiple teachers (array)
   - The system verifies that teachers exist and belong to the same school
   - Teachers receive email notifications when assigned to subjects

5. **Color Coding**: Subjects can have color codes for better UI/UX representation.

6. **Search Functionality**: The search parameter searches across:
   - Subject name (case-insensitive)
   - Subject code (case-insensitive)
   - Subject description (case-insensitive)

7. **Grouping by Class**: When `groupByClass=true`, subjects are organized by their assigned classes, which is useful for displaying subjects in a class-centric view.

8. **Available Classes**: All responses include a list of available classes with:
   - Class teacher information
   - Student count
   - Subject count

---

## Example Usage (JavaScript/TypeScript)

### Fetching All Subjects (Paginated)

```typescript
const fetchSubjects = async (filters) => {
  const params = new URLSearchParams({
    page: filters.page || '1',
    limit: filters.limit || '10',
    ...(filters.search && { search: filters.search }),
    ...(filters.classId && { classId: filters.classId }),
    groupByClass: filters.groupByClass ? 'true' : 'false'
  });

  const response = await fetch(
    `/api/v1/director/subjects/fetch-all-subjects?${params}`,
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
    console.log('Subjects:', result.data.subjects);
    console.log('Available Classes:', result.data.availableClasses);
  } else {
    // Handle error
    showToast('error', result.message);
  }
};
```

### Creating a Subject

```typescript
const createSubject = async (subjectData) => {
  const response = await fetch('/api/v1/director/subjects/create-subject', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject_name: subjectData.name,
      code: subjectData.code,
      description: subjectData.description,
      color: subjectData.color,
      class_taking_it: subjectData.classId,
      teacher_taking_it: subjectData.teacherId
    })
  });

  const result = await response.json();
  
  if (result.success) {
    showToast('success', result.message);
    return result.data;
  } else {
    showToast('error', result.message);
    throw new Error(result.message);
  }
};
```

### Editing a Subject

```typescript
const editSubject = async (subjectId, updates) => {
  const response = await fetch(`/api/v1/director/subjects/${subjectId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject_name: updates.name,
      code: updates.code,
      color: updates.color,
      description: updates.description,
      class_taking_it: updates.classId,
      teachers_taking_it: updates.teacherIds // Array of teacher IDs
    })
  });

  const result = await response.json();
  
  if (result.success) {
    showToast('success', 'Subject updated successfully');
    return result.data;
  } else {
    showToast('error', result.message);
    throw new Error(result.message);
  }
};
```

### Fetching Available Teachers and Classes

```typescript
const fetchAvailableOptions = async () => {
  const response = await fetch(
    '/api/v1/director/subjects/available-teachers-classes',
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
    // Populate dropdowns
    const teacherOptions = result.data.teachers.map(t => ({
      value: t.id,
      label: t.name
    }));
    
    const classOptions = result.data.classes.map(c => ({
      value: c.id,
      label: c.name
    }));
    
    return { teacherOptions, classOptions };
  } else {
    showToast('error', result.message);
    throw new Error(result.message);
  }
};
```

### Fetching Subjects Grouped by Class

```typescript
const fetchSubjectsGroupedByClass = async () => {
  const response = await fetch(
    '/api/v1/director/subjects/fetch-all-subjects?groupByClass=true',
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
    // Display subjects grouped by class
    result.data.classes.forEach(classData => {
      console.log(`Class: ${classData.className}`);
      console.log(`Total Subjects: ${classData.subjectsCount}`);
      
      classData.subjects.forEach(subject => {
        console.log(`  - ${subject.name} (${subject.code})`);
        console.log(`    Teachers: ${subject.teachers.map(t => t.name).join(', ')}`);
      });
    });
  } else {
    showToast('error', result.message);
  }
};
```

---

## Color Picker Integration

When implementing the color picker for subjects, consider using these popular color options:

```javascript
const subjectColors = [
  { name: 'Red', value: '#E74C3C' },
  { name: 'Blue', value: '#3498DB' },
  { name: 'Green', value: '#2ECC71' },
  { name: 'Orange', value: '#E67E22' },
  { name: 'Purple', value: '#9B59B6' },
  { name: 'Yellow', value: '#F1C40F' },
  { name: 'Teal', value: '#1ABC9C' },
  { name: 'Pink', value: '#E91E63' },
  { name: 'Indigo', value: '#3F51B5' },
  { name: 'Cyan', value: '#00BCD4' }
];
```

---

## Testing Endpoints

You can test these endpoints using tools like Postman or cURL:

```bash
# Example: Get all subjects
curl -X GET "http://localhost:3000/api/v1/director/subjects/fetch-all-subjects?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Example: Create subject
curl -X POST "http://localhost:3000/api/v1/director/subjects/create-subject" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "subject_name": "Mathematics",
    "code": "MATH101",
    "description": "Advanced mathematics",
    "color": "#FF5733",
    "class_taking_it": "class-id-1",
    "teacher_taking_it": "teacher-id-1"
  }'

# Example: Edit subject
curl -X PATCH "http://localhost:3000/api/v1/director/subjects/subject-id-1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "subject_name": "Advanced Mathematics",
    "color": "#3498DB",
    "teachers_taking_it": ["teacher-id-1", "teacher-id-2"]
  }'

# Example: Get available teachers and classes
curl -X GET "http://localhost:3000/api/v1/director/subjects/available-teachers-classes" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## UI/UX Recommendations

1. **Subject Cards**: Display subjects as cards with their assigned color as the card background or accent.

2. **Search and Filter**: Provide real-time search and filter capabilities by class.

3. **Teacher Assignment**: Show teacher avatars or initials on subject cards for quick identification.

4. **Class View Toggle**: Provide a toggle to switch between flat list and grouped-by-class view.

5. **Empty States**: 
   - Show helpful messages when no subjects exist
   - Provide quick action buttons to create first subject

6. **Loading States**: Display skeleton loaders during API calls.

7. **Validation**: 
   - Validate hex color codes on the frontend
   - Show error messages inline near form fields
   - Prevent duplicate subject codes

8. **Notifications**: Use toaster notifications (as per project preference) for success/error messages.

---

## Notes for Frontend Implementation

1. **Authentication**: Always include the Bearer token in the Authorization header.

2. **Pagination**: All list endpoints support pagination - implement infinite scroll or pagination controls.

3. **Search Debouncing**: Implement search debouncing (300-500ms) to reduce API calls.

4. **Error Handling**: Check the `success` field to determine if the request was successful.

5. **Case Sensitivity**: Subject names and descriptions are stored in lowercase - handle display formatting on the frontend.

6. **Code Formatting**: Subject codes are stored in uppercase - consider auto-capitalizing input fields.

7. **Color Validation**: Validate color hex codes on the frontend before submission.

8. **Teacher Arrays**: Note that create accepts a single teacher ID, but edit accepts an array of teacher IDs.

9. **Email Notifications**: Teachers receive email notifications when assigned to subjects - inform users about this.

10. **Grouped View**: Use the `groupByClass=true` parameter for class-centric views (e.g., timetables, class management pages).

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 16, 2026

