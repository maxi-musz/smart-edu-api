-- Six-digit school login code (nullable until backfill script runs)
ALTER TABLE "School" ADD COLUMN "login_code" TEXT;

CREATE UNIQUE INDEX "School_login_code_key" ON "School"("login_code");
