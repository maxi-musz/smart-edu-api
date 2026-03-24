# Smart Edu Platform Pricing — Frontend API Reference

**Base path:** `/pricing`  
**Server global prefix:** `/api/v1` (full paths: **`/api/v1/pricing/...`**)  
**Authentication:** **None** — endpoints are **public** (marketing, signup, pricing pages). No `Authorization` header required.

**Swagger tag:** `Smart Edu - Pricing` (see `/api/docs`)

**Audience:** Frontend teams building **public pricing pages**, **plan comparison tables**, and **pre-checkout** copy. This API returns **catalog templates** only (what Smart Edu Hub offers). It does **not** return the **current school’s subscribed plan**; that lives on authenticated director/profile flows.

**Product scope:** One subscription tier describes **entitlements across the whole platform**, including **school operations** (teachers, students, classes, documents, storage), **assessments** (optional caps on published assessments, creation rate, and question counts—see [Assessment entitlements](#assessment-entitlements)), and **library / AI usage** (token limits, chat limits, etc.). Token and chat fields apply wherever the backend enforces them (including library chapter AI chat). The `features` object is an **opaque admin-defined map** for toggles and future keys—treat keys as strings and values as `boolean | number | string` until product defines a stable contract.

---

## IMPORTANT: Response shape (this module)

Unlike many school endpoints that wrap payloads in `{ success, message, data }`, **pricing returns the DTO directly** as the JSON body:

```json
{
  "plans": [ /* ... */ ],
  "catalog_updated_at": "2025-03-23T12:00:00.000Z"
}
```

- **`catalog_updated_at`**: Omitted when `plans` is empty.
- On unhandled errors, expect Nest’s default **JSON error** shape (`statusCode`, `message`, etc.) — not the `ResponseHelper` wrapper.

---

## Table of contents

1. [Get pricing structure](#1-get-pricing-structure) — includes [Assessment entitlements](#assessment-entitlements)
2. [TypeScript types (reference)](#2-typescript-types-reference)
3. [Field reference (UI copy hints)](#3-field-reference-ui-copy-hints)
4. [Enums](#4-enums)
5. [Empty catalog & caching](#5-empty-catalog--caching)
6. [Logged-in school: current plan vs catalog](#6-logged-in-school-current-plan-vs-catalog)
7. [Error handling](#7-error-handling)
8. [Admin: create / update plan templates](#8-admin-create--update-plan-templates)

---

## 1. Get pricing structure

Returns all **active subscription plan templates** configured by platform admins (`PlatformSubscriptionPlan` rows with `school_id: null`, `is_template: true`, `is_active: true`).

**Ordering:** `cost` ascending, then `name` ascending.

### Endpoints (equivalent)

| Method | Path |
|--------|------|
| `GET` | `/api/v1/pricing/structure` |
| `GET` | `/api/v1/pricing/get-pricing-structure` |

Use either URL; behavior is identical.

### Request

- **Headers:** none required.
- **Query / body:** none.

### Success response — `200 OK`

```json
{
  "plans": [
    {
      "id": "clxxxxxxxxxxxxxxxxxxxx",
      "name": "Professional",
      "plan_type": "PREMIUM",
      "description": "Full feature set for growing schools.",
      "cost": 100000,
      "yearly_cost": 1000000,
      "currency": "NGN",
      "billing_cycle": "MONTHLY",
      "is_active": true,
      "max_allowed_teachers": 50,
      "max_allowed_students": 500,
      "max_allowed_classes": 40,
      "max_allowed_subjects": 60,
      "allowed_document_types": ["pdf", "docx"],
      "max_file_size_mb": 25,
      "max_document_uploads_per_student_per_day": 5,
      "max_document_uploads_per_teacher_per_day": 20,
      "max_storage_mb": 5000,
      "max_files_per_month": 100,
      "max_daily_tokens_per_user": 100000,
      "max_weekly_tokens_per_user": 500000,
      "max_monthly_tokens_per_user": 2000000,
      "max_total_tokens_per_school": 10000000,
      "max_messages_per_week": 200,
      "max_conversations_per_user": 10,
      "max_chat_sessions_per_user": 5,
      "max_concurrent_published_assessments": 15,
      "max_assessments_created_per_school_day": 20,
      "max_assessment_questions_added_per_school_day": 500,
      "max_questions_per_assessment": 100,
      "features": {
        "ai_chat": true,
        "basic_analytics": true,
        "library_hls": true
      }
    }
  ],
  "catalog_updated_at": "2025-03-23T12:00:00.000Z"
}
```

### Plan object: nullable fields

These may be **`null`** (meaning “no explicit cap” or “unlimited” depending on product; confirm with backend product rules):

- `description`
- `max_allowed_classes`
- `max_allowed_subjects`
- `max_weekly_tokens_per_user`
- `max_monthly_tokens_per_user`
- `max_total_tokens_per_school`
- `max_conversations_per_user`
- `max_chat_sessions_per_user`
- `max_concurrent_published_assessments`
- `max_assessments_created_per_school_day`
- `max_assessment_questions_added_per_school_day`
- `max_questions_per_assessment`
- `features` (may be `null` if unset)
- `yearly_cost` — `null` when this tier has **no** annual price (monthly-only).

**Pricing semantics (single catalog row, Cursor-style):**

- **`cost`** — price **per month** when the school chooses **monthly** billing.
- **`yearly_cost`** — **total** charged **once per year** when they choose **yearly** (e.g. less than 12×`cost`). Checkout picks which amount to charge; the school’s own `PlatformSubscriptionPlan` row should store their active `billing_cycle` (`MONTHLY` or `YEARLY`) and the amount that matches that choice.
- **`billing_cycle`** on a **template** is a default / legacy display hint; the important split for buyers is `cost` vs `yearly_cost`.

All other scalar fields on each plan are **always present** in the API response (with numeric/string defaults as stored in DB), except `yearly_cost` may be JSON `null`.

### Assessment entitlements

Four optional numeric fields describe **assessment-related limits** for a tier (same row as teachers/students/tokens). They are **catalog / entitlement metadata** for pricing pages and director “your plan” UIs.

| JSON field | Meaning |
|------------|---------|
| `max_concurrent_published_assessments` | Maximum number of assessments a school may have with **`is_published: true`** at the same time. |
| `max_assessments_created_per_school_day` | Maximum **new** assessment records the school may create per **UTC calendar day**. |
| `max_assessment_questions_added_per_school_day` | Maximum **new** assessment questions the school may add per **UTC day**, summed across all assessments. |
| `max_questions_per_assessment` | Maximum questions allowed on **one** assessment. |

**`null` on any of the four** means **no cap** in the contract (market as “Unlimited” or “—” per product copy). Values are **positive integers** when set (≥ 1). Day boundaries use **UTC**, not the school’s local timezone.

**Enforcement:** Backend may enforce these in assessment APIs in a future release; until then, treat them as **declared entitlements** for marketing and comparison tables. Coordinate with backend before promising hard blocking behavior in UI.

---

## 2. TypeScript types (reference)

Use these as a starting point; adjust `features` when product standardizes keys.

```ts
export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';

export type SubscriptionPlanType =
  | 'FREE'
  | 'BASIC'
  | 'PREMIUM'
  | 'ENTERPRISE'
  | 'CUSTOM';

export interface PricingPlanCatalogItem {
  id: string;
  name: string;
  plan_type: SubscriptionPlanType | string;
  description: string | null;
  /** Monthly price */
  cost: number;
  /** Annual total if yearly billing is offered; null = monthly only */
  yearly_cost: number | null;
  currency: string;
  billing_cycle: BillingCycle | string;
  is_active: boolean;
  max_allowed_teachers: number;
  max_allowed_students: number;
  max_allowed_classes: number | null;
  max_allowed_subjects: number | null;
  allowed_document_types: string[];
  max_file_size_mb: number;
  max_document_uploads_per_student_per_day: number;
  max_document_uploads_per_teacher_per_day: number;
  max_storage_mb: number;
  max_files_per_month: number;
  max_daily_tokens_per_user: number;
  max_weekly_tokens_per_user: number | null;
  max_monthly_tokens_per_user: number | null;
  max_total_tokens_per_school: number | null;
  max_messages_per_week: number;
  max_conversations_per_user: number | null;
  max_chat_sessions_per_user: number | null;
  /** Max assessments with is_published=true at once; null = unlimited */
  max_concurrent_published_assessments: number | null;
  /** Max new assessments per school per UTC day; null = unlimited */
  max_assessments_created_per_school_day: number | null;
  /** Max new assessment questions per school per UTC day; null = unlimited */
  max_assessment_questions_added_per_school_day: number | null;
  /** Max questions on one assessment; null = unlimited */
  max_questions_per_assessment: number | null;
  /** Admin-defined feature flags / metadata; keys not guaranteed across environments */
  features: Record<string, unknown> | null;
}

export interface PricingStructureResponse {
  plans: PricingPlanCatalogItem[];
  /** ISO 8601; omitted when plans.length === 0 */
  catalog_updated_at?: string;
}
```

### Example fetch

```ts
async function fetchPricingStructure(): Promise<PricingStructureResponse> {
  const res = await fetch(`${API_BASE}/api/v1/pricing/structure`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Pricing API failed: ${res.status}`);
  }
  return res.json();
}
```

---

## 3. Field reference (UI copy hints)

| Field | Typical UI meaning |
|-------|-------------------|
| `name` | Display name of the tier (e.g. “Starter”, “Professional”). |
| `plan_type` | Internal tier code; useful for badges or analytics. |
| `description` | Marketing blurb from admin. |
| `cost` | **Monthly** price in `currency` units (per month). |
| `yearly_cost` | **Annual** total if you sell a yearly option on the same tier; `null` = no yearly SKU. |
| `currency` | ISO-like code (`NGN`, `USD`, …). |
| `billing_cycle` | Template default / hint; the school’s active subscription row should reflect what they actually bought (`MONTHLY` vs `YEARLY`). |
| `max_allowed_teachers` / `max_allowed_students` | Core school size limits. |
| `max_allowed_classes` / `max_allowed_subjects` | Optional caps; `null` = show as “—” or “Custom”. |
| `allowed_document_types` | Allowed upload extensions for school-side documents. |
| `max_file_size_mb` | Per-file size limit. |
| `max_document_uploads_*_per_day` | Daily upload quotas. |
| `max_storage_mb` | Aggregate storage cap for the school. |
| `max_files_per_month` | Monthly file quota. |
| `max_daily_tokens_per_user` | AI / library token budget **per user per day** (platform-defined semantics). |
| `max_weekly_tokens_per_user` / `max_monthly_tokens_per_user` | Optional wider windows. |
| `max_total_tokens_per_school` | Optional **school-wide** AI token pool. |
| `max_messages_per_week` | Chat / messaging cap (e.g. AI chat messages). |
| `max_conversations_per_user` / `max_chat_sessions_per_user` | Optional chat session limits. |
| `max_concurrent_published_assessments` | Cap on simultaneously **published** assessments (`is_published: true`); `null` = unlimited. |
| `max_assessments_created_per_school_day` | Daily cap on **new** assessments per school (**UTC** day); `null` = unlimited. |
| `max_assessment_questions_added_per_school_day` | Daily cap on **new** questions added across all assessments (**UTC** day); `null` = unlimited. |
| `max_questions_per_assessment` | Cap on total questions on a **single** assessment; `null` = unlimited. |
| `features` | Booleans or metadata for “includes library AI”, “priority support”, etc.—**coordinate with admin** on key names. |

**Formatting tips**

- **Money:** Use `Intl.NumberFormat` with `currency` for `cost` (watch for zero-decimal currencies like NGN).  
- **`null` limits:** Prefer “Unlimited” or “Included” only if product confirms; otherwise “—” or “Contact sales”.  
- **Storage:** `max_storage_mb` can be shown as GB (`value / 1024`) for readability.

---

## 4. Enums

Values match Prisma / backend enums (UPPERCASE strings in JSON).

### `plan_type`

- `FREE`
- `BASIC`
- `PREMIUM`
- `ENTERPRISE`
- `CUSTOM`

### `billing_cycle`

- `MONTHLY`
- `QUARTERLY`
- `YEARLY`
- `ONE_TIME`

---

## 5. Empty catalog & caching

- If **no** active templates exist, the API returns **`{ "plans": [] }`** with **no** `catalog_updated_at`.
- **Caching:** Use `catalog_updated_at` as a weak ETag or cache-bust key for static generation / SWR. Example: `fetch` with `If-None-Match` is **not** implemented server-side today—use client-side invalidation when this timestamp changes between loads.

---

## 6. Logged-in school: current plan vs catalog

| Concern | API |
|--------|-----|
| **Public catalog** (this doc) | `GET /api/v1/pricing/structure` |
| **This school’s active subscription row** | Director (or school) **profile** endpoints that include `subscription_plan` — same shape conceptually but tied to `school_id`, not templates. |

For **upgrade flows**, the director profile flow may also return **other template plans** as “available upgrades”; that logic is **separate** from this public endpoint. Use **this** endpoint for **anonymous** pricing pages; use **profile** when you need “current plan + suggested upgrades” in one authenticated call.

---

## 7. Error handling

| HTTP | When |
|------|------|
| **200** | Success (including empty `plans`). |
| **500** | Server / database errors (generic Nest exception body). |

There is **no** `401` for this route by design (public). If you later add optional auth for A/B pricing, the contract would change—check release notes.

---

## 8. Admin: create / update plan templates

**Swagger tag:** `Smart Edu - Pricing (Admin)`

**Authentication:** `Authorization: Bearer <token>` using the same **`JWT_SECRET`** as the rest of the app. The guard accepts **either**:

1. **School session** — JWT payload includes **`school_id`** (school auth). User **`User.role`** must be **`super_admin`**.
2. **Library session** — JWT payload includes **`platform_id`** (library auth). User **`LibraryResourceUser.role`** must be **`admin`** (platform owner). Library tokens do **not** include `school_id`, so the school-only `JwtGuard` would reject them with “invalid payload structure”; this admin API uses a combined guard instead.

Use the **library** bearer token from the library app when managing catalog as a library platform admin; use the **school** token for Smart Edu staff with `super_admin`.

**Response body:** Same shape as each item in `plans` from the public catalog ([`PricingPlanCatalogItemDto`](#2-typescript-types-reference)) — returned **directly** (not wrapped in `{ success, data }`).

### 8.1 Create template

| | |
|--|--|
| **Method / path** | `POST /api/v1/pricing/admin/plan-templates` |
| **Success** | **201** + single plan object |

**Body:** JSON matching **`CreatePlanTemplateDto`**. Only **`name`** is required. Any omitted field uses the **Prisma / DB default** for new rows (same defaults as schema, e.g. FREE tier-ish limits if untouched).

**Example (minimal)**

```json
{
  "name": "Professional",
  "plan_type": "PREMIUM",
  "cost": 50000,
  "currency": "NGN",
  "billing_cycle": "MONTHLY",
  "max_daily_tokens_per_user": 200000,
  "max_concurrent_published_assessments": 20,
  "max_assessments_created_per_school_day": 30,
  "max_assessment_questions_added_per_school_day": 800,
  "max_questions_per_assessment": 120,
  "features": { "library_hls": true, "ai_chat": true }
}
```

### 8.2 Update template

| | |
|--|--|
| **Method / path** | `PATCH /api/v1/pricing/admin/plan-templates/:id` |
| **`:id`** | Template row `id` (`PlatformSubscriptionPlan.id`) |
| **Success** | **200** + updated plan object |

**Body:** JSON matching **`UpdatePlanTemplateDto`** — all fields optional; send only what should change. **Empty object** → **400** (`No fields to update`).

**Rules**

- Only rows with **`school_id: null`** and **`is_template: true`** can be updated; otherwise **404**.
- **`school_id`** and **`is_template`** cannot be changed via this API (always catalog templates).

### 8.3 Admin error summary

| HTTP | When |
|------|------|
| **400** | Validation failure; or PATCH with no fields |
| **401** | Missing / invalid JWT |
| **403** | Authenticated but not allowed (not school `super_admin` or not library `admin`) |
| **404** | PATCH: id not found or not a template |

---

## Out of scope (explicit)

- **Student → school owner** fees (`Finance`, `Payment`, school wallet) — not part of this API.  
- **Checkout / Paystack / Stripe** — not implemented on these routes; future payment flows will be documented separately.  
- **Per-title library retail** (`LibraryGeneralMaterial.price`) — separate product surface; subscription entitlements here are **plan-wide** unless mirrored in `features`.

---

## Changelog (maintainers)

- Document initial public `GET` pricing structure (`structure` + `get-pricing-structure` aliases).
- Admin `POST` / `PATCH` plan templates under `pricing/admin/plan-templates` (`super_admin` + JWT).
- Assessment entitlement fields on catalog items: `max_concurrent_published_assessments`, `max_assessments_created_per_school_day`, `max_assessment_questions_added_per_school_day`, `max_questions_per_assessment` (`null` = unlimited; UTC day semantics documented above).
