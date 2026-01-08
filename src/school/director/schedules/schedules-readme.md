# Schedules API Documentation

This document provides request and response structures for all Schedules endpoints. All endpoints require authentication via JWT token in the `Authorization` header: `Bearer <token>`

**Base URL:** `/director/schedules`

**Response Format:** All responses follow this structure:
```typescript
{
  success: boolean;
  message: string;
  data: T; // Response data (varies by endpoint)
  statusCode?: number;
}
```

---

## 1. Create Time Slot

**Endpoint:** `POST /director/schedules/create-time-slot`

**Request Body:**
```typescript
{
  startTime: string;    // Required: Start time in HH:mm format (e.g., "08:30")
  endTime: string;      // Required: End time in HH:mm format (e.g., "10:30")
  label: string;        // Required: Label for the time slot (e.g., "First Period")
}
```

**Response (201):**
```typescript
{
  success: true;
  message: "Time slot created successfully";
  data: {
    id: string;
    startTime: string;
    endTime: string;
    label: string;
    order: number;
    school_id: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  statusCode: 201;
}
```

**Error Responses:**
- **400:** Invalid time format, end time must be after start time, or time slot overlaps with existing period
- **401:** Unauthorized - Invalid or missing JWT token

---

## 2. Get All Time Slots

**Endpoint:** `GET /director/schedules/time-slots`

**Response (200):**
```typescript
{
  success: true;
  message: "Total of X time slots fetched successfully";
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
  statusCode: 200;
}
```

**Error Responses:**
- **401:** Unauthorized - Invalid or missing JWT token

---

## 3. Get Timetable Options

**Endpoint:** `GET /director/schedules/timetable-options`

**Description:** Fetch all available classes, teachers, subjects, and time slots for creating timetables

**Response (200):**
```typescript
{
  success: true;
  message: "Timetable options retrieved successfully";
  data: {
    classes: Array<{
      id: string;
      name: string;
    }>;
    teachers: Array<{
      id: string;
      name: string;  // Format: "First Last"
    }>;
    subjects: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string | null;
    }>;
    timeSlots: Array<{
      id: string;
      name: string;        // Format: "08:00 - 08:45"
      label: string;
      startTime: string;
      endTime: string;
    }>;
  };
  statusCode: 200;
}
```

**Error Responses:**
- **401:** Unauthorized - Invalid or missing JWT token

---

## 4. Update Time Slot

**Endpoint:** `PATCH /director/schedules/time-slots/:id`

**URL Parameters:**
- `id` (string): The time slot ID

**Request Body (all fields optional):**
```typescript
{
  startTime?: string;    // Optional: Start time in HH:mm format
  endTime?: string;      // Optional: End time in HH:mm format
  label?: string;        // Optional: Label for the time slot
  order?: number;        // Optional: Order (minimum 1)
  isActive?: boolean;    // Optional: Whether the time slot is active
}
```

**Response (200):**
```typescript
{
  success: true;
  message: "Time slot updated successfully";
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
  statusCode: 200;
}
```

**Error Responses:**
- **400:** Invalid time format, end time must be after start time, or time slot overlaps with existing period
- **401:** Unauthorized - Invalid or missing JWT token
- **404:** Time slot not found

---

## 5. Delete Time Slot

**Endpoint:** `DELETE /director/schedules/time-slots/:id`

**URL Parameters:**
- `id` (string): The time slot ID

**Response (200):**
```typescript
{
  success: true;
  message: "Time slot deleted successfully";
  data: {
    id: string;
    startTime: string;
    endTime: string;
    label: string;
    order: number;
    isActive: boolean;  // Will be set to false (soft delete)
    schoolId: string;
    createdAt: string;
    updatedAt: string;
  };
  statusCode: 200;
}
```

**Error Responses:**
- **400:** Cannot delete time slot as it is being used in timetable entries
- **401:** Unauthorized - Invalid or missing JWT token
- **404:** Time slot not found

---

## 6. Get Timetable Schedules

**Endpoint:** `POST /director/schedules/timetable`

**Request Body:**
```typescript
{
  class: string;  // Required: Class level - "jss1" | "jss2" | "jss3" | "ss1" | "ss2" | "ss3"
}
```

