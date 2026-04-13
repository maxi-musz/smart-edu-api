/**
 * Exit with code 1 if Class has duplicate (schoolId, name) rows.
 * Run before `npx prisma migrate deploy` when migration `20260413040000_school_scoped_class`
 * fails with unique index error on Class_schoolId_name_key.
 *
 *   cd backend && npx ts-node -r tsconfig-paths/register scripts/check-class-duplicates.ts
 *
 * If duplicates exist, run: npm run merge-classes-school-scope
 */
import { createScriptPrismaClient } from './prisma-script-client';

const prisma = createScriptPrismaClient();

async function main() {
  const rows = await prisma.$queryRaw<
    { schoolId: string; name: string; cnt: bigint }[]
  >`
    SELECT "schoolId", name, COUNT(*)::bigint AS cnt
    FROM "Class"
    GROUP BY "schoolId", name
    HAVING COUNT(*) > 1
    ORDER BY "schoolId", name
    LIMIT 20
  `;

  if (rows.length === 0) {
    console.log('OK: No duplicate (schoolId, name) on Class.');
    return;
  }

  console.error(
    `Found ${rows.length} duplicate group(s) (showing up to 20). Example:`,
  );
  for (const r of rows) {
    console.error(`  schoolId=${r.schoolId} name=${JSON.stringify(r.name)} count=${r.cnt}`);
  }
  console.error(
    '\nFix: cd backend && npm run merge-classes-school-scope\nThen: npx prisma migrate deploy',
  );
  process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
