/**
 * Prisma 7 scripts must use a driver adapter (same as Nest PrismaService).
 * Loads backend/.env so DATABASE_URL is set when running via npm run.
 */
import { config } from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

config({ path: path.resolve(__dirname, '../.env'), override: true });

export function createScriptPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add it to backend/.env or export DATABASE_URL before running this script.',
    );
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}