**Response (200):**
```typescript
{
  success: true;
  message: "Timetable for {class} retrieved successfully";
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
      MONDAY: Array<{
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
          name: string;  // Format: "First Last"
        } | null;
        room: string | null;
      }>;
      TUESDAY: Array<{ /* same structure as MONDAY */ }>;
      WEDNESDAY: Array<{ /* same structure as MONDAY */ }>;
      THURSDAY: Array<{ /* same structure as MONDAY */ }>;
      FRIDAY: Array<{ /* same structure as MONDAY */ }>;
    };
  };
  statusCode: 200;
}
```

**Error Responses:**
- **400:** Class not found or invalid data provided

---

## 7. Create Timetable Entry

**Endpoint:** `POST /director/schedules/create-timetable`

**Request Body:**
```typescript
{
  class_id: string;           // Required: Class ID
  subject_id: string;          // Required: Subject ID
  teacher_id: string;          // Required: Teacher ID
  timeSlotId: string;          // Required: Time slot ID
  day_of_week: string;         // Required: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"
  room?: string;               // Optional: Room name (e.g., "Room 101")
  notes?: string;              // Optional: Additional notes (e.g., "Bring textbooks")
}
```

**Response (201):**
```typescript
{
  success: true;
  message: "Schedule created successfully";
  data: {
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
    class: {
      id: string;
      name: string;
      // ... other class fields
    };
    subject: {
      id: string;
      name: string;
      code: string | null;
      color: string | null;
      // ... other subject fields
    };
    teacher: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    timeSlot: {
      id: string;
      startTime: string;
      endTime: string;
      label: string;
      order: number;
      // ... other timeSlot fields
    };
  };
  statusCode: 201;
}
```

**Error Responses:**
- **400:** 
  - A schedule already exists for this class, time slot and day
  - Teacher is already scheduled for this time slot and day
  - Specified class/subject/teacher/time slot not found
  - No current academic session found for the school
- **401:** Unauthorized - Invalid or missing JWT token

**Note:** An email notification will be sent to the teacher when a timetable entry is created.

---

## 8. Get Subjects with Teachers

**Endpoint:** `GET /director/schedules/subjects-with-teachers`

**Response (200):**
```typescript
{
  success: true;
  message: "Subjects with teachers fetched successfully";
  data: {
    subjects: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string | null;
      teachers: Array<{
        id: string;
        name: string;  // Format: "First Last"
        display_picture: string | null;
      }>;
    }>;
    summary: {
      total_subjects: number;
      subjects_with_teachers: number;
      subjects_without_teachers: number;
    };
  };
  statusCode: 200;
}
```

**Error Responses:**
- **401:** Unauthorized - Invalid or missing JWT token

---

## Error Responses

All endpoints may return the following error responses:

**400 Bad Request:**
```typescript
{
  success: false;
  message: string;  // Error description
  data: null;
  statusCode: 400;
}
```

**401 Unauthorized:**
```typescript
{
  success: false;
  message: "Unauthorized - Invalid or missing JWT token";
  data: null;
  statusCode: 401;
}
```

**404 Not Found:**
```typescript
{
  success: false;
  message: string;  // e.g., "Time slot not found"
  data: null;
  statusCode: 404;
}
```

---

## Notes

1. **Authentication:** All endpoints require a valid JWT token in the `Authorization` header as `Bearer <token>`

2. **Time Format:** All time fields must be in `HH:mm` format (24-hour format), e.g., "08:30", "14:45"

3. **Time Slot Validation:**
   - End time must be after start time
   - Time slots cannot overlap with existing active time slots
   - When updating a time slot, the system checks for overlaps with other time slots

4. **Timetable Entry Validation:**
   - Cannot create duplicate entries for the same class, time slot, and day
   - A teacher cannot be scheduled for the same time slot and day in multiple classes
   - All referenced entities (class, subject, teacher, time slot) must exist and belong to the school

5. **Soft Delete:** Time slots are soft-deleted (isActive set to false) rather than permanently deleted. They cannot be deleted if they are being used in active timetable entries.

6. **Day of Week Values:** Valid values are: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`

7. **Class Levels:** Valid class levels for timetable retrieval are: `jss1`, `jss2`, `jss3`, `ss1`, `ss2`, `ss3`

8. **Email Notifications:** When a timetable entry is created, an email notification is automatically sent to the assigned teacher with schedule details.

9. **Academic Session:** Timetable entries are automatically associated with the current academic session for the school.

10. **Order Auto-Assignment:** When creating a time slot, the order is automatically assigned as the next available number (incremented from the highest existing order).

