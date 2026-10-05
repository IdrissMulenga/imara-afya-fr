// Sleep schedule (bedtime and wake-up): which one applies to a night, and clock-time helpers.
// Used for bedtime and good-morning reminders, not to fill in sleep.

import type { SleepInterval } from '@/modules/sleep';

export type SleepSchedule = { bedtime: string; wakeTime: string };

/** The weekday schedule, and an optional one for nights ending on Saturday and Sunday. */
export type SleepSchedules = { weekday: SleepSchedule; weekend: SleepSchedule | null };

/** True for Saturday and Sunday (YYYY-MM-DD, local calendar). */
export const isWeekend = (day: string): boolean => {
  const [y, m, d] = day.split('-').map(Number);
  const weekday = new Date(y, m - 1, d).getDay();
  return weekday === 0 || weekday === 6;
};

/** The schedule for the night that ends on `wakeDay`. */
export const scheduleFor = (wakeDay: string, schedules: SleepSchedules): SleepSchedule =>
  isWeekend(wakeDay) && schedules.weekend ? schedules.weekend : schedules.weekday;

const dayText = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** The next night's schedule: the one in progress, or else the one ending tomorrow. */
export function upcomingNight(schedules: SleepSchedules, now = new Date()): SleepSchedule {
  const today = dayText(now);
  const current = scheduleFor(today, schedules);
  if (now.getTime() < nightWindow(today, current).end) return current;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return scheduleFor(dayText(tomorrow), schedules);
}

/** Schedules from the profile fields, or null when no schedule is set. */
export const schedulesFrom = (user: {
  sleepBedtime: string | null;
  sleepWakeTime: string | null;
  sleepWeekendBedtime: string | null;
  sleepWeekendWakeTime: string | null;
}): SleepSchedules | null =>
  user.sleepBedtime && user.sleepWakeTime
    ? {
        weekday: { bedtime: user.sleepBedtime, wakeTime: user.sleepWakeTime },
        weekend:
          user.sleepWeekendBedtime && user.sleepWeekendWakeTime
            ? { bedtime: user.sleepWeekendBedtime, wakeTime: user.sleepWeekendWakeTime }
            : null,
      }
    : null;

/** Minutes after midnight for "HH:MM". */
export const clockMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** "HH:MM" for minutes after midnight (wraps around the day). */
export const clockText = (minutes: number): string => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
};

/** Hours from bedtime to wake-up, across midnight when needed. */
export const scheduleHours = ({ bedtime, wakeTime }: SleepSchedule): number => {
  const span = (clockMinutes(wakeTime) - clockMinutes(bedtime) + 1440) % 1440;
  return (span || 1440) / 60;
};

/** Bedtime and wake-up as times for the night that ends on `wakeDay` (YYYY-MM-DD). */
export function nightWindow(wakeDay: string, schedule: SleepSchedule): SleepInterval {
  const [y, mo, d] = wakeDay.split('-').map(Number);
  const wake = clockMinutes(schedule.wakeTime);
  const bed = clockMinutes(schedule.bedtime);
  const end = new Date(y, mo - 1, d, Math.floor(wake / 60), wake % 60).getTime();
  // A bedtime later in the clock than wake-up was the evening before.
  const bedDay = bed > wake ? d - 1 : d;
  const start = new Date(y, mo - 1, bedDay, Math.floor(bed / 60), bed % 60).getTime();
  return { start, end };
}
