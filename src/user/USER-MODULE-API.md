# User module – REST API (frontend guide)

Base path: **`/api/v1/user`**

All routes require **school JWT** authentication: send `Authorization: Bearer <access_token>`.

The access token is issued by the school auth flow and must include at least **`sub`** (user id), **`email`**, and **`school_id`** (validated by the JWT strategy).

---

## Unified profile

### `GET /api/v1/user/profile`

Single endpoint for **every** school role. The backend reads **`User.role`** from the database (do not rely on the client guessing role only from the token).

#### Success response shape

HTTP **200**. Body uses the standard envelope:

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "role": "student",
    "user": { },
    "school": { },
    "roleDetails": { }
  }
}
```

| Field | Description |
|--------|-------------|
| `data.role` | Prisma role enum, e.g. `student`, `teacher`, `school_director`, `school_admin`, `parent`, `ict_staff`, `super_admin`. |
| `data.user` | Core account fields (see below). |
| `data.school` | School summary (includes **`subscription_plan`**), or `null` if missing. |
| `data.roleDetails` | **Role-specific** object; always includes `kind` where documented below. |

#### `data.user` (all roles)

| Field | Type | Notes |
|--------|------|--------|
| `id` | string | Same as JWT `sub`. |
| `email` | string | |
| `first_name` | string | |
| `last_name` | string | |
| `phone_number` | string | |
| `display_picture` | object \| null | JSON; may include `url`, `key`, etc. |
| `gender` | string | |
| `status` | string | e.g. `active` |
| `school_id` | string | |
| `createdAt` | string (ISO) | |
| `updatedAt` | string (ISO) | |

#### `data.school` (when present)

| Field | Type |
|--------|------|
| `id` | string |
| `school_name` | string |
| `school_email` | string |
| `school_phone` | string |
| `school_address` | string |
| `school_type` | string |
| `school_ownership` | string |
| `status` | string |
| `school_icon` | object \| null |
| `subscription_plan` | object \| null | Full school **PlatformSubscriptionPlan** for feature flags and limits (see below). |

#### `data.school.subscription_plan` (feature gating)

Returned for **every role** when `data.school` is non-null. **`null`** means there is no subscription row linked to the school yet (treat as “no plan configured”; backend elsewhere may fall back to user-level defaults).

Use this object to enable or disable UI and to show caps (teachers, students, storage, assessments, chat, etc.).

| Field | Type | Notes |
|--------|------|--------|
| `id` | string | Plan row id. |
| `school_id` | string \| null | Should match the school. |
| `name` | string | Display name, e.g. `Free`. |
| `plan_type` | string | `FREE`, `BASIC`, `PREMIUM`, `ENTERPRISE`, `CUSTOM`. |
| `description` | string \| null | |
| `cost` | number | Monthly-style price when applicable. |
| `yearly_cost` | number \| null | Annual price if set. |
| `currency` | string | Default `USD`. |
| `billing_cycle` | string | `MONTHLY`, `QUARTERLY`, `YEARLY`, `ONE_TIME`. |
| `is_active` | boolean | |
| `max_allowed_teachers` | number | |
| `max_allowed_students` | number | |
| `max_allowed_classes` | number \| null | |
| `max_allowed_subjects` | number \| null | |
| `allowed_document_types` | string[] | e.g. `["pdf"]`. |
| `max_file_size_mb` | number | |
| `max_document_uploads_per_student_per_day` | number | |
| `max_document_uploads_per_teacher_per_day` | number | |
| `max_storage_mb` | number | |
| `max_files_per_month` | number | |
| `max_daily_tokens_per_user` | number | |
| `max_weekly_tokens_per_user` | number \| null | |
| `max_monthly_tokens_per_user` | number \| null | |
| `max_total_tokens_per_school` | number \| null | |
| `max_messages_per_week` | number | |
| `max_conversations_per_user` | number \| null | |
| `max_chat_sessions_per_user` | number \| null | |
| `max_concurrent_published_assessments` | number \| null | |
| `max_assessments_created_per_school_day` | number \| null | |
| `max_assessment_questions_added_per_school_day` | number \| null | |
| `max_questions_per_assessment` | number \| null | |
| `features` | object \| null | Arbitrary JSON feature map for product-specific toggles. |
| `start_date` | string (ISO) \| null | |
| `end_date` | string (ISO) \| null | |
| `status` | string | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `EXPIRED`, `CANCELLED`, `TRIAL`. |
| `auto_renew` | boolean | |
| `created_at` | string (ISO) | |
| `updated_at` | string (ISO) | |
| `is_template` | boolean | Catalog/template row flag. |

---

### `data.roleDetails` by role

Branch on **`data.role`** and/or **`data.roleDetails.kind`**.

#### Student — `kind: "student"`

| Section | Contents |
|---------|----------|
| `student` | `id`, `student_id`, `admission_number`, dates, guardian fields, `address` object, `academic_level`, `status`. |
| `current_class` | `id`, `name`, `class_teacher` (`id`, `name`, `display_picture`) or `null`. |
| `current_session` | Academic session for the school (`id`, `academic_year`, `term`, dates, `is_current`) or `null`. |
| `academics.subjects_enrolled` | Array of `{ id, name, code, color, teacher_name }`. |
| `academics.performance_summary` | `average_score`, `total_assessments`, `passed_assessments`, `failed_assessments`, `students_in_class`. |

Assessment stats are scoped to the **current academic session** when one exists.

#### Teacher — `kind: "teacher"`

| Section | Contents |
|---------|----------|
| `teacher` | `id`, `teacher_id`, `employee_number`, `department`, `qualification`, `specialization`, `years_of_experience`, `is_class_teacher`, `hire_date`, `status`, `display_picture`. |
| `subjects` | Array of `{ id, name, code, class_id }`. |
| `classes_as_form_teacher` | Array of `{ id, name, academic_session_id }`. |
| `current_session` | Same pattern as student, or `null`. |

#### Parent — `kind: "parent"`

| Section | Contents |
|---------|----------|
| `parent` | `id`, `parent_id`, `occupation`, `employer`, `address`, `emergency_contact`, `relationship`, `is_primary_contact`, `status`. |
| `children` | Array of `{ student_table_id, student_id, admission_number, name, email, status, current_class }`. |

#### Staff (director, admin, ICT, super_admin) — `kind: "staff"`

Roles: `school_director`, `school_admin`, `ict_staff`, `super_admin`.

| Field | Description |
|--------|-------------|
| `staff_role` | Same as `data.role`. |
| `school_overview.student_count` | Number of students in the school. |
| `school_overview.teacher_count` | Number of teachers. |
| `school_overview.class_count` | Number of classes. |
| `current_session` | Current academic session summary or `null`. |

#### Other roles — `kind: "generic"`

No extended payload; use `data.user` and `data.school` only.

---

### Error responses — `GET /profile`

HTTP **200** with `success: false` (API envelope pattern):

```json
{
  "success": false,
  "message": "User not found",
  "data": null
}
```

Examples:

- User does not exist.
- Role is `student` but no `Student` row is linked.
- Role is `teacher` but no `Teacher` row is linked.
- Role is `parent` but no `Parent` row is linked.

On unknown server errors, `message` may be `Failed to fetch profile`.

---

## Profile picture upload

### `POST /api/v1/user/picture`

**Content-Type:** `multipart/form-data`  
**Field name:** `picture` (file)

Constraints:

- Types: **JPEG, PNG, GIF, WEBP**
- Max size: **5 MB**

#### Success response

HTTP **200**. Shape from `ResponseHelper.success`:

```json
{
  "success": true,
  "message": "Profile picture updated successfully",
  "data": {
    "display_picture": {
      "url": "string",
      "key": "string",
      "bucket": "string (optional)",
      "etag": "string (optional)",
      "uploaded_at": "ISO-8601 string"
    },
    "url": "string"
  },
  "statusCode": 200
}
```

For **teachers**, the same picture is also written to the `Teacher` row when linked.

#### Errors

- **400** — missing file, invalid type, size limit, upload or DB failure (Nest `BadRequestException`).
- **401** — missing or invalid JWT.
- **404** — user not found (`NotFoundException`).

---

## Frontend integration tips

1. **One call for profile UI** — `GET /user/profile`, then switch on `data.role` or `data.roleDetails.kind`.
2. **Display name** — `data.user.first_name` + `data.user.last_name`; avatar from `data.user.display_picture` (and for teachers also check `data.roleDetails.teacher.display_picture` when `kind === "teacher"`).
3. **Do not assume** the JWT includes `role`; always use **`data.role`** from this endpoint for UI routing (student app vs teacher app, etc.).
4. **Plan-driven UI** — read **`data.school.subscription_plan`** (when present) for limits and `features`; combine with `plan_type` / `status` / `end_date` for paywall or read-only modes.

---

## Swagger

Operations are tagged **User Profile** in `api/docs` with the same paths and auth scheme **JWT-auth**.
