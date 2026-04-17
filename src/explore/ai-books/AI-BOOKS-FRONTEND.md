# Explore AI Books — Frontend Contract

**Base URL:** `/api/v1/explore/ai-books`  
**Authentication:** Required on every endpoint (`Authorization: Bearer <JWT>`). Uses the same **universal JWT** guard as other Explore routes (school app users, etc.).

### Explore vs Library general-materials (important)

- **Use only** `/api/v1/explore/ai-books/...` for the AI Books experience for any role that logs in with the **same token as the rest of Explore**.
- **Do not** call `GET /api/v1/library/general-materials/:id` (or other `/library/*` CRUD routes) for this flow: those endpoints are wired to the **Library JWT strategy** (library owner / resource tooling). A normal Explore token will produce **401** and log errors like `Library JWT Strategy - Invalid payload structure`.
- If the app needs **book detail**, use **`GET /api/v1/explore/ai-books/:bookId`** below — not the library module.

---

## Shared response envelope

All successful responses use the standard `ApiResponse` shape:

```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  /** Optional; may appear on some legacy endpoints — not set by AI Books */
  total?: string;
}
```

**HTTP status codes**

| Status | Meaning |
|--------|---------|
| `200` | Success; body is `{ success, message, data }`. |
| `401` | Missing or invalid JWT. |
| `404` | Book or chapter not found / not visible to the user (see per-endpoint notes). |

NestJS error bodies for `401` / `404` follow the usual JSON format (`statusCode`, `message`, etc.), not necessarily `ApiResponse`.

---

## TypeScript types (reference)

```typescript
// --- Landing page ---

interface AiBooksPlatformInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface AiBooksClassRef {
  id: string;
  name: string;
  order: number;
}

interface AiBooksLandingBook {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  /** Raw object key in storage (same as DB). */
  thumbnailS3Key: string | null;
  /** Public URL for `<img src>` — derived via `S3Service.getFileUrl(thumbnailS3Key)`. */
  thumbnailUrl: string | null;
  views: number;
  downloads: number;
  createdAt: string; // ISO 8601
  classes: AiBooksClassRef[];
}

interface AiBooksClassWithCount extends AiBooksClassRef {
  totalBooks: number;
}

interface AiBooksPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AiBooksLandingPageData {
  platform: AiBooksPlatformInfo | null;
  books: AiBooksLandingBook[];
  classes: AiBooksClassWithCount[];
  pagination: AiBooksPagination;
}

// --- Chapters ---

interface AiBookChapterFile {
  id: string;
  fileName: string;
  fileType: string | null;
  /** Read URL: for S3-backed files this is a **presigned GET** minted on each API response (default TTL 1 hour). */
  url: string | null;
  /** When `url` is presigned, ISO time when it expires; omit or null for non-S3 or legacy rows. */
  urlExpiresAt?: string | null;
  sizeBytes: number | null;
  title: string | null;
  description: string | null;
  order: number;
  createdAt: string; // ISO 8601
}

interface AiBookChapter {
  id: string;
  title: string;
  description: string | null;
  pageStart: number | null;
  pageEnd: number | null;
  order: number;
  isAiEnabled: boolean;
  isProcessed: boolean;
  chunkCount: number | null;
  createdAt: string;
  updatedAt: string;
  files: AiBookChapterFile[];
}
```

### Chapter file URLs (private buckets)

Uploads store a stable S3 key plus a public-style `getFileUrl` in the database. Anonymous HTTP GET to that URL **fails** when the bucket is private. The Explore and Library APIs therefore return a **fresh presigned read URL** in `files[].url` whenever `s3Key` is present. Clients should refetch chapter detail after ~1 hour or on focus if the PDF stops loading (React Query `useAIBookChapter` refetches on window focus for this reason).

The Next.js route `GET /api/ai-book-pdf` (same-origin proxy for PDF.js) validates that upstream bytes look like a PDF and returns **502 + JSON** if not, so users see a clear error instead of a generic PDF parse failure.

---

## 1. Landing page (list books + filters + sidebar data)

**Endpoint:** `GET /api/v1/explore/ai-books/landing-page`

**Headers**

- `Authorization: Bearer <token>`

**Query parameters** (all optional)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number (≥ 1) | `1` | Page index for book list. |
| `limit` | number (≥ 1) | `10` | Page size for book list. |
| `search` | string | — | Case-insensitive match on **title**, **author**, or **description**. |
| `classId` | string | — | Filter books linked to this library class ID. |
| `classIds` | string[] | — | Filter books linked to **any** of these class IDs (OR within the filter). |

**Passing `classIds` in the query string**

Use repeated keys (typical for NestJS + `class-validator` arrays):

```http
GET /api/v1/explore/ai-books/landing-page?classIds=id1&classIds=id2&page=1&limit=10
```

If your client serializes arrays differently, confirm with a quick request; the server expects multiple `classIds` values or whatever your HTTP layer maps to `string[]`.

**Success `data` shape:** `AiBooksLandingPageData`

**Example (200)**

