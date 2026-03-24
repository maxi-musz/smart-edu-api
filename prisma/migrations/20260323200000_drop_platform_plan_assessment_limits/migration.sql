-- Revert optional assessment limit columns (no longer on PlatformSubscriptionPlan).
ALTER TABLE "PlatformSubscriptionPlan" DROP COLUMN IF EXISTS "max_concurrent_published_assessments";
ALTER TABLE "PlatformSubscriptionPlan" DROP COLUMN IF EXISTS "max_assessments_created_per_school_day";
ALTER TABLE "PlatformSubscriptionPlan" DROP COLUMN IF EXISTS "max_assessment_questions_added_per_school_day";
ALTER TABLE "PlatformSubscriptionPlan" DROP COLUMN IF EXISTS "max_questions_per_assessment";
