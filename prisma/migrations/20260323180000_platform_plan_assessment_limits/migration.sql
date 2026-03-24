-- AlterTable
ALTER TABLE "PlatformSubscriptionPlan" ADD COLUMN     "max_concurrent_published_assessments" INTEGER,
ADD COLUMN     "max_assessments_created_per_school_day" INTEGER,
ADD COLUMN     "max_assessment_questions_added_per_school_day" INTEGER,
ADD COLUMN     "max_questions_per_assessment" INTEGER;
