import { ForbiddenException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const STAFF_FINANCE_ROLES = new Set([
  'school_director',
  'school_admin',
  'super_admin',
]);

/**
 * Student may access their own finance routes; school staff may access for their school.
 * `studentIdOrUserId` may be **User.id** or **Student.id** (same convention as student fee routes).
 */
export async function assertStudentFinanceAccess(
  prisma: PrismaService,
  user: User,
  schoolId: string,
  studentIdOrUserId: string,
): Promise<void> {
  if (user.id === studentIdOrUserId) return;

  const ownStudent = await prisma.student.findFirst({
    where: {
      school_id: schoolId,
      user_id: user.id,
      OR: [{ id: studentIdOrUserId }, { user_id: studentIdOrUserId }],
    },
    select: { id: true },
  });
  if (ownStudent) return;

  if (user.school_id !== schoolId) {
    throw new ForbiddenException('Access denied');
  }
  if (!STAFF_FINANCE_ROLES.has(user.role)) {
    throw new ForbiddenException('Access denied');
  }
}
