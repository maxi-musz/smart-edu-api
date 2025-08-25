import { DayOfWeek } from '@prisma/client';

export class DateHelpers {
  /**
   * Get current DayOfWeek enum string
   */
  static getCurrentDayOfWeek(): DayOfWeek {
    const dayIndex = new Date().getDay();
    const days: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
    return days[dayIndex];
  }

  /**
   * Get next day
   */
  static getNextDay(currentDay: DayOfWeek): DayOfWeek {
    const days: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
    const currentIndex = days.indexOf(currentDay);
    const nextIndex = (currentIndex + 1) % 7;
    return days[nextIndex];
  }

  /**
   * Get day after next
   */
  static getDayAfterNext(currentDay: DayOfWeek): DayOfWeek {
    const days: DayOfWeek[] = [DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY];
    const currentIndex = days.indexOf(currentDay);
    const dayAfterNextIndex = (currentIndex + 2) % 7;
    return days[dayAfterNextIndex];
  }

  /**
   * Get current time in HH:MM format
   */
  static getCurrentTimeHHMM(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
