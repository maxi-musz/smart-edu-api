# School Owner/Director - Schedule & Timetable Management API Documentation

**Base URL:** `/director/schedules`

**Authentication:** All endpoints require Bearer token authentication (JWT)

---

## Table of Contents
1. [Create Time Slot](#1-create-time-slot)
2. [Get Time Slots](#2-get-time-slots)
3. [Update Time Slot](#3-update-time-slot)
4. [Delete Time Slot](#4-delete-time-slot)
5. [Get Timetable Options](#5-get-timetable-options)
6. [Get Timetable Schedules](#6-get-timetable-schedules)
7. [Create Timetable Entry](#7-create-timetable-entry)
8. [Get Subjects with Teachers](#8-get-subjects-with-teachers)

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

## 1. Create Time Slot

Create a new time slot (period) for the school timetable.

**Endpoint:** `POST /director/schedules/create-time-slot`

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
| startTime | string | Yes | Start time in HH:mm format (24-hour) |
| endTime | string | Yes | End time in HH:mm format (24-hour) |
| label | string | Yes | Label for the time slot (e.g., "First Period") |

**Example Request:**
```json
{
  "startTime": "08:30",
  "endTime": "09:15",
  "label": "First Period"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Time slot created successfully",
  "data": {
    "id": "timeslot-uuid-1",
    "startTime": "08:30",
    "endTime": "09:15",
    "label": "First Period",
    "order": 1,
    "schoolId": "school-uuid",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
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
    startTime: string;      // HH:mm format
    endTime: string;        // HH:mm format
    label: string;
    order: number;          // Auto-assigned sequential order
    schoolId: string;
    isActive: boolean;
    createdAt: string;      // ISO 8601
    updatedAt: string;      // ISO 8601
  };
}
```

**Important Notes:**

1. **Time Format:** Times must be in HH:mm format (24-hour clock). Examples: `08:30`, `14:45`, `17:00`
2. **Validation:** End time must be after start time
3. **Overlap Check:** Cannot overlap with existing active time slots
4. **Auto-Ordering:** The `order` field is automatically assigned as the next sequential number

**Error Responses:**

**400 Bad Request - Invalid Time Format:**
```json
{
  "success": false,
  "message": "Invalid time format. Use HH:mm format",
  "data": null
}
```

**400 Bad Request - Invalid Time Range:**
```json
{
  "success": false,
  "message": "End time must be after start time",
  "data": null
}
```

**400 Bad Request - Overlapping Time Slot:**
```json
{
  "success": false,
  "message": "Time slot overlaps with existing period (08:00 - 09:00)",
  "data": null
}
```

**400 Bad Request - School Not Found:**
```json
{
  "success": false,
  "message": "School not found",
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

## 2. Get Time Slots

Get all time slots for the school.

**Endpoint:** `GET /director/schedules/time-slots`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /director/schedules/time-slots
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Total of 8 time slots fetched successfully",
  "data": [
    {
      "id": "timeslot-uuid-1",
      "startTime": "08:00",
      "endTime": "08:45",
      "label": "First Period",
      "order": 1,
      "isActive": true,
      "schoolId": "school-uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "timeslot-uuid-2",
      "startTime": "08:45",
      "endTime": "09:30",
      "label": "Second Period",
      "order": 2,
      "isActive": true,
      "schoolId": "school-uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "timeslot-uuid-3",
      "startTime": "09:30",
      "endTime": "10:00",
      "label": "Break",
      "order": 3,
      "isActive": true,
      "schoolId": "school-uuid",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
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
    startTime: string;
    endTime: string;
    label: string;
    order: number;
    isActive: boolean;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

**Error Responses:**

**400 Bad Request - School Not Found:**
```json
{
  "success": false,
  "message": "School not found",
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

## 3. Update Time Slot

Update an existing time slot.

**Endpoint:** `PATCH /director/schedules/time-slots/:id`

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
| id | string | Yes | Time slot ID |

**Request Body:**

All fields are optional. Only provide fields you want to update.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| startTime | string | No | Start time in HH:mm format |
| endTime | string | No | End time in HH:mm format |
| label | string | No | Label for the time slot |
| order | number | No | Order number (minimum 1) |
| isActive | boolean | No | Whether the time slot is active |

**Example Request:**
```json
{
  "startTime": "08:45",
  "endTime": "09:30",
  "label": "First Period (Updated)",
  "order": 2
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Time slot updated successfully",
  "data": {
    "id": "timeslot-uuid-1",
    "startTime": "08:45",
    "endTime": "09:30",
    "label": "First Period (Updated)",
    "order": 2,
    "isActive": true,
    "schoolId": "school-uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T14:20:00Z"
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
    startTime: string;
    endTime: string;
    label: string;
    order: number;
    isActive: boolean;
    schoolId: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Important Notes:**

1. **Partial Updates:** Only fields included in the request body will be updated
2. **Time Validation:** If updating times, end time must still be after start time
3. **Overlap Check:** Updated times cannot overlap with other active time slots

**Error Responses:**

**400 Bad Request - Invalid Time Format:**
```json
{
  "success": false,
  "message": "Invalid time format. Use HH:mm format",
  "data": null
}
```

**400 Bad Request - Invalid Time Range:**
```json
{
  "success": false,
  "message": "End time must be after start time",
  "data": null
}
```

**400 Bad Request - Overlapping Time Slot:**
```json
{
  "success": false,
  "message": "Time slot overlaps with existing period (09:00 - 10:00)",
  "data": null
}
```

**400 Bad Request - School Not Found:**
```json
{
  "success": false,
  "message": "School not found",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Time slot not found",
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

## 4. Delete Time Slot

Soft delete a time slot (sets `isActive` to false).

**Endpoint:** `DELETE /director/schedules/time-slots/:id`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Time slot ID |

**Example Request:**
```
DELETE /director/schedules/time-slots/timeslot-uuid-1
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Time slot deleted successfully",
  "data": {
    "id": "timeslot-uuid-1",
    "startTime": "08:00",
    "endTime": "08:45",
    "label": "First Period",
    "order": 1,
    "isActive": false,
    "schoolId": "school-uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-16T15:00:00Z"
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
    startTime: string;
    endTime: string;
    label: string;
    order: number;
    isActive: boolean;     // Will be false after deletion
    schoolId: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

**Important Notes:**

1. **Soft Delete:** Time slots are not permanently deleted; `isActive` is set to `false`
2. **Usage Check:** Cannot delete if the time slot is being used in any active timetable entries

**Error Responses:**

**400 Bad Request - In Use:**
```json
{
  "success": false,
  "message": "Cannot delete time slot as it is being used in timetable entries",
  "data": null
}
```

**400 Bad Request - School Not Found:**
```json
{
  "success": false,
  "message": "School not found",
  "data": null
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Time slot not found",
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

## 5. Get Timetable Options

Get all available resources (classes, teachers, subjects, time slots) for creating timetable entries.

**Endpoint:** `GET /director/schedules/timetable-options`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /director/schedules/timetable-options
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Timetable options retrieved successfully",
  "data": {
    "classes": [
      {
        "id": "class-uuid-1",
        "name": "JSS 1A"
      },
      {
        "id": "class-uuid-2",
        "name": "JSS 1B"
      }
    ],
    "teachers": [
      {
        "id": "teacher-uuid-1",
        "name": "John Doe"
      },
      {
        "id": "teacher-uuid-2",
        "name": "Jane Smith"
      }
    ],
    "subjects": [
      {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#FF5733"
      },
      {
        "id": "subject-uuid-2",
        "name": "English Language",
        "code": "ENG101",
        "color": "#3498DB"
      }
    ],
    "timeSlots": [
      {
        "id": "timeslot-uuid-1",
        "name": "08:00 - 08:45",
        "label": "First Period",
        "startTime": "08:00",
        "endTime": "08:45"
      },
      {
        "id": "timeslot-uuid-2",
        "name": "08:45 - 09:30",
        "label": "Second Period",
        "startTime": "08:45",
        "endTime": "09:30"
      }
    ]
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
    }>;
    teachers: Array<{
      id: string;
      name: string;          // Format: "FirstName LastName"
    }>;
    subjects: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string | null;   // Hex color code
    }>;
    timeSlots: Array<{
      id: string;
      name: string;           // Format: "HH:mm - HH:mm"
      label: string;
      startTime: string;
      endTime: string;
    }>;
  };
}
```

**Important Notes:**

1. **Purpose:** Use this endpoint to populate dropdown/select options when creating timetable entries
2. **Filtering:** Only active teachers are included
3. **Sorting:** Results are sorted alphabetically/by order for better UX

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Error fetching timetable options",
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

## 6. Get Timetable Schedules

Get the complete weekly timetable for a specific class.

**Endpoint:** `POST /director/schedules/timetable`

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
| class | string | Yes | Class level (jss1, jss2, jss3, ss1, ss2, ss3) |

**Example Request:**
```json
{
  "class": "jss1"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Timetable for jss1 retrieved successfully",
  "data": {
    "class": [
      {
        "classId": "class-uuid-1",
        "name": "JSS 1"
      }
    ],
    "timeSlots": [
      {
        "id": "timeslot-uuid-1",
        "startTime": "08:00",
        "endTime": "08:45",
        "label": "First Period",
        "order": 1
      },
      {
        "id": "timeslot-uuid-2",
        "startTime": "08:45",
        "endTime": "09:30",
        "label": "Second Period",
        "order": 2
      },
      {
        "id": "timeslot-uuid-3",
        "startTime": "09:30",
        "endTime": "10:00",
        "label": "Break",
        "order": 3
      }
    ],
    "schedule": {
      "MONDAY": [
        {
          "timeSlotId": "timeslot-uuid-1",
          "startTime": "08:00",
          "endTime": "08:45",
          "label": "First Period",
          "subject": {
            "id": "subject-uuid-1",
            "name": "Mathematics",
            "code": "MATH101",
            "color": "#FF5733"
          },
          "teacher": {
            "id": "teacher-uuid-1",
            "name": "John Doe"
          },
          "room": "Room 101"
        },
        {
          "timeSlotId": "timeslot-uuid-2",
          "startTime": "08:45",
          "endTime": "09:30",
          "label": "Second Period",
          "subject": {
            "id": "subject-uuid-2",
            "name": "English Language",
            "code": "ENG101",
            "color": "#3498DB"
          },
          "teacher": {
            "id": "teacher-uuid-2",
            "name": "Jane Smith"
          },
          "room": "Room 102"
        },
        {
          "timeSlotId": "timeslot-uuid-3",
          "startTime": "09:30",
          "endTime": "10:00",
          "label": "Break",
          "subject": null,
          "teacher": null,
          "room": null
        }
      ],
      "TUESDAY": [
        {
          "timeSlotId": "timeslot-uuid-1",
          "startTime": "08:00",
          "endTime": "08:45",
          "label": "First Period",
          "subject": {
            "id": "subject-uuid-3",
            "name": "Physics",
            "code": "PHY101",
            "color": "#2ECC71"
          },
          "teacher": {
            "id": "teacher-uuid-3",
            "name": "Bob Johnson"
          },
          "room": "Lab 1"
        }
      ],
      "WEDNESDAY": [],
      "THURSDAY": [],
      "FRIDAY": []
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
    class: Array<{
      classId: string;
      name: string;
    }>;
    timeSlots: Array<{
      id: string;
      startTime: string;
      endTime: string;
      label: string;
      order: number;
    }>;
    schedule: {
      MONDAY: Array<DaySchedule>;
      TUESDAY: Array<DaySchedule>;
      WEDNESDAY: Array<DaySchedule>;
      THURSDAY: Array<DaySchedule>;
      FRIDAY: Array<DaySchedule>;
    };
  };
}

interface DaySchedule {
  timeSlotId: string;
  startTime: string;
  endTime: string;
  label: string;
  subject: {
    id: string;
    name: string;
    code: string | null;
    color: string | null;
  } | null;
  teacher: {
    id: string;
    name: string;
  } | null;
  room: string | null;
}
```

**Important Notes:**

1. **Class Levels:** Valid values are `jss1`, `jss2`, `jss3`, `ss1`, `ss2`, `ss3`
2. **Empty Slots:** If no class is scheduled for a time slot, `subject`, `teacher`, and `room` will be `null`
3. **All Time Slots:** Each day includes all time slots for the school, even if unscheduled
4. **Days:** Currently shows Monday-Friday, but can include Saturday and Sunday if configured

**Error Responses:**

**400 Bad Request - Class Not Found:**
```json
{
  "success": false,
  "message": "Class jss4 not found",
  "data": null
}
```

**400 Bad Request - Invalid User:**
```json
{
  "success": false,
  "message": "User not found or invalid school data",
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

## 7. Create Timetable Entry

Create a new timetable entry (schedule a class).

**Endpoint:** `POST /director/schedules/create-timetable`

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
| class_id | string | Yes | Class ID |
| subject_id | string | Yes | Subject ID |
| teacher_id | string | Yes | Teacher ID |
| timeSlotId | string | Yes | Time slot ID |
| day_of_week | string | Yes | Day (MONDAY, TUESDAY, etc.) |
| room | string | No | Room name/number |
| notes | string | No | Additional notes |

**Day of Week Values:**
- `MONDAY`
- `TUESDAY`
- `WEDNESDAY`
- `THURSDAY`
- `FRIDAY`
- `SATURDAY`
- `SUNDAY`

**Example Request:**
```json
{
  "class_id": "class-uuid-1",
  "subject_id": "subject-uuid-1",
  "teacher_id": "teacher-uuid-1",
  "timeSlotId": "timeslot-uuid-1",
  "day_of_week": "MONDAY",
  "room": "Room 101",
  "notes": "Bring textbooks"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": "timetable-entry-uuid-1",
    "class_id": "class-uuid-1",
    "subject_id": "subject-uuid-1",
    "teacher_id": "teacher-uuid-1",
    "school_id": "school-uuid",
    "timeSlotId": "timeslot-uuid-1",
    "day_of_week": "MONDAY",
    "room": "Room 101",
    "notes": "Bring textbooks",
    "isActive": true,
    "academic_session_id": "session-uuid",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "class": {
      "id": "class-uuid-1",
      "name": "JSS 1A",
      "classId": "JSS1A",
      "schoolId": "school-uuid",
      "classTeacherId": "teacher-uuid-2",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "subject": {
      "id": "subject-uuid-1",
      "name": "Mathematics",
      "code": "MATH101",
      "color": "#FF5733",
      "description": "advanced mathematics",
      "schoolId": "school-uuid",
      "classId": "class-uuid-1",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "teacher": {
      "id": "teacher-uuid-1",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@school.edu.ng",
      "phone_number": "+2348012345678",
      "role": "teacher",
      "status": "active",
      "school_id": "school-uuid",
      "display_picture": "https://...",
      "gender": "male",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "timeSlot": {
      "id": "timeslot-uuid-1",
      "startTime": "08:00",
      "endTime": "08:45",
      "label": "First Period",
      "order": 1,
      "isActive": true,
      "schoolId": "school-uuid",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
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
    // Timetable Entry fields
    id: string;
    class_id: string;
    subject_id: string;
    teacher_id: string;
    school_id: string;
    timeSlotId: string;
    day_of_week: string;
    room: string | null;
    notes: string | null;
    isActive: boolean;
    academic_session_id: string;
    createdAt: string;
    updatedAt: string;
    
    // Related entities (full objects)
    class: {
      id: string;
      name: string;
      classId: string;
      schoolId: string;
      classTeacherId: string | null;
      createdAt: string;
      updatedAt: string;
    };
    subject: {
      id: string;
      name: string;
      code: string | null;
      color: string | null;
      description: string | null;
      schoolId: string;
      classId: string | null;
      createdAt: string;
      updatedAt: string;
    };
    teacher: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone_number: string;
      role: string;
      status: string;
      school_id: string;
      display_picture: string | null;
      gender: string;
      createdAt: string;
      updatedAt: string;
    };
    timeSlot: {
      id: string;
      startTime: string;
      endTime: string;
      label: string;
      order: number;
      isActive: boolean;
      schoolId: string;
      createdAt: string;
      updatedAt: string;
    };
  };
}
```

**Important Notes:**

1. **Email Notification:** Teacher receives an email notification when assigned to a timetable entry
2. **Academic Session:** Entry is automatically linked to the current academic session
3. **Validation:** System checks for conflicts (duplicate entries, teacher double-booking)
4. **Full Relations:** Response includes complete details of class, subject, teacher, and time slot

**Error Responses:**

**400 Bad Request - Duplicate Entry:**
```json
{
  "success": false,
  "message": "A schedule already exists for this class, time slot and day",
  "data": null
}
```

**400 Bad Request - Teacher Conflict:**
```json
{
  "success": false,
  "message": "Teacher is already scheduled for this time slot and day",
  "data": null
}
```

**400 Bad Request - Class Not Found:**
```json
{
  "success": false,
  "message": "Specified class not found or does not belong to this school",
  "data": null
}
```

**400 Bad Request - Subject Not Found:**
```json
{
  "success": false,
  "message": "Specified subject not found or does not belong to this school",
  "data": null
}
```

**400 Bad Request - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Specified teacher not found or does not belong to this school",
  "data": null
}
```

**400 Bad Request - Time Slot Not Found:**
```json
{
  "success": false,
  "message": "Specified time slot not found or is not active",
  "data": null
}
```

**400 Bad Request - No Academic Session:**
```json
{
  "success": false,
  "message": "No current academic session found for the school",
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

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized access",
  "data": null
}
```

---

## 8. Get Subjects with Teachers

Get all subjects with their assigned teachers.

**Endpoint:** `GET /director/schedules/subjects-with-teachers`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /director/schedules/subjects-with-teachers
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subjects with teachers fetched successfully",
  "data": {
    "subjects": [
      {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#FF5733",
        "teachers": [
          {
            "id": "teacher-uuid-1",
            "name": "John Doe",
            "display_picture": "https://example.com/photo1.jpg"
          },
          {
            "id": "teacher-uuid-2",
            "name": "Jane Smith",
            "display_picture": "https://example.com/photo2.jpg"
          }
        ]
      },
      {
        "id": "subject-uuid-2",
        "name": "English Language",
        "code": "ENG101",
        "color": "#3498DB",
        "teachers": [
          {
            "id": "teacher-uuid-3",
            "name": "Bob Johnson",
            "display_picture": null
          }
        ]
      },
      {
        "id": "subject-uuid-3",
        "name": "Physics",
        "code": "PHY101",
        "color": "#2ECC71",
        "teachers": []
      }
    ],
    "summary": {
      "total_subjects": 15,
      "subjects_with_teachers": 12,
      "subjects_without_teachers": 3
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
    subjects: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string | null;
      teachers: Array<{
        id: string;
        name: string;             // Format: "FirstName LastName"
        display_picture: string | null;
      }>;
    }>;
    summary: {
      total_subjects: number;
      subjects_with_teachers: number;
      subjects_without_teachers: number;
    };
  };
}
```

**Important Notes:**

1. **Purpose:** Useful for viewing which subjects have teachers assigned before creating timetables
2. **Empty Teachers:** Subjects without assigned teachers will have an empty `teachers` array
3. **Summary Stats:** Provides quick overview of teacher assignments

**Error Responses:**

**400 Bad Request - School Not Found:**
```json
{
  "success": false,
  "message": "School not found",
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
| 400 | Bad Request - Invalid request data, conflicts, or validation errors |
| 401 | Unauthorized - Missing or invalid authentication token |
| 404 | Not Found - Requested resource not found |
| 500 | Internal Server Error - Server error occurred |

---

## Data Types & Enums

### Day of Week Enum
```typescript
type DayOfWeek = 
  | 'MONDAY' 
  | 'TUESDAY' 
  | 'WEDNESDAY' 
  | 'THURSDAY' 
  | 'FRIDAY' 
  | 'SATURDAY' 
  | 'SUNDAY';
```

### Class Level Enum (for timetable retrieval)
```typescript
type ClassLevel = 'jss1' | 'jss2' | 'jss3' | 'ss1' | 'ss2' | 'ss3';
```

### Time Format
- **Format:** `HH:mm` (24-hour clock)
- **Examples:** `08:00`, `14:30`, `23:45`
- **Validation:** Regex pattern: `^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$`

---

## Business Logic Notes

### 1. Time Slot Management

**Order Assignment:**
- Time slots are automatically ordered sequentially
- Order starts at 1 and increments
- When creating, system assigns next available order number

**Overlap Detection:**
- System checks for time slot overlaps when creating or updating
- A time slot cannot:
  - Start within another time slot's duration
  - End within another time slot's duration
  - Completely encompass another time slot

**Soft Delete:**
- Time slots are soft-deleted (`isActive` set to `false`)
- Cannot delete if used in active timetable entries
- Soft-deleted slots can be reactivated by updating `isActive` to `true`

### 2. Timetable Entry Management

**Conflict Prevention:**
- **Class Conflict:** Cannot schedule the same class twice at the same time/day
- **Teacher Conflict:** Cannot schedule a teacher in multiple classes at the same time/day
- All IDs must belong to the same school

**Academic Session:**
- Entries are automatically linked to the current academic session
- System validates that an academic session exists before creating entries

**Email Notifications:**
- Teacher receives email when assigned to timetable entry
- Email includes: class name, subject, day, time slot, and room

### 3. Data Relationships

**School Isolation:**
- All queries are filtered by school
- Resources from other schools cannot be accessed or assigned

**Active Status:**
- Only active teachers are included in timetable options
- Only active time slots are used in timetables
- Timetable entries have `isActive` flag for future soft-delete support

---

## Example Usage (JavaScript/TypeScript)

### Creating a Time Slot

```typescript
const createTimeSlot = async (slotData) => {
  try {
    const response = await fetch('/director/schedules/create-time-slot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startTime: slotData.startTime,  // "08:30"
        endTime: slotData.endTime,      // "09:15"
        label: slotData.label            // "First Period"
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showToast('success', result.message);
      console.log('Time Slot:', result.data);
      return result.data;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to create time slot');
    return null;
  }
};
```

### Fetching Timetable Options

```typescript
const fetchTimetableOptions = async () => {
  try {
    const response = await fetch('/director/schedules/timetable-options', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      // Format for dropdowns
      const classOptions = result.data.classes.map(cls => ({
        value: cls.id,
        label: cls.name
      }));
      
      const teacherOptions = result.data.teachers.map(teacher => ({
        value: teacher.id,
        label: teacher.name
      }));
      
      const subjectOptions = result.data.subjects.map(subject => ({
        value: subject.id,
        label: `${subject.name} (${subject.code})`,
        color: subject.color
      }));
      
      const timeSlotOptions = result.data.timeSlots.map(slot => ({
        value: slot.id,
        label: slot.name  // "08:00 - 08:45"
      }));
      
      return {
        classOptions,
        teacherOptions,
        subjectOptions,
        timeSlotOptions
      };
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

### Creating a Timetable Entry

```typescript
const createTimetableEntry = async (entryData) => {
  try {
    const response = await fetch('/director/schedules/create-timetable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        class_id: entryData.classId,
        subject_id: entryData.subjectId,
        teacher_id: entryData.teacherId,
        timeSlotId: entryData.timeSlotId,
        day_of_week: entryData.dayOfWeek,  // "MONDAY"
        room: entryData.room,               // Optional
        notes: entryData.notes              // Optional
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Class scheduled successfully');
      console.log('Teacher will receive email notification');
      return result.data;
    } else {
      showToast('error', result.message);
      
      // Handle specific conflicts
      if (result.message.includes('already exists')) {
        showWarning('This time slot is already occupied for this class');
      } else if (result.message.includes('already scheduled')) {
        showWarning('This teacher is already teaching another class at this time');
      }
      
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to create schedule');
    return null;
  }
};
```

### Fetching Timetable for a Class

```typescript
const fetchClassTimetable = async (classLevel) => {
  try {
    const response = await fetch('/director/schedules/timetable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        class: classLevel  // "jss1", "jss2", etc.
      })
    });

    const result = await response.json();
    
    if (result.success) {
      // Extract timetable data
      const { schedule, timeSlots, class: classInfo } = result.data;
      
      // Process for display
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      
      const timetableGrid = days.map(day => ({
        day,
        periods: schedule[day].map(period => ({
          time: `${period.startTime} - ${period.endTime}`,
          subject: period.subject?.name || 'Free Period',
          teacher: period.teacher?.name || '-',
          room: period.room || '-',
          color: period.subject?.color || '#CCCCCC'
        }))
      }));
      
      return timetableGrid;
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

### Updating a Time Slot

```typescript
const updateTimeSlot = async (slotId, updates) => {
  try {
    const response = await fetch(`/director/schedules/time-slots/${slotId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        startTime: updates.startTime,
        endTime: updates.endTime,
        label: updates.label,
        // Only include fields being updated
      })
    });

    const result = await response.json();
    
    if (result.success) {
      showToast('success', 'Time slot updated successfully');
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

---

## UI/UX Recommendations

### 1. Time Slot Management
- **Visual Timeline:** Display time slots in a visual timeline format
- **Overlap Warning:** Show visual warnings for overlapping times before submission
- **Quick Actions:** Add, edit, delete time slots inline

### 2. Timetable Grid
- **Color Coding:** Use subject colors to visually distinguish classes
- **Drag & Drop:** Consider drag-and-drop interface for scheduling
- **Conflict Indicators:** Highlight conflicts before saving
- **Teacher View:** Show teacher's schedule across all classes

### 3. Creation Form
- **Multi-Step:** Break timetable entry creation into steps
- **Smart Defaults:** Pre-fill common values
- **Validation:** Real-time validation with helpful error messages
- **Bulk Actions:** Allow creating multiple entries at once

### 4. Display
- **Week View:** Default to weekly view
- **Print Format:** Provide printer-friendly timetable
- **Filter Options:** Filter by teacher, subject, or class
- **Empty State:** Show helpful message for empty time slots

### 5. General
- **Loading States:** Skeleton loaders for timetable grids
- **Confirmation Modals:** Confirm before deleting time slots
- **Quick Info:** Hover tooltips for teacher/subject details
- **Responsive Design:** Mobile-friendly timetable view

---

## Testing Endpoints

### Using cURL

```bash
# Create time slot
curl -X POST "/director/schedules/create-time-slot" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "08:30",
    "endTime": "09:15",
    "label": "First Period"
  }'

# Get all time slots
curl -X GET "/director/schedules/time-slots" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get timetable options
curl -X GET "/director/schedules/timetable-options" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create timetable entry
curl -X POST "/director/schedules/create-timetable" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "class_id": "class-uuid",
    "subject_id": "subject-uuid",
    "teacher_id": "teacher-uuid",
    "timeSlotId": "timeslot-uuid",
    "day_of_week": "MONDAY",
    "room": "Room 101"
  }'

# Get timetable
curl -X POST "/director/schedules/timetable" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "class": "jss1"
  }'

# Update time slot
curl -X PATCH "/director/schedules/time-slots/timeslot-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Updated Period"
  }'

# Delete time slot
curl -X DELETE "/director/schedules/time-slots/timeslot-uuid" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in all requests
2. **Response Checking:** Always check `success` field before accessing `data`
3. **Error Handling:** Display user-friendly error messages via toasters
4. **Time Format:** Use 24-hour format (HH:mm) for all time inputs
5. **Day Values:** Use uppercase day names (MONDAY, not Monday)
6. **Color Coding:** Use subject colors in timetable display for better UX
7. **Conflict Prevention:** Validate selections before submission to avoid conflicts
8. **Loading States:** Show loading indicators during API calls
9. **Caching:** Consider caching timetable options to reduce API calls
10. **Refresh:** Refresh timetable view after creating/updating entries

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 16, 2026

