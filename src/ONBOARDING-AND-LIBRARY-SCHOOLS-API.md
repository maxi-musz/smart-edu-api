# Onboarding & Library Schools — API Reference (Frontend)

**Base URL:** `{host}/api/v1`

All success responses follow this shape unless noted:

```ts
{
  success: true;
  message: string;
  data?: T;           // response payload
  length?: number;    // present when data is an array
  meta?: unknown;     // optional pagination/extra
  statusCode: number;
}
```

Error responses (4xx/5xx) typically:

```ts
{
  success: false;
  message: string;
  error?: unknown;    // details or validation errors
  statusCode: number;
}
```

---

## 1. Auth onboarding (school director / unauthenticated)

Used by the **school** side. Director endpoints require **Bearer JWT** (school auth token) unless stated otherwise.

---

### 1.1 Onboard school (public, no auth)

**`POST /api/v1/auth/onboard-school`**

- **Auth:** None  
- **Content-Type:** `multipart/form-data`

**Request (form fields + files):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `school_name` | string | Yes | e.g. `"St. Mary's Secondary School"` |
| `school_email` | string | Yes | e.g. `"info@stmarys.edu.ng"` |
| `school_address` | string | Yes | Physical address |
| `school_phone` | string | Yes | e.g. `"+2348012345678"` |
| `school_type` | string | Yes | `"primary"` \| `"secondary"` \| `"primary_and_secondary"` \| `"other"` |
| `school_ownership` | string | Yes | `"government"` \| `"private"` \| `"other"` |
| `academic_year` | string | Yes | e.g. `"2024/2025"` |
| `current_term` | string | Yes | `"first"` \| `"second"` \| `"third"` |
| `term_start_date` | string (date) | Yes | e.g. `"2024-09-01"` |
| `term_end_date` | string (date) | No | e.g. `"2024-12-20"` |
| `cac_or_approval_letter` | file | Yes | CAC or approval letter |
| `utility_bill` | file | Yes | Utility bill |
| `tax_cert` | file | Yes | Tax clearance certificate |
| `school_icon` | file | No | School logo/icon |

**Response (201):**

```json
{
  "success": true,
  "message": "School onboarded successfully",
  "data": {
    "id": "string",
    "school_name": "string",
    "school_email": "string",
    "school_address": "string",
    "school_icon": { "url": "string", "key": "string", "uploaded_at": "string" } | null,
    "documents": {
      "cac": "string | null",
      "utility_bill": "string | null",
      "tax_clearance": "string | null"
    },
    "created_at": "string",
    "updated_at": "string"
  },
  "statusCode": 201
}
```

---

### 1.2 Onboard classes

**`POST /api/v1/auth/onboard-classes`**

- **Auth:** Bearer JWT (school director)  
- **Content-Type:** `application/json`

**Request body:**

```ts
{
  class_names: string[];  // e.g. ["JSS 1A", "JSS 1B", "SSS 1A"]
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Classes created successfully",
  "data": [
    {
      "id": "string",
      "name": "string",
      "school_id": "string",
      "class_teacher_id": "string | null",
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "length": 3,
  "statusCode": 201
}
```

---

### 1.3 Onboard teachers

**`POST /api/v1/auth/onboard-teachers`**

- **Auth:** Bearer JWT (school director)  
- **Content-Type:** `application/json`

**Request body:**

```ts
{
  teachers: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  }>;
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Teachers onboarded successfully",
  "data": [
    {
      "id": "string",
      "first_name": "string",
      "last_name": "string",
      "email": "string",
      "phone_number": "string",
      "role": "string",
      "school_id": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "length": 2,
  "statusCode": 201
}
```

---

### 1.4 Onboard students

**`POST /api/v1/auth/onboard-students`**

- **Auth:** Bearer JWT (school director)  
- **Content-Type:** `application/json`

**Request body:**

```ts
{
  students: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    default_class: string;  // e.g. "JSS 1A" — must exist in the school
  }>;
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Students onboarded successfully",
  "data": [
    {
      "id": "string",
      "first_name": "string",
      "last_name": "string",
      "email": "string",
      "phone_number": "string",
      "role": "string",
      "school_id": "string",
      "created_at": "string",
      "updated_at": "string"
    }
  ],
  "length": 2,
  "statusCode": 201
}
```

---

### 1.5 Onboard directors

**`POST /api/v1/auth/onboard-directors`**

- **Auth:** Bearer JWT (school director)  
- **Content-Type:** `application/json`

**Request body:**

```ts
{
  directors: Array<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  }>;
}
```

**Response (201):** Same pattern as teachers — `data` is an array of user-like objects (`id`, `first_name`, `last_name`, `email`, `phone_number`, `role`, `school_id`, `created_at`, `updated_at`).

---

### 1.6 Onboard data (classes + teachers + students in one call)

**`POST /api/v1/auth/onboard-data`**

- **Auth:** Bearer JWT (school director)  
- **Content-Type:** `application/json`

**Request body:**

```ts
{
  class_names?: string[];
  teachers?: Array<{ first_name: string; last_name: string; email: string; phone_number: string }>;
  students?: Array<{ first_name: string; last_name: string; email: string; phone_number: string; default_class: string }>;
}
```

**Response (201):** `data` contains the combined result of created classes, teachers, and students (structure as in the individual onboard endpoints).

---

## 2. Library schools (library owner on behalf of a school)

