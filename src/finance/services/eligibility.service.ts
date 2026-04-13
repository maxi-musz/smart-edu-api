import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ResponseHelper } from 'src/shared/helper-functions/response.helpers';

interface EligibilityResult {
  student_id: string;
  student_name: string;
  flags: string[];
}

@Injectable()
export class EligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async checkEligibility(schoolId: string, feeId: string) {
    try {
      const fee = await this.prisma.fee.findFirst({
        where: { id: feeId, school_id: schoolId },
        include: {
          classAssignments: { select: { class_id: true } },
        },
      });

      if (!fee) {
        throw new NotFoundException('Fee not found');
      }

      const classIds = fee.classAssignments.map((ca) => ca.class_id);

      if (classIds.length === 0) {
        return ResponseHelper.success('No classes assigned to this fee', []);
      }

      const students = await this.prisma.student.findMany({
        where: {
          school_id: schoolId,
          current_class_id: { in: classIds },
          status: 'active',
        },
        include: {
          user: { select: { id: true, first_name: true, last_name: true } },
          parent: {
            include: {
              user: { select: { id: true, role: true, school_id: true } },
            },
          },
        },
      });

      const currentSession = await this.prisma.academicSession.findFirst({
        where: { school_id: schoolId, is_current: true },
        select: { id: true },
      });

      const results: EligibilityResult[] = [];

      for (const student of students) {
        const flags: string[] = [];

        if (student.parent?.user) {
          const parentRole = student.parent.user.role;
          const parentSchoolId = student.parent.user.school_id;
          if (
            parentSchoolId === schoolId &&
            (parentRole === 'teacher' || parentRole === 'school_admin')
          ) {
            flags.push('staff_child');
          }
        }

        if (student.parent_id && currentSession) {
          const siblingCount = await this.prisma.student.count({
            where: {
              parent_id: student.parent_id,
              school_id: schoolId,
              academic_session_id: currentSession.id,
              status: 'active',
              id: { not: student.id },
            },
          });

          if (siblingCount > 0) {
            flags.push('sibling_discount');
          }
        }

        results.push({
          student_id: student.user.id,
          student_name: `${student.user.first_name} ${student.user.last_name}`,
          flags,
        });
      }

      return ResponseHelper.success('Eligibility check completed', results);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      return ResponseHelper.error('Failed to check eligibility', error?.message);
    }
  }
}