```json
{
  "success": true,
  "message": "AI book landing page data fetched successfully",
  "data": {
    "platform": {
      "id": "pl_abc123",
      "name": "Default Library",
      "slug": "default",
      "description": "Primary content platform"
    },
    "books": [
      {
        "id": "mat_001",
        "title": "Senior Secondary Mathematics",
        "description": "Algebra and geometry",
        "author": "J. Doe",
        "thumbnailS3Key": "library/thumbs/math.png",
        "thumbnailUrl": "https://your-bucket.s3.amazonaws.com/library/thumbs/math.png",
        "views": 1200,
        "downloads": 80,
        "createdAt": "2025-11-01T10:00:00.000Z",
        "classes": [
          { "id": "cls_ss1", "name": "SS 1", "order": 1 },
          { "id": "cls_ss2", "name": "SS 2", "order": 2 }
        ]
      }
    ],
    "classes": [
      {
        "id": "cls_ss1",
        "name": "SS 1",
        "order": 1,
        "totalBooks": 42
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 95,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Behaviour notes for the UI**

- Only **published**, **AI-enabled**, **available** library materials are listed as books.
- If the authenticated user has a **library resource user** profile with a `platformId`, results are restricted to that platform; otherwise books across platforms (that still satisfy the flags above) can appear.
- `platform` is the **earliest-created** `libraryPlatform` (by `createdAt`). It is metadata for the page, not necessarily the only platform for every book in the list when the user is not scoped to a platform.
- `classes` in `data` is **all library classes** with **`totalBooks`** counting materials that match the same base filters (AI + published + available [+ platform when applicable]), not only the current `search` / class filter. Use it for filter chips or sidebar counts.
- Book list ordering is **not guaranteed** to be stable unless you add sorting on the backend later; plan UI accordingly.
- Prefer **`thumbnailUrl`** for UI images; the backend builds it from `thumbnailS3Key` using the same S3 URL rules as other uploads (`AWS_S3_ENDPOINT`, bucket, region). If the bucket is **private**, this URL may still require a presigned flow for actual download — align with how the rest of the app serves library thumbnails.

---

## 2. Book detail (by id)

**Endpoint:** `GET /api/v1/explore/ai-books/:bookId`

Use this for a **detail / header** screen when you already have the material id from the landing list. Same auth and visibility rules as the landing page.

**Path parameters**

| Param | Description |
|-------|-------------|
| `bookId` | `libraryGeneralMaterial.id` |

**Headers:** `Authorization: Bearer <token>`

**Success `data` shape:** `AiBooksLandingBook` (one book object: ids, text fields, `thumbnailS3Key`, `thumbnailUrl`, `views`, `downloads`, `createdAt`, `classes`).

**404** — Same as landing list: not published, not AI-enabled, not available, or outside the user’s library platform when scoped.

---

## 3. Chapters for a book

**Endpoint:** `GET /api/v1/explore/ai-books/:bookId/chapters`

**Path parameters**

| Param | Description |
|-------|-------------|
| `bookId` | Library general material ID (`libraryGeneralMaterial.id`). |

**Headers:** `Authorization: Bearer <token>`

**Success `data` shape:** `AiBookChapter[]` (ordered by `order` ascending).

**Example (200)**

```json
{
  "success": true,
  "message": "Book chapters retrieved successfully",
  "data": [
    {
      "id": "ch_1",
      "title": "Chapter 1: Sets",
      "description": null,
      "pageStart": 1,
      "pageEnd": 24,
      "order": 1,
      "isAiEnabled": true,
      "isProcessed": true,
      "chunkCount": 48,
      "createdAt": "2025-11-02T08:00:00.000Z",
      "updatedAt": "2025-11-10T12:00:00.000Z",
      "files": [
        {
          "id": "f_1",
          "fileName": "chapter1.pdf",
          "fileType": "application/pdf",
          "url": "https://...",
          "sizeBytes": 1048576,
          "title": "Lecture notes",
          "description": null,
          "order": 1,
          "createdAt": "2025-11-02T08:05:00.000Z"
        }
      ]
    }
  ]
}
```

**404** — Book not found, not published, not AI-enabled, not available, or not visible for the user’s library platform (same scoping rules as landing page).

**Chapter visibility:** Only chapters with `isProcessed: true` and `chapterStatus: 'active'` are returned.

---

## 4. Single chapter

**Endpoint:** `GET /api/v1/explore/ai-books/:bookId/chapters/:chapterId`

**Path parameters**

| Param | Description |
|-------|-------------|
| `bookId` | Same as in section 3. |
| `chapterId` | `libraryGeneralMaterialChapter.id` for that material. |

**Headers:** `Authorization: Bearer <token>`

**Success `data` shape:** `AiBookChapter` (single object).

**404** — Missing book (same rules as §3), or chapter not found / wrong `bookId` / wrong platform scope.

---

## Route ordering (for client developers)

- `landing-page` is a static path and is not treated as a `bookId`.
- Paths with more segments (`:bookId/chapters`, `:bookId/chapters/:chapterId`) take precedence over **`GET :bookId`** on the server; use **`/explore/ai-books/{id}/chapters`** for the chapter list, not `/explore/ai-books/{id}` alone, when you want chapters.

---

## Quick copy-paste: fetch examples

Replace `API_BASE` (e.g. `https://your-api.com/api/v1`) and `TOKEN`.

```typescript
const headers = { Authorization: `Bearer ${TOKEN}` };

// Landing page
await fetch(
  `${API_BASE}/explore/ai-books/landing-page?page=1&limit=10&search=algebra`,
  { headers },
);

// Book detail (Explore — not /library/general-materials)
await fetch(`${API_BASE}/explore/ai-books/${bookId}`, { headers });

// Chapters
await fetch(`${API_BASE}/explore/ai-books/${bookId}/chapters`, { headers });

// One chapter
await fetch(
  `${API_BASE}/explore/ai-books/${bookId}/chapters/${chapterId}`,
  { headers },
);
```

---

## Swagger

These routes are tagged **`Explore - AI Books`** in the Nest Swagger UI (if enabled in your environment), alongside the same path and bearer-auth metadata.
