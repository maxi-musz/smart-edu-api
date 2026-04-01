import { DayOfWeek } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const WEEK_DAYS: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export function getDashboardCurrentDayOfWeek(): DayOfWeek {
  return WEEK_DAYS[new Date().getDay()];
}

export function getDashboardNextDay(currentDay: DayOfWeek): DayOfWeek {
  const i = WEEK_DAYS.indexOf(currentDay);
  return WEEK_DAYS[(i + 1) % 7];
}

export function getDashboardDayAfterNext(currentDay: DayOfWeek): DayOfWeek {
  const i = WEEK_DAYS.indexOf(currentDay);
  return WEEK_DAYS[(i + 2) % 7];
}

/** Class row from findUnique with subjects + teacherSubjects include (dashboard query). */
export function buildSubjectsEnrolledFromClass(studentClass: {
  subjects?: Array<{
    id: string;
    name: string;
    code: string;
    color: string | null;
    teacherSubjects: Array<{
      teacher: {
        id: string;
        first_name: string;
        last_name: string;
        display_picture: unknown;
      };
    }>;
  }>;
} | null): Array<{
  id: string;
  name: string;
  code: string;
  color: string | null;
  teacher: {
    id: string;
    name: string;
    display_picture: unknown;
  } | null;
}> {
  if (!studentClass?.subjects?.length) return [];
  return studentClass.subjects.map((subject) => {
    const teacherSubject = subject.teacherSubjects[0];
    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      color: subject.color,
      teacher: teacherSubject
        ? {
            id: teacherSubject.teacher.id,
            name: `${teacherSubject.teacher.first_name} ${teacherSubject.teacher.last_name}`,
            display_picture: teacherSubject.teacher.display_picture,
          }
        : null,
    };
  });
}

export function getClassSubjectIdsForDashboard(studentClass: {
  subjects?: Array<{ id: string }>;
} | null): string[] {
  return studentClass?.subjects?.map((s) => s.id) ?? [];
}

export type TimetableEntryWithRelations = {
  day_of_week: DayOfWeek;
  room: string | null;
  subject: {
    id: string;
    name: string;
    code: string;
    color: string | null;
  };
  teacher: { id: string; first_name: string; last_name: string };
  timeSlot: {
    startTime: string;
    endTime: string;
    label: string | null;
  };
};

export function formatDashboardDaySchedule(
  classSchedule: TimetableEntryWithRelations[],
  day: DayOfWeek,
): Array<{
  subject: {
    id: string;
    name: string;
    code: string;
    color: string | null;
  };
  teacher: { id: string; name: string };
  time: { from: string; to: string; label: string | null };
  room: string | null;
}> {
  return classSchedule
    .filter((entry) => entry.day_of_week === day)
    .map((entry) => ({
      subject: {
        id: entry.subject.id,
        name: entry.subject.name,
        code: entry.subject.code,
        color: entry.subject.color,
      },
      teacher: {
        id: entry.teacher.id,
        name: `${entry.teacher.first_name} ${entry.teacher.last_name}`,
      },
      time: {
        from: entry.timeSlot.startTime,
        to: entry.timeSlot.endTime,
        label: entry.timeSlot.label,
      },
      room: entry.room,
    }));
}

export interface StudentDashboardParallelParams {
  classSubjectIds: string[];
  schoolId: string;
  currentSessionId: string;
  userSub: string;
  currentClassId: string | null;
  currentDay: DayOfWeek;
  nextDay: DayOfWeek;
  dayAfterNext: DayOfWeek;
}

/**
 * Assessments, timetable (3 days), and notifications in one parallel round-trip.
 */
export async function fetchStudentDashboardParallel(
  prisma: PrismaService,
  p: StudentDashboardParallelParams,
): Promise<[any[], any[], any[]]> {
  const now = new Date();
  return Promise.all([
    p.classSubjectIds.length === 0
      ? Promise.resolve([])
      : prisma.assessment.findMany({
          where: {
            school_id: p.schoolId,
            academic_session_id: p.currentSessionId,
            subject_id: { in: p.classSubjectIds },
            status: 'PUBLISHED',
            is_published: true,
            AND: [
              {
                OR: [
                  { start_date: null },
                  { start_date: { lte: now } },
                ],
              },
              {
                OR: [{ end_date: null }, { end_date: { gte: now } }],
              },
            ],
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            _count: {
              select: {
                attempts: {
                  where: {
                    student_id: p.userSub,
                  },
                },
              },
            },
          },
        }),
    p.currentClassId
      ? prisma.timetableEntry.findMany({
          where: {
            class_id: p.currentClassId,
            day_of_week: {
              in: [p.currentDay, p.nextDay, p.dayAfterNext],
            },
            isActive: true,
            academic_session_id: p.currentSessionId,
          },
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
              },
            },
            teacher: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
            timeSlot: {
              select: {
                id: true,
                startTime: true,
                endTime: true,
                label: true,
                order: true,
              },
            },
          },
          orderBy: [{ day_of_week: 'asc' }, { timeSlot: { order: 'asc' } }],
        })
      : Promise.resolve([]),
    prisma.notification.findMany({
      where: {
        school_id: p.schoolId,
        academic_session_id: p.currentSessionId,
        OR: [{ type: 'all' }, { type: 'students' }],
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        comingUpOn: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),
  ]);
}
