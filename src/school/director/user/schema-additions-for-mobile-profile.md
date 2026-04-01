# Mobile profile and school user profile — schema and API notes

This file covers (1) historical / optional **Prisma schema** ideas for the **mobile student profile** payload, and (2) the **implemented** **`GET user/profile`** response for **school JWT** users (directors, teachers, etc.) — including session, school branding, and optional linked library context.

---

## 1. GET `user/profile` (school JWT) — implemented

**Route:** `GET /api/v1/user/profile` (see [`user.controller.ts`](user.controller.ts))  
**Auth:** School `JwtGuard` — `User` is always tied to a `School` (`school_id` required on `User`).

No new migrations were required for this enhancement. It uses existing models:

| Need | Source |
|------|--------|
| Current session / term | `AcademicSession` via `AcademicSessionService.getCurrentSession(school_id)` (`is_current`, `status: active`) |
| School name, contact, type | `School` |
| School logo / icon | `School.school_icon` (`Json?`, typically `{ url, key, ... }` from onboarding upload) |
| User avatar | `User.display_picture` (`Json?`) |
| Library name (optional) | `LibraryResourceUser` + `LibraryPlatform` when **same email** as school user and `status: active` |

**Note:** `LibraryPlatform` has no logo URL in the schema today. The API returns `organization.library_platform_logo_url: null` as a reserved field until a column (e.g. `logoUrl`) exists.

### 1.1 Response shape (`data` object)

Fields below are what [`UserService.getUserProfile`](user.service.ts) returns inside the standard success wrapper (`success`, `message`, `data`, etc.).

**Identity & user**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User id |
| `email` | string | |
| `first_name`, `last_name` | string | |
| `phone_number` | string | |
| `role` | string | Prisma `Roles` |
| `status` | string | |
| `is_email_verified` | boolean | |
| `school_id` | string | |
| `display_picture` | JSON / null | User avatar payload |
| `gender` | string | |
| `created_at`, `updated_at` | string | Formatted via `formatDate()` |

**Current academic session**

| Field | Type | Description |
|-------|------|-------------|
| `current_academic_session_id` | string / null | Id of current active session |
| `current_academic_session` | string / null | Academic year label, e.g. `2024/2025` |
| `current_term` | string / null | e.g. `first`, `second`, `third` |
| `current_session` | object / null | Full snapshot when a current session exists |

When `current_session` is non-null:

```json
{
  "id": "string",
  "academic_year": "string",
  "term": "first",
  "start_year": 2024,
  "end_year": 2025,
  "start_date": "ISO-8601",
  "end_date": "ISO-8601",
  "status": "active",
  "is_current": true
}
```

**Organization (convenience for mobile / web headers)**

| Field | Type | Description |
|-------|------|-------------|
| `organization.school_name` | string / null | From `School.school_name` |
| `organization.school_logo_url` | string / null | Resolved from `school_icon.url` or `school_icon.secure_url` |
| `organization.school_icon` | JSON / null | Raw `School.school_icon` |
| `organization.library_platform_name` | string / null | `LibraryPlatform.name` if linked |
| `organization.library_platform_slug` | string / null | |
| `organization.library_platform_logo_url` | null | Reserved — no DB field yet |
| `organization.has_linked_library_account` | boolean | True if an active `LibraryResourceUser` shares this email |

**Linked library account (optional)**

| Field | Type | Description |
|-------|------|-------------|
| `linked_library_account` | object / null | Present when email matches an active library user |

When non-null:

```json
{
  "library_user_id": "string",
  "role": "LibraryUserRole",
  "platform": {
    "id": "string",
    "name": "string",
    "slug": "string",
    "description": "string | null",
    "status": "string"
  }
}
```

**School (nested)**

Same as before, plus branding:

| Field | Type |
|-------|------|
| `school.id`, `name`, `email`, `phone`, `address`, `type`, `ownership`, `status` | as before |
| `school.school_icon` | JSON / null |
| `school.logo_url` | string / null | Same resolution as `organization.school_logo_url` |

### 1.2 Linking rules (school user ↔ library)

- Lookup: `LibraryResourceUser` where `email` equals the school `User.email` and `status === 'active'`.
- If emails differ between school registration and library registration, there will be **no** `linked_library_account` — link accounts explicitly in product/ops if needed.

### 1.3 Future schema (optional)

To support a library logo on profile headers without hardcoding null:

- Add optional `logoUrl` (or `logo_url`) to `LibraryPlatform` in `schema.prisma`, migrate, then set `organization.library_platform_logo_url` in `getUserProfile` from that field.

---

## 2. Mobile student profile — schema reference (historical)

The sections below describe **additional** tables and fields that were considered or implemented over time to enrich **`GET user/mobile-student-profile`** and related DTOs. Confirm against the live [`schema.prisma`](../../../../prisma/schema.prisma) before treating any snippet as authoritative.

### Current status (student mobile)

What the student mobile profile pipeline can rely on when the schema includes the corresponding models:

