# 🔧 Fix Migration Error - pgvector Extension

## **The Problem**

```
ERROR: type "vector" does not exist
```

Your schema uses `Unsupported("vector")` for AI embeddings, but PostgreSQL doesn't have the `vector` type by default. It needs the **pgvector extension**.

---

## **Solution: Enable pgvector in Neon Database**

### **Option 1: Using Neon Console (Easiest)** ⭐

1. **Go to Neon Console**: https://console.neon.tech
2. **Select your project**: Find your database
3. **Go to SQL Editor**
4. **Run this command**:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

5. **Verify it worked**:

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

You should see a row returned.

6. **Now retry your migration**:

```bash
npx prisma migrate dev --name added_watch_histories
```

---

### **Option 2: Using psql CLI**

```bash
# Connect to your Neon database
psql "postgresql://neondb_owner:npg_1MYDixJntz5Z@ep-young-feather-ahlw0ln7-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

# Exit
\q

# Retry migration
npx prisma migrate dev --name added_watch_histories
```

---

### **Option 3: Add Extension to First Migration**

If pgvector is already enabled in your main database but not in the shadow database, add this to your earliest migration:

1. **Find your first migration file**:
```
prisma/migrations/20260114150824_initial_migration/migration.sql
```

2. **Add this as the FIRST line**:
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- (rest of your migration SQL...)
```

3. **Reset and retry**:
```bash
npx prisma migrate reset --force
npx prisma migrate dev --name added_watch_histories
```

---

## **Alternative: Skip Shadow Database (Quick Fix)**

If you just want to apply migrations without validation:

```bash
# For development (risky but works)
npx prisma db push

# Or for production migrations
npx prisma migrate deploy
```

**⚠️ Warning**: This skips safety checks. Use only if you're confident about your schema.

---

## **What is pgvector?**

`pgvector` is a PostgreSQL extension that adds support for vector similarity search. Your schema uses it for:

- `DocumentChunk.embedding` (line 1152)
- `LibraryGeneralMaterialChunk.embedding` (line 3019)

These are used for AI-powered semantic search and chat features.

---

## **Verification Steps**

After enabling the extension, verify:

```sql
-- Check extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Test vector type
CREATE TABLE test_vector (id serial, embedding vector(3));
DROP TABLE test_vector;
```

If no errors, you're good to go! ✅

---

## **Recommended Flow**

```bash
# Step 1: Enable pgvector in Neon (use Option 1 above)

# Step 2: Retry migration
cd /Users/macbook/Desktop/B-Tech/projects/backend/smart-edu-backend
npx prisma migrate dev --name added_watch_histories

# Step 3: Verify Prisma Client updated
npm run build
```

---

## **Expected Success Output**

```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "neondb"...

Applying migration `20260119XXXXXX_added_watch_histories`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20260119XXXXXX_added_watch_histories/
    └─ migration.sql

Your database is now in sync with your schema.
✔ Generated Prisma Client
```

---

## **Still Having Issues?**

### **Error: "extension does not exist"**
→ Neon might not support pgvector on your plan. Check with Neon support or upgrade plan.

### **Error: "permission denied"**
→ Your database user needs superuser privileges to create extensions:
```sql
ALTER USER neondb_owner WITH SUPERUSER;
```

### **Error: "shadow database timeout"**
→ Use `--skip-generate` flag:
```bash
npx prisma migrate dev --skip-generate --name added_watch_histories
```

---

## **Quick Fix (If Nothing Works)**

Comment out vector fields temporarily:

```prisma
// In schema.prisma, comment these lines:
// embedding      Unsupported("vector")

// Add them back later after enabling pgvector
```

Then run migration and uncomment.

---

**Status**: Ready to fix! Start with **Option 1** (Neon Console) - easiest and safest. ✅

