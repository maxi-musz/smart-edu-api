# Login (API)

## School users (director, teacher, student, …)

- **Endpoint:** `POST {BACKEND_URL}/api/v1/auth/sign-in`
- **Body (JSON):**
  - `email` (string, required): Either a normal **email** or a **student/teacher business ID** (same field name as before).
  - `password` (string, required)
  - `school_id` (string, optional): **Required** when `email` is **not** an email — use your school’s id (same `school_id` as on the user record / from your admin).
  - `deviceToken` / `deviceType` (optional): unchanged if you use push registration on login.

**Success (200):** `success: true`, `data.access_token`, `data.refresh_token`, `data.user` with `id`, `email`, `first_name`, `last_name`, `phone_number`, `is_email_verified`, `role`, `school_id`, `created_at`, `updated_at`.

**Typical failures:** `success: false`, `message` / `statusCode` (e.g. wrong password, school not approved, missing `school_id` for ID login).

---

## Library owners

- Check **“I’m a library Owner”** on the web login screen (or call the library endpoint directly).
- **Endpoint:** `POST {BACKEND_URL}/api/v1/library/auth/sign-in`
- **Body:** `email`, `password` only (no `school_id`).

**Success (200):** `success: true`, `data.access_token`, `data.refresh_token`, `data.user` (library user fields, including `userType` / platform fields as returned by the API).

---

## Web app (NextAuth)

- School flow sends `email` + `password` + optional `school_id` (via `buildSchoolSignInBody` in `web/lib/build-school-sign-in-body.ts`).
- Library flow sends only `email` + `password` to the library endpoint.

---

## Running automated tests (login)

**Backend (Nest e2e, uses a real Postgres):**

```bash
cd backend && npm run test:auth:e2e
```

- **Default:** Jest loads `backend/.env` (via `test/jest-e2e-setup.ts`). Whatever `DATABASE_URL` points to is used — fine if that is already a disposable/test Neon DB.
- **Optional isolation:** Set `DATABASE_URL_TEST` (in `.env` or `backend/.env.test`) to a dedicated database URL. When set, it overrides `DATABASE_URL` for the test process only. See `backend/.env.test.example`.
- Apply migrations to that database once (`npx prisma migrate dev` against that URL).

Login e2e creates a **temporary** `School` + `User` and deletes them after the suite (success-path tests assert real JWTs).

**Frontend (unit tests for login request body helper):**

```bash
cd web && npm install && npm test
```