- General student information — `User`, `Student`, `School`, etc.
- Academic information — subjects/teachers, attempts, performance, attendance, class, sessions (as modeled in Prisma).
- User settings — `UserSettings` (if present).
- Achievements — `Achievement` / `StudentAchievement` (if present).
- Support — `SupportInfo` (if present).

### 2.1 User Settings Table

```prisma
model UserSettings {
  id                    String   @id @default(cuid())
  user_id               String   @unique
  school_id             String

  push_notifications    Boolean  @default(true)
  email_notifications   Boolean  @default(true)
  assessment_reminders  Boolean  @default(true)
  grade_notifications   Boolean  @default(true)
  announcement_notifications Boolean @default(false)

  dark_mode             Boolean  @default(false)
  sound_effects         Boolean  @default(true)
  haptic_feedback       Boolean  @default(true)
  auto_save             Boolean  @default(true)
  offline_mode          Boolean  @default(false)

  profile_visibility    String   @default("classmates")
  show_contact_info     Boolean  @default(true)
  show_academic_progress Boolean @default(true)
  data_sharing          Boolean  @default(false)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  school                School   @relation(fields: [school_id], references: [id])

  @@index([user_id])
  @@index([school_id])
}
```

### 2.2 Achievements System

```prisma
model Achievement {
  id                    String   @id @default(cuid())
  school_id             String
  academic_session_id   String

  title                 String
  description           String
  type                  AchievementType
  icon_url              String?
  points                Int      @default(0)
  is_active             Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  school                School   @relation(fields: [school_id], references: [id])
  academicSession       AcademicSession @relation(fields: [academic_session_id], references: [id])
  studentAchievements   StudentAchievement[]

  @@index([school_id])
  @@index([academic_session_id])
  @@index([type])
}

model StudentAchievement {
  id                    String   @id @default(cuid())
  student_id            String
  achievement_id        String
  earned_date           DateTime @default(now())
  points_earned         Int
  is_visible            Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  student               User     @relation("StudentAchievements", fields: [student_id], references: [id], onDelete: Cascade)
  achievement           Achievement @relation(fields: [achievement_id], references: [id])

  @@unique([student_id, achievement_id])
  @@index([student_id])
  @@index([achievement_id])
}

enum AchievementType {
  ACADEMIC
  ATTENDANCE
  SPORTS
  EXTRACURRICULAR
  BEHAVIOR
  LEADERSHIP
  OTHER
}
```

### 2.3 Subject credits (optional enhancement)

```prisma
// Example additions to Subject — verify against live schema
model Subject {
  // ... existing fields ...
  credits               Int?     @default(3)
  is_core_subject       Boolean  @default(false)
  passing_grade         Float?   @default(50.0)
  max_grade             Float?   @default(100.0)
}
```

### 2.4 Academic session extras (optional)

The **`user/profile`** endpoint uses the **existing** `AcademicSession` fields (`academic_year`, `term`, `start_year`, `end_year`, `start_date`, `end_date`, `status`, `is_current`).  
Optional JSON fields below are **ideas** only — not required for `getUserProfile`:

```prisma
model AcademicSession {
  // ... existing fields ...
  // Optional future fields:
  // term_start_dates      Json?
  // term_end_dates        Json?
  // holidays              Json?
  // exam_periods          Json?
}
```

### 2.5 Support Information Table

```prisma
model SupportInfo {
  id                    String   @id @default(cuid())
  school_id             String

  faq_count             Int      @default(0)
  last_faq_update       DateTime?
  faq_categories        Json     @default("[]")

  email_support         String
  phone_support         String
  live_chat_available   Boolean  @default(false)
  response_time         String   @default("24 hours")

  app_version           String
  build_number          String
  last_updated          DateTime
  minimum_ios_version   String
  minimum_android_version String

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  school                School   @relation(fields: [school_id], references: [id])

  @@unique([school_id])
}
```

---

## 3. Migration / priority notes (student mobile)

1. **UserSettings** — high impact for preferences in the app.  
2. **SupportInfo** — support surfaces in app.  
3. **Achievements** — engagement layer.  
4. **Subject / AcademicSession extras** — only if product needs finer-grained metadata.

---

## 4. What the core schema already provides

- **Academic:** `AcademicSession`, `Subject`, `TeacherSubject`, `Teacher`, assessments, attendance, `StudentPerformance`, etc.  
- **Student profile:** `Student`, `User`, `Parent`, `School`.  
- **School branding:** `School.school_icon` (used by `getUserProfile`).  
- **Library linkage (profile):** `LibraryResourceUser` + `LibraryPlatform` by email (see section 1).

---

## 5. Student mobile endpoint behavior (summary)

Until every optional table is wired end-to-end, `GET user/mobile-student-profile` may still use **defaults** for settings, empty achievement lists, or placeholder support blocks — replace those with real queries as `UserSettings`, `Achievement` / `StudentAchievement`, and `SupportInfo` are fully integrated in [`user.service.ts`](user.service.ts).

For **directors/staff** branding and session context, prefer **`GET user/profile`** (section 1).
