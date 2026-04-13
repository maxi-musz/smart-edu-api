import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Student-facing finance routes pass JWT `sub` (User.id). DB rows such as
 * `StudentFeeRecord.student_id` reference `Student.id`. Directors may still pass
 * `Student.id` from admin UIs — accept both.
 */
export async function resolveFinanceStudentRowId(
  prisma: PrismaService,
  schoolId: string,
  studentIdOrUserId: string,
): Promise<string | null> {
  const row = await prisma.student.findFirst({
    where: {
      school_id: schoolId,
      OR: [{ id: studentIdOrUserId }, { user_id: studentIdOrUserId }],
    },
    select: { id: true },
  });
  return row?.id ?? null;
}

/** Wallet `owner_id` and related payment rows use **User.id**. */
export async function resolveFinanceStudentUserId(
  prisma: PrismaService,
  schoolId: string,
  studentIdOrUserId: string,
): Promise<string | null> {
  const row = await prisma.student.findFirst({
    where: {
      school_id: schoolId,
      OR: [{ id: studentIdOrUserId }, { user_id: studentIdOrUserId }],
    },
    select: { user_id: true },
  });
  return row?.user_id ?? null;
}
