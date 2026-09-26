// Sleep schedule (bedtime and wake-up) and the night estimated from it when the phone
// detected nothing; on iOS refined with step history.
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
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

const MINUTE = 60_000;
const SLOT = 15 * MINUTE;
// Steps in one 15-minute slot that count as being up and about.
const ACTIVE_STEPS = 40;
// Still time that marks falling asleep.
const QUIET_TO_SLEEP = 4;
// How far around the schedule the real bedtime and wake-up are looked for.
const BED_BEFORE = 60 * MINUTE;
const BED_AFTER = 180 * MINUTE;
const WAKE_BEFORE = 120 * MINUTE;
const WAKE_AFTER = 120 * MINUTE;

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

// Steps in each 15-minute slot from `from` for `count` slots (iOS step history).
async function stepSlots(from: number, count: number): Promise<number[]> {
  const slots: number[] = [];
  for (let i = 0; i < count; i++) {
    const start = from + i * SLOT;
    if (start >= Date.now()) {
      slots.push(0);
      continue;
    }
    try {
      const { steps } = await Pedometer.getStepCountAsync(new Date(start), new Date(Math.min(start + SLOT, Date.now())));
      slots.push(steps);
    } catch {
      slots.push(0);
    }
  }
  return slots;
}

/** The night's sleep intervals from the schedule, refined by movement where available. */
export async function estimateNight(wakeDay: string, schedule: SleepSchedule): Promise<SleepInterval[]> {
  const window = nightWindow(wakeDay, schedule);
  if (Platform.OS !== 'ios' || !(await Pedometer.isAvailableAsync().catch(() => false))) return [window];

  const from = window.start - BED_BEFORE;
  const count = Math.ceil((window.end + WAKE_AFTER - from) / SLOT);
  const steps = await stepSlots(from, count);
  const slotStart = (i: number) => from + i * SLOT;
  const active = steps.map((n) => n >= ACTIVE_STEPS);
  if (!active.some(Boolean)) return [window];

  // Falls asleep at the start of the first still hour near bedtime.
  let sleepStart = window.start;
  for (let i = 0; slotStart(i) <= window.start + BED_AFTER; i++) {
    if (active.slice(i, i + QUIET_TO_SLEEP).length === QUIET_TO_SLEEP && !active.slice(i, i + QUIET_TO_SLEEP).some(Boolean)) {
      sleepStart = slotStart(i);
      break;
    }
  }

  // Wakes at the first walking near wake-up that carries on within the next hour.
  let wake = window.end;
  for (let i = 0; i < count; i++) {
    const t = slotStart(i);
    if (t < window.end - WAKE_BEFORE || t <= sleepStart) continue;
    if (active[i] && active.slice(i + 1, i + 5).some(Boolean)) {
      wake = t;
      break;
    }
  }
  if (wake <= sleepStart) return [window];

  // Short walks in between (e.g. to the bathroom) are awake time.
  const intervals: SleepInterval[] = [];
  let cursor = sleepStart;
  for (let i = 0; i < count; i++) {
    const t = slotStart(i);
    if (t <= sleepStart || t >= wake || !active[i]) continue;
    if (t > cursor) intervals.push({ start: cursor, end: t });
    cursor = t + SLOT;
  }
  if (wake > cursor) intervals.push({ start: cursor, end: wake });
  return intervals;
}
