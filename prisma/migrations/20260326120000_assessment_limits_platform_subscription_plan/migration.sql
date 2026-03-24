-- Optional assessment entitlements on catalog / school plan rows (null = unlimited).
ALTER TABLE "PlatformSubscriptionPlan" ADD COLUMN IF NOT EXISTS "max_concurrent_published_assessments" INTEGER;
ALTER TABLE "PlatformSubscriptionPlan" ADD COLUMN IF NOT EXISTS "max_assessments_created_per_school_day" INTEGER;
ALTER TABLE "PlatformSubscriptionPlan" ADD COLUMN IF NOT EXISTS "max_assessment_questions_added_per_school_day" INTEGER;
ALTER TABLE "PlatformSubscriptionPlan" ADD COLUMN IF NOT EXISTS "max_questions_per_assessment" INTEGER;
