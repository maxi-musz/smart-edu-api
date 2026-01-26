# Production Migration Guide - Exam Body Assessment Platform ID

## Data Safety ✅

**Your data is 100% safe!** This migration is **non-destructive**:

- ✅ Only **adds** new columns (doesn't modify existing data)
- ✅ Uses `IF NOT EXISTS` checks (won't fail if already applied)
- ✅ Makes `maxAttempts` nullable (no data loss, existing values preserved)
- ✅ Creates indexes/constraints safely (checks before creating)
- ✅ **NO data deletion or modification**

## Production Migration Steps

### Step 1: Resolve Failed Migration (if needed)

If the migration failed previously, mark it as rolled back:

```bash
DATABASE_URL="postgresql://neondb_owner:npg_vQzxad3VX5wf@ep-young-haze-ahv6r9pt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma migrate resolve --rolled-back 20260125140000_add_exam_body_assessment_platform_id
```

### Step 2: Deploy Migration to Production

```bash
DATABASE_URL="postgresql://neondb_owner:npg_vQzxad3VX5wf@ep-young-haze-ahv6r9pt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma migrate deploy
```

### Step 3: Generate Prisma Client

```bash
DATABASE_URL="postgresql://neondb_owner:npg_vQzxad3VX5wf@ep-young-haze-ahv6r9pt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma generate
```

## What the Migration Does

The migration file (`20260125140000_add_exam_body_assessment_platform_id/migration.sql`) safely:

1. **Drops old unique constraint** (if exists)
   ```sql
   DROP INDEX IF EXISTS "ExamBodyAssessment_examBodyId_subjectId_yearId_key";
   ```

2. **Adds `platformId` column** (if not exists)
   ```sql
   ALTER TABLE "ExamBodyAssessment" ADD COLUMN IF NOT EXISTS "platformId" TEXT;
   ```

3. **Makes `maxAttempts` nullable** (preserves existing values)
   ```sql
   ALTER TABLE "ExamBodyAssessment" ALTER COLUMN "maxAttempts" DROP NOT NULL;
   ```

4. **Creates indexes** (if not exists)
   ```sql
   CREATE INDEX IF NOT EXISTS "ExamBodyAssessment_platformId_idx" ...
   CREATE UNIQUE INDEX IF NOT EXISTS "ExamBodyAssessment_platformId_examBodyId_subjectId_yearId_key" ...
   ```

5. **Adds foreign key constraint** (only if doesn't exist - safe!)
   ```sql
   DO $$
   BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExamBodyAssessment_platformId_fkey') THEN
           ALTER TABLE "ExamBodyAssessment" ADD CONSTRAINT ...
       END IF;
   END $$;
   ```

## Verification

After migration, verify the changes:

```bash
# Connect to production DB and check
DATABASE_URL="postgresql://neondb_owner:npg_vQzxad3VX5wf@ep-young-haze-ahv6r9pt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" npx prisma migrate status
```

## Rollback Safety

**Even if you need to rollback:**
- The migration only **adds** things (columns, indexes, constraints)
- Rolling back would **remove** what was added
- **Your existing data remains untouched**
- No risk of data loss

## Quick Production Deploy Script

You can create a script for easier deployment:

```bash
#!/bin/bash
# deploy-to-production.sh

PROD_DB_URL="postgresql://neondb_owner:npg_vQzxad3VX5wf@ep-young-haze-ahv6r9pt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

echo "🔄 Resolving failed migration (if any)..."
DATABASE_URL="$PROD_DB_URL" npx prisma migrate resolve --rolled-back 20260125140000_add_exam_body_assessment_platform_id || echo "No failed migration to resolve"

echo "📦 Deploying migration to production..."
DATABASE_URL="$PROD_DB_URL" npx prisma migrate deploy

echo "🔧 Generating Prisma Client..."
DATABASE_URL="$PROD_DB_URL" npx prisma generate

echo "✅ Production migration complete!"
```
