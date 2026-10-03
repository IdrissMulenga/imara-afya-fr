// When the steps, good-morning and period reminders fire. Pure, so the rules can be checked
// without a phone.

/** Local hour of the steps nudge. */
export const STEPS_HOUR = 18;
/** Wake-up time used for the good-morning note when no sleep schedule is set. */
export const DEFAULT_WAKE = '07:00';
/** Local hour of the period reminders. */
export const PERIOD_HOUR = 9;
// Being up this early counts as the night, not the morning.
const MORNING_FROM_HOUR = 4;

/** YYYY-MM-DD for a local date. */
export const dayOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** YYYY-MM-DD for `date` in an IANA time zone, the way the server counts days; the phone's own
 *  day when the zone is missing or unknown. */
export const dayInZone = (date: Date, timeZone?: string | null): string => {
  if (!timeZone) return dayOf(date);
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const day = `${get('year')}-${get('month')}-${get('day')}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : dayOf(date);
  } catch {
    return dayOf(date);
  }
};

/** A local date at `hour`:`minute` on a YYYY-MM-DD day, moved by `offset` days. */
export const atDay = (day: string, hour: number, minute = 0, offset = 0): Date => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d + offset, hour, minute, 0, 0);
};

const minutesOf = (clock: string): [number, number] => {
  const [h, m] = clock.split(':').map(Number);
  return [h, m];
};

export type Slot = { date: Date; day: string; today: boolean };

/** The steps nudge at STEPS_HOUR on each of `days` days. Today's is left out once the goal is met;
 *  with unknown progress it stays. */
export function planSteps(now: Date, progress: { steps: number; goal: number } | null, days: number): Slot[] {
  const slots: Slot[] = [];
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    date.setHours(STEPS_HOUR, 0, 0, 0);
    if (date.getTime() <= now.getTime()) continue;
    if (d === 0 && progress && progress.steps >= progress.goal) continue;
    slots.push({ date, day: dayOf(date), today: d === 0 });
  }
  return slots;
}

/** The good-morning note at each day's wake-up time, `wakeFor` giving "HH:MM" for a day.
 *  `skipDay` is a day the app was already opened that morning. */
export function planMorning(now: Date, wakeFor: (day: string) => string, skipDay: string | null, days: number): Slot[] {
  const slots: Slot[] = [];
  for (let d = 0; d < days; d++) {
    const base = new Date(now);
    base.setDate(base.getDate() + d);
    const day = dayOf(base);
    if (day === skipDay) continue;
    const [hour, minute] = minutesOf(wakeFor(day));
    const date = atDay(day, hour, minute);
    if (date.getTime() <= now.getTime()) continue;
    slots.push({ date, day, today: d === 0 });
  }
  return slots;
}

/** True when the app opening at `now` means the user is already up before `wake` ("HH:MM"). */
export function upBeforeWake(now: Date, wake: string): boolean {
  const [hour, minute] = minutesOf(wake);
  const wakeAt = new Date(now);
  wakeAt.setHours(hour, minute, 0, 0);
  return now.getHours() >= MORNING_FROM_HOUR && now.getTime() < wakeAt.getTime();
}

export type PeriodState = {
  /** The open period's start, or null. */
  currentStart: string | null;
  /** True once the open period has passed its confirmed end. */
  autoEnded: boolean;
  averagePeriodLength: number;
  /** The next expected period start, or null when there is no estimate. */
  nextStart: string | null;
};

export type PeriodReminder = { kind: 'due' | 'end'; date: Date; day: string };

/** "Has it ended?" once an open period runs a day past the usual length (at the next PERIOD_HOUR
 *  from then on); otherwise "due today" on the next expected start. */
export function planPeriod(now: Date, state: PeriodState): PeriodReminder | null {
  if (state.currentStart && !state.autoEnded) {
    const askDay = dayOf(atDay(state.currentStart, PERIOD_HOUR, 0, state.averagePeriodLength));
    let date = atDay(askDay, PERIOD_HOUR);
    if (date.getTime() <= now.getTime()) {
      const today = atDay(dayOf(now), PERIOD_HOUR);
      date = today.getTime() > now.getTime() ? today : atDay(dayOf(now), PERIOD_HOUR, 0, 1);
    }
    return { kind: 'end', date, day: dayOf(date) };
  }
  if (state.nextStart) {
    const date = atDay(state.nextStart, PERIOD_HOUR);
    return date.getTime() > now.getTime() ? { kind: 'due', date, day: state.nextStart } : null;
  }
  return null;
}
