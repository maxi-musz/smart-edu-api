/**
 * Backfill `School.school_code` with unique random 6-digit codes for rows missing one.
 *
 * Usage (from backend/):
 *   npx ts-node -r tsconfig-paths/register scripts/generate-school-login-codes.ts
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { allocateUniqueSchoolCode } from '../src/school/auth/school-code.util';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error('DATABASE_URL is not set (check backend/.env)');
  }

  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const schools = await prisma.school.findMany({
      where: {
        OR: [{ school_code: null }, { school_code: '' }],
      },
      select: { id: true, school_name: true },
    });

    console.log(`Schools needing school_code: ${schools.length}`);

    for (const s of schools) {
      const code = await allocateUniqueSchoolCode(prisma);
      await prisma.school.update({
        where: { id: s.id },
        data: { school_code: code },
      });
      console.log(`${s.school_name} (${s.id}) -> ${code}`);
    }

    console.log('Done.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
