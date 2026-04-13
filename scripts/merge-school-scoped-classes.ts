/**
 * Merges duplicate Class rows that share the same school + logical name (or one Graduates row
 * per school) before applying migration `20260413040000_school_scoped_class`.
 *
 * Run from backend/:  npm run merge-classes-school-scope
 *
 * Backs up nothing — take a database snapshot first in production.
 */
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function normKey(name: string, isGraduates: boolean): string {
  if (isGraduates) return '__graduates__';
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

async function repointClassId(
  tx: Prisma.TransactionClient,
  fromId: string,
  toId: string,
): Promise<void> {
  if (fromId === toId) return;

  await tx.$executeRawUnsafe(
    `DELETE FROM "FeeClassAssignment" AS f USING "FeeClassAssignment" AS g
     WHERE f."class_id" = $1 AND g."class_id" = $2 AND f."fee_id" = g."fee_id"`,
    fromId,
    toId,
  );

  await tx.$executeRawUnsafe(
    `DELETE FROM "TimetableEntry" AS te1 USING "TimetableEntry" AS te2
     WHERE te1."class_id" = $1 AND te2."class_id" = $2
       AND te1."academic_session_id" = te2."academic_session_id"
       AND te1."timeSlotId" = te2."timeSlotId"
       AND te1."day_of_week" = te2."day_of_week"`,
    fromId,
    toId,
  );

  const tables: { table: string; col: string }[] = [
    { table: 'Student', col: 'current_class_id' },
    { table: 'Subject', col: '"classId"' },
    { table: 'TimetableEntry', col: 'class_id' },
    { table: 'Payment', col: 'class_id' },
    { table: 'StudentFeeRecord', col: 'class_id' },
    { table: 'Result', col: 'class_id' },
    { table: 'AttendanceSession', col: 'class_id' },
    { table: 'AttendanceRecord', col: 'class_id' },
    { table: 'AttendanceSummary', col: 'class_id' },
    { table: 'StudentPerformance', col: 'class_id' },
    { table: 'SchoolResourceAccess', col: '"classId"' },
    { table: 'TeacherResourceAccess', col: '"classId"' },
    { table: 'TeacherResourceExclusion', col: '"classId"' },
    { table: 'FeeClassAssignment', col: 'class_id' },
  ];

  for (const { table, col } of tables) {
    await tx.$executeRawUnsafe(
      `UPDATE "${table}" SET ${col} = $1 WHERE ${col} = $2`,
      toId,
      fromId,
    );
  }

  // Optional FK on graduation audit — not always a FK in schema
  await tx.$executeRawUnsafe(
    `UPDATE "StudentGraduation" SET "from_class_id" = $1 WHERE "from_class_id" = $2`,
    toId,
    fromId,
  );
}

async function main() {
  const all = await prisma.class.findMany({ orderBy: { createdAt: 'asc' } });
  const groups = new Map<string, typeof all>();
  for (const c of all) {
    const key = `${c.schoolId}|${normKey(c.name, c.is_graduates)}`;
    const arr = groups.get(key) ?? [];
    arr.push(c);
    groups.set(key, arr);
  }

  const merges: { fromId: string; toId: string }[] = [];
  for (const [, rows] of groups) {
    if (rows.length <= 1) continue;
    const canonical = rows[0];
    for (let i = 1; i < rows.length; i++) {
      merges.push({ fromId: rows[i].id, toId: canonical.id });
    }
  }

  if (merges.length === 0) {
    console.log('No duplicate Class rows to merge.');
    return;
  }

  console.log(`Merging ${merges.length} duplicate class row(s)...`);

  await prisma.$transaction(async (tx) => {
    for (const m of merges) {
      await repointClassId(tx, m.fromId, m.toId);
      await tx.class.delete({ where: { id: m.fromId } });
    }
  });

  console.log('Done. You can run: npx prisma migrate deploy');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
