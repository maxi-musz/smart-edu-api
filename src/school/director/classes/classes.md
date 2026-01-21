## Director - Classes APIs

Base path: `/api/v1/director/classes`  
Auth: Bearer token (director)

---

### 1. Fetch All Classes

- **Endpoint**
  - **GET** `/api/v1/director/classes/fetch-all-classes`

- **Request**
  - Headers: `Authorization: Bearer <token>`
  - Body: none

- **Response**
  - `success`: `true | false`
  - `message`: string
  - `data`:
    - `classes`: `Array<{
        id: string;
        name: string;
        classTeacher: {
          id: string;
          first_name: string;
          last_name: string;
          display_picture: Json | null;
        } | null;
      }>`
    - `teachers`: `Array<{
        id: string;
        first_name: string;
        last_name: string;
        display_picture: Json | null;
        email: string;
        phone_number: string;
      }>`

---

### 2. Create Class

- **Endpoint**
  - **POST** `/api/v1/director/classes/create-class`

- **Request**
  - Headers: `Authorization: Bearer <token>`
  - Body (JSON `CreateClassDto`):
    - `name` (string, required) – class name (e.g. "JSS 1A")
    - `classTeacherId` (string, optional) – **User ID** of teacher to assign as class teacher

- **Behavior**
  - Validates class name is unique per school.
  - If `classTeacherId` is provided, verifies teacher belongs to the same school and maps to internal `Teacher` record.
  - Uses current academic session for the school.

- **Response**
  - `success`: `true | false`
  - `message`: string
  - `data` (on success):
    - `id`: string
    - `name`: string
    - `classTeacher`: `{ id, first_name, last_name, display_picture, email, phone_number } | null`
    - `createdAt`: string (ISO)
    - `updatedAt`: string (ISO)

---

### 3. Edit Class

- **Endpoint**
  - **PATCH** `/api/v1/director/classes/edit-class/:classId`

- **Request**
  - Headers: `Authorization: Bearer <token>`
  - Params:
    - `classId` (string, required)
  - Body (JSON `EditClassDto` – all optional):
    - `name` (string) – new class name
    - `classTeacherId` (string) – **User ID** of teacher to assign as class teacher

- **Behavior**
  - Ensures class belongs to the director’s school.
  - If `name` provided, checks uniqueness within school.
  - If `classTeacherId` provided, validates teacher belongs to school and maps to `Teacher` record.

- **Response**
  - `success`: `true | false`
  - `message`: string
  - `data` (on success):
    - `id`: string
    - `name`: string
    - `classTeacher`: `{ id, first_name, last_name, display_picture, email, phone_number } | null`
    - `createdAt`: string (ISO)
    - `updatedAt`: string (ISO)


