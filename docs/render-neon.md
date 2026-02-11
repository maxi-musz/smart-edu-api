# Deploying to Render with Neon Postgres

Neon’s own docs (Connection pooling tooltip) say:

> Use a **direct connection** for `pg_dump`, session-dependent features, **or schema migrations**.

So migrations must use the **direct** URL. You can either use one URL (direct everywhere) or two (pooler for app, direct for migrate).

## Option A: One URL (simplest)

Use Neon’s **direct** connection string as your only `DATABASE_URL` on Render. Works for both `prisma migrate deploy` and the app. Direct connection limit is 839, which is fine for a single Nest app.

## Option B: Two URLs (pooler for app, direct for migrate)

- **DATABASE_URL** = pooler (for the app at runtime).
- **DIRECT_DATABASE_URL** = direct (only for running `prisma migrate deploy`).  
Requires a small script that runs migrate with `DIRECT_DATABASE_URL` when set.

## Why pooler breaks migrations

- **Pooler** (PgBouncer): Prisma’s migration engine needs session state and transactional behavior that doesn’t work through the pooler → “migration persistence is not initialized”.
- **Direct**: Full PostgreSQL session; migrations run correctly.

So we use the **direct** URL as the single `DATABASE_URL` for both `prisma migrate deploy` and the app. No second URL needed.

## What to set on Render

| Variable       | Value |
|----------------|--------|
| `DATABASE_URL` | Neon **direct** connection string (host like `ep-xxx.c-3.us-east-1.aws.neon.tech`, **no** `-pooler`) |

## Where to get it in Neon

1. [Neon Console](https://console.neon.tech) → your project.
2. Open **Connection details**.
3. Choose **“Direct connection”** (not “Pooled connection”).
4. Copy that URL and set it as `DATABASE_URL` on Render.

Example direct URL:

`postgresql://user:pass@ep-young-haze-ahv6r9pt.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require`

Pooler URL has `-pooler` in the host; don’t use that as your only URL if you run migrations on deploy.

## Why staging might have worked with one URL

If staging works with a single URL, that URL is likely already the **direct** one (e.g. from an older or different Neon connection string). Production was probably using the **pooler** URL, which triggers the migration error. Using the direct URL for production as well keeps behavior the same and fixes the issue with one variable.
