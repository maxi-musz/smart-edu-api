ALTER TABLE "School" RENAME COLUMN "login_code" TO "school_code";

ALTER INDEX "School_login_code_key" RENAME TO "School_school_code_key";