Used by the **library** side. All endpoints require **Bearer JWT** (library auth token) and **library owner/admin** role.

**Base path:** `POST /api/v1/library/schools`

The school is always identified by the path parameter `:schoolId` (except onboard-school, which creates a new school).

---

### 2.1 Onboard school (library owner)

**`POST /api/v1/library/schools/onboard-school`**

- **Auth:** Bearer JWT (library)  
- **Content-Type:** `multipart/form-data`

**Request:** Same form fields and files as **1.1 Onboard school** (`school_name`, `school_email`, `school_address`, `school_phone`, `school_type`, `school_ownership`, `academic_year`, `current_term`, `term_start_date`, `term_end_date?`, `cac_or_approval_letter`, `utility_bill`, `tax_cert`, `school_icon?`).

**Response (201):** Same as **1.1** — `data` contains the created school (id, school_name, school_email, school_address, school_icon, documents, created_at, updated_at).

---

### 2.2 Onboard classes for a school

**`POST /api/v1/library/schools/:schoolId/onboard-classes`**

- **Auth:** Bearer JWT (library)  
- **Content-Type:** `application/json`

**Path:**

- `schoolId` — ID of the school to add classes to.

**Request body:** Same as **1.2** — `{ class_names: string[] }`.

**Response (201):** Same as **1.2** — `data` is an array of created class objects.

---

### 2.3 Onboard teachers for a school

**`POST /api/v1/library/schools/:schoolId/onboard-teachers`**

- **Auth:** Bearer JWT (library)  
- **Content-Type:** `application/json`

**Path:** `schoolId` — school ID.

**Request body:** Same as **1.3** — `{ teachers: Array<{ first_name, last_name, email, phone_number }> }`.

**Response (201):** Same as **1.3**.

---

### 2.4 Onboard students for a school

**`POST /api/v1/library/schools/:schoolId/onboard-students`**

- **Auth:** Bearer JWT (library)  
- **Content-Type:** `application/json`

**Path:** `schoolId` — school ID.

**Request body:** Same as **1.4** — `{ students: Array<{ first_name, last_name, email, phone_number, default_class }> }`.

**Response (201):** Same as **1.4**.

---

### 2.5 Create subject for a school

**`POST /api/v1/library/schools/:schoolId/create-subject`**

- **Auth:** Bearer JWT (library)  
- **Content-Type:** `application/json`

**Path:** `schoolId` — school ID.

**Request body:**

```ts
{
  subject_name: string;           // required, e.g. "Mathematics"
  code?: string;                 // e.g. "MATH101"
  class_taking_it?: string;      // class ID (optional)
  teacher_taking_it?: string;    // teacher ID (optional)
  color?: string;                // hex, e.g. "#FF5733"
  description?: string;
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Subject <name> created successfully",
  "data": {
    "id": "string",
    "name": "string",
    "code": "string | null",
    "color": "string",
    "description": "string | null",
    "schoolId": "string",
    "classId": "string | null",
    "academic_session_id": "string",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "statusCode": 201
}
```

**Errors:** 404 if school not found; 400 for validation or business rules (e.g. duplicate code).

---

## 3. Library schools — read & approve

**`GET /api/v1/library/schools/getallschools`**  
- **Auth:** Optional (depends on your setup).  
- **Response (200):** `data` contains `statistics`, `schools` (array with breakdowns), `total`.

**`GET /api/v1/library/schools/getschoolbyid/:id`**  
- **Auth:** Optional.  
- **Response (200):** `data` contains `school`, `documentsSubmitted`, `details` (teachers, students, classes, subjects, academicSessions, recentContent).

**`PATCH /api/v1/library/schools/:id/approve`**  
- **Auth:** Bearer JWT (library).  
- **Body:** none.  
- **Response (200):** `data` is the updated school (id, school_name, school_email, status, updatedAt).

---

## 4. Quick reference table

| Endpoint | Auth | Method | Path |
|----------|------|--------|------|
| Onboard school (public) | None | POST | `/api/v1/auth/onboard-school` |
| Onboard classes | School JWT | POST | `/api/v1/auth/onboard-classes` |
| Onboard teachers | School JWT | POST | `/api/v1/auth/onboard-teachers` |
| Onboard students | School JWT | POST | `/api/v1/auth/onboard-students` |
| Onboard directors | School JWT | POST | `/api/v1/auth/onboard-directors` |
| Onboard data (combined) | School JWT | POST | `/api/v1/auth/onboard-data` |
| Onboard school (library) | Library JWT | POST | `/api/v1/library/schools/onboard-school` |
| Onboard classes (library) | Library JWT | POST | `/api/v1/library/schools/:schoolId/onboard-classes` |
| Onboard teachers (library) | Library JWT | POST | `/api/v1/library/schools/:schoolId/onboard-teachers` |
| Onboard students (library) | Library JWT | POST | `/api/v1/library/schools/:schoolId/onboard-students` |
| Create subject (library) | Library JWT | POST | `/api/v1/library/schools/:schoolId/create-subject` |
| Get all schools | — | GET | `/api/v1/library/schools/getallschools` |
| Get school by ID | — | GET | `/api/v1/library/schools/getschoolbyid/:id` |
| Approve school | Library JWT | PATCH | `/api/v1/library/schools/:id/approve` |

---

*Document generated for frontend integration. Backend base path is always `/api/v1`.*
