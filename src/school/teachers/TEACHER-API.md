# Teacher API Documentation

**Base URL:** `/teachers`

**Authentication:** All endpoints require Bearer token authentication (JWT)

**Audience:** These endpoints are for **teachers** to access their own information, timetables, students, and subjects.

---

## Table of Contents
1. [Get Teacher Profile](#1-get-teacher-profile)
2. [Get Teacher Timetable](#2-get-teacher-timetable)
3. [Get Teacher Dashboard](#3-get-teacher-dashboard)
4. [Get Student Tab](#4-get-student-tab)
5. [Get Schedules Tab](#5-get-schedules-tab)
6. [Get Subjects Dashboard](#6-get-subjects-dashboard)

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

## 1. Get Teacher Profile

Get the authenticated teacher's profile information including assigned subjects and managed classes.

**Endpoint:** `GET /teachers/profile`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /teachers/profile
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Teacher profile fetched successfully",
  "data": {
    "id": "teacher-uuid-1",
    "name": "John Doe",
    "email": "john.doe@school.edu.ng",
    "phone_number": "+2348012345678",
    "display_picture": "https://example.com/photo.jpg",
    "status": "active",
    "assigned_subjects": [
      {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#FF5733",
        "description": "advanced mathematics",
        "assigned_class": {
          "id": "class-uuid-1",
          "name": "JSS 1A"
        }
      },
      {
        "id": "subject-uuid-2",
        "name": "Physics",
        "code": "PHY101",
        "color": "#3498DB",
        "description": "introduction to physics",
        "assigned_class": {
          "id": "class-uuid-2",
          "name": "JSS 2A"
        }
      }
    ],
    "managed_classes": [
      {
        "id": "class-uuid-1",
        "name": "JSS 1A",
        "student_count": 30,
        "subject_count": 10
      }
    ],
    "summary": {
      "total_subjects": 2,
      "total_classes": 1
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
    id: string;
    name: string;
    email: string;
    phone_number: string;
    display_picture: string | null;
    status: string;
    assigned_subjects: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string | null;
      description: string | null;
      assigned_class: {
        id: string;
        name: string;
      } | null;
    }>;
    managed_classes: Array<{
      id: string;
      name: string;
      student_count: number;
      subject_count: number;
    }>;
    summary: {
      total_subjects: number;
      total_classes: number;
    };
  };
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher profile not found",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to fetch teacher profile",
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

## 2. Get Teacher Timetable

Get the authenticated teacher's weekly timetable showing all classes they teach.

**Endpoint:** `GET /teachers/timetable`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /teachers/timetable
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Teacher timetable fetched successfully",
  "data": {
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
          "class": {
            "id": "class-uuid-1",
            "name": "JSS 1A"
          },
          "subject": {
            "id": "subject-uuid-1",
            "name": "Mathematics",
            "code": "MATH101",
            "color": "#FF5733"
          },
          "room": "Room 101"
        },
        {
          "timeSlotId": "timeslot-uuid-2",
          "startTime": "08:45",
          "endTime": "09:30",
          "label": "Second Period",
          "class": {
            "id": "class-uuid-2",
            "name": "JSS 1B"
          },
          "subject": {
            "id": "subject-uuid-1",
            "name": "Mathematics",
            "code": "MATH101",
            "color": "#FF5733"
          },
          "room": "Room 102"
        },
        {
          "timeSlotId": "timeslot-uuid-3",
          "startTime": "09:30",
          "endTime": "10:00",
          "label": "Break",
          "class": null,
          "subject": null,
          "room": null
        }
      ],
      "TUESDAY": [
        {
          "timeSlotId": "timeslot-uuid-1",
          "startTime": "08:00",
          "endTime": "08:45",
          "label": "First Period",
          "class": {
            "id": "class-uuid-3",
            "name": "JSS 2A"
          },
          "subject": {
            "id": "subject-uuid-2",
            "name": "Physics",
            "code": "PHY101",
            "color": "#3498DB"
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
    timeSlots: Array<{
      id: string;
      startTime: string;      // HH:mm format
      endTime: string;        // HH:mm format
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
  class: {
    id: string;
    name: string;
  } | null;
  subject: {
    id: string;
    name: string;
    code: string | null;
    color: string | null;
  } | null;
  room: string | null;
}
```

**Important Notes:**

1. **All Time Slots Included:** Each day includes all school time slots, even unscheduled ones (where `class`, `subject`, and `room` are `null`)
2. **Only Teacher's Classes:** Shows only classes where the authenticated teacher is assigned
3. **Days:** Currently shows Monday-Friday

**Error Responses:**

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to fetch teacher timetable",
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

## 3. Get Teacher Dashboard

Get comprehensive dashboard data including managed class statistics, subjects, upcoming schedule, and notifications.

**Endpoint:** `GET /teachers/dashboard`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /teachers/dashboard
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Teacher dashboard fetched successfully",
  "data": {
    "current_session": {
      "academic_year": "2024/2025",
      "start_year": 2024,
      "end_year": 2025,
      "term": "first",
      "term_start_date": "2024-09-01T00:00:00Z",
      "term_end_date": "2024-12-20T00:00:00Z"
    },
    "managed_class": {
      "id": "class-uuid-1",
      "name": "JSS 1A",
      "students": {
        "total": 30,
        "males": 18,
        "females": 12
      }
    },
    "subjects_teaching": [
      {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#FF5733",
        "description": "advanced mathematics"
      },
      {
        "id": "subject-uuid-2",
        "name": "Physics",
        "code": "PHY101",
        "color": "#3498DB",
        "description": "introduction to physics"
      }
    ],
    "recent_notifications": [
      {
        "id": "notification-uuid-1",
        "title": "Staff Meeting",
        "description": "All staff meeting at 2 PM",
        "type": "announcement",
        "comingUpOn": "2024-01-20T14:00:00Z",
        "createdAt": "2024-01-15T10:00:00Z"
      },
      {
        "id": "notification-uuid-2",
        "title": "Parent-Teacher Conference",
        "description": "Schedule conferences with parents",
        "type": "event",
        "comingUpOn": "2024-01-25T09:00:00Z",
        "createdAt": "2024-01-14T15:00:00Z"
      }
    ],
    "class_schedules": {
      "today": {
        "day": "MONDAY",
        "schedule": [
          {
            "subject": {
              "id": "subject-uuid-1",
              "name": "Mathematics",
              "code": "MATH101",
              "color": "#FF5733"
            },
            "class": {
              "id": "class-uuid-1",
              "name": "JSS 1A"
            },
            "time": {
              "from": "08:00",
              "to": "08:45",
              "label": "First Period"
            },
            "room": "Room 101"
          }
        ]
      },
      "tomorrow": {
        "day": "TUESDAY",
        "schedule": [
          {
            "subject": {
              "id": "subject-uuid-2",
              "name": "Physics",
              "code": "PHY101",
              "color": "#3498DB"
            },
            "class": {
              "id": "class-uuid-3",
              "name": "JSS 2A"
            },
            "time": {
              "from": "09:30",
              "to": "10:15",
              "label": "Third Period"
            },
            "room": "Lab 1"
          }
        ]
      },
      "day_after_tomorrow": {
        "day": "WEDNESDAY",
        "schedule": []
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
    current_session: {
      academic_year: string;
      start_year: number;
      end_year: number;
      term: string;
      term_start_date: string;
      term_end_date: string;
    };
    managed_class: {
      id: string | null;
      name: string | null;
      students: {
        total: number;
        males: number;
        females: number;
      };
    };
    subjects_teaching: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string | null;
      description: string | null;
    }>;
    recent_notifications: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      comingUpOn: string;
      createdAt: string;
    }>;
    class_schedules: {
      today: {
        day: string;
        schedule: Array<ScheduleEntry>;
      };
      tomorrow: {
        day: string;
        schedule: Array<ScheduleEntry>;
      };
      day_after_tomorrow: {
        day: string;
        schedule: Array<ScheduleEntry>;
      };
    };
  };
}

interface ScheduleEntry {
  subject: {
    id: string;
    name: string;
    code: string | null;
    color: string | null;
  };
  class: {
    id: string;
    name: string;
  };
  time: {
    from: string;
    to: string;
    label: string;
  };
  room: string | null;
}
```

**Important Notes:**

1. **Managed Class:** Shows statistics for the class the teacher manages (if any). Will be `null` if teacher doesn't manage a class.
2. **Recent Notifications:** Shows latest 3 notifications for the school
3. **3-Day Schedule:** Shows today, tomorrow, and day after tomorrow's schedules
4. **Current Session:** Includes full academic session information

**Error Responses:**

**404 Not Found - Teacher Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
  "data": null
}
```

**400 Bad Request - No Academic Session:**
```json
{
  "success": false,
  "message": "No current academic session found",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to fetch teacher dashboard",
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

## 4. Get Student Tab

Get list of students in classes managed by the teacher, with pagination, search, and filtering.

**Endpoint:** `GET /teachers/student-tab`

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
| search | string | No | - | Search by student name or email |
| class_id | string | No | - | Filter by specific class ID |
| sort_by | string | No | createdAt | Sort by field (name, createdAt) |
| sort_order | string | No | desc | Sort order (asc, desc) |

**Example Request:**
```
GET /teachers/student-tab?page=1&limit=10&search=jane&class_id=class-uuid-1&sort_by=name&sort_order=asc
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Student tab fetched successfully",
  "data": {
    "students": {
      "data": [
        {
          "id": "student-record-uuid-1",
          "student_id": "smh/2024/001",
          "name": "Jane Smith",
          "email": "jane.smith@school.edu.ng",
          "display_picture": "https://example.com/photo.jpg",
          "status": "active",
          "gender": "female",
          "class": {
            "id": "class-uuid-1",
            "name": "JSS 1A"
          },
          "user_id": "user-uuid-1"
        },
        {
          "id": "student-record-uuid-2",
          "student_id": "smh/2024/002",
          "name": "John Doe",
          "email": "john.doe@school.edu.ng",
          "display_picture": "https://example.com/photo2.jpg",
          "status": "active",
          "gender": "male",
          "class": {
            "id": "class-uuid-1",
            "name": "JSS 1A"
          },
          "user_id": "user-uuid-2"
        }
      ],
      "pagination": {
        "current_page": 1,
        "total_items": 30,
        "total_pages": 3,
        "has_next": true,
        "has_previous": false,
        "results_per_page": 10
      }
    },
    "classes": [
      {
        "id": "class-uuid-1",
        "name": "JSS 1A",
        "student_count": 30,
        "subject_count": 10
      }
    ],
    "subjects": [
      {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#FF5733",
        "description": "advanced mathematics",
        "assigned_class": {
          "id": "class-uuid-1",
          "name": "JSS 1A"
        }
      }
    ],
    "summary": {
      "total_students": 30,
      "total_classes": 1,
      "total_subjects": 2
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
    students: {
      data: Array<{
        id: string;
        student_id: string;
        name: string;
        email: string;
        display_picture: string | null;
        status: string;
        gender: string;
        class: {
          id: string;
          name: string;
        } | null;
        user_id: string;
      }>;
      pagination: {
        current_page: number;
        total_items: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
        results_per_page: number;
      };
    };
    classes: Array<{
      id: string;
      name: string;
      student_count: number;
      subject_count: number;
    }>;
    subjects: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string | null;
      description: string | null;
      assigned_class: {
        id: string;
        name: string;
      } | null;
    }>;
    summary: {
      total_students: number;
      total_classes: number;
      total_subjects: number;
    };
  };
}
```

**Important Notes:**

1. **Only Managed Classes:** Shows students only from classes the teacher manages
2. **Class Filter:** If `class_id` is provided, it must be a class the teacher manages
3. **Search:** Searches across student name (first and last) and email

**Error Responses:**

**404 Not Found:**
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
  "message": "Failed to fetch student tab",
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

## 5. Get Schedules Tab

Get the teacher's schedule information including subjects taught, classes, and full timetable data.

**Endpoint:** `GET /teachers/schedules-tab`

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Example Request:**
```
GET /teachers/schedules-tab
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Schedules tab fetched successfully",
  "data": {
    "subjects": [
      {
        "id": "subject-uuid-1",
        "name": "Mathematics",
        "code": "MATH101",
        "color": "#FF5733"
      },
      {
        "id": "subject-uuid-2",
        "name": "Physics",
        "code": "PHY101",
        "color": "#3498DB"
      }
    ],
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
    "timetable_data": {
      "timeSlots": [
        {
          "id": "timeslot-uuid-1",
          "startTime": "08:00",
          "endTime": "08:45",
          "order": 1,
          "label": "First Period"
        },
        {
          "id": "timeslot-uuid-2",
          "startTime": "08:45",
          "endTime": "09:30",
          "order": 2,
          "label": "Second Period"
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
            "subject": null,
            "teacher": null,
            "room": null
          }
        ],
        "TUESDAY": [],
        "WEDNESDAY": [],
        "THURSDAY": [],
        "FRIDAY": [],
        "SATURDAY": [],
        "SUNDAY": []
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
    subjects: Array<{
      id: string;
      name: string;
      code: string | null;
      color: string | null;
    }>;
    classes: Array<{
      id: string;
      name: string;
    }>;
    timetable_data: {
      timeSlots: Array<{
        id: string;
        startTime: string;
        endTime: string;
        order: number;
        label: string;
      }>;
      schedule: {
        MONDAY: Array<ScheduleSlot>;
        TUESDAY: Array<ScheduleSlot>;
        WEDNESDAY: Array<ScheduleSlot>;
        THURSDAY: Array<ScheduleSlot>;
        FRIDAY: Array<ScheduleSlot>;
        SATURDAY: Array<ScheduleSlot>;
        SUNDAY: Array<ScheduleSlot>;
      };
    };
  };
}

interface ScheduleSlot {
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

1. **All Subjects:** Shows all subjects where the teacher is assigned (not just their own)
2. **All Classes:** Shows all classes taking the teacher's subjects
3. **Complete Timetable:** Shows full week schedule with all time slots
4. **All Days:** Includes all 7 days (Monday-Sunday)

**Error Responses:**

**404 Not Found:**
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
  "message": "Failed to fetch schedules tab",
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

## 6. Get Subjects Dashboard

Get comprehensive subjects dashboard with pagination, search, filtering, and content statistics for each subject.

**Endpoint:** `GET /teachers/subjects-dashboard`

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
| limit | number | No | 5 | Number of items per page |
| search | string | No | - | Search by subject name or code |
| academic_session_id | string | No | - | Filter by academic session |
| class_id | string | No | - | Filter by class ID |
| sort_by | string | No | name | Sort by field (name, createdAt) |
| sort_order | string | No | asc | Sort order (asc, desc) |

**Example Request:**
```
GET /teachers/subjects-dashboard?page=1&limit=5&search=math&sort_by=name&sort_order=asc
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Subjects dashboard fetched successfully",
  "data": {
    "subjects": {
      "data": [
        {
          "id": "subject-uuid-1",
          "name": "Mathematics",
          "code": "MATH101",
          "color": "#FF5733",
          "description": "advanced mathematics",
          "thumbnail": "https://example.com/thumbnail.jpg",
          "timetableEntries": [
            {
              "id": "entry-uuid-1",
              "day_of_week": "MONDAY",
              "startTime": "08:00",
              "endTime": "08:45",
              "room": "Room 101",
              "class": {
                "id": "class-uuid-1",
                "name": "JSS 1A"
              }
            },
            {
              "id": "entry-uuid-2",
              "day_of_week": "TUESDAY",
              "startTime": "09:30",
              "endTime": "10:15",
              "room": "Room 102",
              "class": {
                "id": "class-uuid-2",
                "name": "JSS 1B"
              }
            }
          ],
          "classesTakingSubject": [
            {
              "id": "class-uuid-1",
              "name": "JSS 1A"
            },
            {
              "id": "class-uuid-2",
              "name": "JSS 1B"
            }
          ],
          "contentCounts": {
            "totalVideos": 15,
            "totalMaterials": 8,
            "totalAssignments": 5
          },
          "createdAt": "Jan 15, 2024",
          "updatedAt": "Jan 16, 2024"
        }
      ],
      "pagination": {
        "current_page": 1,
        "total_items": 2,
        "total_pages": 1,
        "has_next": false,
        "has_previous": false,
        "results_per_page": 5
      }
    },
    "stats": {
      "totalSubjects": 2,
      "totalVideos": 20,
      "totalMaterials": 15,
      "totalClasses": 3
    },
    "academicSession": {
      "id": "session-uuid",
      "academic_year": "2024/2025",
      "term": "first"
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
    subjects: {
      data: Array<{
        id: string;
        name: string;
        code: string | null;
        color: string | null;
        description: string | null;
        thumbnail: string | null;
        timetableEntries: Array<{
          id: string;
          day_of_week: string;
          startTime: string;
          endTime: string;
          room: string | null;
          class: {
            id: string;
            name: string;
          };
        }>;
        classesTakingSubject: Array<{
          id: string;
          name: string;
        }>;
        contentCounts: {
          totalVideos: number;
          totalMaterials: number;
          totalAssignments: number;
        };
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        current_page: number;
        total_items: number;
        total_pages: number;
        has_next: boolean;
        has_previous: boolean;
        results_per_page: number;
      };
    };
    stats: {
      totalSubjects: number;
      totalVideos: number;
      totalMaterials: number;
      totalClasses: number;
    };
    academicSession: {
      id: string;
      academic_year: string;
      term: string;
    };
  };
}
```

**Important Notes:**

1. **Content Counts:** Shows videos, materials, and assignments for each subject
2. **Timetable Entries:** Shows when and where each subject is taught
3. **Classes Taking Subject:** Shows all classes studying the subject (deduplicated)
4. **Overall Stats:** Total videos, materials, and subjects across all teacher's subjects
5. **Date Formatting:** Dates are formatted as "MMM DD, YYYY"

**Error Responses:**

**404 Not Found:**
```json
{
  "success": false,
  "message": "Teacher not found",
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

**400 Bad Request - Invalid User:**
```json
{
  "success": false,
  "message": "User not found or invalid school data",
  "data": null
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Failed to fetch subjects dashboard",
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
| 400 | Bad Request - Invalid request or processing error |
| 401 | Unauthorized - Missing or invalid authentication token |
| 404 | Not Found - Resource not found (e.g., teacher profile) |
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

### Academic Term Enum
```typescript
type AcademicTerm = 'first' | 'second' | 'third';
```

### User Status
```typescript
type UserStatus = 'active' | 'inactive' | 'suspended';
```

### Sort Options
```typescript
type SortBy = 'name' | 'createdAt';
type SortOrder = 'asc' | 'desc';
```

---

## Example Usage (JavaScript/TypeScript)

### Fetching Teacher Profile

```typescript
const fetchTeacherProfile = async () => {
  try {
    const response = await fetch('/teachers/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const profile = result.data;
      console.log('Teacher:', profile.name);
      console.log('Subjects:', profile.assigned_subjects.length);
      console.log('Classes:', profile.managed_classes.length);
      return profile;
    } else {
      showToast('error', result.message);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    showToast('error', 'Failed to fetch profile');
    return null;
  }
};
```

### Fetching Teacher Timetable

```typescript
const fetchTeacherTimetable = async () => {
  try {
    const response = await fetch('/teachers/timetable', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { schedule, timeSlots } = result.data;
      
      // Process for timetable grid display
      const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
      
      const timetableGrid = days.map(day => ({
        day,
        periods: schedule[day].map(period => ({
          time: `${period.startTime} - ${period.endTime}`,
          class: period.class?.name || 'Free',
          subject: period.subject?.name || '-',
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

### Fetching Teacher Dashboard

```typescript
const fetchTeacherDashboard = async () => {
  try {
    const response = await fetch('/teachers/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const dashboard = result.data;
      
      // Display current session
      console.log('Academic Year:', dashboard.current_session.academic_year);
      console.log('Term:', dashboard.current_session.term);
      
      // Display managed class stats
      if (dashboard.managed_class.id) {
        console.log('Managing:', dashboard.managed_class.name);
        console.log('Total Students:', dashboard.managed_class.students.total);
      } else {
        console.log('No class management assigned');
      }
      
      // Display today's schedule
      const todaySchedule = dashboard.class_schedules.today.schedule;
      console.log(`Today's Classes (${todaySchedule.length}):`, todaySchedule);
      
      return dashboard;
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

### Fetching Students Tab with Pagination

```typescript
const fetchStudentsTab = async (filters) => {
  try {
    const params = new URLSearchParams({
      page: filters.page || '1',
      limit: filters.limit || '10',
      ...(filters.search && { search: filters.search }),
      ...(filters.class_id && { class_id: filters.class_id }),
      sort_by: filters.sort_by || 'createdAt',
      sort_order: filters.sort_order || 'desc'
    });

    const response = await fetch(`/teachers/student-tab?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { students, classes, subjects, summary } = result.data;
      
      console.log('Students:', students.data);
      console.log('Pagination:', students.pagination);
      console.log('Summary:', summary);
      
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

### Fetching Subjects Dashboard

```typescript
const fetchSubjectsDashboard = async (filters) => {
  try {
    const params = new URLSearchParams({
      page: filters.page || '1',
      limit: filters.limit || '5',
      ...(filters.search && { search: filters.search }),
      ...(filters.class_id && { class_id: filters.class_id }),
      sort_by: filters.sort_by || 'name',
      sort_order: filters.sort_order || 'asc'
    });

    const response = await fetch(`/teachers/subjects-dashboard?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      const { subjects, stats, academicSession } = result.data;
      
      // Display subjects with content counts
      subjects.data.forEach(subject => {
        console.log(`${subject.name} (${subject.code})`);
        console.log(`  Videos: ${subject.contentCounts.totalVideos}`);
        console.log(`  Materials: ${subject.contentCounts.totalMaterials}`);
        console.log(`  Assignments: ${subject.contentCounts.totalAssignments}`);
        console.log(`  Classes: ${subject.classesTakingSubject.map(c => c.name).join(', ')}`);
      });
      
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

### 1. Dashboard
- **Quick Stats Cards:** Show managed class stats, subjects count, today's classes
- **Upcoming Schedule:** Display next 3 days in cards or timeline
- **Notifications Badge:** Show unread notification count
- **Quick Actions:** Links to common tasks (view timetable, view students, upload content)

### 2. Timetable View
- **Color-Coded Grid:** Use subject colors for visual distinction
- **Current Time Indicator:** Highlight current/next class
- **Quick Class Info:** Hover tooltips with class and room details
- **Print View:** Printer-friendly timetable format

### 3. Students Tab
- **Search with Autocomplete:** Real-time search suggestions
- **Class Filter Dropdown:** Quick filter by managed classes
- **Student Cards:** Include photo, name, class, and quick actions
- **Performance Indicators:** Show grades/attendance (if available)

### 4. Subjects Dashboard
- **Subject Cards:** Display with subject color, thumbnail, and stats
- **Content Stats:** Show videos, materials, assignments counts
- **Quick Upload:** Direct links to upload content for each subject
- **Schedule View:** Show when/where each subject is taught

### 5. General
- **Loading States:** Skeleton loaders for all data fetching
- **Empty States:** Helpful messages when no data (e.g., no classes managed)
- **Responsive Design:** Mobile-friendly views for all tabs
- **Refresh Button:** Manual refresh option for each section

---

## Testing Endpoints

### Using cURL

```bash
# Get teacher profile
curl -X GET "/teachers/profile" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get teacher timetable
curl -X GET "/teachers/timetable" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get teacher dashboard
curl -X GET "/teachers/dashboard" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get students tab with pagination
curl -X GET "/teachers/student-tab?page=1&limit=10&search=john" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get schedules tab
curl -X GET "/teachers/schedules-tab" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Get subjects dashboard
curl -X GET "/teachers/subjects-dashboard?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Notes for Frontend Implementation

1. **Authentication:** Include Bearer token in all requests
2. **Response Checking:** Always check `success` field before accessing `data`
3. **Error Handling:** Display user-friendly error messages via toasters
4. **Pagination:** Implement pagination controls for student and subjects tabs
5. **Search Debouncing:** Add 300-500ms debounce to search inputs
6. **Color Usage:** Use subject colors consistently across all views
7. **Loading States:** Show loading indicators during API calls
8. **Caching:** Consider caching profile and timetable data
9. **Refresh Strategy:** Auto-refresh dashboard data periodically
10. **Empty State Handling:** Handle cases where teacher has no classes/subjects assigned

---

## Support

For questions or issues, contact the backend development team.

**Last Updated:** January 16, 2026

