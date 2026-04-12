/**
 * Runs before any e2e test file loads. Ensures Prisma uses the intended DB.
 *
 * - Loads `.env` then `.env.test` (if present; later keys override).
 * - If `DATABASE_URL_TEST` is set, it becomes `DATABASE_URL` for the test process.
 *
 * Use the same URL as dev if you already use a disposable/test Neon DB there.
 * For isolation, create a separate database or branch and set `DATABASE_URL_TEST`.
 */
import * as path from 'path';
import { config } from 'dotenv';

const root = path.join(__dirname, '..');

config({ path: path.join(root, '.env') });
config({ path: path.join(root, '.env.test') });

if (process.env.DATABASE_URL_TEST?.trim()) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST.trim();
}
