# Library classes (curriculum) – Frontend API reference

Use this document to integrate **library class CRUD**: curriculum tiers such as “JSS 1”, “SS 2 Science” that **`LibrarySubject`** rows attach to via `classId`. This is **not** the same as a school’s onboarded class (`library/schools/.../onboard-classes`).

**Base URL:** `api/v1/library/library-classes`

**Auth:** Library JWT (Bearer). Only **`admin`** and **`manager`** roles may call these endpoints (`LibraryOwnerGuard`).

```http
Authorization: Bearer <library_jwt_token>
```

**Response wrapper:** Successful responses use the shared shape:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

`DELETE` success returns `"data": null` when removal completes.

**Errors:** Failed requests typically return Nest’s JSON error body, for example:

```json
{
  "statusCode": 400,
  "message": "A class with this name already exists",
  "error": "Bad Request"
}
```

Validation errors may list constraints per field.

---

## Access

| Who | Can use these endpoints |
|-----|-------------------------|
| Library `admin` or `manager` | Yes |
| Other library roles (e.g. `content_creator`, `viewer`) | No (`403 Forbidden`) |

---

## Data model (what you get back)

### `LibraryClass` (list / create / update)

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | CUID |
| `name` | string | Unique among all library classes |
| `order` | number | Sort order (ascending in list); new classes get `max(order) + 1` |
| `createdAt` | string (ISO) | |
| `updatedAt` | string (ISO) | |

### `GET :id` (detail)

Same fields as above, plus:

| Field | Type | Notes |
|-------|------|--------|
| `subjects` | `LibrarySubject[]` | All subjects that reference this class (`classId` = this id). Full Prisma rows; can be large—use list + separate subject APIs if you only need counts. |

Each `LibrarySubject` includes platform scoping (`platformId`, `name`, `code`, etc.). Only subjects for **your** platform may be relevant in the UI; filter client-side by `platformId` if needed.

---

## 1. Create class

**POST** `api/v1/library/library-classes`

**Body (JSON):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name; must be unique globally |

**Example**

```json
{
  "name": "JSS 1"
}
```

**Status codes**

| Code | Meaning |
|------|---------|
| `201` | Created |
| `400` | Duplicate `name` |
| `401` | Missing/invalid token |
| `403` | Not admin/manager |

**Response (`201`)**

```json
{
  "success": true,
  "message": "Library class created successfully",
  "data": {
    "id": "clx...",
    "name": "JSS 1",
    "order": 5,
    "createdAt": "2025-03-20T12:00:00.000Z",
    "updatedAt": "2025-03-20T12:00:00.000Z"
  }
}
```

---

## 2. List classes

**GET** `api/v1/library/library-classes`

No query parameters. Results are ordered by `order` ascending.

**Status codes:** `200`, `401`, `403`

**Response (`200`)**

```json
{
  "success": true,
  "message": "Library classes retrieved successfully",
  "data": [
    {
      "id": "clx...",
      "name": "JSS 1",
      "order": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**UI tip:** Use this list for dropdowns when creating/editing **library subjects** that require a `classId`.

---

## 3. Get one class

**GET** `api/v1/library/library-classes/:id`

**Path**

| Param | Description |
|-------|-------------|
| `id` | Library class CUID |

**Status codes**

| Code | Meaning |
|------|---------|
| `200` | OK |
| `404` | Unknown id |
| `401` | Unauthorized |
| `403` | Forbidden |

**Response (`200`)** — `data` includes `subjects`:

```json
{
  "success": true,
  "message": "Library class retrieved successfully",
  "data": {
    "id": "clx...",
    "name": "JSS 1",
    "order": 1,
    "createdAt": "...",
    "updatedAt": "...",
    "subjects": [
      {
        "id": "clx...",
        "platformId": "clx...",
        "classId": "clx...",
        "name": "Mathematics",
        "code": "MTH101",
        "color": "#3B82F6",
        "description": null,
        "thumbnailUrl": null,
        "thumbnailKey": null,
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

## 4. Update class

**PATCH** `api/v1/library/library-classes/:id`

**Body (JSON):** all fields optional; send only what changes.

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | New name (must remain unique) |
| `order` | number (integer ≥ 1) | Manual ordering |

**Example**

```json
{
  "name": "JSS 1 (Science)",
  "order": 2
}
```

**Status codes**

| Code | Meaning |
|------|---------|
| `200` | Updated |
| `400` | Duplicate `name` |
| `404` | Unknown id |
| `401` | Unauthorized |
| `403` | Forbidden |

**Response (`200`)** — `data` is the updated `LibraryClass` (no `subjects` include on update).

---

## 5. Delete class

**DELETE** `api/v1/library/library-classes/:id`

Deletion is **blocked** if any **`LibrarySubject`** still has `classId` set to this class. Users must reassign subjects or remove them first.

**Status codes**

| Code | Meaning |
|------|---------|
| `200` | Deleted |
| `400` | One or more subjects still reference this class |
| `404` | Unknown id |
| `401` | Unauthorized |
| `403` | Forbidden |

**Response (`200`)**

```json
{
  "success": true,
  "message": "Library class deleted successfully",
  "data": null
}
```

**Example `400` message**

```json
{
  "statusCode": 400,
  "message": "Cannot delete this class: 3 subject(s) are still assigned to it. Reassign or remove those subjects first.",
  "error": "Bad Request"
}
```

---

## Frontend integration checklist

1. **Auth:** Obtain a library JWT from your existing library login flow; attach `Authorization: Bearer …` on every request.
2. **Role:** Confirm the logged-in user is `admin` or `manager`; others receive `403`.
3. **Subject flows:** When creating or editing a library subject that needs a class, load **List classes** and pass the chosen `id` as `classId` in the subject API (see subject module docs).
4. **Delete:** Before deleting, either hide the delete action when `subjects.length > 0` on the detail endpoint, or call detail first and show the server error if subjects remain.
5. **Naming:** Enforce unique names in the UI (optional) to reduce `400` on create/update; server is the source of truth.

---

## Related

- **Developer-only** alternative (no library-owner auth): `api/v1/developer/librarydev/classes` — prefer **`library/library-classes`** for production library owner tools.
- **School classes** (per school, not `LibraryClass`): `POST api/v1/library/schools/:schoolId/onboard-classes`.
